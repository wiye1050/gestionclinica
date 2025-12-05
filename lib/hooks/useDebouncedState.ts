import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar estado con debounce
 *
 * @param initialValue - Valor inicial
 * @param delay - Delay en milisegundos (default: 300ms)
 * @returns [value, setValue, debouncedValue]
 *
 * @example
 * const [search, setSearch, debouncedSearch] = useDebouncedState('', 300);
 * // search se actualiza inmediatamente (UI responsive)
 * // debouncedSearch se actualiza después de 300ms sin cambios (para queries)
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, (value: T) => void, T] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [value, setValue, debouncedValue];
}

/**
 * Hook para valor debounced sin estado
 * Útil cuando ya tienes el estado manejado externamente
 *
 * @param value - Valor a debounce
 * @param delay - Delay en milisegundos
 * @returns Valor debounced
 *
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebouncedValue(search, 300);
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para función debounced
 * Útil para funciones que se llaman frecuentemente (ej. onChange)
 *
 * @param callback - Función a debounce
 * @param delay - Delay en milisegundos
 * @returns Función debounced
 *
 * @example
 * const fetchResults = useDebouncedCallback((query: string) => {
 *   api.search(query);
 * }, 500);
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}
