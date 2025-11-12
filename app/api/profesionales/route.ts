import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createProfesional } from '@/lib/server/profesionales';
import { adminDb } from '@/lib/firebaseAdmin';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion']);
const READ_ROLES = new Set(['admin', 'coordinacion', 'operador', 'doctor', 'terapeuta']);

const toDateISO = (value: unknown) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return null;
};

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => READ_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  const db = adminDb;
  if (!db) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 300) : 200;

  try {
    const snapshot = await db.collection('profesionales').orderBy('apellidos').limit(limit).get();
    const profesionales = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() ?? {};
      return {
        id: docSnap.id,
        nombre: data.nombre ?? 'Sin nombre',
        apellidos: data.apellidos ?? '',
        especialidad: data.especialidad ?? 'medicina',
        email: data.email ?? '',
        telefono: data.telefono ?? null,
        activo: data.activo ?? true,
        horasSemanales: data.horasSemanales ?? 0,
        diasTrabajo: Array.isArray(data.diasTrabajo) ? data.diasTrabajo : [],
        horaInicio: data.horaInicio ?? '09:00',
        horaFin: data.horaFin ?? '17:00',
        createdAt: toDateISO(data.createdAt),
        updatedAt: toDateISO(data.updatedAt),
      };
    });

    return NextResponse.json(profesionales, { status: 200 });
  } catch (error) {
    console.error('[api/profesionales] Error al listar', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los profesionales';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => ALLOWED_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = await createProfesional(body, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
