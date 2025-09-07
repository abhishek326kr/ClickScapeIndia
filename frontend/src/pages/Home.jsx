import { useEffect, useState } from 'react'
import PhotoCard from '../components/PhotoCard.jsx'
import ImageModal from '../components/ImageModal.jsx'
import api, { API_BASE } from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Home() {
  const [photos, setPhotos] = useState([])
  const [active, setActive] = useState(null)
  const toast = useToast()
  const [summary, setSummary] = useState({ participants: 0, votes_received: 0, my_uploads: 0 })

  useEffect(() => {
    api.get('/photos').then(res => setPhotos(res.data)).catch(() => setPhotos([]))
    api.get('/dashboard/summary').then(res => setSummary(res.data)).catch(() => {})
  }, [])

  const onVote = async (photo) => {
    try {
      await api.post(`/vote/${photo.id}/auth`)
      toast.push({ type: 'success', message: 'Vote recorded!' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to vote'
      toast.push({ type: 'error', message: msg })
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Participants" value={summary.participants} hint="Distinct users" />
        <StatCard label="Votes received" value={summary.votes_received} hint="Across your uploads" />
        <StatCard label="My uploads" value={summary.my_uploads} hint="Total images uploaded" />
      </div>
      <h2 className="text-xl font-semibold mb-3">Recently shared</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map(p => (
          <div key={p.id} onClick={() => setActive(p)} className="cursor-zoom-in">
            <PhotoCard photo={p} onVote={onVote} />
          </div>
        ))}
      </div>
      <ImageModal src={active?.url ? `${API_BASE}${active.url}` : null} title={active?.title} onClose={() => setActive(null)} />
    </section>
  )
}

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value ?? 0}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  )
}
