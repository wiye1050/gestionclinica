import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { fetchAllServicioData } from './data';
import ServicioDetailClient from './ServicioDetailClient';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';

type PageProps = {
  params: Promise<{ id: string }>;
};

// Revalidar cada 60 segundos (ISR)
export const revalidate = 60;

export default async function ServicioDetallePage({ params }: PageProps) {
  // 1. Check auth
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // 2. Get servicio ID
  const { id } = await params;

  // 3. Fetch all data in parallel
  const { servicio, estadisticas } = await fetchAllServicioData(id);

  // 4. Redirect if servicio not found
  if (!servicio) {
    redirect('/dashboard/servicios');
  }

  // 5. Render
  return (
    <Suspense fallback={<TabLoadingFallback message="Cargando información del servicio..." />}>
      <ServicioDetailClient servicioData={servicio} estadisticas={estadisticas} />
    </Suspense>
  );
}
