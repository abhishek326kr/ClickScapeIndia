import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api, { API_BASE } from '../lib/api.js'
import Navbar from '../components/Navbar.jsx'

export default function Landing() {
  const navigate = useNavigate()
  const [mpItems, setMpItems] = useState([])
  const [mpLoading, setMpLoading] = useState(true)

  const goRegister = () => navigate('/auth?mode=register')
  const goGallery = () => navigate('/gallery')
  const goVote = () => navigate('/competition')
  const goSell = () => navigate('/marketplace')

  useEffect(() => {
    // Load a small preview of marketplace items for the landing page
    const run = async () => {
      try {
        const res = await api.get('/marketplace/list', { params: { page: 1, size: 6 } })
        setMpItems(res.data || [])
      } catch {
        setMpItems([])
      } finally {
        setMpLoading(false)
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-16 sm:py-24 overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-teal-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10 relative">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-900 bg-white/60 dark:bg-gray-900/40 backdrop-blur px-3 py-1 text-xs text-teal-700 dark:text-teal-300">
              <SparklesIcon />
              Capture. Create. Conquer.
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
              Turn every click into a masterpiece.
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">
              Welcome to the arena where passion meets pixels. Here, every photo tells a story, and every click could make you a champion!
            </p>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <button onClick={goRegister} className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-teal-600/20 inline-flex items-center gap-2">
                <UserPlusIcon />
                Register Now
              </button>
              <button onClick={goGallery} className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center gap-2">
                <ImageIcon />
                View Gallery
              </button>
              <button onClick={goVote} className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center gap-2">
                <HeartOutlineIcon />
                Vote
              </button>
              <button onClick={goSell} className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 inline-flex items-center gap-2">
                <RupeeIcon />
                Sell Your Photos
              </button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md">
              <FeaturePill icon="🏆" label="Monthly Leaderboards" />
              <FeaturePill icon="💸" label="Royalties on Sales" />
              <FeaturePill icon="🧠" label="Mentorship Access" />
              <FeaturePill icon="⚡" label="AI Enhancements" />
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 opacity-90 blur-2xl absolute inset-0 -z-10" />
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="p-6 grid grid-cols-2 gap-4 w-full">
                <HeroCard icon="🌄" title="Landscape" subtitle="Golden hours" />
                <HeroCard icon="🦁" title="Wildlife" subtitle="Untamed moments" />
                <HeroCard icon="👤" title="Portrait" subtitle="Stories in eyes" />
                <HeroCard icon="🌃" title="Street" subtitle="City rhythms" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Preview */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50/70 dark:bg-gray-900/40 border-y border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-3">
            <h2 className="text-3xl font-bold">Marketplace</h2>
            <button onClick={goSell} className="text-sm px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">Browse all</button>
          </div>
          {mpLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
              ))}
            </div>
          ) : mpItems.length ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {mpItems.map(p => (
                <a key={p.id} href={`/marketplace/item/${p.id}`} className="block rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50">
                  <div className="aspect-square">
                    {p.processed_url || p.url ? (
                      <img src={`${API_BASE}${p.processed_url || p.url}`} alt={p.title} className="w-full h-full object-cover" />
                    ) : <div className="w-full h-full" />}
                  </div>
                  <div className="p-2 flex items-center justify-between">
                    <div className="text-sm font-semibold truncate">{p.title}</div>
                    <div className="text-sm text-teal-600 dark:text-teal-300">₹{p.price || 0}</div>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No items yet. Be the first to publish!</div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">What We’re All About</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Your talent deserves a stage — and this is it. This platform is more than a contest — it’s a community.
            A space where photographers of all levels come together to compete, collaborate, and celebrate creativity.
            Whether you're a hobbyist or a professional — your shot matters. Every upload is a step toward recognition, rewards, and respect. 💪
          </p>
        </div>
      </section>

      {/* Counters Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-gray-50/70 dark:bg-gray-900/40 border-y border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <Stat icon={<UsersIcon />} value="50,000+" label="Registered Users" />
          <Stat icon={<CameraIcon />} value="120,000+" label="Total Entries" />
          <Stat icon={<HeartIcon />} value="2 Million+" label="Total Votes" />
          <Stat icon={<TrophyIcon />} value="₹10,00,000+" label="Prize Worth" />
        </div>
        <p className="mt-4 text-center text-gray-500">Watch the numbers rise — because creativity never stops!</p>
      </section>

      {/* Gallery Teaser */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">See the Magic</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            A picture speaks louder than words. Dive into our ever-growing gallery of awe-inspiring entries.
            Each frame is a glimpse into a creator’s heart — full of color, emotion, and imagination.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-teal-200 to-teal-400 dark:from-teal-700 dark:to-teal-500 flex items-center justify-center text-4xl">🌄</div>
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-cyan-200 to-cyan-400 dark:from-cyan-700 dark:to-cyan-500 flex items-center justify-center text-4xl">🌆</div>
            <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-200 to-amber-400 dark:from-amber-700 dark:to-amber-500 flex items-center justify-center text-4xl">🌌</div>
          </div>
          <div className="mt-6">
            <button onClick={goGallery} className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 font-medium inline-flex items-center gap-2">
              <ImageIcon />
              View Gallery
            </button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50/70 dark:bg-gray-900/40 border-y border-gray-200/60 dark:border-gray-800/60">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">How It Works — Your Path to Fame</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <StepCard n={1} title="Register" desc="Create your account in seconds." />
            <StepCard n={2} title="Upload" desc="Submit your best shots." />
            <StepCard n={3} title="Get Votes" desc="Share your profile & gather support." />
            <StepCard n={4} title="Win Prizes" desc="Top entries get featured & rewarded!" />
            <StepCard n={5} title="Sell Photos" desc="Turn creativity into income!" />
          </div>
          <p className="mt-4 text-gray-500">Every click brings you closer to fame and fortune. 🚀</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold">Your Moment Starts Now</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-300">Don’t just scroll. Create your story. The world is waiting for your vision — your story through the lens. Join today, and let your art conquer the spotlight.</p>
          <p className="mt-1 text-xl font-semibold">💥 Capture. Create. Conquer. 💥</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button onClick={goRegister} className="px-5 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium">Register Now</button>
            <button onClick={goGallery} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">View Gallery</button>
            <button onClick={goVote} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">Vote</button>
            <button onClick={goSell} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">Sell Your Photos</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4zm12 2l1.2 2.4L20.6 9 18.2 9.6 17 12l-1.2-2.4L13.4 9l2.4-1.6L17 5zM19 13l1.5 3 3 1.5-3 1.5L19 22l-1.5-3-3-1.5 3-1.5L19 13z"/></svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zm-8 0c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-.68.18-1.32.5-1.9-.86-.07-1.73-.1-2.5-.1zm8 0c-.6 0-1.26.04-1.93.1.61.82.93 1.8.93 2.9v2h10v-2c0-2.66-5.33-4-8-4z"/></svg>
  )
}

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M9 2l1.5 2H15l2 2h3c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h3l2-2h0zM12 18a5 5 0 100-10 5 5 0 000 10z"/></svg>
  )
}

function HeartIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-6.716-4.534-9.192-7.01C.333 11.515.333 8.152 2.808 5.677a4.8 4.8 0 016.788 0L12 8.08l2.404-2.403a4.8 4.8 0 016.788 6.788C18.716 16.466 12 21 12 21z"/></svg>
  )
}

function TrophyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3h3a1 1 0 011 1v2a5 5 0 01-5 5h-1a6 6 0 01-3 4.472V18h3a1 1 0 010 2H9a1 1 0 010-2h3v-2.528A6 6 0 019 11H8A5 5 0 013 6V4a1 1 0 011-1h3l1-1h8l1 1zm3 3V5h-2v1a3 3 0 002 0zM6 6V5H4v1a3 3 0 002 0z"/></svg>
  )
}

function Stat({ icon, value, label }) {
  return (
    <div className="p-4 rounded-2xl bg-white/70 dark:bg-gray-900/40 backdrop-blur border border-gray-200/70 dark:border-gray-800/70 shadow-sm flex flex-col items-center gap-2">
      <div className="text-teal-600 dark:text-teal-300">{icon}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  )
}

function FeaturePill({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-full bg-white/70 dark:bg-gray-900/40 border border-gray-200/60 dark:border-gray-800/60 backdrop-blur">
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </div>
  )
}

function HeroCard({ icon, title, subtitle }) {
  return (
    <div className="rounded-xl bg-white/80 dark:bg-gray-900/60 border border-gray-200/70 dark:border-gray-800/70 p-4 flex items-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="font-semibold leading-tight">{title}</div>
        <div className="text-xs text-gray-500">{subtitle}</div>
      </div>
    </div>
  )
}

function StepCard({ n, title, desc }) {
  return (
    <div className="rounded-2xl p-4 bg-white/70 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-800/60">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white grid place-items-center font-bold">{n}</div>
        <div className="font-semibold">{title}</div>
      </div>
      <div className="text-sm text-gray-500 mt-2">{desc}</div>
    </div>
  )
}

// Button icons and Dark Mode toggle (defined outside the component)
function UserPlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-2.02 4-4.5S17.21 3 15 3s-4 2.02-4 4.5S12.79 12 15 12zM6 8H4V6H2v2H0v2h2v2h2v-2h2V8zm9 3c-2.67 0-8 1.34-8 4v3h10v-3c0-1.23-.62-2.33-1.65-3.17C14.55 11.61 13.2 11 12 11z"/></svg>
  )
}

function ImageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5a2 2 0 00-2-2H5C3.89 3 3 3.9 3 5v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 11.5A2.5 2.5 0 1111 9a2.5 2.5 0 01-2.5 2.5zM5 19l4.5-6 3.5 4.5 2.5-3.5L19 19H5z"/></svg>
  )
}

function HeartOutlineIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12.1 8.64L12 8.77l-.1-.12C10.14 6.64 7.1 6.5 5.36 8.24c-1.86 1.86-1.86 4.88 0 6.74L12 21.62l6.64-6.64c1.86-1.86 1.86-4.88 0-6.74-1.73-1.74-4.78-1.6-6.54.4z"/></svg>
  )
}

function RupeeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h10V3H7V1H5v2H2v2h3v2h6.24c-.62 1.43-2.05 2.43-3.74 2.43H5v2h2.5c2.28 0 4.27-1.3 5.2-3.3L15 5H7zm6.86 10.5H10l5.5 6.5H18l-4.14-6.5z"/></svg>
  )
}

function DarkModeToggle() {
  const toggle = () => {
    try {
      const root = document.documentElement
      const isDark = root.classList.toggle('dark')
      localStorage.setItem('theme', isDark ? 'dark' : 'light')
    } catch {}
  }
  return (
    <button onClick={toggle} aria-label="Toggle dark mode" className="ml-2 p-2 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
      <MoonSunIcon />
    </button>
  )
}

function MoonSunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79 1.8-1.79zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zM4.84 20.83l1.79-1.79-1.79-1.79-1.67 1.67 1.67 1.91zM20 13h3v-2h-3v2zm-2.76 7.83l1.79-1.91-1.67-1.67-1.79 1.79 1.67 1.79zM12 6a6 6 0 100 12 6 6 0 000-12zm7.24-1.16l1.79-1.79-1.41-1.41-1.79 1.79 1.41 1.41zM13 1h-2v3h2V1z"/></svg>
  )
}
