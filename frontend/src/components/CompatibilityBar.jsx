function CompatibilityBar({ score }) {
  return (
    <div data-cy="compatibility-bar">
      <div
        className="mb-1 flex items-center justify-between text-xs text-[#B9C0E8]"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <span>Compatibility</span>
        <span className="font-medium text-[#F5F3FF]">{score}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F5F3FF]/15">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#F5A9CE_0%,#FF7AB8_100%)] transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default CompatibilityBar;