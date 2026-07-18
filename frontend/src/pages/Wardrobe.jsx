import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config"

export default function Wardrobe({ onAddGarment, onMatchOutfits, onShowOutfitSuggestions }) {
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_BASE_URL}/scanning/garments`)
      .then(res => res.json())
      .then(data => {
        setGarments(data.garments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="mystyla-app-shell min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
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

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {garments.map((garment) => (
          <div key={garment.id} className="overflow-hidden rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
            <div className="flex h-44 items-center justify-center bg-[#1E2560]">
              <img src={`${API_BASE_URL}/${garment.cutout_path}`}
                alt={garment.filename}
                className="h-full w-full object-contain p-2"
                onError={(e) => { e.target.style.display = "none" }}
            />
            </div>
            <div className="p-4">
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
              <div className="flex gap-1 mt-2">
                {garment.dominant_colors?.map((color, i) => (
                  <div
                    key={i}
                    className="h-5 w-5 rounded-full border border-[#0E1240] shadow-sm ring-1 ring-[#2A3374]"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
