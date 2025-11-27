import type { CatalogoServicio } from '@/types';

export type SerializedCatalogoServicio = {
  id: string;
  nombre: string;
  categoria: CatalogoServicio['categoria'];
  descripcion?: string;
  tiempoEstimado: number;
  requiereSala: boolean;
  salaPredeterminada?: string;
  requiereSupervision: boolean;
  requiereApoyo: boolean;
  frecuenciaMensual?: number;
  cargaMensualEstimada?: string;
  profesionalesHabilitados: string[];
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const parseDate = (value?: string): Date | undefined => (value ? new Date(value) : undefined);

export const deserializeCatalogoServicio = (item: SerializedCatalogoServicio): CatalogoServicio => ({
  id: item.id,
  nombre: item.nombre,
  categoria: item.categoria,
  color: '#3B82F6', // Color por defecto (azul)
  descripcion: item.descripcion,
  tiempoEstimado: item.tiempoEstimado,
  requiereSala: item.requiereSala,
  salaPredeterminada: item.salaPredeterminada,
  requiereSupervision: item.requiereSupervision,
  requiereApoyo: item.requiereApoyo,
  frecuenciaMensual: item.frecuenciaMensual,
  cargaMensualEstimada: item.cargaMensualEstimada,
  profesionalesHabilitados: item.profesionalesHabilitados,
  activo: item.activo,
  createdAt: parseDate(item.createdAt),
  updatedAt: parseDate(item.updatedAt),
});
