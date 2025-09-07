import { useEffect, useState } from 'react'
import PhotoCard from '../components/PhotoCard.jsx'
import ImageModal from '../components/ImageModal.jsx'
import EditPhotoModal from '../components/EditPhotoModal.jsx'
import api, { API_BASE } from '../lib/api.js'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/ToastProvider.jsx'

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [active, setActive] = useState(null)
  const [editPhoto, setEditPhoto] = useState(null)
  const [confirmState, setConfirmState] = useState({ open: false, target: null })
  const toast = useToast()

  useEffect(() => {
    api.get('/photos/my').then(res => setPhotos(res.data)).catch(() => setPhotos([]))
  }, [])

  const refresh = () => api.get('/photos/my').then(res => setPhotos(res.data)).catch(() => setPhotos([]))

  const onDelete = async (p) => {
    setConfirmState({ open: true, target: p })
  }

  const onConfirmDelete = async () => {
    const p = confirmState.target
    setConfirmState({ open: false, target: null })
    try {
      await api.delete(`/photos/${p.id}`)
      toast.push({ type: 'success', message: 'Photo deleted' })
      refresh()
    } catch (e) {
      const msg = e?.response?.data?.detail || 'Failed to delete'
      toast.push({ type: 'error', message: msg })
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map(p => (
          <div key={p.id} onClick={() => setActive(p)} className="cursor-zoom-in">
            <PhotoCard photo={p} owned onEdit={setEditPhoto} onDelete={onDelete} />
          </div>
        ))}
      </div>
      <ImageModal src={active?.url ? `${API_BASE}${active.url}` : null} title={active?.title} onClose={() => setActive(null)} />
      <EditPhotoModal photo={editPhoto} onClose={() => setEditPhoto(null)} onSaved={refresh} />
      <ConfirmDialog
        open={confirmState.open}
        title="Delete Photo"
        message={`Are you sure you want to delete "${confirmState.target?.title || ''}"? This cannot be undone.`}
        confirmText="Delete"
        onCancel={() => setConfirmState({ open: false, target: null })}
        onConfirm={onConfirmDelete}
      />
    </section>
  )
}
