import { useState } from "react"
import AddGarment from "./pages/AddGarment"
import ReviewTags from "./pages/ReviewTags"
import Wardrobe from "./pages/Wardrobe"
import OutfitSuggestions from "./pages/OutfitSuggestions"


function App() {
  const [currentPage, setCurrentPage] = useState("wardrobe")
  const [scannedGarment, setScannedGarment] = useState(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === "wardrobe" && (
        <Wardrobe 
          onAddGarment={() => setCurrentPage("addGarment")} 
          onShowOutfitSuggestions={() => setCurrentPage("outfitSuggestions")}
        />
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
          onSave={() => setCurrentPage("wardrobe")}
        />
      )}
    </div>
  )
}

export default App