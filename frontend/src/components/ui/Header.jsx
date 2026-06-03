import { Link, NavLink } from 'react-router-dom'
import { GitCompare, Plus } from 'lucide-react'
import styles from './Header.module.css'

export default function Header({ compareCount = 0 }) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          Поставщики
        </Link>
        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            Каталог
          </NavLink>
          <NavLink
            to="/suppliers/new"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Plus style={{ width: 14, height: 14, marginRight: 4 }} />
            Добавить
          </NavLink>
        </nav>
      </div>
      <div className={styles.right}>
        <NavLink
          to="/compare"
          className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
          }
        >
          <GitCompare style={{ width: 16, height: 16, marginRight: 4 }} />
          Сравнить
          {compareCount > 0 && (
            <span className={styles.compareBadge}>{compareCount}</span>
          )}
        </NavLink>
      </div>
    </header>
  )
}