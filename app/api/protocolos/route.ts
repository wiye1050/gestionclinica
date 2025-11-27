import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createProtocolo } from '@/lib/server/protocolos';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createProtocolo(body, { uid: user.uid, email: user.email });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
