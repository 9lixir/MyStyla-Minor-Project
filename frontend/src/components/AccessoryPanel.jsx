import AccessoryCard from "./AccessoryCard";

function AccessoryPanel({ accessories, isLoading, error }) {
  if (isLoading) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ color: 'var(--mystyla-muted)' }}
        data-cy="accessory-loading"
      >
        Loading accessory suggestions…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ color: 'var(--mystyla-primary)' }}
        data-cy="accessory-error"
      >
        Couldn't load suggestions. Please try again.
      </div>
    );
  }

  if (!accessories || accessories.length === 0) {
    return (
      <div
        className="py-8 text-center text-sm"
        style={{ color: 'var(--mystyla-muted)' }}
        data-cy="accessory-empty"
      >
        No accessory suggestions found for this outfit.
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-wrap" data-cy="accessory-list">
      {accessories.map((accessory, index) => (
        <div
          key={accessory.id}
          className="mystyla-fade-in-up"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <AccessoryCard accessory={accessory} />
        </div>
      ))}
    </div>
  );
}

export default AccessoryPanel;