import { serverFetchGet } from '@/lib/utils/serverFetch';
import { logger } from '@/lib/utils/logger';
import type { SerializedProyecto } from '@/lib/server/proyectos';
import type { ProyectoEstadisticas } from '@/lib/server/proyectosStats';

/**
 * Fetch complete proyecto data from server
 */
export async function fetchProyectoData(
  proyectoId: string
): Promise<SerializedProyecto | null> {
  try {
    const data = await serverFetchGet<SerializedProyecto>(
      `/api/proyectos/${proyectoId}`,
      `proyecto-${proyectoId}`,
      'fetch-proyecto'
    );
    return data;
  } catch (error) {
    logger.error('Error fetching proyecto:', error as Error);
    return null;
  }
}

/**
 * Fetch proyecto statistics from server
 */
export async function fetchProyectoEstadisticas(
  proyectoId: string
): Promise<ProyectoEstadisticas | null> {
  try {
    const data = await serverFetchGet<ProyectoEstadisticas>(
      `/api/proyectos/${proyectoId}/estadisticas`,
      `proyecto-stats-${proyectoId}`,
      'fetch-proyecto-stats'
    );
    return data;
  } catch (error) {
    logger.error('Error fetching proyecto stats:', error as Error);
    return null;
  }
}

/**
 * Fetch all proyecto data in parallel for maximum performance
 */
export async function fetchAllProyectoData(proyectoId: string) {
  const [proyecto, estadisticas] = await Promise.all([
    fetchProyectoData(proyectoId),
    fetchProyectoEstadisticas(proyectoId),
  ]);

  return {
    proyecto,
    estadisticas,
  };
}
