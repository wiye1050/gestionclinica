import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { addPacienteHistorial } from '@/lib/server/pacientesAdmin';

const ALLOWED_ROLES = new Set(['admin', 'coordinador', 'operador']);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
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
