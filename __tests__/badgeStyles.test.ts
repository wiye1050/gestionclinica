import { describe, it, expect } from 'vitest'
import {
  getStatusBadgeClasses,
  getEstadoPacienteBadge,
  getRiesgoBadge,
  getFacturaStatusBadge,
  getPresupuestoStatusBadge,
  getRoleBadge,
  getEstadoEventoAgendaBadge,
  getPrioridadBadge,
  getEstadoProyectoBadge,
  getHistorialTipoBadge,
  getFacturaStatusIcon,
  getPresupuestoStatusIcon,
} from '@/lib/utils/badgeStyles'
import type { AppRole } from '@/lib/auth/roles'

describe('badgeStyles', () => {
  describe('getStatusBadgeClasses', () => {
    it('retorna clases para success', () => {
      const classes = getStatusBadgeClasses('success')
      expect(classes).toContain('bg-success-bg')
      expect(classes).toContain('text-success')
      expect(classes).toContain('border-success')
    })

    it('retorna clases para warning', () => {
      const classes = getStatusBadgeClasses('warning')
      expect(classes).toContain('bg-warning-bg')
      expect(classes).toContain('text-warning')
    })

    it('retorna clases para error', () => {
      const classes = getStatusBadgeClasses('error')
      expect(classes).toContain('bg-danger-bg')
      expect(classes).toContain('text-danger')
    })

    it('retorna clases para info', () => {
      const classes = getStatusBadgeClasses('info')
      expect(classes).toContain('bg-info-bg')
      expect(classes).toContain('text-info')
    })

    it('retorna clases para neutral', () => {
      const classes = getStatusBadgeClasses('neutral')
      expect(classes).toContain('bg-muted')
      expect(classes).toContain('text-text-muted')
    })

    it('incluye clases base', () => {
      const classes = getStatusBadgeClasses('success')
      expect(classes).toContain('rounded-full')
      expect(classes).toContain('text-xs')
      expect(classes).toContain('font-medium')
    })
  })

  describe('getEstadoPacienteBadge', () => {
    it('retorna success para activo', () => {
      const classes = getEstadoPacienteBadge('activo')
      expect(classes).toContain('bg-success-bg')
    })

    it('retorna neutral para inactivo', () => {
      const classes = getEstadoPacienteBadge('inactivo')
      expect(classes).toContain('bg-muted')
    })

    it('retorna info para egresado', () => {
      const classes = getEstadoPacienteBadge('egresado')
      expect(classes).toContain('bg-info-bg')
    })
  })

  describe('getRiesgoBadge', () => {
    it('retorna error para riesgo alto', () => {
      const classes = getRiesgoBadge('alto')
      expect(classes).toContain('bg-danger-bg')
    })

    it('retorna warning para riesgo medio', () => {
      const classes = getRiesgoBadge('medio')
      expect(classes).toContain('bg-warning-bg')
    })

    it('retorna success para riesgo bajo', () => {
      const classes = getRiesgoBadge('bajo')
      expect(classes).toContain('bg-success-bg')
    })
  })

  describe('getFacturaStatusBadge', () => {
    it('retorna clases para pagada', () => {
      const classes = getFacturaStatusBadge('pagada')
      expect(classes).toContain('bg-success-bg')
      expect(classes).toContain('text-success')
    })

    it('retorna clases para pendiente', () => {
      const classes = getFacturaStatusBadge('pendiente')
      expect(classes).toContain('bg-warning-bg')
    })

    it('retorna clases para vencida', () => {
      const classes = getFacturaStatusBadge('vencida')
      expect(classes).toContain('bg-danger-bg')
    })
  })

  describe('getPresupuestoStatusBadge', () => {
    it('retorna clases para aceptado', () => {
      const classes = getPresupuestoStatusBadge('aceptado')
      expect(classes).toContain('bg-success-bg')
    })

    it('retorna clases para pendiente', () => {
      const classes = getPresupuestoStatusBadge('pendiente')
      expect(classes).toContain('bg-warning-bg')
    })

    it('retorna clases para rechazado', () => {
      const classes = getPresupuestoStatusBadge('rechazado')
      expect(classes).toContain('bg-danger-bg')
    })

    it('retorna clases para caducado', () => {
      const classes = getPresupuestoStatusBadge('caducado')
      expect(classes).toContain('bg-muted')
    })
  })

  describe('getRoleBadge', () => {
    const roles: AppRole[] = ['admin', 'coordinador', 'profesional', 'recepcion', 'invitado']

    it.each(roles)('retorna clases para rol %s', (role) => {
      const classes = getRoleBadge(role)
      expect(classes).toContain('inline-flex')
      expect(classes).toContain('items-center')
      expect(classes).toBeTruthy()
    })

    it('retorna clases específicas para admin', () => {
      const classes = getRoleBadge('admin')
      expect(classes).toContain('bg-red-100')
      expect(classes).toContain('text-red-700')
    })

    it('retorna clases específicas para coordinador', () => {
      const classes = getRoleBadge('coordinador')
      expect(classes).toContain('bg-purple-100')
    })

    it('retorna clases específicas para profesional', () => {
      const classes = getRoleBadge('profesional')
      expect(classes).toContain('bg-blue-100')
    })

    it('retorna clases específicas para recepcion', () => {
      const classes = getRoleBadge('recepcion')
      expect(classes).toContain('bg-green-100')
    })

    it('retorna clases específicas para invitado', () => {
      const classes = getRoleBadge('invitado')
      expect(classes).toContain('bg-gray-100')
    })
  })

  describe('getEstadoEventoAgendaBadge', () => {
    it('retorna info para programada', () => {
      const classes = getEstadoEventoAgendaBadge('programada')
      expect(classes).toContain('bg-info-bg')
    })

    it('retorna success para confirmada', () => {
      const classes = getEstadoEventoAgendaBadge('confirmada')
      expect(classes).toContain('bg-success-bg')
    })

    it('retorna neutral para realizada', () => {
      const classes = getEstadoEventoAgendaBadge('realizada')
      expect(classes).toContain('bg-muted')
    })

    it('retorna error para cancelada', () => {
      const classes = getEstadoEventoAgendaBadge('cancelada')
      expect(classes).toContain('bg-danger-bg')
    })
  })

  describe('getPrioridadBadge', () => {
    it('retorna error para alta', () => {
      const classes = getPrioridadBadge('alta')
      expect(classes).toContain('bg-danger-bg')
    })

    it('retorna warning para media', () => {
      const classes = getPrioridadBadge('media')
      expect(classes).toContain('bg-warning-bg')
    })

    it('retorna neutral para baja', () => {
      const classes = getPrioridadBadge('baja')
      expect(classes).toContain('bg-muted')
    })
  })

  describe('getEstadoProyectoBadge', () => {
    it('retorna clases para planificado', () => {
      const classes = getEstadoProyectoBadge('planificado')
      expect(classes).toContain('bg-blue-100')
    })

    it('retorna clases para en-curso', () => {
      const classes = getEstadoProyectoBadge('en-curso')
      expect(classes).toContain('bg-green-100')
    })

    it('retorna clases para pausado', () => {
      const classes = getEstadoProyectoBadge('pausado')
      expect(classes).toContain('bg-yellow-100')
    })

    it('retorna clases para completado', () => {
      const classes = getEstadoProyectoBadge('completado')
      expect(classes).toContain('bg-purple-100')
    })

    it('retorna clases para cancelado', () => {
      const classes = getEstadoProyectoBadge('cancelado')
      expect(classes).toContain('bg-gray-100')
    })
  })

  describe('getHistorialTipoBadge', () => {
    const tipos = ['nota', 'diagnostico', 'tratamiento', 'consulta', 'seguimiento', 'alta'] as const

    it.each(tipos)('retorna clases para tipo %s', (tipo) => {
      const classes = getHistorialTipoBadge(tipo)
      expect(classes).toContain('inline-flex')
      expect(classes).toBeTruthy()
    })

    it('retorna clases específicas para diagnostico', () => {
      const classes = getHistorialTipoBadge('diagnostico')
      expect(classes).toContain('bg-red-100')
      expect(classes).toContain('text-red-700')
    })

    it('retorna clases específicas para tratamiento', () => {
      const classes = getHistorialTipoBadge('tratamiento')
      expect(classes).toContain('bg-blue-100')
    })
  })

  describe('getFacturaStatusIcon', () => {
    it('retorna ícono para pagada', () => {
      expect(getFacturaStatusIcon('pagada')).toBe('✓')
    })

    it('retorna ícono para pendiente', () => {
      expect(getFacturaStatusIcon('pendiente')).toBe('⏱')
    })

    it('retorna ícono para vencida', () => {
      expect(getFacturaStatusIcon('vencida')).toBe('⚠')
    })
  })

  describe('getPresupuestoStatusIcon', () => {
    it('retorna ícono para aceptado', () => {
      expect(getPresupuestoStatusIcon('aceptado')).toBe('✓')
    })

    it('retorna ícono para pendiente', () => {
      expect(getPresupuestoStatusIcon('pendiente')).toBe('⏱')
    })

    it('retorna ícono para rechazado', () => {
      expect(getPresupuestoStatusIcon('rechazado')).toBe('✗')
    })

    it('retorna ícono para caducado', () => {
      expect(getPresupuestoStatusIcon('caducado')).toBe('⧗')
    })
  })
})
