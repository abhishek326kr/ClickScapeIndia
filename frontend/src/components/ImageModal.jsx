export default function ImageModal({ src, title, onClose }) {
  if (!src) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="max-w-5xl w-[90%] bg-white dark:bg-gray-900 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-4 py-2 border-b dark:border-gray-800">
          <div className="font-semibold truncate pr-4">{title}</div>
          <button onClick={onClose} className="px-3 py-1 rounded border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">Close</button>
        </div>
        <div className="bg-black flex items-center justify-center">
          <img src={src} alt={title} className="max-h-[80vh] w-auto object-contain" />
        </div>
      </div>
    </div>
  )
}
