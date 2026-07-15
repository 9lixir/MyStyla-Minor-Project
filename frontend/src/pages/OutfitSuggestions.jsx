import { useEffect, useState } from "react";
import OccasionTabs from "../components/OccasionTabs";
import OutfitSuggestionCard from "../components/OutfitSuggestionCard";
import { getOutfitSuggestions } from "../services/recommendationApi";

function OutfitSuggestions({ onBack }) {
  const [occasion, setOccasion] = useState("Work");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchSuggestions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOutfitSuggestions(occasion);
        if (!isCancelled) setSuggestions(data.suggestions);
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchSuggestions();
    return () => { isCancelled = true; };
  }, [occasion]);

  return (
    <div className="min-h-screen bg-[#F7F6F3] p-6" data-cy="outfit-suggestions-page">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-3xl text-[#211D1B]" style={{ fontFamily: "Fraunces, serif" }}>
            Outfit Suggestions
          </h2>
          {onBack && (
            <button
              onClick={onBack}
              className="text-sm text-[#211D1B]/60 hover:text-[#7C2A35] transition"
              style={{ fontFamily: "Inter, sans-serif" }}
              data-cy="back-button"
            >
              ← Back to Wardrobe
            </button>
          )}
        </div>
        <p className="text-sm text-[#211D1B]/50 mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
          Combinations from your wardrobe
        </p>

        <div className="mb-6">
          <p
            className="text-xs uppercase tracking-[0.2em] text-[#B08D57] mb-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Select Occasion
          </p>
          <OccasionTabs selected={occasion} onSelect={setOccasion} />
        </div>

        {isLoading && (
          <div className="text-center py-12 text-[#211D1B]/50" style={{ fontFamily: "Inter, sans-serif" }} data-cy="suggestions-loading">
            Finding your best combinations...
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-[#7C2A35]" style={{ fontFamily: "Inter, sans-serif" }} data-cy="suggestions-error">
            Couldn't load suggestions. Please try again.
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center py-12 text-[#211D1B]/50" style={{ fontFamily: "Inter, sans-serif" }} data-cy="suggestions-empty">
            No outfit combinations found for this occasion yet.
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="flex flex-col gap-4" data-cy="suggestions-list">
            {suggestions.map((suggestion) => (
              <OutfitSuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutfitSuggestions;