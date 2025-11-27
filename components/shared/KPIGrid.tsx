'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

export type KPIAccent = 'brand' | 'green' | 'blue' | 'purple' | 'gray' | 'red';

export interface KPIItem {
  id?: string;
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
  accent?: KPIAccent;
}

interface KPIGridProps {
  items: KPIItem[];
  className?: string;
}

const accentClasses: Record<KPIAccent, string> = {
  brand: 'text-brand',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-violet-600',
  gray: 'text-text',
  red: 'text-red-600',
};

export function KPIGrid({ items, className }: KPIGridProps) {
  const columnClass = (() => {
    if (items.length >= 4) return 'lg:grid-cols-4';
    if (items.length === 3) return 'lg:grid-cols-3';
    return 'lg:grid-cols-2';
  })();

  return (
    <div className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-2', columnClass, className)}>
      {items.map((item) => (
        <div
          key={item.id ?? item.label}
          className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand/40"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                {item.label}
              </p>
              <p
                className={clsx(
                  'mt-1 text-2xl font-semibold text-text',
                  accentClasses[item.accent ?? 'brand']
                )}
              >
                {item.value}
              </p>
            </div>
            {item.icon && <div className="text-brand/80">{item.icon}</div>}
          </div>
          {item.helper && <p className="mt-2 text-xs text-text-muted">{item.helper}</p>}
        </div>
      ))}
    </div>
  );
}
