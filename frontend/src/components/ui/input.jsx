import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 ${className}`}
      {...props}
    />
  );
});