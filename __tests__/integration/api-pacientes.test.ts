import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/pacientes/route'

// Mock de dependencias
vi.mock('@/lib/auth/server', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/firebaseAdmin', () => ({
  adminDb: {
    collection: vi.fn(),
  },
}))

vi.mock('@/lib/server/pacientesAdmin', () => ({
  createPaciente: vi.fn(),
}))

vi.mock('@/lib/middleware/rateLimit', () => ({
  rateLimit: () => vi.fn().mockResolvedValue(null),
  RATE_LIMIT_MODERATE: { maxRequests: 100, windowMs: 60000 },
}))

vi.mock('@/lib/utils/errorLogging', () => ({
  captureError: vi.fn(),
}))

import { getCurrentUser } from '@/lib/auth/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { createPaciente } from '@/lib/server/pacientesAdmin'

describe('API /api/pacientes - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/pacientes', () => {
    it('retorna 401 si usuario no autenticado', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/pacientes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autenticado')
    })

    it('retorna lista de pacientes para admin', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockUserDoc = {
        exists: true,
        data: () => ({ roles: ['admin'] }),
      }

      const mockPacientes = [
        {
          id: 'pac-1',
          data: () => ({
            numeroHistoria: 'NH001',
            nombre: 'Juan',
            apellidos: 'Pérez',
            estado: 'activo',
            createdAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'pac-2',
          data: () => ({
            numeroHistoria: 'NH002',
            nombre: 'María',
            apellidos: 'García',
            estado: 'activo',
            createdAt: new Date('2024-01-02'),
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockPacientes }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        }),
        where: vi.fn().mockReturnValue(mockQuery),
        orderBy: vi.fn().mockReturnValue(mockQuery),
        limit: vi.fn().mockReturnValue(mockQuery),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/pacientes')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(2)
      expect(data.items[0].nombre).toBe('Juan')
      expect(data.items[1].nombre).toBe('María')
    })

    it('filtra pacientes por estado', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockUserDoc = {
        exists: true,
        data: () => ({ roles: ['admin'] }),
      }

      const mockPacientes = [
        {
          id: 'pac-1',
          data: () => ({
            numeroHistoria: 'NH001',
            nombre: 'Juan',
            apellidos: 'Pérez',
            estado: 'inactivo',
            createdAt: new Date('2024-01-01'),
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockPacientes }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        }),
        where: vi.fn().mockReturnValue(mockQuery),
        orderBy: vi.fn().mockReturnValue(mockQuery),
        limit: vi.fn().mockReturnValue(mockQuery),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/pacientes?estado=inactivo')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockQuery.where).toHaveBeenCalledWith('estado', '==', 'inactivo')
    })

    it('aplica búsqueda por nombre', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockUserDoc = {
        exists: true,
        data: () => ({ roles: ['admin'] }),
      }

      const mockPacientes = [
        {
          id: 'pac-1',
          data: () => ({
            numeroHistoria: 'NH001',
            nombre: 'Juan',
            apellidos: 'Pérez',
            estado: 'activo',
            createdAt: new Date('2024-01-01'),
          }),
        },
        {
          id: 'pac-2',
          data: () => ({
            numeroHistoria: 'NH002',
            nombre: 'María',
            apellidos: 'García',
            estado: 'activo',
            createdAt: new Date('2024-01-02'),
          }),
        },
      ]

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: mockPacientes }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue({
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        }),
        where: vi.fn().mockReturnValue(mockQuery),
        orderBy: vi.fn().mockReturnValue(mockQuery),
        limit: vi.fn().mockReturnValue(mockQuery),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/pacientes?q=juan')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.items).toHaveLength(1)
      expect(data.items[0].nombre).toBe('Juan')
    })

    it('limita pacientes para profesional (no admin)', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'prof@test.com',
        roles: ['profesional'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockUserDoc = {
        exists: true,
        data: () => ({ roles: ['profesional'], profesionalId: 'prof-123' }),
      }

      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }

      const collectionMock = {
        doc: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        }),
        where: vi.fn().mockReturnValue(mockQuery),
        orderBy: vi.fn().mockReturnValue(mockQuery),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }

      vi.mocked(adminDb!.collection).mockReturnValue(collectionMock as any)

      const request = new NextRequest('http://localhost:3000/api/pacientes')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(collectionMock.where).toHaveBeenCalledWith('profesionalReferenteId', '==', 'prof-123')
    })
  })

  describe('POST /api/pacientes', () => {
    it('retorna 401 si usuario no autenticado', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/pacientes', {
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

      const request = new NextRequest('http://localhost:3000/api/pacientes', {
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

      const request = new NextRequest('http://localhost:3000/api/pacientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: '', // nombre vacío (inválido)
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('crea paciente con datos válidos', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      const mockCreatedPaciente = {
        id: 'pac-new-123',
        numeroHistoria: 'NH003',
        nombre: 'Pedro',
        apellidos: 'López',
        estado: 'activo',
      }

      vi.mocked(createPaciente).mockResolvedValue(mockCreatedPaciente as any)

      const validPaciente = {
        nombre: 'Pedro',
        apellidos: 'López',
        genero: 'masculino',
        documentoId: '12345678A',
        fechaNacimiento: '1990-05-15',
        telefono: '666555444',
        email: 'pedro@example.com',
        direccion: 'Calle Test 123',
        estado: 'activo',
      }

      const request = new NextRequest('http://localhost:3000/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPaciente),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('pac-new-123')
      expect(data.nombre).toBe('Pedro')
      expect(createPaciente).toHaveBeenCalled()
    })

    it('maneja errores en creación de paciente', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'admin@test.com',
        roles: ['admin'],
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser as any)

      vi.mocked(createPaciente).mockRejectedValue(
        new Error('Error al crear paciente en Firebase')
      )

      const validPaciente = {
        nombre: 'Pedro',
        apellidos: 'López',
        genero: 'masculino',
        documentoId: '12345678A',
        fechaNacimiento: '1990-05-15',
        telefono: '666555444',
        email: 'pedro@example.com',
        direccion: 'Calle Test 123',
        estado: 'activo',
      }

      const request = new NextRequest('http://localhost:3000/api/pacientes', {
        method: 'POST',
        body: JSON.stringify(validPaciente),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Error')
    })
  })
})
