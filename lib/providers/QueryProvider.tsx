'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Mantener datos en caché por 5 minutos
            staleTime: 5 * 60 * 1000,
            // Mantener datos inactivos por 10 minutos
            gcTime: 10 * 60 * 1000,
            // Reintentar fallos 2 veces
            retry: 2,
            // No refetch automático en window focus (para evitar llamadas innecesarias)
            refetchOnWindowFocus: false,
            // Refetch cada 5 minutos en background
            refetchInterval: 5 * 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
