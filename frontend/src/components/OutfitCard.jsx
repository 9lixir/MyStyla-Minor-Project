function OutfitCard({ outfit }) {
  if (!outfit) return null;

  return (
    <div className="rounded-lg border border-[#2A3374] bg-[#151A4D]/90 p-4 shadow-sm" data-cy="outfit-card">
      <h3 className="mb-3 text-lg font-semibold text-[#F5F3FF]">Your Outfit</h3>
      <div className="flex gap-4 flex-wrap">
        {outfit.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col items-center w-24"
            data-cy={`outfit-item-${item.category}`}
          >
            <img
              src={item.imageUrl}
              alt={item.category}
              className="w-20 h-20 object-cover rounded-md border border-[#2A3374]"
            />
            <span className="mt-1 text-sm capitalize text-[#B9C0E8]">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OutfitCard;