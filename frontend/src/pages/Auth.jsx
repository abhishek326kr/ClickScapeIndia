import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register | forgot
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [plan, setPlan] = useState('free')
  const [role, setRole] = useState('participant')
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { search } = useLocation()

  const errMsg = (err) => {
    const d = err?.response?.data
    if (!d) return 'Network error'
    if (typeof d === 'string') return d
    if (d.detail) return typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail)
    // Pydantic validation error format
    if (Array.isArray(d) || d.errors) return 'Validation error'
    return 'Request error'
  }

  useEffect(() => {
    // If already authenticated (cookie), go to dashboard
    api.get('/auth/me')
      .then(() => navigate('/profile', { replace: true }))
      .catch(() => {})
  }, [navigate])

  // Read initial mode from query string (?mode=register|login|forgot)
  useEffect(() => {
    const q = new URLSearchParams(search)
    const m = q.get('mode')
    if (m && ['login', 'register', 'forgot'].includes(m)) {
      setMode(m)
    }
  }, [search])

  const submit = async (e) => {
    e.preventDefault()
    try {
      if (mode === 'login') {
        await api.post('/auth/login', { email, password })
        setStatus('Logged in')
        toast.push({ type: 'success', message: 'Welcome back!' })
        window.dispatchEvent(new Event('auth:changed'))
        navigate('/profile')
      } else if (mode === 'register') {
        await api.post('/auth/signup', { email, password, role, name, phone, plan })
        setStatus('Signed up')
        toast.push({ type: 'success', message: 'Account created' })
        window.dispatchEvent(new Event('auth:changed'))
        navigate('/profile')
      } else if (mode === 'forgot') {
        const res = await api.post('/auth/forgot-password', { email })
        const msg = res?.data?.message || 'If the email exists, reset link has been sent.'
        setStatus(msg)
        toast.push({ type: 'success', message: msg })
      }
    } catch (err) {
      setStatus(errMsg(err))
      toast.push({ type: 'error', message: errMsg(err) })
    }
  }

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 px-3 sm:px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-4 sm:p-6">
        <div className="flex items-center justify-center gap-2 text-sm mb-4">
          <button onClick={() => setMode('login')} className={`px-3 py-1.5 rounded ${mode==='login'?'bg-teal-600 text-white':'bg-gray-100 dark:bg-gray-800'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`px-3 py-1.5 rounded ${mode==='register'?'bg-teal-600 text-white':'bg-gray-100 dark:bg-gray-800'}`}>Sign Up</button>
          <button onClick={() => setMode('forgot')} className={`px-3 py-1.5 rounded ${mode==='forgot'?'bg-teal-600 text-white':'bg-gray-100 dark:bg-gray-800'}`}>Forgot</button>
        </div>
        <h2 className="text-2xl font-extrabold mb-1 text-center">
          {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Recover your account'}
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          {mode === 'forgot' ? 'Enter your email to receive a reset link' : 'Sign in to access your dashboard'}
        </p>
        <form className="space-y-4" onSubmit={submit}>
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          )}
          {mode !== 'forgot' && (
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" value={role} onChange={e => setRole(e.target.value)}>
                <option value="participant">Participant</option>
                <option value="creator">Creator</option>
              </select>
            </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Plan</label>
              <select className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          )}
          <button className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 transition text-white rounded-lg w-full font-medium">
            {mode === 'login' ? 'Login' : mode === 'register' ? 'Sign up' : 'Send reset link'}
          </button>
        </form>
        <div className="mt-4 text-xs text-center text-gray-500">
          {mode !== 'login' && (
            <button className="underline" onClick={() => setMode('login')}>Back to Login</button>
          )}
        </div>
        {status && <div className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">{status}</div>}
      </div>
    </section>
  )
}
