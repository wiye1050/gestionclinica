import { adminDb } from '@/lib/firebaseAdmin';
import type { AgendaEvent } from '@/components/agenda/v2/agendaHelpers';
import { sanitizeHTML, sanitizeInput } from '@/lib/utils/sanitize';

export type AgendaEventCreateInput = {
  titulo: string;
  tipo: AgendaEvent['tipo'] | string;
  pacienteId?: string | null;
  profesionalId: string;
  salaId?: string | null;
  servicioId?: string | null;
  fechaInicio: string;
  fechaFin: string;
  estado: AgendaEvent['estado'];
  prioridad?: AgendaEvent['prioridad'];
  notas?: string | null;
  requiereSeguimiento?: boolean;
  creadoPorId: string;
  creadoPor: string;
};

export type AgendaEventUpdateInput = Partial<Omit<AgendaEventCreateInput, 'creadoPorId' | 'creadoPor'>> & {
  estado?: AgendaEvent['estado'];
};

const historialTipoMap: Record<string, 'consulta' | 'seguimiento' | 'tratamiento' | 'incidencia'> = {
  consulta: 'consulta',
  clinico: 'consulta',
  seguimiento: 'seguimiento',
  coordinacion: 'seguimiento',
  tratamiento: 'tratamiento',
  revision: 'seguimiento',
  reunion: 'seguimiento',
  urgencia: 'incidencia',
  administrativo: 'incidencia',
};

function parseFecha(value: string, label: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`La fecha ${label} no es válida.`);
  }
  return date;
}

async function resolveNombre(collection: string, id?: string | null) {
  if (!id) return { id: null, nombre: null };
  const snap = await adminDb!.collection(collection).doc(id).get();
  if (!snap.exists) {
    throw new Error(`El recurso en ${collection} no existe.`);
  }
  const data = snap.data() ?? {};
  const nombre = `${data.nombre ?? ''} ${data.apellidos ?? ''}`.trim() || data.nombre || null;
  return { id, nombre };
}

export async function createAgendaEvent(input: AgendaEventCreateInput) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const fechaInicio = parseFecha(input.fechaInicio, 'inicio');
  const fechaFin = parseFecha(input.fechaFin, 'fin');
  if (fechaFin <= fechaInicio) {
    throw new Error('La hora de fin debe ser posterior a la de inicio.');
  }

  const profesional = await resolveNombre('profesionales', input.profesionalId);
  if (!profesional.nombre) {
    throw new Error('El profesional indicado no existe.');
  }

  const paciente = await resolveNombre('pacientes', input.pacienteId ?? null);
  const sala = await resolveNombre('salas', input.salaId ?? null);
  const servicio = await resolveNombre('catalogo-servicios', input.servicioId ?? null);

  const payload = {
    titulo: sanitizeInput(input.titulo),
    tipo: sanitizeInput(input.tipo),
    pacienteId: paciente.id,
    pacienteNombre: paciente.nombre,
    profesionalId: profesional.id,
    profesionalNombre: profesional.nombre,
    salaId: sala.id,
    salaNombre: sala.nombre,
    servicioId: servicio.id,
    servicioNombre: servicio.nombre,
    fechaInicio,
    fechaFin,
    estado: input.estado,
    prioridad: input.prioridad ?? 'media',
    notas: input.notas ? sanitizeHTML(input.notas) : '',
    requiereSeguimiento: Boolean(input.requiereSeguimiento),
    createdAt: new Date(),
    updatedAt: new Date(),
    creadoPor: input.creadoPor,
    creadoPorId: input.creadoPorId,
  } satisfies Record<string, unknown>;

  const docRef = await adminDb.collection('agenda-eventos').add(payload);

  if (paciente.id) {
    const tipoHistorial = historialTipoMap[input.tipo] ?? 'consulta';
    await adminDb.collection('pacientes-historial').add({
      pacienteId: paciente.id,
      eventoAgendaId: docRef.id,
      servicioId: servicio.id,
      servicioNombre: servicio.nombre,
      profesionalId: profesional.id,
      profesionalNombre: profesional.nombre,
      fecha: fechaInicio,
      tipo: tipoHistorial,
      descripcion: input.notas || `Evento ${input.tipo} programado`,
      resultado: null,
      planesSeguimiento: input.requiereSeguimiento ? 'Requiere seguimiento posterior' : null,
      adjuntos: [],
      createdAt: new Date(),
      creadoPor: input.creadoPor,
    });
  }

  await adminDb.collection('auditLogs').add({
    modulo: 'agenda',
    accion: 'create',
    refId: docRef.id,
    userId: input.creadoPorId,
    userEmail: input.creadoPor,
    payload,
    createdAt: new Date(),
  });

  return { id: docRef.id };
}

export async function updateAgendaEvent(
  eventId: string,
  changes: AgendaEventUpdateInput,
  actor: { userId: string; userEmail?: string }
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('agenda-eventos').doc(eventId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El evento no existe.');
  }

  const updateData: Record<string, unknown> = {};

  if (changes.titulo !== undefined) updateData.titulo = sanitizeInput(changes.titulo);
  if (changes.tipo !== undefined) updateData.tipo = sanitizeInput(changes.tipo);
  if (changes.estado !== undefined) updateData.estado = changes.estado;
  if (changes.prioridad !== undefined) updateData.prioridad = changes.prioridad;
  if (changes.notas !== undefined) updateData.notas = changes.notas ? sanitizeHTML(changes.notas) : '';
  if (changes.requiereSeguimiento !== undefined)
    updateData.requiereSeguimiento = Boolean(changes.requiereSeguimiento);

  if (changes.fechaInicio) updateData.fechaInicio = parseFecha(changes.fechaInicio, 'inicio');
  if (changes.fechaFin) updateData.fechaFin = parseFecha(changes.fechaFin, 'fin');

  if (changes.profesionalId !== undefined) {
    const profesional = await resolveNombre('profesionales', changes.profesionalId);
    if (!profesional.nombre) {
      throw new Error('El profesional indicado no existe.');
    }
    updateData.profesionalId = profesional.id;
    updateData.profesionalNombre = profesional.nombre;
  }

  if (changes.pacienteId !== undefined) {
    const paciente = await resolveNombre('pacientes', changes.pacienteId ?? null);
    updateData.pacienteId = paciente.id;
    updateData.pacienteNombre = paciente.nombre;
  }

  if (changes.salaId !== undefined) {
    const sala = await resolveNombre('salas', changes.salaId ?? null);
    updateData.salaId = sala.id;
    updateData.salaNombre = sala.nombre;
  }

  if (changes.servicioId !== undefined) {
    const servicio = await resolveNombre('catalogo-servicios', changes.servicioId ?? null);
    updateData.servicioId = servicio.id;
    updateData.servicioNombre = servicio.nombre;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No se proporcionaron cambios para actualizar.');
  }

  updateData.updatedAt = new Date();
  updateData.modificadoPor = actor.userEmail ?? 'desconocido';
  updateData.modificadoPorId = actor.userId;

  await docRef.update(updateData);

  // Si el estado cambió a 'realizada', actualizar el historial vinculado
  const eventoData = snapshot.data();
  if (changes.estado === 'realizada' && eventoData?.pacienteId) {
    // Buscar el registro de historial vinculado
    const historialSnap = await adminDb
      .collection('pacientes-historial')
      .where('eventoAgendaId', '==', eventId)
      .limit(1)
      .get();

    if (!historialSnap.empty) {
      const historialDoc = historialSnap.docs[0];
      await historialDoc.ref.update({
        resultado: changes.notas || 'Cita completada',
        updatedAt: new Date(),
      });
    }
  }

  await adminDb.collection('auditLogs').add({
    modulo: 'agenda',
    accion: 'update',
    refId: eventId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: updateData,
    before: snapshot.data(),
    createdAt: new Date(),
  });
}

export async function deleteAgendaEvent(eventId: string, actor: { userId: string; userEmail?: string }) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('agenda-eventos').doc(eventId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw new Error('El evento no existe.');
  }

  await docRef.delete();

  await adminDb.collection('auditLogs').add({
    modulo: 'agenda',
    accion: 'delete',
    refId: eventId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
