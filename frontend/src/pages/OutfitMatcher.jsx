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

const OCCASIONS = ['Casual', 'Office', 'Party', 'Farewell'];
const DEFAULT_LOCATION = {
  label: 'Kathmandu',
  latitude: 27.7172,
  longitude: 85.324,
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
        const filteredForUser = garments.filter((garment) => garment.user_id === user?.id);
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

  const selectedGarment = wardrobeGarments.find((g) => g.id === selectedGarmentId) || null;

  const loadWeather = async (location) => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await fetchCurrentWeather(location.latitude, location.longitude);
      setWeather(data);
      setWeatherLocation(location);
    } catch (error) {
      setWeatherError(error.message || 'Failed to load weather');
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
        setWeatherError('Location permission was denied. Showing Kathmandu weather.');
      },
      { enableHighAccuracy: false, timeout: 10000 },
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
      const data = await generateOutfits(user.id, occasion, normalizedTopK, weather);
      setResults(data);
      
      if (data.outfits.length === 0) {
        toast.info(`No outfits found for ${occasion}. Try adding more garments!`);
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
        weather,
      );
      setMatchResults(payload);
      if ((payload.matches || []).length === 0) {
        toast.info('No compatible garments found for this item and occasion.');
      } else {
        toast.success(`Found ${payload.matches.length} compatible match(es).`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to match this item');
      console.error('Build around garment error:', error);
    } finally {
      setMatchingItem(false);
    }
  };

  return (
    <div className="mystyla-app-shell min-h-screen p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mystyla-masthead text-[10px] mb-2">match studio</p>
            <h1 className="mystyla-display text-4xl text-[#F5F3FF]">Outfit Matcher</h1>
            <p className="mt-2 text-sm text-[#B9C0E8]">
              Pick an occasion and MyStyla will pair garments with finishing accessories
            </p>
            {!engineHealthy ? (
              <p className="mt-3 rounded-xl border border-[#FFA8D4]/45 bg-[#FFA8D4]/12 px-3 py-2 text-sm text-[#FFD3EC]">
                Outfit engine health check failed. Generate may still work if backend is starting.
              </p>
            ) : null}
          </div>
          <button
            onClick={onBack}
            className="rounded-full border border-[#2A3374] bg-[#151A4D]/90 px-4 py-2 text-sm font-medium text-[#F5F3FF]/80 hover:border-[#FFA8D4]/70 hover:text-[#FFD3EC] transition"
          >
            Back
          </button>
        </div>

        <Card className="mb-6 border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-6 rounded-xl border border-[#2A3374] bg-[#1E2560] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#B9C0E8]">Current Weather</p>
                  <p className="mt-1 text-sm text-[#F5F3FF]">
                    {weatherLoading
                      ? 'Loading weather...'
                      : weather
                      ? `${weatherLocation.label}: ${Math.round(weather.temperature_c)}°C, ${weather.condition}`
                      : 'Weather not loaded'}
                  </p>
                  {weather ? (
                    <p className="mt-1 text-xs capitalize text-[#B9C0E8]">
                      Feels like {Math.round(weather.feels_like_c)}°C · Wind {Math.round(weather.wind_kph)} km/h · {weather.style_profile.replace('_', ' ')}
                    </p>
                  ) : null}
                  {weatherError ? (
                    <p className="mt-1 text-xs text-[#FF7AB8]">{weatherError}</p>
                  ) : null}
                </div>
                <Button
                  onClick={handleUseCurrentLocation}
                  disabled={weatherLoading}
                  className="rounded-xl border border-[#2A3374] bg-[#151A4D] px-4 py-2 text-sm text-[#F5F3FF] hover:border-[#FFA8D4]/70 hover:text-[#FFD3EC]"
                >
                  {weatherLoading ? 'Checking...' : 'Use My Location'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F3FF]">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full rounded-xl border border-[#2A3374] bg-[#1E2560] px-4 py-2.5 text-[#F5F3FF] focus:border-[#FFA8D4] focus:outline-none focus:ring-2 focus:ring-[#FFA8D4]/30"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F3FF]">
                  Number of Outfits
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full rounded-xl border border-[#2A3374] bg-[#1E2560] px-4 py-2.5 text-[#F5F3FF] focus:border-[#FFA8D4] focus:outline-none focus:ring-2 focus:ring-[#FFA8D4]/30"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="mystyla-button w-full rounded-xl py-2.5 font-medium text-white transition sm:col-span-2"
              >
                {loading ? 'Generating...' : 'Generate Outfits'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
          <CardContent className="p-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F3FF]">
                  Match This Item
                </label>
                <select
                  value={selectedGarmentId}
                  onChange={(e) => setSelectedGarmentId(e.target.value)}
                  className="w-full rounded-xl border border-[#2A3374] bg-[#1E2560] px-4 py-2.5 text-[#F5F3FF] focus:border-[#FFA8D4] focus:outline-none focus:ring-2 focus:ring-[#FFA8D4]/30"
                  disabled={wardrobeGarments.length === 0}
                >
                  {wardrobeGarments.length === 0 ? (
                    <option value="">No garments available</option>
                  ) : (
                    wardrobeGarments.map((garment) => (
                      <option key={garment.id} value={garment.id}>
                        {(garment.filename || garment.category || 'garment').toString()}
                      </option>
                    ))
                  )}
                </select>

                {selectedGarment && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#2A3374] bg-[#1E2560] p-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-[#5B63A8] bg-[#0E1240]">
                      {selectedGarment.cutout_path ? (
                        <img
                          src={`${API_BASE_URL}/${selectedGarment.cutout_path}`}
                          alt={selectedGarment.filename || selectedGarment.category}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[#FFA8D4]">
                          <CategoryIcon category={selectedGarment.category} className="h-7 w-7" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#F5F3FF]">
                        {selectedGarment.filename || selectedGarment.category}
                      </p>
                      <p className="text-xs capitalize text-[#B9C0E8]">{selectedGarment.category}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#F5F3FF]">
                  Occasion Filter
                </label>
                <p className="rounded-xl border border-[#2A3374] bg-[#1E2560] px-4 py-2.5 text-sm text-[#B9C0E8]">
                  {occasion || 'None'}
                </p>
              </div>

              <Button
                onClick={handleMatchItem}
                disabled={matchingItem || wardrobeGarments.length === 0}
                className="mystyla-button w-full rounded-xl py-2.5 font-medium text-white transition sm:col-span-2"
              >
                {matchingItem ? 'Matching...' : 'Match This Item'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <div className="space-y-4">
            <div className="mb-4 rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 px-4 py-3 text-sm text-[#B9C0E8]">
              {results.message}
              {typeof results.wardrobe_size_after_filter === 'number'
                ? ` • ${results.wardrobe_size_after_filter} garments available`
                : ''}
            </div>

            {results.outfits.length === 0 ? (
              <Card className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-[#B9C0E8]">
                    No outfits found for {occasion}. Try another occasion or add more garments!
                  </p>
                </CardContent>
              </Card>
            ) : (
              results.outfits.map((outfit, outfitIdx) => (
                <Card key={outfitIdx} className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm transition hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="mb-4 border-b border-[#2A3374] pb-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#B9C0E8]">
                            Color Harmony
                          </p>
                          <p className="mt-1 text-2xl font-bold text-[#F5F3FF]">
                            {(outfit.harmony_score * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#B9C0E8]">
                            Compatibility
                          </p>
                          <p className="mt-1 text-2xl font-bold text-[#F5F3FF]">
                            {outfit.compat_score.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#B9C0E8]">
                            Overall Score
                          </p>
                          <p className="mt-1 text-2xl font-bold text-[#FFA8D4]">
                            {(outfit.final_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 rounded-xl border border-[#2A3374] bg-[#1E2560] p-3">
                      <p className="mb-2 text-[11px] uppercase tracking-wide text-[#B9C0E8]">Outfit Preview</p>
                      <div className="flex items-start gap-3 overflow-x-auto pb-1">
                        {outfit.garments.map((garment, gIdx) => (
                          <div key={gIdx} className="min-w-[90px] w-[90px]">
                            <div className="h-24 w-full overflow-hidden rounded-lg border border-[#5B63A8] bg-[#0E1240]">
                              {garment.cutout_path ? (
                                <img
                                  src={`${API_BASE_URL}/${garment.cutout_path}`}
                                  alt={garment.filename || garment.category}
                                  className="h-full w-full object-contain p-1.5"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#FFA8D4]">
                                  <CategoryIcon category={garment.category} className="h-8 w-8" />
                                </div>
                              )}
                            </div>
                            <p className="mt-1.5 truncate text-[10px] text-[#F5F3FF]">{garment.filename || garment.category}</p>
                            <p className="text-[9px] capitalize text-[#B9C0E8]">{garment.category}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-3 text-sm font-semibold text-[#F5F3FF]">Garments</p>
                      <div className="space-y-2">
                        {outfit.garments.map((garment, gIdx) => (
                          <div
                            key={gIdx}
                            className="flex items-center justify-between rounded-xl bg-[#1E2560] p-3"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium capitalize text-[#F5F3FF]">
                                {garment.filename || garment.category}
                              </p>
                              <p className="mt-0.5 text-xs capitalize text-[#B9C0E8]">
                                {garment.category}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {garment.dominant_colors?.slice(0, 3).map((color, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="h-6 w-6 rounded-full border border-[#0E1240] shadow-sm ring-1 ring-[#2A3374]"
                                  style={{ backgroundColor: color.hex }}
                                  title={`RGB: ${color.rgb.join(',')}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {outfit.accessories?.length > 0 ? (
                      <div className="mt-4 border-t border-[#2A3374] pt-4">
                        <p className="mb-3 text-sm font-semibold text-[#F5F3FF]">Accessories</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {outfit.accessories.map((accessory) => (
                            <div
                              key={accessory.slot}
                              className="rounded-xl border border-[#2A3374] bg-[#1E2560] p-3"
                            >
                              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-[#FFA8D4]/12 text-[#FFA8D4]">
                                <CategoryIcon category={accessory.slot} className="h-5 w-5" />
                              </div>
                              <p className="text-sm font-medium text-[#F5F3FF]">{accessory.name}</p>
                              <p className="mt-1 text-xs capitalize text-[#B9C0E8]">
                                {accessory.slot} · {accessory.source}
                              </p>
                              {accessory.reason ? (
                                <p className="mt-2 text-xs leading-5 text-[#B9C0E8]">{accessory.reason}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-[#2A3374] pt-4 text-xs text-[#B9C0E8]">
                      <p>
                        Score = 60% × {outfit.compat_score.toFixed(2)} + 40% ×{' '}
                        {outfit.harmony_score.toFixed(2)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {matchResults && (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 px-4 py-3 text-sm text-[#B9C0E8]">
              {matchResults.message}
            </div>

            <Card className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
              <CardContent className="p-5">
                <p className="mb-2 text-xs uppercase tracking-wide text-[#B9C0E8]">Anchor Garment</p>
                <div className="flex items-center gap-3 rounded-xl bg-[#1E2560] p-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-[#5B63A8] bg-[#0E1240]">
                    {matchResults.anchor_garment?.cutout_path ? (
                      <img
                        src={`${API_BASE_URL}/${matchResults.anchor_garment.cutout_path}`}
                        alt={matchResults.anchor_garment.filename || matchResults.anchor_garment.category}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#FFA8D4]">
                        <CategoryIcon
                          category={matchResults.anchor_garment?.category}
                          className="h-7 w-7"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F5F3FF]">
                      {matchResults.anchor_garment?.filename || matchResults.anchor_garment?.category}
                    </p>
                    <p className="text-xs capitalize text-[#B9C0E8]">
                      {matchResults.anchor_garment?.category}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(matchResults.matches || []).length === 0 ? (
              <Card className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-[#B9C0E8]">No matches found for the selected garment.</p>
                </CardContent>
              </Card>
            ) : (
              (matchResults.matches || []).map((match) => (
                <Card key={match.id} className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 overflow-hidden rounded-lg border border-[#5B63A8] bg-[#0E1240]">
                        {match.cutout_path ? (
                          <img
                            src={`${API_BASE_URL}/${match.cutout_path}`}
                            alt={match.filename || match.category}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#FFA8D4]">
                            <CategoryIcon category={match.category} className="h-7 w-7" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#F5F3FF]">
                          {match.filename || match.category}
                        </p>
                        <p className="text-xs capitalize text-[#B9C0E8]">{match.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-[#B9C0E8]">Compatibility</p>
                        <p className="text-xl font-bold text-[#FFA8D4]">
                          {(match.compatibility_score * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {!results && !loading && (
          <Card className="border-[#2A3374] bg-[#151A4D]/90 shadow-sm">
            <CardContent className="p-8 text-center">
              <p className="text-[#B9C0E8]">
                Select an occasion and click "Generate Outfits" to see AI-matched combinations
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
