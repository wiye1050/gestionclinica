'use client';

import { useEffect, useState } from 'react';
import {
  User,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, updateLastLogin } from '@/lib/utils/userRoles';
import { logger } from '@/lib/utils/logger';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        void fetch('/api/auth/session', { method: 'DELETE' }).catch((error) => {
          logger.warn('[auth] No se pudo limpiar la cookie de sesión', error as Error);
        });
        return;
      }

      void updateLastLogin(currentUser.uid);

      void currentUser
        .getIdToken()
        .then((token) =>
          fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: token }),
          })
        )
        .catch((error) => {
          logger.warn('[auth] No se pudo sincronizar la sesión con el servidor', error as Error);
        });
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      try {
        const token = await result.user.getIdToken();
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        });
        if (!response.ok) {
          logger.warn('[auth] No se pudo establecer la sesión del servidor tras login');
        }
      } catch (sessionError) {
        logger.warn('[auth] Error sincronizando la sesión tras login', sessionError as Error);
      }

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  };

  const register = async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      try {
        await createUserProfile(result.user.uid, email, 'invitado', displayName);
      } catch (profileError) {
        logger.warn('[auth] No se pudo crear el perfil del usuario', profileError as Error);
      }
      try {
        const token = await result.user.getIdToken();
        const response = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: token }),
        });
        if (!response.ok) {
          logger.warn('[auth] No se pudo establecer la sesión del servidor tras registro');
        }
      } catch (sessionError) {
        logger.warn('[auth] Error sincronizando la sesión tras registro', sessionError as Error);
      }

      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  };

  const logout = async () => {
    try {
      try {
        const response = await fetch('/api/auth/session', { method: 'DELETE' });
        if (!response.ok) {
          logger.warn('[auth] No se pudo eliminar la sesión del servidor al cerrar sesión');
        }
      } catch (sessionError) {
        logger.warn('[auth] Error eliminando la sesión del servidor', sessionError as Error);
      }
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  };

  return { user, loading, login, register, logout };
};
