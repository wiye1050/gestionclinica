import KPIsPageClient from './KPIsPageClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { type KPIResponse } from '@/lib/server/kpis';
import { serverFetchGet } from '@/lib/utils/serverFetch';

export default async function KPIsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const initialData = await serverFetchGet<KPIResponse>('/api/kpis', 'kpis-page', 'fetch-kpis');

  return <KPIsPageClient initialData={initialData} />;
}
