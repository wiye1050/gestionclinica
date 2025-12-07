import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { getServerKPIs } from '@/lib/server/kpis';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
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
    const data = await getServerKPIs();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
