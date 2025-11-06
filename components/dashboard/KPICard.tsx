import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

export default function KPICard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  color 
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-brand-subtle text-brand',
    green: 'bg-success-bg text-success',
    orange: 'bg-warn-bg text-warn',
    purple: 'bg-cardHover text-text',
    red: 'bg-danger-bg text-danger',
  };

  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    stable: 'text-text-muted',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-text">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      {trend && trendValue && (
        <div className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${trendColors[trend]}`}>
          <TrendIcon className="h-4 w-4" />
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
