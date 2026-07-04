import { useState } from "react"

export default function AddGarment({ onSuccess, onBack }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleFileChange(e) {
    const selected = e.target.files[0]
    if (!selected) return
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError(null)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://localhost:8000/scanning/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || "Upload failed")
      }

      const data = await response.json()
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Add Garment</h1>
      </div>

      <p className="text-gray-500 mb-6">Scan or upload a photo of your clothing item</p>

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 mb-4 flex flex-col items-center justify-center bg-white">
        {preview ? (
          <img src={preview} alt="preview" className="max-h-64 object-contain rounded-lg" />
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-5xl mb-3">Add clothes</div>
            <p>No image selected</p>
            <p className="text-sm">Center the garment in frame for best results</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 rounded-lg p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Buttons */}
      <label className="block w-full bg-black text-white text-center py-3 rounded-xl cursor-pointer mb-3 font-medium hover:bg-gray-800 transition">
        📷 Choose Photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full border border-black text-black py-3 rounded-xl font-medium hover:bg-gray-50 transition disabled:opacity-50"
        >
          {loading ? "Processing... this may take a moment" : "Upload & Scan Garment"}
        </button>
      )}
    </div>
  )
}