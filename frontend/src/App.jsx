import { useState } from "react"
import AddGarment from "./pages/AddGarment"
import ReviewTags from "./pages/ReviewTags"
import Wardrobe from "./pages/Wardrobe"

function App() {
  const [currentPage, setCurrentPage] = useState("wardrobe")
  const [scannedGarment, setScannedGarment] = useState(null)
  const [wardrobeKey, setWardrobeKey] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === "wardrobe" && (
        <Wardrobe key={wardrobeKey} onAddGarment={() => setCurrentPage("addGarment")} />
      )}
      {currentPage === "addGarment" && (
        <AddGarment
          onSuccess={(garment) => {
            setScannedGarment(garment)
            setCurrentPage("reviewTags")
          }}
          onBack={() => setCurrentPage("wardrobe")}
        />
      )}
      {currentPage === "reviewTags" && (
        <ReviewTags
          garment={scannedGarment}
          onBack={() => setCurrentPage("addGarment")}
          onSave={() => {
            setWardrobeKey((k) => k + 1)   // forces Wardrobe to remount and refetch
            setCurrentPage("wardrobe")
          }}
        />
      )}
    </div>
  )
}

export default App