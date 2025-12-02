import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface OptimisticActionOptions<T> {
  /**
   * Function to execute
   */
  action: (...args: any[]) => Promise<T>;

  /**
   * Toast message to show immediately (optimistic feedback)
   */
  optimisticMessage?: string;

  /**
   * Success message (replaces optimistic message on success)
   */
  successMessage?: string;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Callback to execute on success
   */
  onSuccess?: (result: T) => void;

  /**
   * Callback to execute on error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for handling async actions with optimistic UI updates
 * Provides immediate feedback to users while action is processing
 *
 * @example
 * const { execute, isLoading } = useOptimisticAction({
 *   action: async (id: string) => updateCita(id, 'confirmada'),
 *   optimisticMessage: 'Confirmando cita...',
 *   successMessage: 'Cita confirmada',
 *   errorMessage: 'Error al confirmar cita',
 *   onSuccess: () => refreshData(),
 * });
 *
 * <button onClick={() => execute(citaId)} disabled={isLoading}>
 *   {isLoading ? 'Confirmando...' : 'Confirmar'}
 * </button>
 */
export function useOptimisticAction<T = void>({
  action,
  optimisticMessage,
  successMessage,
  errorMessage,
  onSuccess,
  onError,
}: OptimisticActionOptions<T>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setIsLoading(true);
      setError(null);

      // Show optimistic feedback immediately
      let toastId: string | number | undefined;
      if (optimisticMessage) {
        toastId = toast.loading(optimisticMessage);
      }

      try {
        const result = await action(...args);

        // Update toast to success
        if (toastId) {
          toast.success(successMessage || 'Operación completada', { id: toastId });
        } else if (successMessage) {
          toast.success(successMessage);
        }

        // Call success callback
        onSuccess?.(result);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        setError(error);

        // Update toast to error
        if (toastId) {
          toast.error(errorMessage || error.message || 'Error en la operación', { id: toastId });
        } else if (errorMessage) {
          toast.error(errorMessage);
        }

        // Call error callback
        onError?.(error);

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [action, optimisticMessage, successMessage, errorMessage, onSuccess, onError]
  );

  return {
    execute,
    isLoading,
    error,
  };
}
