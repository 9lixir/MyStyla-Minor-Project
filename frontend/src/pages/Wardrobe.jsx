import { useState, useEffect, useMemo } from "react"
import { API_BASE_URL } from "../config"
import CategoryIcon from "../components/CategoryIcon"
import { CATEGORY_GROUPS, groupForCategory } from "../lib/categories"

function GarmentCard({ garment }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 shadow-sm transition hover:border-[#FF6FB5]/50 hover:shadow-md">
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
                style={{ backgroundColor: color.hex }}
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

  // Bucket garments by category group, in taxonomy order, with an "Other" catch-all.
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
    () => [{ id: "all", label: "All", icon: "default", count: garments.length },
      ...sections.map(s => ({ id: s.id, label: s.label, icon: s.icon, count: s.garments.length }))],
    [sections, garments.length]
  )

  const visibleSections = activeGroup === "all" ? sections : sections.filter(s => s.id === activeGroup)

  return (
    <div className="mystyla-app-shell min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mystyla-masthead text-[10px] mb-2">my styla closet</p>
          <h1 className="mystyla-display text-4xl text-[#F5F3FF]">My Wardrobe</h1>
          <p className="mt-2 text-sm text-[#B9C0E8]">
            Scan, tag, match, and finish each outfit with accessories
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onShowOutfitSuggestions ? (
            <button
              onClick={onShowOutfitSuggestions}
              className="rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-4 py-2 text-sm font-medium text-[#F5F3FF] hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5] transition"
              title="Get outfit suggestions with accessory recommendations"
            >
              Suggest
            </button>
          ) : null}
          {onMatchOutfits ? (
            <button
              onClick={onMatchOutfits}
              className="rounded-full bg-[#F5A9CE] px-4 py-2 text-sm font-medium text-white hover:bg-[#EA93BA] transition"
              title="Generate outfit combinations"
            >
              Match
            </button>
          ) : null}
          <button
            onClick={onAddGarment}
            className="mystyla-button rounded-full px-4 py-2 text-sm font-medium text-white transition"
          >
            Add Garment
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 py-16 text-center text-[#B9C0E8]">
          Loading your wardrobe...
        </div>
      )}

      {!loading && garments.length === 0 && (
        <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 px-6 py-16 text-center">
          <p className="mystyla-display text-2xl text-[#F5F3FF]">Your closet is ready for its first piece</p>
          <p className="mt-2 text-sm text-[#B9C0E8]">Add a garment to start scanning colors and tags</p>
        </div>
      )}

      {!loading && garments.length > 0 && (
        <>
          {/* Category filter chips, shopping-nav style */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGroup(tab.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  activeGroup === tab.id
                    ? "border-[#FF6FB5] bg-[#FF6FB5]/15 text-[#FFD3EC]"
                    : "border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8] hover:border-[#FF6FB5]/50 hover:text-[#F5F3FF]"
                }`}
              >
                <CategoryIcon category={tab.icon} className="h-3.5 w-3.5" />
                {tab.label}
                <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Category sections, each its own shopping-grid */}
          <div className="space-y-10">
            {visibleSections.map(section => (
              <div key={section.id}>
                <div className="mb-3 flex items-center gap-2">
                  <CategoryIcon category={section.icon} className="h-5 w-5 text-[#FF6FB5]" />
                  <h2 className="mystyla-display text-xl text-[#F5F3FF]">{section.label}</h2>
                  <span className="text-xs text-[#B9C0E8]">({section.garments.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {section.garments.map(garment => (
                    <GarmentCard key={garment.id} garment={garment} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  )
}