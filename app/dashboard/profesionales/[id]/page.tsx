import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import ProfesionalDetailClient from './ProfesionalDetailClient';
import { Suspense } from 'react';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';
import { fetchAllProfesionalData } from './data';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component for professional detail page
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

export default async function ProfesionalDetallePage({ params }: PageProps) {
  // Authenticate on server
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Get professional ID from params
  const resolvedParams = await params;
  const profesionalId = resolvedParams.id;

  // Pre-fetch all data in parallel on the server
  const { profesional, estadisticas } = await fetchAllProfesionalData(profesionalId);

  // If professional doesn't exist, redirect to professionals list
  if (!profesional) {
    redirect('/dashboard/profesionales');
  }

  return (
    <Suspense fallback={<TabLoadingFallback message="Cargando información del profesional..." />}>
      <ProfesionalDetailClient profesional={profesional} estadisticas={estadisticas} />
    </Suspense>
  );
}
