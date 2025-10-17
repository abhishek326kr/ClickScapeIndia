import { Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api.js'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking') // checking | ok | no
  const location = useLocation()

  useEffect(() => {
    let mounted = true
    // Single auth check without artificial timeout to avoid redirect loops on slow networks
    api.get('/auth/me')
      .then(() => { if (mounted) setStatus('ok') })
      .catch((err) => {
        if (!mounted) return
        // Don't flip to 'no' on request cancellation; otherwise mark unauthorized
        const canceled = err && (err.code === 'ERR_CANCELED' || err.name === 'CanceledError')
        if (!canceled) setStatus('no')
      })
    return () => { mounted = false }
  }, [])

  if (status === 'checking') {
    return (
      <div className="w-full min-h-[200px] grid place-items-center">
        <div className="text-sm text-gray-500">Checking access…</div>
      </div>
    )
  }
  // Single redirect render path (no imperative navigate) for reliability
  if (status === 'no') {
    const next = encodeURIComponent(location?.pathname || '/')
    return <Navigate to={`/auth?mode=login&next=${next}`} replace />
  }
  return children
}
