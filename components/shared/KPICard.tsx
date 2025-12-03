'use client';

import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import clsx from 'clsx';

type KPIVariant = 'default' | 'compact' | 'minimal';
// Soporta tanto nombres nuevos como antiguos para compatibilidad
type KPIColor = 'brand' | 'success' | 'danger' | 'warn' | 'purple' | 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'orange';
type KPITrend = 'up' | 'down' | 'stable';

interface KPICardProps {
  /** Título del KPI */
  title: string;
  /** Valor principal a mostrar */
  value: string | number;
  /** Icono (LucideIcon o ReactNode) */
  icon: LucideIcon | React.ReactNode;
  /** Color del badge del ícono */
  color?: KPIColor;
  /** Variante de diseño */
  variant?: KPIVariant;
  /** Tendencia (muestra flecha) */
  trend?: KPITrend;
  /** Valor de la tendencia (ej. "+12%", "↑5 más que ayer") */
  trendValue?: string;
  /** Texto de ayuda secundario */
  subtitle?: string;
  /** Clases CSS adicionales */
  className?: string;
}

const colorClasses: Record<KPIColor, string> = {
  // Nombres nuevos (preferidos)
  brand: 'bg-brand-subtle text-brand',
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warn: 'bg-warn-bg text-warn',
  purple: 'bg-cardHover text-text',
  gray: 'bg-muted text-text-muted',
  // Nombres antiguos (compatibilidad)
  green: 'bg-success-bg text-success',
  red: 'bg-danger-bg text-danger',
  yellow: 'bg-warn-bg text-warn',
  orange: 'bg-warn-bg text-warn',
  blue: 'bg-brand-subtle text-brand',
};

const trendColors: Record<KPITrend, string> = {
  up: 'text-success',
  down: 'text-danger',
  stable: 'text-text-muted',
};

const trendLabels: Record<KPITrend, string> = {
  up: 'En ascenso',
  down: 'En descenso',
  stable: 'Estable',
};

/**
 * Componente KPI unificado con variantes de diseño
 *
 * @example
 * ```tsx
 * <KPICard
 *   title="Pacientes hoy"
 *   value={42}
 *   icon={Users}
 *   color="brand"
 *   trend="up"
 *   trendValue="+12%"
 *   subtitle="vs. semana anterior"
 * />
 * ```
 */
export default function KPICard({
  title,
  value,
  icon,
  color = 'brand',
  variant = 'default',
  trend,
  trendValue,
  subtitle,
  className,
}: KPICardProps) {
  const Icon = typeof icon === 'function' ? icon : null;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Variante Minimal (para KPIGrid)
  if (variant === 'minimal') {
    return (
      <div
        className={clsx(
          'rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-brand/40',
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
            <p className={clsx('mt-1 text-2xl font-semibold', colorClasses[color].split(' ')[1])}>
              {value}
            </p>
          </div>
          {Icon && (
            <div className="text-brand/80">
              <Icon className="h-6 w-6" />
            </div>
          )}
          {!Icon && typeof icon !== 'function' && <div className="text-brand/80">{icon}</div>}
        </div>
        {subtitle && <p className="mt-2 text-xs text-text-muted">{subtitle}</p>}
      </div>
    );
  }

  // Variante Compact (StatCard style - más pequeña)
  if (variant === 'compact') {
    return (
      <div className={clsx('panel-block p-2 shadow-sm transition-all hover:shadow-md', className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-text-muted">
              {title}
            </p>
            <p className="mt-1.5 text-lg font-semibold text-text">{value}</p>
            {subtitle && <p className="mt-1 text-[9px] text-text-muted">{subtitle}</p>}
            {trend && trendValue && (
              <span
                className={clsx(
                  'mt-1.5 inline-flex items-center gap-1 text-[9px] font-medium',
                  trendColors[trend]
                )}
              >
                {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '•'} {trendValue}
              </span>
            )}
          </div>
          <div className={clsx('flex h-9 w-9 items-center justify-center rounded-full', colorClasses[color])}>
            {Icon && <Icon className="h-4 w-4" />}
            {!Icon && typeof icon !== 'function' && icon}
          </div>
        </div>
      </div>
    );
  }

  // Variante Default (KPICard style - más grande y prominente)
  return (
    <div className={clsx('surface-card card-hover flex h-full flex-col justify-between p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-text">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-text-muted">{subtitle}</p>}
        </div>
        <div className={clsx('flex h-12 w-12 items-center justify-center rounded-xl', colorClasses[color])}>
          {Icon && <Icon className="h-6 w-6" />}
          {!Icon && typeof icon !== 'function' && icon}
        </div>
      </div>
      {trend && trendValue && (
        <div className={clsx('mt-4 inline-flex items-center gap-2 text-sm font-medium', trendColors[trend])}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendValue}</span>
        </div>
      )}
      {trend && !trendValue && (
        <div className={clsx('mt-4 inline-flex items-center gap-2 text-sm font-medium', trendColors[trend])}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendLabels[trend]}</span>
        </div>
      )}
    </div>
  );
}
