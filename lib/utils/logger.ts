/**
 * Logger estructurado para la aplicación
 * Funciona tanto en cliente como en servidor
 * En producción solo registra warn y error
 *
 * Features:
 * - Niveles de log configurables
 * - Contexto estructurado
 * - Request correlation IDs automáticos
 * - Integración con métricas
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // En producción solo logear warn y error
    return level === 'warn' || level === 'error';
  }

  /**
   * Enriquece el contexto con información del request actual
   */
  private enrichContext(context?: LogContext): LogContext {
    // Request info debe añadirse manualmente en el contexto
    return { ...context };
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const enrichedContext = this.enrichContext(context);

    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (Object.keys(enrichedContext).length > 0) {
      const contextStr = Object.entries(enrichedContext)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      return `${prefix} ${message} | ${contextStr}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Incrementa contador de métricas para logs
   */
  private recordMetric(_level: LogLevel, _context?: LogContext): void {
    // Métricas desactivadas para evitar dependencias circulares
  }

  /**
   * Log de debugging (solo en desarrollo)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    this.recordMetric('debug', context);
    // eslint-disable-next-line no-console
    console.log(this.formatMessage('debug', message, context));
  }

  /**
   * Log informativo (solo en desarrollo)
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    this.recordMetric('info', context);
    // eslint-disable-next-line no-console
    console.log(this.formatMessage('info', message, context));
  }

  /**
   * Log de advertencia (desarrollo y producción)
   */
  warn(message: string, error?: Error | unknown | LogContext): void {
    if (!this.shouldLog('warn')) return;
    const context = error instanceof Error || !error ? undefined : (error as LogContext);
    this.recordMetric('warn', context);

    if (error instanceof Error) {
      console.warn(
        this.formatMessage('warn', message, {
          errorName: error.name,
          errorMessage: error.message,
        })
      );
    } else {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  /**
   * Log de error (desarrollo y producción)
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const errorContext = {
      ...context,
      ...(error instanceof Error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      }),
    };

    this.recordMetric('error', errorContext);
    console.error(this.formatMessage('error', message, errorContext));
  }

  /**
   * Crea un timer para medir duración de operaciones
   * Retorna función para detener el timer y loguear
   */
  startTimer(message: string, context?: LogContext): () => void {
    const startTime = Date.now();

    return () => {
      const durationMs = Date.now() - startTime;
      this.info(message, { ...context, durationMs });
    };
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Export default para compatibilidad
export default logger;
