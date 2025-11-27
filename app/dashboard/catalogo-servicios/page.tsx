import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import CatalogoServiciosClient from './CatalogoServiciosClient';
import { deserializeCatalogoServicio, type SerializedCatalogoServicio } from '@/lib/utils/catalogoServicios';
import { deserializeProfesionales, type ApiProfesional } from '@/lib/utils/profesionales';
import { serverFetchGet } from '@/lib/utils/serverFetch';

export default async function CatalogoServiciosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const [serviciosPayload, profesionalesPayload] = await Promise.all([
    serverFetchGet<{ servicios: SerializedCatalogoServicio[] }>(
      '/api/catalogo-servicios',
      'catalogo-servicios-page',
      'fetch-catalogo-servicios'
    ),
    serverFetchGet<{ items: ApiProfesional[] }>(
      '/api/profesionales?limit=400',
      'catalogo-servicios-page',
      'fetch-profesionales'
    ),
  ]);

  const serviciosRaw = serviciosPayload?.servicios ?? [];
  const profesionalesRaw = profesionalesPayload?.items ?? [];

  const initialServicios = serviciosRaw.map(deserializeCatalogoServicio);
  const initialProfesionales = deserializeProfesionales(profesionalesRaw);

  return (
    <CatalogoServiciosClient
      initialServicios={initialServicios}
      initialProfesionales={initialProfesionales}
    />
  );
}
