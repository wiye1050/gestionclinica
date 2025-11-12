import 'dotenv/config';
import admin from 'firebase-admin';
import { emitEvent } from '../lib/events/emit';
import { applyEpisodeTransition } from '../lib/episodes/applyEvent';
import { createAgendaEvent } from '../lib/server/agendaEvents';

type EpisodeTrigger =
  | 'Lead.Qualified'
  | 'Triage.Routed'
  | 'Appointment.Confirmed'
  | 'Consent.Signed.Base'
  | 'Exploration.Completed'
  | 'Plan.Created'
  | 'Plan.Proposed'
  | 'Quote.Accepted'
  | 'Treatment.ControlReached'
  | 'Episode.Closed'
  | 'Recall.Scheduled';

const bootstrap = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está definido');
  }
  const parsed = JSON.parse(raw);
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    }),
  });
};

const app = bootstrap();
const db = app.firestore();

async function pickDoc(collection: string, fallback?: Record<string, unknown>) {
  const snap = await db.collection(collection).limit(1).get();
  if (!snap.empty) {
    return { id: snap.docs[0].id, data: snap.docs[0].data() };
  }
  if (!fallback) {
    throw new Error(`No hay documentos en ${collection}. Crea uno antes de correr la prueba.`);
  }
  const docRef = await db.collection(collection).add(fallback);
  return { id: docRef.id, data: fallback };
}

const expectState = async (episodeId: string, expected: string) => {
  const snap = await db.collection('episodes').doc(episodeId).get();
  const current = snap.data()?.state;
  if (current !== expected) {
    throw new Error(`Estado inesperado para episodio ${episodeId}. Esperado: ${expected}, actual: ${current}`);
  }
};

async function advanceEpisode(
  episodeId: string,
  trigger: EpisodeTrigger,
  context?: Record<string, unknown>,
  meta?: Record<string, unknown>,
  expectedState?: string
) {
  await applyEpisodeTransition({
    episodeId,
    trigger,
    actorUserId: 'script-e2e',
    context,
    meta,
  });
  if (expectedState) {
    await expectState(episodeId, expectedState);
  }
}

async function createLead() {
  const now = Date.now();
  const patientRef = await db.collection('pacientes').add({
    fullName: `Paciente e2e ${now}`,
    telefono: '+34 600 000 000',
    email: `paciente.e2e+${now}@example.com`,
    createdAt: now,
  });

  const episodeRef = await db.collection('episodes').add({
    patientId: patientRef.id,
    state: 'CAPTACION',
    startedAt: now,
    updatedAt: now,
    reason: 'Dolor lumbar e2e',
    ownerUserId: 'script-e2e',
  });

  const leadRef = await db.collection('leads').add({
    patientId: patientRef.id,
    episodeId: episodeRef.id,
    channel: 'WEB',
    tags: ['e2e'],
    createdAt: now,
    createdBy: 'script-e2e',
  });

  await emitEvent({
    type: 'Lead.Created',
    subject: { kind: 'episode', id: episodeRef.id },
    actorUserId: 'script-e2e',
    meta: { patientId: patientRef.id, leadId: leadRef.id },
  });

  await advanceEpisode(episodeRef.id, 'Lead.Qualified', undefined, undefined, 'TRIAJE');

  return { episodeId: episodeRef.id, patientId: patientRef.id };
}

async function submitTriage(episodeId: string) {
  await db
    .collection('episodes')
    .doc(episodeId)
    .collection('triage')
    .add({
      submittedBy: 'CLINICIAN',
      channel: 'WEB',
      formSchemaKey: 'TRIAGE_GENERAL_V1',
      answers: { motivo: 'Dolor lumbar e2e' },
      riskFlags: ['prioridad-media'],
      createdAt: Date.now(),
    });

  await emitEvent({
    type: 'Triage.Submitted',
    subject: { kind: 'episode', id: episodeId },
    actorUserId: 'script-e2e',
    meta: { formSchemaKey: 'TRIAGE_GENERAL_V1' },
  });
}

async function routeTriage(episodeId: string) {
  const taskRef = await db.collection('tasks').add({
    type: 'SCHEDULING_ORDER',
    episodeId,
    assignedToUserId: 'coord-e2e',
    priority: 'normal',
    createdAt: Date.now(),
    createdBy: 'script-e2e',
  });

  await emitEvent({
    type: 'Triage.Routed',
    subject: { kind: 'episode', id: episodeId },
    actorUserId: 'script-e2e',
    meta: { taskId: taskRef.id },
  });

  await advanceEpisode(episodeId, 'Triage.Routed', undefined, undefined, 'CITACION');
}

async function bookAndConfirmAppointment(episodeId: string, patientId: string) {
  const profesional = await pickDoc('profesionales', {
    nombre: 'Profesional Demo',
    apellidos: 'E2E',
    especialidad: 'medicina',
    email: 'profesional.e2e@example.com',
    activo: true,
  });
  const sala = await pickDoc('salas', {
    nombre: 'Sala E2E',
    tipo: 'general',
    capacidad: 1,
    estado: 'activa',
  });

  const start = new Date(Date.now() + 30 * 60 * 1000);
  const end = new Date(start.getTime() + 45 * 60 * 1000);

  const event = await createAgendaEvent({
    titulo: 'Consulta e2e',
    tipo: 'consulta',
    pacienteId: patientId,
    profesionalId: profesional.id,
    salaId: sala.id,
    servicioId: null,
    fechaInicio: start.toISOString(),
    fechaFin: end.toISOString(),
    estado: 'programada',
    prioridad: 'media',
    notas: 'Agendado desde script e2e',
    requiereSeguimiento: false,
    creadoPor: 'script-e2e',
    creadoPorId: 'script-e2e',
  });

  await emitEvent({
    type: 'Appointment.Booked',
    subject: { kind: 'appointment', id: event.id },
    actorUserId: 'script-e2e',
    meta: { episodeId, patientId, profesionalId: profesional.id },
  });

  await db
    .collection('appointments')
    .doc(event.id)
    .set(
      {
        episodeId,
        patientId,
        professionalId: profesional.id,
        status: 'CONFIRMED',
        confirmedAt: Date.now(),
      },
      { merge: true }
    );

  await emitEvent({
    type: 'Appointment.Confirmed',
    subject: { kind: 'appointment', id: event.id },
    actorUserId: 'script-e2e',
    meta: { episodeId },
  });

  await advanceEpisode(episodeId, 'Appointment.Confirmed', undefined, { appointmentId: event.id }, 'RECIBIMIENTO');

  return event.id;
}

async function signConsent(episodeId: string, patientId: string, type: 'BASE' | 'SPECIFIC') {
  const consentRef = await db.collection('consents').add({
    patientId,
    episodeId,
    type,
    version: 'v1',
    signer: { name: 'Paciente E2E' },
    signedAt: Date.now(),
    createdBy: 'script-e2e',
  });

  await emitEvent({
    type: type === 'BASE' ? 'Consent.Signed.Base' : 'Consent.Signed.Specific',
    subject: { kind: 'patient', id: patientId },
    actorUserId: 'script-e2e',
    meta: { consentId: consentRef.id, episodeId },
  });

  if (type === 'BASE') {
    await advanceEpisode(
      episodeId,
      'Consent.Signed.Base',
      { hasBaseConsent: true },
      { consentId: consentRef.id },
      'EXPLORACION'
    );
  }

  return consentRef.id;
}

async function proposePlan(episodeId: string) {
  const planRef = await db.collection('episodes').doc(episodeId).collection('plan').add({
    protocolKey: 'PROTOCOLO_E2E',
    sessionsPlanned: 3,
    sessionsDone: 0,
    materials: [],
    consentsRequired: ['BASE', 'SPECIFIC'],
    status: 'PROPOSED',
    createdAt: Date.now(),
    createdBy: 'script-e2e',
  });

  await emitEvent({
    type: 'Plan.Proposed',
    subject: { kind: 'plan', id: planRef.id },
    actorUserId: 'script-e2e',
    meta: { episodeId },
  });

  await advanceEpisode(episodeId, 'Plan.Created', undefined, undefined, 'PLAN');
  await advanceEpisode(episodeId, 'Plan.Proposed', undefined, undefined, 'PRESUPUESTO');
}

async function handleQuote(episodeId: string) {
  const quoteRef = await db.collection('episodes').doc(episodeId).collection('quote').add({
    items: [{ label: 'Sesión PRP', qty: 3, price: 150 }],
    total: 450,
    status: 'PRESENTED',
    presentedAt: Date.now(),
    createdAt: Date.now(),
    presentedBy: 'script-e2e',
  });

  await emitEvent({
    type: 'Quote.Presented',
    subject: { kind: 'quote', id: quoteRef.id },
    actorUserId: 'script-e2e',
    meta: { episodeId },
  });

  return quoteRef.id;
}

async function acceptQuote(episodeId: string, quoteId: string) {
  await db
    .collection('episodes')
    .doc(episodeId)
    .collection('quote')
    .doc(quoteId)
    .set(
      {
        status: 'ACCEPTED',
        signedAt: Date.now(),
        acceptedBy: 'script-e2e',
        updatedAt: Date.now(),
      },
      { merge: true }
    );

  await emitEvent({
    type: 'Quote.Accepted',
    subject: { kind: 'quote', id: quoteId },
    actorUserId: 'script-e2e',
    meta: { episodeId, quoteId },
  });

  await advanceEpisode(
    episodeId,
    'Quote.Accepted',
    { hasSpecificConsent: true, quoteStatus: 'ACCEPTED' },
    undefined,
    'TRATAMIENTO'
  );
}

async function scheduleFollowUp(episodeId: string) {
  const followUpRef = await db.collection('episodes').doc(episodeId).collection('followups').add({
    date: Date.now() + 7 * 24 * 60 * 60 * 1000,
    kind: 'REVIEW',
    status: 'PENDING',
    createdAt: Date.now(),
  });

  await emitEvent({
    type: 'FollowUp.Scheduled',
    subject: { kind: 'episode', id: episodeId },
    actorUserId: 'script-e2e',
    meta: { followUpId: followUpRef.id },
  });
}

async function dischargeEpisode(episodeId: string) {
  await db.collection('episodes').doc(episodeId).set(
    {
      closedAt: Date.now(),
      dischargeReason: 'Caso de prueba completado',
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  await emitEvent({
    type: 'Episode.Closed',
    subject: { kind: 'episode', id: episodeId },
    actorUserId: 'script-e2e',
  });

  await advanceEpisode(episodeId, 'Episode.Closed', { dischargeReady: true }, undefined, 'ALTA');

  await advanceEpisode(
    episodeId,
    'Recall.Scheduled',
    { recallScheduled: true },
    { recallDate: Date.now() + 90 * 24 * 60 * 60 * 1000 },
    'MANTENIMIENTO'
  );
}

async function main() {
  console.log('Iniciando flujo E2E...');
  const { episodeId, patientId } = await createLead();
  console.log('Lead creado:', { episodeId, patientId });

  await submitTriage(episodeId);
  await routeTriage(episodeId);
  const appointmentId = await bookAndConfirmAppointment(episodeId, patientId);
  console.log('Cita confirmada:', appointmentId);

  await signConsent(episodeId, patientId, 'BASE');
  await advanceEpisode(episodeId, 'Exploration.Completed', undefined, undefined, 'DIAGNOSTICO');
  await proposePlan(episodeId);
  const quoteId = await handleQuote(episodeId);
  await signConsent(episodeId, patientId, 'SPECIFIC');
  await acceptQuote(episodeId, quoteId);
  await advanceEpisode(episodeId, 'Treatment.ControlReached', { treatmentControlled: true }, undefined, 'SEGUIMIENTO');

  await scheduleFollowUp(episodeId);
  await dischargeEpisode(episodeId);

  const episodeSnap = await db.collection('episodes').doc(episodeId).get();
  console.log('Estado final del episodio:', episodeSnap.data()?.state);
  console.log('Flujo completado. Revisa /events para ver la traza completa.');
}

void main().catch((error) => {
  console.error('Error en el flujo E2E', error);
  process.exitCode = 1;
});
