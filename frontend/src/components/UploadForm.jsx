import { useState } from 'react'
import api from '../lib/api.js'
import { useToast } from './ToastProvider.jsx'

export default function UploadForm() {
  // Keep price as a string to avoid React NaN warnings when the field is cleared
  const [form, setForm] = useState({ title: '', category: '', tags: '', price: '', image: null })
  const [status, setStatus] = useState(null)
  const toast = useToast()
  const [dragOver, setDragOver] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.push({ type: 'error', message: 'Title is required' }); return }
    if (!form.category.trim()) { toast.push({ type: 'error', message: 'Category is required' }); return }
    if (!form.image) { toast.push({ type: 'error', message: 'Please choose an image' }); return }
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'image') {
        if (v) data.append('image', v)
      } else if (k === 'price') {
        const numeric = v === '' ? '0' : String(v)
        data.append('price', numeric)
      } else {
        data.append(k, v)
      }
    })
    try {
      const res = await api.post('/photos/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      setStatus(`Uploaded: ${res.data.title}`)
      toast.push({ type: 'success', message: `Uploaded: ${res.data.title}` })
      setForm({ title: '', category: '', tags: '', price: '', image: null })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Upload failed'
      setStatus(msg)
      toast.push({ type: 'error', message: msg })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="field">
        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder=" " />
        <label>Title</label>
      </div>
      <div className="field">
        <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder=" " />
        <label>Category</label>
      </div>
      <div className="field">
        <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder=" " />
        <label>Tags (comma-separated)</label>
      </div>
      <div className="field">
        <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder=" " />
        <label>Price</label>
      </div>

      <div
        className={`glass-card glow-border p-4 transition-colors ${dragOver ? 'border-teal-400 bg-white/20' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) setForm({ ...form, image: f }) }}
      >
        <div className="text-sm text-gray-400">Drag & drop image here, or</div>
        <div className="mt-2"><input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files?.[0] || null })} /></div>
        {form.image && <div className="mt-2 text-xs text-gray-500">Selected: {form.image.name}</div>}
      </div>

      <button className="ripple px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">Upload</button>
      {status && <div className="text-sm text-gray-500">{status}</div>}
    </form>
  )
}
