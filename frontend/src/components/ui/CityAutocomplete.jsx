import { useState, useEffect, useRef } from 'react'
import { SearchInput } from './Input'
import { suppliersApi } from '../../api/suppliers'
import styles from './CityAutocomplete.module.css'

const DEBOUNCE_MS = 300
const MIN_CHARS = 3

export default function CityAutocomplete({
  value,
  onChange,
  onApply,
  label,
  placeholder,
  error,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const wrapperRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const v = (value || '').trim()

    if (v.length < MIN_CHARS) {
      setSuggestions([])
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    const timer = setTimeout(async () => {
      if (cancelled) return
      try {
        const data = await suppliersApi.cities(v)
        if (cancelled) return
        setSuggestions(data.items || [])
        setIsOpen(true)
        setHighlightedIndex(-1)
      } catch {
        if (!cancelled) {
          setSuggestions([])
          setIsOpen(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectSuggestion = (city) => {
    onChange(city)
    setIsOpen(false)
    setHighlightedIndex(-1)
    if (onApply) onApply(city)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && onApply) {
        e.preventDefault()
        onApply(value)
        setIsOpen(false)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        selectSuggestion(suggestions[highlightedIndex])
      } else {
        if (onApply) onApply(value)
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
          {suggestions.map((city, idx) => (
            <li
              key={city}
              role="option"
              aria-selected={highlightedIndex === idx}
              className={
                highlightedIndex === idx
                  ? `${styles.item} ${styles.highlighted}`
                  : styles.item
              }
              onMouseDown={(e) => {
                e.preventDefault()
                selectSuggestion(city)
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
