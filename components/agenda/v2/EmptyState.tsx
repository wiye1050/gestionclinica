'use client';

import { Calendar, Plus, Filter } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 px-6 text-center">
      {/* Icon */}
      <div className="rounded-full bg-brand-subtle/20 p-6">
        {icon || <Calendar className="h-12 w-12 text-brand" />}
      </div>

      {/* Text */}
      <div className="max-w-md space-y-2">
        <h3 className="text-lg font-semibold text-text">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action && (
            <button
              onClick={action.onClick}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand/90 hover:shadow-md focus-visible:focus-ring"
            >
              <Plus className="h-4 w-4" />
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-text shadow-sm transition-all hover:bg-cardHover focus-visible:focus-ring"
            >
              <Filter className="h-4 w-4" />
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
