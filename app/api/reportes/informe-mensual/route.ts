import { NextResponse, type NextRequest } from 'next/server';
import { getMonthlyReportData } from '@/lib/server/informes';
import { getCurrentUser } from '@/lib/auth/server';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { logger } from '@/lib/utils/logger';
import { generateInformeMensualSchema } from '@/lib/validators';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    const allowedRoles = new Set(['admin', 'coordinador']);
    const hasAccess = (currentUser.roles ?? []).some((role) => allowedRoles.has(role));
    if (!hasAccess) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));

    // Validar con Zod
    const validation = generateInformeMensualSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Parámetros inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { año: year, mes: month } = validation.data;
    const data = await getMonthlyReportData(year, month);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('[informe-mensual] Error al generar datos', error as Error);
    return NextResponse.json(
      { error: 'No se pudo generar el informe mensual' },
      { status: 500 }
    );
  }
}
