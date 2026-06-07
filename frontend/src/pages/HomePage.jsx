import { useState, useEffect, useCallback } from 'react'
import { PackageSearch } from 'lucide-react'
import SupplierList from '../components/SupplierList'
import FilterPanel from '../components/ui/FilterPanel'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'
import { suppliersApi } from '../api/suppliers'
import { categoriesApi } from '../api/categories'
import styles from './HomePage.module.css'

export default function HomePage() {
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Фильтры
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [appliedLocation, setAppliedLocation] = useState(null)

  // Сортировка
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  // Загрузка категорий
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {})
  }, [])

  // Поиск с debounce
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hasFilters = search || categoryId || appliedLocation
      if (hasFilters) {
        const params = {
          q: search,
          category_id: categoryId || undefined,
          page,
          per_page: 20,
          sort_by: sortBy,
          sort_order: sortOrder,
        }
        if (appliedLocation?.type === 'city') {
          params.city = appliedLocation.value
        } else if (appliedLocation?.type === 'region') {
          params.region = appliedLocation.value
        } else if (appliedLocation?.value) {
          params.location = appliedLocation.value
        }
        const data = await suppliersApi.search(params)
        setSuppliers(data.items)
        setTotal(data.total)
        setPages(data.pages)
      } else {
        const data = await suppliersApi.list(page, 20, sortBy, sortOrder)
        setSuppliers(data.items)
        setTotal(data.total)
        setPages(data.pages)
      }
    } catch (err) {
      setSuppliers([])
      setTotal(0)
      setPages(1)
      setError(err.kind === 'network'
        ? 'Не удалось подключиться к серверу. Проверьте, что бэкенд запущен.'
        : (err.message || 'Ошибка загрузки данных'))
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, appliedLocation, page, sortBy, sortOrder])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // При изменении фильтров — сброс на 1 страницу
  const handleSearch = (v) => { setSearch(v); setPage(1) }
  const handleCategory = (v) => { setCategoryId(v); setPage(1) }
  const handleLocationChange = (v) => { setLocation(v) }
  const handleLocationApply = (v) => { setAppliedLocation(v); setPage(1) }
  const handleReset = () => {
    setSearch('')
    setCategoryId('')
    setLocation('')
    setAppliedLocation(null)
    setPage(1)
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  return (
    <div className={styles.container}>
      <FilterPanel
        searchValue={search}
        onSearchChange={handleSearch}
        categoryId={categoryId}
        onCategoryChange={handleCategory}
        categories={categories}
        location={location}
        onLocationChange={handleLocationChange}
        onLocationApply={handleLocationApply}
        onReset={handleReset}
      />

      {loading ? (
        <p className={styles.statusText}>
          Загрузка...
        </p>
      ) : error ? (
        <div className={styles.errorBanner}>
          {error}
        </div>
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Поставщики не найдены"
          description="Попробуйте изменить фильтры поиска или добавить нового поставщика"
        />
      ) : (
        <>
          <p className={styles.resultCount}>
            Найдено: {total}
          </p>
          <SupplierList
            suppliers={suppliers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
          {pages > 1 && (
            <div className={styles.pagination}>
              <Button
                variant="outline"
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className={styles.pageInfo}>
                {page} / {pages}
              </span>
              <Button
                variant="outline"
                size="small"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}