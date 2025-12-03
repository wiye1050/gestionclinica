'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { logger } from '@/lib/utils/logger';

/**
 * Determina si un error debe ser reintentado
 * Solo reintentamos errores de red (5xx) y timeouts, no errores del cliente (4xx)
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  // Máximo 3 intentos
  if (failureCount >= 3) return false;

  // Si el error tiene un status code, verificarlo
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    // No reintentar errores del cliente (4xx)
    if (status >= 400 && status < 500) return false;
  }

  // Reintentar errores de red y errores del servidor (5xx)
  return true;
}

/**
 * Delay exponencial con jitter para reintentos
 * @param attemptIndex - Índice del intento (0, 1, 2...)
 * @returns Delay en milisegundos
 */
function retryDelay(attemptIndex: number): number {
  // Exponential backoff: 1s, 2s, 4s con jitter aleatorio
  const baseDelay = Math.min(1000 * 2 ** attemptIndex, 10000);
  const jitter = Math.random() * 500; // ±500ms de jitter
  return baseDelay + jitter;
}

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
            // Retry con lógica personalizada (máximo 3 intentos para queries)
            retry: shouldRetry,
            // Delay exponencial entre reintentos con jitter
            retryDelay,
            // No refetch automático en window focus (para evitar llamadas innecesarias)
            refetchOnWindowFocus: false,
            // Refetch cada 5 minutos en background
            refetchInterval: 5 * 60 * 1000,
          },
          mutations: {
            // Mutations: máximo 2 intentos con delay más corto
            retry: (failureCount, error) => {
              if (failureCount >= 2) return false;
              return shouldRetry(failureCount, error);
            },
            retryDelay: (attemptIndex) => {
              // Delay más corto para mutations: 500ms, 1s
              return Math.min(500 * 2 ** attemptIndex, 2000);
            },
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
