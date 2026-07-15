function AccessoryCard({ accessory }) {
  return (
    <div
      className="border rounded-lg p-3 bg-white shadow-sm w-32 flex flex-col items-center"
      data-cy="accessory-card"
    >
      <img
        src={accessory.imageUrl}
        alt={accessory.name}
        className="w-20 h-20 object-cover rounded-md border"
      />
      <span className="text-sm font-medium mt-2 text-center">{accessory.name}</span>
      {accessory.reason && (
        <span className="text-xs text-gray-500 text-center mt-1">{accessory.reason}</span>
      )}
    </div>
  );
}

export default AccessoryCard;