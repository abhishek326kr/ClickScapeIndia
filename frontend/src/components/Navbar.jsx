import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api.js'

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'dark') return true
    if (saved === 'light') return false
    // fallback to prefers-color-scheme
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
  })
  const [authed, setAuthed] = useState(false)
  const [me, setMe] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])
  useEffect(() => {
    const handler = async () => {
      try {
        const res = await api.get('/auth/me')
        setAuthed(true)
        setMe(res?.data || null)
      } catch {
        setAuthed(false)
        setMe(null)
      }
    }
    handler()
    window.addEventListener('auth:changed', handler)
    return () => { window.removeEventListener('auth:changed', handler) }
  }, [])
  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    window.dispatchEvent(new Event('auth:changed'))
    setAuthed(false)
    setMe(null)
    navigate('/auth')
  }
  const linkClass = ({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-teal-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile hamburger */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <HamburgerIcon />
          </button>
          <Link to="/" className="text-2xl font-bold">
          ClickScape<span className="text-yellow-400">India</span>
        </Link>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/competition" className={linkClass}>Competition</NavLink>
          <NavLink to="/gallery" className={linkClass}>My Gallery</NavLink>
          <NavLink to="/marketplace" className={linkClass}>Marketplace</NavLink>
          {authed ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
              <button onClick={logout} className="px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
            </>
          ) : (
            <NavLink to="/auth" className={linkClass}>Login</NavLink>
          )}
          <button
            onClick={() => setDark(d => !d)}
            aria-label="Toggle dark mode"
            className="ml-2 p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MoonSunIcon />
          </button>
        </nav>
      </div>
      {/* Mobile menu: shows Navbar links, not dashboard sidebar */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-950 border-b dark:border-gray-800 rounded-b-xl shadow-lg">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="text-xl font-bold">Menu</div>
              <button className="px-3 py-2 rounded border dark:border-gray-700" onClick={() => setMenuOpen(false)}>Close</button>
            </div>
            <nav className="px-3 pb-3 grid gap-2">
              <NavLink to="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)} end>Dashboard</NavLink>
              <NavLink to="/competition" className={linkClass} onClick={() => setMenuOpen(false)}>Competition</NavLink>
              <NavLink to="/gallery" className={linkClass} onClick={() => setMenuOpen(false)}>My Gallery</NavLink>
              <NavLink to="/marketplace" className={linkClass} onClick={() => setMenuOpen(false)}>Marketplace</NavLink>
              {authed ? (
                <>
                  <button onClick={() => { setMenuOpen(false); logout() }} className="px-3 py-2 rounded border dark:border-gray-700 text-left">Logout</button>
                </>
              ) : (
                <NavLink to="/auth" className={linkClass} onClick={() => setMenuOpen(false)}>Login</NavLink>
              )}
              <button
                onClick={() => { setDark(d => !d) }}
                aria-label="Toggle dark mode"
                className="mt-1 p-2 rounded-full border border-gray-200 dark:border-gray-700 w-10"
              >
                <MoonSunIcon />
              </button>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

function MoonSunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 13h3v-2h-3v2zm-2.76 7.83l1.79-1.91-1.67-1.67-1.79 1.79 1.67 1.79zM12 6a6 6 0 100 12 6 6 0 000-12zm7.24-1.16l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM13 1h-2v3h2V1z"/></svg>
  )
}

function HamburgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
