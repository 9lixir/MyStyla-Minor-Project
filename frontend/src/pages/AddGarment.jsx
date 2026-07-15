import { useState } from "react"
import { API_BASE_URL } from "../config"

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

      const response = await fetch(`${API_BASE_URL}/scanning/upload`, {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-teal-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button 
            onClick={onBack} 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white transition-colors duration-200 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Garment</h1>
            <p className="text-sm text-gray-500 mt-1">Upload a photo of your clothing item</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Instructions */}
          <div className="bg-gradient-to-r from-pink-500 to-teal-500 px-6 sm:px-8 py-6">
            <h2 className="text-white font-semibold mb-2">Getting the best results</h2>
            <ul className="text-white text-sm space-y-1 opacity-90">
              <li>✓ Center the garment in frame</li>
              <li>✓ Ensure good lighting</li>
              <li>✓ Use clear, high-quality images</li>
            </ul>
          </div>

          {/* Upload Area */}
          <div className="p-6 sm:p-8">
            {/* Preview or Upload Prompt */}
            <div className="mb-6">
              <label className="block">
                <div className="border-3 border-dashed border-gray-200 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer hover:border-pink-400 hover:bg-pink-50/30 transition-all duration-200 bg-gray-50">
                  {preview ? (
                    <div className="text-center">
                      <img 
                        src={preview} 
                        alt="preview" 
                        className="max-h-96 object-contain rounded-lg shadow-md mb-4" 
                      />
                      <p className="text-sm text-gray-600 font-medium">Click to change image</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-1">Add Garment Photo</p>
                      <p className="text-gray-500 text-sm mb-2">Drag and drop or click to select</p>
                      <p className="text-xs text-gray-400">JPG, PNG, or WebP (max 10MB)</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">Upload failed</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Choose Photo
                </button>
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
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-7" />
                      </svg>
                      Upload & Scan
                    </>
                  )}
                </button>
              )}
            </div>

            {loading && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm text-center">
                  <span className="font-semibold">Processing your garment...</span><br />
                  This may take a moment while we analyze the image.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}