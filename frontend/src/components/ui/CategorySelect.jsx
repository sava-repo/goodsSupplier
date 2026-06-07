/**
 * Кастомный выпадающий список для выбора категории.
 *
 * Поддерживает навигацию с клавиатуры (ArrowUp/Down/Enter/Escape)
 * и закрытие по клику вне.
 *
 * @param {{
 *   label?: string,
 *   value: string,
 *   onChange: (value: string) => void,
 *   options: {value: string, label: string}[],
 *   placeholder?: string,
 * }} props
 */
import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { useClickOutside } from '../../hooks'
import styles from './CategorySelect.module.css'

export default function CategorySelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Выберите...',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const triggerRef = useRef(null)
  const wrapperRef = useRef(null)

  const allOptions = [{ value: '', label: placeholder }, ...options]
  const selectedIndex = allOptions.findIndex((o) => String(o.value) === String(value))
  const selectedLabel = selectedIndex >= 1 ? allOptions[selectedIndex].label : ''

  useClickOutside(wrapperRef, () => setIsOpen(false))

  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [isOpen, selectedIndex])

  const selectOption = (opt) => {
    onChange?.(opt.value)
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handleTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  const handleListKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < allOptions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : allOptions.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0) {
        selectOption(allOptions[highlightedIndex])
      }
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      {label && <label className={styles.label}>{label}</label>}
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={isOpen ? undefined : handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={selectedLabel ? styles.triggerValue : styles.triggerPlaceholder}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </button>
      {isOpen && (
        <ul
          className={styles.list}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
        >
          {allOptions.map((opt, idx) => (
            <li
              key={`${opt.value}:${idx}`}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              className={
                highlightedIndex === idx
                  ? `${styles.item} ${styles.highlighted}`
                  : styles.item
              }
              onMouseDown={(e) => {
                e.preventDefault()
                selectOption(opt)
              }}
              onMouseEnter={() => setHighlightedIndex(idx)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
