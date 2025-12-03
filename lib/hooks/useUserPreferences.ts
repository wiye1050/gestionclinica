'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import {
  UserPreferences,
  UserPreferencesUpdate,
  DEFAULT_PREFERENCES,
} from '@/lib/types/userPreferences';
import { logger } from '@/lib/utils/logger';

interface UseUserPreferencesReturn {
  preferences: UserPreferences;
  loading: boolean;
  error: string | null;
  updatePreferences: (updates: UserPreferencesUpdate) => Promise<void>;
  resetPreferences: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar preferencias del usuario
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, 'users', user.uid, 'settings', 'preferences');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<UserPreferences>;
          // Merge con defaults para asegurar que todas las propiedades existen
          setPreferences(mergeWithDefaults(data));
        } else {
          // Crear documento con defaults si no existe
          await setDoc(docRef, DEFAULT_PREFERENCES);
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (err) {
        logger.error('Error cargando preferencias:', err as Error);
        setError('No se pudieron cargar las preferencias');
        setPreferences(DEFAULT_PREFERENCES);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Actualizar preferencias
  const updatePreferences = useCallback(
    async (updates: UserPreferencesUpdate) => {
      if (!user?.uid) {
        setError('Usuario no autenticado');
        return;
      }

      try {
        setError(null);
        const docRef = doc(db, 'users', user.uid, 'settings', 'preferences');

        // Preparar las actualizaciones aplanadas para Firestore
        const flatUpdates = flattenUpdates(updates);

        await updateDoc(docRef, flatUpdates);

        // Actualizar estado local
        setPreferences((prev) => {
          const updated = { ...prev };

          if (updates.theme !== undefined) updated.theme = updates.theme;
          if (updates.sidebarCollapsed !== undefined)
            updated.sidebarCollapsed = updates.sidebarCollapsed;
          if (updates.compactMode !== undefined) updated.compactMode = updates.compactMode;

          if (updates.notifications) {
            updated.notifications = { ...updated.notifications, ...updates.notifications };
          }
          if (updates.agenda) {
            updated.agenda = { ...updated.agenda, ...updates.agenda };
          }
          if (updates.dashboard) {
            updated.dashboard = { ...updated.dashboard, ...updates.dashboard };
          }
          if (updates.accesibilidad) {
            updated.accesibilidad = { ...updated.accesibilidad, ...updates.accesibilidad };
          }

          return updated;
        });
      } catch (err) {
        logger.error('Error actualizando preferencias:', err as Error);
        setError('No se pudieron guardar las preferencias');
        throw err;
      }
    },
    [user?.uid]
  );

  // Resetear preferencias a valores por defecto
  const resetPreferences = useCallback(async () => {
    if (!user?.uid) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      setError(null);
      const docRef = doc(db, 'users', user.uid, 'settings', 'preferences');
      await setDoc(docRef, DEFAULT_PREFERENCES);
      setPreferences(DEFAULT_PREFERENCES);
    } catch (err) {
      logger.error('Error reseteando preferencias:', err as Error);
      setError('No se pudieron resetear las preferencias');
      throw err;
    }
  }, [user?.uid]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetPreferences,
  };
}

// Helper para mergear datos parciales con defaults
function mergeWithDefaults(data: Partial<UserPreferences>): UserPreferences {
  return {
    theme: data.theme ?? DEFAULT_PREFERENCES.theme,
    sidebarCollapsed: data.sidebarCollapsed ?? DEFAULT_PREFERENCES.sidebarCollapsed,
    compactMode: data.compactMode ?? DEFAULT_PREFERENCES.compactMode,
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...data.notifications,
    },
    agenda: {
      ...DEFAULT_PREFERENCES.agenda,
      ...data.agenda,
    },
    dashboard: {
      ...DEFAULT_PREFERENCES.dashboard,
      ...data.dashboard,
    },
    accesibilidad: {
      ...DEFAULT_PREFERENCES.accesibilidad,
      ...data.accesibilidad,
    },
  };
}

// Helper para aplanar updates para Firestore
function flattenUpdates(updates: UserPreferencesUpdate): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  if (updates.theme !== undefined) flat.theme = updates.theme;
  if (updates.sidebarCollapsed !== undefined) flat.sidebarCollapsed = updates.sidebarCollapsed;
  if (updates.compactMode !== undefined) flat.compactMode = updates.compactMode;

  if (updates.notifications) {
    Object.entries(updates.notifications).forEach(([key, value]) => {
      flat[`notifications.${key}`] = value;
    });
  }

  if (updates.agenda) {
    Object.entries(updates.agenda).forEach(([key, value]) => {
      flat[`agenda.${key}`] = value;
    });
  }

  if (updates.dashboard) {
    Object.entries(updates.dashboard).forEach(([key, value]) => {
      flat[`dashboard.${key}`] = value;
    });
  }

  if (updates.accesibilidad) {
    Object.entries(updates.accesibilidad).forEach(([key, value]) => {
      flat[`accesibilidad.${key}`] = value;
    });
  }

  return flat;
}
