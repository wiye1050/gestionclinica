import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { getEstadisticasProfesional } from '@/lib/server/profesionalesStats';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_STRICT);

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/profesionales/[id]/estadisticas
 * Obtiene estadísticas detalladas de un profesional
 *
 * Query params:
 * - mesesAtras: número de meses hacia atrás para calcular estadísticas (default: 3)
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
    const { searchParams } = new URL(request.url);

    // Parsear parámetro de meses (default: 3, min: 1, max: 12)
    const mesesParam = searchParams.get('mesesAtras');
    const mesesAtras = mesesParam ? Math.min(Math.max(parseInt(mesesParam, 10), 1), 12) : 3;

    const estadisticas = await getEstadisticasProfesional(id, mesesAtras);

    if (!estadisticas) {
      return NextResponse.json({ error: 'Profesional no encontrado' }, { status: 404 });
    }

    return NextResponse.json(estadisticas);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
