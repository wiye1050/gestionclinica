import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { createPaciente } from '@/lib/server/pacientesAdmin';
import { captureError } from '@/lib/utils/errorLogging';
import { adminDb } from '@/lib/firebaseAdmin';
import { validateRequest } from '@/lib/utils/apiValidation';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';
import { createPacienteSchema } from '@/lib/validators';
import { toDateISO } from '@/lib/utils/firestoreTransformers';
import type { Query } from 'firebase-admin/firestore';
import type { AppRole } from '@/lib/auth/roles';
import { rateLimit, RATE_LIMIT_MODERATE } from '@/lib/middleware/rateLimit';

const limiter = rateLimit(RATE_LIMIT_MODERATE);

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
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
    const userDocSnap = await adminDb.collection('users').doc(user.uid).get();
    const userDoc = userDocSnap.exists ? userDocSnap.data() ?? {} : {};

    const userRoles = (user.roles ?? userDoc.roles ?? []) as AppRole[];
    const esAdmin = hasAnyRole(userRoles, API_ROLES.WRITE);
    const esClinico = hasAnyRole(userRoles, API_ROLES.CLINICAL);
    const professionalId = userDoc.profesionalId ?? null;
    const patientId = userDoc.pacienteId ?? null;

    let query: Query = adminDb.collection('pacientes');

    if (esClinico && !esAdmin) {
      query = query.where('profesionalReferenteId', '==', professionalId);
    }

    if (!esAdmin && !esClinico) {
      if (!patientId) {
        return NextResponse.json({ items: [], nextCursor: null, limit }, { status: 200 });
      }
      query = query.where('__name__', '==', patientId);
    }

    query = query.orderBy('apellidos').orderBy('nombre');

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

        return {
          id: docSnap.id,
          numeroHistoria: data.numeroHistoria ?? '',
          nombre: data.nombre ?? '',
          apellidos: data.apellidos ?? '',
          documentoId: data.documentoId ?? null,
          estado: data.estado ?? 'activo',
          riesgo: data.riesgo ?? null,
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
        const nhc = String(paciente['numeroHistoria'] ?? '').toLowerCase();
        return nombre.includes(busqueda) || documento.includes(busqueda) || nhc.includes(busqueda);
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
    captureError(error, { module: 'api-pacientes', action: 'list-pacientes' });
    const message = error instanceof Error ? error.message : 'No se pudieron cargar los pacientes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  // Validar request con Zod
  const validation = await validateRequest(request, createPacienteSchema);
  if (!validation.success) {
    return validation.error;
  }

  try {
    const result = await createPaciente(validation.data, { email: user.email, uid: user.uid });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
