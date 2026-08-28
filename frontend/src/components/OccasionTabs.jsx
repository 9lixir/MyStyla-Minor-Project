const OCCASIONS = [
  "Casual", "College", "Shopping", "Travel", "Office", "Meeting",
  "Interview", "Presentation", "Party", "Date", "Dinner", "Birthday",
  "Wedding", "Puja", "Festival", "Religious Ceremony", "Farewell", "Graduation",
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
            className="px-4 py-2 rounded-full text-sm transition-all duration-150"
            style={
              isActive
                ? {
                    background: 'var(--mystyla-primary)',
                    color: 'var(--mystyla-surface)',
                    fontWeight: 500,
                    boxShadow: '0 4px 16px -4px rgba(181,41,63,0.45)',
                    fontFamily: "'Manrope', sans-serif",
                  }
                : {
                    border: '1px dashed var(--mystyla-border-strong)',
                    background: 'var(--mystyla-surface)',
                    color: 'var(--mystyla-muted)',
                    fontFamily: "'Manrope', sans-serif",
                  }
            }
            onMouseEnter={(e) => {
              if (isActive) return;
              e.currentTarget.style.borderColor = 'rgba(181,41,63,0.6)';
              e.currentTarget.style.color = 'var(--mystyla-primary)';
            }}
            onMouseLeave={(e) => {
              if (isActive) return;
              e.currentTarget.style.borderColor = 'var(--mystyla-border-strong)';
              e.currentTarget.style.color = 'var(--mystyla-muted)';
            }}
          >
            {occasion}
          </button>
        );
      })}
    </div>
  );
}

export default OccasionTabs;