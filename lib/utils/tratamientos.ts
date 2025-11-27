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

export type Tratamiento = Omit<SerializedTratamiento, 'createdAt' | 'updatedAt'> & {
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
  color: '#3B82F6', // Color por defecto (azul)
  descripcion: item.descripcion,
  tiempoEstimado: item.tiempoEstimado ?? 0,
  requiereSala: false,
  requiereSupervision: false,
  requiereApoyo: false,
  profesionalesHabilitados: [],
  activo: item.activo,
  createdAt: parseDate(item.createdAt),
  updatedAt: parseDate(item.updatedAt),
});

export function deserializeTratamientosModule(data: SerializedTratamientosModule): TratamientosModule {
  return {
    tratamientos: data.tratamientos.map(deserializeTratamiento),
    catalogo: data.catalogo.map(deserializeCatalogoItem),
  };
}
