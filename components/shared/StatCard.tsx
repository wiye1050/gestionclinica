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
    <div className="panel-block p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-text-muted">
            {title}
          </p>
          <p className="mt-2 text-2xl font-semibold text-text">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-muted">
              {subtitle}
            </p>
          )}
          {trend && (
            <span className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${trendColors[trend]}`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'}
              {trend === 'up' ? 'En ascenso' : trend === 'down' ? 'En descenso' : 'Estable'}
            </span>
          )}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${colorClasses[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
