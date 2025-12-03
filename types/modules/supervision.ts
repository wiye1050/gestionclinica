// types/modules/supervision.ts

// ============================================
// TIPOS PARA SUPERVISIÓN CLÍNICA
// ============================================

export interface EvaluacionSesion {
  id: string;

  // Información de la sesión
  servicioId: string;
  servicioNombre: string;
  grupoId: string;
  grupoNombre: string;
  paciente: string;
  profesionalId: string;
  profesionalNombre: string;

  fecha: Date;
  horaInicio: string;
  horaFin: string;

  // Tiempos
  tiempoEstimado: number; // minutos
  tiempoReal: number; // minutos

  // Evaluación de Técnica y Habilidad (1-5)
  aplicacionProtocolo: number;
  manejoPaciente: number;
  usoEquipamiento: number;
  comunicacion: number;

  // Satisfacción del Paciente
  dolorPostTratamiento: number; // 0-10
  confortDuranteSesion: number; // 1-5
  resultadoPercibido: number; // 1-5

  // Cumplimiento
  protocoloSeguido: boolean;

  // Observaciones
  observaciones?: string;
  mejorasSugeridas?: string;
  fortalezasObservadas?: string;

  // Metadata
  evaluadoPor: string;
  evaluadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstadisticasProfesional {
  profesionalId: string;
  profesionalNombre: string;

  // Totales
  totalEvaluaciones: number;

  // Promedios generales
  promedioGeneral: number;
  promedioAplicacionProtocolo: number;
  promedioManejoPaciente: number;
  promedioUsoEquipamiento: number;
  promedioComunicacion: number;

  // Satisfacción
  promedioSatisfaccionPaciente: number;

  // Tiempos
  puntualidad: number; // porcentaje
  desviacionTiempoPromedio: number; // minutos de diferencia

  // Cumplimiento
  cumplimientoProtocolos: number; // porcentaje

  // Última actualización
  ultimaEvaluacion?: Date;
}

export interface MetricasCalidad {
  // Período
  fechaInicio: Date;
  fechaFin: Date;

  // Indicadores clave
  cumplimientoProtocolos: number; // porcentaje
  satisfaccionPromedio: number; // 1-5
  puntualidadPromedio: number; // porcentaje

  // Totales
  totalEvaluaciones: number;
  totalProfesionales: number;

  // Por profesional
  rendimientoPorProfesional: {
    profesionalId: string;
    profesionalNombre: string;
    promedio: number;
    totalEvaluaciones: number;
  }[];

  // Alertas
  alertasTiempoExcedido: number;
  alertasSatisfaccionBaja: number;
  alertasProtocoloNoSeguido: number;
}
