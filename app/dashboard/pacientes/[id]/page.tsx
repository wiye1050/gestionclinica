import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import PatientDetailClient from './PatientDetailClient';
import { Suspense } from 'react';
import { TabLoadingFallback } from '@/components/pacientes/TabLoadingFallback';
import { fetchAllPatientData } from './data';

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server Component for patient detail page
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

// Generate static params for common patient IDs (optional, for static generation)
// export async function generateStaticParams() {
//   // Could fetch most common patient IDs here
//   return [];
// }

export default async function PacienteDetallePage({ params }: PageProps) {
  // Authenticate on server
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  // Get patient ID from params
  const resolvedParams = await params;
  const pacienteId = resolvedParams.id;

  // Pre-fetch all data in parallel on the server
  // This reduces client-side loading time significantly
  const { detailData, profesionales, formResponses } = await fetchAllPatientData(pacienteId);

  // If patient doesn't exist, redirect to patients list
  if (!detailData) {
    redirect('/dashboard/pacientes');
  }

  return (
    <Suspense fallback={<TabLoadingFallback message="Cargando informacion del paciente..." />}>
      <PatientDetailClient
        pacienteId={pacienteId}
        initialDetailData={detailData}
        initialProfesionales={profesionales}
        initialFormResponses={formResponses}
      />
    </Suspense>
  );
}
