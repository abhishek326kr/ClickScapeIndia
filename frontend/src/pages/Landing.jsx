import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'

export default function Landing() {
  const navigate = useNavigate()

  const goRegister = () => navigate('/auth?mode=register')
  const goGallery = () => navigate('/gallery')
  const goVote = () => navigate('/competition')
  const goSell = () => navigate('/marketplace')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-br from-teal-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 items-center gap-10">
          <div>
            <p className="text-sm uppercase tracking-widest text-teal-600 dark:text-teal-400 font-semibold">Capture. Create. Conquer.</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight">
              Turn every click into a masterpiece.
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-lg">
              Welcome to the arena where passion meets pixels. Here, every photo tells a story, and every click could make you a champion! 📸✨
            </p>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              🎯 Join a growing tribe of creators, artists, and dreamers. Show the world what your lens can do — and conquer hearts while you’re at it!
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={goRegister} className="px-5 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium">Register Now</button>
              <button onClick={goGallery} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">View Gallery</button>
              <button onClick={goVote} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">Vote</button>
              <button onClick={goSell} className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900">Sell Your Photos</button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 opacity-90 blur-2xl absolute inset-0 -z-10" />
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/10 flex items-center justify-center bg-gradient-to-br from-gray-100 to-white dark:from-gray-800 dark:to-gray-900">
              <div className="text-6xl">📸✨</div>
            </div>
          </div>
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
      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="p-4">
            <div className="text-2xl font-extrabold">50,000+</div>
            <div className="text-sm text-gray-500">Registered Users</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-extrabold">120,000+</div>
            <div className="text-sm text-gray-500">Total Entries</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-extrabold">2 Million+</div>
            <div className="text-sm text-gray-500">Total Votes</div>
          </div>
          <div className="p-4">
            <div className="text-2xl font-extrabold">₹10,00,000+</div>
            <div className="text-sm text-gray-500">Prize Worth</div>
          </div>
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
            <button onClick={goGallery} className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 font-medium">View Gallery</button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">How It Works — Your Path to Fame</h2>
          <ol className="space-y-4 text-gray-700 dark:text-gray-300">
            <li><span className="font-semibold">Register</span> — Create your account in seconds.</li>
            <li><span className="font-semibold">Upload Photos</span> — Submit your best shots.</li>
            <li><span className="font-semibold">Get Votes</span> — Share your profile & gather support.</li>
            <li><span className="font-semibold">Win Prizes</span> — Top entries get featured & rewarded!</li>
            <li><span className="font-semibold">Sell Your Photos</span> — Turn creativity into income!</li>
          </ol>
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
