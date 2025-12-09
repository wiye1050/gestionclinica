import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { deleteDailyReport, updateDailyReport } from '@/lib/server/reports';
import { updateReporteDiarioSchema } from '@/lib/validators';

const limiter = rateLimit(RATE_LIMIT_STRICT);


async function ensureAuth() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return { error: NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 }) };
  }
  return { user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No se enviaron cambios.' }, { status: 400 });
    }

    // Validar con Zod (omitiendo el campo 'id' que viene de params)
    const updateSchemaWithoutId = updateReporteDiarioSchema.omit({ id: true });
    const validation = updateSchemaWithoutId.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    await updateDailyReport(id, validation.data, { userId: user.uid, userEmail: user.email ?? undefined });
    revalidateTag('reports');
    revalidateTag('reports-daily');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const auth = await ensureAuth();
  if ('error' in auth) return auth.error;
  const { user } = auth;
  const { id } = await params;

  try {
    await deleteDailyReport(id, { userId: user.uid, userEmail: user.email ?? undefined });
    revalidateTag('reports');
    revalidateTag('reports-daily');
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    const status = /no existe/i.test(message) ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
