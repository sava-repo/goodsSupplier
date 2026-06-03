import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Globe, Phone, Mail, Pencil, Trash2, Shield } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { suppliersApi } from '../api/suppliers'
import styles from './SupplierDetailPage.module.css'

export default function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    suppliersApi.get(id)
      .then(setSupplier)
      .catch(() => setSupplier(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Удалить поставщика?')) return
    try {
      await suppliersApi.delete(id)
      toast('Поставщик удалён', 'success')
      navigate('/')
    } catch (err) {
      toast(err.message, 'error')
    }
  }

  if (loading) return <p style={{ textAlign: 'center', padding: 48 }}>Загрузка...</p>
  if (!supplier) return <EmptyState title="Поставщик не найден" />

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.back}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Назад к каталогу
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{supplier.name}</h1>
          {supplier.city && (
            <p className={styles.city}>
              <MapPin style={{ width: 14, height: 14, marginRight: 4, verticalAlign: -2 }} />
              {[supplier.city, supplier.region].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <Link to={`/suppliers/${id}/edit`}>
            <Button variant="outline" icon={Pencil}>Редактировать</Button>
          </Link>
          <Button variant="danger" icon={Trash2} onClick={handleDelete}>Удалить</Button>
        </div>
      </div>

      {supplier.categories?.length > 0 && (
        <Card>
          <Card.Content>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Категории</span>
              <div className={styles.badges}>
                {supplier.categories.map((c) => (
                  <Badge key={c.id} variant="neutral">{c.name}</Badge>
                ))}
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {supplier.description && (
        <Card>
          <Card.Content>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Описание</span>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{supplier.description}</p>
            </div>
          </Card.Content>
        </Card>
      )}

      <Card>
        <Card.Content>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Контакты</span>
            <div className={styles.row}>
              {supplier.contact_person && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Контактное лицо</span>
                  <span className={styles.fieldValue}>{supplier.contact_person}</span>
                </div>
              )}
              {supplier.phone && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}><Phone style={{width:12,height:12,verticalAlign:-1}} /> Телефон</span>
                  <span className={styles.fieldValue}>{supplier.phone}</span>
                </div>
              )}
            </div>
            <div className={styles.row}>
              {supplier.email && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}><Mail style={{width:12,height:12,verticalAlign:-1}} /> Email</span>
                  <span className={styles.fieldValue}>{supplier.email}</span>
                </div>
              )}
              {supplier.website && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}><Globe style={{width:12,height:12,verticalAlign:-1}} /> Сайт</span>
                  <a href={supplier.website} target="_blank" rel="noreferrer" className={styles.fieldValue}>
                    {supplier.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      <Card>
        <Card.Content>
          <div className={styles.section}>
            <span className={styles.sectionTitle}>Условия</span>
            <div className={styles.row}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Ценовой диапазон</span>
                <span className={styles.fieldValue}>{supplier.price_range || '—'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Мин. заказ</span>
                <span className={styles.fieldValue}>{supplier.min_order_amount || '—'}</span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Доставка</span>
                <span className={styles.fieldValue}>{supplier.delivery_conditions || '—'}</span>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>
                  <Shield style={{width:12,height:12,verticalAlign:-1}} /> Сертификаты
                </span>
                <span className={styles.fieldValue}>
                  {supplier.has_certificates
                    ? supplier.certificate_details || 'Да'
                    : 'Нет'}
                </span>
              </div>
              {supplier.address && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Адрес</span>
                  <span className={styles.fieldValue}>{supplier.address}</span>
                </div>
              )}
            </div>
          </div>
        </Card.Content>
      </Card>

      {supplier.notes && (
        <Card>
          <Card.Content>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Заметки</span>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{supplier.notes}</p>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  )
}