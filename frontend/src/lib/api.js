import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.clickscapeindia.com'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

let isRefreshing = false
let pendingQueue = []

function processQueue(error, token = null) {
  pendingQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  pendingQueue = []
}

// Helper to dispatch a global toast event
function toast(detail) {
  try {
    window.dispatchEvent(new CustomEvent('toast', { detail }))
  } catch {}
}

// Exportable logout utility to ensure consistent behavior across app
export async function logoutClientSide() {
  try { await api.post('/auth/logout') } catch {}
  try { toast({ type: 'success', message: 'Logged out' }) } catch {}
  try { window.dispatchEvent(new Event('auth:changed')) } catch {}
  if (typeof window !== 'undefined') {
    window.location.href = '/auth'
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    if (error.response && error.response.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then(() => api(original))
      }
      original._retry = true
      isRefreshing = true
      try {
        await api.post('/auth/refresh')
        processQueue(null)
        return api(original)
      } catch (e) {
        processQueue(e)
        toast({ type: 'error', message: 'Session expired. Please sign in again.' })
        await logoutClientSide()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    // Non-401 errors: show precise message if available
    const d = error?.response?.data
    let message = 'Request error'
    if (typeof d === 'string') message = d
    else if (d?.detail) message = typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail)
    toast({ type: 'error', message })
    return Promise.reject(error)
  }
)

export default api
