/**
 * Поля ввода: Input, SearchInput, Select, Textarea.
 *
 * Каждый компонент поддерживает label, helper, error и className.
 */
import { Search } from 'lucide-react'
import styles from './Input.module.css'

/** Обычное текстовое поле с label и error. */
export function Input({
  label,
  helper,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        className={`${styles.input} ${error ? styles.error : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  )
}

/** Поле поиска с иконкой лупы слева. */
export function SearchInput({
  label,
  helper,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} />
        <input
          className={`${styles.input} ${styles.searchInput} ${error ? styles.error : ''} ${className}`}
          type="text"
          {...props}
        />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  )
}

/** Выпадающий список select. */
export function Select({
  label,
  helper,
  error,
  options = [],
  placeholder = 'Выберите...',
  className = '',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <select
        className={`${styles.select} ${error ? styles.error : ''} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  )
}

/** Многострочное текстовое поле. */
export function Textarea({
  label,
  helper,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea
        className={`${styles.textarea} ${error ? styles.error : ''} ${className}`}
        {...props}
      />
      {error && <span className={styles.errorText}>{error}</span>}
      {helper && !error && <span className={styles.helper}>{helper}</span>}
    </div>
  )
}
