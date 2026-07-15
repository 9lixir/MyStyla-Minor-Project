import { useState, useEffect } from "react"
import { API_BASE_URL } from "../config"

export default function Wardrobe({ onAddGarment, onMatchOutfits }) {
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
    <div className="max-w-md mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Wardrobe</h1>
        <div className="flex gap-2">
          <button
            onClick={onMatchOutfits}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            title="Generate outfit combinations"
          >
            ✨ Match
          </button>
          <button
            onClick={onAddGarment}
            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition"
          >
            + Add
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-400 text-center mt-20">Loading...</p>}

      {!loading && garments.length === 0 && (
        <p className="text-gray-400 text-center mt-20">No garments yet. Add your first item!</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {garments.map((garment) => (
          <div key={garment.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-40 bg-gray-100 flex items-center justify-center">
              <img src={`${API_BASE_URL}/${garment.cutout_path}`}
                alt={garment.filename}
                className="h-full w-full object-contain p-2"
                onError={(e) => { e.target.style.display = 'none' }}
            />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-gray-800 truncate">{garment.filename}</p>
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
          </div>
        ))}
      </div>
    </div>
  )
}