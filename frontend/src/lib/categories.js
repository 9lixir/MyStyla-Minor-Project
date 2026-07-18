// Shared garment taxonomy for MyStyla.
// Keep this in sync with the backend's classifier label list
// (see the Python CATEGORY_LABELS list — mirror any change both places).

// Flat list handed to the tagging model / any <select> that needs every value.
export const CATEGORY_LABELS = [
  // Tops
  "t-shirt",
  "shirt",
  "blouse",
  "tank top",
  "polo",
  "crop top",
  "tube top",
  "bodysuit",
  // Sweaters & Knits
  "sweater",
  "cardigan",
  "hoodie",
  "sweatshirt",
  "turtleneck",
  // Outerwear
  "jacket",
  "denim jacket",
  "leather jacket",
  "blazer",
  "coat",
  "parka",
  "windbreaker",
  "vest",
  // Bottoms
  "jeans",
  "trousers",
  "chinos",
  "cargo pants",
  "joggers",
  "leggings",
  "shorts",
  // Skirts
  "skirt",
  "mini skirt",
  "maxi skirt",
  "pleated skirt",
  // Dresses & Sets
  "dress",
  "jumpsuit",
  "romper",
  "co-ord set",
  // Formalwear
  "suit",
  "tuxedo",
  "gown",
  // Footwear
  "sneakers",
  "boots",
  "sandals",
  "heels",
  "flats",
  "loafers",
  // Accessories
  "belt",
  "hat",
  "scarf",
  "gloves",
  "tie",
  "bag",
  "sunglasses",
  "jewelry",
  "watch",
];

// Same labels, organized into display groups for the Wardrobe grid.
export const CATEGORY_GROUPS = [
  {
    id: "tops",
    label: "Tops",
    icon: "top",
    categories: ["t-shirt", "shirt", "blouse", "tank top", "polo", "crop top", "tube top", "bodysuit"],
  },
  {
    id: "knitwear",
    label: "Sweaters & Knits",
    icon: "top",
    categories: ["sweater", "cardigan", "hoodie", "sweatshirt", "turtleneck"],
  },
  {
    id: "outerwear",
    label: "Outerwear",
    icon: "outerwear",
    categories: ["jacket", "denim jacket", "leather jacket", "blazer", "coat", "parka", "windbreaker", "vest"],
  },
  {
    id: "bottoms",
    label: "Bottoms",
    icon: "bottom",
    categories: ["jeans", "trousers", "chinos", "cargo pants", "joggers", "leggings", "shorts"],
  },
  {
    id: "skirts",
    label: "Skirts",
    icon: "bottom",
    categories: ["skirt", "mini skirt", "maxi skirt", "pleated skirt"],
  },
  {
    id: "dresses",
    label: "Dresses & Sets",
    icon: "dress",
    categories: ["dress", "jumpsuit", "romper", "co-ord set"],
  },
  {
    id: "formalwear",
    label: "Formalwear",
    icon: "dress",
    categories: ["suit", "tuxedo", "gown"],
  },
  {
    id: "footwear",
    label: "Footwear",
    icon: "footwear",
    categories: ["sneakers", "boots", "sandals", "heels", "flats", "loafers"],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "accessory",
    categories: ["belt", "hat", "scarf", "gloves", "tie", "bag", "sunglasses", "jewelry", "watch"],
  },
];

// category -> group id, built once so Wardrobe.jsx can bucket garments in O(1).
export const CATEGORY_TO_GROUP = CATEGORY_GROUPS.reduce((map, group) => {
  group.categories.forEach((cat) => {
    map[cat] = group.id;
  });
  return map;
}, {});

// category -> icon key, for CategoryIcon.jsx
export const CATEGORY_TO_ICON = CATEGORY_GROUPS.reduce((map, group) => {
  group.categories.forEach((cat) => {
    map[cat] = group.icon;
  });
  return map;
}, {});

// Garments tagged under the old, broader 8-category scheme (before this
// taxonomy expanded) still carry labels like "top" or "bottom". Map those
// straight to a group so old data doesn't get stranded in "Other".
const LEGACY_ALIASES = {
  top: "tops",
  bottom: "bottoms",
  bottoms: "bottoms",
  outerwear: "outerwear",
  footwear: "footwear",
  shoes: "footwear",
  belt: "accessories",
  watch: "accessories",
  jewelry: "accessories",
  bag: "accessories",
  accessory: "accessories",
  dress: "dresses",
};

// Case/whitespace-insensitive lookup with legacy fallback. Always prefer
// this over indexing CATEGORY_TO_GROUP directly.
export function groupForCategory(category) {
  if (!category) return undefined;
  const key = category.trim().toLowerCase();
  return CATEGORY_TO_GROUP[key] || LEGACY_ALIASES[key];
}

export function iconForCategory(category) {
  if (!category) return "default";
  const key = category.trim().toLowerCase();
  return CATEGORY_TO_ICON[key] || key; // old labels (top/bottom/...) already match CategoryIcon's own keys
}

export const FORMALITY_LABELS = ["casual", "formal", "business casual", "athletic"];
export const SEASON_LABELS = ["summer", "winter", "spring", "autumn", "all-season"];
export const PATTERN_LABELS = ["solid", "striped", "floral", "plaid", "polka dot", "graphic print"];
export const OCCASION_LABELS = ["everyday wear", "party", "work", "workout", "formal event"];