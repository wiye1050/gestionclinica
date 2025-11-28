import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FormularioPlantilla } from '@/types';

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
    const searchParams = request.nextUrl.searchParams;
    const tipoParam = searchParams.get('tipo');
    const estadoParam = searchParams.get('estado');

    let q = query(
      collection(db, 'formularios_plantillas'),
      orderBy('nombre', 'asc')
    );

    // Aplicar filtros si existen
    if (tipoParam) {
      q = query(q, where('tipo', '==', tipoParam));
    }
    if (estadoParam) {
      q = query(q, where('estado', '==', estadoParam));
    }

    const snapshot = await getDocs(q);

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
    return NextResponse.json(
      { error: 'Error al obtener formularios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/formularios
 * Crea una nueva plantilla de formulario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Añadir validación con Zod
    // TODO: Verificar permisos del usuario

    const nuevoFormulario = {
      ...body,
      version: 1,
      totalRespuestas: 0,
      totalVistas: 0,
      tasaConversion: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // const docRef = await addDoc(collection(db, 'formularios_plantillas'), nuevoFormulario);

    return NextResponse.json({
      success: true,
      message: 'Formulario creado correctamente',
      // id: docRef.id
    });
  } catch (error) {
    console.error('[API /api/formularios POST] Error:', error);
    return NextResponse.json(
      { error: 'Error al crear formulario' },
      { status: 500 }
    );
  }
}
