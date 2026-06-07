/**
 * Контекст аутентификации.
 *
 * Предоставляет состояние текущего пользователя, методы для входа,
 * регистрации и выхода. Токен хранится в localStorage.
 *
 * @context
 * @property {object|null} user — данные пользователя или null.
 * @property {boolean} loading — идёт ли начальная загрузка (проверка токена).
 * @property {boolean} isAuthenticated — авторизован ли пользователь.
 * @property {(username: string, password: string) => Promise<object>} login —
 *   вход по логину и паролю.
 * @property {(username: string, password: string) => Promise<object>} register —
 *   регистрация нового пользователя.
 * @property {() => void} logout — выход (удаление токена).
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Восстановление сессии при монтировании
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const data = await authApi.login(username, password)
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const register = async (username, password) => {
    const data = await authApi.register(username, password)
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
