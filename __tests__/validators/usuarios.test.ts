import { describe, it, expect } from 'vitest';
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  updateUserRolesSchema,
} from '@/lib/validators/usuarios';

describe('Usuarios Validators', () => {
  describe('createUsuarioSchema', () => {
    const validUsuario = {
      email: 'usuario@example.com',
      nombre: 'Juan',
      apellidos: 'Pérez García',
      roles: ['profesional'] as const,
      telefono: '+34912345678',
      profesionalId: 'prof-123',
      pacienteId: 'pac-456',
      activo: true,
      notificacionesEmail: true,
      notificacionesPush: false,
    };

    it('should accept valid usuario data', () => {
      expect(() => createUsuarioSchema.parse(validUsuario)).not.toThrow();
    });

    it('should accept minimal required fields', () => {
      const minimalUsuario = {
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        roles: ['recepcion'],
      };
      expect(() => createUsuarioSchema.parse(minimalUsuario)).not.toThrow();
    });

    it('should default activo to true', () => {
      const result = createUsuarioSchema.parse({
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        roles: ['admin'],
      });
      expect(result.activo).toBe(true);
    });

    it('should default notificacionesEmail to true', () => {
      const result = createUsuarioSchema.parse({
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        roles: ['admin'],
      });
      expect(result.notificacionesEmail).toBe(true);
    });

    it('should default notificacionesPush to false', () => {
      const result = createUsuarioSchema.parse({
        email: 'test@example.com',
        nombre: 'Test',
        apellidos: 'User',
        roles: ['admin'],
      });
      expect(result.notificacionesPush).toBe(false);
    });

    it('should reject missing email', () => {
      const { email, ...withoutEmail } = validUsuario;
      expect(() => createUsuarioSchema.parse(withoutEmail)).toThrow();
    });

    it('should reject empty email', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, email: '' })
      ).toThrow('El email es requerido');
    });

    it('should reject invalid email', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, email: 'not-an-email' })
      ).toThrow('Email inválido');
    });

    it('should reject missing nombre', () => {
      const { nombre, ...withoutNombre } = validUsuario;
      expect(() => createUsuarioSchema.parse(withoutNombre)).toThrow();
    });

    it('should reject empty nombre', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, nombre: '' })
      ).toThrow('El nombre es requerido');
    });

    it('should reject too long nombre', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, nombre: 'A'.repeat(101) })
      ).toThrow();
    });

    it('should reject missing apellidos', () => {
      const { apellidos, ...withoutApellidos } = validUsuario;
      expect(() => createUsuarioSchema.parse(withoutApellidos)).toThrow();
    });

    it('should reject empty apellidos', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, apellidos: '' })
      ).toThrow('Los apellidos son requeridos');
    });

    it('should reject too long apellidos', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, apellidos: 'A'.repeat(101) })
      ).toThrow();
    });

    it('should reject missing roles', () => {
      const { roles, ...withoutRoles } = validUsuario;
      expect(() => createUsuarioSchema.parse(withoutRoles)).toThrow();
    });

    it('should reject empty roles array', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, roles: [] })
      ).toThrow('Debe tener al menos un rol');
    });

    it('should accept all valid roles', () => {
      const validRoles = ['admin', 'coordinador', 'profesional', 'recepcion', 'invitado'] as const;
      validRoles.forEach(role => {
        expect(() =>
          createUsuarioSchema.parse({ ...validUsuario, roles: [role] })
        ).not.toThrow();
      });
    });

    it('should accept multiple roles', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, roles: ['admin', 'coordinador'] })
      ).not.toThrow();
    });

    it('should reject invalid roles', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, roles: ['superadmin'] })
      ).toThrow();
    });

    it('should reject invalid phone format', () => {
      expect(() =>
        createUsuarioSchema.parse({ ...validUsuario, telefono: 'invalid' })
      ).toThrow('Teléfono inválido');
    });

    it('should accept valid phone formats', () => {
      const validPhones = [
        '+34912345678',
        '912345678',
        '+15551234567',
        undefined,
      ];
      validPhones.forEach(telefono => {
        expect(() =>
          createUsuarioSchema.parse({ ...validUsuario, telefono })
        ).not.toThrow();
      });
    });
  });

  describe('updateUsuarioSchema', () => {
    const validUpdate = {
      id: 'user-123',
      email: 'updated@example.com',
      nombre: 'Nombre Actualizado',
      apellidos: 'Apellidos Actualizados',
      roles: ['admin'] as const,
      activo: false,
    };

    it('should accept valid update data', () => {
      expect(() => updateUsuarioSchema.parse(validUpdate)).not.toThrow();
    });

    it('should require id', () => {
      const { id, ...withoutId } = validUpdate;
      expect(() => updateUsuarioSchema.parse(withoutId)).toThrow();
    });

    it('should reject empty id', () => {
      expect(() =>
        updateUsuarioSchema.parse({ ...validUpdate, id: '' })
      ).toThrow('El ID es requerido');
    });

    it('should accept partial updates', () => {
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', nombre: 'Nuevo Nombre' })
      ).not.toThrow();
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', activo: false })
      ).not.toThrow();
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123' })
      ).not.toThrow();
    });

    it('should reject invalid values even in partial update', () => {
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', email: 'invalid' })
      ).toThrow();
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', nombre: '' })
      ).toThrow();
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', roles: [] })
      ).toThrow();
    });

    it('should accept email as empty string', () => {
      expect(() =>
        updateUsuarioSchema.parse({ id: 'user-123', email: '' })
      ).not.toThrow();
    });

    it('should accept all optional fields as undefined', () => {
      expect(() =>
        updateUsuarioSchema.parse({
          id: 'user-123',
          email: undefined,
          nombre: undefined,
          roles: undefined,
          telefono: undefined,
        })
      ).not.toThrow();
    });
  });

  describe('updateUserRolesSchema', () => {
    const validRolesUpdate = {
      userId: 'user-123',
      roles: ['admin', 'coordinador'] as const,
    };

    it('should accept valid roles update', () => {
      expect(() => updateUserRolesSchema.parse(validRolesUpdate)).not.toThrow();
    });

    it('should require userId', () => {
      const { userId, ...withoutUserId } = validRolesUpdate;
      expect(() => updateUserRolesSchema.parse(withoutUserId)).toThrow();
    });

    it('should reject empty userId', () => {
      expect(() =>
        updateUserRolesSchema.parse({ ...validRolesUpdate, userId: '' })
      ).toThrow('El ID del usuario es requerido');
    });

    it('should require roles', () => {
      const { roles, ...withoutRoles } = validRolesUpdate;
      expect(() => updateUserRolesSchema.parse(withoutRoles)).toThrow();
    });

    it('should reject empty roles array', () => {
      expect(() =>
        updateUserRolesSchema.parse({ ...validRolesUpdate, roles: [] })
      ).toThrow('Debe tener al menos un rol');
    });

    it('should accept single role', () => {
      expect(() =>
        updateUserRolesSchema.parse({ userId: 'user-123', roles: ['profesional'] })
      ).not.toThrow();
    });

    it('should accept multiple roles', () => {
      expect(() =>
        updateUserRolesSchema.parse({ userId: 'user-123', roles: ['admin', 'coordinador', 'profesional'] })
      ).not.toThrow();
    });

    it('should reject invalid roles', () => {
      expect(() =>
        updateUserRolesSchema.parse({ userId: 'user-123', roles: ['invalid-role'] })
      ).toThrow();
    });

    it('should reject mix of valid and invalid roles', () => {
      expect(() =>
        updateUserRolesSchema.parse({ userId: 'user-123', roles: ['admin', 'invalid'] })
      ).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle special characters in nombres', () => {
      expect(() =>
        createUsuarioSchema.parse({
          email: 'test@example.com',
          nombre: "O'Connor-Smith",
          apellidos: 'García López',
          roles: ['profesional'],
        })
      ).not.toThrow();
    });

    it('should handle unicode characters', () => {
      expect(() =>
        createUsuarioSchema.parse({
          email: 'test@example.com',
          nombre: '李明',
          apellidos: 'الأحمد',
          roles: ['profesional'],
        })
      ).not.toThrow();
    });

    it('should handle various email formats', () => {
      const emails = [
        'simple@example.com',
        'user.name+tag@domain.co.uk',
        'user_123@test-domain.com',
      ];
      emails.forEach(email => {
        expect(() =>
          createUsuarioSchema.parse({
            email,
            nombre: 'Test',
            apellidos: 'User',
            roles: ['profesional'],
          })
        ).not.toThrow();
      });
    });

    it('should handle maximum nombre and apellidos length', () => {
      expect(() =>
        createUsuarioSchema.parse({
          email: 'test@example.com',
          nombre: 'A'.repeat(100),
          apellidos: 'B'.repeat(100),
          roles: ['profesional'],
        })
      ).not.toThrow();
    });

    it('should handle all roles at once', () => {
      expect(() =>
        createUsuarioSchema.parse({
          email: 'test@example.com',
          nombre: 'Test',
          apellidos: 'User',
          roles: ['admin', 'coordinador', 'profesional', 'recepcion', 'invitado'],
        })
      ).not.toThrow();
    });
  });
});
