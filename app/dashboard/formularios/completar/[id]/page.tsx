import CompletarFormularioClient from './CompletarFormularioClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { serverFetchGet } from '@/lib/utils/serverFetch';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { FormularioPlantilla, RespuestaFormulario, Paciente } from '@/types';

export const metadata = {
  title: 'Completar Formulario - Gestion Clinica',
  description: 'Completar formulario clinico para paciente',
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pacienteId?: string }>;
}

export default async function CompletarFormularioPage({ params, searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const respuestaId = resolvedParams.id;
  const pacienteId = resolvedSearchParams.pacienteId;

  // Cargar la respuesta (que debe estar en estado borrador)
  const respuesta = await serverFetchGet<RespuestaFormulario>(
    `/api/formularios/respuestas/${respuestaId}`,
    `formulario-respuesta-${respuestaId}`,
    'fetch-respuesta-completar'
  );

  if (!respuesta) {
    redirect('/dashboard/formularios');
  }

  // Cargar la plantilla
  const plantilla = await serverFetchGet<FormularioPlantilla>(
    `/api/formularios/${respuesta.formularioPlantillaId}`,
    `formulario-plantilla-${respuesta.formularioPlantillaId}`,
    'fetch-plantilla-completar'
  );

  if (!plantilla) {
    redirect('/dashboard/formularios');
  }

  // Cargar datos del paciente
  const paciente = await serverFetchGet<Paciente>(
    `/api/pacientes/${respuesta.pacienteId}`,
    `paciente-${respuesta.pacienteId}`,
    'fetch-paciente-completar'
  );

  if (!paciente) {
    redirect('/dashboard/formularios');
  }

  return (
    <ModuleErrorBoundary moduleName="Completar Formulario">
      <CompletarFormularioClient
        plantilla={plantilla}
        respuesta={respuesta}
        paciente={paciente}
        userId={user.uid}
      />
    </ModuleErrorBoundary>
  );
}
