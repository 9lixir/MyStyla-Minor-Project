import { useState, useEffect } from "react"

export default function Wardrobe({ onAddGarment }) {
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGarment, setSelectedGarment] = useState(null)

  useEffect(() => {
    fetch("http://localhost:8000/scanning/garments-with-tags")
      .then(res => res.json())
      .then(data => {
        setGarments(data.garments || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wardrobe</h1>
        <button
          onClick={onAddGarment}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
        >
          + Add
        </button>
      </div>

      {loading && <p className="text-gray-400 text-center mt-20">Loading...</p>}

      {!loading && garments.length === 0 && (
        <p className="text-gray-400 text-center mt-20">No garments yet. Add your first item!</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {garments.map((garment) => (
          <button
            key={garment.id}
            onClick={() => setSelectedGarment(garment)}
            className="bg-white rounded-xl shadow-sm overflow-hidden text-left hover:shadow-md transition"
          >
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              <img
                src={`http://localhost:8000/${garment.cutout_path}`}
                alt={garment.filename}
                className="h-full w-full object-contain p-2"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-800 truncate capitalize">
                {garment.tags?.category || garment.filename}
              </p>
              {garment.tags?.formality && (
                <p className="text-xs text-gray-400 capitalize mt-0.5">
                  {garment.tags.formality} · {garment.tags.occasion}
                </p>
              )}
              <div className="flex gap-1 mt-2">
                {garment.dominant_colors?.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedGarment && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedGarment(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-800 capitalize">
                {selectedGarment.tags?.category || "Garment"}
              </h2>
              <button
                onClick={() => setSelectedGarment(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="h-56 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
              <img
                src={`http://localhost:8000/${selectedGarment.cutout_path}`}
                alt={selectedGarment.filename}
                className="h-full w-full object-contain p-2"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>

            <div className="space-y-2 mb-4">
              {Object.entries(selectedGarment.tags || {}).map(([field, value]) => (
                <div key={field} className="flex justify-between text-sm">
                  <span className="text-gray-500 capitalize">{field}</span>
                  <span className="text-gray-800 capitalize font-medium">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Colors</p>
              <div className="flex gap-2">
                {selectedGarment.dominant_colors?.map((color, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border border-gray-200"
                    style={{ backgroundColor: color.hex }}
                    title={color.hex}
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