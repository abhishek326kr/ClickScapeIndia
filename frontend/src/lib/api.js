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
        // best-effort logout
        try { await api.post('/auth/logout') } catch (_) {}
        // redirect to login if available
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('token')
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth'
          }
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
