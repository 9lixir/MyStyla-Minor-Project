import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import {
  buildAroundGarment,
  checkOutfitHealth,
  fetchCurrentWeather,
  fetchWardrobeGarments,
  generateOutfits,
} from '@/services/outfit.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CategoryIcon from '@/components/CategoryIcon';
import { API_BASE_URL } from '@/config';

const OCCASIONS = [
  'Casual',
  'College',
  'Shopping',
  'Travel',
  'Office',
  'Meeting',
  'Interview',
  'Presentation',
  'Party',
  'Date',
  'Dinner',
  'Birthday',
  'Wedding',
  'Puja',
  'Festival',
  'Religious Ceremony',
  'Farewell',
  'Graduation',
];

const DEFAULT_LOCATION = {
  label: 'Kathmandu',
  latitude: 27.7172,
  longitude: 85.324,
};

const scoreFont = { fontFamily: "'Fraunces', Georgia, serif" };

const formatColorTitle = (color) => {
  if (Array.isArray(color?.rgb)) {
    return `RGB: ${color.rgb.join(',')}`;
  }

  return color?.hex ? `Color: ${color.hex}` : 'Garment color';
};

export default function OutfitMatcher({ onBack }) {
  const { user } = useAuthStore.getState();

  const [occasion, setOccasion] = useState('Office');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [engineHealthy, setEngineHealthy] = useState(true);

  const [wardrobeGarments, setWardrobeGarments] = useState([]);
  const [selectedGarmentId, setSelectedGarmentId] = useState('');
  const [matchingItem, setMatchingItem] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  const [weather, setWeather] = useState(null);
  const [weatherLocation, setWeatherLocation] = useState(DEFAULT_LOCATION);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    checkOutfitHealth()
      .then((data) => {
        setEngineHealthy(data?.status === 'outfit_matching engine is running');
      })
      .catch(() => setEngineHealthy(false));

    fetchWardrobeGarments()
      .then((garments) => {
        const filteredForUser = garments.filter(
          (garment) => garment.user_id === user?.id
        );

        const source = filteredForUser.length > 0 ? filteredForUser : garments;

        setWardrobeGarments(source);

        if (source.length > 0) {
          setSelectedGarmentId(source[0].id);
        }
      })
      .catch(() => setWardrobeGarments([]));
  }, []);

  useEffect(() => {
    loadWeather(DEFAULT_LOCATION);
  }, []);

  const selectedGarment =
    wardrobeGarments.find((g) => g.id === selectedGarmentId) || null;

  const loadWeather = async (location) => {
    setWeatherLoading(true);
    setWeatherError('');

    try {
      const data = await fetchCurrentWeather(
        location.latitude,
        location.longitude
      );

      if (!data) {
        setWeather(null);
        setWeatherLocation(location);
        return;
      }

      setWeather(data);
      setWeatherLocation(location);
    } catch {
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError('Location is not supported in this browser.');
      return;
    }

    setWeatherLoading(true);
    setWeatherError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        loadWeather({
          label: 'Current location',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setWeatherLoading(false);
        setWeatherError(
          'Location permission was denied. Showing Kathmandu weather.'
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
      }
    );
  };

  const handleGenerate = async () => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }

    const parsedTopK = Number(topK);

    const normalizedTopK = Number.isFinite(parsedTopK)
      ? Math.min(20, Math.max(1, Math.floor(parsedTopK)))
      : 5;

    setTopK(normalizedTopK);
    setLoading(true);

    try {
      const data = await generateOutfits(
        user.id,
        occasion,
        normalizedTopK,
        weather
      );

      setResults(data);

      if (data.outfits.length === 0) {
        toast.info(
          `No outfits found for ${occasion}. Try adding more garments!`
        );
      } else {
        toast.success(`Generated ${data.outfits.length} outfit(s)!`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to generate outfits');
      console.error('Outfit generation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchItem = async () => {
    if (!user?.id) {
      toast.error('User ID not found. Please log in again.');
      return;
    }

    if (!selectedGarmentId) {
      toast.error('Select a garment to match first.');
      return;
    }

    const parsedTopK = Number(topK);

    const normalizedTopK = Number.isFinite(parsedTopK)
      ? Math.min(20, Math.max(1, Math.floor(parsedTopK)))
      : 5;

    setTopK(normalizedTopK);
    setMatchingItem(true);

    try {
      const payload = await buildAroundGarment(
        user.id,
        selectedGarmentId,
        occasion || null,
        normalizedTopK,
        weather
      );

      setMatchResults(payload);

      if ((payload.matches || []).length === 0) {
        toast.info(
          'No compatible garments found for this item and occasion.'
        );
      } else {
        toast.success(
          `Found ${payload.matches.length} compatible match(es).`
        );
      }
    } catch (error) {
      toast.error(error.message || 'Failed to match this item');
      console.error('Build around garment error:', error);
    } finally {
      setMatchingItem(false);
    }
  };

  return (
    <div className="mystyla-app-shell relative h-screen overflow-hidden p-4 sm:p-6">
      <div className="relative mx-auto flex h-full max-w-7xl flex-col">
        {/* Header */}
        <div className="mb-5 flex flex-shrink-0 items-start justify-between gap-4">
          <div>
            <p className="mystyla-masthead mb-2 text-[10px]">
              match studio
            </p>

            <h1
              className="mystyla-display text-4xl"
              style={{ color: 'var(--mystyla-ink)' }}
            >
              Outfit Matcher
            </h1>

            <p
              className="mt-2 text-sm"
              style={{ color: 'var(--mystyla-muted)' }}
            >
              Build complete looks from your wardrobe, occasion, and weather.
            </p>

            {!engineHealthy && (
              <p
                className="mt-3 rounded-xl border px-3 py-2 text-sm"
                style={{
                  borderColor:
                    'color-mix(in srgb, var(--mystyla-accent) 45%, transparent)',
                  background:
                    'color-mix(in srgb, var(--mystyla-accent) 12%, transparent)',
                  color: 'var(--mystyla-primary)',
                }}
              >
                Outfit engine health check failed. Generate may still work if
                backend is starting.
              </p>
            )}
          </div>

          {onBack && (
            <button
              onClick={onBack}
              className="rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5"
              style={{
                borderColor: 'var(--mystyla-border)',
                background: 'var(--mystyla-surface)',
                color: 'var(--mystyla-muted)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--mystyla-accent)';
                e.currentTarget.style.color = 'var(--mystyla-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--mystyla-border)';
                e.currentTarget.style.color = 'var(--mystyla-muted)';
              }}
            >
              Back
            </button>
          )}
        </div>

        {/* TWO INDEPENDENT COLUMNS */}
        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          {/* ============================================================
              LEFT COLUMN — WEATHER + GENERATOR + GENERATED OUTFITS
              ============================================================ */}
          <div
            className="min-h-0 overflow-y-auto pr-1"
            style={{
              scrollbarWidth: 'thin',
              overscrollBehavior: 'contain',
            }}
          >
            {/* Weather + Generate */}
            <Card
              className="mb-5 shadow-sm transition-shadow duration-300 hover:shadow-md"
              style={{
                borderColor: 'var(--mystyla-border)',
                background: 'var(--mystyla-surface)',
              }}
            >
              <CardContent className="p-5 sm:p-6">
                {/* Weather */}
                <div
                  className="mb-5 rounded-2xl border p-4"
                  style={{
                    borderColor: 'var(--mystyla-border)',
                    background: 'var(--mystyla-surface-2)',
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="mystyla-masthead text-[10px]">
                        current weather
                      </p>

                      <p
                        className="mt-1 text-sm"
                        style={{ color: 'var(--mystyla-ink)' }}
                      >
                        {weatherLoading
                          ? 'Loading weather...'
                          : weather
                          ? `${weatherLocation.label}: ${Math.round(
                              weather.temperature_c
                            )}°C, ${weather.condition}`
                          : 'Weather skipped'}
                      </p>

                      {weather && (
                        <p
                          className="mt-1 text-xs capitalize"
                          style={{ color: 'var(--mystyla-muted)' }}
                        >
                          Feels like {Math.round(weather.feels_like_c)}°C ·
                          Wind {Math.round(weather.wind_kph)} km/h ·{' '}
                          {weather.style_profile.replace('_', ' ')}
                        </p>
                      )}

                      {weatherError && (
                        <p
                          className="mt-1 text-xs"
                          style={{ color: 'var(--mystyla-accent)' }}
                        >
                          {weatherError}
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={handleUseCurrentLocation}
                      disabled={weatherLoading}
                      className="rounded-xl border px-4 py-2 text-sm transition-all duration-200 hover:-translate-y-0.5"
                      style={{
                        borderColor: 'var(--mystyla-border)',
                        background: 'var(--mystyla-surface)',
                        color: 'var(--mystyla-ink)',
                      }}
                    >
                      {weatherLoading ? 'Checking...' : 'Use My Location'}
                    </Button>
                  </div>
                </div>

                {/* Generator controls */}
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: 'var(--mystyla-ink)' }}
                    >
                      Occasion
                    </label>

                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full rounded-xl border px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--mystyla-border)',
                        background: 'var(--mystyla-surface-2)',
                        color: 'var(--mystyla-ink)',
                      }}
                    >
                      {OCCASIONS.map((occ) => (
                        <option key={occ} value={occ}>
                          {occ}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: 'var(--mystyla-ink)' }}
                    >
                      Number of Outfits
                    </label>

                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={topK}
                      onChange={(e) => setTopK(e.target.value)}
                      className="w-full rounded-xl border px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: 'var(--mystyla-border)',
                        background: 'var(--mystyla-surface-2)',
                        color: 'var(--mystyla-ink)',
                      }}
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="mystyla-button w-full rounded-xl py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 sm:col-span-2"
                  >
                    {loading ? 'Generating...' : 'Generate Outfits'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generated outfits */}
            {results && (
              <div className="space-y-4">
                <div
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'var(--mystyla-border)',
                    background: 'var(--mystyla-surface)',
                    color: 'var(--mystyla-muted)',
                  }}
                >
                  {results.message}

                  {typeof results.wardrobe_size_after_filter === 'number'
                    ? ` • ${results.wardrobe_size_after_filter} garments available`
                    : ''}
                </div>

                {results.outfits.length === 0 ? (
                  <Card
                    className="shadow-sm"
                    style={{
                      borderColor: 'var(--mystyla-border)',
                      background: 'var(--mystyla-surface)',
                    }}
                  >
                    <CardContent className="p-8 text-center">
                      <p style={{ color: 'var(--mystyla-muted)' }}>
                        No outfits found for {occasion}. Try another occasion
                        or add more garments!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  results.outfits.map((outfit, outfitIdx) => (
                    <Card
                      key={outfitIdx}
                      className="mystyla-fade-in-up shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                        borderColor: 'var(--mystyla-border)',
                        background: 'var(--mystyla-surface)',
                        animationDelay: `${outfitIdx * 50}ms`,
                      }}
                    >
                      <CardContent className="p-5 sm:p-6">
                        {/* Scores */}
                        <div
                          className="mb-5 pb-4"
                          style={{
                            borderBottom:
                              '1px dashed var(--mystyla-border)',
                          }}
                        >
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="mystyla-masthead text-[10px]">
                                Color Harmony
                              </p>
                              <p
                                className="mt-1 text-2xl"
                                style={{
                                  ...scoreFont,
                                  color: 'var(--mystyla-ink)',
                                }}
                              >
                                {(outfit.harmony_score * 100).toFixed(0)}%
                              </p>
                            </div>

                            <div>
                              <p className="mystyla-masthead text-[10px]">
                                Compatibility
                              </p>
                              <p
                                className="mt-1 text-2xl"
                                style={{
                                  ...scoreFont,
                                  color: 'var(--mystyla-ink)',
                                }}
                              >
                                {outfit.compat_score.toFixed(2)}
                              </p>
                            </div>

                            <div>
                              <p className="mystyla-masthead text-[10px]">
                                Overall Score
                              </p>
                              <p
                                className="mt-1 text-2xl"
                                style={{
                                  ...scoreFont,
                                  color: 'var(--mystyla-accent)',
                                }}
                              >
                                {(outfit.final_score * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Outfit preview */}
                        <div
                          className="mb-5 rounded-xl border p-3"
                          style={{
                            borderColor: 'var(--mystyla-border)',
                            background: 'var(--mystyla-surface-2)',
                          }}
                        >
                          <p className="mystyla-masthead mb-2 text-[10px]">
                            Outfit Preview
                          </p>

                          <div
                            className="flex snap-x snap-mandatory items-start gap-3 overflow-x-auto pb-2"
                            style={{
                              scrollbarWidth: 'thin',
                            }}
                          >
                            {outfit.garments.map((garment, gIdx) => (
                              <div
                                key={gIdx}
                                className="w-[100px] min-w-[100px] snap-start"
                              >
                                <div
                                  className="h-28 w-full overflow-hidden rounded-lg border transition-transform duration-200 hover:scale-105"
                                  style={{
                                    borderColor: 'var(--mystyla-border)',
                                    background: 'var(--mystyla-bg)',
                                  }}
                                >
                                  {garment.cutout_path ? (
                                    <img
                                      src={`${API_BASE_URL}/${garment.cutout_path}`}
                                      alt={
                                        garment.filename ||
                                        garment.category
                                      }
                                      className="h-full w-full object-contain p-1.5"
                                    />
                                  ) : (
                                    <div
                                      className="flex h-full w-full items-center justify-center"
                                      style={{
                                        color: 'var(--mystyla-accent)',
                                      }}
                                    >
                                      <CategoryIcon
                                        category={garment.category}
                                        className="h-8 w-8"
                                      />
                                    </div>
                                  )}
                                </div>

                                <p
                                  className="mt-1.5 truncate text-[10px]"
                                  style={{
                                    color: 'var(--mystyla-ink)',
                                  }}
                                >
                                  {garment.filename || garment.category}
                                </p>

                                <p
                                  className="text-[9px] capitalize"
                                  style={{
                                    color: 'var(--mystyla-muted)',
                                  }}
                                >
                                  {garment.category}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Garments */}
                        <div>
                          <p
                            className="mb-3 text-sm font-semibold"
                            style={{ color: 'var(--mystyla-ink)' }}
                          >
                            Garments
                          </p>

                          <div className="space-y-2">
                            {outfit.garments.map((garment, gIdx) => (
                              <div
                                key={gIdx}
                                className="flex items-center justify-between rounded-xl p-3 transition-colors duration-200"
                                style={{
                                  background:
                                    'var(--mystyla-surface-2)',
                                }}
                              >
                                <div className="flex-1">
                                  <p
                                    className="text-sm font-medium capitalize"
                                    style={{
                                      color: 'var(--mystyla-ink)',
                                    }}
                                  >
                                    {garment.filename ||
                                      garment.category}
                                  </p>

                                  <p
                                    className="mt-0.5 text-xs capitalize"
                                    style={{
                                      color: 'var(--mystyla-muted)',
                                    }}
                                  >
                                    {garment.category}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  {garment.dominant_colors
                                    ?.slice(0, 3)
                                    .map((color, cIdx) => (
                                      <div
                                        key={cIdx}
                                        className="h-6 w-6 rounded-full shadow-sm ring-1"
                                        style={{
                                          backgroundColor: color.hex,
                                          borderColor:
                                            'var(--mystyla-bg)',
                                          boxShadow:
                                            '0 0 0 1px var(--mystyla-border)',
                                        }}
                                        title={formatColorTitle(color)}
                                      />
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Accessories */}
                        {outfit.accessories?.length > 0 && (
                          <div
                            className="mt-5 pt-5"
                            style={{
                              borderTop:
                                '1px dashed var(--mystyla-border)',
                            }}
                          >
                            <p
                              className="mb-3 text-sm font-semibold"
                              style={{
                                color: 'var(--mystyla-ink)',
                              }}
                            >
                              Accessories
                            </p>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              {outfit.accessories.map((accessory) => (
                                <div
                                  key={accessory.slot}
                                  className="rounded-xl border p-3 transition-transform duration-200 hover:-translate-y-0.5"
                                  style={{
                                    borderColor:
                                      'var(--mystyla-border)',
                                    background:
                                      'var(--mystyla-surface-2)',
                                  }}
                                >
                                  <div
                                    className="mb-2 flex h-9 w-9 items-center justify-center rounded-md"
                                    style={{
                                      background:
                                        'color-mix(in srgb, var(--mystyla-accent) 12%, transparent)',
                                      color:
                                        'var(--mystyla-accent)',
                                    }}
                                  >
                                    <CategoryIcon
                                      category={accessory.slot}
                                      className="h-5 w-5"
                                    />
                                  </div>

                                  <p
                                    className="text-sm font-medium"
                                    style={{
                                      color: 'var(--mystyla-ink)',
                                    }}
                                  >
                                    {accessory.name}
                                  </p>

                                  <p
                                    className="mt-1 text-xs capitalize"
                                    style={{
                                      color: 'var(--mystyla-muted)',
                                    }}
                                  >
                                    {accessory.slot} ·{' '}
                                    {accessory.source}
                                  </p>

                                  {accessory.reason ? (
                                    <p
                                      className="mt-2 text-xs leading-5"
                                      style={{
                                        color:
                                          'var(--mystyla-muted)',
                                      }}
                                    >
                                      {accessory.reason}
                                    </p>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Score formula */}
                        <div
                          className="mt-5 pt-4 text-xs"
                          style={{
                            borderTop:
                              '1px dashed var(--mystyla-border)',
                            color: 'var(--mystyla-muted)',
                          }}
                        >
                          <p>
                            Score = 60% ×{' '}
                            {outfit.compat_score.toFixed(2)} + 40% ×{' '}
                            {outfit.harmony_score.toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {!results && !loading && (
              <Card
                className="shadow-sm"
                style={{
                  borderColor: 'var(--mystyla-border)',
                  background: 'var(--mystyla-surface)',
                }}
              >
                <CardContent className="p-8 text-center">
                  <p style={{ color: 'var(--mystyla-muted)' }}>
                    Select an occasion and click "Generate Outfits" to see
                    AI-matched combinations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ============================================================
              RIGHT COLUMN — MATCH THIS ITEM
              THIS COLUMN HAS ITS OWN INDEPENDENT SCROLL
              ============================================================ */}
          <div
            className="min-h-0 overflow-y-auto pr-1"
            style={{
              scrollbarWidth: 'thin',
              overscrollBehavior: 'contain',
            }}
          >
            <Card
              className="mb-5 shadow-sm transition-shadow duration-300 hover:shadow-md"
              style={{
                borderColor: 'var(--mystyla-border)',
                background: 'var(--mystyla-surface)',
              }}
            >
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5">
                  <p className="mystyla-masthead text-[10px]">
                    build around a piece
                  </p>

                  <h2
                    className="mt-1 text-2xl"
                    style={{
                      ...scoreFont,
                      color: 'var(--mystyla-ink)',
                    }}
                  >
                    Match This Item
                  </h2>

                  <p
                    className="mt-1 text-xs leading-5"
                    style={{ color: 'var(--mystyla-muted)' }}
                  >
                    Choose one garment and MyStyla will find compatible pieces
                    around it.
                  </p>
                </div>

                {/* Garment selector */}
                <div className="mb-5">
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: 'var(--mystyla-ink)' }}
                  >
                    Select Garment
                  </label>

                  <select
                    value={selectedGarmentId}
                    onChange={(e) =>
                      setSelectedGarmentId(e.target.value)
                    }
                    className="w-full rounded-xl border px-4 py-2.5 transition-colors duration-200 focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{
                      borderColor: 'var(--mystyla-border)',
                      background: 'var(--mystyla-surface-2)',
                      color: 'var(--mystyla-ink)',
                    }}
                    disabled={wardrobeGarments.length === 0}
                  >
                    {wardrobeGarments.length === 0 ? (
                      <option value="">
                        No garments available
                      </option>
                    ) : (
                      wardrobeGarments.map((garment) => (
                        <option
                          key={garment.id}
                          value={garment.id}
                        >
                          {(
                            garment.filename ||
                            garment.category ||
                            'garment'
                          ).toString()}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Selected garment */}
                {selectedGarment && (
                  <div
                    className="mb-5 rounded-2xl border p-4"
                    style={{
                      borderColor: 'var(--mystyla-border)',
                      background: 'var(--mystyla-surface-2)',
                    }}
                  >
                    <p className="mystyla-masthead mb-3 text-[10px]">
                      selected piece
                    </p>

                    <div className="flex items-center gap-4">
                      <div
                        className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border"
                        style={{
                          borderColor: 'var(--mystyla-border)',
                          background: 'var(--mystyla-bg)',
                        }}
                      >
                        {selectedGarment.cutout_path ? (
                          <img
                            src={`${API_BASE_URL}/${selectedGarment.cutout_path}`}
                            alt={
                              selectedGarment.filename ||
                              selectedGarment.category
                            }
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              color: 'var(--mystyla-accent)',
                            }}
                          >
                            <CategoryIcon
                              category={selectedGarment.category}
                              className="h-9 w-9"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-medium"
                          style={{
                            color: 'var(--mystyla-ink)',
                          }}
                        >
                          {selectedGarment.filename ||
                            selectedGarment.category}
                        </p>

                        <p
                          className="mt-1 text-xs capitalize"
                          style={{
                            color: 'var(--mystyla-muted)',
                          }}
                        >
                          {selectedGarment.category}
                        </p>

                        <p
                          className="mt-3 text-xs"
                          style={{
                            color: 'var(--mystyla-muted)',
                          }}
                        >
                          Matching for{' '}
                          <span
                            style={{
                              color: 'var(--mystyla-primary)',
                            }}
                          >
                            {occasion}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Occasion */}
                <div className="mb-5">
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: 'var(--mystyla-ink)' }}
                  >
                    Occasion Filter
                  </label>

                  <div
                    className="rounded-xl border px-4 py-2.5 text-sm"
                    style={{
                      borderColor: 'var(--mystyla-border)',
                      background: 'var(--mystyla-surface-2)',
                      color: 'var(--mystyla-muted)',
                    }}
                  >
                    {occasion || 'None'}
                  </div>
                </div>

                <Button
                  onClick={handleMatchItem}
                  disabled={
                    matchingItem || wardrobeGarments.length === 0
                  }
                  className="mystyla-button w-full rounded-xl py-3 font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
                >
                  {matchingItem
                    ? 'Finding Matches...'
                    : 'Match This Item'}
                </Button>
              </CardContent>
            </Card>

            {/* Match results */}
            {matchResults && (
              <div className="space-y-4">
                <div
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: 'var(--mystyla-border)',
                    background: 'var(--mystyla-surface)',
                    color: 'var(--mystyla-muted)',
                  }}
                >
                  {matchResults.message}
                </div>

                {/* Anchor garment */}
                <Card
                  className="shadow-sm"
                  style={{
                    borderColor: 'var(--mystyla-border)',
                    background: 'var(--mystyla-surface)',
                  }}
                >
                  <CardContent className="p-5">
                    <p className="mystyla-masthead mb-3 text-[10px]">
                      anchor garment
                    </p>

                    <div
                      className="flex items-center gap-4 rounded-2xl p-3"
                      style={{
                        background: 'var(--mystyla-surface-2)',
                      }}
                    >
                      <div
                        className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border"
                        style={{
                          borderColor: 'var(--mystyla-border)',
                          background: 'var(--mystyla-bg)',
                        }}
                      >
                        {matchResults.anchor_garment?.cutout_path ? (
                          <img
                            src={`${API_BASE_URL}/${matchResults.anchor_garment.cutout_path}`}
                            alt={
                              matchResults.anchor_garment.filename ||
                              matchResults.anchor_garment.category
                            }
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{
                              color: 'var(--mystyla-accent)',
                            }}
                          >
                            <CategoryIcon
                              category={
                                matchResults.anchor_garment
                                  ?.category
                              }
                              className="h-8 w-8"
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-medium"
                          style={{
                            color: 'var(--mystyla-ink)',
                          }}
                        >
                          {matchResults.anchor_garment?.filename ||
                            matchResults.anchor_garment?.category}
                        </p>

                        <p
                          className="mt-1 text-xs capitalize"
                          style={{
                            color: 'var(--mystyla-muted)',
                          }}
                        >
                          {matchResults.anchor_garment?.category}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compatible matches */}
                {(matchResults.matches || []).length === 0 ? (
                  <Card
                    className="shadow-sm"
                    style={{
                      borderColor: 'var(--mystyla-border)',
                      background: 'var(--mystyla-surface)',
                    }}
                  >
                    <CardContent className="p-8 text-center">
                      <p
                        style={{
                          color: 'var(--mystyla-muted)',
                        }}
                      >
                        No matches found for the selected garment.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  (matchResults.matches || []).map(
                    (match, matchIdx) => (
                      <Card
                        key={match.id}
                        className="mystyla-fade-in-up shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                        style={{
                          borderColor: 'var(--mystyla-border)',
                          background: 'var(--mystyla-surface)',
                          animationDelay: `${matchIdx * 50}ms`,
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border"
                              style={{
                                borderColor:
                                  'var(--mystyla-border)',
                                background:
                                  'var(--mystyla-bg)',
                              }}
                            >
                              {match.cutout_path ? (
                                <img
                                  src={`${API_BASE_URL}/${match.cutout_path}`}
                                  alt={
                                    match.filename ||
                                    match.category
                                  }
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <div
                                  className="flex h-full w-full items-center justify-center"
                                  style={{
                                    color:
                                      'var(--mystyla-accent)',
                                  }}
                                >
                                  <CategoryIcon
                                    category={match.category}
                                    className="h-8 w-8"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate text-sm font-medium"
                                style={{
                                  color:
                                    'var(--mystyla-ink)',
                                }}
                              >
                                {match.filename ||
                                  match.category}
                              </p>

                              <p
                                className="mt-1 text-xs capitalize"
                                style={{
                                  color:
                                    'var(--mystyla-muted)',
                                }}
                              >
                                {match.category}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="mystyla-masthead text-[10px]">
                                Compatibility
                              </p>

                              <p
                                className="text-xl"
                                style={{
                                  ...scoreFont,
                                  color:
                                    'var(--mystyla-accent)',
                                }}
                              >
                                {(
                                  match.compatibility_score *
                                  100
                                ).toFixed(0)}
                                %
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}