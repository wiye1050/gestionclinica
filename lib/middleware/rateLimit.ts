/**
 * Rate Limiting Middleware con Sliding Window In-Memory
 *
 * Implementa rate limiting para API routes usando un algoritmo de sliding window.
 * Los límites se almacenan en memoria usando un Map.
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store in-memory para rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Presets de configuración
export const RATE_LIMIT_STRICT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1 minuto
};

export const RATE_LIMIT_MODERATE: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minuto
};

export const RATE_LIMIT_PERMISSIVE: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minuto
};

/**
 * Obtiene la IP del cliente desde los headers
 */
function getClientIP(request: NextRequest): string {
  // Intentar obtener IP real desde headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for puede contener múltiples IPs separadas por coma
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback a una IP genérica si no se puede determinar
  return 'unknown';
}

/**
 * Genera una key única para el rate limiting basada en IP y pathname
 */
function getRateLimitKey(request: NextRequest): string {
  const ip = getClientIP(request);
  const pathname = new URL(request.url).pathname;
  return `${ip}:${pathname}`;
}

/**
 * Cleanup automático de entradas expiradas
 * Se ejecuta cada 10 minutos
 */
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

function cleanupExpiredEntries() {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));

  lastCleanup = now;

  if (keysToDelete.length > 0) {
    logger.debug('Rate limit cleanup completed', {
      entriesRemoved: keysToDelete.length,
      remainingEntries: rateLimitStore.size,
    });
  }
}

/**
 * Crea un middleware de rate limiting con la configuración especificada
 */
export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    // Ejecutar cleanup periódico
    cleanupExpiredEntries();

    const key = getRateLimitKey(request);
    const now = Date.now();

    // Obtener o crear entrada para este cliente
    let entry = rateLimitStore.get(key);

    // Si no existe o ya expiró, crear nueva entrada
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
      };
      rateLimitStore.set(key, entry);

      // Headers de rate limit
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', config.maxRequests.toString());
      headers.set('X-RateLimit-Remaining', (config.maxRequests - 1).toString());
      headers.set('X-RateLimit-Reset', entry.resetTime.toString());

      return null; // Permitir request
    }

    // Incrementar contador
    entry.count++;

    // Calcular requests restantes
    const remaining = Math.max(0, config.maxRequests - entry.count);

    // Headers de rate limit
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    // Verificar si se excedió el límite
    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      logger.warn('Rate limit exceeded', {
        ip: getClientIP(request),
        pathname: new URL(request.url).pathname,
        count: entry.count,
        limit: config.maxRequests,
        retryAfter,
      });

      headers.set('Retry-After', retryAfter.toString());

      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Has excedido el límite de ${config.maxRequests} requests por minuto. Por favor, intenta de nuevo en ${retryAfter} segundos.`,
          retryAfter,
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Request permitido - no retornar nada para que continúe
    return null;
  };
}
