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
