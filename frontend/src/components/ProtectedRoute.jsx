import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../lib/api.js'

export default function ProtectedRoute({ children }) {
  const [status, setStatus] = useState('checking') // checking | ok | no

  useEffect(() => {
    let mounted = true
    api.get('/auth/me')
      .then(() => { if (mounted) setStatus('ok') })
      .catch(() => { if (mounted) setStatus('no') })
    return () => { mounted = false }
  }, [])

  if (status === 'checking') {
    return null
  }
  if (status === 'no') {
    return <Navigate to="/auth" replace />
  }
  return children
}
