import { adminDb } from '@/lib/firebaseAdmin';
import type {
  Proyecto,
  ProyectoActualizacion,
  ProyectoHito,
  ProyectoTarea,
  EstadoProyecto,
  TipoProyecto,
  PrioridadProyecto,
} from '@/types/proyectos';

const ESTADOS: EstadoProyecto[] = ['propuesta', 'planificacion', 'en-curso', 'pausado', 'completado', 'cancelado'];
const TIPOS: TipoProyecto[] = ['desarrollo', 'operacional', 'investigacion', 'marketing', 'mejora', 'infraestructura'];
const PRIORIDADES: PrioridadProyecto[] = ['critica', 'alta', 'media', 'baja'];

const toDate = (value: unknown, fallback?: Date): Date | undefined => {
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const toDateFn = (value as { toDate?: () => Date }).toDate;
    if (typeof toDateFn === 'function') {
      try {
        return toDateFn();
      } catch {
        return fallback;
      }
    }
  }
  return fallback;
};

const ensureEstado = (value: unknown): EstadoProyecto =>
  ESTADOS.includes(value as EstadoProyecto) ? (value as EstadoProyecto) : 'planificacion';

const ensureTipo = (value: unknown): TipoProyecto =>
  TIPOS.includes(value as TipoProyecto) ? (value as TipoProyecto) : 'desarrollo';

const ensurePrioridad = (value: unknown): PrioridadProyecto =>
  PRIORIDADES.includes(value as PrioridadProyecto) ? (value as PrioridadProyecto) : 'media';

const mapHitos = (raw: unknown): ProyectoHito[] => {
  if (!Array.isArray(raw)) return [];
  const resultado: ProyectoHito[] = [];
  raw.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const value = item as Record<string, unknown>;
    resultado.push({
      id: String(value.id ?? ''),
      nombre: String(value.nombre ?? 'Hito'),
      descripcion: typeof value.descripcion === 'string' ? value.descripcion : undefined,
      fechaObjetivo: toDate(value.fechaObjetivo, new Date()) ?? new Date(),
      fechaCompletado: toDate(value.fechaCompletado),
      completado: Boolean(value.completado),
      orden: typeof value.orden === 'number' ? value.orden : 0,
    });
  });
  return resultado;
};

const mapActualizaciones = (raw: unknown): ProyectoActualizacion[] => {
  if (!Array.isArray(raw)) return [];
  const resultado: ProyectoActualizacion[] = [];
  raw.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const value = item as Record<string, unknown>;
    resultado.push({
      id: String(value.id ?? ''),
      fecha: toDate(value.fecha, new Date()) ?? new Date(),
      texto: String(value.texto ?? ''),
      tipo: (value.tipo as ProyectoActualizacion['tipo']) ?? 'nota',
      autor: String(value.autor ?? ''),
      autorNombre: typeof value.autorNombre === 'string' ? value.autorNombre : undefined,
    });
  });
  return resultado;
};

const mapTareas = (raw: unknown): ProyectoTarea[] => {
  if (!Array.isArray(raw)) return [];
  const resultado: ProyectoTarea[] = [];
  raw.forEach((item) => {
    if (typeof item !== 'object' || item === null) return;
    const value = item as Record<string, unknown>;
    resultado.push({
      id: String(value.id ?? ''),
      titulo: String(value.titulo ?? 'Tarea'),
      descripcion: typeof value.descripcion === 'string' ? value.descripcion : undefined,
      estado:
        (value.estado as ProyectoTarea['estado']) && ['pendiente', 'en-curso', 'bloqueada', 'completada'].includes(
          String(value.estado)
        )
          ? (value.estado as ProyectoTarea['estado'])
          : 'pendiente',
      prioridad:
        (value.prioridad as ProyectoTarea['prioridad']) && ['alta', 'media', 'baja'].includes(
          String(value.prioridad)
        )
          ? (value.prioridad as ProyectoTarea['prioridad'])
          : 'media',
      asignadoA: typeof value.asignadoA === 'string' ? value.asignadoA : undefined,
      asignadoNombre: typeof value.asignadoNombre === 'string' ? value.asignadoNombre : undefined,
      fechaLimite: toDate(value.fechaLimite),
      completadaEn: toDate(value.completadaEn),
      estimacionHoras: typeof value.estimacionHoras === 'number' ? value.estimacionHoras : undefined,
      horasReales: typeof value.horasReales === 'number' ? value.horasReales : undefined,
      tags: Array.isArray(value.tags) ? (value.tags as string[]) : [],
      orden: typeof value.orden === 'number' ? value.orden : 0,
      createdAt: toDate(value.createdAt, new Date()) ?? new Date(),
      updatedAt: toDate(value.updatedAt, new Date()) ?? new Date(),
    });
  });
  return resultado;
};

const mapProyecto = (id: string, data: Record<string, unknown>): Proyecto => {
  return {
    id,
    nombre: String(data.nombre ?? 'Proyecto sin nombre'),
    descripcion: String(data.descripcion ?? ''),
    tipo: ensureTipo(data.tipo),
    categoria: typeof data.categoria === 'string' ? data.categoria : undefined,
    estado: ensureEstado(data.estado),
    prioridad: ensurePrioridad(data.prioridad),
    responsableUid: String(data.responsableUid ?? ''),
    responsableNombre: String(data.responsableNombre ?? 'Sin responsable'),
    equipo: Array.isArray(data.equipo) ? (data.equipo as Proyecto['equipo']) : [],
    fechaInicio: toDate(data.fechaInicio),
    fechaFinEstimada: toDate(data.fechaFinEstimada),
    fechaFinReal: toDate(data.fechaFinReal),
    progreso: typeof data.progreso === 'number' ? data.progreso : 0,
    hitos: mapHitos(data.hitos),
    presupuesto: typeof data.presupuesto === 'number' ? data.presupuesto : undefined,
    presupuestoGastado: typeof data.presupuestoGastado === 'number' ? data.presupuestoGastado : undefined,
    horasEstimadas: typeof data.horasEstimadas === 'number' ? data.horasEstimadas : undefined,
    horasReales: typeof data.horasReales === 'number' ? data.horasReales : undefined,
    enlaces: Array.isArray(data.enlaces) ? (data.enlaces as Proyecto['enlaces']) : [],
    dependeDe: Array.isArray(data.dependeDe) ? (data.dependeDe as string[]) : undefined,
    bloqueaA: Array.isArray(data.bloqueaA) ? (data.bloqueaA as string[]) : undefined,
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : undefined,
    color: typeof data.color === 'string' ? data.color : undefined,
    actualizaciones: mapActualizaciones(data.actualizaciones),
    tareas: mapTareas(data.tareas),
    createdAt: toDate(data.createdAt, new Date()) ?? new Date(),
    updatedAt: toDate(data.updatedAt, new Date()) ?? new Date(),
    creadoPor: String(data.creadoPor ?? 'sistema'),
    creadoPorNombre: typeof data.creadoPorNombre === 'string' ? data.creadoPorNombre : undefined,
    modificadoPor: typeof data.modificadoPor === 'string' ? data.modificadoPor : undefined,
    archivedAt: toDate(data.archivedAt),
  };
};

export type SerializedProyecto = Omit<
  Proyecto,
  | 'fechaInicio'
  | 'fechaFinEstimada'
  | 'fechaFinReal'
  | 'createdAt'
  | 'updatedAt'
  | 'archivedAt'
  | 'hitos'
  | 'actualizaciones'
  | 'tareas'
> & {
  fechaInicio?: string | null;
  fechaFinEstimada?: string | null;
  fechaFinReal?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  hitos: Array<
    Omit<ProyectoHito, 'fechaObjetivo' | 'fechaCompletado'> & {
      fechaObjetivo: string;
      fechaCompletado?: string | null;
    }
  >;
  actualizaciones: Array<Omit<ProyectoActualizacion, 'fecha'> & { fecha: string }>;
  tareas: Array<
    Omit<ProyectoTarea, 'fechaLimite' | 'completadaEn' | 'createdAt' | 'updatedAt'> & {
      fechaLimite?: string | null;
      completadaEn?: string | null;
      createdAt: string;
      updatedAt: string;
    }
  >;
};

const serializeProyecto = (proyecto: Proyecto): SerializedProyecto => ({
  ...proyecto,
  fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.toISOString() : null,
  fechaFinEstimada: proyecto.fechaFinEstimada ? proyecto.fechaFinEstimada.toISOString() : null,
  fechaFinReal: proyecto.fechaFinReal ? proyecto.fechaFinReal.toISOString() : null,
  createdAt: proyecto.createdAt.toISOString(),
  updatedAt: proyecto.updatedAt.toISOString(),
  archivedAt: proyecto.archivedAt ? proyecto.archivedAt.toISOString() : null,
  hitos: proyecto.hitos.map((hito) => ({
    ...hito,
    fechaObjetivo: hito.fechaObjetivo.toISOString(),
    fechaCompletado: hito.fechaCompletado ? hito.fechaCompletado.toISOString() : null,
  })),
  actualizaciones: proyecto.actualizaciones.map((act) => ({
    ...act,
    fecha: act.fecha.toISOString(),
  })),
  tareas: proyecto.tareas.map((tarea) => ({
    ...tarea,
    fechaLimite: tarea.fechaLimite ? tarea.fechaLimite.toISOString() : null,
    completadaEn: tarea.completadaEn ? tarea.completadaEn.toISOString() : null,
    createdAt: tarea.createdAt.toISOString(),
    updatedAt: tarea.updatedAt.toISOString(),
  })),
});

export function deserializeProyectos(serialized: SerializedProyecto[]): Proyecto[] {
  return serialized.map((item) => ({
    ...item,
    fechaInicio: item.fechaInicio ? new Date(item.fechaInicio) : undefined,
    fechaFinEstimada: item.fechaFinEstimada ? new Date(item.fechaFinEstimada) : undefined,
    fechaFinReal: item.fechaFinReal ? new Date(item.fechaFinReal) : undefined,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    archivedAt: item.archivedAt ? new Date(item.archivedAt) : undefined,
    hitos: item.hitos.map((hito) => ({
      ...hito,
      fechaObjetivo: new Date(hito.fechaObjetivo),
      fechaCompletado: hito.fechaCompletado ? new Date(hito.fechaCompletado) : undefined,
    })),
    actualizaciones: item.actualizaciones.map((act) => ({
      ...act,
      fecha: new Date(act.fecha),
    })),
    tareas: item.tareas.map((tarea) => ({
      ...tarea,
      fechaLimite: tarea.fechaLimite ? new Date(tarea.fechaLimite) : undefined,
      completadaEn: tarea.completadaEn ? new Date(tarea.completadaEn) : undefined,
      createdAt: new Date(tarea.createdAt),
      updatedAt: new Date(tarea.updatedAt),
    })),
  }));
}

export async function getSerializedProyectos(): Promise<SerializedProyecto[]> {
  if (!adminDb) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[proyectos] Firebase Admin no configurado; se devolverá lista vacía.');
    }
    return [];
  }

  const snapshot = await adminDb.collection('proyectos').get();
  return snapshot.docs.map((docSnap) => serializeProyecto(mapProyecto(docSnap.id, docSnap.data() ?? {})));
}
