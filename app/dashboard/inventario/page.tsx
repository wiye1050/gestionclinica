import InventarioClient from './InventarioClient';
import { getInventarioSnapshot } from '@/lib/server/inventario';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';

export default async function InventarioPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const snapshot = await getInventarioSnapshot();
  return <InventarioClient initialData={snapshot} />;
}
