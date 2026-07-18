import CategoryIcon from "./CategoryIcon";
import CompatibilityBar from "./CompatibilityBar";

const SIZE_BY_CATEGORY = {
  top: "w-20 h-20",
  bottom: "w-16 h-20",
  shoes: "w-14 h-14",
  footwear: "w-14 h-14",
  belt: "w-10 h-10",
  watch: "w-10 h-10",
  jewelry: "w-10 h-10",
  bag: "w-12 h-12",
};

function OutfitSuggestionCard({ suggestion, onViewDetails }) {
  const garments = suggestion.items.filter((item) => !item.isRecommendation);
  const accessories = suggestion.items.filter((item) => item.isRecommendation);

  return (
    <div
      className="rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 p-5 shadow-sm"
      data-cy="outfit-suggestion-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-7 h-7 rounded-md bg-[#F5A9CE] text-[#1A2050] flex items-center justify-center text-xs font-medium">
          {suggestion.rank}
        </div>
        <span
          className="text-xs uppercase tracking-wider text-[#B9C0E8]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Rank {suggestion.rank}
        </span>
      </div>

      <div className="mb-5 rounded-xl border border-[#2A3374] bg-[#1E2560] p-3" data-cy="flat-lay">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-[#B9C0E8]">Outfit Preview</p>
        <div className="flex items-start gap-3 overflow-x-auto pb-1">
          {garments.map((item) => (
            <div key={item.id} className="min-w-[86px] w-[86px]">
              <div
                className="h-24 w-full overflow-hidden rounded-lg border border-[#5B63A8] bg-[#0E1240]"
                data-cy={`flat-lay-item-${item.category}`}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#FFA8D4]">
                    <CategoryIcon category={item.category} className="h-8 w-8" />
                  </div>
                )}
              </div>
              <p className="mt-1.5 truncate text-[10px] text-[#F5F3FF]">{item.label}</p>
              <p className="text-[9px] capitalize text-[#B9C0E8]">{item.category}</p>
            </div>
          ))}
        </div>
      </div>

      {accessories.length > 0 ? (
        <div className="mb-5 flex items-start gap-3 flex-wrap">
          {accessories.map((item) => (
            <div key={item.id} className="flex flex-col items-center w-20">
              <div
                className={`${SIZE_BY_CATEGORY[item.category] || "w-12 h-12"} rounded-lg border border-[#FFA8D4]/35 bg-[#FF7AB8]/12 text-[#FFA8D4] flex items-center justify-center`}
                data-cy={`flat-lay-item-${item.category}`}
              >
                <CategoryIcon category={item.category} className="w-2/3 h-2/3" />
              </div>
              <span
                className="text-[10px] text-center mt-1.5 text-[#B9C0E8] leading-tight"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {item.label}
              </span>
              <span className="text-[9px] text-[#FFA8D4] uppercase tracking-wide mt-0.5">
                Suggested
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl border border-[#2A3374] bg-[#1E2560] p-3">
        <CompatibilityBar score={suggestion.compatibility} />
      </div>

      {accessories.some((item) => item.reason) ? (
        <div className="mt-4 space-y-2 border-t border-[#2A3374] pt-4">
          {accessories.filter((item) => item.reason).map((item) => (
            <p key={item.id} className="text-xs leading-5 text-[#B9C0E8]">
              <span className="font-medium text-[#F5F3FF]">{item.label}:</span> {item.reason}
            </p>
          ))}
        </div>
      ) : null}

      {onViewDetails ? (
        <button
          onClick={() => onViewDetails?.(suggestion)}
          className="w-full mt-4 py-2.5 rounded-xl border border-[#2A3374] text-sm text-[#F5F3FF] hover:border-[#FFA8D4] hover:text-[#FFA8D4] transition"
          style={{ fontFamily: "Inter, sans-serif" }}
          data-cy="view-details-button"
        >
          View Details
        </button>
      ) : null}
    </div>
  );
}

export default OutfitSuggestionCard;
