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
    // Small delay to allow toast to render before navigation
    setTimeout(() => { window.location.assign('/auth') }, 200)
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {}
    if (error.response && error.response.status === 401 && !original._retry) {
      // Do NOT attempt refresh on auth endpoints; surface backend message instead
      const urlStr = String(original?.url || '')
      const isAuthEndpoint = urlStr.includes('/auth/login') || urlStr.includes('/auth/signup') || urlStr.includes('/auth/forgot-password')
      if (isAuthEndpoint) {
        const data = error.response?.data
        let message = 'Unauthorized'
        if (typeof data === 'string') message = data
        else if (data?.detail) message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
        toast({ type: 'error', message })
        return Promise.reject(error)
      }
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
        // Prefer backend reason if present
        const data = error?.response?.data
        let message = 'Session expired. Please sign in again.'
        if (typeof data === 'string') message = data
        else if (data?.detail) message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
        toast({ type: 'error', message })
        await logoutClientSide()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    // Non-401 errors: extract a precise, human-friendly message
    const { response } = error || {}
    let message = ''

    // Network / CORS / DNS
    if (!response) {
      if (error?.code === 'ERR_NETWORK') {
        message = 'Network error: unable to reach server. Check your connection or CORS.'
      } else if (error?.message) {
        message = error.message
      } else {
        message = 'Network error occurred'
      }
      toast({ type: 'error', message })
      return Promise.reject(error)
    }

    const status = response.status
    const data = response.data

    // FastAPI common shapes
    if (typeof data === 'string') {
      message = data
    } else if (data?.detail) {
      // detail can be string or list of validation errors
      if (typeof data.detail === 'string') {
        message = data.detail
      } else if (Array.isArray(data.detail)) {
        // Collect validation messages e.g. [{loc: [...], msg: '...', type: 'value_error'}]
        const parts = data.detail.map((d) => {
          const loc = Array.isArray(d?.loc) ? d.loc.join('.') : ''
          const msg = d?.msg || JSON.stringify(d)
          return loc ? `${loc}: ${msg}` : msg
        })
        message = parts.join('; ')
      } else {
        message = JSON.stringify(data.detail)
      }
    } else if (data?.message) {
      message = data.message
    } else if (data?.error) {
      message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error)
    } else {
      message = `Request failed with status ${status}`
    }

    // Add method + path context (without query string) for clarity
    try {
      const url = new URL(original?.url || original?.baseURL || '', API_BASE)
      const path = original?.url?.startsWith('http') ? new URL(original.url).pathname : url.pathname
      const method = (original?.method || 'GET').toUpperCase()
      message = `${method} ${path}: ${message}`
    } catch {
      // ignore URL parsing issues
    }

    toast({ type: 'error', message })
    return Promise.reject(error)
  }
)

export default api
