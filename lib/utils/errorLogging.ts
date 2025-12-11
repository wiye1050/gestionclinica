/**
 * Sistema centralizado de logging de errores
 *
 * Proporciona funciones para registrar errores de manera consistente
 * en toda la aplicación, con capacidad de integración futura con
 * servicios de tracking como Sentry.
 */

export type ErrorContext = {
  module: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
};

export type LogLevel = 'error' | 'warn' | 'info';

/**
 * Registra un error con contexto adicional
 */
export function logError(
  error: Error | string,
  context: ErrorContext,
  level: LogLevel = 'error'
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // En desarrollo, mostrar en consola con formato mejorado
  if (process.env.NODE_ENV === 'development') {
    const prefix = `[${level.toUpperCase()}] [${context.module}]`;
    const fullMessage = context.action
      ? `${prefix} ${context.action}: ${errorMessage}`
      : `${prefix} ${errorMessage}`;

    if (level === 'error') {
      console.error(fullMessage, {
        error: errorMessage,
        stack: errorStack,
        context,
      });
    } else if (level === 'warn') {
      console.warn(fullMessage, { context });
    } else {
      // eslint-disable-next-line no-console
      console.info(fullMessage, { context });
    }
  }

  // En producción, enviar a servicio de tracking (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrar con servicio de error tracking
    // Ejemplo con Sentry:
    // Sentry.captureException(error, {
    //   level,
    //   tags: {
    //     module: context.module,
    //     action: context.action,
    //   },
    //   extra: context.metadata,
    // });

    // Por ahora, log mínimo en producción
    console.error(`[${context.module}] ${errorMessage}`);
  }

  // Opcional: Guardar en localStorage para debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      const logs = JSON.parse(localStorage.getItem('app-error-logs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        level,
        module: context.module,
        action: context.action,
        message: errorMessage,
        stack: errorStack,
        metadata: context.metadata,
      });
      // Mantener solo los últimos 50 logs
      if (logs.length > 50) logs.shift();
      localStorage.setItem('app-error-logs', JSON.stringify(logs));
    } catch {
      // Ignorar errores de localStorage
    }
  }
}

/**
 * Helper para capturar errores en bloques try-catch
 */
export function captureError(
  error: unknown,
  context: ErrorContext,
  level: LogLevel = 'error'
): void {
  if (error instanceof Error) {
    logError(error, context, level);
  } else {
    logError(String(error), context, level);
  }
}

/**
 * Helper para warnings
 */
export function logWarning(message: string, context: ErrorContext): void {
  logError(message, context, 'warn');
}

/**
 * Helper para información (debugging)
 */
export function logInfo(message: string, context: ErrorContext): void {
  logError(message, context, 'info');
}

/**
 * Limpiar logs almacenados (útil para testing)
 */
export function clearStoredLogs(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('app-error-logs');
    } catch {
      // Ignorar
    }
  }
}

/**
 * Obtener logs almacenados (útil para debugging)
 */
export function getStoredLogs(): Array<{
  timestamp: string;
  level: LogLevel;
  module: string;
  action?: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}> {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('app-error-logs') || '[]');
    } catch {
      return [];
    }
  }
  return [];
}
