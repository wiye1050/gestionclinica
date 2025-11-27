import type { CatalogoServicio, GrupoPaciente, Profesional, ServicioAsignado } from '@/types';

export type SerializedServicioAsignado = Omit<
  ServicioAsignado,
  'createdAt' | 'updatedAt' | 'fechaProgramada' | 'ultimaRealizacion' | 'proximaRealizacion'
> & {
  createdAt?: string;
  updatedAt?: string;
  fechaProgramada?: string;
  ultimaRealizacion?: string;
  proximaRealizacion?: string;
};

export type SerializedProfesional = Omit<Profesional, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedGrupo = Omit<GrupoPaciente, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedCatalogoServicio = Omit<CatalogoServicio, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedServiciosModule = {
  servicios: SerializedServicioAsignado[];
  profesionales: SerializedProfesional[];
  grupos: SerializedGrupo[];
  catalogo: SerializedCatalogoServicio[];
};

type ServiciosModuleHydrated = {
  servicios: ServicioAsignado[];
  profesionales: Profesional[];
  grupos: GrupoPaciente[];
  catalogo: CatalogoServicio[];
};

const parseDate = (value?: string): Date => (value ? new Date(value) : new Date());
const parseOptionalDate = (value?: string): Date | undefined => (value ? new Date(value) : undefined);

export function deserializeServiciosModule(serialized: SerializedServiciosModule): ServiciosModuleHydrated {
  return {
    servicios: serialized.servicios.map((servicio) => ({
      ...servicio,
      createdAt: parseDate(servicio.createdAt),
      updatedAt: parseDate(servicio.updatedAt),
      fechaProgramada: parseOptionalDate(servicio.fechaProgramada),
      ultimaRealizacion: parseOptionalDate(servicio.ultimaRealizacion),
      proximaRealizacion: parseOptionalDate(servicio.proximaRealizacion),
    })),
    profesionales: serialized.profesionales.map((profesional) => ({
      ...profesional,
      createdAt: parseDate(profesional.createdAt),
      updatedAt: parseDate(profesional.updatedAt),
    })),
    grupos: serialized.grupos.map((grupo) => ({
      ...grupo,
      createdAt: parseDate(grupo.createdAt),
      updatedAt: parseDate(grupo.updatedAt),
    })),
    catalogo: serialized.catalogo.map((servicio) => ({
      ...servicio,
      createdAt: parseDate(servicio.createdAt),
      updatedAt: parseDate(servicio.updatedAt),
    })),
  };
}
