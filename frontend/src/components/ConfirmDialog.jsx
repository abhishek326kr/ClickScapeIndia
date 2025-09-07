import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title = 'Confirm', message = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  const dialogRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (open && confirmBtnRef.current) {
      setTimeout(() => confirmBtnRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return
      if (e.key === 'Escape') onCancel && onCancel()
      if (e.key === 'Tab') {
        // very small focus trap: keep focus inside dialog
        const focusable = dialogRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!focusable || focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div ref={dialogRef} className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b dark:border-gray-800">
          <div id="confirm-title" className="text-lg font-semibold">{title}</div>
        </div>
        <div className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">{message}</div>
        <div className="px-5 py-4 flex justify-end gap-2 border-t dark:border-gray-800">
          <button onClick={onCancel} className="px-4 py-2 rounded border dark:border-gray-700">{cancelText}</button>
          <button ref={confirmBtnRef} onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  )
}
