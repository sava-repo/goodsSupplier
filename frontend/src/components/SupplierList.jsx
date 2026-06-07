import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, GitCompare, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCompare } from '../context/CompareContext'
import { useToast } from './ui/Toast'
import { api } from '../api/client'
import styles from './SupplierList.module.css'

export default function SupplierList({ suppliers, onNoteUpdate, sortBy, sortOrder, onSort }) {
  const { isAuthenticated } = useAuth()
  const { isInCompare, addId, removeId } = useCompare()
  const toast = useToast()
  const [localNotes, setLocalNotes] = useState({})
  const [saving, setSaving] = useState({})
  const timers = useRef({})

  const saveNote = useCallback(async (supplierId, text) => {
    setSaving((prev) => ({ ...prev, [supplierId]: true }))
    try {
      await api.put(`/suppliers/${supplierId}/note`, { note: text })
      onNoteUpdate?.(supplierId, text)
    } catch {
      toast('Не удалось сохранить заметку', 'error')
    } finally {
      setSaving((prev) => ({ ...prev, [supplierId]: false }))
    }
  }, [onNoteUpdate, toast])

  const handleNoteChange = useCallback((supplierId, text) => {
    setLocalNotes((prev) => ({ ...prev, [supplierId]: text }))

    // Debounce 500ms
    if (timers.current[supplierId]) {
      clearTimeout(timers.current[supplierId])
    }
    timers.current[supplierId] = setTimeout(() => {
      saveNote(supplierId, text)
    }, 500)
  }, [saveNote])

  const handleCompare = (e, supplierId) => {
    e.preventDefault()
    e.stopPropagation()
    if (isInCompare(supplierId)) {
      removeId(supplierId)
      toast('Убран из сравнения', 'info')
      return
    }
    const ok = addId(supplierId)
    if (ok) {
      toast('Добавлен к сравнению', 'success')
    } else {
      toast('Максимум 5 поставщиков для сравнения', 'warning')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
  }

  const SortHeader = ({ field, label, className }) => (
    <th className={className}>
      <button
        type="button"
        className={styles.sortBtn}
        onClick={() => onSort?.(field)}
      >
        {label}
        <span className={styles.sortIcon}><SortIcon field={field} /></span>
      </button>
    </th>
  )

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <SortHeader field="name" label="Название" className={styles.nameCol} />
            <SortHeader field="city" label="Город" className={styles.cityCol} />
            <SortHeader field="min_order_amount" label="Мин. заказ" className={styles.minCol} />
            <SortHeader field="certificates" label="Сертификаты" className={styles.certCol} />
            {isAuthenticated && <th className={styles.noteCol}>Заметка</th>}
            {isAuthenticated && <th className={styles.compareCol}>Сравнить</th>}
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => {
            const inCompare = isInCompare(s.id)
            return (
              <tr key={s.id}>
                <td className={styles.nameCol}>
                  <Link to={`/suppliers/${s.id}`} className={styles.link}>
                    {s.name}
                  </Link>
                </td>
                <td className={styles.cityCol}>{s.city || '—'}</td>
                <td className={styles.minCol}>
                  {s.min_order_amount != null
                    ? `${Number(s.min_order_amount).toLocaleString('ru-RU')} ₽`
                    : '—'}
                </td>
                <td className={styles.certCol}>
                  {(s.certificate_urls?.length > 0) ? (
                    <span className={styles.certYes} title={s.certificate_details || 'Есть сертификаты'}>
                      <Check size={16} />
                    </span>
                  ) : (
                    <span className={styles.certNo} title="Нет сертификатов">
                      <X size={16} />
                    </span>
                  )}
                </td>
                {isAuthenticated && (
                  <td className={styles.noteCol}>
                    <div className={styles.noteWrapper}>
                      <input
                        type="text"
                        className={styles.noteInput}
                        placeholder="Добавить заметку..."
                        value={localNotes[s.id] !== undefined ? localNotes[s.id] : (s.user_note || '')}
                        onChange={(e) => handleNoteChange(s.id, e.target.value)}
                      />
                      {saving[s.id] && <span className={styles.saving}>⏳</span>}
                    </div>
                  </td>
                )}
                {isAuthenticated && (
                  <td className={styles.compareCol}>
                    <button
                      type="button"
                      className={
                        inCompare
                          ? `${styles.compareBtn} ${styles.compareBtnActive}`
                          : styles.compareBtn
                      }
                      onClick={(e) => handleCompare(e, s.id)}
                      title={inCompare ? 'Убрать из сравнения' : 'Добавить к сравнению'}
                      aria-label={inCompare ? 'Убрать из сравнения' : 'Добавить к сравнению'}
                    >
                      {inCompare ? <Check size={16} /> : <GitCompare size={16} />}
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}