import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GitCompare, Plus, LogIn, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import styles from './Header.module.css'

export default function Header({ compareCount = 0 }) {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link to="/" className={styles.logo}>
          Поставщики
        </Link>
        <nav className={styles.nav}>
          <NavLink
            to="/suppliers/new"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Plus />
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
          <GitCompare />
          Сравнить
          {compareCount > 0 && (
            <span className={styles.compareBadge}>{compareCount}</span>
          )}
        </NavLink>
        {isAuthenticated ? (
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut />
            {user?.username}
          </button>
        ) : (
          <NavLink to="/login" className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
          }>
            <LogIn />
            Войти
          </NavLink>
        )}
      </div>
    </header>
  )
}