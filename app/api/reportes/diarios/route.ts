import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { createDailyReport, getSerializedDailyReports } from '@/lib/server/reports';

const ALLOWED_ROLES = new Set(['admin', 'coordinador', 'profesional']);
const VIEW_ROLES = new Set(['admin', 'coordinador', 'profesional', 'operador']);

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
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? limitParam : 200;

  try {
    const items = await getSerializedDailyReports(limit);
    return NextResponse.json({ items, limit, count: items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.descripcion) {
      return NextResponse.json({ error: 'La descripción es obligatoria.' }, { status: 400 });
    }

    const result = await createDailyReport({
      tipo: body.tipo ?? 'incidencia',
      categoria: body.categoria ?? 'personal',
      prioridad: body.prioridad ?? 'media',
      responsable: body.responsable ?? 'coordinador',
      descripcion: body.descripcion,
      accionInmediata: body.accionInmediata ?? '',
      requiereSeguimiento: Boolean(body.requiereSeguimiento),
      reportadoPor: user.email ?? 'desconocido',
      reportadoPorId: user.uid,
      fecha: body.fecha,
      hora: body.hora,
    });
    revalidateTag('reports');
    revalidateTag('reports-daily');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
