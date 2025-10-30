import { Suspense, lazy, ComponentType } from 'react';
import { LoadingSpinner, LoadingCard } from '@/components/ui/Loading';

/**
 * Wrapper para lazy loading con fallback automático
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <LoadingCard />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Lazy loading de páginas completas
 */
export function lazyLoadPage<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFunc);

  return (props: React.ComponentProps<T>) => (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <LazyComponent {...props} />
    </Suspense>
  );
}

/**
 * Preload de componentes para cargarlos antes de necesitarlos
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  // Ejecutar la importación pero no hacer nada con ella
  // Webpack/Next.js cacheará el módulo
  importFunc();
}
