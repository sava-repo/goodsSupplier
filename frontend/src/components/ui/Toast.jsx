import { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const VARIANT_MAP = {
  success: styles.success,
  warning: styles.warning,
  error: styles.error,
  info: styles.info,
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, variant = 'info', duration = 3000) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className={styles.container}>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant] || ICONS.info
          return (
            <div
              key={toast.id}
              className={`${styles.toast} ${VARIANT_MAP[toast.variant] || styles.info}`}
            >
              <Icon />
              {toast.message}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}