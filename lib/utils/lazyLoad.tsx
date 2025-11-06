import { Suspense, lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { LoadingSpinner, LoadingCard } from '@/components/ui/Loading';

/**
 * Wrapper para lazy loading con fallback automático
 */
export function lazyLoad<P extends Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props: P) => (
    <Suspense fallback={fallback || <LoadingCard />}>
      <LazyComponent {...(props as P)} />
    </Suspense>
  );

  const lazyMeta = LazyComponent as unknown as { displayName?: string; name?: string };
  const componentName = lazyMeta.displayName ?? lazyMeta.name ?? 'Component';
  (LazyWrapper as typeof LazyWrapper & { displayName?: string }).displayName = `LazyLoaded(${componentName})`;

  return LazyWrapper;
}

/**
 * Lazy loading de páginas completas
 */
export function lazyLoadPage<P extends Record<string, unknown>>(
  importFunc: () => Promise<{ default: ComponentType<P> }>
) {
  const LazyComponent = lazy(importFunc);

  const LazyWrapper = (props: P) => (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-text-muted">Cargando…</p>
          </div>
        </div>
      }
    >
      <LazyComponent {...(props as P)} />
    </Suspense>
  );

  const lazyPageMeta = LazyComponent as unknown as { displayName?: string; name?: string };
  const pageName = lazyPageMeta.displayName ?? lazyPageMeta.name ?? 'Component';
  (LazyWrapper as typeof LazyWrapper & { displayName?: string }).displayName = `LazyLoadedPage(${pageName})`;

  return LazyWrapper;
}

/**
 * Preload de componentes para cargarlos antes de necesitarlos
 */
export function preloadComponent<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>
) {
  // Ejecutar la importación pero no hacer nada con ella
  // Webpack/Next.js cacheará el módulo
  importFunc();
}
