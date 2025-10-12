import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Navbar() {
  const [dark, setDark] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'dark') return true
    if (saved === 'light') return false
    // fallback to prefers-color-scheme
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
  })
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  const navigate = useNavigate()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])
  useEffect(() => {
    const handler = () => setAuthed(!!localStorage.getItem('token'))
    window.addEventListener('storage', handler)
    window.addEventListener('auth:changed', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('auth:changed', handler)
    }
  }, [])
  const logout = () => {
    localStorage.removeItem('token')
    try { delete axios.defaults.headers.common['Authorization'] } catch {}
    window.dispatchEvent(new Event('auth:changed'))
    setAuthed(false)
    navigate('/auth')
  }
  const linkClass = ({ isActive }) => `px-3 py-2 rounded ${isActive ? 'bg-teal-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold">
          ClickScape<span className="text-yellow-400">India</span>
        </Link>
        <nav className="flex items-center gap-2">
          <NavLink to="/dashboard" className={linkClass} end>Dashboard</NavLink>
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
    </header>
  )
}

function MoonSunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 13h3v-2h-3v2zm-2.76 7.83l1.79-1.91-1.67-1.67-1.79 1.79 1.67 1.79zM12 6a6 6 0 100 12 6 6 0 000-12zm7.24-1.16l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM13 1h-2v3h2V1z"/></svg>
  )
}
