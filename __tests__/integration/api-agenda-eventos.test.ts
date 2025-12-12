import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/agenda/eventos/route'

// Mock de dependencias
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/server/agenda', () => ({
  getSerializedAgendaEvents: vi.fn(),
}))

vi.mock('@/lib/server/agendaEvents', () => ({
  createAgendaEvent: vi.fn(),
}))

vi.mock('@/lib/server/agendaValidation', () => ({
  checkEventConflicts: vi.fn(),
  validateEventDates: vi.fn(),
}))

vi.mock('@/lib/middleware/rateLimit', () => ({
  rateLimit: () => vi.fn().mockResolvedValue(null),
  RATE_LIMIT_STRICT: { maxRequests: 50, windowMs: 60000 },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}))

import { getCurrentUser } from '@/lib/auth/server'
import { getSerializedAgendaEvents } from '@/lib/server/agenda'
import { createAgendaEvent } from '@/lib/server/agendaEvents'
import { checkEventConflicts, validateEventDates } from '@/lib/server/agendaValidation'

describe('API /api/agenda/eventos - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/agenda/eventos', () => {
    it('retorna 401 si usuario no autenticado', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos?weekStart=2024-03-18')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autenticado')
    })

    it('retorna 403 si usuario sin permisos de lectura', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'user@test.com',
        roles: [],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos?weekStart=2024-03-18')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permisos insuficientes')
    })

    it('retorna 400 si falta parámetro weekStart', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Parámetro weekStart requerido')
    })

    it('retorna 400 si weekStart es fecha inválida', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos?weekStart=invalid-date')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Fecha weekStart inválida')
    })

    it('retorna eventos de la semana especificada', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockEvents = [
        {
          id: 'event-1',
          titulo: 'Consulta Juan',
          tipo: 'consulta',
          fechaInicio: '2024-03-18T10:00:00.000Z',
          fechaFin: '2024-03-18T11:00:00.000Z',
          profesionalId: 'prof-1',
          pacienteId: 'pac-1',
          estado: 'programada',
        },
        {
          id: 'event-2',
          titulo: 'Seguimiento María',
          tipo: 'seguimiento',
          fechaInicio: '2024-03-19T14:00:00.000Z',
          fechaFin: '2024-03-19T15:30:00.000Z',
          profesionalId: 'prof-2',
          pacienteId: 'pac-2',
          estado: 'programada',
        },
      ]

      vi.mocked(getSerializedAgendaEvents).mockResolvedValue(mockEvents as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos?weekStart=2024-03-18')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toHaveLength(2)
      expect(data.events[0].titulo).toBe('Consulta Juan')
      expect(getSerializedAgendaEvents).toHaveBeenCalledWith(new Date('2024-03-18'))
    })

    it('maneja errores al obtener eventos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(getSerializedAgendaEvents).mockRejectedValue(new Error('Firebase error'))

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos?weekStart=2024-03-18')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error al obtener eventos')
    })
  })

  describe('POST /api/agenda/eventos', () => {
    it('retorna 401 si usuario no autenticado', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autenticado')
    })

    it('retorna 403 si usuario sin permisos de escritura', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'user@test.com',
        roles: ['invitado'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Permisos insuficientes')
    })

    it('retorna 400 si datos inválidos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: '', // título vacío (inválido)
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('retorna 400 si fechas inválidas', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(validateEventDates).mockReturnValue('La fecha de fin debe ser posterior a la fecha de inicio')

      const invalidEvent = {
        titulo: 'Evento Test',
        tipo: 'consulta',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T09:00:00.000Z', // Fecha fin anterior a inicio
        profesionalId: 'prof-1',
        estado: 'programada',
        prioridad: 'media',
      }

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify(invalidEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      // Puede ser validación de Zod o error de fechas
      expect(typeof data.error).toBe('string')
    })

    it('retorna 409 si hay conflicto de horario (double-booking)', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(validateEventDates).mockReturnValue(null)
      vi.mocked(checkEventConflicts).mockResolvedValue({
        hasConflict: true,
        conflictType: 'double-booking-profesional',
        conflictingEventId: 'event-existing',
        conflictingEventTitulo: 'Consulta anterior',
        severity: 'error',
      } as any)

      const validEvent = {
        titulo: 'Nueva Consulta',
        tipo: 'consulta',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
        prioridad: 'media',
      }

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify(validEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Conflicto de horario detectado')
      expect(data.details.conflictType).toBe('double-booking-profesional')
    })

    it('crea evento con datos válidos sin conflictos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(validateEventDates).mockReturnValue(null)
      vi.mocked(checkEventConflicts).mockResolvedValue(null)

      const mockCreatedEvent = {
        id: 'event-new-123',
        titulo: 'Nueva Consulta',
        tipo: 'cita',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
      }

      vi.mocked(createAgendaEvent).mockResolvedValue(mockCreatedEvent as any)

      const validEvent = {
        titulo: 'Nueva Consulta',
        tipo: 'consulta',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
        prioridad: 'media',
      }

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify(validEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('event-new-123')
      expect(data.titulo).toBe('Nueva Consulta')
      expect(createAgendaEvent).toHaveBeenCalled()
    })

    it('crea evento administrativo sin validar conflictos si no hay sala', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(validateEventDates).mockReturnValue(null)
      vi.mocked(checkEventConflicts).mockResolvedValue(null)

      const mockCreatedEvent = {
        id: 'event-new-456',
        titulo: 'Evento administrativo',
        tipo: 'administrativo',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
      }

      vi.mocked(createAgendaEvent).mockResolvedValue(mockCreatedEvent as any)

      const eventoAdministrativo = {
        titulo: 'Evento administrativo',
        tipo: 'administrativo',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
        prioridad: 'baja',
      }

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify(eventoAdministrativo),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(createAgendaEvent).toHaveBeenCalled()
    })

    it('maneja errores al crear evento', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)
      vi.mocked(validateEventDates).mockReturnValue(null)
      vi.mocked(checkEventConflicts).mockResolvedValue(null)
      vi.mocked(createAgendaEvent).mockRejectedValue(new Error('Firebase error'))

      const validEvent = {
        titulo: 'Nueva Consulta',
        tipo: 'consulta',
        fechaInicio: '2024-03-18T10:00:00.000Z',
        fechaFin: '2024-03-18T11:00:00.000Z',
        profesionalId: 'prof-1',
        estado: 'programada',
        prioridad: 'media',
      }

      const request = new NextRequest('http://localhost:3000/api/agenda/eventos', {
        method: 'POST',
        body: JSON.stringify(validEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('error')
    })
  })
})
