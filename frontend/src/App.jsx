import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Competition from './pages/Competition.jsx'
import Gallery from './pages/Gallery.jsx'
import Marketplace from './pages/Marketplace.jsx'
import MarketplaceItem from './pages/MarketplaceItem.jsx'
import Profile from './pages/Profile.jsx'
import Auth from './pages/Auth.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import { useState, useMemo, useEffect } from 'react'
import { ToastProvider } from './components/ToastProvider.jsx'
import UserMenu from './components/UserMenu.jsx'
import MyVotes from './pages/MyVotes.jsx'
import PlanProvider, { usePlan } from './components/PlanProvider.jsx'
import Landing from './pages/Landing.jsx'

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

// Local sun/moon icon used for the header theme toggle
function MoonSunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 13h3v-2h-3v2zm-2.76 7.83l1.79-1.91-1.67-1.67-1.79 1.79 1.67 1.79zM12 6a6 6 0 100 12 6 6 0 000-12zm7.24-1.16l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM13 1h-2v3h2V1z"/></svg>
  )
}

export default function App() {
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/auth')
  const isPublicPage = location.pathname === '/' || isAuthPage
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dark, setDark] = useState(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    if (saved === 'dark') return true
    if (saved === 'light') return false
    try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches } catch { return false }
  })
  const sidebarWidth = 260 // used by Sidebar, content uses responsive margin via Tailwind

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }, [dark])

  return (
    <ToastProvider>
      <PlanProvider>
      <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {!isPublicPage && (
          <Sidebar width={sidebarWidth} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpen={() => setSidebarOpen(true)} />
        )}
        <main className={`min-h-screen ${!isPublicPage ? 'md:ml-[260px]' : ''}`}>
          {!isPublicPage && (
            <div className="sticky top-0 z-30 bg-white/70 dark:bg-gray-950/70 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 justify-between px-4 py-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden px-3 py-2 rounded border dark:border-gray-700">Menu</button>
              <div className="flex-1 max-w-2xl">
                <input type="search" placeholder="Search..." className="w-full px-3 py-2 rounded-lg border dark:border-gray-800 bg-white/70 dark:bg-gray-900/70 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDark((d) => !d)}
                  aria-label="Toggle dark mode"
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <MoonSunIcon />
                </button>
                <UserMenu />
              </div>
            </div>
          )}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              {/* Backward compatibility: redirect old /home to /dashboard */}
              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="/competition" element={<ProtectedRoute><Competition /></ProtectedRoute>} />
              <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
              {/* Marketplace is public for browsing */}
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/item/:id" element={<MarketplaceItem />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/my-votes" element={<ProtectedRoute><MyVotes /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </Routes>
          </div>
          {!isPublicPage && <Footer />}
          {!isPublicPage && <AdsBar />}
        </main>
      </div>
      </PlanProvider>
    </ToastProvider>
  )
}
