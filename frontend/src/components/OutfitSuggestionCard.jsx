import CategoryIcon from "./CategoryIcon";
import CompatibilityBar from "./CompatibilityBar";

const SIZE_BY_CATEGORY = {
  top: "w-20 h-20", bottom: "w-16 h-20", shoes: "w-14 h-14", footwear: "w-14 h-14",
  belt: "w-10 h-10", watch: "w-10 h-10", jewelry: "w-10 h-10", bag: "w-12 h-12",
};

function OutfitSuggestionCard({ suggestion, onViewDetails }) {
  const garments = suggestion.items.filter((item) => !item.isRecommendation);
  const accessories = suggestion.items.filter((item) => item.isRecommendation);

  return (
    <div
      className="mystyla-hover-lift relative w-full overflow-hidden rounded-[24px]"
      style={{ background: 'var(--mystyla-bg)', boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset' }}
      data-cy="outfit-suggestion-card"
    >

      <div className="p-5 sm:p-6 lg:p-7">
        {/* Rank + match badge */}
        <div className="mb-4 flex items-center justify-between">
          <span
            className="text-[10px] uppercase tracking-[0.18em]"
            style={{ color: 'var(--mystyla-gold)', fontFamily: "'Manrope', sans-serif" }}
          >
            Rank {suggestion.rank} &middot; {Math.round(suggestion.compatibility)}% match
          </span>
          {/* wax-seal / stamp rank medallion */}
          <div className="relative flex h-9 w-9 items-center justify-center">
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 35% 30%, var(--mystyla-rose), var(--mystyla-primary))',
                WebkitMaskImage: 'radial-gradient(circle at center, black 68%, transparent 69%)',
                maskImage: 'radial-gradient(circle at center, black 68%, transparent 69%)',
                clipPath:
                  'polygon(50% 0%, 62% 8%, 76% 6%, 82% 20%, 95% 28%, 92% 43%, 100% 55%, 90% 65%, 92% 80%, 78% 84%, 70% 96%, 55% 92%, 44% 100%, 33% 90%, 18% 92%, 15% 77%, 3% 68%, 9% 54%, 0% 42%, 12% 33%, 10% 18%, 25% 16%, 33% 4%, 47% 9%)',
                boxShadow: '0 3px 6px rgba(181,41,63,0.35)',
              }}
            />
            <span
              className="relative text-xs font-bold text-white"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {suggestion.rank}
            </span>
          </div>
        </div>

        {/* Outfit preview — real slider, scroll-snap */}
        <div
          className="mb-3 rounded-2xl border p-3.5"
          style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
          data-cy="flat-lay"
        >
          <p
            className="mb-2.5 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}
          >
            Outfit preview &middot; swipe
          </p>
          <div className="mystyla-slider flex items-start gap-3 pb-1">
            {garments.map((item, idx) => (
              <div
                key={item.id}
                className="mystyla-slide mystyla-fade-in-up min-w-[100px] w-[100px]"
                style={{ animationDelay: `${idx * 70}ms` }}
              >
                <div
                  className="mystyla-hover-lift h-28 w-full overflow-hidden rounded-xl border"
                  style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)' }}
                  data-cy={`flat-lay-item-${item.category}`}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.label} className="h-full w-full object-contain p-1.5" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ color: 'var(--mystyla-primary)' }}>
                      <CategoryIcon category={item.category} className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <p
                  className="mt-1.5 truncate text-[11px]"
                  style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-ink)' }}
                >
                  {item.label}
                </p>
                <p
                  className="text-[9px] uppercase tracking-[0.1em]"
                  style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}
                >
                  {item.category}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring summary — pill badges */}
        <div
          className="mb-3 rounded-2xl border p-3.5"
          style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
        >
          <p
            className="mb-2.5 text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}
          >
            Scoring summary
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <span className="mystyla-pill rounded-full px-3 py-1 text-xs">
              {Math.round(suggestion.compatibility)}% harmony
            </span>
            <span className="mystyla-pill rounded-full px-3 py-1 text-xs">
              Compatible
            </span>
            <span className="mystyla-pill-violet rounded-full px-3 py-1 text-xs">
              Weather fit
            </span>
          </div>
          <CompatibilityBar score={suggestion.compatibility} />
        </div>

        {/* Accessories — colored band with hidden blob accent */}
        {accessories.length > 0 && (
          <div
            className="relative overflow-hidden rounded-2xl p-3.5"
            style={{ background: 'var(--mystyla-surface)' }}
          >


            <p
              className="relative mb-2 text-[10px] uppercase tracking-[0.14em]"
              style={{ color: 'var(--mystyla-ink)', fontFamily: "'Manrope', sans-serif" }}
            >
              Accessories
            </p>
            <div className="relative flex items-start gap-3 flex-wrap">
              {accessories.map((item, idx) => (
                <div
                  key={item.id}
                  className="mystyla-fade-in-up flex flex-col items-center w-[72px]"
                  style={{ animationDelay: `${idx * 70}ms` }}
                >
                  <div
                    className={`${SIZE_BY_CATEGORY[item.category] || "w-12 h-12"} mystyla-hover-lift flex items-center justify-center overflow-hidden rounded-xl border`}
                    style={{ borderColor: 'var(--mystyla-ink)', background: 'var(--mystyla-surface)', color: 'var(--mystyla-ink)' }}
                    data-cy={`flat-lay-item-${item.category}`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.label}
                        className="h-full w-full object-contain p-1"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <CategoryIcon category={item.category} className="w-2/3 h-2/3" />
                    )}
                  </div>
                  <span
                    className="mt-1.5 text-center text-[10px] leading-tight"
                    style={{ color: 'var(--mystyla-ink)', fontFamily: "'Manrope', sans-serif" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {accessories.some((item) => item.reason) && (
              <div className="relative mt-3 space-y-1.5 border-t border-dashed pt-3" style={{ borderColor: 'rgba(61,35,82,0.25)' }}>
                {accessories.filter((item) => item.reason).map((item) => (
                  <p key={item.id} className="text-xs leading-5" style={{ color: 'var(--mystyla-ink)' }}>
                    <span className="font-medium">{item.label}:</span> {item.reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {onViewDetails && (
          <button
            onClick={() => onViewDetails?.(suggestion)}
            className="mt-3 w-full rounded-full border py-2.5 text-sm transition"
            style={{ borderColor: 'var(--mystyla-border-strong)', color: 'var(--mystyla-ink)', fontFamily: "'Manrope', sans-serif" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--mystyla-primary)'; e.currentTarget.style.color = 'var(--mystyla-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--mystyla-border-strong)'; e.currentTarget.style.color = 'var(--mystyla-ink)'; }}
            data-cy="view-details-button"
          >
            View details
          </button>
        )}
      </div>
    </div>
  );
}

export default OutfitSuggestionCard;