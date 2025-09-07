import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api.js'

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('participant')
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // If already authenticated (cookie), go to dashboard
    api.get('/auth/me')
      .then(() => navigate('/profile', { replace: true }))
      .catch(() => {})
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await api.post('/auth/login', { email, password })
        setStatus('Logged in')
        window.dispatchEvent(new Event('auth:changed'))
        navigate('/profile')
      } else {
        await api.post('/auth/signup', { email, password, role, name, phone })
        setStatus('Signed up')
        window.dispatchEvent(new Event('auth:changed'))
        navigate('/profile')
      }
    } catch (err) {
      setStatus('Request error')
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-extrabold mb-1 text-center">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="text-center text-sm text-gray-500 mb-6">Sign in to access your dashboard</p>
        <form className="space-y-4" onSubmit={submit}>
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          )}
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" value={role} onChange={e => setRole(e.target.value)}>
                <option value="participant">Participant</option>
                <option value="creator">Creator</option>
              </select>
            </div>
          )}
          <button className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 transition text-white rounded-lg w-full font-medium">{mode === 'login' ? 'Login' : 'Sign up'}</button>
        </form>
        <button className="mt-4 text-sm underline w-full text-center" onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}>
          Switch to {mode === 'login' ? 'Register' : 'Login'}
        </button>
        {status && <div className="mt-3 text-sm text-gray-500 text-center">{status}</div>}
      </div>
    </section>
  )
}
