import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { createProfesional, getSerializedProfesionales } from '@/lib/server/profesionales';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { validateRequest } from '@/lib/utils/apiValidation';
import { createProfesionalSchema } from '@/lib/validators';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function GET(request: NextRequest) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) ? limitParam : 400;

  try {
    const items = await getSerializedProfesionales(limit);
    return NextResponse.json({ items, count: items.length, limit });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
  const validation = await validateRequest(request, createProfesionalSchema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const result = await createProfesional(validation.data, { userId: user.uid, userEmail: user.email ?? undefined });
    revalidateTag('profesionales');
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
