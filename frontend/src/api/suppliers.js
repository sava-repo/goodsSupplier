import { api } from './client'

export const suppliersApi = {
  /** Список поставщиков с пагинацией */
  list: (page = 1, perPage = 20) =>
    api.get(`/suppliers?page=${page}&per_page=${perPage}`),

  /** Детали поставщика */
  get: (id) => api.get(`/suppliers/${id}`),

  /** Создать поставщика */
  create: (data) => api.post('/suppliers', data),

  /** Обновить поставщика */
  update: (id, data) => api.put(`/suppliers/${id}`, data),

  /** Удалить поставщика (мягкое) */
  delete: (id) => api.del(`/suppliers/${id}`),

  /** Поиск с фильтрами */
  search: ({ q, category_id, city, region, page = 1, per_page = 20 } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category_id) params.set('category_id', category_id)
    if (city) params.set('city', city)
    if (region) params.set('region', region)
    params.set('page', page)
    params.set('per_page', per_page)
    return api.get(`/suppliers/search?${params.toString()}`)
  },

  /** Сравнение поставщиков */
  compare: (ids) => api.get(`/suppliers/compare?ids=${ids.join(',')}`),
}