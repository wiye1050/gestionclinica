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

/**
 * GET /api/pacientes
 * Obtiene lista paginada de pacientes con filtros y búsqueda
 *
 * @async
 * @param {NextRequest} request - Request de Next.js
 *
 * @query {string} [estado] - Filtrar por estado: 'activo' | 'inactivo' | 'egresado'
 * @query {string} [q] - Búsqueda por nombre, apellidos, documento o número de historia
 * @query {number} [limit=200] - Límite de resultados (máx 500)
 * @query {string} [cursor] - ID del último paciente para paginación
 *
 * @returns {Promise<NextResponse>} Lista de pacientes con paginación
 * @returns {200} Éxito - { items: Paciente[], nextCursor: string | null, limit: number }
 * @returns {401} No autenticado
 * @returns {500} Error del servidor
 *
 * @security Requiere autenticación
 * @security Admin/Coordinador: Ve todos los pacientes
 * @security Profesional: Solo ve pacientes asignados (profesionalReferenteId)
 * @security Paciente: Solo ve su propio registro
 *
 * @example
 * // Obtener pacientes activos con búsqueda
 * GET /api/pacientes?estado=activo&q=juan&limit=50
 *
 * @example
 * // Paginación
 * GET /api/pacientes?cursor=paciente-123&limit=100
 */
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

/**
 * POST /api/pacientes
 * Crea un nuevo paciente en el sistema
 *
 * @async
 * @param {NextRequest} request - Request de Next.js con body JSON
 *
 * @body {string} nombre - Nombre del paciente (requerido, máx 100 caracteres)
 * @body {string} apellidos - Apellidos del paciente (requerido, máx 100 caracteres)
 * @body {string} genero - Género: 'masculino' | 'femenino' | 'otro' (requerido)
 * @body {string} fechaNacimiento - Fecha de nacimiento ISO (requerido)
 * @body {string} [documentoId] - DNI/NIE/Pasaporte (máx 50 caracteres)
 * @body {string} [email] - Email de contacto
 * @body {string} [telefono] - Teléfono de contacto (máx 20 caracteres)
 * @body {string} [direccion] - Dirección completa (máx 200 caracteres)
 * @body {string} [codigoPostal] - Código postal (máx 10 caracteres)
 * @body {string} [ciudad] - Ciudad (máx 100 caracteres)
 * @body {string} [estado='activo'] - Estado: 'activo' | 'inactivo' | 'egresado'
 * @body {string} [riesgo='bajo'] - Nivel de riesgo: 'alto' | 'medio' | 'bajo'
 * @body {string} [profesionalReferenteId] - ID del profesional asignado
 * @body {string} [grupoPacienteId] - ID del grupo al que pertenece
 * @body {string} [notas] - Notas adicionales (máx 2000 caracteres)
 *
 * @returns {Promise<NextResponse>} Paciente creado
 * @returns {201} Éxito - { id: string, numeroHistoria: string, ...pacienteData }
 * @returns {400} Datos inválidos - { error: string, details?: object }
 * @returns {401} No autenticado
 * @returns {403} Permisos insuficientes (requiere rol de escritura)
 * @returns {500} Error del servidor
 *
 * @security Requiere autenticación
 * @security Requiere rol: admin | coordinador | profesional
 *
 * @example
 * // Crear paciente básico
 * POST /api/pacientes
 * {
 *   "nombre": "Juan",
 *   "apellidos": "García López",
 *   "genero": "masculino",
 *   "fechaNacimiento": "1985-03-15",
 *   "documentoId": "12345678A",
 *   "telefono": "666555444",
 *   "email": "juan.garcia@example.com"
 * }
 *
 * @throws {ZodError} Si los datos no pasan la validación del schema
 */
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
