import FormulariosClient from './FormulariosClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { serverFetchGet } from '@/lib/utils/serverFetch';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { FormularioPlantilla, RespuestaFormulario } from '@/types';

export const metadata = {
  title: 'Formularios - Gestión Clínica',
  description: 'Gestión de formularios clínicos y respuestas de pacientes',
};

export default async function FormulariosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Cargar plantillas de formularios
  const plantillas = await serverFetchGet<FormularioPlantilla[]>(
    '/api/formularios',
    'formularios-page',
    'fetch-plantillas'
  );

  // Cargar respuestas recientes (últimas 50)
  const respuestasRecientes = await serverFetchGet<RespuestaFormulario[]>(
    '/api/formularios/respuestas?limit=50',
    'formularios-page',
    'fetch-respuestas-recientes'
  );

  return (
    <ModuleErrorBoundary moduleName="Formularios">
      <FormulariosClient
        initialPlantillas={plantillas || []}
        initialRespuestas={respuestasRecientes || []}
      />
    </ModuleErrorBoundary>
  );
}
