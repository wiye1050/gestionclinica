import NuevaPlantillaClient from './NuevaPlantillaClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';

export const metadata = {
  title: 'Nueva Plantilla de Formulario - Gestión Clínica',
  description: 'Crear nueva plantilla de formulario clínico',
};

export default async function NuevaPlantillaPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  return (
    <ModuleErrorBoundary moduleName="Nueva Plantilla">
      <NuevaPlantillaClient userId={user.uid} _userName={user.displayName || user.email || ''} />
    </ModuleErrorBoundary>
  );
}
