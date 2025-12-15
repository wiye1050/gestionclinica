import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import {
  getProfesionalById,
  updateProfesional,
  deleteProfesional,
} from '@/lib/server/profesionales';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { validateRequest } from '@/lib/utils/apiValidation';
import { updateProfesionalSchema } from '@/lib/validators';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_STRICT);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/profesionales/[id]
 * Obtiene los detalles completos de un profesional
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const profesional = await getProfesionalById(id);

    if (!profesional) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
    }

    return NextResponse.json(profesional);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/profesionales/[id]
 * Actualiza un profesional existente
 */
export async function PUT(request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;
    const validation = await validateRequest(request, updateProfesionalSchema);

    if (!validation.success) {
      return validation.error;
    }

    await updateProfesional(id, validation.data, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidateTag('profesionales');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = message.includes('no existe') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/profesionales/[id]
 * Elimina un profesional
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!hasAnyRole(user.roles, API_ROLES.ADMIN_ONLY)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await deleteProfesional(id, {
      userId: user.uid,
      userEmail: user.email ?? undefined,
    });

    revalidateTag('profesionales');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = message.includes('no existe') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
