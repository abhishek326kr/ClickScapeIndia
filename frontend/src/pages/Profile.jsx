import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { API_BASE } from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Profile() {
  const [me, setMe] = useState(null)
  const [participation, setParticipation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [prof, setProf] = useState({ name: '', phone: '', location: '', address: '', facebook: '', instagram: '', portfolio: '', avatar_url: '' })
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [qSaving, setQSaving] = useState(false)
  const [questionnaire, setQuestionnaire] = useState({
    style_tools: '',
    motivation: '',
    vision: '',
    community: '',
    future: '',
  })
  const toast = useToast()

  useEffect(() => {
    const run = async () => {
      try {
        const [m, p] = await Promise.all([
          api.get('/auth/me'),
          api.get('/competitions/me').catch(() => ({ data: null })),
        ])
        setMe(m.data)
        setParticipation(p.data)
        // fetch or create profile
        const pr = await api.get('/users/me/profile')
        setProf({
          name: pr.data?.name || '',
          phone: pr.data?.phone || '',
          location: pr.data?.location || '',
          address: pr.data?.address || '',
          facebook: pr.data?.facebook || '',
          instagram: pr.data?.instagram || '',
          portfolio: pr.data?.portfolio || '',
          avatar_url: pr.data?.avatar_url || '',
        })
        // fetch or create questionnaire
        const q = await api.get('/users/me/questionnaire')
        setQuestionnaire({
          style_tools: q.data?.style_tools || '',
          motivation: q.data?.motivation || '',
          vision: q.data?.vision || '',
          community: q.data?.community || '',
          future: q.data?.future || '',
        })
      } catch (_) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const saveQuestionnaire = async (e) => {
    e.preventDefault()
    setQSaving(true)
    try {
      await api.put('/users/me/questionnaire', questionnaire)
      toast.push({ type: 'success', message: 'Questionnaire saved' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to save questionnaire'
      toast.push({ type: 'error', message: msg })
    } finally {
      setQSaving(false)
    }
  }

  // Google Places Autocomplete for Location/Address
  const locationInputRef = useRef(null)
  const placesInited = useRef(false)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return // silently skip if no key configured

    function initAutocomplete() {
      if (typeof window === 'undefined' || !window.google || !window.google.maps || placesInited.current) return
      try {
        const input = locationInputRef.current
        if (!input) return
        const autocomplete = new window.google.maps.places.Autocomplete(input, {
          types: ['(cities)'],
          fields: ['formatted_address', 'address_components', 'geometry', 'name']
        })
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()
          const loc = place?.name || place?.formatted_address || ''
          const addr = place?.formatted_address || ''
          setProf((p) => ({ ...p, location: loc, address: addr }))
        })
        placesInited.current = true
      } catch {}
    }

    // if script already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete()
      return
    }

    // load script once
    const existing = document.querySelector('script[data-gmaps="1"]')
    if (!existing) {
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`
      s.async = true
      s.defer = true
      s.dataset.gmaps = '1'
      s.onload = initAutocomplete
      document.head.appendChild(s)
    } else {
      existing.addEventListener('load', initAutocomplete, { once: true })
    }
  }, [])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSavedMsg('')
    try {
      await api.put('/users/me/profile', prof)
      setSavedMsg('Profile updated successfully')
      toast.push({ type: 'success', message: 'Profile updated' })
    } catch (e) {
      setSavedMsg(e?.response?.data?.detail || 'Failed to update profile')
      const msg = e?.response?.data?.detail || 'Failed to update profile'
      toast.push({ type: 'error', message: msg })
    } finally {
      setSaving(false)
      setTimeout(() => setSavedMsg(''), 2500)
    }
  }

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('avatar', file)
    try {
      const res = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' }})
      // cache-bust the avatar so it shows immediately
      const url = res.data?.avatar_url || ''
      const busted = url ? `${url}?v=${Date.now()}` : url
      setProf((p) => ({ ...p, avatar_url: busted || p.avatar_url }))
      setSavedMsg('Avatar updated')
      setTimeout(() => setSavedMsg(''), 2500)
      toast.push({ type: 'success', message: 'Avatar updated' })
    } catch (_) {}
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
        <p className="text-gray-500">Manage uploads, participation, and growth.</p>
      </div>

      {loading ? (
        <div className="animate-pulse grid md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500">Profile</div>
              <div className="text-xl font-bold">{me?.email || '—'}</div>
              <div className="text-xs mt-1">Role: {me?.role || 'participant'}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500">Participation</div>
              <div className="text-xl font-bold">{participation?.entry_paid ? (participation?.plan?.replace('_',' ') || 'Enthusiast') : 'Not Joined'}</div>
              <div className="text-xs mt-1">Addon slots: {participation?.addon_slots ?? 0}</div>
            </div>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="text-sm text-gray-500">Earnings</div>
              <div className="text-xl font-bold">₹0</div>
              <div className="text-xs mt-1">Royalties coming soon</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
              <div className="flex gap-3 flex-wrap">
                <Link to="/competition" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg">Register & Upload</Link>
                <Link to="/gallery" className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg">View Gallery</Link>
                <Link to="/marketplace" className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg">Marketplace</Link>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold mb-2">Complete your Profile</h3>
              <p className="text-sm text-gray-500 mb-4">Add your details and social links to improve discovery.</p>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                  {prof.avatar_url ? (
                    <img src={`${API_BASE}${prof.avatar_url}`} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-sm text-gray-500">No Avatar</div>
                  )}
                </div>
                <label className="text-sm">
                  <span className="px-3 py-1 border rounded cursor-pointer">Upload Avatar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                </label>
              </div>
              <form onSubmit={saveProfile} className="space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Name</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={prof.name} onChange={e => setProf({ ...prof, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Phone</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={prof.phone} onChange={e => setProf({ ...prof, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Location</label>
                    <input ref={locationInputRef} className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={prof.location} onChange={e => setProf({ ...prof, location: e.target.value })} placeholder="Start typing your city..." />
                    <div className="text-[11px] text-gray-500 mt-1">Powered by Google Places</div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Address</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={prof.address} onChange={e => setProf({ ...prof, address: e.target.value })} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1">Facebook</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" placeholder="https://facebook.com/..." value={prof.facebook} onChange={e => setProf({ ...prof, facebook: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Instagram</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" placeholder="https://instagram.com/..." value={prof.instagram} onChange={e => setProf({ ...prof, instagram: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Portfolio</label>
                    <input className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" placeholder="https://..." value={prof.portfolio} onChange={e => setProf({ ...prof, portfolio: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button disabled={saving} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg disabled:opacity-60">{saving ? 'Saving...' : 'Save Profile'}</button>
                  {savedMsg && <span className="text-sm text-gray-500">{savedMsg}</span>}
                </div>
              </form>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold mb-2">Interactive Questionnaire</h3>
            <p className="text-sm text-gray-500 mb-4">Tell us more about your photography to personalize mentorship and opportunities.</p>

            <form onSubmit={saveQuestionnaire} className="space-y-4">
              <div>
                <label className="block text-xs mb-1">Photography Style & Tools</label>
                <textarea rows="4" className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={questionnaire.style_tools} onChange={e => setQuestionnaire({ ...questionnaire, style_tools: e.target.value })} placeholder={"Genres you love (Portrait, Street, Landscape, Wildlife, Macro, Travel, Fashion, etc.)\nNatural vs. artificial light?\nMost-used gear or accessory (besides camera/lens)?\nDo you enjoy editing? Which software/app?"} />
              </div>
              <div>
                <label className="block text-xs mb-1">Motivation & Inspiration</label>
                <textarea rows="4" className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={questionnaire.motivation} onChange={e => setQuestionnaire({ ...questionnaire, motivation: e.target.value })} placeholder={"Who/what inspires you most?\nHobby, passion, or profession?\nWhat emotions do you aim to capture?\nShare the story behind your most memorable photograph."} />
              </div>
              <div>
                <label className="block text-xs mb-1">Vision & Creativity</label>
                <textarea rows="4" className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={questionnaire.vision} onChange={e => setQuestionnaire({ ...questionnaire, vision: e.target.value })} placeholder={"How do you decide the perfect moment to click?\nWhat message/perspective do you want your audience to feel?\nDescribe your style in 3 words.\nYour dream photography destination?"} />
              </div>
              <div>
                <label className="block text-xs mb-1">Community & Learning</label>
                <textarea rows="4" className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={questionnaire.community} onChange={e => setQuestionnaire({ ...questionnaire, community: e.target.value })} placeholder={"Would you like to collaborate?\nHave you participated in contests?\nFollow trends or create your own style?\nOpen to mentorship or guiding others?"} />
              </div>
              <div>
                <label className="block text-xs mb-1">Future Aspirations</label>
                <textarea rows="4" className="w-full border px-3 py-2 rounded-lg dark:bg-gray-950 dark:border-gray-800" value={questionnaire.future} onChange={e => setQuestionnaire({ ...questionnaire, future: e.target.value })} placeholder={"Where do you see yourself in 5 years?\nWould you like to exhibit in galleries/events?\nDo you wish to monetize full-time?\nYour biggest dream project?"} />
              </div>
              <div>
                <button disabled={qSaving} className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg disabled:opacity-60">{qSaving ? 'Saving...' : 'Save Questionnaire'}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </section>
  )
}
