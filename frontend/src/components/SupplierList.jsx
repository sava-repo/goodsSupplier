import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, FileText } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import styles from './SupplierList.module.css'

export default function SupplierList({ suppliers, onNoteUpdate }) {
  const { isAuthenticated } = useAuth()
  const [localNotes, setLocalNotes] = useState({})
  const [saving, setSaving] = useState({})
  const timers = useRef({})

  const saveNote = useCallback(async (supplierId, text) => {
    setSaving((prev) => ({ ...prev, [supplierId]: true }))
    try {
      await api.put(`/suppliers/${supplierId}/note`, { note: text })
      onNoteUpdate?.(supplierId, text)
    } catch {
      // silent fail
    } finally {
      setSaving((prev) => ({ ...prev, [supplierId]: false }))
    }
  }, [onNoteUpdate])

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

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.nameCol}>Название</th>
            <th className={styles.cityCol}>Город</th>
            <th className={styles.catCol}>Категории</th>
            <th className={styles.minCol}>Мин. заказ</th>
            <th className={styles.certCol}>Сертификаты</th>
            <th className={styles.noteCol}>Заметка</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td className={styles.nameCol}>
                <Link to={`/suppliers/${s.id}`} className={styles.link}>
                  {s.name}
                </Link>
              </td>
              <td className={styles.cityCol}>{s.city || '—'}</td>
              <td className={styles.catCol}>
                <div className={styles.badges}>
                  {(s.categories || []).map((c) => (
                    <span key={c.id} className={styles.badge}>{c.name}</span>
                  ))}
                </div>
              </td>
              <td className={styles.minCol}>{s.min_order_amount || '—'}</td>
              <td className={styles.certCol}>
                {s.has_certificates ? (
                  <span className={styles.certYes} title={s.certificate_details || 'Есть сертификаты'}>
                    <Check size={16} />
                  </span>
                ) : (
                  <span className={styles.certNo} title="Нет сертификатов">
                    <X size={16} />
                  </span>
                )}
              </td>
              <td className={styles.noteCol}>
                {isAuthenticated ? (
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
                ) : (
                  <span className={styles.notePlaceholder}>
                    <FileText size={14} /> Войдите
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}