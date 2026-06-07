/**
 * ErrorBoundary — перехват необработанных ошибов рендеринга
 * и отображение fallback-интерфейса.
 *
 * Использование: оборачивает всё приложение или отдельленные секции.
 */
import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary поймал ошибку:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.wrapper}>
          <h2 className={styles.title}>Что-то пошло не так</h2>
          <p className={styles.description}>
            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
          </p>
          <button
            className={styles.button}
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
