import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import api from '../lib/api.js'

export default function Sidebar({ width = 260, open, onClose, onOpen }) {
  const [authed, setAuthed] = useState(false)
  const navigate = useNavigate()
  const closeBtnRef = useRef(null)


  useEffect(() => {
    const handler = async () => {
      try { await api.get('/auth/me'); setAuthed(true) } catch { setAuthed(false) }
    }
    handler()
    window.addEventListener('auth:changed', handler)
    return () => { window.removeEventListener('auth:changed', handler) }
  }, [])

  // ESC to close on mobile and focus the close button when opened
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && open) onClose && onClose()
    }
    window.addEventListener('keydown', onKey)
    if (open && closeBtnRef.current) {
      setTimeout(() => closeBtnRef.current?.focus(), 0)
    }
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    window.dispatchEvent(new Event('auth:changed'))
    setAuthed(false)
    navigate('/auth')
  }

  const linkClass = ({ isActive }) =>
    `group relative block px-4 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
      isActive ? 'bg-teal-500 text-white hover:bg-teal-600' : ''
    }`

  return (
    <>
      {/* Backdrop for mobile */}
      <div className={`fixed inset-0 z-40 bg-black/40 md:hidden ${open ? '' : 'hidden'}`} onClick={onClose} />
      <aside style={{ width }} className={`fixed z-50 top-0 left-0 h-full border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transform transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-14 flex items-center justify-between px-4 border-b dark:border-gray-800">
          <div className="text-xl font-bold">ClickScape<span className="text-yellow-400">India</span></div>
          <button ref={closeBtnRef} className="md:hidden px-3 py-2 rounded border dark:border-gray-700" onClick={onClose}>Close</button>
        </div>
        <nav className="p-3 space-y-1">
          <div className="text-xs uppercase tracking-wider text-gray-500 px-3 py-2">Navigation</div>
          <NavLink to="/home" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <HomeIcon />
              Dashboard
            </span>
          </NavLink>
          <NavLink to="/competition" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <TrophyIcon />
              Competition
            </span>
          </NavLink>
          <NavLink to="/gallery" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <GalleryIcon />
              My Gallery
            </span>
          </NavLink>
          <NavLink to="/marketplace" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <StoreIcon />
              Marketplace
            </span>
          </NavLink>
          <NavLink to="/my-votes" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <DashboardIcon />
              My Votes
            </span>
          </NavLink>
          <NavLink to="/profile" className={linkClass} onClick={onClose}>
            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-teal-500 opacity-0 group-[.active]:opacity-100" />
            <span className="inline-flex items-center gap-3">
              <DashboardIcon />
              Profile
            </span>
          </NavLink>
          <div className="pt-4 border-t dark:border-gray-800 mt-4 px-3">
            {authed ? (
              <button onClick={logout} className="w-full px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white">Logout</button>
            ) : (
              <NavLink to="/auth" onClick={onClose} className="w-full block text-center px-4 py-2 rounded border dark:border-gray-800">Login</NavLink>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}

function IconBase({ children }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80 group-hover:opacity-100">
      {children}
    </svg>
  )
}

function HomeIcon() {
  return (
    <IconBase>
      <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
    </IconBase>
  )
}
function TrophyIcon() {
  return (
    <IconBase>
      <path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 4h10v4a5 5 0 0 1-10 0V4z" /><path d="M21 5h-3v2a7 7 0 0 0 3-2zM3 5h3v2a7 7 0 0 1-3-2z" />
    </IconBase>
  )
}
function GalleryIcon() {
  return (
    <IconBase>
      <rect x="3" y="4" width="18" height="14" rx="2" /><path d="m8 13 3-3 4 4 2-2 3 3" />
    </IconBase>
  )
}
function StoreIcon() {
  return (
    <IconBase>
      <path d="M4 7h16l-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7z" /><path d="M5 7l2-4h10l2 4" />
    </IconBase>
  )
}
function DashboardIcon() {
  return (
    <IconBase>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </IconBase>
  )
}
