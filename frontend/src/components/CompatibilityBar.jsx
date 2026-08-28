function CompatibilityBar({ score }) {
  return (
    <div data-cy="compatibility-bar">
      <div className="mb-1.5 flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}
        >
          Compatibility
        </span>
        <span
          className="text-sm"
          style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-ink)' }}
        >
          {score}%
        </span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full ring-1 ring-inset"
        style={{ background: 'var(--mystyla-surface-2)', '--tw-ring-color': 'var(--mystyla-border)' }}
      >
        {/* Quiet measuring-tape ticks */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {[25, 50, 75].map((pos) => (
            <span
              key={pos}
              className="absolute top-0 h-full w-px"
              style={{ left: `${pos}%`, background: 'rgba(58,26,38,0.15)' }}
            />
          ))}
        </div>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${score}%`,
            background: 'linear-gradient(90deg, var(--mystyla-rose) 0%, var(--mystyla-primary) 100%)',
          }}
        />
      </div>
    </div>
  );
}

export default CompatibilityBar;