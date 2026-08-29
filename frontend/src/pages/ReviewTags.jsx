import { useMemo, useState } from "react"
import { API_BASE_URL } from "../config"
import { useAuthStore } from "@/store/auth-store"
import {
  CATEGORY_GROUPS,
  FORMALITY_LABELS,
  SEASON_LABELS,
  PATTERN_LABELS,
  OCCASION_LABELS,
  normalizePattern,
} from "@/lib/categories"

const titleCase = (value) =>
  String(value)
    .split(/([\s-])/)
    .map((part) =>
      /^[\s-]$/.test(part)
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1)
    )
    .join("")

const CATEGORY_OPTION_GROUPS = CATEGORY_GROUPS.map((group) => ({
  label: group.label,
  options: group.categories.map((value) => ({
    value,
    label: titleCase(value),
  })),
}))

const KNOWN_CATEGORY_VALUES = new Set(
  CATEGORY_GROUPS.flatMap((group) => group.categories)
)

const fieldLabel = (value) =>
  String(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

export default function ReviewTags({ garment, onBack, onSave }) {
  const flags = garment?.flags || {}

  const initialClassification = useMemo(() => {
    const fallback = {
      category: "",
      formality: "casual",
      season: "all-season",
      pattern: "solid",
      occasion: ["everyday wear"],
    }

    const source =
      garment?.suggested_classification || garment?.tags || {}

    return {
      category: source.category
        ? String(source.category).toLowerCase()
        : fallback.category,

      formality: source.formality
        ? String(source.formality).toLowerCase()
        : fallback.formality,

      season: source.season
        ? String(source.season).toLowerCase()
        : fallback.season,

      pattern: source.pattern ? normalizePattern(source.pattern) : fallback.pattern,

      occasion:
        Array.isArray(source.occasion) && source.occasion.length > 0
          ? source.occasion.map((o) => String(o).toLowerCase())
          : typeof source.occasion === "string"
          ? [source.occasion.toLowerCase()]
          : fallback.occasion,
    }
  }, [garment])

  const [category, setCategory] = useState(
    initialClassification.category
  )
  const [formality, setFormality] = useState(
    initialClassification.formality
  )
  const [season, setSeason] = useState(initialClassification.season)
  const [pattern, setPattern] = useState(initialClassification.pattern)
  const [occasion, setOccasion] = useState(
    initialClassification.occasion
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  if (!garment) return null

  const hasAnyWarnings = Object.values(flags).some(Boolean)

  const categoryUnrecognized =
    Boolean(category) && !KNOWN_CATEGORY_VALUES.has(category)

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

      const response = await fetch(
        `${API_BASE_URL}/scanning/garments/${garment.garment_id}/classification`,
        {
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
        }
      )

      if (!response.ok) {
        const payload = await response.json()
        throw new Error(
          payload.detail || "Failed to save classification"
        )
      }

      onSave()
    } catch (err) {
      setError(err.message || "Failed to save classification")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mystyla-app-shell relative min-h-screen overflow-hidden p-4 sm:p-6">
      <div
        className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--mystyla-rose)" }}
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: "#D8C9E8" }}
      />

      <div className="relative mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <button
            onClick={onBack}
            className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 hover:-translate-x-0.5"
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

          <div>
            <h1
              className="mystyla-display text-4xl sm:text-5xl"
              style={{ color: "var(--mystyla-ink)" }}
            >
              Review Tags
            </h1>

            <p
              className="mt-2 text-base"
              style={{ color: "var(--mystyla-muted)" }}
            >
              Make sure everything looks right before saving.
            </p>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">

          {/* LEFT — TAGS */}
          <aside>
            <div
              className="rounded-[1.75rem] border p-5 sm:p-6"
              style={{
                borderColor: "var(--mystyla-border)",
                background: "var(--mystyla-surface)",
              }}
            >
              <div className="mb-5 flex items-center justify-between">
                <p
                  className="mystyla-masthead text-[11px]"
                  style={{ color: "var(--mystyla-ink)" }}
                >
                  Tags
                </p>

                <span
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ color: "var(--mystyla-muted)" }}
                >
                  editable
                </span>
              </div>

              {hasAnyWarnings && (
                <div
                  className="mb-5 rounded-xl border p-3 text-xs leading-5"
                  style={{
                    borderColor: "rgba(181,41,63,0.25)",
                    background: "rgba(181,41,63,0.07)",
                    color: "var(--mystyla-primary)",
                  }}
                >
                  Some tags may need a quick review.
                </div>
              )}

              {categoryUnrecognized && (
                <div
                  className="mb-5 rounded-xl border p-3 text-xs leading-5"
                  style={{
                    borderColor: "rgba(180,130,30,0.35)",
                    background: "rgba(180,130,30,0.08)",
                    color: "#92701c",
                  }}
                >
                  Unrecognized category: "{category}".
                </div>
              )}

              {/* Category */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--mystyla-ink)" }}
                  >
                    Category
                  </p>

                  {flags.category && (
                    <span
                      className="text-[10px] font-semibold"
                      style={{
                        color: "var(--mystyla-primary)",
                      }}
                    >
                      Low confidence
                    </span>
                  )}
                </div>

                <select
                  value={categoryUnrecognized ? "" : category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border px-3 py-3 text-sm transition-colors focus:outline-none"
                  style={{
                    background: "var(--mystyla-surface-2)",
                    color: "var(--mystyla-ink)",
                    borderColor:
                      flags.category || categoryUnrecognized
                        ? "var(--mystyla-primary)"
                        : "var(--mystyla-border)",
                  }}
                >
                  {(categoryUnrecognized || !category) && (
                    <option value="" disabled>
                      {categoryUnrecognized
                        ? `— unrecognized: ${category} —`
                        : "— select a category —"}
                    </option>
                  )}

                  {CATEGORY_OPTION_GROUPS.map((group) => (
                    <optgroup
                      key={group.label}
                      label={group.label}
                    >
                      {group.options.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <TagSelect
                label="Formality"
                value={formality}
                options={FORMALITY_LABELS}
                warning={flags.formality}
                onChange={setFormality}
              />

              <TagSelect
                label="Season"
                value={season}
                options={SEASON_LABELS}
                warning={flags.season}
                onChange={setSeason}
              />

              <TagSelect
                label="Pattern"
                value={pattern}
                options={PATTERN_LABELS}
                warning={flags.pattern}
                onChange={setPattern}
              />

              {/* Occasion */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--mystyla-ink)" }}
                  >
                    Occasion
                  </p>

                  {flags.occasion && (
                    <span
                      className="text-[10px] font-semibold"
                      style={{
                        color: "var(--mystyla-primary)",
                      }}
                    >
                      Low confidence
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {OCCASION_LABELS.map((value) => {
                    const active = occasion.includes(value)

                    return (
                      <button
                        type="button"
                        key={value}
                        onClick={() => toggleOccasion(value)}
                        className="rounded-full border px-3.5 py-2 text-xs transition-all duration-200 hover:-translate-y-0.5"
                        style={
                          active
                            ? {
                                borderColor:
                                  "var(--mystyla-primary)",
                                background:
                                  "var(--mystyla-primary-soft)",
                                color:
                                  "var(--mystyla-primary)",
                              }
                            : {
                                borderColor:
                                  "var(--mystyla-border)",
                                background:
                                  "var(--mystyla-surface-2)",
                                color:
                                  "var(--mystyla-muted)",
                              }
                        }
                      >
                        {fieldLabel(value)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT — GARMENT */}
          <main
            className="overflow-hidden rounded-[2rem] border shadow-xl"
            style={{
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-5 py-4 sm:px-7"
              style={{
                borderColor: "var(--mystyla-border)",
              }}
            >
              <div>
                <p className="mystyla-masthead text-[11px]">
                  Garment
                </p>

                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--mystyla-muted)" }}
                >
                  Review before saving
                </p>
              </div>

              {/* <div
                className="rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.15em]"
                style={{
                  background: "var(--mystyla-primary-soft)",
                  color: "var(--mystyla-primary)",
                }}
              >
                
              </div> */}
            </div>

            <div className="p-5 sm:p-7">

              {/* Garment image */}
              <div
                className="mb-6 flex min-h-[17rem] items-center justify-center overflow-hidden rounded-[1.5rem] border p-6 sm:min-h-[20rem]"
                style={{
                  borderColor: "var(--mystyla-border)",
                  background: "var(--mystyla-surface-2)",
                }}
              >
                <img
                  src={`${API_BASE_URL}/${garment.cutout}`}
                  alt="Garment cutout"
                  className="max-h-[16rem] max-w-[70%] object-contain sm:max-h-[18rem]"
                  onError={(e) => {
                    e.target.style.display = "none"
                  }}
                />
              </div>

              {/* Colors */}
              {garment.dominant_colors?.length > 0 && (
                <div
                  className="mb-6 rounded-[1.5rem] border p-5"
                  style={{
                    borderColor: "var(--mystyla-border)",
                    background: "var(--mystyla-surface-2)",
                  }}
                >
                  <p
                    className="mb-4 text-sm font-semibold"
                    style={{
                      color: "var(--mystyla-ink)",
                    }}
                  >
                    Dominant colors
                  </p>

                  <div className="flex flex-wrap gap-4">
                    {garment.dominant_colors.map(
                      (color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-10 w-10 rounded-full border shadow-sm"
                            style={{
                              backgroundColor: color.hex,
                              borderColor:
                                "var(--mystyla-border)",
                            }}
                          />

                          <div>
                            <p
                              className="text-sm font-medium"
                              style={{
                                color:
                                  "var(--mystyla-ink)",
                              }}
                            >
                              {color.hex}
                            </p>

                            <p
                              className="text-[10px] uppercase tracking-[0.1em]"
                              style={{
                                color:
                                  "var(--mystyla-muted)",
                              }}
                            >
                              detected
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="mb-5 rounded-xl border p-3 text-sm"
                  style={{
                    borderColor: "rgba(181,41,63,0.3)",
                    background: "rgba(181,41,63,0.07)",
                    color: "var(--mystyla-primary)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="mystyla-button w-full rounded-xl py-4 text-base font-semibold shadow-lg transition-all duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save to Wardrobe"}
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

function TagSelect({
  label,
  value,
  options,
  warning,
  onChange,
}) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--mystyla-ink)" }}
        >
          {label}
        </p>

        {warning && (
          <span
            className="text-[10px] font-semibold"
            style={{
              color: "var(--mystyla-primary)",
            }}
          >
            Low confidence
          </span>
        )}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-3 text-sm capitalize transition-colors focus:outline-none"
        style={{
          background: "var(--mystyla-surface-2)",
          color: "var(--mystyla-ink)",
          borderColor: warning
            ? "var(--mystyla-primary)"
            : "var(--mystyla-border)",
        }}
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
            className="capitalize"
          >
            {fieldLabel(option)}
          </option>
        ))}
      </select>
    </div>
  )
}