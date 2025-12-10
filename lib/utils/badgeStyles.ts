/**
 * Helpers centralizados para estilos de badges y estados
 * Elimina duplicación de código de estilos condicionales
 */

import type { AppRole } from '@/lib/auth/roles';

// ============================================
// BADGES GENÉRICOS
// ============================================

/**
 * Obtiene clases CSS para badge de estado genérico
 */
export function getStatusBadgeClasses(
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral'
): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border';

  const statusClasses = {
    success: 'bg-success-bg text-success border-success',
    warning: 'bg-warning-bg text-warning border-warning',
    error: 'bg-danger-bg text-danger border-danger',
    info: 'bg-info-bg text-info border-info',
    neutral: 'bg-muted text-text-muted border-border',
  };

  return `${baseClasses} ${statusClasses[status]}`;
}

// ============================================
// PACIENTES
// ============================================

/**
 * Obtiene clases CSS para badge de estado de paciente
 */
export function getEstadoPacienteBadge(estado: 'activo' | 'inactivo' | 'egresado'): string {
  const mapping = {
    activo: 'success' as const,
    inactivo: 'neutral' as const,
    egresado: 'info' as const,
  };

  return getStatusBadgeClasses(mapping[estado] || 'neutral');
}

/**
 * Obtiene clases CSS para badge de riesgo de paciente
 */
export function getRiesgoBadge(riesgo: 'alto' | 'medio' | 'bajo'): string {
  const mapping = {
    alto: 'error' as const,
    medio: 'warning' as const,
    bajo: 'success' as const,
  };

  return getStatusBadgeClasses(mapping[riesgo] || 'neutral');
}

// ============================================
// FACTURACIÓN
// ============================================

/**
 * Obtiene clases CSS para badge de estado de factura
 */
export function getFacturaStatusBadge(estado: 'pagada' | 'pendiente' | 'vencida'): string {
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium border';

  const statusClasses = {
    pagada: 'bg-success-bg text-success border-success',
    pendiente: 'bg-warning-bg text-warning border-warning',
    vencida: 'bg-danger-bg text-danger border-danger',
  };

  return `${baseClasses} ${statusClasses[estado] || 'bg-muted text-text-muted border-border'}`;
}

/**
 * Obtiene clases CSS para badge de estado de presupuesto
 */
export function getPresupuestoStatusBadge(estado: 'aceptado' | 'pendiente' | 'rechazado' | 'caducado'): string {
  const baseClasses = 'px-2.5 py-0.5 rounded-full text-xs font-medium border';

  const statusClasses = {
    aceptado: 'bg-success-bg text-success border-success',
    pendiente: 'bg-warning-bg text-warning border-warning',
    rechazado: 'bg-danger-bg text-danger border-danger',
    caducado: 'bg-muted text-text-muted border-border',
  };

  return `${baseClasses} ${statusClasses[estado] || 'bg-muted text-text-muted border-border'}`;
}

// ============================================
// USUARIOS Y ROLES
// ============================================

/**
 * Obtiene clases CSS para badge de rol de usuario
 */
export function getRoleBadge(role: AppRole): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const roleClasses: Record<AppRole, string> = {
    admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    coordinador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    profesional: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    recepcion: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    invitado: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return `${baseClasses} ${roleClasses[role]}`;
}

// ============================================
// AGENDA
// ============================================

/**
 * Obtiene clases CSS para badge de estado de evento de agenda
 */
export function getEstadoEventoAgendaBadge(estado: 'programada' | 'confirmada' | 'realizada' | 'cancelada'): string {
  const mapping = {
    programada: 'info' as const,
    confirmada: 'success' as const,
    realizada: 'neutral' as const,
    cancelada: 'error' as const,
  };

  return getStatusBadgeClasses(mapping[estado] || 'neutral');
}

/**
 * Obtiene clases CSS para badge de prioridad de evento
 */
export function getPrioridadBadge(prioridad: 'alta' | 'media' | 'baja'): string {
  const mapping = {
    alta: 'error' as const,
    media: 'warning' as const,
    baja: 'neutral' as const,
  };

  return getStatusBadgeClasses(mapping[prioridad] || 'neutral');
}

// ============================================
// PROYECTOS
// ============================================

/**
 * Obtiene clases CSS para badge de estado de proyecto
 */
export function getEstadoProyectoBadge(estado: 'planificado' | 'en-curso' | 'pausado' | 'completado' | 'cancelado'): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const statusClasses = {
    planificado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'en-curso': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pausado: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completado: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    cancelado: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  };

  return `${baseClasses} ${statusClasses[estado] || 'bg-gray-100 text-gray-700'}`;
}

// ============================================
// HISTORIAL CLÍNICO
// ============================================

/**
 * Obtiene clases CSS para badge de tipo de entrada de historial
 */
export function getHistorialTipoBadge(tipo: 'nota' | 'diagnostico' | 'tratamiento' | 'consulta' | 'seguimiento' | 'alta'): string {
  const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';

  const tipoClasses = {
    nota: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    diagnostico: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    tratamiento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    consulta: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    seguimiento: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    alta: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return `${baseClasses} ${tipoClasses[tipo] || 'bg-gray-100 text-gray-700'}`;
}

// ============================================
// HELPERS DE ICONOS
// ============================================

/**
 * Obtiene icono para estado de factura (usando emoji/símbolos)
 */
export function getFacturaStatusIcon(estado: 'pagada' | 'pendiente' | 'vencida'): string {
  const icons = {
    pagada: '✓',
    pendiente: '⏱',
    vencida: '⚠',
  };

  return icons[estado] || '•';
}

/**
 * Obtiene icono para estado de presupuesto
 */
export function getPresupuestoStatusIcon(estado: 'aceptado' | 'pendiente' | 'rechazado' | 'caducado'): string {
  const icons = {
    aceptado: '✓',
    pendiente: '⏱',
    rechazado: '✗',
    caducado: '⧗',
  };

  return icons[estado] || '•';
}
