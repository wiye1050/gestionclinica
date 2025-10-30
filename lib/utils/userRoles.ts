// lib/utils/userRoles.ts
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type UserRole = 'admin' | 'doctor' | 'coordinador' | 'staff';

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
  role: UserRole = 'staff',
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
    console.error('Error creating user profile:', error);
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
    console.error('Error getting user profile:', error);
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
    console.error('Error updating last login:', error);
  }
}

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(uid: string, role: UserRole): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile?.role === role;
}

/**
 * Verifica si el usuario tiene al menos uno de los roles especificados
 */
export async function hasAnyRole(uid: string, roles: UserRole[]): Promise<boolean> {
  const profile = await getUserProfile(uid);
  return profile ? roles.includes(profile.role) : false;
}

/**
 * Hook para usar roles en componentes
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

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
    isAdmin: role === 'admin',
    isDoctor: role === 'doctor',
    isCoordinador: role === 'coordinador',
    isStaff: role === 'staff',
    hasRole: (r: UserRole) => role === r,
    hasAnyRole: (roles: UserRole[]) => role ? roles.includes(role) : false
  };
}
