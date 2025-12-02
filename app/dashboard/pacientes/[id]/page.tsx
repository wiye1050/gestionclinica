import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import PatientDetailClient from './PatientDetailClient';
import { Suspense } from 'react';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component for patient detail page
 * Handles authentication and renders the client component
 *
 * Benefits of Server Component approach:
 * - Authentication happens on server (more secure)
 * - Initial HTML is rendered on server (better SEO, faster FCP)
 * - Data can be pre-fetched and cached
 * - Reduces client-side JavaScript bundle
 */
export default async function PacienteDetallePage({ params }: PageProps) {
  // Authenticate on server
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Get patient ID from params
  const resolvedParams = await params;
  const pacienteId = resolvedParams.id;

  return (
    <Suspense fallback={<TabLoadingFallback message="Cargando informacion del paciente..." />}>
      <PatientDetailClient pacienteId={pacienteId} />
    </Suspense>
  );
}
