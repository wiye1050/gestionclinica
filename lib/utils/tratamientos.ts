import type { CatalogoServicio } from '@/types';

export type SerializedTratamiento = {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria' | 'mixto';
  serviciosIncluidos: Array<{
    servicioId: string;
    servicioNombre: string;
    orden: number;
    opcional: boolean;
  }>;
  tiempoTotalEstimado: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedCatalogoServicio = {
  id: string;
  nombre: string;
  categoria: string;
  descripcion?: string;
  tiempoEstimado?: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SerializedTratamientosModule = {
  tratamientos: SerializedTratamiento[];
  catalogo: SerializedCatalogoServicio[];
};

export type Tratamiento = SerializedTratamiento & {
  createdAt?: Date;
  updatedAt?: Date;
};

export type TratamientosModule = {
  tratamientos: Tratamiento[];
  catalogo: CatalogoServicio[];
};

const parseDate = (value?: string): Date | undefined => (value ? new Date(value) : undefined);

export const deserializeTratamiento = (item: SerializedTratamiento): Tratamiento => ({
  ...item,
  createdAt: parseDate(item.createdAt),
  updatedAt: parseDate(item.updatedAt),
});

export const deserializeCatalogoItem = (item: SerializedCatalogoServicio): CatalogoServicio => ({
  id: item.id,
  nombre: item.nombre,
  categoria: item.categoria as CatalogoServicio['categoria'],
  descripcion: item.descripcion,
  tiempoEstimado: item.tiempoEstimado ?? 0,
  activo: item.activo,
  createdAt: parseDate(item.createdAt) ?? new Date(),
  updatedAt: parseDate(item.updatedAt) ?? new Date(),
});

export function deserializeTratamientosModule(data: SerializedTratamientosModule): TratamientosModule {
  return {
    tratamientos: data.tratamientos.map(deserializeTratamiento),
    catalogo: data.catalogo.map(deserializeCatalogoItem),
  };
}
