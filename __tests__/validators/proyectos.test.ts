import { describe, it, expect } from 'vitest';
import {
  estadoProyectoSchema,
  createProyectoSchema,
  updateProyectoSchema,
  addTareaProyectoSchema,
} from '@/lib/validators/proyectos';

describe('Proyectos Validators', () => {
  describe('estadoProyectoSchema', () => {
    it('should accept all valid estados', () => {
      const validEstados = [
        'backlog',
        'planificado',
        'en-progreso',
        'en-pausa',
        'completado',
        'cancelado',
      ];
      validEstados.forEach(estado => {
        expect(() => estadoProyectoSchema.parse(estado)).not.toThrow();
      });
    });

    it('should reject invalid estados', () => {
      expect(() => estadoProyectoSchema.parse('pending')).toThrow();
      expect(() => estadoProyectoSchema.parse('active')).toThrow();
      expect(() => estadoProyectoSchema.parse('')).toThrow();
    });
  });

  describe('createProyectoSchema', () => {
    const validProyecto = {
      nombre: 'Proyecto de Mejora',
      descripcion: 'Descripción detallada del proyecto',
      estado: 'en-progreso' as const,
      prioridad: 'alta' as const,
      responsableId: 'user-123',
      responsableNombre: 'Juan Pérez',
      fechaInicio: '2025-01-01',
      fechaFinPrevista: '2025-12-31',
      fechaFinReal: '2025-11-30',
      presupuesto: 10000,
      gastoActual: 5000,
      progreso: 50,
      tags: ['mejora', 'urgente'],
      notas: 'Notas adicionales del proyecto',
    };

    it('should accept valid proyecto data', () => {
      expect(() => createProyectoSchema.parse(validProyecto)).not.toThrow();
    });

    it('should accept minimal required fields', () => {
      const minimalProyecto = {
        nombre: 'Proyecto Mínimo',
      };
      expect(() => createProyectoSchema.parse(minimalProyecto)).not.toThrow();
    });

    it('should default estado to backlog', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto Test' });
      expect(result.estado).toBe('backlog');
    });

    it('should default prioridad to media', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto Test' });
      expect(result.prioridad).toBe('media');
    });

    it('should default progreso to 0', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto Test' });
      expect(result.progreso).toBe(0);
    });

    it('should default tags to empty array', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto Test' });
      expect(result.tags).toEqual([]);
    });

    it('should reject nombre with less than 3 characters', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'AB' })
      ).toThrow('El nombre debe tener al menos 3 caracteres');
    });

    it('should reject too long nombre', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'A'.repeat(201) })
      ).toThrow('Nombre muy largo');
    });

    it('should accept nombre with exactly 3 characters', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'ABC' })
      ).not.toThrow();
    });

    it('should accept nombre with exactly 200 characters', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'A'.repeat(200) })
      ).not.toThrow();
    });

    it('should reject too long descripcion', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', descripcion: 'A'.repeat(2001) })
      ).toThrow();
    });

    it('should reject negative presupuesto', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', presupuesto: -100 })
      ).toThrow();
    });

    it('should accept zero presupuesto', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', presupuesto: 0 })
      ).not.toThrow();
    });

    it('should coerce presupuesto from string', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto', presupuesto: '5000' });
      expect(result.presupuesto).toBe(5000);
    });

    it('should reject negative gastoActual', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', gastoActual: -50 })
      ).toThrow();
    });

    it('should reject progreso below 0', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', progreso: -1 })
      ).toThrow();
    });

    it('should reject progreso above 100', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', progreso: 101 })
      ).toThrow();
    });

    it('should accept progreso at boundary values', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', progreso: 0 })
      ).not.toThrow();
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', progreso: 100 })
      ).not.toThrow();
    });

    it('should reject non-integer progreso', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', progreso: 50.5 })
      ).toThrow();
    });

    it('should coerce progreso from string', () => {
      const result = createProyectoSchema.parse({ nombre: 'Proyecto', progreso: '75' });
      expect(result.progreso).toBe(75);
    });
  });

  describe('updateProyectoSchema', () => {
    const validUpdate = {
      id: 'proyecto-123',
      nombre: 'Nombre actualizado',
      estado: 'completado' as const,
      progreso: 100,
    };

    it('should accept valid update data', () => {
      expect(() => updateProyectoSchema.parse(validUpdate)).not.toThrow();
    });

    it('should require id', () => {
      const { id, ...withoutId } = validUpdate;
      expect(() => updateProyectoSchema.parse(withoutId)).toThrow();
    });

    it('should reject empty id', () => {
      expect(() =>
        updateProyectoSchema.parse({ ...validUpdate, id: '' })
      ).toThrow('El ID es requerido');
    });

    it('should accept partial updates', () => {
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123', nombre: 'Nuevo nombre' })
      ).not.toThrow();
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123', progreso: 75 })
      ).not.toThrow();
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123' })
      ).not.toThrow();
    });

    it('should reject invalid values even in partial update', () => {
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123', nombre: 'AB' })
      ).toThrow();
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123', progreso: 101 })
      ).toThrow();
      expect(() =>
        updateProyectoSchema.parse({ id: 'proyecto-123', presupuesto: -100 })
      ).toThrow();
    });
  });

  describe('addTareaProyectoSchema', () => {
    const validTarea = {
      proyectoId: 'proyecto-123',
      titulo: 'Tarea importante',
      descripcion: 'Descripción detallada de la tarea',
      asignadoA: 'user-456',
      fechaVencimiento: '2025-12-31',
      prioridad: 'alta' as const,
      completada: true,
    };

    it('should accept valid tarea data', () => {
      expect(() => addTareaProyectoSchema.parse(validTarea)).not.toThrow();
    });

    it('should accept minimal required fields', () => {
      const minimalTarea = {
        proyectoId: 'proyecto-123',
        titulo: 'Tarea',
      };
      expect(() => addTareaProyectoSchema.parse(minimalTarea)).not.toThrow();
    });

    it('should default prioridad to media', () => {
      const result = addTareaProyectoSchema.parse({
        proyectoId: 'proyecto-123',
        titulo: 'Tarea',
      });
      expect(result.prioridad).toBe('media');
    });

    it('should default completada to false', () => {
      const result = addTareaProyectoSchema.parse({
        proyectoId: 'proyecto-123',
        titulo: 'Tarea',
      });
      expect(result.completada).toBe(false);
    });

    it('should reject missing proyectoId', () => {
      const { proyectoId, ...withoutProyectoId } = validTarea;
      expect(() => addTareaProyectoSchema.parse(withoutProyectoId)).toThrow();
    });

    it('should reject empty proyectoId', () => {
      expect(() =>
        addTareaProyectoSchema.parse({ ...validTarea, proyectoId: '' })
      ).toThrow('El ID del proyecto es requerido');
    });

    it('should reject missing titulo', () => {
      const { titulo, ...withoutTitulo } = validTarea;
      expect(() => addTareaProyectoSchema.parse(withoutTitulo)).toThrow();
    });

    it('should reject empty titulo', () => {
      expect(() =>
        addTareaProyectoSchema.parse({ ...validTarea, titulo: '' })
      ).toThrow('El título es requerido');
    });

    it('should reject too long titulo', () => {
      expect(() =>
        addTareaProyectoSchema.parse({ ...validTarea, titulo: 'A'.repeat(201) })
      ).toThrow();
    });

    it('should reject too long descripcion', () => {
      expect(() =>
        addTareaProyectoSchema.parse({ ...validTarea, descripcion: 'A'.repeat(1001) })
      ).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in nombre', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto: mejora @2025 #importante' })
      ).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto 你好 مرحبا' })
      ).not.toThrow();
    });

    it('should handle decimal presupuesto values', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', presupuesto: 1234.56 })
      ).not.toThrow();
    });

    it('should handle large presupuesto values', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', presupuesto: 999999999 })
      ).not.toThrow();
    });

    it('should handle many tags', () => {
      const manyTags = Array(50).fill('tag');
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', tags: manyTags })
      ).not.toThrow();
    });

    it('should handle maximum notas length', () => {
      expect(() =>
        createProyectoSchema.parse({ nombre: 'Proyecto', notas: 'A'.repeat(5000) })
      ).not.toThrow();
    });
  });
});
