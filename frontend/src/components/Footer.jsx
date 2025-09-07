export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500">
        © {new Date().getFullYear()} ClickScape India. All rights reserved.
      </div>
    </footer>
  )
}
