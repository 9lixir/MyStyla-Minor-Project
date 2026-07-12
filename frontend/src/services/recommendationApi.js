const API_BASE_URL = "http://localhost:8000"; // adjust to match your backend main.py host/port

/**
 * Fetches ranked outfit suggestions (each including an accessory pick) for a given occasion.
 * Expected response shape:
 * {
 *   suggestions: [
 *     {
 *       id: string,
 *       rank: number,
 *       compatibility: number, // 0-100
 *       items: [{ id, category }] // category: top | bottom | shoes | belt | watch | jewelry
 *     }
 *   ]
 * }
 *
 * NOTE: Backend endpoint not built yet. This function is mocked below.
 * Once your rule engine endpoint exists, replace the mock block with the
 * commented-out fetch call — nothing else in the app needs to change.
 */
export async function getOutfitSuggestions(occasion) {
  // --- REAL CALL (uncomment when backend endpoint is ready) ---
  // const response = await fetch(
  //   `${API_BASE_URL}/api/recommend/outfits?occasion=${encodeURIComponent(occasion)}`
  // );
  // if (!response.ok) {
  //   throw new Error(`Recommendation request failed: ${response.status}`);
  // }
  // return response.json();

  // --- MOCK (remove once real call is wired up) ---
  await new Promise((resolve) => setTimeout(resolve, 700)); // simulate network delay

  const mockAccessoryByOccasion = {
    Work: "watch",
    Party: "jewelry",
    Wedding: "jewelry",
    Everyday: "belt",
  };

  const accessory = mockAccessoryByOccasion[occasion] || "belt";

  return {
    suggestions: [
      {
        id: `${occasion}-1`,
        rank: 1,
        compatibility: 95,
        items: [
          { id: "top1", category: "top" },
          { id: "bottom1", category: "bottom" },
          { id: "shoes1", category: "shoes" },
          { id: "acc1", category: accessory },
        ],
      },
      {
        id: `${occasion}-2`,
        rank: 2,
        compatibility: 87,
        items: [
          { id: "top2", category: "top" },
          { id: "bottom2", category: "bottom" },
          { id: "shoes2", category: "shoes" },
          { id: "acc2", category: accessory },
        ],
      },
      {
        id: `${occasion}-3`,
        rank: 3,
        compatibility: 78,
        items: [
          { id: "top3", category: "top" },
          { id: "bottom3", category: "bottom" },
          { id: "shoes3", category: "shoes" },
          { id: "acc3", category: accessory },
        ],
      },
    ],
  };
}