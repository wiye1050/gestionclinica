import { describe, it, expect } from 'vitest';
import {
  optionalEmail,
  isoDateString,
  optionalIsoDateString,
  uuidSchema,
  nonEmptyString,
  optionalString,
  positiveNumber,
  nonNegativeNumber,
  optionalArray,
  phoneSchema,
  estadoGenerico,
  prioridadSchema,
  userRoleSchema,
  userRolesArraySchema,
} from '@/lib/validators/common';
import { z } from 'zod';

describe('Common Validators', () => {
  describe('optionalEmail', () => {
    it('should accept valid emails', () => {
      expect(() => optionalEmail.parse('test@example.com')).not.toThrow();
      expect(() => optionalEmail.parse('user.name+tag@domain.co.uk')).not.toThrow();
    });

    it('should accept empty string', () => {
      expect(() => optionalEmail.parse('')).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => optionalEmail.parse(undefined)).not.toThrow();
    });

    it('should reject invalid emails', () => {
      expect(() => optionalEmail.parse('not-an-email')).toThrow('Email inválido');
      expect(() => optionalEmail.parse('missing@domain')).toThrow();
      expect(() => optionalEmail.parse('@domain.com')).toThrow();
    });
  });

  describe('isoDateString', () => {
    it('should accept valid ISO date strings', () => {
      expect(() => isoDateString.parse('2025-01-01T00:00:00Z')).not.toThrow();
      expect(() => isoDateString.parse('2025-12-31T23:59:59.999Z')).not.toThrow();
      // Note: Zod v4 datetime() only accepts 'Z' timezone, not offsets like +02:00
      expect(() => isoDateString.parse('2025-06-15T12:30:00Z')).not.toThrow();
    });

    it('should reject invalid date formats', () => {
      expect(() => isoDateString.parse('2025-01-01')).toThrow('Fecha inválida');
      expect(() => isoDateString.parse('01/01/2025')).toThrow();
      expect(() => isoDateString.parse('not-a-date')).toThrow();
      expect(() => isoDateString.parse('')).toThrow();
    });
  });

  describe('optionalIsoDateString', () => {
    it('should accept valid ISO date strings', () => {
      expect(() => optionalIsoDateString.parse('2025-01-01T00:00:00Z')).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => optionalIsoDateString.parse(undefined)).not.toThrow();
    });

    it('should reject invalid date formats', () => {
      expect(() => optionalIsoDateString.parse('2025-01-01')).toThrow();
      expect(() => optionalIsoDateString.parse('invalid')).toThrow();
    });
  });

  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      expect(() => uuidSchema.parse('123e4567-e89b-12d3-a456-426614174000')).not.toThrow();
      expect(() => uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000')).not.toThrow();
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow('ID inválido');
      expect(() => uuidSchema.parse('123-456-789')).toThrow();
      expect(() => uuidSchema.parse('')).toThrow();
    });
  });

  describe('nonEmptyString', () => {
    it('should accept non-empty strings within max length', () => {
      const schema = nonEmptyString(50, 'Nombre');
      expect(() => schema.parse('John')).not.toThrow();
      expect(() => schema.parse('A'.repeat(50))).not.toThrow();
    });

    it('should reject empty strings', () => {
      const schema = nonEmptyString(50, 'Nombre');
      expect(() => schema.parse('')).toThrow('Nombre es requerido');
    });

    it('should reject strings exceeding max length', () => {
      const schema = nonEmptyString(10, 'Campo');
      expect(() => schema.parse('A'.repeat(11))).toThrow('Campo muy largo');
    });

    it('should use default max length and field name', () => {
      const schema = nonEmptyString();
      expect(() => schema.parse('Valid string')).not.toThrow();
      expect(() => schema.parse('A'.repeat(101))).toThrow('Campo muy largo');
    });
  });

  describe('optionalString', () => {
    it('should accept strings within max length', () => {
      const schema = optionalString(100);
      expect(() => schema.parse('Valid string')).not.toThrow();
      expect(() => schema.parse('A'.repeat(100))).not.toThrow();
    });

    it('should accept undefined', () => {
      const schema = optionalString(100);
      expect(() => schema.parse(undefined)).not.toThrow();
    });

    it('should reject strings exceeding max length', () => {
      const schema = optionalString(10);
      expect(() => schema.parse('A'.repeat(11))).toThrow('Texto muy largo');
    });

    it('should use default max length of 2000', () => {
      const schema = optionalString();
      expect(() => schema.parse('A'.repeat(2000))).not.toThrow();
      expect(() => schema.parse('A'.repeat(2001))).toThrow();
    });
  });

  describe('positiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(() => positiveNumber.parse(1)).not.toThrow();
      expect(() => positiveNumber.parse(0.1)).not.toThrow();
      expect(() => positiveNumber.parse(1000)).not.toThrow();
    });

    it('should reject zero', () => {
      expect(() => positiveNumber.parse(0)).toThrow('Debe ser un número positivo');
    });

    it('should reject negative numbers', () => {
      expect(() => positiveNumber.parse(-1)).toThrow('Debe ser un número positivo');
      expect(() => positiveNumber.parse(-0.5)).toThrow();
    });
  });

  describe('nonNegativeNumber', () => {
    it('should accept zero and positive numbers', () => {
      expect(() => nonNegativeNumber.parse(0)).not.toThrow();
      expect(() => nonNegativeNumber.parse(1)).not.toThrow();
      expect(() => nonNegativeNumber.parse(1000.5)).not.toThrow();
    });

    it('should reject negative numbers', () => {
      expect(() => nonNegativeNumber.parse(-1)).toThrow('Debe ser mayor o igual a cero');
      expect(() => nonNegativeNumber.parse(-0.1)).toThrow();
    });
  });

  describe('optionalArray', () => {
    it('should accept arrays with valid items', () => {
      const schema = optionalArray(z.string());
      expect(() => schema.parse(['item1', 'item2'])).not.toThrow();
    });

    it('should accept empty array', () => {
      const schema = optionalArray(z.string());
      expect(() => schema.parse([])).not.toThrow();
    });

    it('should default to empty array when undefined', () => {
      const schema = optionalArray(z.string());
      const result = schema.parse(undefined);
      expect(result).toEqual([]);
    });

    it('should reject arrays with invalid items', () => {
      const schema = optionalArray(z.number());
      expect(() => schema.parse(['not', 'numbers'])).toThrow();
    });
  });

  describe('phoneSchema', () => {
    it('should accept valid phone formats', () => {
      expect(() => phoneSchema.parse('+34912345678')).not.toThrow();
      expect(() => phoneSchema.parse('912345678')).not.toThrow();
      // Note: Regex requires 3 groups of digits, spaces break this pattern
      expect(() => phoneSchema.parse('+15551234567')).not.toThrow();
      expect(() => phoneSchema.parse('442012345678')).not.toThrow();
    });

    it('should accept undefined', () => {
      expect(() => phoneSchema.parse(undefined)).not.toThrow();
    });

    it('should reject invalid phone formats', () => {
      expect(() => phoneSchema.parse('abc')).toThrow('Teléfono inválido');
      expect(() => phoneSchema.parse('12')).toThrow(); // Too short
      expect(() => phoneSchema.parse('++123456789')).toThrow();
    });
  });

  describe('estadoGenerico', () => {
    it('should accept valid estados', () => {
      expect(() => estadoGenerico.parse('activo')).not.toThrow();
      expect(() => estadoGenerico.parse('inactivo')).not.toThrow();
    });

    it('should reject invalid estados', () => {
      expect(() => estadoGenerico.parse('pendiente')).toThrow();
      expect(() => estadoGenerico.parse('disabled')).toThrow();
      expect(() => estadoGenerico.parse('')).toThrow();
    });
  });

  describe('prioridadSchema', () => {
    it('should accept valid prioridades', () => {
      expect(() => prioridadSchema.parse('alta')).not.toThrow();
      expect(() => prioridadSchema.parse('media')).not.toThrow();
      expect(() => prioridadSchema.parse('baja')).not.toThrow();
    });

    it('should reject invalid prioridades', () => {
      expect(() => prioridadSchema.parse('urgente')).toThrow();
      expect(() => prioridadSchema.parse('normal')).toThrow();
      expect(() => prioridadSchema.parse('')).toThrow();
    });
  });

  describe('userRoleSchema', () => {
    it('should accept valid user roles', () => {
      expect(() => userRoleSchema.parse('admin')).not.toThrow();
      expect(() => userRoleSchema.parse('coordinador')).not.toThrow();
      expect(() => userRoleSchema.parse('profesional')).not.toThrow();
      expect(() => userRoleSchema.parse('recepcion')).not.toThrow();
      expect(() => userRoleSchema.parse('invitado')).not.toThrow();
    });

    it('should reject invalid user roles', () => {
      expect(() => userRoleSchema.parse('superadmin')).toThrow();
      expect(() => userRoleSchema.parse('user')).toThrow();
      expect(() => userRoleSchema.parse('')).toThrow();
    });
  });

  describe('userRolesArraySchema', () => {
    it('should accept array with valid roles', () => {
      expect(() => userRolesArraySchema.parse(['admin'])).not.toThrow();
      expect(() => userRolesArraySchema.parse(['admin', 'coordinador'])).not.toThrow();
    });

    it('should reject empty array', () => {
      expect(() => userRolesArraySchema.parse([])).toThrow('Debe tener al menos un rol');
    });

    it('should reject array with invalid roles', () => {
      expect(() => userRolesArraySchema.parse(['admin', 'invalid-role'])).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle null values appropriately', () => {
      expect(() => optionalEmail.parse(null)).toThrow();
      expect(() => optionalString().parse(null)).toThrow();
    });

    it('should handle extreme lengths', () => {
      const veryLongString = 'A'.repeat(10000);
      expect(() => optionalString(10000).parse(veryLongString)).not.toThrow();
      expect(() => optionalString(9999).parse(veryLongString)).toThrow();
    });

    it('should handle special characters in strings', () => {
      const schema = nonEmptyString(100, 'Campo');
      expect(() => schema.parse('Special chars: @#$%^&*()')).not.toThrow();
      expect(() => schema.parse('Unicode: 你好 مرحبا')).not.toThrow();
      expect(() => schema.parse('Emoji: 🎉🎊')).not.toThrow();
    });
  });
});
