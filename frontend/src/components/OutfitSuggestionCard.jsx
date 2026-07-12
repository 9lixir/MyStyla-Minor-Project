import CategoryIcon from "./CategoryIcon";
import CompatibilityBar from "./CompatibilityBar";

const SIZE_BY_CATEGORY = {
  top: "w-20 h-20",
  bottom: "w-16 h-20",
  shoes: "w-14 h-14",
  belt: "w-10 h-10",
  watch: "w-10 h-10",
  jewelry: "w-10 h-10",
};

function OutfitSuggestionCard({ suggestion, onViewDetails }) {
  return (
    <div
      className="bg-white rounded-2xl border border-[#211D1B]/10 p-5"
      data-cy="outfit-suggestion-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-7 h-7 rounded-md bg-[#211D1B] text-white flex items-center justify-center text-xs font-medium">
          {suggestion.rank}
        </div>
        <span
          className="text-xs uppercase tracking-wider text-[#211D1B]/50"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Rank {suggestion.rank}
        </span>
      </div>

      <div className="flex items-end gap-3 mb-5" data-cy="flat-lay">
        {suggestion.items.map((item) => (
          <div
            key={item.id}
            className={`${SIZE_BY_CATEGORY[item.category] || "w-12 h-12"} rounded-lg bg-[#EEF0EC] border border-[#211D1B]/10 flex items-center justify-center text-[#7C2A35]`}
            data-cy={`flat-lay-item-${item.category}`}
          >
            <CategoryIcon category={item.category} className="w-2/3 h-2/3" />
          </div>
        ))}
      </div>

      <CompatibilityBar score={suggestion.compatibility} />

      <button
        onClick={() => onViewDetails?.(suggestion)}
        className="w-full mt-4 py-2.5 rounded-xl border border-[#211D1B]/15 text-sm text-[#211D1B] hover:border-[#7C2A35] hover:text-[#7C2A35] transition"
        style={{ fontFamily: "Inter, sans-serif" }}
        data-cy="view-details-button"
      >
        View Details
      </button>
    </div>
  );
}

export default OutfitSuggestionCard;