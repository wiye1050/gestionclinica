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
    <section className="space-y-4">
      <div className="rounded-3xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text">{title}</h1>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats}
        </div>
      )}
    </section>
  );
}
