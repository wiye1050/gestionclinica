// types/modules/proyectos.ts

// ============================================
// TIPOS PARA GESTIÓN DE PROYECTOS
// ============================================

export interface Proyecto {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'externo' | 'interno' | 'investigacion';
  estado: 'propuesta' | 'en-curso' | 'completado';
  prioridad: 'baja' | 'media' | 'alta';

  responsable: string;

  fechaInicio?: Date;
  fechaFinEstimada?: Date;
  fechaFinReal?: Date;

  actualizaciones: {
    id: string;
    fecha: Date;
    texto: string;
    autor: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
}
