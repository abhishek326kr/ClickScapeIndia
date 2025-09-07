import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios'

export default function Navbar() {
  const [dark, setDark] = useState(false)
  const [authed, setAuthed] = useState(!!localStorage.getItem('token'))
  const navigate = useNavigate()
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
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
          <NavLink to="/home" className={linkClass} end>Home</NavLink>
          <NavLink to="/competition" className={linkClass}>Competition</NavLink>
          <NavLink to="/gallery" className={linkClass}>My Gallery</NavLink>
          <NavLink to="/marketplace" className={linkClass}>Marketplace</NavLink>
          {authed ? (
            <>
              <NavLink to="/profile" className={linkClass}>Dashboard</NavLink>
              <button onClick={logout} className="px-3 py-2 rounded border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">Logout</button>
            </>
          ) : (
            <NavLink to="/auth" className={linkClass}>Login</NavLink>
          )}
          <button onClick={() => setDark(d => !d)} className="ml-2 px-3 py-2 rounded border dark:border-gray-700">
            {dark ? 'Light' : 'Dark'}
          </button>
        </nav>
      </div>
    </header>
  )
}
