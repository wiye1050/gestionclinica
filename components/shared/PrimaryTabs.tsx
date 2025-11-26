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
  disabledTabs?: T[];
  disabledMessage?: string;
}

export default function PrimaryTabs<T extends string>({
  tabs,
  current,
  onChange,
  size = 'md',
  disabledTabs = [],
  disabledMessage = 'Próximamente',
}: PrimaryTabsProps<T>) {
  return (
    <div
      className={`flex flex-wrap gap-1.5 ${size === 'sm' ? 'text-[9px]' : 'text-xs'}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === current;
        const isDisabled = disabledTabs.includes(tab.id);
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={isDisabled}
            title={isDisabled ? disabledMessage : undefined}
            onClick={() => !isDisabled && onChange(tab.id)}
            className={`rounded-lg border px-2 py-1.5 font-semibold transition-all duration-150 focus-visible:focus-ring ${
              isDisabled
                ? 'cursor-not-allowed border-border bg-muted/30 text-text-muted/50 opacity-60'
                : isActive
                ? 'border-brand bg-brand text-white shadow-sm'
                : 'border-border bg-cardHover/50 text-text-muted hover:bg-cardHover hover:shadow-sm'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {tab.icon ? <span className={`rounded-full p-0.5 ${isActive ? 'bg-white/20' : 'bg-muted'}`}>{tab.icon}</span> : null}
              {tab.label}
            </span>
            {tab.helper && (
              <span className={`block text-[9px] font-normal ${isActive ? 'text-white/80' : 'text-text-muted'}`}>{tab.helper}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
