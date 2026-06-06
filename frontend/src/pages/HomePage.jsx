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

  // Фильтры
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [appliedLocation, setAppliedLocation] = useState(null)

  // Загрузка категорий
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {})
  }, [])

  // Поиск с debounce
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const hasFilters = search || categoryId || appliedLocation
      if (hasFilters) {
        const params = {
          q: search,
          category_id: categoryId || undefined,
          page,
          per_page: 20,
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
        const data = await suppliersApi.list(page)
        setSuppliers(data.items)
        setTotal(data.total)
        setPages(data.pages)
      }
    } catch {
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, appliedLocation, page])

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
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
          Загрузка...
        </p>
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="Поставщики не найдены"
          description="Попробуйте изменить фильтры поиска или добавить нового поставщика"
        />
      ) : (
        <>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Найдено: {total}
          </p>
          <SupplierList suppliers={suppliers} />
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