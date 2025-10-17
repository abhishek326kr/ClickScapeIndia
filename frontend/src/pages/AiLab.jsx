import { useEffect, useRef, useState } from 'react'
import api, { API_BASE } from '../lib/api.js'
import { useToast } from '../components/ToastProvider.jsx'

export default function AiLab() {
  const toast = useToast()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [resultUrl, setResultUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!file) { setPreview(''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = () => inputRef.current?.click()

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const run = async (endpoint) => {
    if (!file) { toast.push({ type: 'error', message: 'Please select an image' }); return }
    setBusy(true)
    setResultUrl('')
    try {
      const form = new FormData()
      form.append('image', file)
      const res = await api.post(endpoint, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res?.data?.url
      if (!url) throw new Error('No result')
      setResultUrl(url)
      toast.push({ type: 'success', message: 'AI processing complete' })
    } catch (e) {
      const msg = e?.response?.data?.detail || 'AI request failed'
      toast.push({ type: 'error', message: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Lab</h2>
          <div className="text-sm text-gray-500">Background removal, enhance and upscale (Premium/Creator only)</div>
        </div>
        <div>
          <button onClick={pick} className="px-3 py-2 rounded border dark:border-gray-800">Choose Image</button>
          <input ref={inputRef} onChange={onFile} type="file" accept="image/*" className="hidden" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/50">
          <div className="text-sm mb-2">Input</div>
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden grid place-items-center">
            {preview ? (
              <img src={preview} alt="input" className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-gray-500">No image selected</div>
            )}
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <button disabled={busy} onClick={() => run('/ai/background-remove')} className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white">Remove BG</button>
            <button disabled={busy} onClick={() => run('/ai/enhance')} className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white">Enhance</button>
            <button disabled={busy} onClick={() => run('/ai/upscale')} className="px-3 py-2 rounded bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white">Upscale x2</button>
          </div>
        </div>
        <div className="rounded-xl border dark:border-gray-800 p-3 bg-white/70 dark:bg-gray-900/50">
          <div className="text-sm mb-2">Result</div>
          <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden grid place-items-center">
            {resultUrl ? (
              <img src={`${API_BASE}${resultUrl}`} alt="result" className="w-full h-full object-contain" />
            ) : (
              <div className="text-xs text-gray-500">Run a tool to see the result</div>
            )}
          </div>
          {resultUrl && (
            <div className="mt-3">
              <a href={`${API_BASE}${resultUrl}`} download className="px-3 py-2 rounded border dark:border-gray-800 inline-block">Download</a>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
