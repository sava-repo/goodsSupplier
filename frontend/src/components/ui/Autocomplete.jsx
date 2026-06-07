/**
 * Универсальный компонент автодополнения с дебаунсом, навигацией
 * с клавиатуры и закрытием по клику вне.
 *
 * @param {string} value — текущий текст в поле.
 * @param {(text: string) => void} onChange — обработчик изменения текста.
 * @param {(item: any) => void} [onApply] — обработчик выбора подсказки
 *   или Enter без выделения.
 * @param {string} label — заголовок поля.
 * @param {string} placeholder — плейсхолдер.
 * @param {string} error — текст ошибки.
 * @param {(q: string) => Promise<{items: any[]}>} fetchFn — функция
 *   загрузки подсказок (например, `suppliersApi.cities`).
 * @param {(item: any) => string} [getItemLabel] — как извлечь текст
 *   подсказки для отображения (по умолчанию — сам item).
 * @param {(item: any) => string} [getItemKey] — ключ для React.
 * @param {(item: any) => any} [getApplyValue] — что передать в onChange
 *   при выборе подсказки (по умолчанию — getItemLabel(item)).
 * @param {(item: any) => any} [getApplyPayload] — что передать в onApply
 *   при выборе подсказки (по умолчанию — сам item).
 * @param {any} [fallbackApplyValue] — что передать в onChange при Enter
 *   без выделения (по умолчанию — текущий value).
 * @param {any} [fallbackApplyPayload] — что передать в onApply при Enter
 *   без выделения.
 * @param {number} [debounceMs=300] — задержка запроса.
 * @param {number} [minChars=3] — минимум символов для запроса.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { SearchInput } from './Input'
import { useClickOutside, useListNavigation } from '../../hooks'
import styles from './Autocomplete.module.css'

const DEBOUNCE_MS = 300
const MIN_CHARS = 3

export default function Autocomplete({
  value,
  onChange,
  onApply,
  label,
  placeholder,
  error,
  fetchFn,
  getItemLabel = (item) => item,
  getItemKey = (item) => getItemLabel(item),
  getApplyValue = (item) => getItemLabel(item),
  getApplyPayload = (item) => item,
  fallbackApplyValue,
  fallbackApplyPayload,
  debounceMs = DEBOUNCE_MS,
  minChars = MIN_CHARS,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)

  const { highlightedIndex, setHighlightedIndex, handleKeyDown: navKeyDown } =
    useListNavigation(suggestions.length, isOpen)

  useClickOutside(wrapperRef, () => setIsOpen(false))

  // Загрузка подсказок с дебаунсом
  useEffect(() => {
    let cancelled = false
    const v = (value || '').trim()

    if (v.length < minChars) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      if (cancelled) return
      try {
        const data = await fetchFn(v)
        if (cancelled) return
        setSuggestions(data.items || [])
        setIsOpen(true)
      } catch {
        if (!cancelled) {
          setSuggestions([])
          setIsOpen(false)
        }
      }
    }, debounceMs)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value, fetchFn, debounceMs, minChars])

  const selectSuggestion = useCallback((item) => {
    onChange(getApplyValue(item))
    setIsOpen(false)
    onApply?.(getApplyPayload(item))
  }, [onChange, onApply, getApplyValue, getApplyPayload])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    // Навигация (ArrowUp/Down/Home/End)
    navKeyDown(e)

    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        selectSuggestion(suggestions[highlightedIndex])
      } else {
        // Enter без выделения — применяем текущий value
        onChange(fallbackApplyValue !== undefined ? fallbackApplyValue : value)
        onApply?.(fallbackApplyPayload !== undefined ? fallbackApplyPayload : value)
        setIsOpen(false)
      }
    }
  }

  const showList = isOpen && suggestions.length > 0

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <SearchInput
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true)
        }}
        error={error}
        autoComplete="off"
      />
      {showList && (
        <ul className={styles.list} role="listbox">
          {suggestions.map((item, idx) => (
            <li
              key={getItemKey(item)}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={
                highlightedIndex === idx
                  ? `${styles.item} ${styles.highlighted}`
                  : styles.item
              }
              onMouseDown={(e) => {
                e.preventDefault()
                selectSuggestion(item)
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {getItemLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
