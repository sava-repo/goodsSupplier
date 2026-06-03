import { api } from './client'

export const categoriesApi = {
  /** Список всех категорий */
  list: () => api.get('/categories'),

  /** Создать категорию */
  create: (data) => api.post('/categories', data),

  /** Обновить категорию */
  update: (id, data) => api.put(`/categories/${id}`, data),

  /** Удалить категорию */
  delete: (id) => api.del(`/categories/${id}`),
}