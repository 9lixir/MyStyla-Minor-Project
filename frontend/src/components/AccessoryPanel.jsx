import AccessoryCard from "./AccessoryCard";

function AccessoryPanel({ accessories, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-[#B9C0E8]" data-cy="accessory-loading">
        Loading accessory suggestions...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[#FF7AB8]" data-cy="accessory-error">
        Couldn't load suggestions. Please try again.
      </div>
    );
  }

  if (!accessories || accessories.length === 0) {
    return (
      <div className="text-center py-8 text-[#B9C0E8]" data-cy="accessory-empty">
        No accessory suggestions found for this outfit.
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-wrap" data-cy="accessory-list">
      {accessories.map((accessory) => (
        <AccessoryCard key={accessory.id} accessory={accessory} />
      ))}
    </div>
  );
}

export default AccessoryPanel;