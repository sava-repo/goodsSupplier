import { createContext, useContext, useState, useEffect } from 'react'

const CompareContext = createContext(null)

const STORAGE_KEY = 'compare_ids'

function loadIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CompareProvider({ children }) {
  const [ids, setIds] = useState(loadIds)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  }, [ids])

  const addId = (id) => {
    if (ids.includes(id)) return
    if (ids.length >= 5) return false
    setIds((prev) => [...prev, id])
    return true
  }

  const removeId = (id) => {
    setIds((prev) => prev.filter((i) => i !== id))
  }

  const clearAll = () => setIds([])

  const isInCompare = (id) => ids.includes(id)

  return (
    <CompareContext.Provider value={{ ids, addId, removeId, clearAll, isInCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be within CompareProvider')
  return ctx
}