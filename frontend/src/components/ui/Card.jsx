/**
 * Карточка-контейнер с композитными подкомпонентами.
 *
 * @example
 * <Card>
 *   <Card.Header title="Заголовок" />
 *   <Card.Content>...</Card.Content>
 *   <Card.Footer>...</Card.Footer>
 * </Card>
 */
import styles from './Card.module.css'

export default function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

/** Заголовок карточки с необязательным title. */
Card.Header = function CardHeader({ title, children, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      {title && <span className={styles.headerTitle}>{title}</span>}
      {children}
    </div>
  )
}

/** Основной контент карточки. */
Card.Content = function CardContent({ children, className = '' }) {
  return <div className={`${styles.content} ${className}`}>{children}</div>
}

/** Нижняя панель карточки (например, для кнопок). */
Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>
}
