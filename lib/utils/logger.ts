/**
 * Logger estructurado para la aplicación
 * Funciona tanto en cliente como en servidor
 * En producción solo registra warn y error
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  module?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    // En producción solo logear warn y error
    return level === 'warn' || level === 'error';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (context) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      return `${prefix} ${message} | ${contextStr}`;
    }

    return `${prefix} ${message}`;
  }

  /**
   * Log de debugging (solo en desarrollo)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    console.log(this.formatMessage('debug', message, context));
  }

  /**
   * Log informativo (solo en desarrollo)
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, context));
  }

  /**
   * Log de advertencia (desarrollo y producción)
   */
  warn(message: string, error?: Error | unknown | LogContext): void {
    if (!this.shouldLog('warn')) return;
    const context = error instanceof Error || !error ? undefined : (error as LogContext);
    if (error instanceof Error) {
      console.warn(this.formatMessage('warn', message, {
        errorName: error.name,
        errorMessage: error.message,
      }));
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

    console.error(this.formatMessage('error', message, errorContext));
  }
}

// Exportar instancia singleton
export const logger = new Logger();

// Export default para compatibilidad
export default logger;
