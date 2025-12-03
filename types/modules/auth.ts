// types/modules/auth.ts

// ============================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// ============================================

export type UserRole = 'admin' | 'coordinador' | 'profesional' | 'usuario';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  permisos?: string[];
  profesionalId?: string; // Si es profesional, referencia a su ficha
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
