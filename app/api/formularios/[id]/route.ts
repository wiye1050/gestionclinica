import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import type { FormularioPlantilla } from '@/types';
import { logger } from '@/lib/utils/logger';
import { getCurrentUser } from '@/lib/auth/server';
import { API_ROLES, hasAnyRole } from '@/lib/auth/apiRoles';

const updatePlantillaSchema = z.object({
  nombre: z.string().min(1).max(200).optional(),
  descripcion: z.string().optional(),
  tipo: z.enum([
    'triaje_telefonico',
    'exploracion_fisica',
    'peticion_pruebas',
    'hoja_recomendaciones',
    'consentimiento_informado',
    'citacion',
    'valoracion_inicial',
    'seguimiento',
    'alta_medica',
    'informe_clinico',
    'receta_medica',
    'volante_derivacion',
    'otro',
  ]).optional(),
  estado: z.enum(['activo', 'borrador', 'inactivo', 'archivado']).optional(),
  campos: z.array(z.unknown()).optional(),
  secciones: z.array(z.unknown()).optional(),
  requiereValidacionMedica: z.boolean().optional(),
  generaPDF: z.boolean().optional(),
  templatePDF: z.string().optional(),
  rolesPermitidos: z.array(z.string()).optional(),
  especialidadesPermitidas: z.array(z.string()).optional(),
  notificarAlCompletar: z.boolean().optional(),
  emailsNotificacion: z.array(z.string().email()).optional(),
  modificadoPor: z.string().optional(),
  metadatos: z.record(z.string(), z.unknown()).optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/formularios/[id]
 * Obtiene una plantilla específica
 *
 * @security Requiere autenticación y rol de lectura
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
      logger.error('[API /api/formularios/[id] GET] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const doc = await adminDb.collection('formularios_plantillas').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const plantilla: FormularioPlantilla = {
      id: doc.id,
      nombre: data?.nombre,
      descripcion: data?.descripcion,
      tipo: data?.tipo,
      version: data?.version || 1,
      estado: data?.estado || 'activo',
      campos: data?.campos || [],
      secciones: data?.secciones || [],
      requiereValidacionMedica: data?.requiereValidacionMedica || false,
      generaPDF: data?.generaPDF || false,
      templatePDF: data?.templatePDF,
      rolesPermitidos: data?.rolesPermitidos || ['admin'],
      especialidadesPermitidas: data?.especialidadesPermitidas,
      totalRespuestas: data?.totalRespuestas || 0,
      totalVistas: data?.totalVistas || 0,
      tasaConversion: data?.tasaConversion || 0,
      notificarAlCompletar: data?.notificarAlCompletar,
      emailsNotificacion: data?.emailsNotificacion,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      creadoPor: data?.creadoPor || '',
      modificadoPor: data?.modificadoPor,
      metadatos: data?.metadatos,
    };

    return NextResponse.json(plantilla);
  } catch (error) {
    logger.error('[API /api/formularios/[id] GET] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/formularios/[id]
 * Actualiza una plantilla de formulario
 *
 * @security Requiere autenticación y rol de escritura
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

  // Verificar autorización
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/[id] PATCH] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();

    // Validar con Zod
    const validation = updatePlantillaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de formulario inválidos',
          details: validation.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    // Verificar que existe
    const docRef = adminDb.collection('formularios_plantillas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar
    await docRef.update({
      ...validation.data,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Plantilla actualizada correctamente',
    });
  } catch (error) {
    logger.error('[API /api/formularios/[id] PATCH] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al actualizar plantilla', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/formularios/[id]
 * Elimina una plantilla de formulario
 *
 * @security Requiere autenticación y rol de escritura
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

  // Verificar autorización
  if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
    return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
  }

  try {
    if (!adminDb) {
      logger.error('[API /api/formularios/[id] DELETE] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    // Verificar que existe
    const docRef = adminDb.collection('formularios_plantillas').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si tiene respuestas asociadas
    const respuestasSnapshot = await adminDb
      .collection('formularios_respuestas')
      .where('formularioPlantillaId', '==', id)
      .limit(1)
      .get();

    if (!respuestasSnapshot.empty) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar una plantilla con respuestas asociadas',
          suggestion: 'Cambia el estado a "archivado" en su lugar',
        },
        { status: 400 }
      );
    }

    // Eliminar
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Plantilla eliminada correctamente',
    });
  } catch (error) {
    logger.error('[API /api/formularios/[id] DELETE] Error:', error as Error);
    return NextResponse.json(
      { error: 'Error al eliminar plantilla', details: (error as Error).message },
      { status: 500 }
    );
  }
}
