'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import KPICard from './KPICard';
import type { LucideIcon } from 'lucide-react';

// Soporta tanto nombres nuevos (success, danger, warn) como antiguos (green, red, yellow, blue) para compatibilidad
export type KPIAccent = 'brand' | 'success' | 'danger' | 'warn' | 'purple' | 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'orange';

export interface KPIItem {
  id?: string;
  label: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon | ReactNode;
  accent?: KPIAccent;
}

interface KPIGridProps {
  items: KPIItem[];
  className?: string;
}

/**
 * Grid responsive de KPIs que usa el componente KPICard unificado
 *
 * @example
 * ```tsx
 * <KPIGrid
 *   items={[
 *     { label: 'Total', value: 42, icon: Users, accent: 'brand' },
 *     { label: 'Activos', value: 38, icon: CheckCircle, accent: 'success', helper: '90%' },
 *   ]}
 * />
 * ```
 */
export function KPIGrid({ items, className }: KPIGridProps) {
  const columnClass = (() => {
    if (items.length >= 4) return 'lg:grid-cols-4';
    if (items.length === 3) return 'lg:grid-cols-3';
    return 'lg:grid-cols-2';
  })();

  return (
    <div className={clsx('grid grid-cols-1 gap-4 sm:grid-cols-2', columnClass, className)}>
      {items.map((item) => (
        <KPICard
          key={item.id ?? item.label}
          title={item.label}
          value={item.value}
          icon={item.icon ?? <></>}
          color={item.accent ?? 'brand'}
          variant="minimal"
          subtitle={item.helper}
        />
      ))}
    </div>
  );
}
