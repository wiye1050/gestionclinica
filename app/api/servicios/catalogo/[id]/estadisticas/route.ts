import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { getEstadisticasServicioCatalogo } from '@/lib/server/serviciosStats';

const limiter = rateLimit(RATE_LIMIT_STRICT);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/servicios/catalogo/[id]/estadisticas
 * Obtiene estadísticas completas de un servicio del catálogo
 *
 * Query params opcionales:
 * - meses: número de meses de histórico (default: 6)
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
    const { searchParams } = new URL(request.url);
    const meses = parseInt(searchParams.get('meses') || '6', 10);

    const estadisticas = await getEstadisticasServicioCatalogo(id, meses);

    if (!estadisticas) {
      return NextResponse.json(
        { error: 'No se pudieron obtener las estadísticas del servicio' },
        { status: 404 }
      );
    }

    return NextResponse.json(estadisticas, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
