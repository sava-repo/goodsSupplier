import styles from './Card.module.css'

export default function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

Card.Header = function CardHeader({ title, children, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      {title && <span className={styles.headerTitle}>{title}</span>}
      {children}
    </div>
  )
}

Card.Content = function CardContent({ children, className = '' }) {
  return <div className={`${styles.content} ${className}`}>{children}</div>
}

Card.Footer = function CardFooter({ children, className = '' }) {
  return <div className={`${styles.footer} ${className}`}>{children}</div>
}