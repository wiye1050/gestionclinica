import InventarioClient from './InventarioClient';
import { getInventarioSnapshot } from '@/lib/server/inventario';

export default async function InventarioPage() {
  const snapshot = await getInventarioSnapshot();
  return <InventarioClient initialData={snapshot} />;
}
