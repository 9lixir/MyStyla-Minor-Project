export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-[#2A3374] bg-[#151A4D]/90 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}