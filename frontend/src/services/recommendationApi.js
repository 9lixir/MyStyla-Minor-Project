import { API_BASE_URL } from "../config";

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

const OCCASION_MAP = {
  Work: "Office",
  Everyday: "Casual",
  Wedding: "Farewell",
};

function toSuggestion(outfit, index) {
  const accessories = outfit.accessories || [];
  const garments = outfit.garments || [];

  return {
    id: `outfit-${index + 1}`,
    rank: index + 1,
    compatibility: Math.round((outfit.final_score || 0) * 100),
    items: [
      ...garments.map((g) => ({
        id: g.id,
        category: g.category,
        label: g.filename || g.category,
        imageUrl: g.cutout_path ? `${API_BASE_URL}/${g.cutout_path}` : null,
        colors: g.dominant_colors || [],
        isRecommendation: false,
      })),
      ...accessories.map((a, i) => ({
        id: `${a.slot}-${i}`,
        category: a.slot,
        label: a.name,
        reason: a.reason,
        source: a.source,
        isRecommendation: true,
      })),
    ],
  };
}

export async function getOutfitSuggestions(occasion, userId, topK = 5, weather = null) {
  if (!userId) {
    throw new Error("User ID not found");
  }

  const backendOccasion = OCCASION_MAP[occasion] || occasion;
  const response = await fetch(`${API_BASE_URL}/outfits/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      occasion: backendOccasion,
      top_k: topK,
      weather,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch outfit suggestions: ${response.status}`);
  }

  const data = await response.json();

  return {
    ...data,
    suggestions: (data.outfits || []).map(toSuggestion),
  };
}
