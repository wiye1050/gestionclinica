import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { addPacienteHistorial } from '@/lib/server/pacientesAdmin';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting estricto (PHI endpoint - crea historial médico)
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
    const { id } = await params;
    const body = await request.json();
    await addPacienteHistorial(id, body, { email: user.email, uid: user.uid });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
