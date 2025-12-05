import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import type { RespuestaFormulario } from '@/types';
import { logger } from '@/lib/utils/logger';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

const updateRespuestaSchema = z.object({
  respuestas: z.record(z.string(), z.unknown()).optional(),
  estado: z.enum(['borrador', 'completado', 'validado', 'archivado']).optional(),
  validadoPor: z.string().optional(),
  validadoPorNombre: z.string().optional(),
  notasValidacion: z.string().optional(),
  pdfGenerado: z.boolean().optional(),
  pdfUrl: z.string().optional(),
  pdfStoragePath: z.string().optional(),
  firmaPaciente: z.string().optional(),
  firmaProfesional: z.string().optional(),
  requiereSeguimiento: z.boolean().optional(),
  fechaSeguimiento: z.date().optional(),
  estadoSeguimiento: z.string().optional(),
  completadoEn: z.string().optional(),
  tiempoCompletado: z.number().optional(),
  modificadoPor: z.string().optional(),
  notasInternas: z.string().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/formularios/respuestas/[id]
 * Obtiene una respuesta especifica
 *
 * @security CRÍTICO: Expone PHI (Protected Health Information) de un paciente específico
 * @security Requiere autenticación y rol de lectura clínica
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/respuestas/[id] GET] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const doc = await adminDb.collection('formularios_respuestas').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const respuesta: RespuestaFormulario = {
      id: doc.id,
      formularioPlantillaId: data?.formularioPlantillaId,
      formularioNombre: data?.formularioNombre,
      formularioTipo: data?.formularioTipo,
      formularioVersion: data?.formularioVersion || 1,
      pacienteId: data?.pacienteId,
      pacienteNombre: data?.pacienteNombre,
      pacienteNHC: data?.pacienteNHC,
      eventoAgendaId: data?.eventoAgendaId,
      servicioId: data?.servicioId,
      episodioId: data?.episodioId,
      respuestas: data?.respuestas || {},
      estado: data?.estado || 'borrador',
      validadoPor: data?.validadoPor,
      validadoPorNombre: data?.validadoPorNombre,
      fechaValidacion: data?.fechaValidacion?.toDate(),
      notasValidacion: data?.notasValidacion,
      pdfGenerado: data?.pdfGenerado || false,
      pdfUrl: data?.pdfUrl,
      pdfStoragePath: data?.pdfStoragePath,
      firmaPaciente: data?.firmaPaciente,
      firmaProfesional: data?.firmaProfesional,
      requiereSeguimiento: data?.requiereSeguimiento || false,
      fechaSeguimiento: data?.fechaSeguimiento?.toDate(),
      estadoSeguimiento: data?.estadoSeguimiento,
      completadoEn: data?.completadoEn?.toDate(),
      tiempoCompletado: data?.tiempoCompletado,
      ip: data?.ip,
      userAgent: data?.userAgent,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      creadoPor: data?.creadoPor || '',
      modificadoPor: data?.modificadoPor,
      notasInternas: data?.notasInternas,
    };

    return NextResponse.json(respuesta);
  } catch (error) {
    logger.error('[API /api/formularios/respuestas/[id] GET] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener respuesta' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/formularios/respuestas/[id]
 * Actualiza una respuesta de formulario
 *
 * @security CRÍTICO: Modifica PHI (Protected Health Information)
 * @security Requiere autenticación y rol de lectura clínica
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización (profesionales pueden actualizar respuestas)
  if (!hasAnyRole(user.roles, API_ROLES.READ)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/respuestas/[id] PATCH] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validar con Zod
    const validation = updateRespuestaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de respuesta invalidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Verificar que existe
    const docRef = adminDb.collection('formularios_respuestas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    const existingData = doc.data();

    // Preparar datos para actualizar
    const updateData: Record<string, unknown> = {
      ...validation.data,
      updatedAt: new Date(),
    };

    // Convertir completadoEn de string a Date si es necesario
    if (updateData.completadoEn && typeof updateData.completadoEn === 'string') {
      updateData.completadoEn = new Date(updateData.completadoEn);
    }

    // Si se esta completando, incrementar el contador en la plantilla
    if (
      validation.data.estado === 'completado' &&
      existingData?.estado !== 'completado'
    ) {
      const plantillaRef = adminDb
        .collection('formularios_plantillas')
        .doc(existingData?.formularioPlantillaId);

      const plantillaDoc = await plantillaRef.get();
      if (plantillaDoc.exists) {
        await plantillaRef.update({
          totalRespuestas: (plantillaDoc.data()?.totalRespuestas || 0) + 1,
          updatedAt: new Date(),
        });
      }
    }

    // Actualizar
    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Respuesta actualizada correctamente',
    });
  } catch (error) {
    logger.error('[API /api/formularios/respuestas/[id] PATCH] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar respuesta', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/formularios/respuestas/[id]
 * Elimina una respuesta de formulario
 *
 * @security CRÍTICO: Elimina registros con PHI (Protected Health Information)
 * @security Requiere autenticación y rol de escritura (admin, coordinador solamente)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  // Verificar autenticación
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Verificar autorización (solo admin y coordinador pueden eliminar respuestas de pacientes)
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes - Solo admins y coordinadores' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/respuestas/[id] DELETE] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    // Verificar que existe
    const docRef = adminDb.collection('formularios_respuestas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    const data = doc.data();

    // Si estaba completada, decrementar el contador en la plantilla
    if (data?.estado === 'completado') {
      const plantillaRef = adminDb
        .collection('formularios_plantillas')
        .doc(data.formularioPlantillaId);

      const plantillaDoc = await plantillaRef.get();
      if (plantillaDoc.exists) {
        const currentTotal = plantillaDoc.data()?.totalRespuestas || 0;
        await plantillaRef.update({
          totalRespuestas: Math.max(0, currentTotal - 1),
          updatedAt: new Date(),
        });
      }
    }

    // Eliminar
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Respuesta eliminada correctamente',
    });
  } catch (error) {
    logger.error('[API /api/formularios/respuestas/[id] DELETE] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al eliminar respuesta', details: (error as Error).message },
      { status: 500 }
    );
  }
}
