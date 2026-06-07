import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Globe, Phone, Mail, Pencil, Trash2, Shield } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { suppliersApi } from '../api/suppliers'
import styles from './SupplierDetailPage.module.css'

export default function SupplierDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAuthenticated } = useAuth()
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

  if (loading) return <p className={styles.loading}>Загрузка...</p>
  if (!supplier) return <EmptyState title="Поставщик не найден" />

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.back}>
        <ArrowLeft /> Назад к каталогу
      </Link>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{supplier.name}</h1>
          {(supplier.city || supplier.inn) && (
            <p className={styles.city}>
              {supplier.city && (
                <>
                  <MapPin className={styles.cityIcon} />
                  {[supplier.city, supplier.region].filter(Boolean).join(', ')}
                </>
              )}
              {supplier.inn && (
                <span className={styles.inn}>
                  ИНН: {supplier.inn}
                </span>
              )}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          {isAuthenticated && (
            <>
              <Link to={`/suppliers/${id}/edit`}>
                <Button variant="outline" icon={Pencil}>Редактировать</Button>
              </Link>
              <Button variant="danger" icon={Trash2} onClick={handleDelete}>Удалить</Button>
            </>
          )}
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

      {supplier.subcategories?.length > 0 && (
        <Card>
          <Card.Content>
            <div className={styles.section}>
              <span className={styles.sectionTitle}>Подкатегории</span>
              <div className={styles.badges}>
                {supplier.subcategories.map((sc) => (
                  <Badge key={sc.id} variant="neutral">{sc.name}</Badge>
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
              <p className={styles.description}>{supplier.description}</p>
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
                  <span className={styles.fieldLabel}><Phone /> Телефон</span>
                  <span className={styles.fieldValue}>{supplier.phone}</span>
                </div>
              )}
            </div>
            <div className={styles.row}>
              {supplier.email && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}><Mail /> Email</span>
                  <span className={styles.fieldValue}>{supplier.email}</span>
                </div>
              )}
              {supplier.website && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}><Globe /> Сайт</span>
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
                <span className={styles.fieldValue}>
                  {supplier.min_order_amount != null
                    ? `${Number(supplier.min_order_amount).toLocaleString('ru-RU')} ₽`
                    : '—'}
                </span>
              </div>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Доставка</span>
                <span className={styles.fieldValue}>{supplier.delivery_conditions || '—'}</span>
              </div>
            </div>
            <div className={styles.row}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>
                  <Shield /> Сертификаты
                </span>
                <span className={styles.fieldValue}>
                  {(supplier.certificate_urls?.length > 0) ? (
                    <>
                      {supplier.certificate_details && (
                        <div>{supplier.certificate_details}</div>
                      )}
                      <ul className={styles.certList}>
                        {supplier.certificate_urls.map((url, idx) => (
                          <li key={idx} className={styles.certItem}>
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.certLink}
                            >
                              Сертификат {idx + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    supplier.certificate_details || 'Нет'
                  )}
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
              <p className={styles.description}>{supplier.notes}</p>
            </div>
          </Card.Content>
        </Card>
      )}
    </div>
  )
}
