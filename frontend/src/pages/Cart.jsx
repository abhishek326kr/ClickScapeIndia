import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api, { API_BASE } from '../lib/api.js'

export default function Cart() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const addId = useMemo(() => {
    try { return new URLSearchParams(search).get('add') || '' } catch { return '' }
  }, [search])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load from localStorage and optionally add a new item
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      let cart = []
      if (raw) cart = JSON.parse(raw)
      if (addId) {
        if (!cart.includes(addId)) cart.push(addId)
      }
      localStorage.setItem('cart', JSON.stringify(cart))
    } catch {}
  }, [addId])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const raw = localStorage.getItem('cart')
        const ids = raw ? JSON.parse(raw) : []
        const fetched = []
        for (const id of ids) {
          try {
            const res = await api.get(`/marketplace/item/${id}`)
            fetched.push(res.data)
          } catch {}
        }
        setItems(fetched)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [addId])

  const removeItem = (id) => {
    try {
      const raw = localStorage.getItem('cart')
      let cart = raw ? JSON.parse(raw) : []
      cart = cart.filter((x) => String(x) !== String(id))
      localStorage.setItem('cart', JSON.stringify(cart))
      setItems((arr) => arr.filter((x) => String(x.id) !== String(id)))
    } catch {}
  }

  const proceed = () => {
    navigate('/dashboard/checkout', { replace: true })
  }

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">Your cart is empty.</div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between border dark:border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {it.processed_url || it.url ? (
                    <img src={API_BASE + (it.processed_url || it.url)} alt={it.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-teal-700 dark:text-teal-300">₹{it.price || 0}</div>
                </div>
              </div>
              <button onClick={() => removeItem(it.id)} className="px-3 py-1.5 rounded border dark:border-gray-800">Remove</button>
            </div>
          ))}
          <div className="pt-3 flex items-center justify-between">
            <div className="text-lg font-semibold">Total: ₹{items.reduce((s, x) => s + (x.price || 0), 0)}</div>
            <button onClick={proceed} className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white">Proceed to Checkout</button>
          </div>
        </div>
      )}
    </section>
  )
}
