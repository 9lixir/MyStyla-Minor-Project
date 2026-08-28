function OutfitCard({ outfit }) {
  if (!outfit) return null;

  return (
    <div
      className="rounded-xl border p-4 shadow-sm transition-shadow duration-300 hover:shadow-md"
      style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface)' }}
      data-cy="outfit-card"
    >
      <h3 className="mystyla-display mb-3 text-lg" style={{ color: 'var(--mystyla-ink)' }}>
        Your Outfit
      </h3>
      <div className="mystyla-slider flex flex-wrap gap-4">
        {outfit.items.map((item, idx) => (
          <div
            key={item.id}
            className="mystyla-slide mystyla-fade-in flex w-24 flex-col items-center"
            style={{ animationDelay: `${idx * 60}ms` }}
            data-cy={`outfit-item-${item.category}`}
          >
            <div
              className="h-20 w-20 overflow-hidden rounded-lg border transition-transform duration-200 hover:scale-105"
              style={{ borderColor: 'var(--mystyla-border)', background: 'var(--mystyla-surface-2)' }}
            >
              <img
                src={item.imageUrl}
                alt={item.category}
                className="h-full w-full object-contain p-1"
              />
            </div>
            <span
              className="mystyla-masthead mt-1.5 text-[10px]"
              style={{ letterSpacing: '0.1em' }}
            >
              {item.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OutfitCard;