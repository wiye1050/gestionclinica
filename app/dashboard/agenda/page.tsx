import { startOfWeek } from 'date-fns';
import { AgendaClientWrapper, type VistaAgenda } from './AgendaClient';
import { getSerializedAgendaEvents } from '@/lib/server/agenda';
import { getCurrentUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { ModuleErrorBoundary } from '@/components/ui/ErrorBoundary';

type AgendaSearchParams = {
  newEvent?: string;
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId?: string;
  view?: string;
  profesionales?: string;
  date?: string;
};

interface AgendaPageProps {
  searchParams?: Promise<AgendaSearchParams>;
}

const isVistaAgenda = (value?: string): value is VistaAgenda =>
  value === 'diaria' ||
  value === 'semanal' ||
  value === 'multi' ||
  value === 'boxes' ||
  value === 'paciente';

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }
  const resolvedSearchParams = (await searchParams) ?? {};
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const initialEvents = await getSerializedAgendaEvents(weekStart);

  const viewParam = resolvedSearchParams.view;
  const forcedView = isVistaAgenda(viewParam) ? viewParam : undefined;

  const presetProfesionales =
    typeof resolvedSearchParams.profesionales === 'string'
      ? resolvedSearchParams.profesionales
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;

  const targetDateIso =
    typeof resolvedSearchParams.date === 'string'
      ? new Date(resolvedSearchParams.date)
      : undefined;

  const prefillRequest = {
    openModal: resolvedSearchParams.newEvent === '1',
    pacienteId:
      typeof resolvedSearchParams.pacienteId === 'string'
        ? resolvedSearchParams.pacienteId
        : undefined,
    pacienteNombre:
      typeof resolvedSearchParams.pacienteNombre === 'string'
        ? resolvedSearchParams.pacienteNombre
        : undefined,
    profesionalId:
      typeof resolvedSearchParams.profesionalId === 'string'
        ? resolvedSearchParams.profesionalId
        : undefined,
    forcedView,
    presetProfesionales,
    targetDate:
      targetDateIso && !Number.isNaN(targetDateIso.getTime()) ? targetDateIso.toISOString() : undefined,
  };

  return (
    <ModuleErrorBoundary moduleName="Agenda">
      <AgendaClientWrapper
        initialWeekStart={weekStart.toISOString()}
        initialEvents={initialEvents}
        prefillRequest={prefillRequest}
      />
    </ModuleErrorBoundary>
  );
}
