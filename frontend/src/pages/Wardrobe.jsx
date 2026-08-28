import { useState, useEffect, useMemo } from "react"
import { API_BASE_URL } from "../config"
import CategoryIcon from "../components/CategoryIcon"
import AbstractBackground from "../components/AbstractBackground"
import {
  CATEGORY_GROUPS,
  FORMALITY_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  SEASON_LABELS,
  groupForCategory,
} from "../lib/categories"

const EDIT_CATEGORY_LABELS = ["top", "bottom", "dress", "outerwear"]

const toFormValue = (value, fallback = "") =>
  String(value || fallback).trim().toLowerCase()

const toOccasionFormValues = (value) => {
  const values = Array.isArray(value) ? value : value ? [value] : []
  const normalized = values.map((item) => toFormValue(item))
  return normalized.length > 0 ? normalized : ["everyday wear"]
}

function GarmentCard({ garment, onDelete, onClick }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (deleting) return
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    onDelete(garment.id).finally(() => {
      setDeleting(false)
      setConfirming(false)
    })
  }

  return (
    <div
      onClick={() => onClick(garment)}
      className="mystyla-hover-lift group relative cursor-pointer overflow-hidden rounded-2xl border"
      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
      data-cy="garment-card"
    >
      <button
        onClick={handleDeleteClick}
        onMouseLeave={() => setConfirming(false)}
        disabled={deleting}
        title={confirming ? "Click again to confirm delete" : "Delete garment"}
        data-cy="delete-garment-button"
        className={`absolute right-2 top-2 z-10 flex h-7 items-center gap-1 rounded-full border px-2 text-[10px] font-medium shadow-sm transition-all ${
          confirming
            ? "border-red-400 bg-red-500 text-white opacity-100"
            : "opacity-0 group-hover:opacity-100"
        }`}
        style={
          confirming
            ? undefined
            : { borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }
        }
      >
        {deleting ? (
          <span className="px-1">…</span>
        ) : confirming ? (
          <span className="px-1">Confirm?</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        )}
      </button>
      <div className="flex h-32 items-center justify-center" style={{ background: 'var(--mystyla-surface-2)' }}>
        {garment.cutout_path ? (
          <img
            src={`${API_BASE_URL}/${garment.cutout_path}`}
            alt={garment.filename}
            className="h-full w-full object-contain p-2"
            onError={(e) => { e.target.style.display = "none" }}
          />
        ) : (
          <CategoryIcon category={garment.tags?.category} className="h-9 w-9" style={{ color: 'var(--mystyla-muted)' }} />
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold capitalize" style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-ink)' }}>
          {garment.filename}
        </p>
        <p className="mt-0.5 text-xs capitalize" style={{ color: 'var(--mystyla-primary)' }}>
          {garment.tags?.category || "untagged"}
        </p>
        {garment.tags?.formality && (
          <p className="mt-1 truncate text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>
            {garment.tags.formality} · {Array.isArray(garment.tags.occasion) ? garment.tags.occasion.join(", ") : garment.tags.occasion}
          </p>
        )}
        {garment.dominant_colors?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {garment.dominant_colors.map((color, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full border shadow-sm"
                style={{ backgroundColor: color?.hex || color, borderColor: 'var(--mystyla-bg)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryRow({ section, onDelete, onClick, delayBase = 0 }) {
  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold capitalize" style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-ink)' }}>
          {section.label}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.14em]" style={{ color: 'var(--mystyla-muted)' }}>
          {section.garments.length} {section.garments.length === 1 ? "item" : "items"} &middot; swipe
        </span>
      </div>
      <div className="mystyla-slider">
        {section.garments.map((garment, idx) => (
          <div
            key={garment.id}
            className="mystyla-slide mystyla-fade-in-up"
            style={{ width: 168, animationDelay: `${delayBase + idx * 50}ms` }}
          >
            <GarmentCard garment={garment} onDelete={onDelete} onClick={onClick} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Wardrobe({ onAddGarment, onMatchOutfits, onShowOutfitSuggestions }) {
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGarment, setSelectedGarment] = useState(null)
  const [editDraft, setEditDraft] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSuccess, setEditSuccess] = useState("")
  const [deleteError, setDeleteError] = useState(null)
  const [activeGroup, setActiveGroup] = useState("all")

  useEffect(() => {
    fetch(`${API_BASE_URL}/scanning/garments`)
      .then(res => res.json())
      .then(data => {
        setGarments(data.garments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDeleteGarment = async (garmentId) => {
    setDeleteError(null)
    const previous = garments
    setGarments(prev => prev.filter(g => g.id !== garmentId))
    try {
      const res = await fetch(`${API_BASE_URL}/scanning/garments/${garmentId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")
    } catch (err) {
      setGarments(previous)
      setDeleteError("Couldn't delete that item. Please try again.")
    }
  }

  const openGarment = (garment) => {
    setSelectedGarment(garment)
    setEditError(null)
    setEditSuccess("")
    setEditDraft({
      filename: garment.filename || "",
      category: toFormValue(garment.tags?.category, "top"),
      formality: toFormValue(garment.tags?.formality, "casual"),
      season: toFormValue(garment.tags?.season, "all-season"),
      pattern: toFormValue(garment.tags?.pattern, "solid"),
      occasion: toOccasionFormValues(garment.tags?.occasion),
    })
  }

  const toggleDraftOccasion = (value) => {
    setEditSuccess("")
    setEditDraft((prev) => {
      if (!prev) return prev
      if (prev.occasion.includes(value)) {
        const next = prev.occasion.filter((item) => item !== value)
        return { ...prev, occasion: next.length > 0 ? next : prev.occasion }
      }
      return { ...prev, occasion: [...prev.occasion, value] }
    })
  }

  const handleSaveEdit = async () => {
    if (!selectedGarment || !editDraft) return
    if (!editDraft.filename.trim()) {
      setEditError("Name cannot be empty.")
      setEditSuccess("")
      return
    }

    setSavingEdit(true)
    setEditError(null)
    setEditSuccess("")
    try {
      const response = await fetch(`${API_BASE_URL}/scanning/garments/${selectedGarment.id}/details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: editDraft.filename.trim(),
          user_id: selectedGarment.user_id || null,
          category: editDraft.category,
          formality: editDraft.formality,
          season: editDraft.season,
          pattern: editDraft.pattern,
          occasion: editDraft.occasion,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload.detail || "Update failed")
      }

      const updated = payload.garment
      setGarments((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
      setSelectedGarment((prev) => (prev ? { ...prev, ...updated } : prev))
      setEditDraft({
        filename: updated.filename || editDraft.filename.trim(),
        category: toFormValue(updated.tags?.category, editDraft.category),
        formality: toFormValue(updated.tags?.formality, editDraft.formality),
        season: toFormValue(updated.tags?.season, editDraft.season),
        pattern: toFormValue(updated.tags?.pattern, editDraft.pattern),
        occasion: toOccasionFormValues(updated.tags?.occasion || editDraft.occasion),
      })
      setEditSuccess("Saved changes")
    } catch (err) {
      setEditError(err.message || "Couldn't update that item. Please try again.")
      setEditSuccess("")
    } finally {
      setSavingEdit(false)
    }
  }

  const sections = useMemo(() => {
    const buckets = {}
    for (const group of CATEGORY_GROUPS) buckets[group.id] = []
    const other = []

    for (const garment of garments) {
      const groupId = groupForCategory(garment.tags?.category)
      if (groupId) buckets[groupId].push(garment)
      else other.push(garment)
    }

    const populated = CATEGORY_GROUPS
      .map(group => ({ ...group, garments: buckets[group.id] }))
      .filter(group => group.garments.length > 0)

    if (other.length > 0) {
      populated.push({ id: "other", label: "Other", icon: "default", garments: other })
    }
    return populated
  }, [garments])

  const tabs = useMemo(
    () => [{ id: "all", label: "All", count: garments.length },
      ...sections.map(s => ({ id: s.id, label: s.label, count: s.garments.length }))],
    [sections, garments.length]
  )

  const visibleSections = activeGroup === "all" ? sections : sections.filter(s => s.id === activeGroup)

  return (
    <div className="mystyla-app-shell relative min-h-screen px-4 py-8 sm:px-6">
      <AbstractBackground variant="flowers" />
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mystyla-masthead text-[10px] mb-2 tracking-wider">my styla closet</p>
            <h1 className="mystyla-display text-4xl font-bold" style={{ color: 'var(--mystyla-ink)' }}>My Wardrobe</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--mystyla-muted)' }}>
              Scan, tag, match, and finish each outfit with accessories
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onShowOutfitSuggestions && (
              <button
                onClick={onShowOutfitSuggestions}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
                style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-ink)' }}
                title="Get outfit suggestions with accessory recommendations"
              >
                Suggest
              </button>
            )}
            {onMatchOutfits && (
              <button
                onClick={onMatchOutfits}
                className="rounded-full px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'var(--mystyla-rose)' }}
                title="Generate outfit combinations"
              >
                Match
              </button>
            )}
            <button
              onClick={onAddGarment}
              className="mystyla-button rounded-full px-4 py-2 text-sm font-medium"
            >
              Add Garment
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-600">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="ml-4 text-red-500/70 hover:text-red-600">
              Dismiss
            </button>
          </div>
        )}

        {/* Category tab bar */}
        <div className="mb-8 flex flex-wrap gap-2 pb-3" style={{ borderBottom: '1px dashed var(--mystyla-border-strong)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveGroup(tab.id)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium transition"
              style={
                activeGroup === tab.id
                  ? { background: 'var(--mystyla-primary)', color: '#fff' }
                  : { background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)', border: '1px solid var(--mystyla-border)' }
              }
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: 'var(--mystyla-muted)' }}>Loading closet...</div>
        ) : visibleSections.length === 0 ? (
          <div
            className="text-center py-12 rounded-2xl border border-dashed"
            style={{ borderColor: 'var(--mystyla-border-strong)', color: 'var(--mystyla-muted)' }}
          >
            No garments found in this category.
          </div>
        ) : (
          <div className="space-y-10">
            {visibleSections.map((section, sIdx) => (
              <CategoryRow
                key={section.id}
                section={section}
                onDelete={handleDeleteGarment}
                onClick={openGarment}
                delayBase={sIdx * 40}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup for Selected Garment */}
      {selectedGarment && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50 backdrop-blur-sm"
          onClick={() => setSelectedGarment(null)}
        >
          <div
            className="mystyla-fade-in-up max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-ink)' }}
            onClick={(e) => e.stopPropagation()}
            data-cy="garment-details-modal"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold capitalize" style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-primary)' }}>
                {selectedGarment.tags?.category || "Garment Details"}
              </h2>
              <button
                onClick={() => setSelectedGarment(null)}
                className="text-xl leading-none transition"
                style={{ color: 'var(--mystyla-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--mystyla-ink)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--mystyla-muted)')}
              >
                &times;
              </button>
            </div>

            <div
              className="h-56 rounded-lg flex items-center justify-center mb-4 border"
              style={{ background: 'var(--mystyla-surface-2)', borderColor: 'var(--mystyla-border)' }}
            >
              {selectedGarment.cutout_path ? (
                <img
                  src={`${API_BASE_URL}/${selectedGarment.cutout_path}`}
                  alt={selectedGarment.filename}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <CategoryIcon category={selectedGarment.tags?.category} className="h-16 w-16" style={{ color: 'var(--mystyla-muted)' }} />
              )}
            </div>

            {editDraft && (
              <div className="mb-4 space-y-3 rounded-xl border p-3" style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-bg)' }}>
                <div>
                  <label className="mb-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }} htmlFor="garment-name">
                    Name
                  </label>
                  <input
                    id="garment-name"
                    value={editDraft.filename}
                    onChange={(e) => {
                      setEditSuccess("")
                      setEditDraft((prev) => ({ ...prev, filename: e.target.value }))
                    }}
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none transition"
                    style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-ink)' }}
                    data-cy="garment-name-input"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }} htmlFor="garment-category">
                      Category
                    </label>
                    <select
                      id="garment-category"
                      value={editDraft.category}
                      onChange={(e) => {
                        setEditSuccess("")
                        setEditDraft((prev) => ({ ...prev, category: e.target.value }))
                      }}
                      className="w-full rounded-lg border px-3 py-2 text-sm capitalize outline-none transition"
                      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-ink)' }}
                      data-cy="garment-category-select"
                    >
                      {EDIT_CATEGORY_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }} htmlFor="garment-formality">
                      Formality
                    </label>
                    <select
                      id="garment-formality"
                      value={editDraft.formality}
                      onChange={(e) => {
                        setEditSuccess("")
                        setEditDraft((prev) => ({ ...prev, formality: e.target.value }))
                      }}
                      className="w-full rounded-lg border px-3 py-2 text-sm capitalize outline-none transition"
                      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-ink)' }}
                    >
                      {FORMALITY_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }} htmlFor="garment-season">
                      Season
                    </label>
                    <select
                      id="garment-season"
                      value={editDraft.season}
                      onChange={(e) => {
                        setEditSuccess("")
                        setEditDraft((prev) => ({ ...prev, season: e.target.value }))
                      }}
                      className="w-full rounded-lg border px-3 py-2 text-sm capitalize outline-none transition"
                      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-ink)' }}
                    >
                      {SEASON_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }} htmlFor="garment-pattern">
                      Pattern
                    </label>
                    <select
                      id="garment-pattern"
                      value={editDraft.pattern}
                      onChange={(e) => {
                        setEditSuccess("")
                        setEditDraft((prev) => ({ ...prev, pattern: e.target.value }))
                      }}
                      className="w-full rounded-lg border px-3 py-2 text-sm capitalize outline-none transition"
                      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-ink)' }}
                    >
                      {PATTERN_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs" style={{ color: 'var(--mystyla-muted)' }}>Occasions</p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASION_LABELS.map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => toggleDraftOccasion(value)}
                        className="rounded-full border px-3 py-1 text-xs capitalize transition"
                        style={
                          editDraft.occasion.includes(value)
                            ? { borderColor: 'var(--mystyla-primary)', background: 'var(--mystyla-primary-soft)', color: 'var(--mystyla-primary)' }
                            : { borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)', color: 'var(--mystyla-muted)' }
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {editError ? <p className="text-xs text-red-600">{editError}</p> : null}
                {editSuccess ? <p className="text-xs text-emerald-600" data-cy="save-garment-success">{editSuccess}</p> : null}

                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="mystyla-button w-full rounded-xl px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  data-cy="save-garment-details"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            <div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--mystyla-muted)' }}>Dominant Colors</p>
              <div className="flex gap-2">
                {selectedGarment.dominant_colors?.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border shadow-sm"
                    style={{ backgroundColor: color?.hex || color, borderColor: 'var(--mystyla-bg)' }}
                    title={color?.hex || color}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}