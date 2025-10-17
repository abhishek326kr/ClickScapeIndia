import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [paymentId, setPaymentId] = useState(null)

  // load cart items (ids only displayed as count/total)
  const ids = useMemo(() => {
    try { const raw = localStorage.getItem('cart'); return raw ? JSON.parse(raw) : [] } catch { return [] }
  }, [])

  useEffect(() => {
    if (!ids.length) navigate('/dashboard/cart', { replace: true })
    const load = async () => {
      const fetched = []
      for (const id of ids) {
        try { const r = await api.get(`/marketplace/item/${id}`); fetched.push(r.data) } catch {}
      }
      setItems(fetched)
    }
    load()
  }, [ids, navigate])

  const total = useMemo(() => items.reduce((s, x) => s + (x.price || 0), 0), [items])

  const initiate = async () => {
    setLoading(true)
    try {
      const res = await api.post('/payment/initiate', ids)
      const pid = res?.data?.data?.payment_id
      setPaymentId(pid)
      // In real integration, redirect to res.data.data.gateway_url
      toast.push({ type: 'info', message: 'Payment session created. Completing payment...' })
      // Simulate success immediately
      const txn = 'SIM-' + Math.random().toString(36).slice(2, 8).toUpperCase()
      const ver = await api.post('/payment/verify', { payment_id: pid, txn_id: txn, status: 'success' })
      toast.push({ type: 'success', message: 'Payment successful! Items unlocked.' })
      // Clear cart
      try { localStorage.removeItem('cart') } catch {}
      navigate('/dashboard/purchases', { replace: true })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to initiate payment'
      toast.push({ type: 'error', message: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <div className="rounded-lg border dark:border-gray-800 p-4 bg-white/70 dark:bg-gray-900/50">
        <div className="text-sm text-gray-600 dark:text-gray-300">You are purchasing {ids.length} item(s).</div>
        <div className="mt-2 text-lg font-semibold">Total: ₹{total}</div>
        <div className="mt-4 flex gap-3">
          <button onClick={initiate} disabled={loading} className="px-4 py-2 rounded bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60">Pay Now</button>
          <button onClick={() => navigate('/dashboard/cart')} className="px-4 py-2 rounded border dark:border-gray-800">Back to Cart</button>
        </div>
        <div className="mt-3 text-xs text-gray-500">Payment gateway integration (Razorpay/Easebuzz) can replace this simulated flow. We will redirect to the gateway URL and handle callback on return.</div>
      </div>
    </section>
  )
}
