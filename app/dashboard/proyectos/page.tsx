import ProyectosClient from './ProyectosClient';
import { deserializeProyectos, getSerializedProyectos } from '@/lib/server/proyectos';

export default async function ProyectosPage() {
  const serialized = await getSerializedProyectos();
  const initialProyectos = deserializeProyectos(serialized);

  return <ProyectosClient initialProyectos={initialProyectos} />;
}
