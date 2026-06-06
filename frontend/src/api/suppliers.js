import { api } from './client'

export const suppliersApi = {
  /** Список поставщиков с пагинацией */
  list: (page = 1, perPage = 20, sortBy, sortOrder) => {
    const params = new URLSearchParams({ page, per_page: perPage })
    if (sortBy) params.set('sort_by', sortBy)
    if (sortOrder) params.set('sort_order', sortOrder)
    return api.get(`/suppliers?${params.toString()}`)
  },

  /** Детали поставщика */
  get: (id) => api.get(`/suppliers/${id}`),

  /** Создать поставщика */
  create: (data) => api.post('/suppliers', data),

  /** Обновить поставщика */
  update: (id, data) => api.put(`/suppliers/${id}`, data),

  /** Удалить поставщика (мягкое) */
  delete: (id) => api.del(`/suppliers/${id}`),

  /** Поиск с фильтрами */
  search: ({
    q,
    category_id,
    city,
    region,
    location,
    page = 1,
    per_page = 20,
    sort_by,
    sort_order,
  } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category_id) params.set('category_id', category_id)
    if (city) params.set('city', city)
    if (region) params.set('region', region)
    if (location) params.set('location', location)
    if (sort_by) params.set('sort_by', sort_by)
    if (sort_order) params.set('sort_order', sort_order)
    params.set('page', page)
    params.set('per_page', per_page)
    return api.get(`/suppliers/search?${params.toString()}`)
  },

  /** Сравнение поставщиков */
  compare: (ids) => api.get(`/suppliers/compare?ids=${ids.join(',')}`),

  /** Список уникальных городов (для автодополнения) */
  cities: (q) =>
    api.get(`/suppliers/cities?q=${encodeURIComponent(q || '')}`),

  /** Список уникальных локаций: городов и регионов (для автодополнения) */
  locations: (q) =>
    api.get(`/suppliers/locations?q=${encodeURIComponent(q || '')}`),
}