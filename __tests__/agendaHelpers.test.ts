import { describe, it, expect } from 'vitest'
import {
  generateTimeSlots,
  calculateEventPosition,
  detectConflicts,
  formatDuration,
  formatTime,
  getEventsForDay,
  isWithinWorkingHours,
  roundToNearestSlot,
  calculateFreeSlots,
  calculateOccupancyRate,
  AGENDA_CONFIG,
  AgendaEvent,
} from '@/components/agenda/v2/agendaHelpers'

// Helper para crear eventos de prueba
function createTestEvent(overrides: Partial<AgendaEvent> = {}): AgendaEvent {
  return {
    id: 'test-id',
    titulo: 'Test Event',
    fechaInicio: new Date('2024-01-15T09:00:00'),
    fechaFin: new Date('2024-01-15T10:00:00'),
    estado: 'confirmada',
    tipo: 'consulta',
    profesionalId: 'test-prof-id', // REQUERIDO
    ...overrides,
  }
}

describe('generateTimeSlots', () => {
  it('genera slots correctamente', () => {
    const slots = generateTimeSlots()

    // Primer slot
    expect(slots[0]).toEqual({
      hour: AGENDA_CONFIG.START_HOUR,
      minute: 0,
      time: '07:00',
    })

    // Último slot
    const lastSlot = slots[slots.length - 1]
    expect(lastSlot.hour).toBe(AGENDA_CONFIG.END_HOUR)
  })

  it('genera slots cada 15 minutos', () => {
    const slots = generateTimeSlots()
    const slotsPerHour = 60 / AGENDA_CONFIG.SLOT_DURATION
    const hoursInDay = AGENDA_CONFIG.END_HOUR - AGENDA_CONFIG.START_HOUR + 1

    expect(slots.length).toBe(hoursInDay * slotsPerHour)
  })
})

describe('calculateEventPosition', () => {
  it('calcula posición correcta para evento a las 9:00', () => {
    const event = createTestEvent({
      fechaInicio: new Date('2024-01-15T09:00:00'),
      fechaFin: new Date('2024-01-15T10:00:00'),
    })

    const position = calculateEventPosition(event)

    // 9:00 - 7:00 = 2 horas * 80px = 160px
    expect(position.top).toBe(160)
    // 1 hora * 80px = 80px
    expect(position.height).toBe(80)
  })

  it('aplica altura mínima de 40px', () => {
    const event = createTestEvent({
      fechaInicio: new Date('2024-01-15T09:00:00'),
      fechaFin: new Date('2024-01-15T09:15:00'),
    })

    const position = calculateEventPosition(event)

    // 15 min = 20px pero mínimo es 40px
    expect(position.height).toBe(40)
  })
})

describe('detectConflicts', () => {
  it('detecta overlap simple', () => {
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        fechaInicio: new Date('2024-01-15T09:30:00'),
        fechaFin: new Date('2024-01-15T10:30:00'),
      }),
    ]

    const conflicts = detectConflicts(events)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].type).toBe('overlap')
    expect(conflicts[0].severity).toBe('warning')
  })

  it('detecta double-booking del mismo profesional', () => {
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        profesionalId: 'prof-1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        profesionalId: 'prof-1',
        fechaInicio: new Date('2024-01-15T09:30:00'),
        fechaFin: new Date('2024-01-15T10:30:00'),
      }),
    ]

    const conflicts = detectConflicts(events)

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].type).toBe('double-booking')
    expect(conflicts[0].severity).toBe('error')
  })

  it('no detecta conflicto si eventos no se solapan', () => {
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        fechaInicio: new Date('2024-01-15T10:00:00'),
        fechaFin: new Date('2024-01-15T11:00:00'),
      }),
    ]

    const conflicts = detectConflicts(events)

    expect(conflicts).toHaveLength(0)
  })

  it('no detecta conflicto en días diferentes', () => {
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        fechaInicio: new Date('2024-01-16T09:00:00'),
        fechaFin: new Date('2024-01-16T10:00:00'),
      }),
    ]

    const conflicts = detectConflicts(events)

    expect(conflicts).toHaveLength(0)
  })
})

describe('formatDuration', () => {
  it('formatea minutos correctamente', () => {
    const start = new Date('2024-01-15T09:00:00')
    const end = new Date('2024-01-15T09:45:00')

    expect(formatDuration(start, end)).toBe('45min')
  })

  it('formatea horas completas', () => {
    const start = new Date('2024-01-15T09:00:00')
    const end = new Date('2024-01-15T11:00:00')

    expect(formatDuration(start, end)).toBe('2h')
  })

  it('formatea horas y minutos', () => {
    const start = new Date('2024-01-15T09:00:00')
    const end = new Date('2024-01-15T10:30:00')

    expect(formatDuration(start, end)).toBe('1h 30min')
  })
})

describe('formatTime', () => {
  it('formatea hora correctamente', () => {
    const date = new Date('2024-01-15T09:30:00')
    expect(formatTime(date)).toBe('09:30')
  })

  it('formatea medianoche correctamente', () => {
    const date = new Date('2024-01-15T00:00:00')
    expect(formatTime(date)).toBe('00:00')
  })
})

describe('getEventsForDay', () => {
  it('filtra eventos del día correcto', () => {
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        fechaInicio: new Date('2024-01-16T09:00:00'),
        fechaFin: new Date('2024-01-16T10:00:00'),
      }),
    ]

    const day = new Date('2024-01-15')
    const result = getEventsForDay(events, day)

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
})

describe('isWithinWorkingHours', () => {
  it('retorna true para horas laborales', () => {
    expect(isWithinWorkingHours(9)).toBe(true)
    expect(isWithinWorkingHours(14)).toBe(true)
    expect(isWithinWorkingHours(7)).toBe(true)
  })

  it('retorna false fuera de horario', () => {
    expect(isWithinWorkingHours(6)).toBe(false)
    expect(isWithinWorkingHours(21)).toBe(false)
    expect(isWithinWorkingHours(23)).toBe(false)
  })
})

describe('roundToNearestSlot', () => {
  it('redondea al slot más cercano', () => {
    const date = new Date('2024-01-15T09:07:30')
    const rounded = roundToNearestSlot(date)

    expect(rounded.getMinutes()).toBe(0)
    expect(rounded.getSeconds()).toBe(0)
    expect(rounded.getMilliseconds()).toBe(0)
  })

  it('redondea hacia arriba cuando corresponde', () => {
    const date = new Date('2024-01-15T09:08:00')
    const rounded = roundToNearestSlot(date)

    expect(rounded.getMinutes()).toBe(15)
  })

  it('mantiene la hora si ya está en slot', () => {
    const date = new Date('2024-01-15T09:30:00')
    const rounded = roundToNearestSlot(date)

    expect(rounded.getMinutes()).toBe(30)
  })
})

describe('calculateFreeSlots', () => {
  it('calcula huecos libres correctamente', () => {
    const day = new Date('2024-01-15')
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
    ]

    const freeSlots = calculateFreeSlots(events, day)

    // Debería haber hueco de 7:00-9:00 y 10:00-21:00
    expect(freeSlots).toHaveLength(2)
    expect(freeSlots[0].start.getHours()).toBe(7)
    expect(freeSlots[0].end.getHours()).toBe(9)
  })

  it('filtra por profesional', () => {
    const day = new Date('2024-01-15')
    const events: AgendaEvent[] = [
      createTestEvent({
        id: '1',
        profesionalId: 'prof-1',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
      createTestEvent({
        id: '2',
        profesionalId: 'prof-2',
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T11:00:00'),
      }),
    ]

    const freeSlots = calculateFreeSlots(events, day, 'prof-1')

    // Solo considera eventos del prof-1
    expect(freeSlots[1].start.getHours()).toBe(10)
  })
})

describe('calculateOccupancyRate', () => {
  it('calcula tasa de ocupación correctamente', () => {
    const day = new Date('2024-01-15')
    const events: AgendaEvent[] = [
      createTestEvent({
        fechaInicio: new Date('2024-01-15T09:00:00'),
        fechaFin: new Date('2024-01-15T10:00:00'),
      }),
    ]

    const rate = calculateOccupancyRate(events, day)

    // 1 hora de 14 horas totales (7-21) = ~7%
    expect(rate).toBeGreaterThan(0)
    expect(rate).toBeLessThan(10)
  })

  it('retorna 0 para día sin eventos', () => {
    const day = new Date('2024-01-15')
    const events: AgendaEvent[] = []

    const rate = calculateOccupancyRate(events, day)

    expect(rate).toBe(0)
  })
})
