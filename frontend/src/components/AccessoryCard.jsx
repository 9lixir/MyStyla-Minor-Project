function AccessoryCard({ accessory }) {
  return (
    <div
      className="w-32 rounded-lg border border-[#2A3374] bg-[#151A4D]/90 p-3 shadow-sm flex flex-col items-center"
      data-cy="accessory-card"
    >
      <div className="w-20 h-20 rounded-md border border-[#2A3374] bg-[#1E2560] flex items-center justify-center text-xs text-[#B9C0E8] text-center px-2">
        {accessory.slot}
      </div>
      <span className="text-sm font-medium mt-2 text-center text-[#F5F3FF]">{accessory.name}</span>
      {accessory.reason && (
        <span className="text-xs text-[#B9C0E8] text-center mt-1">{accessory.reason}</span>
      )}
    </div>
  );
}

export default AccessoryCard;
