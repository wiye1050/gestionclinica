import type { SerializedCatalogoServicio } from '@/lib/utils/servicios';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function fetchServicioData(servicioId: string): Promise<SerializedCatalogoServicio | null> {
  try {
    const response = await fetch(`${API_BASE}/api/servicios/catalogo/${servicioId}`, {
      next: { revalidate: 60, tags: [`servicio-${servicioId}`] },
    });

    if (!response.ok) {
      console.error('[fetchServicioData] Error fetching servicio:', response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[fetchServicioData] Error:', error);
    return null;
  }
}

export async function fetchServicioEstadisticas(
  servicioId: string,
  meses: number = 6
): Promise<CatalogoServicioEstadisticas | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/servicios/catalogo/${servicioId}/estadisticas?meses=${meses}`,
      {
        next: { revalidate: 300, tags: [`servicio-${servicioId}-stats`] },
      }
    );

    if (!response.ok) {
      console.error('[fetchServicioEstadisticas] Error fetching estadisticas:', response.statusText);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('[fetchServicioEstadisticas] Error:', error);
    return null;
  }
}

export async function fetchAllServicioData(servicioId: string, meses: number = 6) {
  const [servicio, estadisticas] = await Promise.all([
    fetchServicioData(servicioId),
    fetchServicioEstadisticas(servicioId, meses),
  ]);

  return { servicio, estadisticas };
}
