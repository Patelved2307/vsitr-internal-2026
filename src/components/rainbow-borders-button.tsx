import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "rainbow-border relative flex items-center justify-center gap-2.5 px-6 py-3 bg-gradient-to-r from-[#C1272D] via-[#8B235E] to-[#1B3F8B] rounded-xl border-none text-white cursor-pointer font-black transition-all duration-200 hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
