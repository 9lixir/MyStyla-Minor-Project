import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from './input';

export const PasswordInput = forwardRef(function PasswordInput(
  { className = '', ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`pr-10 ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA8E0] hover:text-[#FF6FB5]"
        tabIndex={-1}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
});