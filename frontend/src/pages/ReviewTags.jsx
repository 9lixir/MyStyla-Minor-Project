import { useState } from "react"

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
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-800">
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Review Tags</h1>
      </div>

      <p className="text-gray-500 mb-4">Confirm or edit garment details</p>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center justify-center h-48">
        <img
          src={`http://localhost:8000/${garment.cutout}`}
          alt="Garment cutout"
          className="h-full object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </div>

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
      </div>

      <button
        onClick={() => onSave({ ...garment, tags: selectedTags })}
        className="w-full bg-black text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition"
      >
        Save to Wardrobe
      </button>
    </div>
  )
}