import { useEffect, useState } from 'react'
import UploadForm from '../components/UploadForm.jsx'
import api, { API_BASE } from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Competition() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [joining, setJoining] = useState(false)
  const [participation, setParticipation] = useState(null)
  const [addonSlots, setAddonSlots] = useState(0)
  const [batch, setBatch] = useState({ title: '', category: 'uncategorized', tags: '', price: '' })
  const [batchFiles, setBatchFiles] = useState([])
  const [batchMsg, setBatchMsg] = useState('')
  const [myPhotos, setMyPhotos] = useState([])
  const [submitPhotoId, setSubmitPhotoId] = useState('')
  const [submitMsg, setSubmitMsg] = useState('')
  const [leaderboard, setLeaderboard] = useState([])

  const fetchParticipation = async () => {
    try {
      const res = await api.get('/competitions/me')
      setParticipation(res.data || null)
      setUnauthorized(false)
    } catch (e) {
      setParticipation(null)
      if (e?.response?.status === 401) {
        setUnauthorized(true)
      } else {
        setUnauthorized(false)
        try { toast.push({ type: 'error', message: 'Unable to load participation. Please try again.' }) } catch {}
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipation()
    ;(async () => {
      try { const ph = await api.get('/photos/my'); setMyPhotos(ph.data || []) } catch { setMyPhotos([]) }
      try { const lb = await api.get('/leaderboard'); setLeaderboard(lb.data || []) } catch { setLeaderboard([]) }
    })()
  }, [])
  const join = async (plan) => {
    setJoining(true)
    try {
      const res = await api.post('/competitions/join', { plan, addon_slots: addonSlots })
      setParticipation(res.data)
      toast.push({ type: 'success', message: 'Joined competition successfully' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to join competition'
      toast.push({ type: 'error', message: msg })
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
      toast.push({ type: 'success', message: 'Batch uploaded successfully' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Batch upload failed'
      setBatchMsg(msg)
      toast.push({ type: 'error', message: msg })
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Competition Participation</h2>
      {loading ? (
        <div>Loading...</div>
      ) : unauthorized ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6">
          <div className="text-lg font-semibold mb-1">You are not signed in</div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">Please sign in to join the competition.</div>
          <a href="/auth?mode=login" className="inline-block px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white">Go to Login</a>
        </div>
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
            <button disabled={joining} onClick={() => join('enthusiast')} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded disabled:opacity-60">{joining ? 'Joining...' : 'Join as Enthusiast'}</button>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-xl font-bold mb-2">Passionate & Professional</h3>
            <p className="text-sm text-gray-500 mb-4">Join as: Creator+ (₹999)</p>
            <ul className="text-sm space-y-1 mb-4">
              <li>Benefits: Internship & Mentorship included</li>
              <li>Unlimited learning resources</li>
            </ul>
            <button disabled={joining} onClick={() => join('creator_plus')} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded font-semibold disabled:opacity-60">{joining ? 'Joining...' : 'Join Creator+'}</button>
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

          <div className="mt-10">
            <h4 className="text-lg font-bold mb-2">Submit to Competition</h4>
            <p className="text-sm text-gray-500 mb-3">Pick one of your uploaded photos to submit as an entry.</p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myPhotos.map(p => (
                <label key={p.id} className={`block rounded-xl border ${String(submitPhotoId)===String(p.id)?'border-teal-500':'border-gray-200 dark:border-gray-800'} overflow-hidden cursor-pointer`}>
                  <input type="radio" name="entry" className="hidden" value={p.id} onChange={() => setSubmitPhotoId(p.id)} />
                  <div className="aspect-square bg-gray-100 dark:bg-gray-800">
                    {p.processed_url || p.url ? (
                      <img src={`${API_BASE}${p.processed_url || p.url}`} alt={p.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="p-2 text-sm truncate">{p.title || `Photo #${p.id}`}</div>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button onClick={submitEntry} className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white">Submit Entry</button>
              {submitMsg && <div className="text-sm text-gray-600">{submitMsg}</div>}
            </div>
          </div>

          <div className="mt-10">
            <h4 className="text-lg font-bold mb-2">Leaderboard</h4>
            {leaderboard?.length ? (
              <div className="grid md:grid-cols-3 gap-4">
                {leaderboard.map((e, idx) => (
                  <div key={idx} className="rounded-xl border dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {e.photo?.processed_url || e.photo?.url ? (
                        <img src={`${API_BASE}${e.photo.processed_url || e.photo.url}`} alt={e.photo?.title || ''} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="truncate">{e.photo?.title || 'Untitled'}</div>
                      <div className="font-semibold">{e.votes} votes</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No leaderboard entries yet.</div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
