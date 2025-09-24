import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { API_BASE, logoutClientSide } from '../lib/api.js'

export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [plan, setPlan] = useState('free')
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = async () => {
      try {
        const res = await api.get('/auth/me')
        setEmail(res.data?.email || '')
        setPlan(res.data?.plan || 'free')
        // also load profile for avatar
        try {
          const p = await api.get('/users/me/profile')
          const url = p?.data?.avatar_url || ''
          setAvatarUrl(url ? `${url}?v=${Date.now()}` : '')
        } catch {}
      } catch {}
    }
    handler()
  }, [])

  useEffect(() => {
    const onDoc = (e) => { if (open && ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey) }
  }, [open])

  const initials = email ? email[0]?.toUpperCase() : 'U'

  const logout = async () => {
    await logoutClientSide()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="w-9 h-9 rounded-full bg-teal-600 text-white grid place-items-center font-bold shadow overflow-hidden">
        {avatarUrl ? (
          <img src={`${API_BASE}${avatarUrl}`} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 py-3 text-sm border-b dark:border-gray-800">
            <div className="font-semibold">Account</div>
            <div className="text-gray-500 truncate">{email || '—'}</div>
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${plan === 'premium' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                {plan === 'premium' ? 'Premium' : 'Free'}
              </span>
              {plan !== 'premium' && (
                <button className="text-xs text-amber-700 hover:underline" onClick={() => { setOpen(false); navigate('/profile#upgrade') }}>Upgrade</button>
              )}
            </div>
          </div>
          <div className="py-1">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => { setOpen(false); navigate('/profile') }}>Dashboard</button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={() => { setOpen(false); navigate('/profile#settings') }}>Settings</button>
          </div>
          <div className="border-t dark:border-gray-800">
            <button className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={logout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  )
}
