import { describe, it, expect } from 'vitest';
import {
  estadoPacienteSchema,
  riesgoPacienteSchema,
  createPacienteSchema,
  updatePacienteSchema,
  importPacientesSchema,
  searchPacientesSchema,
  addHistorialEntrySchema,
  deleteHistorialEntrySchema,
} from '@/lib/validators/pacientes';

describe('Pacientes Validators', () => {
  describe('estadoPacienteSchema', () => {
    it('should accept valid estados', () => {
      expect(() => estadoPacienteSchema.parse('activo')).not.toThrow();
      expect(() => estadoPacienteSchema.parse('inactivo')).not.toThrow();
      expect(() => estadoPacienteSchema.parse('alta')).not.toThrow();
    });

    it('should reject invalid estados', () => {
      expect(() => estadoPacienteSchema.parse('pendiente')).toThrow();
      expect(() => estadoPacienteSchema.parse('deleted')).toThrow();
    });
  });

  describe('riesgoPacienteSchema', () => {
    it('should accept valid riesgos', () => {
      expect(() => riesgoPacienteSchema.parse('alto')).not.toThrow();
      expect(() => riesgoPacienteSchema.parse('medio')).not.toThrow();
      expect(() => riesgoPacienteSchema.parse('bajo')).not.toThrow();
    });

    it('should reject invalid riesgos', () => {
      expect(() => riesgoPacienteSchema.parse('critico')).toThrow();
      expect(() => riesgoPacienteSchema.parse('none')).toThrow();
    });
  });

  describe('createPacienteSchema', () => {
    const validPaciente = {
      nombre: 'Juan',
      apellidos: 'Pérez García',
      documentoId: '12345678A',
      email: 'juan@example.com',
      telefono: '+34912345678',
      fechaNacimiento: '1990-01-15',
      direccion: 'Calle Principal 123',
      codigoPostal: '28001',
      ciudad: 'Madrid',
      estado: 'activo' as const,
      riesgo: 'bajo' as const,
      profesionalReferenteId: 'prof-123',
      grupoPacienteId: 'grupo-1',
      notas: 'Paciente con historial de alergias',
      alergias: ['Polen', 'Penicilina'],
      alertasClinicas: ['Diabetes tipo 2'],
      diagnosticosPrincipales: ['Hipertensión'],
    };

    it('should accept valid paciente data', () => {
      expect(() => createPacienteSchema.parse(validPaciente)).not.toThrow();
    });

    it('should accept minimal required fields', () => {
      const minimalPaciente = {
        nombre: 'Juan',
        apellidos: 'Pérez',
      };
      expect(() => createPacienteSchema.parse(minimalPaciente)).not.toThrow();
    });

    it('should reject missing nombre', () => {
      const { nombre, ...withoutNombre } = validPaciente;
      expect(() => createPacienteSchema.parse(withoutNombre)).toThrow();
    });

    it('should reject missing apellidos', () => {
      const { apellidos, ...withoutApellidos } = validPaciente;
      expect(() => createPacienteSchema.parse(withoutApellidos)).toThrow();
    });

    it('should reject empty nombre', () => {
      expect(() =>
        createPacienteSchema.parse({ ...validPaciente, nombre: '' })
      ).toThrow('El nombre es requerido');
    });

    it('should reject too long nombre', () => {
      expect(() =>
        createPacienteSchema.parse({ ...validPaciente, nombre: 'A'.repeat(101) })
      ).toThrow('Nombre muy largo');
    });

    it('should reject invalid email', () => {
      expect(() =>
        createPacienteSchema.parse({ ...validPaciente, email: 'not-an-email' })
      ).toThrow('Email inválido');
    });

    it('should accept empty optional fields', () => {
      const pacienteWithEmptyOptionals = {
        nombre: 'Juan',
        apellidos: 'Pérez',
        email: '',
        telefono: '',
        notas: '',
      };
      expect(() => createPacienteSchema.parse(pacienteWithEmptyOptionals)).not.toThrow();
    });

    it('should default estado to activo', () => {
      const result = createPacienteSchema.parse({
        nombre: 'Juan',
        apellidos: 'Pérez',
      });
      expect(result.estado).toBe('activo');
    });

    it('should handle arrays with defaults', () => {
      const result = createPacienteSchema.parse({
        nombre: 'Juan',
        apellidos: 'Pérez',
      });
      expect(result.alergias).toEqual([]);
      expect(result.alertasClinicas).toEqual([]);
      expect(result.diagnosticosPrincipales).toEqual([]);
    });
  });

  describe('updatePacienteSchema', () => {
    it('should accept partial updates', () => {
      expect(() => updatePacienteSchema.parse({ nombre: 'Nuevo Nombre' })).not.toThrow();
      expect(() => updatePacienteSchema.parse({ estado: 'inactivo' })).not.toThrow();
      expect(() => updatePacienteSchema.parse({})).not.toThrow();
    });

    it('should reject invalid values even in partial update', () => {
      expect(() =>
        updatePacienteSchema.parse({ email: 'not-an-email' })
      ).toThrow('Email inválido');
      expect(() =>
        updatePacienteSchema.parse({ estado: 'invalid' })
      ).toThrow();
    });
  });

  describe('importPacientesSchema', () => {
    const validImport = {
      pacientes: [
        {
          nombre: 'Juan',
          apellidos: 'Pérez',
          documentoId: '12345678A',
          email: 'juan@example.com',
          telefono: '+34912345678',
          fechaNacimiento: '1990-01-15',
          estado: 'activo' as const,
        },
        {
          nombre: 'María',
          apellidos: 'García',
        },
      ],
    };

    it('should accept valid import data', () => {
      expect(() => importPacientesSchema.parse(validImport)).not.toThrow();
    });

    it('should accept minimal patient data in import', () => {
      const minimalImport = {
        pacientes: [
          { nombre: 'Juan', apellidos: 'Pérez' },
        ],
      };
      expect(() => importPacientesSchema.parse(minimalImport)).not.toThrow();
    });

    it('should reject empty pacientes array', () => {
      expect(() =>
        importPacientesSchema.parse({ pacientes: [] })
      ).toThrow('Debe haber al menos un paciente para importar');
    });

    it('should reject paciente without nombre', () => {
      const invalidImport = {
        pacientes: [
          { apellidos: 'Pérez' },
        ],
      };
      expect(() => importPacientesSchema.parse(invalidImport)).toThrow();
    });

    it('should reject paciente without apellidos', () => {
      const invalidImport = {
        pacientes: [
          { nombre: 'Juan' },
        ],
      };
      expect(() => importPacientesSchema.parse(invalidImport)).toThrow();
    });

    it('should reject invalid email in import', () => {
      const invalidImport = {
        pacientes: [
          { nombre: 'Juan', apellidos: 'Pérez', email: 'invalid' },
        ],
      };
      expect(() => importPacientesSchema.parse(invalidImport)).toThrow();
    });
  });

  describe('searchPacientesSchema', () => {
    it('should accept empty search params', () => {
      expect(() => searchPacientesSchema.parse({})).not.toThrow();
    });

    it('should accept all search params', () => {
      const searchParams = {
        q: 'Juan',
        estado: 'activo' as const,
        riesgo: 'alto' as const,
        profesionalReferenteId: 'prof-123',
        limit: 50,
        cursor: 'cursor-abc',
      };
      expect(() => searchPacientesSchema.parse(searchParams)).not.toThrow();
    });

    it('should default limit to 200', () => {
      const result = searchPacientesSchema.parse({});
      expect(result.limit).toBe(200);
    });

    it('should coerce limit from string', () => {
      const result = searchPacientesSchema.parse({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('should reject limit below minimum', () => {
      expect(() =>
        searchPacientesSchema.parse({ limit: 0 })
      ).toThrow();
    });

    it('should reject limit above maximum', () => {
      expect(() =>
        searchPacientesSchema.parse({ limit: 501 })
      ).toThrow();
    });

    it('should reject non-integer limit', () => {
      expect(() =>
        searchPacientesSchema.parse({ limit: 10.5 })
      ).toThrow();
    });
  });

  describe('addHistorialEntrySchema', () => {
    const validEntry = {
      tipo: 'nota' as const,
      titulo: 'Consulta inicial',
      contenido: 'El paciente presenta síntomas de...',
      profesionalId: 'prof-123',
      adjuntos: [
        {
          nombre: 'radiografia.jpg',
          url: 'https://example.com/file.jpg',
          tipo: 'image/jpeg',
        },
      ],
    };

    it('should accept valid historial entry', () => {
      expect(() => addHistorialEntrySchema.parse(validEntry)).not.toThrow();
    });

    it('should accept all valid tipos', () => {
      const tipos = ['nota', 'diagnostico', 'tratamiento', 'consulta', 'seguimiento', 'alta'] as const;
      tipos.forEach(tipo => {
        expect(() =>
          addHistorialEntrySchema.parse({ ...validEntry, tipo })
        ).not.toThrow();
      });
    });

    it('should reject invalid tipo', () => {
      expect(() =>
        addHistorialEntrySchema.parse({ ...validEntry, tipo: 'invalid' })
      ).toThrow();
    });

    it('should reject missing titulo', () => {
      const { titulo, ...withoutTitulo } = validEntry;
      expect(() => addHistorialEntrySchema.parse(withoutTitulo)).toThrow();
    });

    it('should reject empty titulo', () => {
      expect(() =>
        addHistorialEntrySchema.parse({ ...validEntry, titulo: '' })
      ).toThrow('El título es requerido');
    });

    it('should reject too long titulo', () => {
      expect(() =>
        addHistorialEntrySchema.parse({ ...validEntry, titulo: 'A'.repeat(201) })
      ).toThrow();
    });

    it('should reject missing contenido', () => {
      const { contenido, ...withoutContenido } = validEntry;
      expect(() => addHistorialEntrySchema.parse(withoutContenido)).toThrow();
    });

    it('should reject empty contenido', () => {
      expect(() =>
        addHistorialEntrySchema.parse({ ...validEntry, contenido: '' })
      ).toThrow('El contenido es requerido');
    });

    it('should reject too long contenido', () => {
      expect(() =>
        addHistorialEntrySchema.parse({ ...validEntry, contenido: 'A'.repeat(5001) })
      ).toThrow();
    });

    it('should reject invalid URL in adjuntos', () => {
      const invalidEntry = {
        ...validEntry,
        adjuntos: [
          {
            nombre: 'file.jpg',
            url: 'not-a-url',
            tipo: 'image/jpeg',
          },
        ],
      };
      expect(() => addHistorialEntrySchema.parse(invalidEntry)).toThrow('URL inválida');
    });

    it('should accept entry without adjuntos', () => {
      const { adjuntos, ...withoutAdjuntos } = validEntry;
      expect(() => addHistorialEntrySchema.parse(withoutAdjuntos)).not.toThrow();
    });
  });

  describe('deleteHistorialEntrySchema', () => {
    it('should accept valid entry ID', () => {
      expect(() =>
        deleteHistorialEntrySchema.parse({ entryId: 'entry-123' })
      ).not.toThrow();
    });

    it('should reject empty entry ID', () => {
      expect(() =>
        deleteHistorialEntrySchema.parse({ entryId: '' })
      ).toThrow('El ID de la entrada es requerido');
    });

    it('should reject missing entry ID', () => {
      expect(() => deleteHistorialEntrySchema.parse({})).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in nombres', () => {
      expect(() =>
        createPacienteSchema.parse({
          nombre: "O'Connor-Smith",
          apellidos: 'García López',
        })
      ).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() =>
        createPacienteSchema.parse({
          nombre: '李明',
          apellidos: 'الأحمد',
        })
      ).not.toThrow();
    });

    it('should handle very long arrays', () => {
      const longArray = Array(100).fill('Alergia');
      expect(() =>
        createPacienteSchema.parse({
          nombre: 'Juan',
          apellidos: 'Pérez',
          alergias: longArray,
        })
      ).not.toThrow();
    });

    it('should handle maximum field lengths', () => {
      expect(() =>
        createPacienteSchema.parse({
          nombre: 'A'.repeat(100),
          apellidos: 'B'.repeat(100),
          notas: 'C'.repeat(2000),
        })
      ).not.toThrow();
    });
  });
});
