/**
 * Client-side API utilities for making HTTP requests
 *
 * This module provides helpers for making authenticated client-side
 * fetch requests to internal APIs, handling errors and type safety.
 */

import { captureError } from './errorLogging';

interface ApiClientOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Module name for error logging */
  module?: string;
  /** Action name for error logging */
  action?: string;
  /** Additional metadata for error logging */
  metadata?: Record<string, unknown>;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Base fetch function with error handling
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit & { module?: string; action?: string; metadata?: Record<string, unknown> }
): Promise<ApiResponse<T>> {
  const { module, action, metadata, ...fetchOptions } = options;

  try {
    const response = await fetch(path, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      const errorMessage = errorData?.error ?? `HTTP ${response.status}`;

      if (module && action) {
        captureError(new Error(errorMessage), {
          module,
          action,
          metadata: {
            ...metadata,
            status: response.status,
            path,
          },
        });
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

    if (module && action) {
      captureError(error, {
        module,
        action,
        metadata: { ...metadata, path },
      });
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Make a GET request
 *
 * @example
 * ```ts
 * const result = await apiGet<User[]>('/api/users', {
 *   module: 'users-page',
 *   action: 'fetch-users'
 * });
 * if (result.success) {
 *   logger.debug(result.data);
 * }
 * ```
 */
export async function apiGet<T = unknown>(
  path: string,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    method: 'GET',
  });
}

/**
 * Make a POST request
 *
 * @example
 * ```ts
 * const result = await apiPost<CreateResult>('/api/users', {
 *   nombre: 'Juan',
 *   apellidos: 'Pérez'
 * }, {
 *   module: 'users-page',
 *   action: 'create-user'
 * });
 * ```
 */
export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make a PUT request
 *
 * @example
 * ```ts
 * const result = await apiPut<UpdateResult>('/api/users/123', {
 *   nombre: 'Juan Actualizado'
 * }, {
 *   module: 'users-page',
 *   action: 'update-user'
 * });
 * ```
 */
export async function apiPut<T = unknown>(
  path: string,
  body: unknown,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make a PATCH request
 *
 * @example
 * ```ts
 * const result = await apiPatch<UpdateResult>('/api/users/123', {
 *   estado: 'inactivo'
 * }, {
 *   module: 'users-page',
 *   action: 'patch-user'
 * });
 * ```
 */
export async function apiPatch<T = unknown>(
  path: string,
  body: unknown,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Make a DELETE request
 *
 * @example
 * ```ts
 * const result = await apiDelete<DeleteResult>('/api/users/123', {
 *   module: 'users-page',
 *   action: 'delete-user'
 * });
 * ```
 */
export async function apiDelete<T = unknown>(
  path: string,
  options: ApiClientOptions = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * Helper para manejar errores de API de forma consistente
 *
 * @example
 * ```ts
 * const result = await apiGet('/api/users');
 * if (!handleApiError(result, 'No se pudieron cargar los usuarios')) {
 *   return; // Error mostrado al usuario
 * }
 * // Continuar con result.data
 * ```
 */
export function handleApiError<T>(
  result: ApiResponse<T>,
  defaultMessage = 'Ocurrió un error'
): result is ApiResponse<T> & { success: true; data: T } {
  if (!result.success) {
    alert(result.error ?? defaultMessage);
    return false;
  }
  return true;
}
