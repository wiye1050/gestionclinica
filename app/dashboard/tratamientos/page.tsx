import { headers, cookies } from 'next/headers';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import TratamientosClient from './TratamientosClient';
import { deserializeTratamientosModule, type SerializedTratamientosModule } from '@/lib/utils/tratamientos';

async function fetchTratamientosModule(): Promise<SerializedTratamientosModule | null> {
  const headerStore = headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = cookies().toString();

  try {
    const response = await fetch(`${baseUrl}/api/tratamientos`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as SerializedTratamientosModule;
  } catch (error) {
    console.error('[tratamientos] No se pudieron precargar datos', error);
    return null;
  }
}

export default async function TratamientosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const serialized = await fetchTratamientosModule();
  const initialModule = serialized
    ? deserializeTratamientosModule(serialized)
    : { tratamientos: [], catalogo: [] };

  return <TratamientosClient initialModule={initialModule} />;
}
