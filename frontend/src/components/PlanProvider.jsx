import { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api.js'

const PlanContext = createContext({ plan: 'free', loading: true })

export function usePlan() {
  return useContext(PlanContext)
}

export default function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const fetchPlan = async () => {
      try {
        const res = await api.get('/auth/me')
        if (!mounted) return
        setPlan(res.data?.plan || 'free')
      } catch {
        if (!mounted) return
        setPlan('free')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchPlan()
    const onAuthChange = () => fetchPlan()
    window.addEventListener('auth:changed', onAuthChange)
    return () => { mounted = false; window.removeEventListener('auth:changed', onAuthChange) }
  }, [])

  return (
    <PlanContext.Provider value={{ plan, loading }}>
      {children}
    </PlanContext.Provider>
  )
}
