const API_BASE_URL = "http://localhost:8000";

export async function getAccessoryRecommendations(formality, garments) {
  const response = await fetch(`${API_BASE_URL}/recommend/accessories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formality, garments }),
  });

  if (!response.ok) {
    throw new Error(`Recommendation request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchWardrobeGarments() {
  const response = await fetch(`${API_BASE_URL}/scanning/garments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch wardrobe: ${response.status}`);
  }
  const data = await response.json();
  return data.garments || [];
}

const FORMALITY_BY_OCCASION = {
  Work: "Smart Casual",
  Party: "Formal",
  Wedding: "Formal",
  Everyday: "Casual",
};

export async function getOutfitSuggestions(occasion) {
  const formality = FORMALITY_BY_OCCASION[occasion] || "Casual";

  const wardrobeGarments = await fetchWardrobeGarments();

  let garmentsForEngine;
  let usedRealWardrobe;

  if (wardrobeGarments.length > 0) {
    garmentsForEngine = wardrobeGarments.slice(0, 3).map((g) => ({
      dominant_colors: g.dominant_colors || [],
    }));
    usedRealWardrobe = true;
  } else {
    garmentsForEngine = [{ dominant_colors: [{ hex: "#4E8B8B" }, { hex: "#2C4A7C" }] }];
    usedRealWardrobe = false;
  }

  const { accessories } = await getAccessoryRecommendations(formality, garmentsForEngine);

  const avgConfidence = Math.round(
    accessories.reduce((sum, a) => sum + a.confidence, 0) / accessories.length
  );

  return {
    usedRealWardrobe,
    suggestions: [
      {
        id: `${occasion}-1`,
        rank: 1,
        compatibility: avgConfidence,
        items: [
          { id: "top1", category: "top", label: "Top", isRecommendation: false },
          { id: "bottom1", category: "bottom", label: "Bottom", isRecommendation: false },
          ...accessories.map((a, i) => ({
            id: `acc${i}`,
            category: a.slot,
            label: a.name,
            reason: a.reason,
            source: a.source,
            isRecommendation: true,
          })),
        ],
      },
    ],
  };
}