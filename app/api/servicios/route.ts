import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createServicioAsignado, type CreateServicioInput } from '@/lib/server/servicios';

const ALLOWED_ROLES = new Set(['admin', 'coordinador']);

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
    const body = (await request.json()) as Partial<CreateServicioInput>;
    if (!body.catalogoServicioId || !body.grupoId || !body.profesionalPrincipalId) {
      return NextResponse.json(
        { error: 'Faltan datos obligatorios (servicio, grupo o profesional principal).' },
        { status: 400 }
      );
    }

    const result = await createServicioAsignado({
      catalogoServicioId: body.catalogoServicioId,
      grupoId: body.grupoId,
      tiquet: body.tiquet ?? 'NO',
      profesionalPrincipalId: body.profesionalPrincipalId,
      profesionalSegundaOpcionId: body.profesionalSegundaOpcionId || null,
      profesionalTerceraOpcionId: body.profesionalTerceraOpcionId || null,
      requiereApoyo: body.requiereApoyo ?? false,
      sala: body.sala ?? '',
      supervision: body.supervision ?? false,
      esActual: body.esActual ?? false,
      creadoPor: user.email ?? 'desconocido',
      creadoPorId: user.uid,
    });

    return NextResponse.json({ id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = error instanceof Error && error.name === 'NotFoundError' ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
