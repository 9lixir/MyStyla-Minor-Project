function CompatibilityBar({ score }) {
  return (
    <div data-cy="compatibility-bar">
      <div
        className="flex items-center justify-between text-xs mb-1 text-[#211D1B]/70"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <span>Compatibility</span>
        <span className="font-medium text-[#211D1B]">{score}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[#211D1B]/10 overflow-hidden">
        <div
          className="h-full bg-[#7C2A35] rounded-full transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default CompatibilityBar;