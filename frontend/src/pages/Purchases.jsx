import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { API_BASE } from '../lib/api.js'

export default function Purchases() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await api.get('/payment/purchases')
        const list = res?.data?.data?.items || []
        setItems(list)
      } catch {
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Your Purchases</h2>
        <div className="text-sm text-gray-500">All photos you have unlocked</div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50 animate-pulse">
              <div className="aspect-square rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="mt-2 h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(p => (
            <div key={p.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-2 bg-white/70 dark:bg-gray-900/50">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {p.processed_url || p.url ? (
                  <img src={`${API_BASE}${p.processed_url || p.url}`} alt={p.title} className="w-full h-full object-cover pointer-events-none select-none" loading="lazy" draggable={false} onContextMenu={(e) => e.preventDefault()} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="font-semibold text-sm truncate">{p.title}</div>
                <Link to={`/product/${p.id}`} className="text-teal-600 text-sm hover:underline">View</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-10 text-center bg-white/60 dark:bg-gray-900/40">
          <div className="font-semibold">No purchases yet</div>
          <div className="text-sm text-gray-500">Browse the marketplace and unlock your first photo.</div>
          <Link to="/marketplace" className="mt-4 inline-block px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold">Go to Marketplace</Link>
        </div>
      )}
    </section>
  )
}
