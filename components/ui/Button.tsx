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
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 disabled:bg-blue-300',
    secondary:
      'bg-gray-900 text-white hover:bg-gray-800 focus-visible:outline-gray-900 disabled:bg-gray-400',
    outline:
      'border border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-400'
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
