/**
 * Server-side fetch utilities for Next.js App Router
 *
 * This module provides helpers for making authenticated server-side
 * fetch requests to internal APIs, handling cookies and error logging.
 */

import { headers, cookies } from 'next/headers';
import { captureError } from './errorLogging';

interface ServerFetchOptions extends Omit<RequestInit, 'headers'> {
  /** Additional headers to merge with cookie header */
  headers?: Record<string, string>;
  /** Module name for error logging */
  module: string;
  /** Action name for error logging */
  action: string;
  /** Additional metadata for error logging */
  metadata?: Record<string, unknown>;
}

/**
 * Build the base URL for internal API requests
 *
 * Uses the current request's host and protocol to construct the full URL.
 * Falls back to localhost:3000 for development environments.
 */
async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  return host ? `${protocol}://${host}` : 'http://localhost:3000';
}

/**
 * Make an authenticated server-side fetch request to an internal API
 *
 * This helper automatically:
 * - Constructs the full URL from relative path
 * - Includes cookie authentication headers
 * - Handles errors with structured logging
 * - Returns typed response data or null on error
 *
 * @param path - API path (e.g., '/api/pacientes')
 * @param options - Fetch options and error logging context
 * @returns Promise with response data or null on error
 *
 * @example
 * ```ts
 * const data = await serverFetch<KPIResponse>('/api/kpis', {
 *   module: 'kpis-page',
 *   action: 'fetch-kpis',
 *   cache: 'no-store'
 * });
 * ```
 */
export async function serverFetch<T = unknown>(
  path: string,
  options: ServerFetchOptions
): Promise<T | null> {
  const { module, action, metadata, headers: additionalHeaders, ...fetchOptions } = options;

  try {
    const baseUrl = await getBaseUrl();
    const cookieHeader = (await cookies()).toString();

    const headers: Record<string, string> = {};
    if (cookieHeader) {
      headers.cookie = cookieHeader;
    }
    if (additionalHeaders) {
      Object.assign(headers, additionalHeaders);
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...fetchOptions,
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const errorMessage = payload?.error ?? `HTTP ${response.status}`;

      captureError(new Error(errorMessage), {
        module,
        action,
        metadata: {
          ...metadata,
          status: response.status,
          path,
        },
      });

      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    captureError(error, {
      module,
      action,
      metadata: { ...metadata, path },
    });
    return null;
  }
}

/**
 * Simplified server fetch for GET requests with type safety
 *
 * @example
 * ```ts
 * const kpis = await serverFetchGet<KPIResponse>('/api/kpis', 'kpis-page', 'fetch-kpis');
 * ```
 */
export async function serverFetchGet<T = unknown>(
  path: string,
  module: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<T | null> {
  return serverFetch<T>(path, {
    module,
    action,
    metadata,
    cache: 'no-store',
  });
}

/**
 * Simplified server fetch for POST requests with type safety
 *
 * @example
 * ```ts
 * const result = await serverFetchPost<CreateResult>('/api/pacientes', {
 *   nombre: 'Juan',
 *   apellidos: 'Pérez'
 * }, 'pacientes-page', 'create-paciente');
 * ```
 */
export async function serverFetchPost<T = unknown>(
  path: string,
  body: unknown,
  module: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<T | null> {
  return serverFetch<T>(path, {
    module,
    action,
    metadata,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}
