import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createPaciente } from '@/lib/server/pacientesAdmin';
import { adminDb } from '@/lib/firebaseAdmin';

const ALLOWED_ROLES = new Set(['admin', 'coordinacion', 'operador']);
const READ_ROLES = new Set(['admin', 'coordinacion', 'operador', 'doctor', 'terapeuta']);

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const hasAccess = (user.roles ?? []).some((role) => READ_ROLES.has(role));
  if (!hasAccess) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Firebase Admin no configurado' }, { status: 500 });
  }

  const url = new URL(request.url);
  const estado = url.searchParams.get('estado');
  const busqueda = url.searchParams.get('q')?.toLowerCase();
  const limitParam = Number(url.searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 200;
  const cursorId = url.searchParams.get('cursor');

  try {
    let query = adminDb.collection('pacientes').orderBy('apellidos').orderBy('nombre');
    if (estado) {
      query = query.where('estado', '==', estado);
    }

    if (cursorId) {
      const cursorSnap = await adminDb.collection('pacientes').doc(cursorId).get();
      if (cursorSnap.exists) {
        const cursorData = cursorSnap.data() ?? {};
        query = query.startAfter(cursorData.apellidos ?? '', cursorData.nombre ?? '');
      }
    }

    const snapshot = await query.limit(limit + 1).get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const slice = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? docs[limit].id : null;

    const pacientes = slice
      .map((docSnap) => {
        const data = docSnap.data() ?? {};
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

        return {
          id: docSnap.id,
          nombre: data.nombre ?? '',
          apellidos: data.apellidos ?? '',
          documentoId: data.documentoId ?? null,
          telefono: data.telefono ?? null,
          email: data.email ?? null,
          estado: data.estado ?? 'activo',
          riesgo: data.riesgo ?? null,
          ciudad: data.ciudad ?? null,
          aseguradora: data.aseguradora ?? null,
          profesionalReferenteId:
            data.profesionalReferenteId ?? data.profesionalReferente ?? data.responsableId ?? null,
          fechaNacimiento: toDateISO(data.fechaNacimiento),
          createdAt: toDateISO(data.createdAt),
          updatedAt: toDateISO(data.updatedAt),
        } satisfies Record<string, unknown>;
      })
      .filter((paciente) => {
        if (!busqueda) return true;
        const nombre = `${String(paciente['nombre'] ?? '')} ${String(paciente['apellidos'] ?? '')}`.toLowerCase();
        const documento = String(paciente['documentoId'] ?? '').toLowerCase();
        return nombre.includes(busqueda) || documento.includes(busqueda);
      });

    return NextResponse.json(
      {
        items: pacientes,
        nextCursor,
        limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[api/pacientes] Error al listar pacientes', error);
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los pacientes';
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
    const result = await createPaciente(body, { email: user.email, uid: user.uid });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
