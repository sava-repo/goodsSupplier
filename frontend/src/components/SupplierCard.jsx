import { Link } from 'react-router-dom'
import { MapPin, GitCompare, Check } from 'lucide-react'
import Badge from './ui/Badge'
import Button from './ui/Button'
import { useCompare } from '../context/CompareContext'
import { useToast } from './ui/Toast'
import styles from './SupplierCard.module.css'

export default function SupplierCard({ supplier }) {
  const { isInCompare, addId, ids } = useCompare()
  const toast = useToast()
  const inCompare = isInCompare(supplier.id)

  const handleCompare = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (inCompare) return
    const ok = addId(supplier.id)
    if (ok) {
      toast('Добавлен к сравнению', 'success')
    } else {
      toast('Максимум 5 поставщиков для сравнения', 'warning')
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <Link to={`/suppliers/${supplier.id}`} className={styles.name}>
          {supplier.name}
        </Link>
        {supplier.city && (
          <span className={styles.city}>
            <MapPin style={{ width: 14, height: 14, marginRight: 2, verticalAlign: -2 }} />
            {supplier.city}
          </span>
        )}
      </div>

      {supplier.categories?.length > 0 && (
        <div className={styles.categories}>
          {supplier.categories.map((cat) => (
            <Badge key={cat.id} variant="neutral">{cat.name}</Badge>
          ))}
        </div>
      )}

      {supplier.description && (
        <p className={styles.description}>{supplier.description}</p>
      )}

      <div className={styles.bottom}>
        {supplier.price_range && (
          <span className={styles.price}>{supplier.price_range}</span>
        )}
        <div className={styles.actions}>
          <Button
            variant={inCompare ? 'secondary' : 'outline'}
            size="small"
            icon={inCompare ? Check : GitCompare}
            onClick={handleCompare}
            disabled={inCompare}
          >
            {inCompare ? 'В списке' : 'Сравнить'}
          </Button>
          <Link to={`/suppliers/${supplier.id}`}>
            <Button variant="primary" size="small">Подробнее</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}