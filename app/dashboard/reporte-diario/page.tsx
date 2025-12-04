import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import ReporteDiarioClient from './ReporteDiarioClient';
import { getSerializedDailyReports } from '@/lib/server/reports';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';

export default async function ReporteDiarioPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const initialReports = await getSerializedDailyReports();

  return (
    <ModuleErrorBoundary moduleName="Reporte Diario">
      <ReporteDiarioClient initialReports={initialReports} />
    </ModuleErrorBoundary>
  );
}
