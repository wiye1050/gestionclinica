import { headers, cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import CatalogoServiciosClient from './CatalogoServiciosClient';
import { deserializeCatalogoServicio, type SerializedCatalogoServicio } from '@/lib/utils/catalogoServicios';
import { deserializeProfesionales, type ApiProfesional } from '@/lib/utils/profesionales';
import { captureError } from '@/lib/utils/errorLogging';

async function fetchCatalogoServicios(): Promise<SerializedCatalogoServicio[]> {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${baseUrl}/api/catalogo-servicios`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.servicios) ? (payload.servicios as SerializedCatalogoServicio[]) : [];
  } catch (error) {
    captureError(error, { module: 'catalogo-servicios-page', action: 'fetch-catalogo-servicios' });
    return [];
  }
}

async function fetchProfesionales(): Promise<ApiProfesional[]> {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${baseUrl}/api/profesionales?limit=400`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload?.items) ? (payload.items as ApiProfesional[]) : [];
  } catch (error) {
    captureError(error, { module: 'catalogo-servicios-page', action: 'fetch-profesionales' });
    return [];
  }
}

export default async function CatalogoServiciosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const [serviciosRaw, profesionalesRaw] = await Promise.all([
    fetchCatalogoServicios(),
    fetchProfesionales(),
  ]);

  const initialServicios = serviciosRaw.map(deserializeCatalogoServicio);
  const initialProfesionales = deserializeProfesionales(profesionalesRaw);

  return (
    <CatalogoServiciosClient
      initialServicios={initialServicios}
      initialProfesionales={initialProfesionales}
    />
  );
}
