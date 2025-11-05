'use client';

import { ReactNode } from 'react';

interface ViewSelectorProps {
  views: Array<{
    id: string;
    label: string;
    icon: ReactNode;
  }>;
  currentView: string;
  onViewChange: (view: string) => void;
  counter?: {
    current: number;
    total: number;
  };
}

export default function ViewSelector({ views, currentView, onViewChange, counter }: ViewSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-2 shadow-sm">
      <div className="flex items-center gap-2">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              inline-flex items-center gap-1.5 rounded-pill px-3.5 py-2 text-sm font-medium transition-colors focus-visible:focus-ring
              ${currentView === view.id
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-muted hover:bg-cardHover'
              }
            `}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {counter && (
        <div className="text-sm font-medium text-text-muted">
          {counter.current} de {counter.total}
        </div>
      )}
    </div>
  );
}
