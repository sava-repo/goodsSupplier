/**
 * Страница 404 — показывается при переходе на несуществующий маршрут.
 */
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>Страница не найдена</h2>
      <p className={styles.description}>
        Возможно, страница была удалена или адрес введён неправильно.
      </p>
      <Link to="/">
        <Button variant="primary">На главную</Button>
      </Link>
    </div>
  )
}
