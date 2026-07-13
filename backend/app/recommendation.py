"""
Rule-based Accessory Recommendation Engine
--------------------------------------------
Input:  an outfit's combined tags (occasion, formality, season, pattern, dominant_colors)
Output: ranked list of accessory suggestions, each with a reason and a confidence score

This does NOT do color-science (HSV harmony etc.) - that's Purnima's outfit-matching
engine. This engine answers a narrower question: "given this outfit's occasion/formality/
season, which accessory CATEGORIES make sense, and why."
"""

RULES = [
    {
        "name": "formal_formality",
        "condition": lambda tags: tags.get("formality") == "Formal",
        "suggest": [
            {"category": "watch", "name": "Minimalist Watch", "reason": "Formal outfits pair well with a clean timepiece"},
            {"category": "belt", "name": "Leather Belt", "reason": "A leather belt completes formal tailoring"},
        ],
        "weight": 30,
    },
    {
        "name": "smart_casual_formality",
        "condition": lambda tags: tags.get("formality") == "Smart Casual",
        "suggest": [
            {"category": "watch", "name": "Casual Watch", "reason": "Smart casual looks benefit from an understated watch"},
        ],
        "weight": 20,
    },
    {
        "name": "party_occasion",
        "condition": lambda tags: tags.get("occasion") == "Party",
        "suggest": [
            {"category": "jewelry", "name": "Statement Necklace", "reason": "Party occasions call for bolder jewelry"},
        ],
        "weight": 25,
    },
    {
        "name": "office_occasion",
        "condition": lambda tags: tags.get("occasion") == "Office",
        "suggest": [
            {"category": "belt", "name": "Structured Belt", "reason": "Office wear pairs well with a structured, neutral belt"},
        ],
        "weight": 20,
    },
    {
        "name": "date_occasion",
        "condition": lambda tags: tags.get("occasion") == "Date",
        "suggest": [
            {"category": "jewelry", "name": "Delicate Jewelry", "reason": "Subtle jewelry suits a date without overpowering the outfit"},
        ],
        "weight": 15,
    },
    {
        "name": "solid_pattern_allows_statement",
        "condition": lambda tags: tags.get("pattern") == "Solid",
        "suggest": [
            {"category": "jewelry", "name": "Statement Piece", "reason": "Solid, pattern-free outfits have room for a bolder accessory"},
        ],
        "weight": 10,
    },
    {
        "name": "busy_pattern_keep_minimal",
        "condition": lambda tags: tags.get("pattern") in ("Graphic", "Floral", "Checked"),
        "suggest": [
            {"category": "watch", "name": "Minimal Watch", "reason": "Busy patterns pair best with understated, minimal accessories"},
        ],
        "weight": 10,
    },
    {
        "name": "winter_season",
        "condition": lambda tags: tags.get("season") == "Winter",
        "suggest": [
            {"category": "scarf", "name": "Wool Scarf", "reason": "Cold-weather outfits benefit from a layered scarf"},
        ],
        "weight": 15,
    },
    {
        "name": "summer_season",
        "condition": lambda tags: tags.get("season") == "Summer",
        "suggest": [
            {"category": "sunglasses", "name": "Sunglasses", "reason": "Summer outfits pair naturally with sunglasses"},
        ],
        "weight": 15,
    },
]


def recommend_accessories(outfit_tags: dict) -> list[dict]:
    """
    Takes an outfit's combined tags and returns ranked accessory suggestions.
    Multiple rules can suggest the same category - their weights combine into
    a single confidence score for that accessory, and reasons are merged.
    """
    scored = {}

    for rule in RULES:
        if rule["condition"](outfit_tags):
            for item in rule["suggest"]:
                key = (item["category"], item["name"])
                if key not in scored:
                    scored[key] = {"reasons": [], "weight": 0}
                scored[key]["reasons"].append(item["reason"])
                scored[key]["weight"] += rule["weight"]

    if not scored:
        return []

    max_weight = max(entry["weight"] for entry in scored.values())

    results = []
    for (category, name), data in scored.items():
        confidence = min(100, round((data["weight"] / max_weight) * 100))
        results.append({
            "category": category,
            "name": name,
            "reason": data["reasons"][0],
            "confidence": confidence,
        })

    results.sort(key=lambda r: r["confidence"], reverse=True)
    return results


if __name__ == "__main__":
    sample_outfit = {
        "occasion": "Office",
        "formality": "Formal",
        "season": "Winter",
        "pattern": "Solid",
        "dominant_colors": ["#1a1a1a", "#f5f5f0"],
    }
    import json
    print(json.dumps(recommend_accessories(sample_outfit), indent=2))