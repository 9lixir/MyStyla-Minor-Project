import { useMemo, useState } from "react"
import { API_BASE_URL } from "../config"
import { useAuthStore } from "@/store/auth-store"

const CATEGORY_OPTIONS = ["top", "bottom", "dress", "outerwear"]
const FORMALITY_OPTIONS = ["Casual", "Smart Casual", "Formal"]
const SEASON_OPTIONS = ["Spring", "Summer", "Autumn", "Winter"]
const PATTERN_OPTIONS = ["Solid", "Striped", "Checked", "Graphic", "Floral"]
const OCCASION_OPTIONS = ["Casual", "Office", "Party", "Date", "Farewell"]

export default function ReviewTags({ garment, onBack, onSave }) {
  const initialClassification = useMemo(() => {
    const fallback = {
      category: "top",
      formality: "Casual",
      season: "Summer",
      pattern: "Solid",
      occasion: ["Casual"],
    }

    if (!garment?.suggested_classification) {
      return fallback
    }

    return {
      category: garment.suggested_classification.category || fallback.category,
      formality: garment.suggested_classification.formality || fallback.formality,
      season: garment.suggested_classification.season || fallback.season,
      pattern: garment.suggested_classification.pattern || fallback.pattern,
      occasion:
        garment.suggested_classification.occasion?.length > 0
          ? garment.suggested_classification.occasion
          : fallback.occasion,
    }
  }, [garment])

  const [category, setCategory] = useState(initialClassification.category)
  const [formality, setFormality] = useState(initialClassification.formality)
  const [season, setSeason] = useState(initialClassification.season)
  const [pattern, setPattern] = useState(initialClassification.pattern)
  const [occasion, setOccasion] = useState(initialClassification.occasion)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!garment) return null

  const toggleOccasion = (value) => {
    setOccasion((prev) => {
      if (prev.includes(value)) {
        const next = prev.filter((item) => item !== value)
        return next.length > 0 ? next : prev
      }
      return [...prev, value]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")

    try {
      const userId = useAuthStore.getState().user?.id || null
      const response = await fetch(`${API_BASE_URL}/scanning/garments/${garment.garment_id}/classification`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          category,
          formality,
          season,
          pattern,
          occasion,
        }),
      })

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload.detail || "Failed to save classification")
      }

      onSave()
    } catch (err) {
      setError(err.message || "Failed to save classification")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Review Tags</h1>
      </div>

      <p className="text-gray-500 mb-4">Confirm or edit garment details</p>

      {/* Cutout Preview */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-center h-48">
        <img
          src={`${API_BASE_URL}/${garment.cutout}`}
          alt="Garment cutout"
          className="h-full object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Dominant Colors */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Dominant Colors</p>
        <div className="flex gap-3">
          {garment.dominant_colors?.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-10 h-10 rounded-full border border-gray-200"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs text-gray-500">{color.hex}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Tags 
          <span className="text-xs text-gray-400 ml-2">(editable)</span>
        </p>

        {/* Category */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {CATEGORY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Formality */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Formality</p>
          <select
            value={formality}
            onChange={(e) => setFormality(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {FORMALITY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Season */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Season</p>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {SEASON_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Pattern */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Pattern</p>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
          >
            {PATTERN_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {/* Occasion */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Occasion</p>
          <div className="flex gap-2 flex-wrap">
            {OCCASION_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => toggleOccasion(value)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  occasion.includes(value)
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600 mb-3">{error}</p> : null}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : "Save to Wardrobe"}
      </button>
    </div>
  )
}