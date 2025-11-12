'use client';

import { LucideIcon } from 'lucide-react';

export interface ActionButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  success: 'bg-green-600 text-white hover:bg-green-700 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border border-gray-200',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 rounded-lg font-medium transition
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : Icon ? (
        <Icon className="h-4 w-4" />
      ) : null}
      <span>{label}</span>
    </button>
  );
}

export interface ActionButtonsProps {
  buttons: ActionButtonProps[];
  align?: 'left' | 'center' | 'right';
}

export default function ActionButtons({ buttons, align = 'right' }: ActionButtonsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${alignClasses[align]}`}>
      {buttons.map((button, idx) => (
        <ActionButton key={idx} {...button} />
      ))}
    </div>
  );
}
