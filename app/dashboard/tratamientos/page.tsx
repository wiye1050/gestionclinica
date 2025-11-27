import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import TratamientosClient from './TratamientosClient';
import { deserializeTratamientosModule, type SerializedTratamientosModule } from '@/lib/utils/tratamientos';
import { serverFetchGet } from '@/lib/utils/serverFetch';

export default async function TratamientosPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const serialized = await serverFetchGet<SerializedTratamientosModule>(
    '/api/tratamientos',
    'tratamientos-page',
    'fetch-tratamientos-module'
  );
  const initialModule = serialized
    ? deserializeTratamientosModule(serialized)
    : { tratamientos: [], catalogo: [] };

  return <TratamientosClient initialModule={initialModule} />;
}
