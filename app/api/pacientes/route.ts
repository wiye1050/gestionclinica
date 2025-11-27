import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth/server';
import { createPaciente } from '@/lib/server/pacientesAdmin';
import { adminDb } from '@/lib/firebaseAdmin';
import { validateRequest } from '@/lib/utils/apiValidation';
import type { Query } from 'firebase-admin/firestore';
import type { AppRole } from '@/lib/auth/roles';

const CREATE_UPDATE_ROLES = new Set<AppRole>(['admin', 'coordinador']);
const ADMIN_ROLES = new Set<AppRole>(['admin', 'coordinador']);
const CLINICAL_ROLES = new Set<AppRole>(['profesional']);

// Schema de validación para crear paciente
const createPacienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  apellidos: z.string().min(1, 'Los apellidos son requeridos').max(100),
  documentoId: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  direccion: z.string().optional(),
  codigoPostal: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'alta']).default('activo'),
  riesgo: z.enum(['alto', 'medio', 'bajo']).optional(),
  profesionalReferenteId: z.string().optional(),
  grupoPacienteId: z.string().optional(),
  notas: z.string().max(2000).optional(),
  alergias: z.array(z.string()).optional(),
  alertasClinicas: z.array(z.string()).optional(),
  diagnosticosPrincipales: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
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

    const userRoles = (user.roles ?? userDoc.roles ?? []) as string[];
    const esAdmin = userRoles.some((role) => ADMIN_ROLES.has(role));
    const esClinico = userRoles.some((role) => CLINICAL_ROLES.has(role));
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

  const hasAccess = (user.roles ?? []).some((role) => CREATE_UPDATE_ROLES.has(role));
  if (!hasAccess) {
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
