import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getSerializedAgendaEvents } from '@/lib/server/agenda';
import { startOfWeek } from 'date-fns';

const VIEW_ROLES = new Set(['admin', 'coordinador', 'profesional']);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const hasAccess = (user.roles ?? []).some((role) => VIEW_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get('weekStart');
  const parsedDate = weekStartParam ? new Date(weekStartParam) : new Date();
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'weekStart inválido' }, { status: 400 });
  }
  const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 });

  try {
    const events = await getSerializedAgendaEvents(weekStart);
    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
