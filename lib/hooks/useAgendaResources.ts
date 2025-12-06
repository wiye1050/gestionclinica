import { useMemo } from 'react';
import type { Profesional } from '@/types';
import type { VistaAgenda } from '@/components/agenda/v2/agendaConstants';

type AgendaResource = {
  id: string;
  nombre: string;
  tipo: 'profesional' | 'sala';
  color?: string;
};

export interface UseAgendaResourcesProps {
  profesionales: Profesional[];
  selectedProfesionales: string[];
  resourcePreset: 'todos' | 'medicina' | 'fisioterapia' | 'enfermeria';
  vista: VistaAgenda;
  dayViewMode: 'single' | 'multi';
}

/**
 * Hook para manejar los recursos (profesionales/salas) de la agenda
 *
 * Extrae toda la lógica relacionada con:
 * - Filtrado de profesionales según selección y preset
 * - Mapeo a AgendaResource con colores
 * - Cálculo de modo de vista de recursos
 * - Límite de columnas según el modo
 *
 * @param props - Profesionales y configuración de filtros
 * @returns Recursos filtrados y configuración de vista
 */
export function useAgendaResources({
  profesionales,
  selectedProfesionales,
  resourcePreset,
  vista,
  dayViewMode,
}: UseAgendaResourcesProps) {
  // Determinar si estamos en modo grid multi-recurso
  const isResourceGridMode = vista === 'multi' || (vista === 'diaria' && dayViewMode === 'multi');
  const resourceColumnLimit = Math.max(isResourceGridMode ? 6 : 4, 1);

  // Filtrar y mapear profesionales a recursos
  const recursos = useMemo<AgendaResource[]>(() => {
    // Solo mostrar profesionales seleccionados explícitamente en el filtro
    const seleccionados = selectedProfesionales
      .map((id) => profesionales.find((p) => p.id === id))
      .filter(
        (prof): prof is Profesional =>
          Boolean(prof) && (resourcePreset === 'todos' || prof?.especialidad === resourcePreset)
      );

    return seleccionados.map((prof) => ({
      id: prof.id,
      nombre: `${prof.nombre} ${prof.apellidos}`,
      tipo: 'profesional' as const,
      color: prof.color ?? '#66b7e1', // fallback azul suave si no hay color asignado
    }));
  }, [profesionales, selectedProfesionales, resourcePreset]);

  return {
    recursos,
    isResourceGridMode,
    resourceColumnLimit,
  };
}
