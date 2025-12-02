import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createServicioAsignado, getServiciosModuleSerialized } from '@/lib/server/servicios';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { validateRequest } from '@/lib/utils/apiValidation';
import { createServicioSchema } from '@/lib/validators';

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

  // Validar request con Zod
  const validation = await validateRequest(request, createServicioSchema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const data = validation.data;

    const result = await createServicioAsignado({
      catalogoServicioId: data.catalogoServicioId,
      grupoId: data.grupoId,
      tiquet: data.tiquet,
      profesionalPrincipalId: data.profesionalPrincipalId,
      profesionalSegundaOpcionId: data.profesionalSegundaOpcionId || null,
      profesionalTerceraOpcionId: data.profesionalTerceraOpcionId || null,
      requiereApoyo: data.requiereApoyo,
      sala: data.sala ?? '',
      supervision: data.supervision,
      esActual: data.esActual,
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
