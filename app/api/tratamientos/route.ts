import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { createTratamiento, getSerializedTratamientos, getSerializedCatalogoServicios } from '@/lib/server/tratamientos';
import { validateRequest } from '@/lib/utils/apiValidation';
import { createTratamientoSchema } from '@/lib/validators';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const [tratamientos, catalogo] = await Promise.all([
      getSerializedTratamientos(),
      getSerializedCatalogoServicios(),
    ]);
    return NextResponse.json({ tratamientos, catalogo });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  // Validar request con Zod
  const validation = await validateRequest(request, createTratamientoSchema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const result = await createTratamiento(validation.data, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
