import ReporteDiarioClient from './ReporteDiarioClient';
import { getSerializedDailyReports } from '@/lib/server/reports';

export default async function ReporteDiarioPage() {
  const initialReports = await getSerializedDailyReports();
  return <ReporteDiarioClient initialReports={initialReports} />;
}
