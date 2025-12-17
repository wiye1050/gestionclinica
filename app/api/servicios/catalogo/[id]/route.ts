import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { getCatalogoServicioById } from '@/lib/server/servicios';

const limiter = rateLimit(RATE_LIMIT_STRICT);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/servicios/catalogo/[id]
 * Obtiene un servicio del catálogo por su ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  // Rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  // Auth
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const catalogoServicio = await getCatalogoServicioById(id);

    if (!catalogoServicio) {
      return NextResponse.json(
        { error: 'Servicio no encontrado en el catálogo' },
        { status: 404 }
      );
    }

    return NextResponse.json(catalogoServicio);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
