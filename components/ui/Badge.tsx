"use client";

import { memo } from 'react';

type Tone = 'success' | 'warn' | 'danger' | 'muted';

const toneMap: Record<Tone, string> = {
  success: 'badge--success',
  warn: 'badge--warn',
  danger: 'badge--danger',
  muted: 'badge--muted'
};

function BadgeComponent({ children, tone = 'muted' }: { children: React.ReactNode; tone?: Tone }) {
  return <span className={`badge ${toneMap[tone]}`}>{children}</span>;
}

export const Badge = memo(BadgeComponent);
