import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { suppliersApi } from '../api/suppliers'
import { categoriesApi } from '../api/categories'
import styles from './SupplierFormPage.module.css'

const EMPTY_FORM = {
  name: '',
  description: '',
  contact_person: '',
  phone: '',
  email: '',
  website: '',
  source_url: '',
  city: '',
  region: '',
  address: '',
  min_order_amount: '',
  price_range: '',
  has_certificates: false,
  certificate_details: '',
  delivery_conditions: '',
  notes: '',
  category_ids: [],
}

export default function SupplierFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Загрузка категорий
  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {})
  }, [])

  // Загрузка данных для редактирования
  useEffect(() => {
    if (isEdit) {
      suppliersApi.get(id)
        .then((s) => {
          setForm({
            ...EMPTY_FORM,
            ...s,
            category_ids: s.categories?.map((c) => c.id) || [],
          })
        })
        .catch(() => toast('Поставщик не найден', 'error'))
    }
  }, [id, isEdit])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Название обязательно'
    if (!form.city.trim()) e.city = 'Город обязателен'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const payload = { ...form }
      if (isEdit) {
        await suppliersApi.update(id, payload)
        toast('Поставщик обновлён', 'success')
      } else {
        await suppliersApi.create(payload)
        toast('Поставщик создан', 'success')
      }
      navigate('/')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const toggleCategory = (catId) => {
    const numId = Number(catId)
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(numId)
        ? prev.category_ids.filter((id) => id !== numId)
        : [...prev.category_ids, numId],
    }))
  }

  return (
    <div className={styles.container}>
      <Link to={isEdit ? `/suppliers/${id}` : '/'} className={styles.back}>
        <ArrowLeft style={{ width: 16, height: 16 }} />
        {isEdit ? 'Назад к поставщику' : 'Назад к каталогу'}
      </Link>

      <h1 className={styles.title}>
        {isEdit ? 'Редактирование поставщика' : 'Новый поставщик'}
      </h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Основная информация */}
        <Card>
          <Card.Header title="Основная информация" />
          <Card.Content>
            <div className={styles.grid}>
              <Input
                label="Название *"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                placeholder="ООО «Поставщик»"
              />
              <Input
                label="Город *"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={errors.city}
                placeholder="Москва"
              />
              <Input
                label="Регион"
                value={form.region}
                onChange={(e) => handleChange('region', e.target.value)}
                placeholder="Московская область"
                className={styles.fullWidth}
              />
              <Textarea
                label="Описание"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Описание поставщика..."
                className={styles.fullWidth}
              />
            </div>
          </Card.Content>
        </Card>

        {/* Категории */}
        <Card>
          <Card.Header title="Категории товаров" />
          <Card.Content>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={form.category_ids.includes(cat.id) ? 'primary' : 'outline'}
                  size="small"
                  onClick={() => toggleCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </Card.Content>
        </Card>

        {/* Контакты */}
        <Card>
          <Card.Header title="Контакты" />
          <Card.Content>
            <div className={styles.grid}>
              <Input
                label="Контактное лицо"
                value={form.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
                placeholder="Иванов Иван"
              />
              <Input
                label="Телефон"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+7 (999) 123-45-67"
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="mail@example.com"
              />
              <Input
                label="Сайт"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
              />
              <Input
                label="Адрес"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="ул. Примерная, д. 1"
                className={styles.fullWidth}
              />
            </div>
          </Card.Content>
        </Card>

        {/* Условия */}
        <Card>
          <Card.Header title="Условия работы" />
          <Card.Content>
            <div className={styles.grid}>
              <Input
                label="Ценовой диапазон"
                value={form.price_range}
                onChange={(e) => handleChange('price_range', e.target.value)}
                placeholder="Средний"
              />
              <Input
                label="Минимальный заказ"
                value={form.min_order_amount}
                onChange={(e) => handleChange('min_order_amount', e.target.value)}
                placeholder="от 10 000 ₽"
              />
              <Textarea
                label="Условия доставки"
                value={form.delivery_conditions}
                onChange={(e) => handleChange('delivery_conditions', e.target.value)}
                placeholder="Бесплатная доставка от 50 000 ₽..."
                className={styles.fullWidth}
              />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.has_certificates}
                    onChange={(e) => handleChange('has_certificates', e.target.checked)}
                  />
                  <span style={{ fontSize: 14 }}>Есть сертификаты</span>
                </label>
              </div>
              {form.has_certificates && (
                <Input
                  label="Детали сертификатов"
                  value={form.certificate_details}
                  onChange={(e) => handleChange('certificate_details', e.target.value)}
                  placeholder="ISO 22000, ХАССП..."
                  className={styles.fullWidth}
                />
              )}
            </div>
          </Card.Content>
        </Card>

        {/* Заметки */}
        <Card>
          <Card.Header title="Дополнительно" />
          <Card.Content>
            <div className={styles.grid}>
              <Input
                label="Источник (URL)"
                value={form.source_url}
                onChange={(e) => handleChange('source_url', e.target.value)}
                placeholder="https://..."
                className={styles.fullWidth}
              />
              <Textarea
                label="Заметки"
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Внутренние заметки..."
                className={styles.fullWidth}
              />
            </div>
          </Card.Content>
        </Card>

        <div className={styles.actions}>
          <Link to={isEdit ? `/suppliers/${id}` : '/'}>
            <Button variant="ghost" type="button">Отмена</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </form>
    </div>
  )
}