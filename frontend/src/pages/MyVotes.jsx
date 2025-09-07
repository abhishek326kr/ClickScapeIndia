import { useEffect, useState } from 'react'
import api, { API_BASE } from '../lib/api.js'

export default function MyVotes() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/votes/mine').then(res => setItems(res.data || [])).catch(() => setItems([])).finally(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">My Votes</h2>
      {loading ? (
        <div>Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-gray-500">You haven't voted on any photos yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.photo_id} className="rounded border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="aspect-video bg-gray-100 dark:bg-gray-800">
                {it.url ? <img src={`${API_BASE}${it.url}`} alt={it.title} className="w-full h-full object-cover" /> : null}
              </div>
              <div className="p-3">
                <div className="font-semibold">{it.title}</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    {it.owner_avatar_url ? (
                      <img src={`${API_BASE}${it.owner_avatar_url}`} alt={it.owner_name || 'Owner'} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="truncate">{it.owner_name || 'Unknown'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
