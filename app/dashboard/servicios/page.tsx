import { cookies, headers } from 'next/headers';
import ServiciosClient from './ServiciosClient';
import { deserializeServiciosModule, type SerializedServiciosModule } from '@/lib/utils/servicios';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

async function fetchServiciosModule(): Promise<SerializedServiciosModule | null> {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${baseUrl}/api/servicios`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as SerializedServiciosModule;
  } catch (error) {
    console.error('[servicios] No se pudo precargar el módulo', error);
    return null;
  }
}

export default async function ServiciosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const serialized = await fetchServiciosModule();
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
