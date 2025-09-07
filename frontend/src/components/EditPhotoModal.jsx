import { useState, useEffect } from 'react'
import api from '../lib/api.js'

export default function EditPhotoModal({ photo, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', category: '', tags: '', price: '', watermark: false })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (photo) {
      setForm({
        title: photo.title || '',
        category: photo.category || '',
        tags: photo.tags || '',
        price: String(photo.price ?? ''),
        watermark: !!photo.watermark,
      })
    }
  }, [photo])

  if (!photo) return null

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        category: form.category,
        tags: form.tags,
        price: form.price === '' ? 0 : parseFloat(form.price),
        watermark: form.watermark,
      }
      await api.put(`/photos/${photo.id}`, payload)
      onSaved && onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-800">
          <div className="font-semibold">Edit Photo</div>
          <button onClick={onClose} className="px-3 py-1 rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <input className="w-full border px-3 py-2 rounded" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <input className="w-full border px-3 py-2 rounded" placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} />
          <input className="w-full border px-3 py-2 rounded" placeholder="Tags" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
          <input type="number" className="w-full border px-3 py-2 rounded" placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.watermark} onChange={e=>setForm({...form,watermark:e.target.checked})} />
            Watermark
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button disabled={saving} className="px-4 py-2 bg-teal-600 text-white rounded disabled:opacity-60">{saving? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
