import { useState, useRef, useEffect, useCallback } from "react"
import { API_BASE_URL } from "../config"

function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [devices, setDevices] = useState([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(async (deviceId) => {
    setError(null)
    setReady(false)
    stopStream()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: "environment" } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setReady(true)

      // Populate the device list once we have permission (labels are blank until then).
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter(d => d.kind === "videoinput"))
    } catch (err) {
      setError(
        err.name === "NotAllowedError"
          ? "Camera access was denied. Allow camera permission and try again."
          : err.name === "NotFoundError"
          ? "No camera was found on this device."
          : "Couldn't start the camera. Try again or upload a photo instead."
      )
    }
  }, [stopStream])

  useEffect(() => {
    startStream()
    return () => stopStream()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSwitchCamera() {
    if (devices.length < 2) return
    const nextIndex = (deviceIndex + 1) % devices.length
    setDeviceIndex(nextIndex)
    startStream(devices[nextIndex].deviceId)
  }

  function handleShutter() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext("2d").drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
        stopStream()
        onCapture(file)
      },
      "image/jpeg",
      0.92
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-dashed border-[#2A3374] bg-black">
        {error ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center">
            <svg className="h-8 w-8 text-[#FFA8D4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 18a8 8 0 100-16 8 8 0 000 16zM12 8v4m0 4h.01" />
            </svg>
            <p className="text-sm text-[#FFD3EC]">{error}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-72 w-full object-cover sm:h-96"
            />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm text-white">
                Starting camera...
              </div>
            )}
            {ready && (
              <div className="pointer-events-none absolute inset-6 rounded-xl border-2 border-white/30" />
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex w-full items-center justify-center gap-6">
        <button
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2A3374] bg-[#1E2560] text-[#B9C0E8] transition hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5]"
          title="Cancel"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={handleShutter}
          disabled={!ready || !!error}
          className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[linear-gradient(135deg,#F5A9CE_0%,#FF4FA0_100%)] shadow-lg transition disabled:cursor-not-allowed disabled:opacity-40"
          title="Capture"
        >
          <span className="h-11 w-11 rounded-full bg-white" />
        </button>

        <button
          onClick={handleSwitchCamera}
          disabled={devices.length < 2}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2A3374] bg-[#1E2560] text-[#B9C0E8] transition hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5] disabled:cursor-not-allowed disabled:opacity-30"
          title="Switch camera"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AddGarment({ onSuccess, onBack }) {
  const [mode, setMode] = useState("upload") // "upload" | "camera"
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function setFileAndPreview(selected) {
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setError(null)
  }

  function handleFileChange(e) {
    const selected = e.target.files[0]
    if (!selected) return
    setFileAndPreview(selected)
  }

  function handleCapture(capturedFile) {
    setFileAndPreview(capturedFile)
    setMode("upload") // drop back to the preview/upload view with the captured shot loaded
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
    <div className="mystyla-app-shell min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8] transition-colors duration-200 hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="mystyla-masthead mb-1 text-[10px]">scan studio</p>
            <h1 className="mystyla-display text-4xl text-[#F5F3FF]">Add Garment</h1>
            <p className="mt-1 text-sm text-[#B9C0E8]">Upload a photo or capture one with your camera</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 shadow-lg">
          <div className="bg-[linear-gradient(135deg,#F5A9CE_0%,#FF4FA0_100%)] px-6 py-6 sm:px-8">
            <h2 className="mb-2 font-semibold text-white">Getting the best results</h2>
            <ul className="space-y-1 text-sm text-white/90">
              <li>Center the garment in frame</li>
              <li>Use soft, bright lighting</li>
              <li>Choose a clear image under 10MB</li>
            </ul>
          </div>

          <div className="p-6 sm:p-8">
            {/* Mode switcher */}
            <div className="mb-6 flex gap-2 rounded-xl border border-[#2A3374] bg-[#1E2560] p-1">
              <button
                onClick={() => setMode("upload")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                  mode === "upload" ? "bg-[#F5A9CE] text-white" : "text-[#B9C0E8] hover:text-[#F5F3FF]"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Photo
              </button>
              <button
                onClick={() => setMode("camera")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                  mode === "camera" ? "bg-[#F5A9CE] text-white" : "text-[#B9C0E8] hover:text-[#F5F3FF]"
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use Camera
              </button>
            </div>

            {mode === "camera" ? (
              <div className="mb-6">
                <CameraCapture onCapture={handleCapture} onCancel={() => setMode("upload")} />
              </div>
            ) : (
              <div className="mb-6">
                <label className="block">
                  <div className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2A3374] bg-[#1E2560] p-8 transition-all duration-200 hover:border-[#FFD3EC]/70 sm:p-12">
                    {preview ? (
                      <div className="text-center">
                        <img
                          src={preview}
                          alt="preview"
                          className="max-h-96 object-contain rounded-lg shadow-md mb-4"
                        />
                        <p className="text-sm font-medium text-[#B9C0E8]">Click to change image</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#F5A9CE]/15">
                          <svg className="h-8 w-8 text-[#FFD3EC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <p className="mb-1 text-lg font-semibold text-[#F5F3FF]">Add Garment Photo</p>
                        <p className="mb-2 text-sm text-[#B9C0E8]">Drag and drop or click to select</p>
                        <p className="text-xs text-[#9AA8E0]">JPG, PNG, or WebP (max 10MB)</p>
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
            )}

            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#FF4FA0]/40 bg-[#FF4FA0]/10 p-4">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#FFCBE8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-medium text-[#F5F3FF]">Upload failed</p>
                  <p className="text-sm text-[#FFCBE8]">{error}</p>
                </div>
              </div>
            )}

            {mode === "upload" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#2A3374] bg-[#1E2560] px-4 py-3 font-semibold text-[#F5F3FF] transition-colors duration-200 hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5]">
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
                    className="mystyla-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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
            )}

            {loading && (
              <div className="mt-6 rounded-xl border border-[#2A3374] bg-[#1E2560] p-4">
                <p className="text-center text-sm text-[#B9C0E8]">
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