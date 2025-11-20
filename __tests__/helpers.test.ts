import { describe, it, expect } from 'vitest'
import {
  cn,
  formatDate,
  formatDateTime,
  formatCurrency,
  calculatePercentage,
} from '@/lib/utils/helpers'

describe('cn (className utility)', () => {
  it('combina clases simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('maneja condicionales', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active')
  })

  it('merge clases de Tailwind conflictivas', () => {
    // twMerge debe resolver conflictos
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('maneja arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('ignora valores falsy', () => {
    expect(cn('foo', null, undefined, '', 'bar')).toBe('foo bar')
  })
})

describe('formatDate', () => {
  it('formatea Date object', () => {
    const date = new Date('2024-01-15T10:30:00')
    const result = formatDate(date)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/01/)
    expect(result).toMatch(/2024/)
  })

  it('formatea string ISO', () => {
    const result = formatDate('2024-12-25')
    expect(result).toMatch(/25/)
    expect(result).toMatch(/12/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatDateTime', () => {
  it('incluye hora y minutos', () => {
    const date = new Date('2024-01-15T14:30:00')
    const result = formatDateTime(date)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/14/)
    expect(result).toMatch(/30/)
  })

  it('formatea string ISO con hora', () => {
    const result = formatDateTime('2024-06-20T09:15:00')
    expect(result).toMatch(/20/)
    expect(result).toMatch(/06/)
    expect(result).toMatch(/09/)
    expect(result).toMatch(/15/)
  })
})

describe('formatCurrency', () => {
  it('formatea números positivos', () => {
    const result = formatCurrency(1234.56)
    // El formato puede variar según el locale del entorno
    expect(result).toMatch(/1\.?234,56/)
    expect(result).toContain('€')
  })

  it('formatea cero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('formatea números negativos', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
    expect(result).toContain('€')
  })

  it('redondea decimales', () => {
    const result = formatCurrency(10.999)
    expect(result).toContain('11')
  })
})

describe('calculatePercentage', () => {
  it('calcula porcentaje correctamente', () => {
    expect(calculatePercentage(25, 100)).toBe(25)
    expect(calculatePercentage(1, 4)).toBe(25)
    expect(calculatePercentage(3, 10)).toBe(30)
  })

  it('retorna 0 cuando total es 0', () => {
    expect(calculatePercentage(10, 0)).toBe(0)
  })

  it('redondea al entero más cercano', () => {
    expect(calculatePercentage(1, 3)).toBe(33)
    expect(calculatePercentage(2, 3)).toBe(67)
  })

  it('maneja 100%', () => {
    expect(calculatePercentage(50, 50)).toBe(100)
  })

  it('maneja valores mayores al total', () => {
    expect(calculatePercentage(150, 100)).toBe(150)
  })
})
