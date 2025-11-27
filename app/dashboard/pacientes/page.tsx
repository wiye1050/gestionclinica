import { cookies, headers } from 'next/headers';
import PacientesClient from './PacientesClient';
import { deserializePaciente, type ApiPaciente } from '@/lib/utils/pacientes';
import type { PacientesResult } from '@/lib/hooks/usePacientes';

async function fetchInitialPacientes(): Promise<PacientesResult> {
  const headerStore = headers();
  const host = headerStore.get('host');
  const protocol = headerStore.get('x-forwarded-proto') ?? 'http';
  const baseUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
  const cookieHeader = cookies().toString();

  try {
    const response = await fetch(`${baseUrl}/api/pacientes?limit=100`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      cache: 'no-store',
    });

    if (!response.ok) {
      return { items: [], nextCursor: null, limit: 0 };
    }

    const payload = await response.json();
    const rawItems = Array.isArray(payload?.items) ? (payload.items as ApiPaciente[]) : [];
    const nextCursor = typeof payload?.nextCursor === 'string' ? payload.nextCursor : null;
    const limit = typeof payload?.limit === 'number' ? payload.limit : rawItems.length;

    return {
      items: rawItems.map(deserializePaciente),
      nextCursor,
      limit,
    };
  } catch (error) {
    console.error('[pacientes] No se pudieron precargar pacientes', error);
    return { items: [], nextCursor: null, limit: 0 };
  }
}

export default async function PacientesPage() {
  const initialPage = await fetchInitialPacientes();
  return <PacientesClient initialPage={initialPage} />;
}
