import KPIsPageClient from './KPIsPageClient';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { type KPIResponse } from '@/lib/server/kpis';

export default async function KPIsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const headerStore = headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = cookies().toString();

  const initialData = await (async () => {
    try {
      const response = await fetch(`${baseUrl}/api/kpis`, {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) {
        console.error('[kpis-page] No se pudieron precargar KPIs', {
          status: response.status,
          error: payload?.error ?? 'sin-detalle',
        });
        return null;
      }
      return payload as KPIResponse;
    } catch (error) {
      console.error('[kpis-page] Error inesperado obteniendo KPIs', error);
      return null;
    }
  })();

  return <KPIsPageClient initialData={initialData} />;
}
