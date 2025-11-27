import KPIsPageClient from './KPIsPageClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { type KPIResponse } from '@/lib/server/kpis';
import { captureError } from '@/lib/utils/errorLogging';

export default async function KPIsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const headerStore = await headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = (await cookies()).toString();

  const initialData = await (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/kpis`, {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) {
        captureError(
          new Error(payload?.error ?? 'No se pudieron precargar KPIs'),
          { module: 'kpis-page', action: 'fetch-kpis', metadata: { status: response.status } }
        );
        return null;
      }
      return payload as KPIResponse;
    } catch (error) {
      captureError(error, { module: 'kpis-page', action: 'fetch-kpis' });
      return null;
    }
  })();

  return <KPIsPageClient initialData={initialData} />;
}
