import { adminDb } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/utils/logger';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import type { CatalogoServicio, Profesional, ServicioAsignado } from '@/types';
import { sanitizeInput } from '@/lib/utils/sanitize';
import {
  SerializedServicioAsignado,
  SerializedProfesional,
  SerializedGrupo,
  SerializedCatalogoServicio,
  SerializedServiciosModule,
  deserializeServiciosModule,
} from '@/lib/utils/servicios';

const toISO = (value: unknown): string | undefined => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDate = (value as { toDate?: () => Date }).toDate;
    if (typeof toDate === 'function') {
      try {
        return toDate().toISOString();
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
};

const ensureString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const ensureNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' ? value : Number(value ?? fallback) || fallback;

const ensureBoolean = (value: unknown): boolean => Boolean(value);

type ServicioEstado = ServicioAsignado['estado'];
type Especialidad = Profesional['especialidad'];
type CatalogoCategoria = CatalogoServicio['categoria'];

const ESTADOS: ServicioEstado[] = ['activo', 'pendiente', 'coordinacion', 'pausado', 'completado'];
const ESPECIALIDADES: Especialidad[] = ['medicina', 'fisioterapia', 'enfermeria'];
const CATEGORIAS: CatalogoCategoria[] = ['medicina', 'fisioterapia', 'enfermeria'];

const ensureEstado = (value: unknown): ServicioEstado =>
  ESTADOS.includes(value as ServicioEstado) ? (value as ServicioEstado) : 'activo';

const ensureEspecialidad = (value: unknown): Especialidad =>
  ESPECIALIDADES.includes(value as Especialidad) ? (value as Especialidad) : 'medicina';

const ensureCategoria = (value: unknown): CatalogoCategoria =>
  CATEGORIAS.includes(value as CatalogoCategoria) ? (value as CatalogoCategoria) : 'medicina';

export type CreateServicioInput = {
  catalogoServicioId: string;
  grupoId: string;
  tiquet: string;
  profesionalPrincipalId: string;
  profesionalSegundaOpcionId?: string | null;
  profesionalTerceraOpcionId?: string | null;
  requiereApoyo?: boolean;
  sala?: string;
  supervision?: boolean;
  esActual?: boolean;
  creadoPor: string;
  creadoPorId: string;
};

export type UpdateServicioChanges = {
  esActual?: boolean;
  tiquet?: string;
  profesionalPrincipalId?: string;
  profesionalSegundaOpcionId?: string | null;
  profesionalTerceraOpcionId?: string | null;
};

type ActorInfo = {
  userId: string;
  userEmail?: string;
};

const mapServicio = (doc: QueryDocumentSnapshot): SerializedServicioAsignado => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    catalogoServicioId: ensureString(data.catalogoServicioId),
    catalogoServicioNombre: ensureString(data.catalogoServicioNombre, 'Sin nombre'),
    grupoId: ensureString(data.grupoId),
    grupoNombre: ensureString(data.grupoNombre, 'Sin grupo'),
    esActual: ensureBoolean(data.esActual),
    estado: ensureEstado(data.estado),
    tiquet: ensureString(data.tiquet, 'NO'),
    profesionalPrincipalId: ensureString(data.profesionalPrincipalId),
    profesionalPrincipalNombre: ensureString(data.profesionalPrincipalNombre),
    profesionalSegundaOpcionId: ensureString(data.profesionalSegundaOpcionId ?? '') || undefined,
    profesionalSegundaOpcionNombre: ensureString(data.profesionalSegundaOpcionNombre ?? '') || undefined,
    profesionalTerceraOpcionId: ensureString(data.profesionalTerceraOpcionId ?? '') || undefined,
    profesionalTerceraOpcionNombre: ensureString(data.profesionalTerceraOpcionNombre ?? '') || undefined,
    requiereApoyo: ensureBoolean(data.requiereApoyo),
    sala: ensureString(data.sala ?? '') || undefined,
    tiempoReal: typeof data.tiempoReal === 'number' ? data.tiempoReal : undefined,
    fechaProgramada: toISO(data.fechaProgramada),
    horaInicio: ensureString(data.horaInicio ?? '') || undefined,
    horaFin: ensureString(data.horaFin ?? '') || undefined,
    ultimaRealizacion: toISO(data.ultimaRealizacion),
    proximaRealizacion: toISO(data.proximaRealizacion),
    vecesRealizadoMes: ensureNumber(data.vecesRealizadoMes, 0),
    notas: ensureString(data.notas ?? '') || undefined,
    supervision: ensureBoolean(data.supervision),
    creadoPor: ensureString(data.creadoPor),
    modificadoPor: ensureString(data.modificadoPor ?? '') || undefined,
    updatedAt: toISO(data.updatedAt),
    createdAt: toISO(data.createdAt),
  };
};

const mapProfesional = (doc: QueryDocumentSnapshot): SerializedProfesional => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: ensureString(data.nombre, 'Sin nombre'),
    apellidos: ensureString(data.apellidos, ''),
    especialidad: ensureEspecialidad(data.especialidad),
    email: ensureString(data.email),
    telefono: ensureString(data.telefono ?? '') || undefined,
    activo: data.activo === undefined ? true : Boolean(data.activo),
    horasSemanales: ensureNumber(data.horasSemanales, 40),
    diasTrabajo: Array.isArray(data.diasTrabajo)
      ? (data.diasTrabajo.filter((dia: unknown) => typeof dia === 'string') as string[])
      : [],
    horaInicio: ensureString(data.horaInicio ?? '08:00'),
    horaFin: ensureString(data.horaFin ?? '16:00'),
    serviciosAsignados: ensureNumber(data.serviciosAsignados, 0),
    cargaTrabajo: ensureNumber(data.cargaTrabajo, 0),
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
};

const mapGrupo = (doc: QueryDocumentSnapshot): SerializedGrupo => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: ensureString(data.nombre, 'Sin nombre'),
    pacientes: Array.isArray(data.pacientes)
      ? (data.pacientes.filter((id: unknown) => typeof id === 'string') as string[])
      : [],
    color: ensureString(data.color ?? '#6366f1'),
    activo: data.activo === undefined ? true : Boolean(data.activo),
    medicinaPrincipal: ensureString(data.medicinaPrincipal ?? '') || undefined,
    fisioterapiaPrincipal: ensureString(data.fisioterapiaPrincipal ?? '') || undefined,
    enfermeriaPrincipal: ensureString(data.enfermeriaPrincipal ?? '') || undefined,
    notas: ensureString(data.notas ?? '') || undefined,
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
};

const mapCatalogo = (doc: QueryDocumentSnapshot): SerializedCatalogoServicio => {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: ensureString(data.nombre, 'Servicio'),
    categoria: ensureCategoria(data.categoria),
    color: ensureString(data.color ?? '#3B82F6'),
    descripcion: ensureString(data.descripcion ?? '') || undefined,
    protocolosRequeridos: Array.isArray(data.protocolosRequeridos)
      ? (data.protocolosRequeridos.filter((item: unknown) => typeof item === 'string') as string[])
      : [],
    tiempoEstimado: ensureNumber(data.tiempoEstimado, 45),
    requiereSala: ensureBoolean(data.requiereSala),
    salaPredeterminada: ensureString(data.salaPredeterminada ?? '') || undefined,
    requiereSupervision: ensureBoolean(data.requiereSupervision),
    requiereApoyo: ensureBoolean(data.requiereApoyo),
    frecuenciaMensual: typeof data.frecuenciaMensual === 'number' ? data.frecuenciaMensual : undefined,
    cargaMensualEstimada: ensureString(data.cargaMensualEstimada ?? '') || undefined,
    profesionalesHabilitados: Array.isArray(data.profesionalesHabilitados)
      ? (data.profesionalesHabilitados.filter((id: unknown) => typeof id === 'string') as string[])
      : [],
    activo: data.activo === undefined ? true : Boolean(data.activo),
    createdAt: toISO(data.createdAt),
    updatedAt: toISO(data.updatedAt),
  };
};

export async function getServiciosModuleSerialized(): Promise<SerializedServiciosModule> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('[servicios] Firebase Admin no disponible; devolviendo snapshot vacío.');
    }
    return { servicios: [], profesionales: [], grupos: [], catalogo: [] };
  }

  const [serviciosSnap, profesionalesSnap, gruposSnap, catalogoSnap] = await Promise.all([
    adminDb.collection('servicios-asignados').orderBy('createdAt', 'desc').limit(300).get(),
    adminDb.collection('profesionales').orderBy('apellidos').limit(100).get(),
    adminDb.collection('grupos-pacientes').orderBy('nombre').limit(100).get(),
    adminDb.collection('catalogo-servicios').orderBy('nombre').limit(200).get(),
  ]);

  return {
    servicios: serviciosSnap.docs.map(mapServicio),
    profesionales: profesionalesSnap.docs.map(mapProfesional).filter((prof) => prof.activo),
    grupos: gruposSnap.docs.map(mapGrupo).filter((grupo) => grupo.activo),
    catalogo: catalogoSnap.docs.map(mapCatalogo).filter((servicio) => servicio.activo),
  };
}

export { deserializeServiciosModule };

const notFoundError = (message: string) => {
  const error = new Error(message);
  error.name = 'NotFoundError';
  return error;
};

const profesionalFieldMap = {
  principal: {
    idKey: 'profesionalPrincipalId',
    nameKey: 'profesionalPrincipalNombre',
    allowNull: false,
  },
  segunda: {
    idKey: 'profesionalSegundaOpcionId',
    nameKey: 'profesionalSegundaOpcionNombre',
    allowNull: true,
  },
  tercera: {
    idKey: 'profesionalTerceraOpcionId',
    nameKey: 'profesionalTerceraOpcionNombre',
    allowNull: true,
  },
} as const;

export async function createServicioAsignado(input: CreateServicioInput) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const [catalogSnap, grupoSnap, principalSnap, segundaSnap, terceraSnap] = await Promise.all([
    adminDb.collection('catalogo-servicios').doc(input.catalogoServicioId).get(),
    adminDb.collection('grupos-pacientes').doc(input.grupoId).get(),
    adminDb.collection('profesionales').doc(input.profesionalPrincipalId).get(),
    input.profesionalSegundaOpcionId
      ? adminDb.collection('profesionales').doc(input.profesionalSegundaOpcionId).get()
      : null,
    input.profesionalTerceraOpcionId
      ? adminDb.collection('profesionales').doc(input.profesionalTerceraOpcionId).get()
      : null,
  ]);

  if (!catalogSnap.exists) {
    throw notFoundError('El servicio de catálogo indicado no existe.');
  }
  if (!grupoSnap.exists) {
    throw notFoundError('El grupo seleccionado no existe.');
  }
  if (!principalSnap.exists) {
    throw notFoundError('El profesional principal no existe.');
  }

  const catalogo = catalogSnap.data() ?? {};
  const grupo = grupoSnap.data() ?? {};
  const principal = principalSnap.data() ?? {};
  const segunda = segundaSnap?.data() ?? null;
  const tercera = terceraSnap?.data() ?? null;

  const now = new Date();

  const payload = {
    catalogoServicioId: catalogSnap.id,
    catalogoServicioNombre: catalogo.nombre ?? 'Sin nombre',
    grupoId: grupoSnap.id,
    grupoNombre: grupo.nombre ?? 'Sin grupo',
    esActual: Boolean(input.esActual),
    estado: 'activo',
    tiquet: sanitizeInput(input.tiquet ?? 'NO'),
    profesionalPrincipalId: principalSnap.id,
    profesionalPrincipalNombre: `${principal.nombre ?? ''} ${principal.apellidos ?? ''}`.trim(),
    profesionalSegundaOpcionId: input.profesionalSegundaOpcionId || undefined,
    profesionalSegundaOpcionNombre: segunda
      ? `${segunda.nombre ?? ''} ${segunda.apellidos ?? ''}`.trim()
      : '',
    profesionalTerceraOpcionId: input.profesionalTerceraOpcionId || undefined,
    profesionalTerceraOpcionNombre: tercera
      ? `${tercera.nombre ?? ''} ${tercera.apellidos ?? ''}`.trim()
      : '',
    requiereApoyo: input.requiereApoyo ?? Boolean(catalogo.requiereApoyo),
    sala: sanitizeInput(input.sala || catalogo.salaPredeterminada || ''),
    tiempoReal: catalogo.tiempoEstimado ?? null,
    supervision: input.supervision ?? Boolean(catalogo.requiereSupervision),
    vecesRealizadoMes: 0,
    createdAt: now,
    updatedAt: now,
    creadoPor: input.creadoPor,
    creadoPorId: input.creadoPorId,
  } satisfies Partial<ServicioAsignado> & Record<string, unknown>;

  const docRef = await adminDb.collection('servicios-asignados').add(payload);

  await adminDb.collection('auditLogs').add({
    modulo: 'servicios',
    accion: 'create',
    refId: docRef.id,
    userId: input.creadoPorId,
    userEmail: input.creadoPor,
    payload,
    createdAt: now,
  });

  return { id: docRef.id, ...payload };
}

async function resolveProfesionalNombre(profesionalId: string) {
  const snap = await adminDb!.collection('profesionales').doc(profesionalId).get();
  if (!snap.exists) {
    throw notFoundError('El profesional indicado no existe.');
  }
  const data = snap.data() ?? {};
  return `${data.nombre ?? ''} ${data.apellidos ?? ''}`.trim();
}

export async function updateServicioAsignado(
  servicioId: string,
  changes: UpdateServicioChanges,
  actor: ActorInfo
) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('servicios-asignados').doc(servicioId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw notFoundError('El servicio asignado no existe.');
  }

  const updateData: Record<string, unknown> = {};
  const now = new Date();

  if (typeof changes.esActual === 'boolean') {
    updateData.esActual = changes.esActual;
  }
  if (typeof changes.tiquet === 'string') {
    updateData.tiquet = sanitizeInput(changes.tiquet);
  }

  const profesionalUpdates: Array<{
    field: keyof typeof profesionalFieldMap;
    value: string | null | undefined;
  }> = [];

  if (changes.profesionalPrincipalId !== undefined) {
    profesionalUpdates.push({ field: 'principal', value: changes.profesionalPrincipalId ? sanitizeInput(changes.profesionalPrincipalId) : null });
  }
  if (changes.profesionalSegundaOpcionId !== undefined) {
    profesionalUpdates.push({
      field: 'segunda',
      value: changes.profesionalSegundaOpcionId ? sanitizeInput(changes.profesionalSegundaOpcionId) : null,
    });
  }
  if (changes.profesionalTerceraOpcionId !== undefined) {
    profesionalUpdates.push({
      field: 'tercera',
      value: changes.profesionalTerceraOpcionId ? sanitizeInput(changes.profesionalTerceraOpcionId) : null,
    });
  }

  for (const update of profesionalUpdates) {
    const config = profesionalFieldMap[update.field];
    if (!update.value) {
      if (!config.allowNull) {
        throw new Error('El profesional principal es obligatorio.');
      }
      updateData[config.idKey] = null;
      updateData[config.nameKey] = '';
      continue;
    }
    const nombre = await resolveProfesionalNombre(update.value);
    updateData[config.idKey] = update.value;
    updateData[config.nameKey] = nombre;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('No se proporcionaron cambios para actualizar.');
  }

  updateData.updatedAt = now;
  updateData.modificadoPor = actor.userEmail ?? 'desconocido';
  updateData.modificadoPorId = actor.userId;

  await docRef.update(updateData);

  await adminDb.collection('auditLogs').add({
    modulo: 'servicios',
    accion: 'update',
    refId: servicioId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: updateData,
    before: snapshot.data(),
    createdAt: now,
  });
}

export async function deleteServicioAsignado(servicioId: string, actor: ActorInfo) {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado.');
  }

  const docRef = adminDb.collection('servicios-asignados').doc(servicioId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    throw notFoundError('El servicio asignado no existe.');
  }

  await docRef.delete();

  await adminDb.collection('auditLogs').add({
    modulo: 'servicios',
    accion: 'delete',
    refId: servicioId,
    userId: actor.userId,
    userEmail: actor.userEmail,
    payload: snapshot.data(),
    createdAt: new Date(),
  });
}
