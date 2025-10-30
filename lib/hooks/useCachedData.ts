import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface UseCachedDataOptions {
  cacheTime?: number; // Tiempo en milisegundos (default: 5 minutos)
  refetchOnMount?: boolean;
  refetchInterval?: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Hook personalizado para cachear datos de Firestore
 * Reduce llamadas innecesarias a la base de datos
 */
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 minutos por defecto
    refetchOnMount = false,
    refetchInterval
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async (force = false) => {
    try {
      // Revisar caché primero
      const cached = cache.get(key);
      const now = Date.now();

      if (!force && cached && (now - cached.timestamp) < cacheTime) {
        setData(cached.data);
        setLoading(false);
        return cached.data;
      }

      // Hacer fetch solo si no hay caché válido
      setLoading(true);
      const result = await fetcher();

      if (isMountedRef.current) {
        // Guardar en caché
        cache.set(key, {
          data: result,
          timestamp: now
        });

        setData(result);
        setError(null);
      }

      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [key, fetcher, cacheTime]);

  // Fetch inicial
  useEffect(() => {
    isMountedRef.current = true;
    fetchData(refetchOnMount);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, refetchOnMount]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData]);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    cache.delete(key);
    return fetchData(true);
  }, [key, fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidate,
    isStale: (() => {
      const cached = cache.get(key);
      if (!cached) return true;
      return (Date.now() - cached.timestamp) >= cacheTime;
    })()
  };
}

/**
 * Invalidar caché manualmente
 */
export function invalidateCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Obtener estadísticas del caché
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
