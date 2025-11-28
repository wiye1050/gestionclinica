import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { z } from 'zod';
import type { FormularioPlantilla } from '@/types';

const createPlantillaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
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
  ]),
  estado: z.enum(['activo', 'borrador', 'inactivo', 'archivado']).default('borrador'),
  campos: z.array(z.any()).min(1, 'Debe tener al menos un campo'),
  secciones: z.array(z.any()).optional(),
  requiereValidacionMedica: z.boolean().default(false),
  generaPDF: z.boolean().default(false),
  templatePDF: z.string().optional(),
  rolesPermitidos: z.array(z.string()).default(['admin']),
  especialidadesPermitidas: z.array(z.string()).optional(),
  notificarAlCompletar: z.boolean().default(false),
  emailsNotificacion: z.array(z.string().email()).optional(),
  creadoPor: z.string(),
  metadatos: z.record(z.any()).optional(),
});

/**
 * GET /api/formularios
 * Obtiene todas las plantillas de formularios
 *
 * Query params opcionales:
 * - tipo: filtrar por tipo de formulario
 * - estado: filtrar por estado (activo, inactivo, borrador, archivado)
 */
export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      console.error('[API /api/formularios GET] Admin DB not initialized');
      return NextResponse.json([]);
    }

    const searchParams = request.nextUrl.searchParams;
    const tipoParam = searchParams.get('tipo');
    const estadoParam = searchParams.get('estado');

    let query = adminDb.collection('formularios_plantillas').orderBy('nombre', 'asc');

    // Aplicar filtros si existen
    if (tipoParam) {
      query = query.where('tipo', '==', tipoParam);
    }
    if (estadoParam) {
      query = query.where('estado', '==', estadoParam);
    }

    const snapshot = await query.get();

    const formularios: FormularioPlantilla[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        tipo: data.tipo,
        version: data.version || 1,
        estado: data.estado || 'activo',
        campos: data.campos || [],
        secciones: data.secciones || [],
        requiereValidacionMedica: data.requiereValidacionMedica || false,
        generaPDF: data.generaPDF || false,
        templatePDF: data.templatePDF,
        rolesPermitidos: data.rolesPermitidos || ['admin'],
        especialidadesPermitidas: data.especialidadesPermitidas,
        totalRespuestas: data.totalRespuestas || 0,
        totalVistas: data.totalVistas || 0,
        tasaConversion: data.tasaConversion || 0,
        notificarAlCompletar: data.notificarAlCompletar,
        emailsNotificacion: data.emailsNotificacion,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        creadoPor: data.creadoPor || '',
        modificadoPor: data.modificadoPor,
        metadatos: data.metadatos,
      } as FormularioPlantilla;
    });

    return NextResponse.json(formularios);
  } catch (error) {
    console.error('[API /api/formularios GET] Error:', error);
    // En caso de error (por ejemplo, colección no existe), retornar array vacío
    return NextResponse.json([]);
  }
}

/**
 * POST /api/formularios
 * Crea una nueva plantilla de formulario
 */
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      console.error('[API /api/formularios POST] Admin DB not initialized');
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Validar con Zod
    const validation = createPlantillaSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Datos de formulario inválidos',
          details: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const nuevoFormulario = {
      ...validation.data,
      version: 1,
      totalRespuestas: 0,
      totalVistas: 0,
      tasaConversion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('formularios_plantillas').add(nuevoFormulario);

    return NextResponse.json({
      success: true,
      message: 'Formulario creado correctamente',
      id: docRef.id
    });
  } catch (error) {
    console.error('[API /api/formularios POST] Error:', error);
    return NextResponse.json(
      { error: 'Error al crear formulario', details: (error as Error).message },
      { status: 500 }
    );
  }
}
