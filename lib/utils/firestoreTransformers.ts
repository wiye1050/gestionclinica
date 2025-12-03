/**
 * Transformadores centralizados para documentos de Firestore
 * Eliminan la duplicación de código de transformación en toda la aplicación
 */

import type {
  Paciente,
  Profesional,
  RegistroHistorialPaciente,
  ServicioAsignado,
  GrupoPaciente,
  CatalogoServicio,
  Sala,
  PacienteFactura,
  FacturaItem,
  PacientePresupuesto,
  PresupuestoItem,
  PacienteDocumento,
} from '@/types';

// Tipos auxiliares para datos raw de Firestore
type FirestoreTimestamp = { toDate?: () => Date };

type ConsentimientoRaw = {
  tipo?: string;
  fecha?: FirestoreTimestamp;
  documentoId?: string;
  firmadoPor?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FirestoreDoc = { id: string; data: () => Record<string, any> | undefined };

/**
 * Transforma un documento de Firestore a tipo Profesional
 */
export function transformProfesional(doc: FirestoreDoc): Profesional {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: data.nombre ?? 'Sin nombre',
    apellidos: data.apellidos ?? '',
    especialidad: data.especialidad ?? 'medicina',
    email: data.email ?? '',
    telefono: data.telefono,
    activo: data.activo ?? true,
    horasSemanales: data.horasSemanales ?? 0,
    diasTrabajo: Array.isArray(data.diasTrabajo) ? data.diasTrabajo : [],
    horaInicio: data.horaInicio ?? '09:00',
    horaFin: data.horaFin ?? '17:00',
    serviciosAsignados: data.serviciosAsignados ?? 0,
    cargaTrabajo: data.cargaTrabajo ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

/**
 * Transforma un documento de Firestore a tipo Paciente
 */
export function transformPaciente(doc: FirestoreDoc): Paciente {
  const data = doc.data() ?? {};

  const consentimientos = Array.isArray(data.consentimientos)
    ? (data.consentimientos as ConsentimientoRaw[]).map((item) => ({
        tipo: item?.tipo ?? 'general',
        fecha: item?.fecha?.toDate?.() ?? new Date(),
        documentoId: item?.documentoId,
        firmadoPor: item?.firmadoPor,
      }))
    : [];

  return {
    id: doc.id,
    numeroHistoria: data.numeroHistoria ?? '',
    nombre: data.nombre ?? 'Sin nombre',
    apellidos: data.apellidos ?? '',
    fechaNacimiento: data.fechaNacimiento?.toDate?.() ?? new Date('1970-01-01'),
    genero: data.genero ?? 'no-especificado',
    documentoId: data.documentoId,
    tipoDocumento: data.tipoDocumento,
    telefono: data.telefono,
    email: data.email,
    direccion: data.direccion,
    ciudad: data.ciudad,
    codigoPostal: data.codigoPostal,
    aseguradora: data.aseguradora,
    numeroPoliza: data.numeroPoliza,
    alergias: Array.isArray(data.alergias) ? data.alergias : [],
    alertasClinicas: Array.isArray(data.alertasClinicas) ? data.alertasClinicas : [],
    diagnosticosPrincipales: Array.isArray(data.diagnosticosPrincipales)
      ? data.diagnosticosPrincipales
      : [],
    riesgo: data.riesgo ?? 'medio',
    contactoEmergencia: data.contactoEmergencia
      ? {
          nombre: data.contactoEmergencia.nombre ?? '',
          parentesco: data.contactoEmergencia.parentesco ?? '',
          telefono: data.contactoEmergencia.telefono ?? '',
        }
      : undefined,
    consentimientos,
    estado: data.estado ?? 'activo',
    profesionalReferenteId: data.profesionalReferenteId,
    grupoPacienteId: data.grupoPacienteId,
    notasInternas: data.notasInternas,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    creadoPor: data.creadoPor ?? 'desconocido',
    modificadoPor: data.modificadoPor,
  };
}

/**
 * Transforma un documento de Firestore a tipo RegistroHistorialPaciente
 */
export function transformHistorialPaciente(
  doc: FirestoreDoc,
  defaultPacienteId?: string
): RegistroHistorialPaciente {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    pacienteId: data.pacienteId ?? defaultPacienteId ?? '',
    eventoAgendaId: data.eventoAgendaId,
    servicioId: data.servicioId,
    servicioNombre: data.servicioNombre,
    profesionalId: data.profesionalId,
    profesionalNombre: data.profesionalNombre,
    fecha: data.fecha?.toDate?.() ?? new Date(),
    tipo: data.tipo ?? 'consulta',
    descripcion: data.descripcion ?? '',
    resultado: data.resultado,
    planesSeguimiento: data.planesSeguimiento,
    adjuntos: Array.isArray(data.adjuntos) ? data.adjuntos : [],
    adjuntosMetadata: Array.isArray(data.adjuntosMetadata) ? data.adjuntosMetadata : [],
    linkExpiresAt: data.linkExpiresAt?.toDate?.() ?? undefined,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    creadoPor: data.creadoPor ?? 'sistema',
  };
}

/**
 * Transforma un documento de Firestore a tipo ServicioAsignado
 */
export function transformServicioAsignado(doc: FirestoreDoc): ServicioAsignado {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    catalogoServicioId: data.catalogoServicioId,
    catalogoServicioNombre: data.catalogoServicioNombre,
    grupoId: data.grupoId,
    grupoNombre: data.grupoNombre,
    esActual: data.esActual ?? false,
    estado: data.estado ?? 'activo',
    tiquet: data.tiquet ?? 'NO',
    profesionalPrincipalId: data.profesionalPrincipalId,
    profesionalPrincipalNombre: data.profesionalPrincipalNombre,
    requiereApoyo: data.requiereApoyo ?? false,
    sala: data.sala,
    tiempoReal: data.tiempoReal,
    supervision: data.supervision ?? false,
    vecesRealizadoMes: data.vecesRealizadoMes ?? 0,
    ultimaRealizacion: data.ultimaRealizacion?.toDate?.(),
    proximaRealizacion: data.proximaRealizacion?.toDate?.(),
    notas: data.notas,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
    creadoPor: data.creadoPor ?? 'sistema',
  };
}

/**
 * Transforma un documento de Firestore a tipo GrupoPaciente
 */
export function transformGrupoPaciente(doc: FirestoreDoc): GrupoPaciente {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: data.nombre ?? 'Sin nombre',
    pacientes: Array.isArray(data.pacientes) ? data.pacientes : [],
    color: data.color ?? '#3B82F6',
    activo: data.activo ?? true,
    medicinaPrincipal: data.medicinaPrincipal,
    fisioterapiaPrincipal: data.fisioterapiaPrincipal,
    enfermeriaPrincipal: data.enfermeriaPrincipal,
    notas: data.notas,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

/**
 * Transforma un documento de Firestore a tipo CatalogoServicio
 */
export function transformCatalogoServicio(doc: FirestoreDoc): CatalogoServicio {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: data.nombre ?? 'Sin nombre',
    categoria: data.categoria ?? 'medicina',
    color: data.color ?? '#3B82F6',
    descripcion: data.descripcion,
    protocolosRequeridos: Array.isArray(data.protocolosRequeridos) ? data.protocolosRequeridos : [],
    tiempoEstimado: data.tiempoEstimado ?? 30,
    requiereSala: data.requiereSala ?? false,
    salaPredeterminada: data.salaPredeterminada,
    requiereSupervision: data.requiereSupervision ?? false,
    requiereApoyo: data.requiereApoyo ?? false,
    frecuenciaMensual: data.frecuenciaMensual,
    cargaMensualEstimada: data.cargaMensualEstimada,
    profesionalesHabilitados: Array.isArray(data.profesionalesHabilitados)
      ? data.profesionalesHabilitados
      : [],
    activo: data.activo ?? true,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

function mapItems(items: unknown[], defaultConcepto = 'Concepto'): FacturaItem[] {
  return items
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const typed = item as {
        concepto?: string;
        cantidad?: number;
        precioUnitario?: number;
        total?: number;
      };
      return {
        concepto: typed.concepto ?? defaultConcepto,
        cantidad: Number(typed.cantidad ?? 1),
        precioUnitario: Number(typed.precioUnitario ?? 0),
        total: Number(typed.total ?? 0),
      };
    })
    .filter(Boolean) as FacturaItem[];
}

function mapPresupuestoItems(items: unknown[]): PresupuestoItem[] {
  return items
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const typed = item as {
        concepto?: string;
        cantidad?: number;
        precioUnitario?: number;
        total?: number;
      };
      return {
        concepto: typed.concepto ?? 'Concepto',
        cantidad: Number(typed.cantidad ?? 1),
        precioUnitario: Number(typed.precioUnitario ?? 0),
        total: Number(typed.total ?? 0),
      };
    })
    .filter(Boolean) as PresupuestoItem[];
}

export function transformPacienteFactura(
  doc: FirestoreDoc,
  defaultPacienteId?: string
): PacienteFactura {
  const data = doc.data() ?? {};
  const items = Array.isArray(data.items) ? mapItems(data.items) : [];
  return {
    id: doc.id,
    pacienteId: data.pacienteId ?? defaultPacienteId ?? '',
    numero: data.numero ?? doc.id,
    fecha: data.fecha?.toDate?.() ?? new Date(),
    vencimiento: data.vencimiento?.toDate?.(),
    concepto: data.concepto ?? 'Sin concepto',
    estado: data.estado ?? 'pendiente',
    total: Number(data.total ?? 0),
    pagado: Number(data.pagado ?? 0),
    metodoPago: data.metodoPago,
    fechaPago: data.fechaPago?.toDate?.(),
    items,
    notas: data.notas,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export function transformPacientePresupuesto(
  doc: FirestoreDoc,
  defaultPacienteId?: string
): PacientePresupuesto {
  const data = doc.data() ?? {};
  const items = Array.isArray(data.items) ? mapPresupuestoItems(data.items) : [];
  return {
    id: doc.id,
    pacienteId: data.pacienteId ?? defaultPacienteId ?? '',
    numero: data.numero ?? doc.id,
    fecha: data.fecha?.toDate?.() ?? new Date(),
    validoHasta: data.validoHasta?.toDate?.(),
    concepto: data.concepto ?? 'Sin concepto',
    estado: data.estado ?? 'pendiente',
    total: Number(data.total ?? 0),
    items,
    notas: data.notas,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export function transformPacienteDocumento(
  doc: FirestoreDoc,
  defaultPacienteId?: string
): PacienteDocumento {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    pacienteId: data.pacienteId ?? defaultPacienteId ?? '',
    nombre: data.nombre ?? 'Documento',
    tipo: data.tipo ?? 'otro',
    tamaño: Number(data.tamaño ?? data.tamano ?? 0),
    url: data.url ?? '',
    storagePath: data.storagePath,
    fechaSubida: data.fechaSubida?.toDate?.() ?? new Date(),
    subidoPor: data.subidoPor ?? 'sistema',
    etiquetas: Array.isArray(data.etiquetas) ? data.etiquetas : [],
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

/**
 * Transforma un documento de Firestore a tipo Sala
 */
export function transformSala(doc: FirestoreDoc): Sala {
  const data = doc.data() ?? {};
  return {
    id: doc.id,
    nombre: data.nombre ?? 'Sin nombre',
    tipo: data.tipo ?? 'general',
    capacidad: data.capacidad ?? 0,
    equipamiento: Array.isArray(data.equipamiento) ? data.equipamiento : [],
    activa: data.activa ?? true,
    ocupacionActual: data.ocupacionActual ?? 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

/**
 * Helper para extraer nombre completo de profesional
 */
export function getProfesionalNombreCompleto(profesional: Profesional): string {
  return `${profesional.nombre} ${profesional.apellidos}`.trim();
}

/**
 * Helper para extraer nombre completo de paciente
 */
export function getPacienteNombreCompleto(paciente: Paciente): string {
  return `${paciente.nombre} ${paciente.apellidos}`.trim();
}

/**
 * Convierte un valor de Firestore Timestamp a ISO string
 * Útil para serializar respuestas de API
 */
export function toDateISO(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    const date = (value as { toDate: () => Date }).toDate();
    return date instanceof Date ? date.toISOString() : null;
  }
  return null;
}

/**
 * Convierte un valor de Firestore Timestamp a Date o retorna null
 */
export function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}
