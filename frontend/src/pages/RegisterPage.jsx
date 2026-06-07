/** Страница регистрации — использует общий компонент AuthForm. */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthForm from '../components/ui/AuthForm'
import styles from './LoginPage.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (username, password) => {
    await register(username, password)
    navigate('/')
  }

  return (
    <AuthForm
      title="Регистрация"
      submitLabel="Зарегистрироваться"
      minLength={4}
      onSubmit={handleSubmit}
      footer={
        <p className={styles.link}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      }
    />
  )
}
