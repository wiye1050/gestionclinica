import ProyectosClient from './ProyectosClient';
import { deserializeProyectos, getSerializedProyectos } from '@/lib/server/proyectos';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';

export default async function ProyectosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const serialized = await getSerializedProyectos();
  const initialProyectos = deserializeProyectos(serialized);

  return (
    <ModuleErrorBoundary moduleName="Proyectos">
      <ProyectosClient initialProyectos={initialProyectos} />
    </ModuleErrorBoundary>
  );
}
