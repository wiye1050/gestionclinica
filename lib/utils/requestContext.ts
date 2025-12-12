/**
 * Request Context para tracing distribuido
 *
 * Genera y propaga correlation IDs a través de requests
 * para facilitar debugging y tracing.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { nanoid } from 'nanoid';

interface RequestContext {
  requestId: string;
  userId?: string;
  userEmail?: string;
  method?: string;
  path?: string;
  timestamp: number;
}

// AsyncLocalStorage para mantener contexto entre async calls
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Genera un nuevo Request ID único
 */
export function generateRequestId(): string {
  return `req_${nanoid(16)}`;
}

/**
 * Obtiene el contexto de request actual
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Obtiene el Request ID actual
 */
export function getRequestId(): string | undefined {
  return getRequestContext()?.requestId;
}

/**
 * Ejecuta una función con un contexto de request
 */
export function runWithContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Crea un nuevo contexto de request y ejecuta una función
 */
export function withRequestContext<T>(
  data: Partial<Omit<RequestContext, 'requestId' | 'timestamp'>>,
  fn: () => T
): T {
  const context: RequestContext = {
    requestId: generateRequestId(),
    timestamp: Date.now(),
    ...data,
  };

  return runWithContext(context, fn);
}

/**
 * Middleware helper para Next.js API Routes
 * Envuelve el handler con contexto de request
 */
export function withRequestTracking<T>(
  handler: (request: Request) => Promise<T>
): (request: Request) => Promise<T> {
  return async (request: Request) => {
    const url = new URL(request.url);

    const context: RequestContext = {
      requestId: request.headers.get('x-request-id') || generateRequestId(),
      method: request.method,
      path: url.pathname,
      timestamp: Date.now(),
    };

    return asyncLocalStorage.run(context, () => handler(request));
  };
}

/**
 * Añade Request ID a los headers de response
 */
export function addRequestIdToHeaders(
  headers: Headers,
  requestId?: string
): Headers {
  const id = requestId || getRequestId();
  if (id) {
    headers.set('x-request-id', id);
  }
  return headers;
}

/**
 * Obtiene información del request para logging
 */
export function getRequestInfo(): {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  method?: string;
  path?: string;
} {
  const context = getRequestContext();

  if (!context) {
    return {};
  }

  return {
    requestId: context.requestId,
    userId: context.userId,
    userEmail: context.userEmail,
    method: context.method,
    path: context.path,
  };
}
