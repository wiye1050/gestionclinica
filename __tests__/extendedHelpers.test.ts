import { describe, it, expect } from 'vitest'
import {
  // Number formatting
  formatNumber,
  formatPercent,
  formatCompactNumber,
  roundToDecimals,
  // Math
  clamp,
  calculateAverage,
  calculateMedian,
  // Array manipulation
  groupBy,
  sortByKey,
  uniqueBy,
  chunk,
  // Strings
  capitalize,
  truncate,
  getInitials,
} from '@/lib/utils/helpers'

// ============================================
// FORMATEO DE NÚMEROS
// ============================================

describe('formatNumber', () => {
  it('formatea número con separadores de miles', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })

  it('formatea con decimales especificados', () => {
    expect(formatNumber(1234.5678, 2)).toBe('1234,57')
  })

  it('formatea sin decimales por defecto', () => {
    expect(formatNumber(1234.999)).toBe('1235')
  })

  it('maneja cero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('maneja números negativos', () => {
    expect(formatNumber(-5000)).toBe('-5000')
  })

  it('formatea números pequeños', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('maneja decimales fijos', () => {
    expect(formatNumber(10, 3)).toBe('10,000')
  })
})

describe('formatPercent', () => {
  it('formatea porcentaje con 1 decimal por defecto', () => {
    const result = formatPercent(0.156)
    expect(result).toContain('15,6')
    expect(result).toContain('%')
  })

  it('formatea con decimales especificados', () => {
    const result = formatPercent(0.12345, 2)
    expect(result).toContain('12,35')
    expect(result).toContain('%')
  })

  it('maneja 100%', () => {
    const result = formatPercent(1)
    expect(result).toContain('100,0')
    expect(result).toContain('%')
  })

  it('maneja 0%', () => {
    const result = formatPercent(0)
    expect(result).toContain('0,0')
    expect(result).toContain('%')
  })

  it('formatea decimales sin redondeo incorrecto', () => {
    const result = formatPercent(0.333, 1)
    expect(result).toContain('33,3')
    expect(result).toContain('%')
  })

  it('formatea valores mayores a 100%', () => {
    const result = formatPercent(1.5, 0)
    expect(result).toContain('150')
    expect(result).toContain('%')
  })
})

describe('formatCompactNumber', () => {
  it('formatea miles con K', () => {
    const result = formatCompactNumber(1500)
    expect(result).toMatch(/1[.,]5\s?mil/)
  })

  it('formatea millones con M', () => {
    const result = formatCompactNumber(3500000)
    expect(result).toMatch(/3[.,]5\s?M/)
  })

  it('deja números pequeños sin modificar', () => {
    expect(formatCompactNumber(999)).toBe('999')
  })

  it('formatea miles exactos', () => {
    const result = formatCompactNumber(5000)
    expect(result).toMatch(/5\s?mil/)
  })

  it('formatea millones exactos', () => {
    const result = formatCompactNumber(2000000)
    expect(result).toMatch(/2\s?M/)
  })
})

describe('roundToDecimals', () => {
  it('redondea a decimales especificados', () => {
    expect(roundToDecimals(3.14159, 2)).toBe(3.14)
  })

  it('redondea hacia arriba correctamente', () => {
    expect(roundToDecimals(2.556, 2)).toBe(2.56)
  })

  it('redondea hacia abajo correctamente', () => {
    expect(roundToDecimals(2.554, 2)).toBe(2.55)
  })

  it('maneja 0 decimales', () => {
    expect(roundToDecimals(3.7, 0)).toBe(4)
  })

  it('maneja números negativos', () => {
    expect(roundToDecimals(-2.556, 2)).toBe(-2.56)
  })

  it('maneja redondeo a más decimales que los originales', () => {
    expect(roundToDecimals(3.1, 5)).toBe(3.1)
  })
})

// ============================================
// MATEMÁTICAS
// ============================================

describe('clamp', () => {
  it('limita valor por encima del máximo', () => {
    expect(clamp(150, 0, 100)).toBe(100)
  })

  it('limita valor por debajo del mínimo', () => {
    expect(clamp(-10, 0, 100)).toBe(0)
  })

  it('mantiene valor dentro del rango', () => {
    expect(clamp(50, 0, 100)).toBe(50)
  })

  it('maneja límites iguales', () => {
    expect(clamp(10, 5, 5)).toBe(5)
  })

  it('maneja valores en el límite inferior', () => {
    expect(clamp(0, 0, 100)).toBe(0)
  })

  it('maneja valores en el límite superior', () => {
    expect(clamp(100, 0, 100)).toBe(100)
  })

  it('maneja números negativos en rango', () => {
    expect(clamp(-5, -10, 10)).toBe(-5)
  })
})

describe('calculateAverage', () => {
  it('calcula promedio de números positivos', () => {
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
  })

  it('calcula promedio con decimales', () => {
    expect(calculateAverage([1, 2, 3])).toBe(2)
  })

  it('retorna 0 para array vacío', () => {
    expect(calculateAverage([])).toBe(0)
  })

  it('maneja un solo elemento', () => {
    expect(calculateAverage([42])).toBe(42)
  })

  it('maneja números negativos', () => {
    expect(calculateAverage([-5, -10, -15])).toBe(-10)
  })

  it('maneja mezcla de positivos y negativos', () => {
    expect(calculateAverage([10, -10, 20, -20])).toBe(0)
  })

  it('maneja decimales en entrada', () => {
    expect(calculateAverage([1.5, 2.5, 3.5])).toBe(2.5)
  })
})

describe('calculateMedian', () => {
  it('calcula mediana de array impar', () => {
    expect(calculateMedian([1, 3, 5])).toBe(3)
  })

  it('calcula mediana de array par', () => {
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5)
  })

  it('retorna 0 para array vacío', () => {
    expect(calculateMedian([])).toBe(0)
  })

  it('maneja un solo elemento', () => {
    expect(calculateMedian([42])).toBe(42)
  })

  it('ordena elementos antes de calcular', () => {
    expect(calculateMedian([5, 1, 3, 2, 4])).toBe(3)
  })

  it('maneja números negativos', () => {
    expect(calculateMedian([-5, -1, -3])).toBe(-3)
  })

  it('maneja array desordenado par', () => {
    expect(calculateMedian([10, 1, 5, 2])).toBe(3.5)
  })
})

// ============================================
// MANIPULACIÓN DE ARRAYS
// ============================================

describe('groupBy', () => {
  it('agrupa objetos por clave', () => {
    const items = [
      { id: 1, category: 'A' },
      { id: 2, category: 'B' },
      { id: 3, category: 'A' },
    ]
    const result = groupBy(items, 'category')
    expect(result['A']).toHaveLength(2)
    expect(result['B']).toHaveLength(1)
  })

  it('maneja array vacío', () => {
    const result = groupBy([], 'key')
    expect(result).toEqual({})
  })

  it('maneja todos elementos en mismo grupo', () => {
    const items = [
      { id: 1, type: 'same' },
      { id: 2, type: 'same' },
    ]
    const result = groupBy(items, 'type')
    expect(Object.keys(result)).toHaveLength(1)
    expect(result['same']).toHaveLength(2)
  })

  it('convierte valores a string para claves', () => {
    const items = [
      { id: 1, count: 1 },
      { id: 2, count: 2 },
      { id: 3, count: 1 },
    ]
    const result = groupBy(items, 'count')
    expect(result['1']).toHaveLength(2)
    expect(result['2']).toHaveLength(1)
  })
})

describe('sortByKey', () => {
  it('ordena ascendente por defecto', () => {
    const items = [
      { id: 3, name: 'C' },
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    const result = sortByKey(items, 'id')
    expect(result.map(i => i.id)).toEqual([1, 2, 3])
  })

  it('ordena descendente cuando se especifica', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 3, name: 'C' },
      { id: 2, name: 'B' },
    ]
    const result = sortByKey(items, 'id', 'desc')
    expect(result.map(i => i.id)).toEqual([3, 2, 1])
  })

  it('ordena strings alfabéticamente', () => {
    const items = [
      { id: 1, name: 'Charlie' },
      { id: 2, name: 'Alice' },
      { id: 3, name: 'Bob' },
    ]
    const result = sortByKey(items, 'name')
    expect(result.map(i => i.name)).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('no modifica el array original', () => {
    const items = [{ id: 2 }, { id: 1 }]
    const original = [...items]
    sortByKey(items, 'id')
    expect(items).toEqual(original)
  })

  it('maneja array vacío', () => {
    const result = sortByKey([], 'key')
    expect(result).toEqual([])
  })
})

describe('uniqueBy', () => {
  it('elimina duplicados por clave', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
      { id: 1, name: 'C' },
    ]
    const result = uniqueBy(items, 'id')
    expect(result).toHaveLength(2)
    expect(result.map(i => i.id)).toEqual([1, 2])
  })

  it('mantiene el primer elemento duplicado', () => {
    const items = [
      { id: 1, name: 'First' },
      { id: 1, name: 'Second' },
    ]
    const result = uniqueBy(items, 'id')
    expect(result[0].name).toBe('First')
  })

  it('maneja array sin duplicados', () => {
    const items = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    const result = uniqueBy(items, 'id')
    expect(result).toHaveLength(2)
  })

  it('maneja array vacío', () => {
    const result = uniqueBy([], 'key')
    expect(result).toEqual([])
  })

  it('funciona con strings como clave', () => {
    const items = [
      { name: 'Alice', role: 'admin' },
      { name: 'Bob', role: 'user' },
      { name: 'Alice', role: 'user' },
    ]
    const result = uniqueBy(items, 'name')
    expect(result).toHaveLength(2)
  })
})

describe('chunk', () => {
  it('divide array en chunks del tamaño especificado', () => {
    const result = chunk([1, 2, 3, 4, 5, 6], 2)
    expect(result).toEqual([[1, 2], [3, 4], [5, 6]])
  })

  it('maneja último chunk más pequeño', () => {
    const result = chunk([1, 2, 3, 4, 5], 2)
    expect(result).toEqual([[1, 2], [3, 4], [5]])
  })

  it('maneja tamaño mayor al array', () => {
    const result = chunk([1, 2], 5)
    expect(result).toEqual([[1, 2]])
  })

  it('maneja array vacío', () => {
    const result = chunk([], 3)
    expect(result).toEqual([])
  })

  it('maneja tamaño 1', () => {
    const result = chunk([1, 2, 3], 1)
    expect(result).toEqual([[1], [2], [3]])
  })

  it('maneja arrays de objetos', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const result = chunk(items, 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toHaveLength(2)
    expect(result[1]).toHaveLength(1)
  })
})

// ============================================
// STRINGS
// ============================================

describe('capitalize', () => {
  it('capitaliza primera letra y minúsculas el resto', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('convierte mayúsculas a minúsculas excepto primera', () => {
    expect(capitalize('WORLD')).toBe('World')
  })

  it('maneja string ya capitalizado', () => {
    expect(capitalize('Test')).toBe('Test')
  })

  it('maneja una sola letra', () => {
    expect(capitalize('a')).toBe('A')
  })

  it('maneja string vacío', () => {
    expect(capitalize('')).toBe('')
  })

  it('mantiene espacios y caracteres especiales', () => {
    expect(capitalize('hello world')).toBe('Hello world')
  })

  it('maneja texto con números', () => {
    expect(capitalize('123abc')).toBe('123abc')
  })
})

describe('truncate', () => {
  it('trunca string más largo que maxLength', () => {
    expect(truncate('Hello World', 8)).toBe('Hello...')
  })

  it('no trunca string más corto que maxLength', () => {
    expect(truncate('Hi', 10)).toBe('Hi')
  })

  it('no trunca string exactamente de maxLength', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('maneja maxLength muy pequeño', () => {
    expect(truncate('Hello', 3)).toBe('...')
  })

  it('maneja string vacío', () => {
    expect(truncate('', 10)).toBe('')
  })

  it('incluye los 3 puntos en el conteo', () => {
    const result = truncate('1234567890', 7)
    expect(result).toHaveLength(7)
    expect(result).toBe('1234...')
  })
})

describe('getInitials', () => {
  it('genera iniciales de nombre completo', () => {
    expect(getInitials('Juan Pérez')).toBe('JP')
  })

  it('maneja un solo nombre', () => {
    expect(getInitials('María')).toBe('M')
  })

  it('toma solo primeras dos iniciales', () => {
    expect(getInitials('Juan Carlos Pérez García')).toBe('JC')
  })

  it('convierte a mayúsculas', () => {
    expect(getInitials('ana lópez')).toBe('AL')
  })

  it('maneja múltiples espacios', () => {
    expect(getInitials('Juan  Pérez')).toBe('JP')
  })

  it('maneja nombres con caracteres especiales', () => {
    expect(getInitials('María José')).toBe('MJ')
  })

  it('maneja nombres con una letra', () => {
    expect(getInitials('A B')).toBe('AB')
  })
})
