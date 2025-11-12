import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createCatalogoServicio } from '@/lib/server/catalogoServicios';
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
  const incluirInactivos = url.searchParams.get('incluirInactivos') === 'true';

  try {
    const snapshot = await db.collection('catalogo-servicios').orderBy('nombre').limit(limit).get();
    const items = snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          categoria: data.categoria ?? 'medicina',
          descripcion: data.descripcion ?? '',
          tiempoEstimado: data.tiempoEstimado ?? 60,
          requiereSala: data.requiereSala ?? false,
          salaPredeterminada: data.salaPredeterminada ?? null,
          requiereSupervision: data.requiereSupervision ?? false,
          requiereApoyo: data.requiereApoyo ?? false,
          profesionalesHabilitados: Array.isArray(data.profesionalesHabilitados)
            ? data.profesionalesHabilitados
            : [],
          activo: data.activo ?? true,
          createdAt: toDateISO(data.createdAt),
          updatedAt: toDateISO(data.updatedAt),
        };
      })
      .filter((servicio) => incluirInactivos || servicio.activo);

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error('[api/catalogo-servicios] Error al listar', error);
    const message = error instanceof Error ? error.message : 'No se pudo cargar el catálogo de servicios';
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
    const result = await createCatalogoServicio(body, { userId: user.uid, userEmail: user.email ?? undefined });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
