'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', disabled, ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-brand-500 text-white hover:bg-brand-600 focus-visible:outline-brand-500 shadow-sm hover:shadow-md',
    secondary:
      'bg-gray-800 text-white hover:bg-gray-700 focus-visible:outline-gray-800 shadow-sm',
    outline:
      'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus-visible:outline-gray-400'
  };

  return (
    <button
      ref={ref}
      className={clsx(base, variants[variant], className)}
      disabled={disabled}
      {...props}
    />
  );
});
