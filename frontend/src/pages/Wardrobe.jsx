import { useState, useEffect, useMemo } from "react"
import { API_BASE_URL } from "../config"
import CategoryIcon from "../components/CategoryIcon"
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 shadow-sm transition hover:border-[#FF6FB5]/50 hover:shadow-md"
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
            : "border-[#2A3374] bg-[#0E1240]/90 text-[#B9C0E8] opacity-0 hover:border-red-400 hover:text-red-300 group-hover:opacity-100"
        }`}
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
      <div className="flex h-40 items-center justify-center bg-[#1E2560]">
        {garment.cutout_path ? (
          <img
            src={`${API_BASE_URL}/${garment.cutout_path}`}
            alt={garment.filename}
            className="h-full w-full object-contain p-2"
            onError={(e) => { e.target.style.display = "none" }}
          />
        ) : (
          <CategoryIcon category={garment.tags?.category} className="h-10 w-10 text-[#5B63A8]" />
        )}
      </div>
      <div className="p-3.5">
        <p className="truncate text-sm font-semibold capitalize text-[#F5F3FF]">
          {garment.filename}
        </p>
        <p className="mt-0.5 text-xs capitalize text-[#FF6FB5]">
          {garment.tags?.category || "untagged"}
        </p>
        {garment.tags?.formality && (
          <p className="mt-1 truncate text-xs capitalize text-[#B9C0E8]">
            {garment.tags.formality} · {Array.isArray(garment.tags.occasion) ? garment.tags.occasion.join(", ") : garment.tags.occasion}
          </p>
        )}
        {garment.dominant_colors?.length > 0 && (
          <div className="flex gap-1 mt-2">
            {garment.dominant_colors.map((color, i) => (
              <div
                key={i}
                className="h-4 w-4 rounded-full border border-[#0E1240] shadow-sm ring-1 ring-[#2A3374]"
                style={{ backgroundColor: color?.hex || color }}
              />
            ))}
          </div>
        )}
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
      return
    }

    setSavingEdit(true)
    setEditError(null)
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
    } catch (err) {
      setEditError(err.message || "Couldn't update that item. Please try again.")
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
    <div className="mystyla-app-shell min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mystyla-masthead text-[10px] mb-2 uppercase tracking-wider text-[#FF6FB5]">my styla closet</p>
            <h1 className="mystyla-display text-4xl text-[#F5F3FF] font-bold">My Wardrobe</h1>
            <p className="mt-2 text-sm text-[#B9C0E8]">
              Scan, tag, match, and finish each outfit with accessories
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {onShowOutfitSuggestions && (
              <button
                onClick={onShowOutfitSuggestions}
                className="rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-4 py-2 text-sm font-medium text-[#F5F3FF] hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5] transition"
                title="Get outfit suggestions with accessory recommendations"
              >
                Suggest
              </button>
            )}
            {onMatchOutfits && (
              <button
                onClick={onMatchOutfits}
                className="rounded-full bg-[#F5A9CE] px-4 py-2 text-sm font-medium text-white hover:bg-[#EA93BA] transition"
                title="Generate outfit combinations"
              >
                Match
              </button>
            )}
            <button
              onClick={onAddGarment}
              className="bg-[#FF6FB5] hover:bg-[#ff57a5] rounded-full px-4 py-2 text-sm font-medium text-white transition"
            >
              Add Garment
            </button>
          </div>
        </div>

        {deleteError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            <span>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="ml-4 text-red-200/70 hover:text-red-100">
              Dismiss
            </button>
          </div>
        )}

        {/* Categories Tab Bar */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-[#2A3374] pb-3">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveGroup(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                activeGroup === tab.id
                  ? "bg-[#FF6FB5] text-white"
                  : "bg-[#151A4D]/40 text-[#B9C0E8] hover:bg-[#151A4D]/80"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-[#B9C0E8] py-12">Loading closet...</div>
        ) : visibleSections.length === 0 ? (
          <div className="text-center text-[#B9C0E8] py-12 border border-dashed border-[#2A3374] rounded-2xl">
            No garments found in this category.
          </div>
        ) : (
          <div className="space-y-8">
            {visibleSections.map(section => (
              <div key={section.id}>
                <h2 className="mb-4 text-lg font-semibold text-[#F5F3FF] border-b border-[#2A3374]/30 pb-1 capitalize">
                  {section.label}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {section.garments.map(garment => (
                    <GarmentCard
                      key={garment.id}
                      garment={garment}
                      onDelete={handleDeleteGarment}
                      onClick={openGarment}
                    />
                  ))}
                </div>
              </div>
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
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[#2A3374] bg-[#151A4D] p-5 text-[#F5F3FF]"
            onClick={(e) => e.stopPropagation()}
            data-cy="garment-details-modal"
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold capitalize text-[#FF6FB5]">
                {selectedGarment.tags?.category || "Garment Details"}
              </h2>
              <button
                onClick={() => setSelectedGarment(null)}
                className="text-[#B9C0E8] hover:text-white text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="h-56 bg-[#1E2560] rounded-lg flex items-center justify-center mb-4 border border-[#2A3374]">
              {selectedGarment.cutout_path ? (
                <img
                  src={`${API_BASE_URL}/${selectedGarment.cutout_path}`}
                  alt={selectedGarment.filename}
                  className="h-full w-full object-contain p-2"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                <CategoryIcon category={selectedGarment.tags?.category} className="h-16 w-16 text-[#5B63A8]" />
              )}
            </div>

            {editDraft && (
              <div className="mb-4 space-y-3 rounded-xl border border-[#2A3374]/50 bg-[#0E1240]/60 p-3">
                <div>
                  <label className="mb-1 block text-xs text-[#B9C0E8]" htmlFor="garment-name">
                    Name
                  </label>
                  <input
                    id="garment-name"
                    value={editDraft.filename}
                    onChange={(e) => setEditDraft((prev) => ({ ...prev, filename: e.target.value }))}
                    className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] outline-none transition focus:border-[#FF6FB5]"
                    data-cy="garment-name-input"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#B9C0E8]" htmlFor="garment-category">
                      Category
                    </label>
                    <select
                      id="garment-category"
                      value={editDraft.category}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm capitalize text-[#F5F3FF] outline-none transition focus:border-[#FF6FB5]"
                      data-cy="garment-category-select"
                    >
                      {EDIT_CATEGORY_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-[#B9C0E8]" htmlFor="garment-formality">
                      Formality
                    </label>
                    <select
                      id="garment-formality"
                      value={editDraft.formality}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, formality: e.target.value }))}
                      className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm capitalize text-[#F5F3FF] outline-none transition focus:border-[#FF6FB5]"
                    >
                      {FORMALITY_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-[#B9C0E8]" htmlFor="garment-season">
                      Season
                    </label>
                    <select
                      id="garment-season"
                      value={editDraft.season}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, season: e.target.value }))}
                      className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm capitalize text-[#F5F3FF] outline-none transition focus:border-[#FF6FB5]"
                    >
                      {SEASON_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-[#B9C0E8]" htmlFor="garment-pattern">
                      Pattern
                    </label>
                    <select
                      id="garment-pattern"
                      value={editDraft.pattern}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, pattern: e.target.value }))}
                      className="w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm capitalize text-[#F5F3FF] outline-none transition focus:border-[#FF6FB5]"
                    >
                      {PATTERN_LABELS.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs text-[#B9C0E8]">Occasions</p>
                  <div className="flex flex-wrap gap-2">
                    {OCCASION_LABELS.map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => toggleDraftOccasion(value)}
                        className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                          editDraft.occasion.includes(value)
                            ? "border-[#FF6FB5] bg-[#FF6FB5]/15 text-[#FF7AB8]"
                            : "border-[#2A3374] bg-[#1E2560] text-[#B9C0E8] hover:border-[#FFD3EC]"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {editError ? <p className="text-xs text-[#FF7AB8]">{editError}</p> : null}

                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="w-full rounded-xl bg-[#FF6FB5] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#ff57a5] disabled:cursor-not-allowed disabled:opacity-60"
                  data-cy="save-garment-details"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            <div>
              <p className="text-xs text-[#B9C0E8] mb-1.5">Dominant Colors</p>
              <div className="flex gap-2">
                {selectedGarment.dominant_colors?.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border border-[#0E1240] shadow-sm ring-1 ring-[#2A3374]"
                    style={{ backgroundColor: color?.hex || color }}
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
