"use client";

import { memo } from 'react';

type Props = {
  label: string;
  value: string | number;
  delta?: { value: number; trend: 'up' | 'down' };
  onClick?: () => void;
};

function StatComponent({ label, value, delta, onClick }: Props) {
  const content = (
    <>
      <span className="stat__label">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="stat__value">{value}</span>
        {delta && (
          <span className={delta.trend === 'up' ? 'stat__delta-up' : 'stat__delta-down'}>
            {delta.trend === 'up' ? '↑' : '↓'} {Math.abs(delta.value)}%
          </span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="stat card-hover text-left w-full focus-visible:focus-ring"
        aria-label={typeof value === 'number' ? `${label}: ${value}` : `${label}`}
      >
        {content}
      </button>
    );
  }

  return <div className="stat">{content}</div>;
}

export default memo(StatComponent);
