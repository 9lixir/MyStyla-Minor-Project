import { useMemo, useState } from "react"
import { API_BASE_URL } from "../config"
import { useAuthStore } from "@/store/auth-store"

<<<<<<< HEAD
const TAG_OPTIONS = {
  formality: ["casual", "business casual", "formal", "athletic"],
  season: ["summer", "winter", "spring", "autumn", "all-season"],
  pattern: ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"],
  occasion: ["everyday wear", "work", "party", "workout", "formal event"],
}

const FIELD_TITLES = {
  formality: "Formality",
  season: "Season",
  pattern: "Pattern",
  occasion: "Occasion",
}

export default function ReviewTags({ garment, onBack, onSave }) {
  const [selectedTags, setSelectedTags] = useState(garment?.tags || {})
  const flags = garment?.flags || {}

  if (!garment) return null

  function selectTag(field, value) {
    const predicted = garment.tags[field]
    if (value !== predicted) {
      fetch(
        `http://localhost:8000/classification/garments/${garment.garment_id}/correct-tag?field=${field}&predicted=${predicted}&corrected=${value}`,
        { method: "POST" }
      )
    }
    setSelectedTags((prev) => ({ ...prev, [field]: value }))
=======
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

    const source = garment?.suggested_classification || garment?.tags || {}

    return {
      category: source.category || fallback.category,
      formality: source.formality || fallback.formality,
      season: source.season || fallback.season,
      pattern: source.pattern || fallback.pattern,
      occasion: source.occasion?.length > 0 ? source.occasion : fallback.occasion,
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
>>>>>>> main
  }

  return (
    <div className="mystyla-app-shell mx-auto max-w-md p-6 min-h-screen">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-3 py-1.5 text-sm text-[#B9C0E8] transition hover:border-[#FF6FB5]/70 hover:text-[#FF6FB5]"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-[#F5F3FF]">Review Tags</h1>
      </div>

      <p className="mb-4 text-[#B9C0E8]">Confirm or edit garment details</p>

      <div className="mb-4 flex h-48 items-center justify-center rounded-xl border border-[#2A3374] bg-[#151A4D]/90 p-4 shadow-sm">
        <img
          src={`${API_BASE_URL}/${garment.cutout}`}
          alt="Garment cutout"
          className="h-full object-contain"
          onError={(e) => { e.target.style.display = "none" }}
        />
      </div>

      <div className="mb-4 rounded-xl border border-[#2A3374] bg-[#151A4D]/90 p-4 shadow-sm">
        <p className="mb-2 text-sm font-medium text-[#F5F3FF]">Dominant Colors</p>
        <div className="flex gap-3">
          {garment.dominant_colors?.map((color, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-full border border-[#2A3374]"
                style={{ backgroundColor: color.hex }}
              />
              <span className="text-xs text-[#B9C0E8]">{color.hex}</span>
            </div>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {selectedTags.category && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <p className="text-xs text-gray-500 mb-1">Category</p>
          <p className="text-sm font-medium text-gray-800 capitalize">{selectedTags.category}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Tags</p>

        {Object.keys(FIELD_TITLES).map((field) => {
          const isFlagged = flags[field]

          return (
            <div key={field} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs text-gray-500">{FIELD_TITLES[field]}</p>
                {isFlagged && (
                  <span className="text-xs text-red-600 font-medium">
                    ⚠ Low confidence — please review
                  </span>
                )}
              </div>

              {isFlagged ? (
                <div className="flex gap-2 flex-wrap">
                  {TAG_OPTIONS[field].map((option) => {
                    const isSelected = selectedTags[field] === option
                    return (
                      <button
                        key={option}
                        onClick={() => selectTag(field, option)}
                        className={`px-3 py-1 rounded-full text-xs capitalize transition border ${
                          isSelected
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs capitalize bg-gray-100 text-gray-700">
                  {selectedTags[field]}
                </span>
              )}
            </div>
          )
        })}
=======
      <div className="mb-6 rounded-xl border border-[#2A3374] bg-[#151A4D]/90 p-4 shadow-sm">
        <p className="mb-3 text-sm font-medium text-[#F5F3FF]">
          Tags
          <span className="ml-2 text-xs text-[#9AA8E0]">(editable)</span>
        </p>

        <div className="mb-3">
          <p className="mb-1 text-xs text-[#B9C0E8]">Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] focus:border-[#FF6FB5] focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-xs text-[#B9C0E8]">Formality</p>
          <select
            value={formality}
            onChange={(e) => setFormality(e.target.value)}
            className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] focus:border-[#FF6FB5] focus:outline-none"
          >
            {FORMALITY_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-xs text-[#B9C0E8]">Season</p>
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] focus:border-[#FF6FB5] focus:outline-none"
          >
            {SEASON_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <p className="mb-1 text-xs text-[#B9C0E8]">Pattern</p>
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] focus:border-[#FF6FB5] focus:outline-none"
          >
            {PATTERN_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-1 text-xs text-[#B9C0E8]">Occasion</p>
          <div className="flex gap-2 flex-wrap">
            {OCCASION_OPTIONS.map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => toggleOccasion(value)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  occasion.includes(value)
                    ? "border-[#FF6FB5] bg-[#FF6FB5]/15 text-[#FF7AB8]"
                    : "border-[#2A3374] bg-[#1E2560] text-[#B9C0E8] hover:border-[#FFD3EC]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
>>>>>>> main
      </div>

      {error ? <p className="mb-3 text-sm text-[#FF7AB8]">{error}</p> : null}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-xl bg-[linear-gradient(135deg,#F5A9CE_0%,#FF93C2_58%,#FF6FB5_100%)] py-3 font-medium text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save to Wardrobe"}
      </button>
    </div>
  )
}
