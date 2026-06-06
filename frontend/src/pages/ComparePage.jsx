import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, GitCompare } from 'lucide-react'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useCompare } from '../context/CompareContext'
import { suppliersApi } from '../api/suppliers'
import styles from './ComparePage.module.css'

const ROWS = [
  { key: 'city', label: 'Город' },
  { key: 'price_range', label: 'Ценовой диапазон' },
  { key: 'min_order_amount', label: 'Мин. заказ', render: (v) => v != null ? `${Number(v).toLocaleString('ru-RU')} ₽` : '—' },
  { key: 'delivery_conditions', label: 'Доставка' },
  { key: 'certificate_urls', label: 'Сертификаты', render: (v) => (v?.length > 0) ? '✅ Да' : '❌ Нет' },
  { key: 'contact_person', label: 'Контактное лицо' },
  { key: 'phone', label: 'Телефон' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Сайт' },
]

export default function ComparePage() {
  const { ids, removeId, clearAll } = useCompare()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (ids.length === 0) {
      setSuppliers([])
      return
    }
    setLoading(true)
    suppliersApi.compare(ids)
      .then(setSuppliers)
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }, [ids])

  if (ids.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Сравнение поставщиков</h1>
        <EmptyState
          icon={GitCompare}
          title="Нет поставщиков для сравнения"
          description="Добавьте поставщиков к сравнению из каталога (максимум 5)"
        >
          <Link to="/">
            <Button variant="primary">Перейти к каталогу</Button>
          </Link>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className={styles.title}>Сравнение ({suppliers.length})</h1>
        <Button variant="ghost" onClick={clearAll}>Очистить все</Button>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 48 }}>Загрузка...</p>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Параметр</th>
                {suppliers.map((s) => (
                  <th key={s.id}>
                    <div className={styles.supplierHeader}>
                      <Link to={`/suppliers/${s.id}`} className={styles.supplierName}>
                        {s.name}
                      </Link>
                      <button
                        className={styles.removeBtn}
                        onClick={() => removeId(s.id)}
                        title="Убрать из сравнения"
                      >
                        <X style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Категории */}
              <tr>
                <td>Категории</td>
                {suppliers.map((s) => (
                  <td key={s.id}>
                    {s.categories?.map((c) => c.name).join(', ') || '—'}
                  </td>
                ))}
              </tr>
              {ROWS.map((row) => (
                <tr key={row.key}>
                  <td>{row.label}</td>
                  {suppliers.map((s) => (
                    <td key={s.id}>
                      {row.render
                        ? row.render(s[row.key])
                        : (s[row.key] || '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.actions}>
        <Link to="/">
          <Button variant="outline">Добавить ещё</Button>
        </Link>
      </div>
    </div>
  )
}