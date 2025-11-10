import KPIsPageClient from './KPIsPageClient';
import { getServerKPIs } from '@/lib/server/kpis';

export default async function KPIsPage() {
  const initialData = await getServerKPIs();
  return <KPIsPageClient initialData={initialData} />;
}
