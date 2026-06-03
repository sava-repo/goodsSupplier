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
        {isAuthenticated ? (
          <button className={styles.navLink} onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <LogOut style={{ width: 16, height: 16 }} />
            {user?.username}
          </button>
        ) : (
          <NavLink to="/login" className={({ isActive }) =>
            `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
          }>
            <LogIn style={{ width: 16, height: 16, marginRight: 4 }} />
            Войти
          </NavLink>
        )}
      </div>
    </header>
  )
}