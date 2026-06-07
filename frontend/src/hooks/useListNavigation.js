/**
 * Хук навигации по списку с помощью клавиатуры (ArrowUp/Down/Home/End).
 *
 * Управляет индексом выделенного элемента с циклическим переходом
 * (ArrowDown после последнего → первый, ArrowUp перед первым → последний).
 *
 * @param {number} itemCount — количество элементов в списке.
 * @param {boolean} isEnabled — активна ли навигация (false = сброс в -1).
 * @returns {{
 *   highlightedIndex: number,
 *   setHighlightedIndex: (n: number) => void,
 *   handleKeyDown: (e: KeyboardEvent) => void,
 * }}
 *
 * @example
 * const { highlightedIndex, setHighlightedIndex, handleKeyDown } = useListNavigation(items.length, isOpen)
 */
import { useState, useCallback } from 'react'

export function useListNavigation(itemCount, isEnabled = true) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const handleKeyDown = useCallback((e) => {
    if (!isEnabled || itemCount === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < itemCount - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : itemCount - 1
        )
        break
      case 'Home':
        if (itemCount > 0) {
          e.preventDefault()
          setHighlightedIndex(0)
        }
        break
      case 'End':
        if (itemCount > 0) {
          e.preventDefault()
          setHighlightedIndex(itemCount - 1)
        }
        break
      default:
        break
    }
  }, [isEnabled, itemCount])

  return { highlightedIndex, setHighlightedIndex, handleKeyDown }
}
