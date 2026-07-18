export function Label({ className = '', children, ...props }) {
  return (
    <label
      className={`block text-[#B9C0E8] ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}