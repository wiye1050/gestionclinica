'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

// Widget IDs para el dashboard
export type WidgetId =
  | 'appointments'
  | 'tasks'
  | 'followUps'
  | 'projects'
  | 'finance'
  | 'reports'
  | 'stock'
  | 'activity'
  | 'metrics'
  | 'evaluations';

export interface DashboardPreferences {
  // Widgets visibles/ocultos
  hiddenWidgets: WidgetId[];
  // Modo compacto activado
  compactMode: boolean;
  // Orden de widgets (para drag & drop)
  widgetOrder: WidgetId[];
}

// Orden por defecto de los widgets
const DEFAULT_WIDGET_ORDER: WidgetId[] = [
  'appointments',
  'tasks',
  'followUps',
  'projects',
  'finance',
  'reports',
  'stock',
  'activity',
  'metrics',
  'evaluations',
];

const DEFAULT_PREFERENCES: DashboardPreferences = {
  hiddenWidgets: [],
  compactMode: false,
  widgetOrder: DEFAULT_WIDGET_ORDER,
};

const STORAGE_KEY = 'dashboard-preferences';

/**
 * Hook para gestionar preferencias del dashboard
 * Guarda en localStorage las preferencias del usuario
 */
export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias de localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DashboardPreferences;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      logger.error('Error loading dashboard preferences:', error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar preferencias en localStorage
  const savePreferences = useCallback((newPreferences: DashboardPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      logger.error('Error saving dashboard preferences:', error as Error);
    }
  }, []);

  // Toggle visibilidad de un widget
  const toggleWidget = useCallback(
    (widgetId: WidgetId) => {
      const isHidden = preferences.hiddenWidgets.includes(widgetId);
      const newHiddenWidgets = isHidden
        ? preferences.hiddenWidgets.filter((id) => id !== widgetId)
        : [...preferences.hiddenWidgets, widgetId];

      savePreferences({
        ...preferences,
        hiddenWidgets: newHiddenWidgets,
      });
    },
    [preferences, savePreferences]
  );

  // Ocultar un widget
  const hideWidget = useCallback(
    (widgetId: WidgetId) => {
      if (!preferences.hiddenWidgets.includes(widgetId)) {
        savePreferences({
          ...preferences,
          hiddenWidgets: [...preferences.hiddenWidgets, widgetId],
        });
      }
    },
    [preferences, savePreferences]
  );

  // Mostrar un widget
  const showWidget = useCallback(
    (widgetId: WidgetId) => {
      savePreferences({
        ...preferences,
        hiddenWidgets: preferences.hiddenWidgets.filter((id) => id !== widgetId),
      });
    },
    [preferences, savePreferences]
  );

  // Mostrar todos los widgets
  const showAllWidgets = useCallback(() => {
    savePreferences({
      ...preferences,
      hiddenWidgets: [],
    });
  }, [preferences, savePreferences]);

  // Toggle modo compacto
  const toggleCompactMode = useCallback(() => {
    savePreferences({
      ...preferences,
      compactMode: !preferences.compactMode,
    });
  }, [preferences, savePreferences]);

  // Activar modo compacto
  const enableCompactMode = useCallback(() => {
    savePreferences({
      ...preferences,
      compactMode: true,
    });
  }, [preferences, savePreferences]);

  // Desactivar modo compacto
  const disableCompactMode = useCallback(() => {
    savePreferences({
      ...preferences,
      compactMode: false,
    });
  }, [preferences, savePreferences]);

  // Verificar si un widget está oculto
  const isWidgetHidden = useCallback(
    (widgetId: WidgetId) => {
      return preferences.hiddenWidgets.includes(widgetId);
    },
    [preferences.hiddenWidgets]
  );

  // Actualizar orden de widgets
  const updateWidgetOrder = useCallback(
    (newOrder: WidgetId[]) => {
      savePreferences({
        ...preferences,
        widgetOrder: newOrder,
      });
    },
    [preferences, savePreferences]
  );

  // Resetear todas las preferencias
  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  return {
    // Estado
    preferences,
    isLoading,
    compactMode: preferences.compactMode,
    hiddenWidgets: preferences.hiddenWidgets,
    widgetOrder: preferences.widgetOrder,

    // Funciones de widgets
    toggleWidget,
    hideWidget,
    showWidget,
    showAllWidgets,
    isWidgetHidden,

    // Funciones de modo compacto
    toggleCompactMode,
    enableCompactMode,
    disableCompactMode,

    // Funciones de ordenamiento
    updateWidgetOrder,

    // Utilidades
    resetPreferences,
  };
}
