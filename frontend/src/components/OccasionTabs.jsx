const OCCASIONS = [
  "Casual",
  "College",
  "Shopping",
  "Travel",
  "Office",
  "Meeting",
  "Interview",
  "Presentation",
  "Party",
  "Date",
  "Dinner",
  "Birthday",
  "Wedding",
  "Puja",
  "Festival",
  "Religious Ceremony",
  "Farewell",
  "Graduation",
];

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
                ? "bg-[#F5A9CE] text-[#1A2050] shadow-sm"
                : "bg-[#151A4D]/90 text-[#B9C0E8] border border-[#2A3374] hover:border-[#FFA8D4]/70 hover:text-[#FFD3EC]"
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
