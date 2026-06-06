import { api } from './client'

export const subcategoriesApi = {
  /** Список подкатегорий (опционально — фильтр по category_id) */
  list: (categoryId = null) => {
    const path = categoryId
      ? `/subcategories?category_id=${categoryId}`
      : '/subcategories'
    return api.get(path)
  },

  /** Детали подкатегории */
  get: (id) => api.get(`/subcategories/${id}`),

  /** Создать подкатегорию */
  create: (data) => api.post('/subcategories', data),

  /** Обновить подкатегорию */
  update: (id, data) => api.put(`/subcategories/${id}`, data),

  /** Удалить подкатегорию */
  delete: (id) => api.del(`/subcategories/${id}`),
}
