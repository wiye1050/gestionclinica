import { useState, useMemo, useCallback } from 'react';
import { addDays, addWeeks, startOfWeek, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { VistaAgenda } from '@/components/agenda/v2/agendaConstants';

export interface UseAgendaNavigationProps {
  initialDate?: Date;
  vista: VistaAgenda;
}

/**
 * Hook para manejar la navegación temporal de la agenda
 *
 * Extrae toda la lógica relacionada con:
 * - Fecha actual y navegación (prev/next/today)
 * - Cálculo de inicio de semana
 * - Formateo de etiquetas de fecha
 *
 * @param props - Configuración inicial
 * @returns Estado y handlers de navegación
 */
export function useAgendaNavigation({ initialDate, vista }: UseAgendaNavigationProps) {
  const [currentDate, setCurrentDate] = useState(() => initialDate ?? new Date());

  // Calcular inicio de semana (lunes) basado en currentDate
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  // Navegación: anterior
  const handlePrev = useCallback(() => {
    if (vista === 'semanal') {
      setCurrentDate((prev) => addWeeks(prev, -1));
    } else {
      setCurrentDate((prev) => addDays(prev, -1));
    }
  }, [vista]);

  // Navegación: siguiente
  const handleNext = useCallback(() => {
    if (vista === 'semanal') {
      setCurrentDate((prev) => addWeeks(prev, 1));
    } else {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  }, [vista]);

  // Navegación: volver a hoy
  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Formatear etiqueta de fecha para TopBar
  const dateLabel = useMemo(() => {
    if (vista === 'semanal') {
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, "d 'de' MMM", { locale: es })} - ${format(
        weekEnd,
        "d 'de' MMMM, yyyy",
        { locale: es }
      )}`;
    }

    return format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es });
  }, [vista, currentDate, weekStart]);

  return {
    // Estado
    currentDate,
    setCurrentDate,
    weekStart,
    dateLabel,

    // Handlers
    handlePrev,
    handleNext,
    handleToday,
  };
}
