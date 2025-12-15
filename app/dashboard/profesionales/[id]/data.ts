import { serverFetchGet } from '@/lib/utils/serverFetch';
import { logger } from '@/lib/utils/logger';
import type { Profesional } from '@/types';
import type { ProfesionalEstadisticas } from '@/lib/server/profesionalesStats';

/**
 * Fetch complete professional data from server
 * Used in Server Components for initial data loading
 */
export async function fetchProfesionalData(
  profesionalId: string
): Promise<Profesional | null> {
  try {
    const data = await serverFetchGet<Profesional>(
      `/api/profesionales/${profesionalId}`,
      `profesional-${profesionalId}`,
      'fetch-profesional'
    );
    return data;
  } catch (error) {
    logger.error('Error fetching profesional:', error as Error);
    return null;
  }
}

/**
 * Fetch professional statistics from server
 */
export async function fetchProfesionalEstadisticas(
  profesionalId: string,
  mesesAtras: number = 3
): Promise<ProfesionalEstadisticas | null> {
  try {
    const data = await serverFetchGet<ProfesionalEstadisticas>(
      `/api/profesionales/${profesionalId}/estadisticas?mesesAtras=${mesesAtras}`,
      `profesional-stats-${profesionalId}-${mesesAtras}`,
      'fetch-profesional-stats'
    );
    return data;
  } catch (error) {
    logger.error('Error fetching profesional stats:', error as Error);
    return null;
  }
}

/**
 * Fetch all professional data in parallel for maximum performance
 * This is the recommended method for Server Components
 */
export async function fetchAllProfesionalData(profesionalId: string) {
  const [profesional, estadisticas] = await Promise.all([
    fetchProfesionalData(profesionalId),
    fetchProfesionalEstadisticas(profesionalId, 3),
  ]);

  return {
    profesional,
    estadisticas,
  };
}
