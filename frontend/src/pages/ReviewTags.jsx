import { useMemo, useState } from "react"
import { API_BASE_URL } from "../config"
import { useAuthStore } from "@/store/auth-store"
import AbstractBackground from "../components/AbstractBackground"
import {
  CATEGORY_GROUPS,
  FORMALITY_LABELS,
  SEASON_LABELS,
  PATTERN_LABELS,
  OCCASION_LABELS,
} from "@/lib/categories"

// Option lists are DERIVED from the shared taxonomy in lib/categories.js --
// never hardcoded here. A hardcoded copy silently drifted from the backend and
// caused every unlisted category (e.g. "leather jacket") to render as the first
// option, "T-Shirt", because a <select> with an unmatched value falls back to
// selectedIndex 0.
const titleCase = (value) =>
  String(value)
    .split(/([\s-])/)
    .map((part) => (/^[\s-]$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join("")

const CATEGORY_OPTION_GROUPS = CATEGORY_GROUPS.map((group) => ({
  label: group.label,
  options: group.categories.map((value) => ({ value, label: titleCase(value) })),
}))

const KNOWN_CATEGORY_VALUES = new Set(
  CATEGORY_GROUPS.flatMap((group) => group.categories)
)

export default function ReviewTags({ garment, onBack, onSave }) {
  const flags = garment?.flags || {}

  const initialClassification = useMemo(() => {
    const fallback = {
      // Deliberately empty, not "t-shirt": a missing category should be visible,
      // not disguised as a confident prediction.
      category: "",
      formality: "casual",
      season: "all-season",
      pattern: "solid",
      occasion: ["everyday wear"],
    }

    const source = garment?.suggested_classification || garment?.tags || {}

    return {
      category: source.category ? String(source.category).toLowerCase() : fallback.category,
      formality: source.formality ? String(source.formality).toLowerCase() : fallback.formality,
      season: source.season ? String(source.season).toLowerCase() : fallback.season,
      pattern: source.pattern ? String(source.pattern).toLowerCase() : fallback.pattern,
      occasion:
        Array.isArray(source.occasion) && source.occasion.length > 0
          ? source.occasion.map((o) => String(o).toLowerCase())
          : typeof source.occasion === "string"
          ? [source.occasion.toLowerCase()]
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

  const hasAnyWarnings = Object.values(flags).some(Boolean)

  // The backend sent a category this UI has no option for -- surface it loudly
  // instead of quietly showing the wrong garment type.
  const categoryUnrecognized = Boolean(category) && !KNOWN_CATEGORY_VALUES.has(category)

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
    if (!category) {
      setError("Please choose a category before saving")
      return
    }

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
          category: String(category).toLowerCase(),
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
    <div className="mystyla-app-shell relative min-h-screen p-6">
      <AbstractBackground />
      <div className="relative mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-full border px-3 py-1.5 text-sm transition"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--mystyla-primary)'
              e.currentTarget.style.color = 'var(--mystyla-primary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--mystyla-border)'
              e.currentTarget.style.color = 'var(--mystyla-muted)'
            }}
          >
            Back
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--mystyla-ink)' }}>Review Tags</h1>
        </div>

        <p className="mb-4" style={{ color: 'var(--mystyla-muted)' }}>Confirm or edit garment details</p>

        {/* Preview Box */}
        <div
          className="mb-4 flex h-48 items-center justify-center rounded-xl border p-4 shadow-sm"
          style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
        >
          <img
            src={`${API_BASE_URL}/${garment.cutout}`}
            alt="Garment cutout"
            className="h-full object-contain"
            onError={(e) => { e.target.style.display = "none" }}
          />
        </div>

        {/* Colors Row */}
        <div
          className="mb-4 rounded-xl border p-4 shadow-sm"
          style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
        >
          <p className="mb-2 text-sm font-medium" style={{ color: 'var(--mystyla-ink)' }}>Dominant Colors</p>
          <div className="flex gap-3">
            {garment.dominant_colors?.map((color, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="h-10 w-10 rounded-full border"
                  style={{ backgroundColor: color.hex, borderColor: 'var(--mystyla-border)' }}
                />
                <span className="text-xs" style={{ color: 'var(--mystyla-muted)' }}>{color.hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fields Container */}
        <div
          className="mb-6 rounded-xl border p-4 shadow-sm"
          style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
        >
          <p className="mb-3 text-sm font-medium" style={{ color: 'var(--mystyla-ink)' }}>
            Tags <span className="ml-2 text-xs" style={{ color: 'var(--mystyla-muted)' }}>(editable)</span>
          </p>

          {hasAnyWarnings && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-600">
              ⚠️ <strong>Low confidence tags detected.</strong> Please cross-check fields highlighted below.
            </div>
          )}

          {categoryUnrecognized && (
            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs text-amber-700">
              ⚠️ <strong>Unrecognized category from server:</strong> "{category}". This UI has no matching
              option — the taxonomy in <code>lib/categories.js</code> is out of sync with the backend.
            </div>
          )}

          {/* Category */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>Category</p>
              {flags.category && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: 'var(--mystyla-primary)' }}>⚠️ Low confidence</span>
              )}
            </div>
            <select
              value={categoryUnrecognized ? "" : category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors"
              style={{
                background: 'var(--mystyla-surface-2)',
                color: 'var(--mystyla-ink)',
                borderColor: flags.category || categoryUnrecognized ? 'var(--mystyla-primary)' : 'var(--mystyla-border)',
              }}
            >
              {(categoryUnrecognized || !category) && (
                <option value="" disabled>
                  {categoryUnrecognized ? `— unrecognized: ${category} —` : "— select a category —"}
                </option>
              )}
              {CATEGORY_OPTION_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Formality */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>Formality</p>
              {flags.formality && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: 'var(--mystyla-primary)' }}>⚠️ Low confidence</span>
              )}
            </div>
            <select
              value={formality}
              onChange={(e) => setFormality(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors capitalize"
              style={{
                background: 'var(--mystyla-surface-2)',
                color: 'var(--mystyla-ink)',
                borderColor: flags.formality ? 'var(--mystyla-primary)' : 'var(--mystyla-border)',
              }}
            >
              {FORMALITY_LABELS.map((value) => (
                <option key={value} value={value} className="capitalize">{value}</option>
              ))}
            </select>
          </div>

          {/* Season */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>Season</p>
              {flags.season && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: 'var(--mystyla-primary)' }}>⚠️ Low confidence</span>
              )}
            </div>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors capitalize"
              style={{
                background: 'var(--mystyla-surface-2)',
                color: 'var(--mystyla-ink)',
                borderColor: flags.season ? 'var(--mystyla-primary)' : 'var(--mystyla-border)',
              }}
            >
              {SEASON_LABELS.map((value) => (
                <option key={value} value={value} className="capitalize">{value}</option>
              ))}
            </select>
          </div>

          {/* Pattern */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>Pattern</p>
              {flags.pattern && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: 'var(--mystyla-primary)' }}>⚠️ Low confidence</span>
              )}
            </div>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none transition-colors capitalize"
              style={{
                background: 'var(--mystyla-surface-2)',
                color: 'var(--mystyla-ink)',
                borderColor: flags.pattern ? 'var(--mystyla-primary)' : 'var(--mystyla-border)',
              }}
            >
              {PATTERN_LABELS.map((value) => (
                <option key={value} value={value} className="capitalize">{value}</option>
              ))}
            </select>
          </div>

          {/* Occasion */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <p className="text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>Occasion</p>
              {flags.occasion && (
                <span className="text-[10px] font-bold animate-pulse" style={{ color: 'var(--mystyla-primary)' }}>⚠️ Low confidence</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {OCCASION_LABELS.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => toggleOccasion(value)}
                  className="px-3 py-1 rounded-full text-xs border transition capitalize"
                  style={
                    occasion.includes(value)
                      ? { borderColor: 'var(--mystyla-primary)', background: 'var(--mystyla-primary-soft)', color: 'var(--mystyla-primary)' }
                      : { borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-muted)' }
                  }
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="mb-3 text-sm" style={{ color: 'var(--mystyla-primary)' }}>{error}</p> : null}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mystyla-button w-full rounded-xl py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 shadow-lg"
        >
          {saving ? "Saving..." : "Save to Wardrobe"}
        </button>
      </div>
    </div>
  )
}