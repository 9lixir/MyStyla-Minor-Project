import { useEffect, useState } from "react";
import OccasionTabs from "../components/OccasionTabs";
import OutfitSuggestionCard from "../components/OutfitSuggestionCard";
import { getOutfitSuggestions } from "../services/recommendationApi";
import { fetchCurrentWeather } from "../services/outfit.service";
import { useAuthStore } from "@/store/auth-store";
import {
  WEATHER_CHOICES,
  describeWeatherChoice,
} from "@/lib/weatherChoices";

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
          weatherMode ? weather : null
        );

        if (!isCancelled) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      isCancelled = true;
    };
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
            position.coords.longitude
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
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
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
    <div className="mystyla-app-shell relative min-h-screen overflow-hidden px-5 py-10 sm:px-8">
      {/* Quiet editorial background */}
      <div
        className="pointer-events-none absolute -right-40 top-0 h-[520px] w-[520px] rounded-full border opacity-25"
        style={{ borderColor: "var(--mystyla-primary)" }}
      />

      <div
        className="pointer-events-none absolute -left-52 bottom-20 h-[500px] w-[500px] rounded-full border opacity-15"
        style={{ borderColor: "var(--mystyla-primary)" }}
      />

      <div className="relative mx-auto max-w-5xl">

        {/* Header */}
        <header className="mb-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p
                className="mystyla-masthead mb-3 text-xs tracking-[0.2em]"
                style={{ color: "var(--mystyla-primary)" }}
              >
                my styla
              </p>

              <h2
                className="mystyla-display text-5xl font-bold leading-[0.95] sm:text-6xl"
                style={{ color: "var(--mystyla-ink)" }}
              >
                Outfit
                <br />
                Suggestions
              </h2>

              <div
                className="mt-5 h-px w-20"
                style={{ background: "var(--mystyla-primary)" }}
              />

              <p
                className="mt-5 max-w-lg text-base leading-7"
                style={{
                  color: "var(--mystyla-muted)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Curated looks from what you already own,
                styled around the occasion and weather.
              </p>
            </div>

            {onBack && (
              <button
                onClick={onBack}
                className="rounded-full border px-5 py-2.5 text-sm transition hover:-translate-x-0.5"
                style={{
                  borderColor: "var(--mystyla-border)",
                  background: "var(--mystyla-surface)",
                  color: "var(--mystyla-muted)",
                  fontFamily: "'Manrope', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--mystyla-primary)";
                  e.currentTarget.style.color =
                    "var(--mystyla-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor =
                    "var(--mystyla-border)";
                  e.currentTarget.style.color =
                    "var(--mystyla-muted)";
                }}
                data-cy="back-button"
              >
                ← Back
              </button>
            )}
          </div>
        </header>

        {/* Occasion */}
        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{
                  color: "var(--mystyla-primary)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Dressing for
              </p>

              <p
                className="mt-1 text-lg"
                style={{
                  color: "var(--mystyla-ink)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Choose your occasion
              </p>
            </div>

            <span
              className="hidden text-sm capitalize sm:block"
              style={{
                color: "var(--mystyla-muted)",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {occasion}
            </span>
          </div>

          <OccasionTabs
            selected={occasion}
            onSelect={setOccasion}
          />

          <div
            className="mt-6 h-px"
            style={{ background: "var(--mystyla-border)" }}
          />

          {/* Weather controls */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              onClick={handleStandardSuggestions}
              className="rounded-full px-5 py-2.5 text-sm transition"
              style={
                weatherSource === "standard"
                  ? {
                      background: "var(--mystyla-primary)",
                      color: "#fff",
                    }
                  : {
                      border: "1px solid var(--mystyla-border)",
                      background: "transparent",
                      color: "var(--mystyla-muted)",
                    }
              }
            >
              Standard
            </button>

            <button
              onClick={handleWeatherSuggestions}
              className="rounded-full px-5 py-2.5 text-sm transition"
              style={
                weatherSource === "current"
                  ? {
                      background: "var(--mystyla-primary)",
                      color: "#fff",
                    }
                  : {
                      border: "1px solid var(--mystyla-border)",
                      background: "transparent",
                      color: "var(--mystyla-muted)",
                    }
              }
            >
              Current weather
            </button>

            <button
              type="button"
              onClick={handleToggleWeatherChoices}
              className="rounded-full px-5 py-2.5 text-sm transition"
              style={
                showWeatherChoices || weatherSource === "choice"
                  ? {
                      background: "var(--mystyla-primary)",
                      color: "#fff",
                    }
                  : {
                      border: "1px solid var(--mystyla-border)",
                      background: "transparent",
                      color: "var(--mystyla-muted)",
                    }
              }
              data-cy="toggle-weather-choices"
            >
              Choose weather
            </button>
          </div>
        </section>

        {/* Weather choices */}
        {showWeatherChoices && (
          <section
            className="mb-8 border-y py-6"
            style={{
              borderColor: "var(--mystyla-border)",
            }}
          >
            <div className="mb-5">
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{
                  color: "var(--mystyla-primary)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Weather condition
              </p>

              <p
                className="mt-2 text-base"
                style={{
                  color: "var(--mystyla-muted)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Pick the conditions your outfit should work for.
              </p>
            </div>

            <div
              className="grid gap-3 sm:grid-cols-4"
              data-cy="weather-choice-list"
            >
              {WEATHER_CHOICES.map((choice) => {
                const isActive =
                  weatherMode && weatherLabel === choice.label;

                return (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleWeatherChoice(choice)}
                    className="rounded-2xl border px-5 py-4 text-left transition hover:-translate-y-0.5"
                    style={
                      isActive
                        ? {
                            borderColor: "var(--mystyla-primary)",
                            background: "var(--mystyla-primary-soft)",
                            color: "var(--mystyla-ink)",
                          }
                        : {
                            borderColor: "var(--mystyla-border)",
                            background: "var(--mystyla-surface)",
                            color: "var(--mystyla-muted)",
                          }
                    }
                    data-cy={`weather-choice-${choice.id}`}
                  >
                    <span className="block text-sm font-medium">
                      {choice.label}
                    </span>

                    <span
                      className="mt-1.5 block text-xs leading-5"
                      style={{ color: "var(--mystyla-muted)" }}
                    >
                      {choice.summary}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Active weather */}
        {weatherMode && weather && (
          <div
            className="mb-8 flex items-center gap-3 border-b pb-4"
            style={{
              borderColor: "var(--mystyla-border)",
              color: "var(--mystyla-muted)",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--mystyla-primary)" }}
            />

            <p className="text-sm capitalize">
              {weatherLabel ? `${weatherLabel} · ` : ""}
              {describeWeatherChoice(weather)}
            </p>
          </div>
        )}

        {weatherError && (
          <p
            className="mb-6 text-sm"
            style={{ color: "var(--mystyla-primary)" }}
          >
            {weatherError}
          </p>
        )}

        {/* Results heading */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="mb-7 flex items-end justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-[0.2em]"
                style={{
                  color: "var(--mystyla-primary)",
                  fontFamily: "'Manrope', sans-serif",
                }}
              >
                Curated for you
              </p>

              <h3
                className="mystyla-display mt-2 text-3xl sm:text-4xl"
                style={{ color: "var(--mystyla-ink)" }}
              >
                Your top looks
              </h3>
            </div>

            <span
              className="text-sm"
              style={{
                color: "var(--mystyla-muted)",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {suggestions.length} looks
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div
            className="border-y py-20 text-center"
            style={{
              borderColor: "var(--mystyla-border)",
              color: "var(--mystyla-muted)",
              fontFamily: "'Manrope', sans-serif",
            }}
            data-cy="suggestions-loading"
          >
            <div
              className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
              style={{
                borderColor: "var(--mystyla-border)",
                borderTopColor: "var(--mystyla-primary)",
              }}
            />

            <p className="text-base">
              Finding your best combinations...
            </p>

            <p className="mt-2 text-sm opacity-70">
              Matching your wardrobe to {occasion.toLowerCase()}.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="border-y py-16 text-center"
            style={{
              borderColor: "var(--mystyla-border)",
              color: "var(--mystyla-primary)",
            }}
            data-cy="suggestions-error"
          >
            <p className="text-base">
              Couldn't load suggestions. Please try again.
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && suggestions.length === 0 && (
          <div
            className="border-y py-20 text-center"
            style={{
              borderColor: "var(--mystyla-border)",
              color: "var(--mystyla-muted)",
            }}
            data-cy="suggestions-empty"
          >
            <p
              className="mystyla-display text-3xl"
              style={{ color: "var(--mystyla-ink)" }}
            >
              Nothing quite yet.
            </p>

            <p className="mt-3 text-base">
              No outfit combinations found for this occasion yet.
            </p>
          </div>
        )}

        {/* Ranked outfits */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div
            className="flex flex-col gap-8"
            data-cy="suggestions-list"
          >
            {suggestions.map((suggestion, idx) => (
              <div
                key={suggestion.id}
                className="mystyla-fade-in-up w-full"
                style={{
                  animationDelay: `${idx * 90}ms`,
                }}
              >
                <OutfitSuggestionCard suggestion={suggestion} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom detail */}
        {!isLoading && !error && suggestions.length > 0 && (
          <div className="mt-14 flex items-center justify-center gap-4">
            <div
              className="h-px w-16"
              style={{ background: "var(--mystyla-border)" }}
            />

            <span
              className="text-[10px] uppercase tracking-[0.3em]"
              style={{
                color: "var(--mystyla-muted)",
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              MyStyla
            </span>

            <div
              className="h-px w-16"
              style={{ background: "var(--mystyla-border)" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default OutfitSuggestions;