/**
 * Хук для обработки клика вне указанного элемента.
 *
 * @param {React.RefObject} ref — реф оборачиваемого элемента.
 * @param {() => void} handler — вызывается при клике вне элемента.
 *
 * @example
 * const wrapperRef = useRef(null)
 * useClickOutside(wrapperRef, () => setIsOpen(false))
 */
import { useEffect } from 'react'

export function useClickOutside(ref, handler) {
  useEffect(() => {
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        handler()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ref, handler])
}
