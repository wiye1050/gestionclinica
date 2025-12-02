import DetallePlantillaClient from './DetallePlantillaClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { serverFetchGet } from '@/lib/utils/serverFetch';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { FormularioPlantilla, RespuestaFormulario } from '@/types';

export const metadata = {
  title: 'Detalle de Formulario - Gestión Clínica',
  description: 'Detalles de plantilla de formulario clínico',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetallePlantillaPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const resolvedParams = await params;
  const plantillaId = resolvedParams.id;

  // Cargar plantilla específica usando el nuevo endpoint
  const plantilla = await serverFetchGet<FormularioPlantilla>(
    `/api/formularios/${plantillaId}`,
    `formulario-detalle-${plantillaId}`,
    'fetch-plantilla-detalle'
  );

  if (!plantilla) {
    redirect('/dashboard/formularios');
  }

  // Cargar respuestas de esta plantilla
  const respuestas = await serverFetchGet<RespuestaFormulario[]>(
    `/api/formularios/respuestas?formularioPlantillaId=${plantillaId}&limit=100`,
    `formulario-respuestas-${plantillaId}`,
    'fetch-respuestas-plantilla'
  );

  return (
    <ModuleErrorBoundary moduleName="Detalle Formulario">
      <DetallePlantillaClient
        plantilla={plantilla}
        respuestas={respuestas || []}
      />
    </ModuleErrorBoundary>
  );
}
