import { useState, useRef, useEffect, useCallback } from "react"

import { API_BASE_URL } from "../config"

const LAVENDER = "#D8C9E8"

function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [devices, setDevices] = useState([])
  const [deviceIndex, setDeviceIndex] = useState(0)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startStream = useCallback(
    async (deviceId) => {
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

        const all = await navigator.mediaDevices.enumerateDevices()

        setDevices(all.filter((d) => d.kind === "videoinput"))
      } catch (err) {
        setError(
          err.name === "NotAllowedError"
            ? "Camera access was denied. Allow camera permission and try again."
            : err.name === "NotFoundError"
            ? "No camera was found on this device."
            : "Couldn't start the camera. Try again or upload a photo instead."
        )
      }
    },
    [stopStream]
  )

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

        const file = new File(
          [blob],
          `capture-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        )

        stopStream()
        onCapture(file)
      },
      "image/jpeg",
      0.92
    )
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full overflow-hidden rounded-[1.5rem] border-2 bg-black shadow-2xl"
        style={{ borderColor: LAVENDER }}
      >
        {error ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 p-6 text-center sm:h-[30rem]">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{
                background: "rgba(216,201,232,0.12)",
              }}
            >
              <svg
                className="h-7 w-7"
                style={{ color: LAVENDER }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM12 8v4m0 4h.01"
                />
              </svg>
            </div>

            <p className="max-w-sm text-sm text-white">
              {error}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-72 w-full object-cover sm:h-[30rem]"
            />

            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                Starting camera...
              </div>
            )}

            {ready && (
              <>
                <div className="pointer-events-none absolute inset-5 rounded-2xl border border-white/20 sm:inset-8" />

                <div className="pointer-events-none absolute left-8 top-8 h-10 w-10 border-l-2 border-t-2 border-white/70" />

                <div className="pointer-events-none absolute right-8 top-8 h-10 w-10 border-r-2 border-t-2 border-white/70" />

                <div className="pointer-events-none absolute bottom-8 left-8 h-10 w-10 border-b-2 border-l-2 border-white/70" />

                <div className="pointer-events-none absolute bottom-8 right-8 h-10 w-10 border-b-2 border-r-2 border-white/70" />
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex w-full items-center justify-center gap-7">
        <button
          onClick={() => {
            stopStream()
            onCancel()
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5"
          style={{
            borderColor: "var(--mystyla-border)",
            background: "var(--mystyla-surface-2)",
            color: "var(--mystyla-muted)",
          }}
          title="Cancel"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <button
          onClick={handleShutter}
          disabled={!ready || !!error}
          className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-4 border-white shadow-xl transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background:
              "linear-gradient(135deg, var(--mystyla-rose) 0%, var(--mystyla-primary) 100%)",
          }}
          title="Capture"
        >
          <span className="h-12 w-12 rounded-full bg-white" />
        </button>

        <button
          onClick={handleSwitchCamera}
          disabled={devices.length < 2}
          className="flex h-11 w-11 items-center justify-center rounded-full border transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            borderColor: "var(--mystyla-border)",
            background: "var(--mystyla-surface-2)",
            color: "var(--mystyla-muted)",
          }}
          title="Switch camera"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function AddGarment({ onSuccess, onBack }) {
  const [mode, setMode] = useState("upload")
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef(null)
  const previousPreviewRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previousPreviewRef.current) {
        URL.revokeObjectURL(previousPreviewRef.current)
      }
    }
  }, [])

  function setFileAndPreview(selected) {
    if (!selected) return

    if (
      !["image/jpeg", "image/png", "image/webp"].includes(
        selected.type
      )
    ) {
      setError("Please choose a JPG, PNG or WebP image.")
      return
    }

    if (selected.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10MB.")
      return
    }

    if (previousPreviewRef.current) {
      URL.revokeObjectURL(previousPreviewRef.current)
    }

    const previewUrl = URL.createObjectURL(selected)

    previousPreviewRef.current = previewUrl

    setFile(selected)
    setPreview(previewUrl)
    setError(null)
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0]

    if (!selected) return

    setFileAndPreview(selected)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)

    const selected = e.dataTransfer.files?.[0]

    if (selected) {
      setFileAndPreview(selected)
    }
  }

  function handleCapture(capturedFile) {
    setFileAndPreview(capturedFile)
    setMode("upload")
  }

  async function handleUpload() {
    if (!file || loading) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()

      formData.append("file", file)

      const response = await fetch(
        `${API_BASE_URL}/scanning/upload`,
        {
          method: "POST",
          body: formData,
        }
      )

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || "Upload failed")
      }

      const data = await response.json()

      onSuccess(data)
    } catch (err) {
      setError(err.message || "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mystyla-app-shell relative min-h-screen overflow-hidden p-4 sm:p-6">
      <div
        className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{
          background: "var(--mystyla-rose)",
        }}
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full opacity-25 blur-3xl"
        style={{
          background: LAVENDER,
        }}
      />

      <div className="relative mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-x-0.5"
            style={{
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
              color: "var(--mystyla-muted)",
            }}
            title="Back"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <h1
            className="mystyla-display text-4xl sm:text-5xl"
            style={{
              color: "var(--mystyla-ink)",
            }}
          >
            Add Garment
          </h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">

          {/* Editor's note */}
  <div className="relative mx-auto mt-8 max-w-sm overflow-hidden rounded-[22px] border"
  style={{
    borderColor: "var(--mystyla-border)",
    background: "var(--mystyla-surface)",
  }}
>
  <div className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide">
    
    <div className="min-w-full snap-center px-6 py-5">
      <p
        className="mb-2 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: "var(--mystyla-primary)" }}
      >
        note
      </p>
      <p
        className="text-[15px] leading-relaxed"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: "var(--mystyla-ink)",
        }}
      >
        Keep your garment against a neutral background.
      </p>
      <div className="mt-4 flex justify-end text-sm" style={{ color: "var(--mystyla-muted)" }}>
        →
      </div>
    </div>

    <div className="min-w-full snap-center px-6 py-5">
      <p
        className="mb-2 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: "var(--mystyla-primary)" }}
      >
        Note
      </p>
      <p
        className="text-[15px] leading-relaxed"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: "var(--mystyla-ink)",
        }}
      >
        Good, even lighting helps us read the garment clearly.
      </p>
      <div className="mt-4 flex justify-between text-sm" style={{ color: "var(--mystyla-muted)" }}>
        <span>←</span>
        <span>→</span>
      </div>
    </div>

    <div className="min-w-full snap-center px-6 py-5">
      <p
        className="mb-2 text-[11px] uppercase tracking-[0.16em]"
        style={{ color: "var(--mystyla-primary)" }}
      >
        note
      </p>
      <p
        className="text-[15px] leading-relaxed"
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          color: "var(--mystyla-ink)",
        }}
      >
        Keep the frame clean — no clutter around the garment.
      </p>
      <div className="mt-4 flex justify-start text-sm" style={{ color: "var(--mystyla-muted)" }}>
        ←
      </div>
    </div>

  </div>
</div>

          {/* Scanner */}
          <main
            className="overflow-hidden rounded-[2rem] border shadow-xl"
            style={{
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
            }}
          >
            <div className="p-5 sm:p-7">

              {/* Mode switcher */}
              <div
                className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border p-1"
                style={{
                  borderColor:
                    "var(--mystyla-border)",
                  background:
                    "var(--mystyla-surface-2)",
                }}
              >
                <button
                  onClick={() => setMode("upload")}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200"
                  style={
                    mode === "upload"
                      ? {
                          background:
                            "var(--mystyla-primary)",
                          color: "#fff",
                          boxShadow:
                            "0 4px 12px rgba(0,0,0,0.08)",
                        }
                      : {
                          color:
                            "var(--mystyla-muted)",
                        }
                  }
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12"
                    />
                  </svg>

                  Upload Photo
                </button>

                <button
                  onClick={() => setMode("camera")}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200"
                  style={
                    mode === "camera"
                      ? {
                          background: LAVENDER,
                          color:
                            "var(--mystyla-ink)",
                          boxShadow:
                            "0 4px 12px rgba(0,0,0,0.08)",
                        }
                      : {
                          color:
                            "var(--mystyla-muted)",
                        }
                  }
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>

                  Use Camera
                </button>
              </div>

              {mode === "camera" ? (
                <CameraCapture
                  onCapture={handleCapture}
                  onCancel={() =>
                    setMode("upload")
                  }
                />
              ) : (
                <>
                  <label className="block">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                      }}
                      onDragLeave={() =>
                        setIsDragging(false)
                      }
                      onDrop={handleDrop}
                      className="group relative flex min-h-[25rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[1.5rem] border p-8 transition-all duration-300 hover:-translate-y-0.5"
                      style={{
                        borderColor:
                          isDragging || preview
                            ? "var(--mystyla-primary)"
                            : "var(--mystyla-border)",
                        background:
                          isDragging
                            ? "var(--mystyla-primary-soft)"
                            : "var(--mystyla-surface-2)",
                      }}
                    >
                      <span
                        className="pointer-events-none absolute left-4 top-4 h-8 w-8 rounded-tl-lg border-l-2 border-t-2"
                        style={{
                          borderColor:
                            "var(--mystyla-primary)",
                        }}
                      />

                      <span
                        className="pointer-events-none absolute right-4 top-4 h-8 w-8 rounded-tr-lg border-r-2 border-t-2"
                        style={{
                          borderColor:
                            "var(--mystyla-primary)",
                        }}
                      />

                      <span
                        className="pointer-events-none absolute bottom-4 left-4 h-8 w-8 rounded-bl-lg border-b-2 border-l-2"
                        style={{
                          borderColor:
                            "var(--mystyla-primary)",
                        }}
                      />

                      <span
                        className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 rounded-br-lg border-b-2 border-r-2"
                        style={{
                          borderColor:
                            "var(--mystyla-primary)",
                        }}
                      />

                      {preview ? (
                        <div className="relative z-10 text-center">
                          <div
                            className="mb-5 overflow-hidden rounded-2xl border p-2 shadow-lg"
                            style={{
                              borderColor:
                                "var(--mystyla-border)",
                              background:
                                "var(--mystyla-surface)",
                            }}
                          >
                            <img
                              src={preview}
                              alt="Garment preview"
                              className="max-h-[22rem] max-w-full rounded-xl object-contain"
                            />
                          </div>

                          <p
                            className="text-sm font-medium"
                            style={{
                              color:
                                "var(--mystyla-ink)",
                            }}
                          >
                            Looks good. Click to replace.
                          </p>

                          <p
                            className="mt-1 text-xs"
                            style={{
                              color:
                                "var(--mystyla-muted)",
                            }}
                          >
                            {file?.name ||
                              "Selected image"}
                          </p>
                        </div>
                      ) : (
                        <div className="relative z-10 text-center">
                          <div
                            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-105"
                            style={{
                              background:
                                "var(--mystyla-primary-soft)",
                            }}
                          >
                            <svg
                              className="h-9 w-9"
                              style={{
                                color:
                                  "var(--mystyla-primary)",
                              }}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </div>

                          <p
                            className="mb-2 text-2xl"
                            style={{
                              fontFamily:
                                "'Fraunces', Georgia, serif",
                              color:
                                "var(--mystyla-ink)",
                            }}
                          >
                            Drop your garment here
                          </p>

                          <p
                            className="mb-4 text-sm"
                            style={{
                              color:
                                "var(--mystyla-muted)",
                            }}
                          >
                            or click anywhere to browse
                          </p>

                          <span
                            className="rounded-full border px-3 py-1.5 text-[9px] uppercase tracking-[0.16em]"
                            style={{
                              borderColor:
                                "var(--mystyla-border)",
                              color:
                                "var(--mystyla-muted)",
                              background:
                                "var(--mystyla-surface)",
                            }}
                          >
                            JPG · PNG · WEBP · MAX 10MB
                          </span>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </label>

                  {error && (
                    <div
                      className="mt-5 rounded-2xl border p-4"
                      style={{
                        borderColor:
                          "rgba(181,41,63,0.35)",
                        background:
                          "rgba(181,41,63,0.08)",
                      }}
                    >
                      <p
                        className="text-sm"
                        style={{
                          color:
                            "var(--mystyla-primary)",
                        }}
                      >
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3.5 font-semibold transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor:
                          "var(--mystyla-border)",
                        background:
                          "var(--mystyla-surface-2)",
                        color:
                          "var(--mystyla-ink)",
                      }}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12"
                        />
                      </svg>

                      Choose Photo
                    </button>

                    {file && (
                      <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="mystyla-button flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {loading ? (
                          <>
                            <svg
                              className="h-5 w-5 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>

                            Processing...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-7"
                              />
                            </svg>

                            Upload & Scan
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {loading && (
                    <div
                      className="mt-5 overflow-hidden rounded-2xl border"
                      style={{
                        borderColor:
                          "var(--mystyla-border)",
                        background:
                          "var(--mystyla-surface-2)",
                      }}
                    >
                      <div
                        className="h-1 w-1/2 animate-pulse"
                        style={{
                          background:
                            "var(--mystyla-primary)",
                        }}
                      />

                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <svg
                            className="h-4 w-4 animate-spin"
                            style={{
                              color:
                                "var(--mystyla-primary)",
                            }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v1m0 14v1m8-8h-1M5 12H4m13.657-5.657l-.707.707M7.05 16.95l-.707.707m9.9 9.9l.707.707"
                            />
                          </svg>

                          <p
                            className="text-sm font-medium"
                            style={{
                              color:
                                "var(--mystyla-ink)",
                            }}
                          >
                            Reading garment...
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}