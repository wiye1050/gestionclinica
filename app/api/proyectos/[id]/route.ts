import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import type { AppRole } from '@/lib/auth/roles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { getProyectoById } from '@/lib/server/proyectos';
import { updateProyecto, deleteProyecto } from '@/lib/server/proyectosAdmin';

const limiter = rateLimit(RATE_LIMIT_STRICT);

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureAuth(requiredRoles: Set<AppRole>) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!hasAnyRole(user.roles, requiredRoles)) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
}

/**
 * GET /api/proyectos/[id]
 * Obtiene los detalles completos de un proyecto
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth(API_ROLES.READ);
  if ('error' in auth) return auth.error;

  try {
    const { id } = await context.params;
    const proyecto = await getProyectoById(id);

    if (!proyecto) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    return NextResponse.json(proyecto);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/proyectos/[id]
 * Actualiza un proyecto existente
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth(API_ROLES.WRITE);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const { id } = await context.params;
    const body = await request.json();
    await updateProyecto(id, body, { uid: user.uid, email: user.email });

    revalidateTag('proyectos');
    revalidateTag(`proyecto-${id}`);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * DELETE /api/proyectos/[id]
 * Elimina un proyecto
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth(API_ROLES.ADMIN_ONLY);
  if ('error' in auth) return auth.error;
  const { user } = auth;

  try {
    const { id } = await context.params;
    await deleteProyecto(id, { uid: user.uid, email: user.email });

    revalidateTag('proyectos');

    return NextResponse.json({ success: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
