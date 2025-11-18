'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

type Tone = 'info' | 'warn' | 'danger' | 'success';

const toneClasses: Record<Tone, { container: string; badge: string; button: string }> = {
  info: {
    container: 'border-brand/40 bg-brand-subtle/60',
    badge: 'bg-brand text-white',
    button: 'bg-brand text-text',
  },
  warn: {
    container: 'border-warn/40 bg-warn-bg/70',
    badge: 'bg-warn text-white',
    button: 'bg-warn text-white',
  },
  danger: {
    container: 'border-danger/40 bg-danger-bg/70',
    badge: 'bg-danger text-white',
    button: 'bg-danger text-white',
  },
  success: {
    container: 'border-success/40 bg-success-bg/70',
    badge: 'bg-success text-white',
    button: 'bg-success text-white',
  },
};

interface CrossModuleAlertProps {
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  tone?: Tone;
  icon?: ReactNode;
  chips?: string[];
}

export default function CrossModuleAlert({
  title,
  description,
  actionLabel,
  href,
  tone = 'info',
  icon,
  chips,
}: CrossModuleAlertProps) {
  const toneStyle = toneClasses[tone];

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${toneStyle.container}`}>
      <div className="flex flex-wrap items-start gap-4">
        <div className={`rounded-full p-2 ${toneStyle.badge}`}>
          {icon ?? <AlertCircle className="h-4 w-4" />}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="text-xs text-text-muted">{description}</p>
          {chips && chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {chips.map((chip, index) => (
                <span
                  key={`${chip}-${index}`}
                  className="rounded-full border border-white/40 bg-white/30 px-2 py-0.5 text-[11px] font-semibold text-text"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={href}
          className={`${toneStyle.button} rounded-full px-4 py-2 text-xs font-semibold transition-colors hover:opacity-90 focus-visible:focus-ring`}
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}
