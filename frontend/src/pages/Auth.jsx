import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | register | forgot
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [plan, setPlan] = useState('free')
  const [role, setRole] = useState('enthusiast')
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()
  const { search } = useLocation()
  const nextPath = useMemo(() => {
    try {
      const q = new URLSearchParams(search)
      const nxt = q.get('next') || ''
      // allow only internal absolute paths
      if (nxt && nxt.startsWith('/')) return nxt
    } catch {}
    return ''
  }, [search])

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
      .then(() => navigate(nextPath || '/home', { replace: true }))
      .catch(() => {})
  }, [navigate, nextPath])

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
        navigate(nextPath || '/home', { replace: true })
      } else if (mode === 'register') {
        await api.post('/auth/signup', { email, password, role, name, phone, plan })
        setStatus('Signed up')
        toast.push({ type: 'success', message: 'Account created' })
        window.dispatchEvent(new Event('auth:changed'))
        navigate(nextPath || '/home', { replace: true })
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
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-5 sm:p-7">
        <div className="flex items-center justify-center gap-2 text-sm mb-5">
          <button onClick={() => setMode('login')} className={`px-4 py-1.5 rounded-full transition ${mode==='login'?'bg-teal-600 text-white shadow':'bg-gray-100 dark:bg-gray-800'}`}>Login</button>
          <button onClick={() => setMode('register')} className={`px-4 py-1.5 rounded-full transition ${mode==='register'?'bg-teal-600 text-white shadow':'bg-gray-100 dark:bg-gray-800'}`}>Sign Up</button>
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
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="w-full border px-3 py-2 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0112 20C7 20 2.73 16.11 1 12c.46-1.06 1.12-2.06 1.94-2.94M9.88 9.88A3 3 0 0112 9c1.66 0 3 1.34 3 3 0 .7-.24 1.34-.64 1.84"/><path d="M1 1l22 22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {mode === 'login' && (
              <div className="mt-2 text-right text-xs">
                <button type="button" onClick={() => setMode('forgot')} className="text-teal-700 dark:text-teal-300 hover:underline">Forgot password?</button>
              </div>
            )}
          </div>
          )}
          {mode === 'register' && (
            <div>
              <label className="block text-sm mb-1">Role</label>
              <select className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 dark:bg-gray-950 dark:border-gray-800" value={role} onChange={e => setRole(e.target.value)}>
                <option value="enthusiast">Enthusiast (₹99)</option>
                <option value="creator">Creator+ (₹999)</option>
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
