import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PhotoCard from '../components/PhotoCard.jsx'
import ImageModal from '../components/ImageModal.jsx'
import api, { API_BASE } from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Dashboard() {
  const [photos, setPhotos] = useState([])
  const [myPhotos, setMyPhotos] = useState([])
  const [marketItems, setMarketItems] = useState([])
  const [active, setActive] = useState(null)
  const [summary, setSummary] = useState({ participants: 0, votes_received: 0, my_uploads: 0 })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('competition') // 'competition' | 'marketplace'
  const toast = useToast()

  useEffect(() => {
    const run = async () => {
      try {
        const [ph, sm, mine, mk] = await Promise.all([
          api.get('/photos'),
          api.get('/dashboard/summary').catch(() => ({ data: summary })),
          api.get('/photos/my').catch(() => ({ data: [] })),
          api.get('/marketplace/list').catch(() => ({ data: [] })),
        ])
        setPhotos(ph.data || [])
        setSummary(sm.data || summary)
        setMyPhotos(mine.data || [])
        setMarketItems(mk.data || [])
      } finally {
        setLoading(false)
      }
    }
    run()
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

  const togglePublish = async (p) => {
    try {
      const res = await api.post(`/marketplace/${p.for_sale ? 'unpublish' : 'publish'}/${p.id}`)
      setMyPhotos((list) => list.map(x => x.id === p.id ? res.data : x))
      if (!p.for_sale) {
        try { const mk = await api.get('/marketplace/list'); setMarketItems(mk.data || []) } catch {}
      } else {
        setMarketItems((items) => items.filter(x => x.id !== p.id))
      }
      toast.push({ type: 'success', message: p.for_sale ? 'Unpublished' : 'Published' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Action failed'
      toast.push({ type: 'error', message: msg })
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-900 bg-white/60 dark:bg-gray-900/40 backdrop-blur px-3 py-1 text-xs text-teal-700 dark:text-teal-300">
            <DashboardIcon />
            Creator Dashboard
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Overview</h1>
          <div className="text-sm text-gray-500">Track your stats, manage uploads, and grow.</div>
        </div>
        <div className="flex items-center gap-2">
          <a href="/competition" className="px-3 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold shadow inline-flex items-center gap-2">
            <UploadIcon />
            Register & Upload
          </a>
          <a href="/gallery" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 text-sm hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center gap-2">
            <GalleryIcon />
            Browse Gallery
          </a>
          <DarkModeToggle />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center gap-2 border-b dark:border-gray-800">
        <button onClick={() => setTab('competition')} className={`px-3 py-2 text-sm border-b-2 ${tab === 'competition' ? 'border-teal-500 text-teal-600 dark:text-teal-300' : 'border-transparent text-gray-600 dark:text-gray-400'}`}>Competition</button>
        <button onClick={() => setTab('marketplace')} className={`px-3 py-2 text-sm border-b-2 ${tab === 'marketplace' ? 'border-teal-500 text-teal-600 dark:text-teal-300' : 'border-transparent text-gray-600 dark:text-gray-400'}`}>Marketplace</button>
      </div>
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={<UsersIcon />} label="Participants" value={summary.participants} hint="Distinct users" />
          <StatCard icon={<HeartIcon />} label="Votes received" value={summary.votes_received} hint="Across your uploads" />
          <StatCard icon={<CameraIcon />} label="My uploads" value={summary.my_uploads} hint="Total images uploaded" />
        </div>
      )}

      {tab === 'competition' && (
        <>
          <h2 className="text-xl font-semibold mb-3">Recently shared</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50 animate-pulse">
                  <div className="aspect-video rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="mt-2 h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map(p => (
                  <div key={p.id} onClick={() => setActive(p)} className="cursor-zoom-in rounded-xl transition-transform hover:-translate-y-0.5">
                    <PhotoCard photo={p} onVote={onVote} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-10 text-center bg-white/60 dark:bg-gray-900/40">
                <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 mb-3">
                  <CameraIcon />
                </div>
                <div className="font-semibold">No photos yet</div>
                <div className="text-sm text-gray-500">Share your first photo to get started.</div>
                <a href="/competition" className="mt-4 inline-block px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-sm font-semibold">Upload now</a>
              </div>
            )
          )}
        </>
      )}

      <ImageModal src={active?.url ? `${API_BASE}${active.url}` : null} title={active?.title} onClose={() => setActive(null)} />

      {/* Marketplace tab content */}
      {tab === 'marketplace' && (
        <div>
          <h2 className="text-xl font-semibold mb-3">Marketplace Items</h2>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50 animate-pulse">
                  <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="mt-2 h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : marketItems.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {marketItems.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50 block">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {p.processed_url || p.url ? (
                      <img src={`${API_BASE}${p.processed_url || p.url}`} alt={p.title} className="w-full h-full object-cover pointer-events-none select-none" loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="font-semibold text-sm truncate">{p.title}</div>
                    <div className="text-teal-600 dark:text-teal-300 text-sm">₹{p.price || 0}</div>
                  </div>
                  {p.owner_name && (
                    <div className="text-xs text-gray-500 truncate">by {p.owner_name}</div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-10 text-center bg-white/60 dark:bg-gray-900/40">
              <div className="font-semibold">No items yet</div>
              <div className="text-sm text-gray-500">Publish items from your uploads below.</div>
            </div>
          )}

          {/* My Marketplace (only for-sale) */}
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-3">My Marketplace</h2>
            {myPhotos.filter(p => p.for_sale).length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myPhotos.filter(p => p.for_sale).map(p => (
                  <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50">
                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {p.processed_url || p.url ? (
                        <img src={`${API_BASE}${p.processed_url || p.url}`} alt={p.title} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full" />}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      <div className="text-sm text-teal-600 dark:text-teal-300">₹{p.price || 0}</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded ${p.for_sale ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {p.for_sale ? 'For sale' : 'Not for sale'}
                      </span>
                      <button onClick={() => togglePublish(p)} className="px-2 py-1 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900">
                        {p.for_sale ? 'Unpublish' : 'Publish'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-10 text-center bg-white/60 dark:bg-gray-900/40">
                <div className="font-semibold">You have no items listed</div>
                <div className="text-sm text-gray-500">Use the upload form to list photos for sale.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/60 backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="text-teal-600 dark:text-teal-300">{icon}</div>
      </div>
      <div className="text-3xl font-extrabold mt-1">{value ?? 0}</div>
      {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
    </div>
  )
}

function SkeletonStat() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/50">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
      <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  )
}

function DashboardIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zm-8 0c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-.68.18-1.32.5-1.9-.86-.07-1.73-.1-2.5-.1zm8 0c-.6 0-1.26.04-1.93.1.61.82.93 1.8.93 2.9v2h10v-2c0-2.66-5.33-4-8-4z"/></svg>
  )
}

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2l1.5 2H15l2 2h3c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h3l2-2h0zM12 18a5 5 0 100-10 5 5 0 000 10z"/></svg>
  )
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.534-9.192-7.01C.333 11.515.333 8.152 2.808 5.677a4.8 4.8 0 016.788 0L12 8.08l2.404-2.403a4.8 4.8 0 016.788 6.788C18.716 16.466 12 21 12 21z"/></svg>
  )
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zM12 2l5 5h-3v6h-4V7H7l5-5z"/></svg>
  )
}

function GalleryIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5a2 2 0 00-2-2H5C3.89 3 3 3.9 3 5v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 11.5A2.5 2.5 0 1111 9a2.5 2.5 0 01-2.5 2.5zM5 19l4.5-6 3.5 4.5 2.5-3.5L19 19H5z"/></svg>
  )
}

function DarkModeToggle() {
  const toggle = () => {
    try {
      const root = document.documentElement
      const isDark = root.classList.toggle('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {}
  }
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="ml-1 p-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
      <MoonSunIcon />
    </button>
  )
}

function MoonSunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 13h3v-2h-3v2zm-2.76 7.83l1.79-1.91-1.67-1.67-1.79 1.79 1.67 1.79zM12 6a6 6 0 100 12 6 6 0 000-12zm7.24-1.16l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM13 1h-2v3h2V1z"/></svg>
  )
}
