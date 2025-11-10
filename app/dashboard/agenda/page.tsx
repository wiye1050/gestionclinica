import { startOfWeek } from 'date-fns';
import { AgendaClientWrapper } from './AgendaClient';
import { getSerializedAgendaEvents } from '@/lib/server/agenda';

export default async function AgendaPage() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const initialEvents = await getSerializedAgendaEvents(weekStart);

  return (
    <AgendaClientWrapper
      initialWeekStart={weekStart.toISOString()}
      initialEvents={initialEvents}
    />
  );
}
