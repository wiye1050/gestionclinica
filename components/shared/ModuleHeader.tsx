'use client';

import { ReactNode } from 'react';

interface ModuleHeaderProps {
  title: string;
  description: string;
  actions?: ReactNode;
  stats?: ReactNode;
}

export default function ModuleHeader({ title, description, actions, stats }: ModuleHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header Principal */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        </div>

        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Stats opcionales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats}
        </div>
      )}
    </div>
  );
}
