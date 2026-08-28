function AccessoryCard({ accessory }) {
  return (
    <div
      className="group relative w-32 rounded-xl border p-3 pt-4 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--mystyla-border)',
        background: 'var(--mystyla-surface)',
      }}
      onMouseEnter={(e) => {
       e.currentTarget.style.borderColor = 'var(--mystyla-lavender-ink)';
        e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(181,41,63,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--mystyla-border)';
        e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.4) inset';
      }}
      data-cy="accessory-card"
    >
      {/* Tag notch — the punch-hole on a real garment tag */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full ring-1 ring-inset"
        style={{ background: 'var(--mystyla-bg)', '--tw-ring-color': 'var(--mystyla-border)' }}
      />

      <div
        className="flex w-20 h-20 mx-auto items-center justify-center rounded-lg border border-dashed text-center"
        style={{ borderColor: 'var(--mystyla-border-strong)', background: 'var(--mystyla-surface-2)' }}
      >
        <span
          className="px-2 text-[10px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--mystyla-muted)', fontFamily: "'Manrope', sans-serif" }}
        >
          {accessory.slot}
        </span>
      </div>

      <span
        className="mt-2.5 block text-center text-sm font-medium leading-snug"
        style={{ fontFamily: "'Fraunces', Georgia, serif", color: 'var(--mystyla-ink)' }}
      >
        {accessory.name}
      </span>

      {accessory.reason && (
        <span
          className="mt-1 block text-center text-[11px] italic leading-snug"
          style={{ color: 'var(--mystyla-muted)' }}
        >
          {accessory.reason}
        </span>
      )}
    </div>
  );
}

export default AccessoryCard;