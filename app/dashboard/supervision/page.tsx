import SupervisionClient from './SupervisionClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { deserializeSupervisionModule, type SerializedSupervisionModule } from '@/lib/utils/supervision';
import { headers, cookies } from 'next/headers';

async function fetchSupervisionModule(): Promise<SerializedSupervisionModule | null> {
  const headerStore = headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = cookies().toString();

  try {
    const response = await fetch(`${baseUrl}/api/supervision`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as SerializedSupervisionModule;
  } catch (error) {
    console.error('[supervision] No se pudo precargar el módulo', error);
    return null;
  }
}

export default async function SupervisionPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const serialized = await fetchSupervisionModule();
  const { evaluaciones, servicios, profesionales, grupos } = serialized
    ? deserializeSupervisionModule(serialized)
    : { evaluaciones: [], servicios: [], profesionales: [], grupos: [] };

  return (
    <SupervisionClient
      evaluaciones={evaluaciones}
      servicios={servicios}
      profesionales={profesionales}
      grupos={grupos}
    />
  );
}
