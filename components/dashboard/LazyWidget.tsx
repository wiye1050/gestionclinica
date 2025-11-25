'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazyWidgetProps {
  children: ReactNode;
  skeleton?: ReactNode;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
}

/**
 * Componente que carga widgets solo cuando entran en viewport
 * Mejora el performance inicial del dashboard
 */
export function LazyWidget({
  children,
  skeleton,
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
}: LazyWidgetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            // Aplicar delay opcional para animaciones escalonadas
            if (delay > 0) {
              setTimeout(() => {
                setIsVisible(true);
                setHasLoaded(true);
              }, delay);
            } else {
              setIsVisible(true);
              setHasLoaded(true);
            }
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, rootMargin, delay, hasLoaded]);

  return (
    <div ref={ref} className="w-full">
      {isVisible ? children : skeleton || <WidgetSkeleton />}
    </div>
  );
}

/**
 * Skeleton loader genérico para widgets
 */
function WidgetSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-200" />
          <div>
            <div className="mb-1 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-2 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div className="space-y-2">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}
