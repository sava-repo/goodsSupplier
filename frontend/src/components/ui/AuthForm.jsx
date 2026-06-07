/**
 * Общая форма для страниц входа и регистрации.
 *
 * @param {{
 *   title: string,
 *   submitLabel: string,
 *   onSubmit: (username: string, password: string) => Promise<void>,
 *   footer: React.ReactNode,
 *   minLength?: number,
 * }} props
 */
import { useState } from 'react'
import styles from '../../pages/LoginPage.module.css'

export default function AuthForm({ title, submitLabel, onSubmit, footer, minLength = 1 }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>{title}</h1>
        {error && <p className={styles.error}>{error}</p>}
        <label className={styles.label}>
          Имя пользователя
          <input
            className={styles.input}
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            autoComplete="username"
          />
        </label>
        <label className={styles.label}>
          Пароль
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={minLength}
            autoComplete={minLength === 4 ? 'current-password' : 'new-password'}
          />
        </label>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? '...' : submitLabel}
        </button>
        {footer}
      </form>
    </div>
  )
}
