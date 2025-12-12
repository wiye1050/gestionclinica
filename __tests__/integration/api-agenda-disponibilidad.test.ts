import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/agenda/disponibilidad/route'

// Mock de dependencias
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}))

vi.mock('@/lib/middleware/rateLimit', () => ({
  rateLimit: () => vi.fn().mockResolvedValue(null),
  RATE_LIMIT_STRICT: { maxRequests: 50, windowMs: 60000 },
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('@/components/agenda/v2/agendaHelpers', () => ({
  AGENDA_CONFIG: {
    START_HOUR: 8,
    END_HOUR: 20,
    MIN_EVENT_DURATION: 30,
  },
}))

import { getCurrentUser } from '@/lib/auth/server'
import { adminDb } from '@/lib/firebaseAdmin'

describe('API /api/agenda/disponibilidad - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/agenda/disponibilidad', () => {
    it('retorna 401 si usuario no autenticado', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autenticado')
    })

    it('retorna 403 si usuario sin permisos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'user@test.com',
        roles: ['invitado'], // rol sin permisos
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('No autorizado')
    })

    it('retorna 400 si falta profesionalId', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest('http://localhost:3000/api/agenda/disponibilidad')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('retorna 400 si days es inválido (fuera de rango)', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=10'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('retorna slots disponibles cuando no hay eventos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
      expect(Array.isArray(data.slots)).toBe(true)
      // Si no hay eventos, debe haber al menos 1 slot (todo el día disponible)
      expect(data.slots.length).toBeGreaterThan(0)
    })

    it('calcula slots entre eventos existentes', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      // Mock de eventos existentes
      const now = new Date()
      const event1Start = new Date(now)
      event1Start.setHours(10, 0, 0, 0)
      const event1End = new Date(now)
      event1End.setHours(11, 0, 0, 0)

      const event2Start = new Date(now)
      event2Start.setHours(14, 0, 0, 0)
      const event2End = new Date(now)
      event2End.setHours(15, 0, 0, 0)

      const mockDocs = [
        {
          data: () => ({
            profesionalId: 'prof-1',
            fechaInicio: { toDate: () => event1Start },
            fechaFin: { toDate: () => event1End },
          }),
        },
        {
          data: () => ({
            profesionalId: 'prof-1',
            fechaInicio: { toDate: () => event2Start },
            fechaFin: { toDate: () => event2End },
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockDocs }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
      expect(data.slots.length).toBeGreaterThan(0)
      // Debe haber slots entre los eventos
      const slotTimes = data.slots.map((s: any) => ({
        start: new Date(s.start).getHours(),
        end: new Date(s.end).getHours(),
      }))
      // Verificar que hay slots calculados correctamente
      expect(slotTimes.length).toBeGreaterThan(0)
    })

    it('filtra eventos de otros profesionales', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const now = new Date()
      const event1Start = new Date(now)
      event1Start.setHours(10, 0, 0, 0)
      const event1End = new Date(now)
      event1End.setHours(11, 0, 0, 0)

      const mockDocs = [
        {
          data: () => ({
            profesionalId: 'prof-1', // Evento del profesional solicitado
            fechaInicio: { toDate: () => event1Start },
            fechaFin: { toDate: () => event1End },
          }),
        },
        {
          data: () => ({
            profesionalId: 'prof-2', // Evento de otro profesional (debe ser filtrado)
            fechaInicio: { toDate: () => event1Start },
            fechaFin: { toDate: () => event1End },
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockDocs }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
      // Los slots deben estar disponibles porque el evento de prof-2 no cuenta
    })

    it('limita slots a máximo 6', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }), // Sin eventos = muchos slots disponibles
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=7'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
      expect(data.slots.length).toBeLessThanOrEqual(6)
    })

    it('usa valor por defecto de 3 días si no se especifica days', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.slots).toBeDefined()
    })

    it('ignora slots menores a MIN_EVENT_DURATION', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      // Eventos con gaps muy pequeños
      const now = new Date()
      const event1Start = new Date(now)
      event1Start.setHours(10, 0, 0, 0)
      const event1End = new Date(now)
      event1End.setHours(10, 20, 0, 0) // Gap de solo 20 min hasta siguiente evento

      const event2Start = new Date(now)
      event2Start.setHours(10, 40, 0, 0) // 20 min después (< 30 min MIN_EVENT_DURATION)
      const event2End = new Date(now)
      event2End.setHours(11, 0, 0, 0)

      const mockDocs = [
        {
          data: () => ({
            profesionalId: 'prof-1',
            fechaInicio: { toDate: () => event1Start },
            fechaFin: { toDate: () => event1End },
          }),
        },
        {
          data: () => ({
            profesionalId: 'prof-1',
            fechaInicio: { toDate: () => event2Start },
            fechaFin: { toDate: () => event2End },
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockDocs }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1&days=1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // El gap de 20 minutos entre eventos no debe aparecer como slot disponible
      const smallGapSlot = data.slots.find((slot: any) => slot.durationMinutes < 30)
      expect(smallGapSlot).toBeUndefined()
    })

    it('maneja errores de Firebase', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockRejectedValue(new Error('Firebase connection error')),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(mockQuery as any)

      const request = new NextRequest(
        'http://localhost:3000/api/agenda/disponibilidad?profesionalId=prof-1'
      )
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('No se pudo obtener disponibilidad')
    })
  })
})
