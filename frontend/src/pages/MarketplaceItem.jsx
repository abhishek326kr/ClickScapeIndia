import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api, { API_BASE } from '../lib/api.js'

export default function MarketplaceItem() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await api.get(`/marketplace/item/${id}`)
        setItem(res.data)
      } catch {
        setItem(null)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="aspect-video rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="mt-3 h-5 w-1/2 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </section>
    )
  }

  if (!item) {
    return (
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="text-sm text-gray-500">Item not found.</div>
        <Link to="/marketplace" className="mt-3 inline-block text-teal-600">Back to marketplace</Link>
      </section>
    )
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50">
          {item.processed_url || item.url ? (
            <img src={`${API_BASE}${item.processed_url || item.url}`} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="aspect-video" />
          )}
        </div>
        <div>
          <div className="text-2xl font-bold">{item.title}</div>
          <div className="mt-1 text-gray-500 text-sm">{item.category}</div>
          <div className="mt-3 text-3xl font-extrabold text-teal-600 dark:text-teal-300">₹{item.price || 0}</div>
          {item.owner_name && (
            <div className="mt-2 text-sm text-gray-500">by {item.owner_name}</div>
          )}
          <div className="mt-6">
            <button className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white">Buy (placeholder)</button>
          </div>
          <div className="mt-3">
            <Link to="/marketplace" className="text-sm text-gray-500 hover:underline">Back to marketplace</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
