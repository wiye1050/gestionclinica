'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

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
    <div className="bg-white rounded-lg shadow p-2 flex items-center justify-between">
      <div className="flex items-center gap-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
              ${currentView === view.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {counter && (
        <div className="text-sm text-gray-600 font-medium">
          {counter.current} de {counter.total}
        </div>
      )}
    </div>
  );
}
