import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RespuestaFormulario } from '@/types';

/**
 * GET /api/formularios/respuestas
 * Obtiene respuestas de formularios con filtros opcionales
 *
 * Query params:
 * - pacienteId: filtrar por paciente
 * - formularioPlantillaId: filtrar por plantilla
 * - estado: filtrar por estado (borrador, completado, validado, archivado)
 * - limit: número máximo de resultados (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pacienteId = searchParams.get('pacienteId');
    const formularioPlantillaId = searchParams.get('formularioPlantillaId');
    const estadoParam = searchParams.get('estado');
    const limitParam = parseInt(searchParams.get('limit') || '100');

    let q = query(
      collection(db, 'formularios_respuestas'),
      orderBy('createdAt', 'desc')
    );

    // Aplicar filtros
    if (pacienteId) {
      q = query(q, where('pacienteId', '==', pacienteId));
    }
    if (formularioPlantillaId) {
      q = query(q, where('formularioPlantillaId', '==', formularioPlantillaId));
    }
    if (estadoParam) {
      q = query(q, where('estado', '==', estadoParam));
    }

    // Aplicar límite
    q = query(q, limit(limitParam));

    const snapshot = await getDocs(q);

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
    console.error('[API /api/formularios/respuestas GET] Error:', error);
    return NextResponse.json(
      { error: 'Error al obtener respuestas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/formularios/respuestas
 * Crea una nueva respuesta de formulario
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // TODO: Añadir validación con Zod
    // TODO: Verificar permisos del usuario
    // TODO: Validar que el formularioPlantillaId existe
    // TODO: Validar que el pacienteId existe

    const nuevaRespuesta = {
      ...body,
      estado: body.estado || 'borrador',
      pdfGenerado: false,
      requiereSeguimiento: body.requiereSeguimiento || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // const docRef = await addDoc(collection(db, 'formularios_respuestas'), nuevaRespuesta);

    // TODO: Incrementar contador de respuestas en la plantilla
    // TODO: Si estado es 'completado', incrementar totalRespuestas y recalcular tasaConversion

    return NextResponse.json({
      success: true,
      message: 'Respuesta guardada correctamente',
      // id: docRef.id
    });
  } catch (error) {
    console.error('[API /api/formularios/respuestas POST] Error:', error);
    return NextResponse.json(
      { error: 'Error al guardar respuesta' },
      { status: 500 }
    );
  }
}
