import ProyectosClient from './ProyectosClient';
import { deserializeProyectos, getSerializedProyectos } from '@/lib/server/proyectos';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function ProyectosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const serialized = await getSerializedProyectos();
  const initialProyectos = deserializeProyectos(serialized);

  return <ProyectosClient initialProyectos={initialProyectos} />;
}
