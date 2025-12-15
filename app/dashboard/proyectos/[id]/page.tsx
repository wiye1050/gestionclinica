import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import ProyectoDetailClient from './ProyectoDetailClient';
import { Suspense } from 'react';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';
import { fetchAllProyectoData } from './data';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component for proyecto detail page
 *
 * Performance optimizations:
 * - Pre-fetches all data on the server (parallel requests)
 * - Passes initialData to client to avoid client-side fetch on mount
 * - Server-side authentication (more secure)
 * - HTML rendered with data on server (better SEO, faster FCP)
 * - Revalidation strategy for ISR (cache with smart invalidation)
 */

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

export default async function ProyectoDetallePage({ params }: PageProps) {
  // Authenticate on server
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Get proyecto ID from params
  const resolvedParams = await params;
  const proyectoId = resolvedParams.id;

  // Pre-fetch all data in parallel on the server
  const { proyecto, estadisticas } = await fetchAllProyectoData(proyectoId);

  // If proyecto doesn't exist, redirect to proyectos list
  if (!proyecto) {
    redirect('/dashboard/proyectos');
  }

  return (
    <Suspense fallback={<TabLoadingFallback message="Cargando información del proyecto..." />}>
      <ProyectoDetailClient proyectoData={proyecto} estadisticas={estadisticas} />
    </Suspense>
  );
}
