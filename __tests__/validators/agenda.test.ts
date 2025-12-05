import { describe, it, expect } from 'vitest';
import {
  tipoEventoSchema,
  estadoEventoSchema,
  createEventoAgendaSchema,
  updateEventoAgendaSchema,
  consultarDisponibilidadSchema,
} from '@/lib/validators/agenda';

describe('Agenda Validators', () => {
  describe('tipoEventoSchema', () => {
    it('should accept all valid tipos', () => {
      const validTipos = [
        'consulta',
        'seguimiento',
        'revision',
        'tratamiento',
        'urgencia',
        'administrativo',
      ];
      validTipos.forEach(tipo => {
        expect(() => tipoEventoSchema.parse(tipo)).not.toThrow();
      });
    });

    it('should reject invalid tipos', () => {
      expect(() => tipoEventoSchema.parse('cita')).toThrow();
      expect(() => tipoEventoSchema.parse('procedimiento')).toThrow();
      expect(() => tipoEventoSchema.parse('')).toThrow();
    });
  });

  describe('estadoEventoSchema', () => {
    it('should accept all valid estados', () => {
      const validEstados = ['programada', 'confirmada', 'realizada', 'cancelada'];
      validEstados.forEach(estado => {
        expect(() => estadoEventoSchema.parse(estado)).not.toThrow();
      });
    });

    it('should reject invalid estados', () => {
      expect(() => estadoEventoSchema.parse('pendiente')).toThrow();
      expect(() => estadoEventoSchema.parse('en-proceso')).toThrow();
      expect(() => estadoEventoSchema.parse('')).toThrow();
    });
  });

  describe('createEventoAgendaSchema', () => {
    const validEvento = {
      titulo: 'Consulta médica',
      tipo: 'consulta' as const,
      pacienteId: 'pac-123',
      profesionalId: 'prof-456',
      salaId: 'sala-1',
      servicioId: 'serv-789',
      fechaInicio: '2025-01-15T10:00:00Z',
      fechaFin: '2025-01-15T11:00:00Z',
      estado: 'programada' as const,
      prioridad: 'media' as const,
      notas: 'Paciente con historial de alergias',
      requiereSeguimiento: true,
    };

    it('should accept valid evento data', () => {
      expect(() => createEventoAgendaSchema.parse(validEvento)).not.toThrow();
    });

    it('should accept minimal required fields', () => {
      const minimalEvento = {
        titulo: 'Consulta',
        profesionalId: 'prof-123',
        fechaInicio: '2025-01-15T10:00:00Z',
        fechaFin: '2025-01-15T11:00:00Z',
      };
      expect(() => createEventoAgendaSchema.parse(minimalEvento)).not.toThrow();
    });

    it('should default tipo to consulta', () => {
      const result = createEventoAgendaSchema.parse({
        titulo: 'Consulta',
        profesionalId: 'prof-123',
        fechaInicio: '2025-01-15T10:00:00Z',
        fechaFin: '2025-01-15T11:00:00Z',
      });
      expect(result.tipo).toBe('consulta');
    });

    it('should default estado to programada', () => {
      const result = createEventoAgendaSchema.parse({
        titulo: 'Consulta',
        profesionalId: 'prof-123',
        fechaInicio: '2025-01-15T10:00:00Z',
        fechaFin: '2025-01-15T11:00:00Z',
      });
      expect(result.estado).toBe('programada');
    });

    it('should default prioridad to media', () => {
      const result = createEventoAgendaSchema.parse({
        titulo: 'Consulta',
        profesionalId: 'prof-123',
        fechaInicio: '2025-01-15T10:00:00Z',
        fechaFin: '2025-01-15T11:00:00Z',
      });
      expect(result.prioridad).toBe('media');
    });

    it('should default requiereSeguimiento to false', () => {
      const result = createEventoAgendaSchema.parse({
        titulo: 'Consulta',
        profesionalId: 'prof-123',
        fechaInicio: '2025-01-15T10:00:00Z',
        fechaFin: '2025-01-15T11:00:00Z',
      });
      expect(result.requiereSeguimiento).toBe(false);
    });

    it('should reject missing titulo', () => {
      const { titulo, ...withoutTitulo } = validEvento;
      expect(() => createEventoAgendaSchema.parse(withoutTitulo)).toThrow();
    });

    it('should reject empty titulo', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, titulo: '' })
      ).toThrow('El título es requerido');
    });

    it('should reject too long titulo', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, titulo: 'A'.repeat(201) })
      ).toThrow('Título muy largo');
    });

    it('should reject missing profesionalId', () => {
      const { profesionalId, ...withoutProfesional } = validEvento;
      expect(() => createEventoAgendaSchema.parse(withoutProfesional)).toThrow();
    });

    it('should reject empty profesionalId', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, profesionalId: '' })
      ).toThrow('El profesional es requerido');
    });

    it('should reject missing fechaInicio', () => {
      const { fechaInicio, ...withoutFechaInicio } = validEvento;
      expect(() => createEventoAgendaSchema.parse(withoutFechaInicio)).toThrow();
    });

    it('should reject empty fechaInicio', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, fechaInicio: '' })
      ).toThrow('La fecha de inicio es requerida');
    });

    it('should reject missing fechaFin', () => {
      const { fechaFin, ...withoutFechaFin } = validEvento;
      expect(() => createEventoAgendaSchema.parse(withoutFechaFin)).toThrow();
    });

    it('should reject empty fechaFin', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, fechaFin: '' })
      ).toThrow('La fecha de fin es requerida');
    });

    it('should accept null pacienteId', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, pacienteId: null })
      ).not.toThrow();
    });

    it('should accept null salaId', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, salaId: null })
      ).not.toThrow();
    });

    it('should accept null servicioId', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, servicioId: null })
      ).not.toThrow();
    });

    it('should accept all valid tipos', () => {
      const tipos = ['consulta', 'seguimiento', 'revision', 'tratamiento', 'urgencia', 'administrativo'] as const;
      tipos.forEach(tipo => {
        expect(() =>
          createEventoAgendaSchema.parse({ ...validEvento, tipo })
        ).not.toThrow();
      });
    });

    it('should accept all valid estados', () => {
      const estados = ['programada', 'confirmada', 'realizada', 'cancelada'] as const;
      estados.forEach(estado => {
        expect(() =>
          createEventoAgendaSchema.parse({ ...validEvento, estado })
        ).not.toThrow();
      });
    });

    it('should accept all valid prioridades', () => {
      const prioridades = ['alta', 'media', 'baja'] as const;
      prioridades.forEach(prioridad => {
        expect(() =>
          createEventoAgendaSchema.parse({ ...validEvento, prioridad })
        ).not.toThrow();
      });
    });

    it('should reject too long notas', () => {
      expect(() =>
        createEventoAgendaSchema.parse({ ...validEvento, notas: 'A'.repeat(1001) })
      ).toThrow();
    });
  });

  describe('updateEventoAgendaSchema', () => {
    const validUpdate = {
      id: 'evento-123',
      titulo: 'Nuevo título',
      tipo: 'seguimiento' as const,
      estado: 'confirmada' as const,
    };

    it('should accept valid update data', () => {
      expect(() => updateEventoAgendaSchema.parse(validUpdate)).not.toThrow();
    });

    it('should require id', () => {
      const { id, ...withoutId } = validUpdate;
      expect(() => updateEventoAgendaSchema.parse(withoutId)).toThrow();
    });

    it('should reject empty id', () => {
      expect(() =>
        updateEventoAgendaSchema.parse({ ...validUpdate, id: '' })
      ).toThrow('El ID es requerido');
    });

    it('should accept partial updates', () => {
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', titulo: 'Nuevo título' })
      ).not.toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', estado: 'realizada' })
      ).not.toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123' })
      ).not.toThrow();
    });

    it('should reject invalid values even in partial update', () => {
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', tipo: 'invalid' })
      ).toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', estado: 'invalid' })
      ).toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', prioridad: 'invalid' })
      ).toThrow();
    });

    it('should reject too long titulo', () => {
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', titulo: 'A'.repeat(201) })
      ).toThrow();
    });

    it('should accept null for nullable fields', () => {
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', pacienteId: null })
      ).not.toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', salaId: null })
      ).not.toThrow();
      expect(() =>
        updateEventoAgendaSchema.parse({ id: 'evento-123', servicioId: null })
      ).not.toThrow();
    });
  });

  describe('consultarDisponibilidadSchema', () => {
    const validConsulta = {
      profesionalId: 'prof-123',
      fecha: '2025-01-15',
      duracionMinutos: 60,
    };

    it('should accept valid consulta data', () => {
      expect(() => consultarDisponibilidadSchema.parse(validConsulta)).not.toThrow();
    });

    it('should default duracionMinutos to 30', () => {
      const result = consultarDisponibilidadSchema.parse({
        profesionalId: 'prof-123',
        fecha: '2025-01-15',
      });
      expect(result.duracionMinutos).toBe(30);
    });

    it('should coerce duracionMinutos from string', () => {
      const result = consultarDisponibilidadSchema.parse({
        profesionalId: 'prof-123',
        fecha: '2025-01-15',
        duracionMinutos: '45',
      });
      expect(result.duracionMinutos).toBe(45);
    });

    it('should reject missing profesionalId', () => {
      const { profesionalId, ...withoutProfesional } = validConsulta;
      expect(() => consultarDisponibilidadSchema.parse(withoutProfesional)).toThrow();
    });

    it('should reject empty profesionalId', () => {
      expect(() =>
        consultarDisponibilidadSchema.parse({ ...validConsulta, profesionalId: '' })
      ).toThrow('El ID del profesional es requerido');
    });

    it('should reject missing fecha', () => {
      const { fecha, ...withoutFecha } = validConsulta;
      expect(() => consultarDisponibilidadSchema.parse(withoutFecha)).toThrow();
    });

    it('should reject empty fecha', () => {
      expect(() =>
        consultarDisponibilidadSchema.parse({ ...validConsulta, fecha: '' })
      ).toThrow('La fecha es requerida');
    });

    it('should reject zero duracionMinutos', () => {
      expect(() =>
        consultarDisponibilidadSchema.parse({ ...validConsulta, duracionMinutos: 0 })
      ).toThrow('La duración debe ser positiva');
    });

    it('should reject negative duracionMinutos', () => {
      expect(() =>
        consultarDisponibilidadSchema.parse({ ...validConsulta, duracionMinutos: -30 })
      ).toThrow('La duración debe ser positiva');
    });

    it('should reject non-integer duracionMinutos', () => {
      expect(() =>
        consultarDisponibilidadSchema.parse({ ...validConsulta, duracionMinutos: 30.5 })
      ).toThrow();
    });

    it('should accept various valid durations', () => {
      [15, 30, 45, 60, 90, 120].forEach(duracion => {
        expect(() =>
          consultarDisponibilidadSchema.parse({ ...validConsulta, duracionMinutos: duracion })
        ).not.toThrow();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in titulo', () => {
      expect(() =>
        createEventoAgendaSchema.parse({
          titulo: 'Consulta: paciente con @lergias #urgente',
          profesionalId: 'prof-123',
          fechaInicio: '2025-01-15T10:00:00Z',
          fechaFin: '2025-01-15T11:00:00Z',
        })
      ).not.toThrow();
    });

    it('should handle unicode characters in titulo', () => {
      expect(() =>
        createEventoAgendaSchema.parse({
          titulo: 'Consulta: 你好 مرحبا',
          profesionalId: 'prof-123',
          fechaInicio: '2025-01-15T10:00:00Z',
          fechaFin: '2025-01-15T11:00:00Z',
        })
      ).not.toThrow();
    });

    it('should handle maximum titulo length', () => {
      expect(() =>
        createEventoAgendaSchema.parse({
          titulo: 'A'.repeat(200),
          profesionalId: 'prof-123',
          fechaInicio: '2025-01-15T10:00:00Z',
          fechaFin: '2025-01-15T11:00:00Z',
        })
      ).not.toThrow();
    });

    it('should handle maximum notas length', () => {
      expect(() =>
        createEventoAgendaSchema.parse({
          titulo: 'Consulta',
          profesionalId: 'prof-123',
          fechaInicio: '2025-01-15T10:00:00Z',
          fechaFin: '2025-01-15T11:00:00Z',
          notas: 'A'.repeat(1000),
        })
      ).not.toThrow();
    });
  });
});
