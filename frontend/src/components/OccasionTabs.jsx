const OCCASIONS = ["Work", "Party", "Wedding", "Everyday"];

function OccasionTabs({ selected, onSelect }) {
  return (
    <div className="flex gap-2 flex-wrap" data-cy="occasion-tabs">
      {OCCASIONS.map((occasion) => {
        const isActive = occasion === selected;
        return (
          <button
            key={occasion}
            onClick={() => onSelect(occasion)}
            data-cy={`occasion-tab-${occasion.toLowerCase()}`}
            className={`px-4 py-2 rounded-full text-sm transition ${
              isActive
                ? "bg-[#211D1B] text-white"
                : "bg-white text-[#211D1B]/70 border border-[#211D1B]/15 hover:border-[#211D1B]/30"
            }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {occasion}
          </button>
        );
      })}
    </div>
  );
}

export default OccasionTabs;