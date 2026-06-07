/**
 * Цветной значок-метка (pill).
 *
 * @param {{
 *   children: React.ReactNode,
 *   variant?: 'success' | 'warning' | 'danger' | 'neutral',
 *   className?: string,
 * }} props
 */
import styles from './Badge.module.css'

const VARIANT_MAP = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  neutral: styles.neutral,
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  const cls = [styles.badge, VARIANT_MAP[variant] || styles.neutral, className]
    .filter(Boolean).join(' ')
  return <span className={cls}>{children}</span>
}
