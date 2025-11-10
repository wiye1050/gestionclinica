"use client";

import { memo } from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  variant?: 'solid' | 'glass';
};

function CardComponent({ title, subtitle, action, children, className, variant = 'solid' }: Props) {
  const base =
    variant === 'glass'
      ? 'glass-panel p-6 card-hover'
      : 'surface-card p-6 card-hover';

  return (
    <section className={`${base} ${className ?? ''}`}>
      {(title || action) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <div>
            {title && <h3 className="text-base md:text-lg font-semibold text-text">{title}</h3>}
            {subtitle && <p className="text-sm text-text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export default memo(CardComponent);
