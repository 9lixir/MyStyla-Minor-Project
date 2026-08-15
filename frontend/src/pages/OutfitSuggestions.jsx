import { useEffect, useState } from "react";
import OccasionTabs from "../components/OccasionTabs";
import OutfitSuggestionCard from "../components/OutfitSuggestionCard";
import { getOutfitSuggestions } from "../services/recommendationApi";
import { fetchCurrentWeather } from "../services/outfit.service";
import { useAuthStore } from "@/store/auth-store";

function OutfitSuggestions({ onBack }) {
  const { user } = useAuthStore.getState();
  const [occasion, setOccasion] = useState("Office");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherMode, setWeatherMode] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherError, setWeatherError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function fetchSuggestions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOutfitSuggestions(occasion, user?.id);
        if (!isCancelled) setSuggestions(data.suggestions);
      } catch (err) {
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchSuggestions();
    return () => { isCancelled = true; };
  }, [occasion, user?.id, weatherMode, weather]);

  const handleWeatherSuggestions = () => {
    if (!navigator.geolocation) {
      setWeatherError("Location is not supported in this browser.");
      return;
    }

    setIsLoading(true);
    setWeatherError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const currentWeather = await fetchCurrentWeather(
            position.coords.latitude,
            position.coords.longitude,
          );
          setWeather(currentWeather);
          setWeatherMode(true);
        } catch (err) {
          setWeatherError(err.message || "Couldn't load weather.");
          setIsLoading(false);
        }
      },
      () => {
        setWeatherError("Location permission was denied.");
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  return (
    <div className="mystyla-app-shell min-h-screen p-6" data-cy="outfit-suggestions-page">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <p className="mystyla-masthead text-[10px] mb-2">styled for you</p>
            <h2 className="mystyla-display text-4xl text-[#F5F3FF]">
              Outfit Suggestions
            </h2>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-4 py-2 text-sm text-[#F5F3FF]/80 hover:border-[#FF6FB5]/60 hover:text-[#FF6FB5] transition"
              style={{ fontFamily: "Inter, sans-serif" }}
              data-cy="back-button"
            >
              Back
            </button>
          )}
        </div>
        <p className="text-sm text-[#B9C0E8] mb-5" style={{ fontFamily: "Inter, sans-serif" }}>
          Matched from your saved tags, colors, and accessory rules
        </p>

        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setWeatherMode(false)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              weatherMode
                ? "border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8]"
                : "bg-[#FF6FB5] text-white"
            }`}
          >
            Standard Suggest
          </button>
          <button
            onClick={handleWeatherSuggestions}
            className={`rounded-full px-4 py-2 text-sm transition ${
              weatherMode
                ? "bg-[#FF6FB5] text-white"
                : "border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8]"
            }`}
          >
            Suggest by Weather
          </button>
        </div>
        {weatherMode && weather ? (
          <p className="mb-4 text-xs capitalize text-[#B9C0E8]">
            Weather filter: {Math.round(weather.temperature_c)}°C, {weather.condition}
          </p>
        ) : null}
        {weatherError ? (
          <p className="mb-4 text-xs text-[#FF4FA0]">{weatherError}</p>
        ) : null}

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FF6FB5] mb-2">
            Select Occasion
          </p>
          <OccasionTabs selected={occasion} onSelect={setOccasion} />
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 py-12 text-center text-[#B9C0E8]" data-cy="suggestions-loading">
            Finding your best combinations...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 py-12 text-center text-[#FF4FA0]" data-cy="suggestions-error">
            Couldn't load suggestions. Please try again.
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 py-12 text-center text-[#B9C0E8]" data-cy="suggestions-empty">
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