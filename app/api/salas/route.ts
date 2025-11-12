import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { adminDb } from '@/lib/firebaseAdmin';

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
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 300) : 100;

  try {
    const snapshot = await db.collection('salas').orderBy('nombre').limit(limit).get();
    const salas = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() ?? {};
      return {
        id: docSnap.id,
        nombre: data.nombre ?? 'Sala',
        tipo: data.tipo ?? 'general',
        capacidad: data.capacidad ?? 1,
        equipamiento: Array.isArray(data.equipamiento) ? data.equipamiento : [],
        estado: data.estado ?? 'activa',
        colorAgenda: data.colorAgenda ?? null,
        notas: data.notas ?? null,
        createdAt: toDateISO(data.createdAt),
        updatedAt: toDateISO(data.updatedAt),
      };
    });

    return NextResponse.json(salas, { status: 200 });
  } catch (error) {
    console.error('[api/salas] Error al listar', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar las salas';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
