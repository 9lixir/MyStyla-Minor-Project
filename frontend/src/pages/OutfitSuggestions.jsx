import { useEffect, useState } from "react";
import OccasionTabs from "../components/OccasionTabs";
import OutfitSuggestionCard from "../components/OutfitSuggestionCard";
import { getOutfitSuggestions } from "../services/recommendationApi";
import { fetchCurrentWeather } from "../services/outfit.service";
import { useAuthStore } from "@/store/auth-store";
import { WEATHER_CHOICES, describeWeatherChoice } from "@/lib/weatherChoices";

function OutfitSuggestions({ onBack }) {
  const { user } = useAuthStore.getState();
  const [occasion, setOccasion] = useState("Office");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherMode, setWeatherMode] = useState(false);
  const [weather, setWeather] = useState(null);
  const [weatherLabel, setWeatherLabel] = useState("");
  const [weatherError, setWeatherError] = useState("");
  const [showWeatherChoices, setShowWeatherChoices] = useState(false);
  const [weatherSource, setWeatherSource] = useState("standard");

  useEffect(() => {
    let isCancelled = false;

    async function fetchSuggestions() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getOutfitSuggestions(occasion, user?.id, 5, weatherMode ? weather : null);
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
          if (!currentWeather) {
            setWeather(null);
            setWeatherMode(false);
            setWeatherLabel("");
            setIsLoading(false);
            return;
          }
          setWeather(currentWeather);
          setWeatherLabel("Current Location");
          setWeatherMode(true);
          setShowWeatherChoices(false);
          setWeatherSource("current");
        } catch {
          setWeather(null);
          setWeatherLabel("");
          setWeatherMode(false);
          setWeatherSource("standard");
          setIsLoading(false);
        }
      },
      () => {
        setWeatherError("Location permission was denied.");
        setWeatherSource("standard");
        setIsLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  };

  const handleStandardSuggestions = () => {
    setWeatherMode(false);
    setWeather(null);
    setWeatherLabel("");
    setWeatherError("");
    setShowWeatherChoices(false);
    setWeatherSource("standard");
  };

  const handleWeatherChoice = (choice) => {
    setWeather(choice.weather);
    setWeatherLabel(choice.label);
    setWeatherMode(true);
    setShowWeatherChoices(true);
    setWeatherError("");
    setWeatherSource("choice");
  };

  const handleToggleWeatherChoices = () => {
    setShowWeatherChoices((current) => {
      const next = !current;
      if (next) {
        setWeatherSource("choice");
        if (weatherSource === "current") {
          setWeatherMode(false);
          setWeather(null);
          setWeatherLabel("");
        }
      } else if (!weatherMode) {
        setWeatherSource("standard");
      }
      return next;
    });
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
            onClick={handleStandardSuggestions}
            className={`rounded-full px-4 py-2 text-sm transition ${
              weatherSource === "standard"
                ? "bg-[#FF6FB5] text-white"
                : "border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8]"
            }`}
          >
            Standard Suggest
          </button>
          <button
            onClick={handleWeatherSuggestions}
            className={`rounded-full px-4 py-2 text-sm transition ${
              weatherSource === "current"
                ? "bg-[#FF6FB5] text-white"
                : "border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8]"
            }`}
          >
            Suggest for Current Weather
          </button>
          <button
            type="button"
            onClick={handleToggleWeatherChoices}
            className={`rounded-full px-4 py-2 text-sm transition ${
              showWeatherChoices || weatherSource === "choice"
                ? "bg-[#FF6FB5] text-white"
                : "border border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8]"
            }`}
            data-cy="toggle-weather-choices"
          >
            Choose Weather Condition
          </button>
        </div>

        {showWeatherChoices ? (
          <div className="mb-5 rounded-xl border border-[#2A3374] bg-[#151A4D]/70 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#FF6FB5]">
              Weather Condition
            </p>
            <div className="grid gap-2 sm:grid-cols-4" data-cy="weather-choice-list">
              {WEATHER_CHOICES.map((choice) => {
                const isActive = weatherMode && weatherLabel === choice.label;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleWeatherChoice(choice)}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      isActive
                        ? "border-[#FF6FB5] bg-[#FF6FB5]/15 text-[#F5F3FF]"
                        : "border-[#2A3374] bg-[#151A4D]/90 text-[#B9C0E8] hover:border-[#FF6FB5]/60"
                    }`}
                    data-cy={`weather-choice-${choice.id}`}
                  >
                    <span className="block text-sm font-medium">{choice.label}</span>
                    <span className="mt-1 block text-xs text-[#B9C0E8]">{choice.summary}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {weatherMode && weather ? (
          <p className="mb-4 text-xs capitalize text-[#B9C0E8]">
            Weather filter: {weatherLabel ? `${weatherLabel} - ` : ""}
            {describeWeatherChoice(weather)}
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
