import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import type { RespuestaFormulario } from '@/types';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

const limiter = rateLimit(RATE_LIMIT_STRICT);

const createRespuestaSchema = z.object({
  formularioPlantillaId: z.string().min(1, 'El ID de la plantilla es obligatorio'),
  formularioNombre: z.string(),
  formularioTipo: z.string(),
  formularioVersion: z.number().default(1),
  pacienteId: z.string().min(1, 'El ID del paciente es obligatorio'),
  pacienteNombre: z.string(),
  pacienteNHC: z.string().optional(),
  eventoAgendaId: z.string().optional(),
  servicioId: z.string().optional(),
  episodioId: z.string().optional(),
  respuestas: z.record(z.string(), z.unknown()),
  estado: z.enum(['borrador', 'completado', 'validado', 'archivado']).default('borrador'),
  requiereSeguimiento: z.boolean().default(false),
  fechaSeguimiento: z.date().optional(),
  estadoSeguimiento: z.string().optional(),
  creadoPor: z.string(),
  notasInternas: z.string().optional(),
});

/**
 * GET /api/formularios/respuestas
 * Obtiene respuestas de formularios con filtros opcionales
 *
 * Query params:
 * - pacienteId: filtrar por paciente
 * - formularioPlantillaId: filtrar por plantilla
 * - estado: filtrar por estado (borrador, completado, validado, archivado)
 * - limit: número máximo de resultados (default: 100)
 *
 * @security CRÍTICO: Contiene PHI (Protected Health Information)
 * @security Requiere autenticación y rol de lectura clínica
 */
export async function GET(request: NextRequest) {
  // Aplicar rate limiting estricto (PHI endpoint)
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización (solo personal clínico puede ver respuestas de pacientes)
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/respuestas GET] Admin DB not initialized');
      return NextResponse.json([]);
    }

    const searchParams = request.nextUrl.searchParams;
    const pacienteId = searchParams.get('pacienteId');
    const formularioPlantillaId = searchParams.get('formularioPlantillaId');
    const estadoParam = searchParams.get('estado');
    const limitParam = parseInt(searchParams.get('limit') || '100');

    let query = adminDb.collection('formularios_respuestas').orderBy('createdAt', 'desc');

    // Aplicar filtros
    if (pacienteId) {
      query = query.where('pacienteId', '==', pacienteId);
    }
    if (formularioPlantillaId) {
      query = query.where('formularioPlantillaId', '==', formularioPlantillaId);
    }
    if (estadoParam) {
      query = query.where('estado', '==', estadoParam);
    }

    // Aplicar límite
    query = query.limit(limitParam);

    const snapshot = await query.get();

    const respuestas: RespuestaFormulario[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        formularioPlantillaId: data.formularioPlantillaId,
        formularioNombre: data.formularioNombre,
        formularioTipo: data.formularioTipo,
        formularioVersion: data.formularioVersion || 1,
        pacienteId: data.pacienteId,
        pacienteNombre: data.pacienteNombre,
        pacienteNHC: data.pacienteNHC,
        eventoAgendaId: data.eventoAgendaId,
        servicioId: data.servicioId,
        episodioId: data.episodioId,
        respuestas: data.respuestas || {},
        estado: data.estado || 'borrador',
        validadoPor: data.validadoPor,
        validadoPorNombre: data.validadoPorNombre,
        fechaValidacion: data.fechaValidacion?.toDate(),
        notasValidacion: data.notasValidacion,
        pdfGenerado: data.pdfGenerado || false,
        pdfUrl: data.pdfUrl,
        pdfStoragePath: data.pdfStoragePath,
        firmaPaciente: data.firmaPaciente,
        firmaProfesional: data.firmaProfesional,
        requiereSeguimiento: data.requiereSeguimiento || false,
        fechaSeguimiento: data.fechaSeguimiento?.toDate(),
        estadoSeguimiento: data.estadoSeguimiento,
        completadoEn: data.completadoEn?.toDate(),
        tiempoCompletado: data.tiempoCompletado,
        ip: data.ip,
        userAgent: data.userAgent,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        creadoPor: data.creadoPor || '',
        modificadoPor: data.modificadoPor,
        notasInternas: data.notasInternas,
      } as RespuestaFormulario;
    });

    return NextResponse.json(respuestas);
  } catch (error) {
    logger.error('[API /api/formularios/respuestas GET] Error:', error as Error);
    // En caso de error (por ejemplo, colección no existe), retornar array vacío
    return NextResponse.json([]);
  }
}

/**
 * POST /api/formularios/respuestas
 * Crea una nueva respuesta de formulario
 *
 * @security CRÍTICO: Crea registros con PHI (Protected Health Information)
 * @security Requiere autenticación y rol de lectura clínica
 */
export async function POST(request: NextRequest) {
  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización (profesionales pueden crear respuestas al atender pacientes)
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/respuestas POST] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validar con Zod
    const validation = createRespuestaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de respuesta inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Validar que la plantilla existe
    const plantillaDoc = await adminDb
      .collection('formularios_plantillas')
      .doc(validation.data.formularioPlantillaId)
      .get();

    if (!plantillaDoc.exists) {
      return NextResponse.json(
        { error: 'La plantilla de formulario no existe' },
        { status: 404 }
      );
    }

    // Validar que el paciente existe
    const pacienteDoc = await adminDb
      .collection('pacientes')
      .doc(validation.data.pacienteId)
      .get();

    if (!pacienteDoc.exists) {
      return NextResponse.json(
        { error: 'El paciente no existe' },
        { status: 404 }
      );
    }

    const nuevaRespuesta = {
      ...validation.data,
      pdfGenerado: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('formularios_respuestas').add(nuevaRespuesta);

    // Incrementar contador de respuestas si está completado
    if (validation.data.estado === 'completado') {
      const plantillaRef = adminDb
        .collection('formularios_plantillas')
        .doc(validation.data.formularioPlantillaId);

      await plantillaRef.update({
        totalRespuestas: (plantillaDoc.data()?.totalRespuestas || 0) + 1,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Respuesta guardada correctamente',
      id: docRef.id
    });
  } catch (error) {
    logger.error('[API /api/formularios/respuestas POST] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al guardar respuesta', details: (error as Error).message },
      { status: 500 }
    );
  }
}
