import { useState, useEffect, useMemo, useRef } from "react"
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

// ---------------------------------------------------------------------------
// BENTO SYSTEM
// ---------------------------------------------------------------------------

const SUBROWS = 2
const SUBROW_HEIGHT = 230
const GRID_GAP = 18
const COL_WIDTH = 205
const MASONRY_HEIGHT =
  SUBROWS * SUBROW_HEIGHT + (SUBROWS - 1) * GRID_GAP

const SIZE_PATTERN = [
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
  { c: 1, r: 1 },
  { c: 1, r: 1 },
  { c: 1, r: 2 },
]

function sizeForIndex(idx) {
  if (idx === 0) return { c: 2, r: 1 }
  return SIZE_PATTERN[(idx - 1) % SIZE_PATTERN.length]
}

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------

function DeleteButton({ garment, onDelete }) {
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
    <button
      onClick={handleDeleteClick}
      onMouseLeave={() => setConfirming(false)}
      disabled={deleting}
      title={confirming ? "Click again to confirm delete" : "Delete garment"}
      data-cy="delete-garment-button"
      className={`absolute right-3 top-3 z-20 flex h-8 items-center gap-1 rounded-full border px-2.5 text-xs font-medium shadow-sm transition-all duration-200 ${
        confirming
          ? "border-red-400 bg-red-500 text-white opacity-100"
          : "opacity-0 group-hover:opacity-100"
      }`}
      style={
        confirming
          ? undefined
          : {
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
              color: "var(--mystyla-muted)",
            }
      }
    >
      {deleting ? (
        <span className="px-1">…</span>
      ) : confirming ? (
        <span className="px-1">Confirm?</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// GARMENT IMAGE
// ---------------------------------------------------------------------------

function GarmentImage({ garment }) {
  return garment.cutout_path ? (
    <img
      src={`${API_BASE_URL}/${garment.cutout_path}`}
      alt={garment.filename}
      className="h-full w-full object-contain p-5 transition-transform duration-500 group-hover:scale-[1.035]"
      onError={(e) => {
        e.target.style.display = "none"
      }}
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center">
      <CategoryIcon
        category={garment.tags?.category}
        className="h-12 w-12"
        style={{ color: "var(--mystyla-muted)" }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// BENTO CARD
// ---------------------------------------------------------------------------

function GarmentCard({ garment, onDelete, onClick, size, isFeatured, delay = 0 }) {
  return (
    <div
      onClick={() => onClick(garment)}
      className="mystyla-hover-lift mystyla-fade-in-up group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border"
      style={{
        borderColor: isFeatured
          ? 'var(--mystyla-border-strong)'
          : 'var(--mystyla-border)',
        background: 'var(--mystyla-surface)',
        gridColumn: `span ${size.c}`,
        gridRow: `span ${size.r}`,
        animationDelay: `${delay}ms`,
      }}
      data-cy="garment-card"
    >
      <DeleteButton garment={garment} onDelete={onDelete} />

      <div
        className="min-h-0 flex-1 overflow-hidden"
        style={{ background: 'var(--mystyla-surface-2)' }}
      >
        <GarmentImage garment={garment} />
      </div>

      <div className="shrink-0 p-3">
        <p
          className="truncate text-sm font-semibold capitalize"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: 'var(--mystyla-ink)',
          }}
        >
          {garment.filename}
        </p>

        <p
          className="mt-0.5 text-xs capitalize"
          style={{ color: 'var(--mystyla-primary)' }}
        >
          {garment.tags?.category || "untagged"}
        </p>

        {/* Color swatches — shown for EVERY garment */}
        {garment.dominant_colors?.length > 0 && (
          <div className="mt-2 flex gap-1.5">
            {garment.dominant_colors.map((color, i) => (
              <div
                key={i}
                className="h-3.5 w-3.5 rounded-full border shadow-sm"
                style={{
                  backgroundColor: color?.hex || color,
                  borderColor: 'var(--mystyla-bg)',
                }}
                title={color?.hex || color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CATEGORY SECTION
// ---------------------------------------------------------------------------

function CategorySection({ section, onDelete, onClick, delayBase = 0 }) {
  const scrollerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = () => {
    const el = scrollerRef.current
    if (!el) return

    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(
      el.scrollLeft < el.scrollWidth - el.clientWidth - 4
    )
  }

  useEffect(() => {
    updateScrollButtons()

    const el = scrollerRef.current
    if (!el) return

    const onResize = () => updateScrollButtons()

    window.addEventListener("resize", onResize)

    return () => window.removeEventListener("resize", onResize)
  }, [section.garments.length])

  const handleWheel = (e) => {
    const el = scrollerRef.current

    if (!el || el.scrollWidth <= el.clientWidth) return
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

    el.scrollLeft += e.deltaY
    e.preventDefault()
  }

  const scrollByPage = (direction) => {
    const el = scrollerRef.current
    if (!el) return

    el.scrollBy({
      left: direction * el.clientWidth * 0.78,
      behavior: "smooth",
    })
  }

  const arrowButtonStyle = {
    borderColor: "var(--mystyla-border)",
    background: "var(--mystyla-surface)",
    color: "var(--mystyla-ink)",
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2
              className="text-[25px] font-semibold capitalize"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                color: "var(--mystyla-ink)",
              }}
            >
              {section.label}
            </h2>

            <span
              className="text-xs"
              style={{ color: "var(--mystyla-muted)" }}
            >
              {String(section.garments.length).padStart(2, "0")}
            </span>
          </div>

          <div
            className="mt-2 h-px w-12"
            style={{ background: "var(--mystyla-primary)" }}
          />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "var(--mystyla-muted)" }}
          >
            collection
          </span>
        </div>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByPage(-1)}
            aria-label="Scroll left"
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition duration-200 hover:scale-105"
            style={arrowButtonStyle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div
          ref={scrollerRef}
          onWheel={handleWheel}
          onScroll={updateScrollButtons}
          className="grid overflow-x-auto scroll-smooth pb-4 pr-1"
          style={{
            gridTemplateRows: `repeat(${SUBROWS}, ${SUBROW_HEIGHT}px)`,
            gridAutoFlow: "column dense",
            gridAutoColumns: `${COL_WIDTH}px`,
            gap: GRID_GAP,
            height: MASONRY_HEIGHT,
            touchAction: "pan-x",
            cursor: "grab",
            scrollbarWidth: "thin",
          }}
        >
          {section.garments.map((garment, idx) => (
            <GarmentCard
              key={garment.id}
              garment={garment}
              onDelete={onDelete}
              onClick={onClick}
              size={sizeForIndex(idx)}
              isFeatured={idx === 0}
              delay={delayBase + idx * 45}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByPage(1)}
            aria-label="Scroll right"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border shadow-md transition duration-200 hover:scale-105"
            style={arrowButtonStyle}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

export default function Wardrobe({
  onAddGarment,
  onMatchOutfits,
  onShowOutfitSuggestions,
}) {
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
      .then((res) => res.json())
      .then((data) => {
        setGarments(data.garments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleDeleteGarment = async (garmentId) => {
    setDeleteError(null)

    const previous = garments

    setGarments((prev) => prev.filter((g) => g.id !== garmentId))

    try {
      const res = await fetch(
        `${API_BASE_URL}/scanning/garments/${garmentId}`,
        { method: "DELETE" }
      )

      if (!res.ok) throw new Error("Delete failed")
    } catch {
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

        return {
          ...prev,
          occasion: next.length > 0 ? next : prev.occasion,
        }
      }

      return {
        ...prev,
        occasion: [...prev.occasion, value],
      }
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
      const response = await fetch(
        `${API_BASE_URL}/scanning/garments/${selectedGarment.id}/details`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filename: editDraft.filename.trim(),
            user_id: selectedGarment.user_id || null,
            category: editDraft.category,
            formality: editDraft.formality,
            season: editDraft.season,
            pattern: editDraft.pattern,
            occasion: editDraft.occasion,
          }),
        }
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.detail || "Update failed")
      }

      const updated = payload.garment

      setGarments((prev) =>
        prev.map((item) =>
          item.id === updated.id ? { ...item, ...updated } : item
        )
      )

      setSelectedGarment((prev) =>
        prev ? { ...prev, ...updated } : prev
      )

      setEditDraft({
        filename: updated.filename || editDraft.filename.trim(),
        category: toFormValue(
          updated.tags?.category,
          editDraft.category
        ),
        formality: toFormValue(
          updated.tags?.formality,
          editDraft.formality
        ),
        season: toFormValue(
          updated.tags?.season,
          editDraft.season
        ),
        pattern: toFormValue(
          updated.tags?.pattern,
          editDraft.pattern
        ),
        occasion: toOccasionFormValues(
          updated.tags?.occasion || editDraft.occasion
        ),
      })

      setEditSuccess("Saved changes")
    } catch (err) {
      setEditError(
        err.message || "Couldn't update that item. Please try again."
      )
      setEditSuccess("")
    } finally {
      setSavingEdit(false)
    }
  }

  const sections = useMemo(() => {
    const buckets = {}

    for (const group of CATEGORY_GROUPS) {
      buckets[group.id] = []
    }

    const other = []

    for (const garment of garments) {
      const groupId = groupForCategory(garment.tags?.category)

      if (groupId) {
        buckets[groupId].push(garment)
      } else {
        other.push(garment)
      }
    }

    const populated = CATEGORY_GROUPS
      .map((group) => ({
        ...group,
        garments: buckets[group.id],
      }))
      .filter((group) => group.garments.length > 0)

    if (other.length > 0) {
      populated.push({
        id: "other",
        label: "Other",
        icon: "default",
        garments: other,
      })
    }

    return populated
  }, [garments])

  const tabs = useMemo(
    () => [
      {
        id: "all",
        label: "All",
        count: garments.length,
      },
      ...sections.map((section) => ({
        id: section.id,
        label: section.label,
        count: section.garments.length,
      })),
    ],
    [sections, garments.length]
  )

  const visibleSections =
    activeGroup === "all"
      ? sections
      : sections.filter((section) => section.id === activeGroup)

  return (
    <div
      className="mystyla-app-shell relative min-h-screen overflow-hidden px-4 py-9 sm:px-7"
      style={{
        background:
          "radial-gradient(circle at 88% 7%, rgba(181,41,63,0.065), transparent 25%), radial-gradient(circle at 4% 60%, rgba(181,41,63,0.035), transparent 25%)",
      }}
    >
      {/* Quiet editorial circles */}
      <div
        className="pointer-events-none absolute -right-32 top-24 h-80 w-80 rounded-full border opacity-25"
        style={{ borderColor: "var(--mystyla-primary)" }}
      />

      <div
        className="pointer-events-none absolute -left-40 bottom-12 h-96 w-96 rounded-full border opacity-10"
        style={{ borderColor: "var(--mystyla-primary)" }}
      />

      <div className="relative mx-auto max-w-6xl">

        {/* HEADER */}
        <header className="mb-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

            <div>
              <p
                className="mystyla-masthead mb-3 text-[10px] tracking-[0.22em]"
                style={{ color: "var(--mystyla-primary)" }}
              >
                my styla
              </p>

              <h1
                className="mystyla-display text-[42px] font-bold leading-none sm:text-[54px]"
                style={{ color: "var(--mystyla-ink)" }}
              >
                My Wardrobe
              </h1>

              <div
                className="mt-4 h-px w-16"
                style={{ background: "var(--mystyla-primary)" }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {onShowOutfitSuggestions && (
                <button
                  onClick={onShowOutfitSuggestions}
                  className="rounded-full border px-4 py-2.5 text-sm font-medium transition duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--mystyla-border)",
                    background: "var(--mystyla-surface)",
                    color: "var(--mystyla-ink)",
                  }}
                >
                  Suggest
                </button>
              )}

              {onMatchOutfits && (
                <button
                  onClick={onMatchOutfits}
                  className="rounded-full px-4 py-2.5 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--mystyla-rose)",
                  }}
                >
                  Match
                </button>
              )}

              <button
                onClick={onAddGarment}
                className="mystyla-button rounded-full px-5 py-2.5 text-sm font-medium"
              >
                Add Garment
              </button>
            </div>
          </div>
        </header>

        {/* DELETE ERROR */}
        {deleteError && (
          <div
            className="mb-6 flex items-center justify-between rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(220, 38, 38, 0.25)",
              background: "rgba(220, 38, 38, 0.06)",
              color: "#b91c1c",
            }}
          >
            <span>{deleteError}</span>

            <button
              onClick={() => setDeleteError(null)}
              className="ml-4 text-xs opacity-70 transition hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* CATEGORY NAV */}
        <div
          className="mb-10 flex gap-2 overflow-x-auto pb-3"
          style={{
            borderBottom: "1px dashed var(--mystyla-border-strong)",
            scrollbarWidth: "none",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveGroup(tab.id)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition duration-200"
              style={
                activeGroup === tab.id
                  ? {
                      background: "var(--mystyla-primary)",
                      color: "#fff",
                      boxShadow:
                        "0 5px 16px rgba(181,41,63,0.16)",
                    }
                  : {
                      background: "var(--mystyla-surface)",
                      color: "var(--mystyla-muted)",
                      border: "1px solid var(--mystyla-border)",
                    }
              }
            >
              {tab.label}
              <span className="ml-1.5 opacity-60">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* CONTENT */}
        {loading ? (
          <div
            className="rounded-[24px] border py-20 text-center"
            style={{
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
              color: "var(--mystyla-muted)",
            }}
          >
            <div
              className="mx-auto mb-4 h-7 w-7 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: "var(--mystyla-border)",
                borderTopColor: "var(--mystyla-primary)",
              }}
            />

            <p className="text-sm">
              Opening your wardrobe...
            </p>
          </div>
        ) : visibleSections.length === 0 ? (
          <div
            className="rounded-[24px] border border-dashed py-20 text-center"
            style={{
              borderColor: "var(--mystyla-border-strong)",
              color: "var(--mystyla-muted)",
            }}
          >
            <p
              className="mystyla-display text-3xl"
              style={{ color: "var(--mystyla-ink)" }}
            >
              Your wardrobe is quiet.
            </p>

            <p className="mt-2 text-sm">
              Add a garment to begin your collection.
            </p>
          </div>
        ) : (
          <div className="space-y-14">
            {visibleSections.map((section, index) => (
              <CategorySection
                key={section.id}
                section={section}
                onDelete={handleDeleteGarment}
                onClick={openGarment}
                delayBase={index * 60}
              />
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* GARMENT DETAIL MODAL */}
      {/* ------------------------------------------------------------------ */}

      {selectedGarment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md sm:p-6"
          onClick={() => setSelectedGarment(null)}
        >
          <div
            className="mystyla-fade-in-up max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border p-5 sm:p-7"
            style={{
              borderColor: "var(--mystyla-border)",
              background: "var(--mystyla-surface)",
              color: "var(--mystyla-ink)",
            }}
            onClick={(e) => e.stopPropagation()}
            data-cy="garment-details-modal"
          >
            {/* Modal header */}
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p
                  className="mb-1 text-[10px] uppercase tracking-[0.2em]"
                  style={{ color: "var(--mystyla-primary)" }}
                >
                  Garment
                </p>

                <h2
                  className="text-2xl font-semibold capitalize"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    color: "var(--mystyla-ink)",
                  }}
                >
                  {selectedGarment.filename}
                </h2>
              </div>

              <button
                onClick={() => setSelectedGarment(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xl leading-none transition"
                style={{
                  borderColor: "var(--mystyla-border)",
                  color: "var(--mystyla-muted)",
                }}
              >
                &times;
              </button>
            </div>

            {/* Image */}
            <div
              className="mb-6 flex h-64 items-center justify-center overflow-hidden rounded-[22px] border sm:h-72"
              style={{
                background:
                  "linear-gradient(145deg, var(--mystyla-surface-2), var(--mystyla-bg))",
                borderColor: "var(--mystyla-border)",
              }}
            >
              {selectedGarment.cutout_path ? (
                <img
                  src={`${API_BASE_URL}/${selectedGarment.cutout_path}`}
                  alt={selectedGarment.filename}
                  className="h-full w-full object-contain p-7"
                  onError={(e) => {
                    e.target.style.display = "none"
                  }}
                />
              ) : (
                <CategoryIcon
                  category={selectedGarment.tags?.category}
                  className="h-16 w-16"
                  style={{ color: "var(--mystyla-muted)" }}
                />
              )}
            </div>

            {/* Edit */}
            {editDraft && (
              <div
                className="space-y-5 rounded-[22px] border p-5"
                style={{
                  borderColor: "var(--mystyla-border)",
                  background: "var(--mystyla-bg)",
                }}
              >
                <div>
                  <label
                    className="mb-2 block text-sm"
                    style={{ color: "var(--mystyla-muted)" }}
                    htmlFor="garment-name"
                  >
                    Name
                  </label>

                  <input
                    id="garment-name"
                    value={editDraft.filename}
                    onChange={(e) => {
                      setEditSuccess("")

                      setEditDraft((prev) => ({
                        ...prev,
                        filename: e.target.value,
                      }))
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-base outline-none transition"
                    style={{
                      borderColor: "var(--mystyla-border)",
                      background: "var(--mystyla-surface)",
                      color: "var(--mystyla-ink)",
                    }}
                    data-cy="garment-name-input"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Category", "category", EDIT_CATEGORY_LABELS],
                    ["Formality", "formality", FORMALITY_LABELS],
                    ["Season", "season", SEASON_LABELS],
                    ["Pattern", "pattern", PATTERN_LABELS],
                  ].map(([label, key, options]) => (
                    <div key={key}>
                      <label
                        className="mb-2 block text-sm"
                        style={{ color: "var(--mystyla-muted)" }}
                        htmlFor={`garment-${key}`}
                      >
                        {label}
                      </label>

                      <select
                        id={`garment-${key}`}
                        value={editDraft[key]}
                        onChange={(e) => {
                          setEditSuccess("")

                          setEditDraft((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }}
                        className="w-full rounded-xl border px-4 py-3 text-sm capitalize outline-none"
                        style={{
                          borderColor: "var(--mystyla-border)",
                          background: "var(--mystyla-surface)",
                          color: "var(--mystyla-ink)",
                        }}
                      >
                        {options.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div>
                  <p
                    className="mb-2 text-sm"
                    style={{ color: "var(--mystyla-muted)" }}
                  >
                    Occasions
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {OCCASION_LABELS.map((value) => (
                      <button
                        type="button"
                        key={value}
                        onClick={() => toggleDraftOccasion(value)}
                        className="rounded-full border px-3.5 py-2 text-sm capitalize transition"
                        style={
                          editDraft.occasion.includes(value)
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
                                  "var(--mystyla-surface)",
                                color:
                                  "var(--mystyla-muted)",
                              }
                        }
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {editError && (
                  <p className="text-sm text-red-600">
                    {editError}
                  </p>
                )}

                {editSuccess && (
                  <p
                    className="text-sm text-emerald-600"
                    data-cy="save-garment-success"
                  >
                    {editSuccess}
                  </p>
                )}

                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                  className="mystyla-button w-full rounded-xl px-4 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                  data-cy="save-garment-details"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}

            {/* Colors */}
            <div className="mt-6">
              <p
                className="mb-3 text-sm"
                style={{ color: "var(--mystyla-muted)" }}
              >
                Dominant colors
              </p>

              <div className="flex gap-3">
                {selectedGarment.dominant_colors?.map(
                  (color, i) => (
                    <div
                      key={i}
                      className="h-9 w-9 rounded-full border shadow-sm"
                      style={{
                        backgroundColor:
                          color?.hex || color,
                        borderColor:
                          "var(--mystyla-bg)",
                      }}
                      title={color?.hex || color}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}