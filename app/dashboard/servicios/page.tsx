import ServiciosClient from './ServiciosClient';
import { deserializeServiciosModule, type SerializedServiciosModule } from '@/lib/utils/servicios';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { serverFetchGet } from '@/lib/utils/serverFetch';

export default async function ServiciosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const serialized = await serverFetchGet<SerializedServiciosModule>(
    '/api/servicios',
    'servicios-page',
    'fetch-servicios-module'
  );
  const { servicios, profesionales, grupos, catalogo } = serialized
    ? deserializeServiciosModule(serialized)
    : { servicios: [], profesionales: [], grupos: [], catalogo: [] };

  return (
    <ServiciosClient
      initialServicios={servicios}
      initialProfesionales={profesionales}
      initialGrupos={grupos}
      initialCatalogo={catalogo}
    />
  );
}
