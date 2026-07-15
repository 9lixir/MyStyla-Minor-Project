import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth-store';
import { checkOutfitHealth, generateOutfits } from '@/services/outfit.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const OCCASIONS = ['Casual', 'Office', 'Party', 'Date', 'Farewell'];

export default function OutfitMatcher({ onBack }) {
  const { user } = useAuthStore.getState();
  const [occasion, setOccasion] = useState('Office');
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [engineHealthy, setEngineHealthy] = useState(true);

  useEffect(() => {
    checkOutfitHealth()
      .then((data) => {
        setEngineHealthy(data?.status === 'outfit_matching engine is running');
      })
      .catch(() => setEngineHealthy(false));
  }, []);

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
      const data = await generateOutfits(user.id, occasion, normalizedTopK);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outfit Matcher</h1>
            <p className="text-gray-600 mt-1">Generate perfect outfit combinations</p>
            {!engineHealthy ? (
              <p className="mt-2 text-sm text-amber-700">
                Outfit engine health check failed. Generate may still work if backend is starting.
              </p>
            ) : null}
          </div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 text-lg font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Controls */}
        <Card className="mb-6 shadow-sm border-0">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent bg-white"
                >
                  {OCCASIONS.map((occ) => (
                    <option key={occ} value={occ}>
                      {occ}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Outfits
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={topK}
                  onChange={(e) => setTopK(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-black hover:bg-gray-800 text-white py-2 rounded-lg font-medium transition"
              >
                {loading ? 'Generating...' : 'Generate Outfits'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              {results.message}
              {typeof results.wardrobe_size_after_filter === 'number'
                ? ` • ${results.wardrobe_size_after_filter} garments available`
                : ''}
            </div>

            {results.outfits.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500 text-lg">
                    No outfits found for {occasion}. Try another occasion or add more garments!
                  </p>
                </CardContent>
              </Card>
            ) : (
              results.outfits.map((outfit, outfitIdx) => (
                <Card key={outfitIdx} className="border-0 shadow-sm hover:shadow-md transition">
                  <CardContent className="p-6">
                    {/* Scores */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Color Harmony
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {(outfit.harmony_score * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Compatibility
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {outfit.compat_score.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">
                            Overall Score
                          </p>
                          <p className="text-2xl font-bold text-black mt-1">
                            {(outfit.final_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Garments */}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Garments:</p>
                      <div className="space-y-2">
                        {outfit.garments.map((garment, gIdx) => (
                          <div
                            key={gIdx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 capitalize">
                                {garment.category}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{garment.id}</p>
                            </div>
                            <div className="flex gap-2">
                              {garment.dominant_colors?.slice(0, 3).map((color, cIdx) => (
                                <div
                                  key={cIdx}
                                  className="w-6 h-6 rounded-full border border-gray-300 shadow-sm"
                                  style={{ backgroundColor: color.hex }}
                                  title={`RGB: ${color.rgb.join(',')}`}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
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

        {/* Empty State */}
        {!results && !loading && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 text-lg mb-2">👕</div>
              <p className="text-gray-600">
                Select an occasion and click "Generate Outfits" to see AI-matched combinations
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
