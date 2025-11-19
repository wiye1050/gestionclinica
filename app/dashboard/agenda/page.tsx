import { startOfWeek } from 'date-fns';
import { AgendaClientWrapper } from './AgendaClient';
import { getSerializedAgendaEvents } from '@/lib/server/agenda';

interface AgendaPageProps {
  searchParams?: {
    newEvent?: string;
    pacienteId?: string;
    pacienteNombre?: string;
    profesionalId?: string;
    view?: string;
    profesionales?: string;
  };
}

export default async function AgendaPage({ searchParams = {} }: AgendaPageProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const initialEvents = await getSerializedAgendaEvents(weekStart);

  const viewParam = searchParams.view;
  const forcedView =
    viewParam === 'diaria' ||
    viewParam === 'semanal' ||
    viewParam === 'multi' ||
    viewParam === 'boxes' ||
    viewParam === 'paciente'
      ? viewParam
      : undefined;

  const presetProfesionales =
    typeof searchParams.profesionales === 'string'
      ? searchParams.profesionales
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean)
      : undefined;

  const prefillRequest = {
    openModal: searchParams.newEvent === '1',
    pacienteId: typeof searchParams.pacienteId === 'string' ? searchParams.pacienteId : undefined,
    pacienteNombre:
      typeof searchParams.pacienteNombre === 'string' ? searchParams.pacienteNombre : undefined,
    profesionalId:
      typeof searchParams.profesionalId === 'string' ? searchParams.profesionalId : undefined,
    forcedView,
    presetProfesionales,
  };

  return (
    <AgendaClientWrapper
      initialWeekStart={weekStart.toISOString()}
      initialEvents={initialEvents}
      prefillRequest={prefillRequest}
    />
  );
}
