'use client';

import type { ReactNode } from 'react';

interface PrimaryTab {
  id: string;
  label: string;
  icon?: ReactNode;
  helper?: string;
}

interface PrimaryTabsProps<T extends string> {
  tabs: Array<PrimaryTab & { id: T }>;
  current: T;
  onChange: (tab: T) => void;
  size?: 'sm' | 'md';
}

export default function PrimaryTabs<T extends string>({
  tabs,
  current,
  onChange,
  size = 'md',
}: PrimaryTabsProps<T>) {
  return (
    <div
      className={`flex flex-wrap gap-2 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === current;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`rounded-2xl border px-3 py-2 font-semibold transition-colors focus-visible:focus-ring ${
              isActive
                ? 'border-brand bg-brand text-text shadow-sm'
                : 'border-border bg-cardHover/50 text-text-muted hover:bg-cardHover'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.icon ? <span className="rounded-full bg-white/10 p-1">{tab.icon}</span> : null}
              {tab.label}
            </span>
            {tab.helper && (
              <span className="block text-[11px] font-normal text-text-muted">{tab.helper}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
