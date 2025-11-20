import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { validateSearchParams, commonSchemas } from '@/lib/utils/apiValidation'

describe('validateSearchParams', () => {
  it('valida params correctos', () => {
    const schema = z.object({
      page: z.string(),
      limit: z.string(),
    })

    const params = new URLSearchParams('page=1&limit=20')
    const result = validateSearchParams(params, schema)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe('1')
      expect(result.data.limit).toBe('20')
    }
  })

  it('falla con params faltantes', () => {
    const schema = z.object({
      required: z.string().min(1),
    })

    const params = new URLSearchParams('')
    const result = validateSearchParams(params, schema)

    expect(result.success).toBe(false)
  })

  it('convierte números con coerce', () => {
    const schema = z.object({
      count: z.coerce.number(),
    })

    const params = new URLSearchParams('count=42')
    const result = validateSearchParams(params, schema)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.count).toBe(42)
    }
  })
})

describe('commonSchemas', () => {
  describe('id', () => {
    it('valida ID válido', () => {
      const result = commonSchemas.id.safeParse('abc123')
      expect(result.success).toBe(true)
    })

    it('rechaza string vacío', () => {
      const result = commonSchemas.id.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  describe('email', () => {
    it('valida email válido', () => {
      const result = commonSchemas.email.safeParse('test@example.com')
      expect(result.success).toBe(true)
    })

    it('rechaza email inválido', () => {
      const result = commonSchemas.email.safeParse('not-an-email')
      expect(result.success).toBe(false)
    })

    it('rechaza string vacío', () => {
      const result = commonSchemas.email.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  describe('pagination', () => {
    it('usa valores por defecto', () => {
      const result = commonSchemas.pagination.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('acepta valores personalizados', () => {
      const result = commonSchemas.pagination.safeParse({ page: '2', limit: '50' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(2)
        expect(result.data.limit).toBe(50)
      }
    })

    it('rechaza page menor a 1', () => {
      const result = commonSchemas.pagination.safeParse({ page: '0' })
      expect(result.success).toBe(false)
    })

    it('rechaza limit mayor a 100', () => {
      const result = commonSchemas.pagination.safeParse({ limit: '101' })
      expect(result.success).toBe(false)
    })
  })

  describe('dateRange', () => {
    it('acepta objeto vacío', () => {
      const result = commonSchemas.dateRange.safeParse({})
      expect(result.success).toBe(true)
    })

    it('acepta fechas ISO válidas', () => {
      const result = commonSchemas.dateRange.safeParse({
        from: '2024-01-01T00:00:00.000Z',
        to: '2024-12-31T23:59:59.000Z',
      })
      expect(result.success).toBe(true)
    })
  })
})
