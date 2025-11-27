import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import {
  getSerializedEvaluaciones,
  getSerializedServiciosActuales,
  getSerializedProfesionales,
  getSerializedGrupos,
} from '@/lib/server/supervision';


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const [evaluaciones, servicios, profesionales, grupos] = await Promise.all([
      getSerializedEvaluaciones(),
      getSerializedServiciosActuales(),
      getSerializedProfesionales(),
      getSerializedGrupos(),
    ]);

    return NextResponse.json({ evaluaciones, servicios, profesionales, grupos });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
