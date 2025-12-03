// types/modules/agenda.ts

// ============================================
// TIPOS PARA AGENDA Y SALAS
// ============================================

export type EstadoEventoAgenda = 'programada' | 'confirmada' | 'realizada' | 'cancelada';
export type TipoEventoAgenda = 'clinico' | 'coordinacion' | 'reunion';

export interface EventoAgenda {
  id: string;
  titulo: string;
  tipo: TipoEventoAgenda;
  pacienteId?: string;
  grupoPacienteId?: string;
  profesionalId: string;
  salaId?: string;
  servicioId?: string;
  fechaInicio: Date;
  fechaFin: Date;
  duracion: number;
  estado: EstadoEventoAgenda;
  prioridad?: 'alta' | 'media' | 'baja';
  motivo?: string;
  notas?: string;
  requiereSeguimiento?: boolean;
  recordatoriosEnviados?: Array<{ tipo: 'email' | 'sms'; fecha: Date }>;
  creadoPor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BloqueAgenda {
  id: string;
  profesionalId: string;
  salaId?: string;
  diaSemana: number; // 0-6
  horaInicio: string;
  horaFin: string;
  tipo: 'disponible' | 'bloqueado' | 'descanso';
  vigenciaInicio: Date;
  vigenciaFin?: Date;
  motivo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SalaClinica {
  id: string;
  nombre: string;
  tipo: 'consulta' | 'quirurgica' | 'rehabilitacion' | 'diagnostico' | 'general';
  capacidad: number;
  equipamiento: string[];
  estado: 'activa' | 'mantenimiento' | 'inactiva';
  colorAgenda?: string;
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
  modificadoPor?: string;
}
