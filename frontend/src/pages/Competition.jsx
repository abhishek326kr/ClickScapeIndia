import { useEffect, useState } from 'react'
import UploadForm from '../components/UploadForm.jsx'
import api from '../lib/api.js'

export default function Competition() {
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [participation, setParticipation] = useState(null)
  const [addonSlots, setAddonSlots] = useState(0)
  const [batch, setBatch] = useState({ title: '', category: 'uncategorized', tags: '', price: '' })
  const [batchFiles, setBatchFiles] = useState([])
  const [batchMsg, setBatchMsg] = useState('')

  const fetchParticipation = async () => {
    try {
      const res = await api.get('/competitions/me')
      setParticipation(res.data || null)
    } catch (_) {
      setParticipation(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipation()
  }, [])

  const join = async (plan) => {
    setJoining(true)
    try {
      const res = await api.post('/competitions/join', { plan, addon_slots: addonSlots })
      setParticipation(res.data)
    } catch (_) {
      // no-op for now; could show toast
    } finally {
      setJoining(false)
    }
  }

  const uploadBatch = async (e) => {
    e.preventDefault()
    setBatchMsg('')
    if (!batchFiles || batchFiles.length === 0) { setBatchMsg('Choose images to upload'); return }
    const form = new FormData()
    form.append('title', batch.title || '')
    form.append('category', batch.category || 'uncategorized')
    form.append('tags', batch.tags || '')
    form.append('price', batch.price === '' ? '0' : String(batch.price))
    batchFiles.forEach(f => form.append('images', f))
    try {
      await api.post('/photos/upload/batch', form, { headers: { 'Content-Type': 'multipart/form-data' }})
      setBatchMsg('Batch uploaded successfully')
      setBatch({ title: '', category: 'uncategorized', tags: '', price: '' })
      setBatchFiles([])
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Batch upload failed'
      setBatchMsg(msg)
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Competition Participation</h2>
      {loading ? (
        <div>Loading...</div>
      ) : !participation || !participation.entry_paid ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold mb-2">Enthusiast Photographer</h3>
            <p className="text-sm text-gray-500 mb-4">Focus: Fun • Discovery • Learning</p>
            <ul className="text-sm space-y-1 mb-4">
              <li>Entry Fee: <strong>₹99</strong></li>
              <li>Add-on slots: <strong>₹20–25</strong> each</li>
            </ul>
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm">Add-on slots</label>
              <input type="number" min={0} className="w-24 border px-2 py-1 rounded" value={addonSlots} onChange={e => setAddonSlots(parseInt(e.target.value || '0', 10))} />
            </div>
            <button disabled={joining} onClick={() => join('enthusiast')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded disabled:opacity-60">Join as Enthusiast</button>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold mb-2">Passionate & Professional</h3>
            <p className="text-sm text-gray-500 mb-4">Join as: Creator+ (₹999)</p>
            <ul className="text-sm space-y-1 mb-4">
              <li>Benefits: Internship & Mentorship included</li>
              <li>Unlimited learning resources</li>
            </ul>
            <button disabled={joining} onClick={() => join('creator_plus')} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-semibold disabled:opacity-60">Join Creator+</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6 p-4 rounded border border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <div className="font-medium">You joined as <span className="capitalize">{participation.plan.replace('_', ' ')}</span>.</div>
            <div className="text-sm text-gray-600">Addon slots: {participation.addon_slots}</div>
          </div>
          <h3 className="text-xl font-bold mb-3">Register & Upload</h3>
          <UploadForm />

          <div className="mt-10">
            <h4 className="text-lg font-bold mb-2">Upload Additional Photos (Batch)</h4>
            <p className="text-sm text-gray-500 mb-3">
              Limits are enforced based on your plan: Creator+ up to 25 per batch; Enthusiast up to your add-on slots.
            </p>
            <form onSubmit={uploadBatch} className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Title (optional)</label>
                  <input className="w-full border px-3 py-2 rounded-lg" value={batch.title} onChange={e => setBatch({ ...batch, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1">Category</label>
                  <input className="w-full border px-3 py-2 rounded-lg" value={batch.category} onChange={e => setBatch({ ...batch, category: e.target.value })} />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1">Tags</label>
                  <input className="w-full border px-3 py-2 rounded-lg" value={batch.tags} onChange={e => setBatch({ ...batch, tags: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1">Price</label>
                  <input type="number" className="w-full border px-3 py-2 rounded-lg" value={batch.price} onChange={e => setBatch({ ...batch, price: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1">Select Images</label>
                <input multiple accept="image/*" type="file" onChange={e => setBatchFiles(Array.from(e.target.files || []))} />
                {batchFiles.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">Selected: {batchFiles.length} files</div>
                )}
              </div>
              <button className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg">Upload Batch</button>
              {batchMsg && <div className="text-sm text-gray-600">{batchMsg}</div>}
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
