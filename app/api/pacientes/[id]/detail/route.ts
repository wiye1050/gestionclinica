import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCurrentUser } from '@/lib/auth/server';
import { canViewFullPatientHistory } from '@/lib/auth/roles';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';
import {
  transformPaciente,
  transformHistorialPaciente,
  transformServicioAsignado,
  transformPacienteFactura,
  transformPacientePresupuesto,
  transformPacienteDocumento,
} from '@/lib/utils/firestoreTransformers';

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aplicar rate limiting estricto (PHI endpoint)
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  const { id: pacienteId } = await params;
  if (!pacienteId) {
    return NextResponse.json({ error: 'Paciente no especificado.' }, { status: 400 });
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }
  if (!canViewFullPatientHistory(currentUser.roles)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no está configurado.' },
      { status: 500 }
    );
  }

  try {
    const pacienteRef = adminDb.collection('pacientes').doc(pacienteId);
    const pacienteSnap = await pacienteRef.get();

    if (!pacienteSnap.exists) {
      return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });
    }

    const paciente = transformPaciente(pacienteSnap as unknown as FirebaseFirestore.DocumentSnapshot);
    const grupoPacienteId = paciente.grupoPacienteId;

    const serviciosPromise = grupoPacienteId
      ? adminDb
          .collection('servicios-asignados')
          .where('grupoId', '==', grupoPacienteId)
          .limit(25)
          .get()
      : Promise.resolve(null);

    const [
      historialSnap,
      serviciosSnap,
      facturasSnap,
      presupuestosSnap,
      documentosSnap,
    ] = await Promise.all([
      adminDb
        .collection('pacientes-historial')
        .where('pacienteId', '==', pacienteId)
        .orderBy('fecha', 'desc')
        .limit(100)
        .get(),
      serviciosPromise,
      pacienteRef.collection('facturas').orderBy('fecha', 'desc').limit(100).get(),
      pacienteRef.collection('presupuestos').orderBy('fecha', 'desc').limit(100).get(),
      pacienteRef.collection('documentos').orderBy('fechaSubida', 'desc').limit(100).get(),
    ]);

    const result = {
      paciente,
      historial: historialSnap.docs.map((docSnap) =>
        transformHistorialPaciente(docSnap as unknown as FirebaseFirestore.DocumentSnapshot, pacienteId)
      ),
      serviciosRelacionados: serviciosSnap
        ? serviciosSnap.docs.map((docSnap) =>
            transformServicioAsignado(docSnap as unknown as FirebaseFirestore.DocumentSnapshot)
          )
        : [],
      facturas: facturasSnap.docs.map((docSnap) =>
        transformPacienteFactura(docSnap as unknown as FirebaseFirestore.DocumentSnapshot, pacienteId)
      ),
      presupuestos: presupuestosSnap.docs.map((docSnap) =>
        transformPacientePresupuesto(docSnap as unknown as FirebaseFirestore.DocumentSnapshot, pacienteId)
      ),
      documentos: documentosSnap.docs.map((docSnap) =>
        transformPacienteDocumento(docSnap as unknown as FirebaseFirestore.DocumentSnapshot, pacienteId)
      ),
    };

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error obteniendo detalle de paciente', error as Error);
    return NextResponse.json({ error: 'Error interno al obtener el paciente.' }, { status: 500 });
  }
}
