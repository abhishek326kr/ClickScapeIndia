import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Competition from './pages/Competition.jsx'
import Gallery from './pages/Gallery.jsx'
import Marketplace from './pages/Marketplace.jsx'
import Profile from './pages/Profile.jsx'
import Auth from './pages/Auth.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import { useState, useMemo, useEffect } from 'react'
import { ToastProvider } from './components/ToastProvider.jsx'
import UserMenu from './components/UserMenu.jsx'
import MyVotes from './pages/MyVotes.jsx'
import PlanProvider, { usePlan } from './components/PlanProvider.jsx'

function AdsBar() {
  const { plan } = usePlan()
  if (plan === 'premium') return null
  return (
    <div className="sticky bottom-0 z-20 w-full bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 px-4 py-3 text-sm flex items-center justify-between">
      <div className="text-amber-800 dark:text-amber-200">You're on the Free plan. Get high‑res export, batch uploads, RAW/PSD and no watermark with Premium.</div>
      <a className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700" href="#/upgrade">Upgrade</a>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/auth')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const sidebarWidth = 260 // used by Sidebar, content uses responsive margin via Tailwind

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <ToastProvider>
      <PlanProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {!isAuthPage && (
          <Sidebar width={sidebarWidth} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
        )}
        <main className={`min-h-screen ${!isAuthPage ? 'md:ml-[260px]' : ''}`}>
          {!isAuthPage && (
            <div className="sticky top-0 z-30 bg-white/70 dark:bg-gray-950/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 justify-between px-4 py-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden px-3 py-2 rounded border dark:border-gray-700">Menu</button>
              <div className="flex-1 max-w-2xl">
                <input type="search" placeholder="Search..." className="w-full px-3 py-2 rounded-lg border dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDark((d) => !d)}
                  aria-label="Toggle dark mode"
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${dark ? 'bg-teal-600' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${dark ? 'translate-x-7' : 'translate-x-1'}`}
                  />
                </button>
                <UserMenu />
              </div>
            </div>
          )}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/auth" replace />} />
              <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/competition" element={<ProtectedRoute><Competition /></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/my-votes" element={<ProtectedRoute><MyVotes /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </div>
          {!isAuthPage && <Footer />}
          {!isAuthPage && <AdsBar />}
        </main>
      </div>
      </PlanProvider>
    </ToastProvider>
  )
}
