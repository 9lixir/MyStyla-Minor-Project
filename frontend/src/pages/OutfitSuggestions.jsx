import { useEffect, useState } from "react";
import OccasionTabs from "../components/OccasionTabs";
import OutfitSuggestionCard from "../components/OutfitSuggestionCard";
import { getOutfitSuggestions } from "../services/recommendationApi";
import { fetchCurrentWeather } from "../services/outfit.service";
import { useAuthStore } from "@/store/auth-store";
import { WEATHER_CHOICES, describeWeatherChoice } from "@/lib/weatherChoices";
import AbstractBackground from "../components/AbstractBackground";

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
        const data = await getOutfitSuggestions(
                      occasion,
                      user?.id,
                      5,
                      weatherMode ? weather : null,
                    );
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
    <div className="mystyla-app-shell relative min-h-screen px-4 py-8 sm:px-6">
      <AbstractBackground variant="flowers" />

      <div className="relative max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-1">
          <div>
            <p className="mystyla-masthead text-[10px] mb-2">styled for you</p>
            <h2 className="mystyla-display text-4xl" style={{ color: 'var(--mystyla-ink)' }}>
              Outfit Suggestions
            </h2>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full border px-4 py-2 text-sm transition"
              style={{
                borderColor: 'var(--mystyla-border)',
                background: 'var(--mystyla-surface)',
                color: 'var(--mystyla-muted)',
                fontFamily: "'Manrope', sans-serif",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--mystyla-primary)';
                e.currentTarget.style.color = 'var(--mystyla-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--mystyla-border)';
                e.currentTarget.style.color = 'var(--mystyla-muted)';
              }}
              data-cy="back-button"
            >
              Back
            </button>
          )}
        </div>

        <p className="text-sm mb-5" style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}>
          Matched from your saved tags, colors, and accessory rules
        </p>

        {/* Action Controls */}
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={handleStandardSuggestions}
            className="rounded-full px-4 py-2 text-sm transition"
            style={
              weatherSource === "standard"
                ? { background: 'var(--mystyla-primary)', color: '#fff' }
                : { border: '1px solid var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }
            }
          >
            Standard Suggest
          </button>
          <button
            onClick={handleWeatherSuggestions}
            className="rounded-full px-4 py-2 text-sm transition"
            style={
              weatherSource === "current"
                ? { background: 'var(--mystyla-primary)', color: '#fff' }
                : { border: '1px solid var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }
            }
          >
            Suggest for Current Weather
          </button>
          <button
            type="button"
            onClick={handleToggleWeatherChoices}
            className="rounded-full px-4 py-2 text-sm transition"
            style={
              showWeatherChoices || weatherSource === "choice"
                ? { background: 'var(--mystyla-primary)', color: '#fff' }
                : { border: '1px solid var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }
            }
            data-cy="toggle-weather-choices"
          >
            Choose Weather Condition
          </button>
        </div>

        {/* Weather Selection Panel */}
        {showWeatherChoices && (
          <div
            className="mb-5 rounded-xl border p-3"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)' }}
          >
            <p
              className="mb-2 text-xs uppercase tracking-[0.2em]"
              style={{ color: 'var(--mystyla-primary)' }}
            >
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
                    className="rounded-xl border px-4 py-3 text-left transition"
                    style={
                      isActive
                        ? { borderColor: 'var(--mystyla-primary)', background: 'var(--mystyla-primary-soft)', color: 'var(--mystyla-ink)' }
                        : { borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }
                    }
                    data-cy={`weather-choice-${choice.id}`}
                  >
                    <span className="block text-sm font-medium">{choice.label}</span>
                    <span className="mt-1 block text-xs" style={{ color: 'var(--mystyla-muted)' }}>{choice.summary}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {weatherMode && weather && (
          <p className="mb-4 text-xs capitalize" style={{ color: 'var(--mystyla-muted)' }}>
            Weather filter: {weatherLabel ? `${weatherLabel} - ` : ""}
            {describeWeatherChoice(weather)}
          </p>
        )}

        {weatherError && (
          <p className="mb-4 text-xs" style={{ color: 'var(--mystyla-primary)' }}>{weatherError}</p>
        )}

        {/* Occasion Selection */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--mystyla-primary)' }}>
            Select Occasion
          </p>
          <OccasionTabs selected={occasion} onSelect={setOccasion} />
        </div>

        {/* Content States */}
        {isLoading && (
          <div
            className="rounded-2xl border py-12 text-center"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }}
            data-cy="suggestions-loading"
          >
            Finding your best combinations...
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl border py-12 text-center"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-primary)' }}
            data-cy="suggestions-error"
          >
            Couldn't load suggestions. Please try again.
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div
            className="rounded-2xl border py-12 text-center"
            style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-muted)' }}
            data-cy="suggestions-empty"
          >
            No outfit combinations found for this occasion yet.
          </div>
        )}

        {!isLoading && !error && suggestions.length > 0 && (
          <div className="flex flex-col gap-4" data-cy="suggestions-list">
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion.id}
                className="mystyla-fade-in-up"
                style={{ animationDelay: `${idx * 90}ms` }}
              >
                <OutfitSuggestionCard suggestion={suggestion} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutfitSuggestions;