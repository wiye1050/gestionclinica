import EditarPlantillaClient from './EditarPlantillaClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { serverFetchGet } from '@/lib/utils/serverFetch';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { FormularioPlantilla } from '@/types';

export const metadata = {
  title: 'Editar Formulario - Gestión Clínica',
  description: 'Editar plantilla de formulario clínico',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPlantillaPage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const resolvedParams = await params;
  const plantillaId = resolvedParams.id;

  // Cargar plantilla específica
  const plantillas = await serverFetchGet<FormularioPlantilla[]>(
    '/api/formularios',
    `formulario-editar-${plantillaId}`,
    'fetch-plantilla-editar'
  );

  const plantilla = plantillas?.find(p => p.id === plantillaId);

  if (!plantilla) {
    redirect('/dashboard/formularios');
  }

  return (
    <ModuleErrorBoundary moduleName="Editar Formulario">
      <EditarPlantillaClient
        plantilla={plantilla}
        userId={user.uid}
      />
    </ModuleErrorBoundary>
  );
}
