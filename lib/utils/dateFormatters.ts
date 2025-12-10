import { format, formatDistance, formatRelative, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Helpers centralizados para formateo de fechas
 * Elimina duplicación de código en toda la aplicación
 */

// ============================================
// FORMATEO BÁSICO
// ============================================

/**
 * Formatea fecha en formato corto: "15 ene 2024"
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) return 'Sin fecha';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd MMM yyyy', { locale: es });
}

/**
 * Formatea fecha en formato largo: "lunes, 15 de enero de 2024"
 */
export function formatDateLong(date: Date | string | null | undefined): string {
  if (!date) return 'Sin fecha';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formatea fecha con hora: "15 ene 2024, 14:30"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'Sin fecha';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "dd MMM yyyy, HH:mm", { locale: es });
}

/**
 * Formatea solo la hora: "14:30"
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: es });
}

/**
 * Formatea rango de tiempo: "14:30 - 16:00"
 */
export function formatTimeRange(start: Date | string, end: Date | string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Formatea duración entre dos fechas: "1h 30min" o "45min"
 */
export function formatDuration(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;

  const minutes = differenceInMinutes(e, s);
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

// ============================================
// FORMATEO RELATIVO
// ============================================

/**
 * Formatea fecha relativa: "hace 2 días", "en 3 horas"
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return 'Sin fecha';
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: es });
}

/**
 * Formatea fecha relativa con contexto: "ayer a las 14:30", "mañana a las 10:00"
 */
export function formatRelativeWithTime(date: Date | string | null | undefined): string {
  if (!date) return 'Sin fecha';
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatRelative(d, new Date(), { locale: es });
}

// ============================================
// FORMATEO CONDICIONAL SEGURO
// ============================================

/**
 * Formatea fecha de forma segura, retornando fallback si es null/undefined
 * @param date - Fecha a formatear
 * @param formatStr - Formato deseado (por defecto: 'dd MMM yyyy')
 * @param fallback - Texto alternativo (por defecto: 'Sin fecha')
 */
export function safeFormatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'dd MMM yyyy',
  fallback: string = 'Sin fecha'
): string {
  if (!date) return fallback;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return format(d, formatStr, { locale: es });
  } catch {
    return fallback;
  }
}

// ============================================
// FORMATEO PARA INPUTS
// ============================================

/**
 * Formatea fecha para input type="date": "2024-01-15"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * Formatea fecha y hora para input type="datetime-local": "2024-01-15T14:30"
 */
export function formatDateTimeForInput(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "yyyy-MM-dd'T'HH:mm");
}
