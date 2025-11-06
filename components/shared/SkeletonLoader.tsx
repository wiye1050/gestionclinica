'use client';

export default function SkeletonLoader() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-xl bg-cardHover animate-pulse" />
          <div className="h-4 w-64 rounded-xl bg-cardHover animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded-pill bg-cardHover animate-pulse" />
          <div className="h-10 w-32 rounded-pill bg-cardHover animate-pulse" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded-xl bg-cardHover animate-pulse" />
                <div className="h-8 w-16 rounded-xl bg-cardHover animate-pulse" />
              </div>
              <div className="h-12 w-12 rounded-full bg-cardHover animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded-xl bg-cardHover animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-cardHover animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* View Selector Skeleton */}
      <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-24 rounded-pill bg-cardHover animate-pulse" />
            ))}
          </div>
          <div className="h-5 w-20 rounded-xl bg-cardHover animate-pulse" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-cardHover animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
