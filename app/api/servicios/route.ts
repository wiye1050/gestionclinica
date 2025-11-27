import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createServicioAsignado, getServiciosModuleSerialized } from '@/lib/server/servicios';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

type CreateServicioInput = {
  catalogoServicioId: string;
  grupoId: string;
  tiquet?: string;
  profesionalPrincipalId: string;
  profesionalSegundaOpcionId?: string;
  profesionalTerceraOpcionId?: string;
  requiereApoyo?: boolean;
  sala?: string;
  supervision?: boolean;
  esActual?: boolean;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const serialized = await getServiciosModuleSerialized();
    return NextResponse.json(serialized);
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
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
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
