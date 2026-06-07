/** Страница входа — использует общий компонент AuthForm. */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthForm from '../components/ui/AuthForm'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (username, password) => {
    await login(username, password)
    navigate('/')
  }

  return (
    <AuthForm
      title="Вход"
      submitLabel="Войти"
      onSubmit={handleSubmit}
      footer={
        <p className={styles.link}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      }
    />
  )
}
