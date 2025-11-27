import DashboardPageClient from './DashboardPageClient';
import { getServerKPIs } from '@/lib/server/kpis';

export default async function DashboardPage() {
  const initialKPIs = await getServerKPIs();
  return <DashboardPageClient initialKPIs={initialKPIs} />;
}
