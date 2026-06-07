import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, X, LogIn } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import CityAutocomplete from '../components/ui/CityAutocomplete'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { suppliersApi } from '../api/suppliers'
import { categoriesApi } from '../api/categories'
import { subcategoriesApi } from '../api/subcategories'
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
  inn: '',
  min_order_amount: '',
  price_range: '',
  certificate_details: '',
  certificate_urls: [],
  delivery_conditions: '',
  notes: '',
  category_ids: [],
  subcategory_ids: [],
}

export default function SupplierFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { isAuthenticated } = useAuth()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    subcategoriesApi.list().then(setSubcategories).catch(() => {})
  }, [])

  useEffect(() => {
    if (isEdit) {
      suppliersApi.get(id)
        .then((s) => {
          setForm({
            ...EMPTY_FORM,
            ...s,
            category_ids: s.categories?.map((c) => c.id) || [],
            subcategory_ids: s.subcategories?.map((sc) => sc.id) || [],
            certificate_urls: s.certificate_urls || [],
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
      const payload = {
        ...form,
        certificate_urls: (form.certificate_urls || []).filter(Boolean),
        min_order_amount: form.min_order_amount
          ? Number(String(form.min_order_amount).replace(',', '.'))
          : null,
      }
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

  const toggleCategory = (catId) => {
    const numId = Number(catId)
    setForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(numId)
        ? prev.category_ids.filter((id) => id !== numId)
        : [...prev.category_ids, numId],
    }))
  }

  const toggleSubcategory = (scId) => {
    const numId = Number(scId)
    setForm((prev) => ({
      ...prev,
      subcategory_ids: prev.subcategory_ids.includes(numId)
        ? prev.subcategory_ids.filter((id) => id !== numId)
        : [...prev.subcategory_ids, numId],
    }))
  }

  const addCertUrl = () => {
    setForm((prev) => ({
      ...prev,
      certificate_urls: [...(prev.certificate_urls || []), ''],
    }))
  }

  const updateCertUrl = (idx, value) => {
    setForm((prev) => ({
      ...prev,
      certificate_urls: prev.certificate_urls.map((u, i) => (i === idx ? value : u)),
    }))
  }

  const removeCertUrl = (idx) => {
    setForm((prev) => ({
      ...prev,
      certificate_urls: prev.certificate_urls.filter((_, i) => i !== idx),
    }))
  }

  const visibleSubcategories = subcategories.filter((sc) =>
    form.category_ids.includes(sc.category_id)
  )

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <Link to={isEdit ? `/suppliers/${id}` : '/'} className={styles.back}>
          <ArrowLeft />
          {isEdit ? 'Назад к поставщику' : 'Назад к каталогу'}
        </Link>
        <div className={styles.authGuard}>
          <LogIn className={styles.authGuardIcon} />
          <h2 className={styles.authGuardTitle}>
            Войдите, чтобы {isEdit ? 'редактировать' : 'добавлять'} поставщика
          </h2>
          <p className={styles.authGuardText}>
            Для этого действия требуется авторизация
          </p>
          <Link to="/login">
            <Button variant="primary" icon={LogIn}>Войти</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Link to={isEdit ? `/suppliers/${id}` : '/'} className={styles.back}>
        <ArrowLeft />
        {isEdit ? 'Назад к поставщику' : 'Назад к каталогу'}
      </Link>

      <h1 className={styles.title}>
        {isEdit ? 'Редактирование поставщика' : 'Новый поставщик'}
      </h1>

      <form onSubmit={handleSubmit} className={styles.form}>
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
              <CityAutocomplete
                label="Город *"
                value={form.city}
                onChange={(v) => handleChange('city', v)}
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
              <Input
                label="ИНН"
                value={form.inn}
                onChange={(e) => handleChange('inn', e.target.value)}
                placeholder="10 или 12 цифр"
                maxLength={12}
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

        <Card>
          <Card.Header title="Категории товаров" />
          <Card.Content>
            <div className={styles.chipGroup}>
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

        <Card>
          <Card.Header title="Подкатегории товаров" />
          <Card.Content>
            {form.category_ids.length === 0 ? (
              <p className={styles.chipHint}>
                Сначала выберите категории
              </p>
            ) : visibleSubcategories.length === 0 ? (
              <p className={styles.chipHint}>
                Для выбранных категорий пока нет подкатегорий
              </p>
            ) : (
              <div className={styles.chipGroup}>
                {visibleSubcategories.map((sc) => (
                  <Button
                    key={sc.id}
                    type="button"
                    variant={form.subcategory_ids.includes(sc.id) ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => toggleSubcategory(sc.id)}
                  >
                    {sc.name}
                  </Button>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>

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
                label="Минимальный заказ (₽)"
                type="number"
                value={form.min_order_amount ?? ''}
                onChange={(e) => handleChange('min_order_amount', e.target.value)}
                placeholder="10000"
              />
              <Textarea
                label="Условия доставки"
                value={form.delivery_conditions}
                onChange={(e) => handleChange('delivery_conditions', e.target.value)}
                placeholder="Бесплатная доставка от 50 000 ₽..."
                className={styles.fullWidth}
              />
              {(form.certificate_urls.length > 0 || form.certificate_details) ? (
                <>
                  <Input
                    label="Детали сертификатов"
                    value={form.certificate_details}
                    onChange={(e) => handleChange('certificate_details', e.target.value)}
                    placeholder="ISO 22000, ХАССП..."
                    className={styles.fullWidth}
                  />
                  <div className={`${styles.fullWidth} ${styles.certSection}`}>
                    <span className={styles.certSectionLabel}>
                      Ссылки на сертификаты / декларации
                    </span>
                    {(form.certificate_urls || []).map((url, idx) => (
                      <div key={idx} className={styles.certUrlRow}>
                        <Input
                          value={url}
                          onChange={(e) => updateCertUrl(idx, e.target.value)}
                          placeholder="https://example.com/certificate.pdf"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeCertUrl(idx)}
                          title="Удалить ссылку"
                        >
                          <X />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      icon={Plus}
                      onClick={addCertUrl}
                      className={styles.alignSelfStart}
                    >
                      Добавить ссылку
                    </Button>
                  </div>
                </>
              ) : (
                <div className={styles.fullWidth}>
                  <Button
                    type="button"
                    variant="outline"
                    size="small"
                    icon={Plus}
                    onClick={addCertUrl}
                  >
                    Добавить сертификат
                  </Button>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>

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
