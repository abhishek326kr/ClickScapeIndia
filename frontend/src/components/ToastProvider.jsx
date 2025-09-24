import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2)
    const t = { id, type: toast.type || 'info', message: toast.message || '', timeout: toast.timeout ?? 2200 }
    setToasts((arr) => [...arr, t])
    if (t.timeout > 0) setTimeout(() => dismiss(id), t.timeout)
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id))
  }, [])

  const value = { push, dismiss }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setToasts([]) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Allow global toasts from anywhere (e.g., axios interceptors)
  useEffect(() => {
    const onToast = (e) => {
      const d = e?.detail || {}
      push({ type: d.type || 'error', message: d.message || '', timeout: d.timeout ?? 2500 })
    }
    window.addEventListener('toast', onToast)
    return () => window.removeEventListener('toast', onToast)
  }, [push])

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed z-[100] bottom-4 right-4 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`min-w-[240px] max-w-[360px] px-4 py-3 rounded-lg shadow-lg border text-sm backdrop-blur ${
            t.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-900 dark:bg-green-900/50 dark:border-green-800 dark:text-green-100'
            : t.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-900 dark:bg-red-900/50 dark:border-red-800 dark:text-red-100'
            : 'bg-gray-50/90 border-gray-200 text-gray-900 dark:bg-gray-900/60 dark:border-gray-800 dark:text-gray-100'
          }`}> 
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
