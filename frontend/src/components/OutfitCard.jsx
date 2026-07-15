function OutfitCard({ outfit }) {
  if (!outfit) return null;

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm" data-cy="outfit-card">
      <h3 className="text-lg font-semibold mb-3">Your Outfit</h3>
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
              className="w-20 h-20 object-cover rounded-md border"
            />
            <span className="text-sm mt-1 capitalize">{item.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OutfitCard;