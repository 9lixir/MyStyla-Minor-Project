export function Label({ className = '', children, ...props }) {
  return (
    <label
      className={`block text-slate-600 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}