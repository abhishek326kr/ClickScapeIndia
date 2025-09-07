import { useEffect, useState } from 'react'
import UploadForm from '../components/UploadForm.jsx'
import api from '../lib/api.js'

export default function Competition() {
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [participation, setParticipation] = useState(null)
  const [addonSlots, setAddonSlots] = useState(0)

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
        </div>
      )}
    </section>
  )
}
