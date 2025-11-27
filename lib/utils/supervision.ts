import type {
  EvaluacionSesion,
  ServicioAsignado,
  Profesional,
  GrupoPaciente,
} from '@/types';

export type SerializedEvaluacion = Omit<EvaluacionSesion, 'fecha' | 'createdAt' | 'updatedAt'> & {
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedServicio = Omit<
  ServicioAsignado,
  'createdAt' | 'updatedAt' | 'fechaProgramada'
> & {
  createdAt?: string;
  updatedAt?: string;
  fechaProgramada?: string;
};

export type SerializedProfesional = Omit<Profesional, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedGrupo = Omit<GrupoPaciente, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedSupervisionModule = {
  evaluaciones: SerializedEvaluacion[];
  servicios: SerializedServicio[];
  profesionales: SerializedProfesional[];
  grupos: SerializedGrupo[];
};

const parseDate = (value?: string): Date => (value ? new Date(value) : new Date());
const parseOptionalDate = (value?: string): Date | undefined => (value ? new Date(value) : undefined);

export function deserializeEvaluacion(evaluacion: SerializedEvaluacion): EvaluacionSesion {
  return {
    ...evaluacion,
    fecha: parseOptionalDate(evaluacion.fecha) ?? new Date(),
    createdAt: parseOptionalDate(evaluacion.createdAt) ?? new Date(),
    updatedAt: parseOptionalDate(evaluacion.updatedAt) ?? new Date(),
  } as EvaluacionSesion;
}

export function deserializeServicio(servicio: SerializedServicio): ServicioAsignado {
  return {
    ...servicio,
    createdAt: parseDate(servicio.createdAt),
    updatedAt: parseDate(servicio.updatedAt),
    fechaProgramada: parseOptionalDate(servicio.fechaProgramada),
  } as ServicioAsignado;
}

export function deserializeProfesionalSupervision(profesional: SerializedProfesional): Profesional {
  return {
    ...profesional,
    createdAt: parseDate(profesional.createdAt),
    updatedAt: parseDate(profesional.updatedAt),
  } as Profesional;
}

export function deserializeGrupoSupervision(grupo: SerializedGrupo): GrupoPaciente {
  return {
    ...grupo,
    createdAt: parseDate(grupo.createdAt),
    updatedAt: parseDate(grupo.updatedAt),
  } as GrupoPaciente;
}

export function deserializeSupervisionModule(data: SerializedSupervisionModule) {
  return {
    evaluaciones: data.evaluaciones.map(deserializeEvaluacion),
    servicios: data.servicios.map(deserializeServicio),
    profesionales: data.profesionales.map(deserializeProfesionalSupervision),
    grupos: data.grupos.map(deserializeGrupoSupervision),
  };
}
