/**
 * Sistema de métricas y observabilidad
 *
 * Proporciona funciones para medir performance, contar eventos
 * y generar métricas útiles para monitoring.
 */

import { logger } from './logger';

type MetricType = 'counter' | 'gauge' | 'histogram' | 'timing';

interface MetricData {
  name: string;
  value: number;
  type: MetricType;
  tags?: Record<string, string>;
  timestamp: number;
}

class MetricsCollector {
  private metrics: MetricData[] = [];
  private readonly maxMetrics = 1000; // Limitar memoria
  private timers: Map<string, number> = new Map();

  /**
   * Incrementa un contador
   * Útil para contar eventos (ej: "api.requests", "errors.total")
   */
  increment(name: string, value = 1, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      type: 'counter',
      tags,
      timestamp: Date.now(),
    });

    logger.debug(`Metric incremented: ${name}`, { value, tags });
  }

  /**
   * Registra un valor de gauge
   * Útil para valores que suben y bajan (ej: "queue.size", "active.users")
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      type: 'gauge',
      tags,
      timestamp: Date.now(),
    });

    logger.debug(`Gauge recorded: ${name}`, { value, tags });
  }

  /**
   * Registra un valor de histograma
   * Útil para distribuciones (ej: "request.size", "response.bytes")
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value,
      type: 'histogram',
      tags,
      timestamp: Date.now(),
    });

    logger.debug(`Histogram recorded: ${name}`, { value, tags });
  }

  /**
   * Inicia un timer para medir duración
   * Devuelve una función para detener el timer
   */
  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = Date.now();
    const timerKey = `${name}-${JSON.stringify(tags ?? {})}`;

    this.timers.set(timerKey, startTime);

    return () => {
      const duration = Date.now() - startTime;
      this.timers.delete(timerKey);

      this.timing(name, duration, tags);
    };
  }

  /**
   * Registra una duración en milisegundos
   * Útil para medir latencia (ej: "api.duration", "query.time")
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>): void {
    this.record({
      name,
      value: durationMs,
      type: 'timing',
      tags,
      timestamp: Date.now(),
    });

    // Log si la duración es alta
    if (durationMs > 1000) {
      logger.warn(`Slow operation detected: ${name}`, { durationMs, tags });
    } else {
      logger.debug(`Timing recorded: ${name}`, { durationMs, tags });
    }
  }

  /**
   * Wrapper para medir tiempo de ejecución de función async
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const stopTimer = this.startTimer(name, tags);
    try {
      const result = await fn();
      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      this.increment(`${name}.error`, 1, tags);
      throw error;
    }
  }

  /**
   * Wrapper para medir tiempo de ejecución de función síncrona
   */
  measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const stopTimer = this.startTimer(name, tags);
    try {
      const result = fn();
      stopTimer();
      return result;
    } catch (error) {
      stopTimer();
      this.increment(`${name}.error`, 1, tags);
      throw error;
    }
  }

  /**
   * Registra una métrica
   */
  private record(metric: MetricData): void {
    this.metrics.push(metric);

    // Limitar tamaño del buffer
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // En producción, aquí se enviaría a un servicio de métricas
    // (DataDog, New Relic, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Enviar a servicio de métricas
      // sendToMetricsService(metric);
    }
  }

  /**
   * Obtiene todas las métricas registradas
   * Útil para debugging y exportación
   */
  getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  /**
   * Obtiene métricas filtradas por nombre
   */
  getMetricsByName(name: string): MetricData[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Obtiene estadísticas agregadas para una métrica
   */
  getStats(name: string): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetricsByName(name);

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, v) => acc + v, 0);

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * values.length) - 1;
      return values[Math.max(0, index)];
    };

    return {
      count: values.length,
      sum,
      avg: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  /**
   * Limpia todas las métricas
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
    logger.debug('Metrics cleared');
  }

  /**
   * Exporta métricas en formato JSON
   */
  export(): string {
    return JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        stats: this.getAllStats(),
      },
      null,
      2
    );
  }

  /**
   * Obtiene estadísticas de todas las métricas
   */
  private getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const uniqueNames = new Set(this.metrics.map((m) => m.name));
    const stats: Record<string, ReturnType<typeof this.getStats>> = {};

    uniqueNames.forEach((name) => {
      stats[name] = this.getStats(name);
    });

    return stats;
  }
}

// Instancia singleton
export const metrics = new MetricsCollector();

/**
 * Helper para medir performance de API requests
 */
export function measureApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number
): void {
  const tags = {
    method,
    path,
    status: String(statusCode),
    statusClass: `${Math.floor(statusCode / 100)}xx`,
  };

  metrics.timing('api.request.duration', durationMs, tags);
  metrics.increment('api.request.count', 1, tags);

  if (statusCode >= 400) {
    metrics.increment('api.request.errors', 1, tags);
  }

  if (statusCode >= 500) {
    metrics.increment('api.request.server_errors', 1, tags);
  }
}

/**
 * Helper para medir queries de Firestore
 */
export function measureFirestoreQuery(
  collection: string,
  operation: 'get' | 'set' | 'update' | 'delete',
  durationMs: number,
  docsCount?: number
): void {
  const tags = {
    collection,
    operation,
  };

  metrics.timing('firestore.query.duration', durationMs, tags);
  metrics.increment('firestore.query.count', 1, tags);

  if (docsCount !== undefined) {
    metrics.histogram('firestore.query.docs', docsCount, tags);
  }
}

/**
 * Decorador para medir tiempo de ejecución de funciones
 * Uso: const result = await withTiming('operation-name', async () => { ... })
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  return metrics.measure(name, fn, tags);
}

/**
 * Decorador para medir tiempo de ejecución de funciones síncronas
 */
export function withTimingSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  return metrics.measureSync(name, fn, tags);
}

// Export default para compatibilidad
export default metrics;
