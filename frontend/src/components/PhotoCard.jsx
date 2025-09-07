import { API_BASE } from '../lib/api.js'

export default function PhotoCard({ photo, owned = false, onEdit, onDelete, onVote }) {
  const src = photo.url ? `${API_BASE}${photo.url}` : null
  return (
    <div className="rounded shadow hover:shadow-md transition p-2 border border-gray-100 dark:border-gray-800">
      <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded mb-2 overflow-hidden">
        {src ? (
          <img src={src} alt={photo.title} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-semibold">{photo.title}</div>
          <div className="text-xs text-gray-500">{photo.category}</div>
          {!owned && (photo.owner_name || photo.owner_avatar_url) ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800">
                {photo.owner_avatar_url ? (
                  <img src={`${API_BASE}${photo.owner_avatar_url}`} alt={photo.owner_name || 'Owner'} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <span className="truncate max-w-[140px]">{photo.owner_name || '—'}</span>
            </div>
          ) : null}
        </div>
        {owned ? (
          <div className="flex items-center gap-2">
            <button onClick={(e)=>{e.stopPropagation(); onEdit && onEdit(photo)}} className="px-2 py-1 rounded border text-sm">Edit</button>
            <button onClick={(e)=>{e.stopPropagation(); onDelete && onDelete(photo)}} className="px-2 py-1 rounded bg-red-500 text-white text-sm">Delete</button>
          </div>
        ) : (
          <button onClick={(e)=>{ e.stopPropagation(); onVote && onVote(photo) }} className="px-3 py-1 rounded bg-teal-500 text-white text-sm">Vote</button>
        )}
      </div>
    </div>
  )
}
