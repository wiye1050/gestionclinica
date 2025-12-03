// lib/utils/userRoles.ts
import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/useAuth';
import { AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/lib/auth/roles';
import { logger } from '@/lib/utils/logger';

// Re-exportar tipos para compatibilidad
export type UserRole = AppRole;
export { ROLE_LABELS, ROLE_DESCRIPTIONS };

export interface UserProfile {
  email: string;
  role: UserRole;
  displayName?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

/**
 * Crea el perfil de usuario con rol
 * LLAMAR después del registro de cada usuario
 */
export async function createUserProfile(
  uid: string,
  email: string,
  role: UserRole = 'invitado',
  displayName?: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'users', uid), {
      email,
      role,
      displayName: displayName || '',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date()
    });
  } catch (error) {
    logger.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Obtiene el perfil y rol del usuario
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      email: data.email,
      role: data.role,
      displayName: data.displayName,
      active: data.active,
      createdAt: data.createdAt?.toDate() ?? new Date(),
      updatedAt: data.updatedAt?.toDate() ?? new Date(),
      lastLogin: data.lastLogin?.toDate()
    };
  } catch (error) {
    logger.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Actualiza el último login del usuario
 */
export async function updateLastLogin(uid: string): Promise<void> {
  try {
    await setDoc(
      doc(db, 'users', uid),
      { lastLogin: new Date(), updatedAt: new Date() },
      { merge: true }
    );
  } catch (error) {
    logger.error('Error updating last login:', error);
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRoleAsync(uid: string, role: UserRole): Promise<boolean> {
  const profile = await getUserProfile(uid);
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return profile.role === role;
}

/**
 * Verifica si el usuario tiene al menos uno de los roles especificados
 */
export async function hasAnyRoleAsync(uid: string, roles: UserRole[]): Promise<boolean> {
  const profile = await getUserProfile(uid);
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  return roles.includes(profile.role);
}

/**
 * Hook para usar roles en componentes
 */
export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    getUserProfile(user.uid).then(profile => {
      setRole(profile?.role || null);
      setLoading(false);
    });
  }, [user]);

  return {
    role,
    loading,
    // Helpers para verificar roles
    isAdmin: role === 'admin',
    isCoordinador: role === 'coordinador',
    isProfesional: role === 'profesional',
    isRecepcion: role === 'recepcion',
    isInvitado: role === 'invitado',
    // Funciones de verificación
    hasRole: (r: UserRole) => {
      if (role === 'admin') return true;
      return role === r;
    },
    hasAnyRole: (roles: UserRole[]) => {
      if (!role) return false;
      if (role === 'admin') return true;
      return roles.includes(role);
    },
    // Label para mostrar en UI
    roleLabel: role ? ROLE_LABELS[role] : '',
    roleDescription: role ? ROLE_DESCRIPTIONS[role] : ''
  };
}
