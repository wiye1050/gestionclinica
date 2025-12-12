import { describe, it, expect } from 'vitest'
import {
  formatDateShort,
  formatDateLong,
  formatDateTime,
  formatTime,
  formatTimeRange,
  formatDuration,
  formatRelativeDate,
  formatRelativeWithTime,
  safeFormatDate,
  formatDateForInput,
  formatDateTimeForInput,
} from '@/lib/utils/dateFormatters'

describe('dateFormatters', () => {
  const testDate = new Date('2024-03-15T14:30:00')
  const testDate2 = new Date('2024-03-15T16:45:00')

  describe('formatDateShort', () => {
    it('formatea fecha en formato corto', () => {
      const result = formatDateShort(testDate)
      expect(result).toContain('15')
      expect(result).toContain('mar')
      expect(result).toContain('2024')
    })

    it('maneja strings de fecha', () => {
      const result = formatDateShort('2024-03-15')
      expect(result).toContain('15')
      expect(result).toContain('mar')
    })

    it('retorna "Sin fecha" para null', () => {
      expect(formatDateShort(null)).toBe('Sin fecha')
    })

    it('retorna "Sin fecha" para undefined', () => {
      expect(formatDateShort(undefined)).toBe('Sin fecha')
    })
  })

  describe('formatDateLong', () => {
    it('formatea fecha en formato largo', () => {
      const result = formatDateLong(testDate)
      expect(result).toContain('15')
      expect(result).toContain('marzo')
      expect(result).toContain('2024')
      expect(result).toContain('de')
    })

    it('retorna "Sin fecha" para null', () => {
      expect(formatDateLong(null)).toBe('Sin fecha')
    })

    it('maneja strings de fecha', () => {
      const result = formatDateLong('2024-03-15T10:00:00')
      expect(result).toContain('15')
      expect(result).toContain('de')
    })
  })

  describe('formatDateTime', () => {
    it('formatea fecha y hora', () => {
      const result = formatDateTime(testDate)
      expect(result).toContain('15')
      expect(result).toContain('mar')
      expect(result).toContain('2024')
      expect(result).toContain('14:30')
    })

    it('retorna "Sin fecha" para valores nulos', () => {
      expect(formatDateTime(null)).toBe('Sin fecha')
    })

    it('maneja strings de fecha', () => {
      const result = formatDateTime('2024-03-15T14:30:00')
      expect(result).toContain('14:30')
    })
  })

  describe('formatTime', () => {
    it('formatea solo la hora', () => {
      expect(formatTime(testDate)).toBe('14:30')
    })

    it('formatea medianoche correctamente', () => {
      const midnight = new Date('2024-03-15T00:00:00')
      expect(formatTime(midnight)).toBe('00:00')
    })

    it('retorna string vacío para null', () => {
      expect(formatTime(null)).toBe('')
    })

    it('maneja strings de fecha', () => {
      expect(formatTime('2024-03-15T14:30:00')).toBe('14:30')
    })
  })

  describe('formatTimeRange', () => {
    it('formatea rango de horas', () => {
      expect(formatTimeRange(testDate, testDate2)).toBe('14:30 - 16:45')
    })

    it('maneja strings de fecha', () => {
      const result = formatTimeRange('2024-03-15T14:30:00', '2024-03-15T16:45:00')
      expect(result).toBe('14:30 - 16:45')
    })

    it('formatea correctamente con horas exactas', () => {
      const start = new Date('2024-03-15T10:00:00')
      const end = new Date('2024-03-15T12:00:00')
      expect(formatTimeRange(start, end)).toBe('10:00 - 12:00')
    })
  })

  describe('formatDuration', () => {
    it('formatea duración en minutos cuando < 60', () => {
      const start = new Date('2024-03-15T10:00:00')
      const end = new Date('2024-03-15T10:45:00')
      expect(formatDuration(start, end)).toBe('45min')
    })

    it('formatea duración en horas y minutos', () => {
      const start = new Date('2024-03-15T10:00:00')
      const end = new Date('2024-03-15T12:30:00')
      expect(formatDuration(start, end)).toBe('2h 30min')
    })

    it('formatea duración en horas exactas', () => {
      const start = new Date('2024-03-15T10:00:00')
      const end = new Date('2024-03-15T12:00:00')
      expect(formatDuration(start, end)).toBe('2h')
    })

    it('maneja strings de fecha', () => {
      const result = formatDuration('2024-03-15T10:00:00', '2024-03-15T11:30:00')
      expect(result).toBe('1h 30min')
    })

    it('formatea 0 minutos correctamente', () => {
      expect(formatDuration(testDate, testDate)).toBe('0min')
    })
  })

  describe('formatRelativeDate', () => {
    it('formatea fecha relativa con sufijo', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const result = formatRelativeDate(yesterday)
      expect(result).toContain('hace')
      expect(result).toBeTruthy()
    })

    it('retorna "Sin fecha" para null', () => {
      expect(formatRelativeDate(null)).toBe('Sin fecha')
    })

    it('maneja strings de fecha', () => {
      const past = new Date()
      past.setHours(past.getHours() - 3)
      const result = formatRelativeDate(past.toISOString())
      expect(result).toBeTruthy()
    })
  })

  describe('formatRelativeWithTime', () => {
    it('formatea fecha relativa con contexto', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(14, 30, 0, 0)
      const result = formatRelativeWithTime(yesterday)
      expect(result).toBeTruthy()
    })

    it('retorna "Sin fecha" para null', () => {
      expect(formatRelativeWithTime(null)).toBe('Sin fecha')
    })

    it('maneja strings de fecha', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const result = formatRelativeWithTime(tomorrow.toISOString())
      expect(result).toBeTruthy()
    })
  })

  describe('safeFormatDate', () => {
    it('formatea fecha con formato custom', () => {
      const result = safeFormatDate(testDate, 'dd/MM/yyyy')
      expect(result).toBe('15/03/2024')
    })

    it('usa formato por defecto si no se especifica', () => {
      const result = safeFormatDate(testDate)
      expect(result).toContain('15')
      expect(result).toContain('mar')
    })

    it('retorna fallback custom para null', () => {
      expect(safeFormatDate(null, undefined, 'N/A')).toBe('N/A')
    })

    it('retorna fallback por defecto "Sin fecha"', () => {
      expect(safeFormatDate(null)).toBe('Sin fecha')
    })

    it('maneja strings de fecha válidos', () => {
      const result = safeFormatDate('2024-03-15', 'dd/MM/yyyy')
      expect(result).toBe('15/03/2024')
    })
  })

  describe('formatDateForInput', () => {
    it('formatea para input type="date"', () => {
      expect(formatDateForInput(testDate)).toBe('2024-03-15')
    })

    it('retorna string vacío para null', () => {
      expect(formatDateForInput(null)).toBe('')
    })

    it('retorna string vacío para undefined', () => {
      expect(formatDateForInput(undefined)).toBe('')
    })

    it('maneja strings de fecha', () => {
      expect(formatDateForInput('2024-03-15T10:00:00')).toBe('2024-03-15')
    })
  })

  describe('formatDateTimeForInput', () => {
    it('formatea para input type="datetime-local"', () => {
      expect(formatDateTimeForInput(testDate)).toBe('2024-03-15T14:30')
    })

    it('retorna string vacío para null', () => {
      expect(formatDateTimeForInput(null)).toBe('')
    })

    it('retorna string vacío para undefined', () => {
      expect(formatDateTimeForInput(undefined)).toBe('')
    })

    it('maneja strings de fecha', () => {
      expect(formatDateTimeForInput('2024-03-15T14:30:00')).toBe('2024-03-15T14:30')
    })

    it('formatea medianoche correctamente', () => {
      const midnight = new Date('2024-03-15T00:00:00')
      expect(formatDateTimeForInput(midnight)).toBe('2024-03-15T00:00')
    })
  })
})
