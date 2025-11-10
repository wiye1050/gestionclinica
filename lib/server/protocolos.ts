import { adminDb } from '@/lib/firebaseAdmin';
import { sanitizeHTML, sanitizeInput, sanitizeStringArray } from '@/lib/utils/sanitize';

const assertDb = () => {
  if (!adminDb) throw new Error('Firebase Admin no configurado');
  return adminDb;
};

export type ProtocolInput = {
  titulo: string;
  area: string;
  descripcion?: string;
  requiereQuiz: boolean;
  visiblePara: string[];
};

export async function createProtocolo(input: ProtocolInput, actor: { uid: string; email?: string | null }) {
  const db = assertDb();
  const now = new Date();
  const cleanInput: ProtocolInput = {
    ...input,
    titulo: sanitizeInput(input.titulo),
    area: sanitizeInput(input.area),
    descripcion: input.descripcion ? sanitizeHTML(input.descripcion) : undefined,
    visiblePara: sanitizeStringArray(input.visiblePara),
  };
  const payload = {
    ...cleanInput,
    estado: 'borrador',
    checklistBasica: input.requiereQuiz ? [] : cleanInput.visiblePara,
    creadoPor: actor.uid,
    creadoPorNombre: actor.email ?? 'sistema',
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection('protocolos').add(payload);
  await db.collection('auditLogs').add({
    modulo: 'protocolos',
    accion: 'create',
    refId: docRef.id,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload,
    createdAt: now,
  });

  return { id: docRef.id };
}

export async function registerLectura(
  protocoloId: string,
  data: { version: number; checklistConfirmada: boolean },
  actor: { uid: string; email?: string | null }
) {
  const db = assertDb();
  await db.collection('protocolos-lecturas').add({
    protocoloId,
    version: data.version,
    checklistConfirmada: data.checklistConfirmada,
    usuarioUid: actor.uid,
    usuarioNombre: actor.email ?? 'usuario',
    leidoEn: new Date(),
  });

  await db.collection('auditLogs').add({
    modulo: 'protocolos',
    accion: 'registrar-lectura',
    refId: protocoloId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: data,
    createdAt: new Date(),
  });
}

export async function createVersion(
  protocoloId: string,
  contenido: string,
  actor: { uid: string; email?: string | null }
) {
  const db = assertDb();
  const latestSnap = await db
    .collection('protocolos-versiones')
    .where('protocoloId', '==', protocoloId)
    .orderBy('version', 'desc')
    .limit(1)
    .get();
  const nextVersion = (latestSnap.docs[0]?.data()?.version ?? 0) + 1;

  await db.collection('protocolos-versiones').add({
    protocoloId,
    version: nextVersion,
    contenido: sanitizeHTML(contenido),
    creadoPor: actor.uid,
    creadoPorNombre: actor.email ?? 'sistema',
    createdAt: new Date(),
  });

  await db.collection('auditLogs').add({
    modulo: 'protocolos',
    accion: 'create-version',
    refId: protocoloId,
    userId: actor.uid,
    userEmail: actor.email ?? undefined,
    payload: { version: nextVersion },
    createdAt: new Date(),
  });

  return { version: nextVersion };
}
