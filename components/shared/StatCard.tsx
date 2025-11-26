'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
}

const colorClasses = {
  blue: 'bg-brand-subtle text-brand',
  green: 'bg-success-bg text-success',
  red: 'bg-danger-bg text-danger',
  yellow: 'bg-warn-bg text-warn',
  purple: 'bg-cardHover text-text',
  orange: 'bg-warn-bg text-warn',
};

const trendColors = {
  up: 'text-success',
  down: 'text-danger',
  stable: 'text-text-muted',
} as const;

export default function StatCard({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  trend
}: StatCardProps) {
  return (
    <div className="panel-block p-2 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1">
          <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-text-muted">
            {title}
          </p>
          <p className="mt-1.5 text-lg font-semibold text-text">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-[9px] text-text-muted">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className={`mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium ${trendColors[trend]}`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'}
              {trend === 'up' ? 'En ascenso' : trend === 'down' ? 'En descenso' : 'Estable'}
            </span>
          )}
        </div>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
