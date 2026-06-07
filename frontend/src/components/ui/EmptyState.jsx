/**
 * Пустое состояние — иконка + заголовок + описание + опциональный action.
 *
 * @param {{
 *   icon?: React.ComponentType,
 *   title?: string,
 *   description?: string,
 *   children?: React.ReactNode,
 * }} props
 */
import styles from './EmptyState.module.css'

export default function EmptyState({ icon: Icon, title, description, children }) {
  return (
    <div className={styles.wrapper}>
      {Icon && <Icon className={styles.icon} />}
      {title && <h3 className={styles.title}>{title}</h3>}
      {description && <p className={styles.description}>{description}</p>}
      {children}
    </div>
  )
}
