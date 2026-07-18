import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-[#2A3374] bg-[#1E2560] px-3 py-2 text-sm text-[#F5F3FF] placeholder:text-[#9AA8E0] outline-none transition focus:border-[#FF6FB5] focus:ring-2 focus:ring-[#F5A9CE]/30 ${className}`}
      {...props}
    />
  );
});