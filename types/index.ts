// types/index.ts

// ============================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// ============================================

export type UserRole = 'admin' | 'coordinador' | 'profesional' | 'usuario';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  permisos?: string[];
  profesionalId?: string; // Si es profesional, referencia a su ficha
  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================
// TIPOS PARA REPORTE DIARIO
// ============================================

export interface DailyReport {
  id: string;
  fecha: Date;
  hora: string;
  tipo: 'incidencia' | 'mejora' | 'operacion' | 'nota';
  categoria: 'personal' | 'material-sala' | 'servicio' | 'paciente' | 'software';
  prioridad: 'baja' | 'media' | 'alta';
  responsable: 'direccion' | 'administracion' | 'coordinacion';
  descripcion: string;
  estado: 'pendiente' | 'en-proceso' | 'resuelta';
  observaciones?: string;
  
  personasInvolucradas?: string[];
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  fechaLimite?: Date;
  adjuntos?: string[];
  tags?: string[];
  
  historialEstados?: CambioEstado[];
  resolucion?: string;
  fechaResolucion?: Date;
  
  reportadoPor: string;
  reportadoPorId: string;
  reportadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
  modificadoPor?: string;
}

export interface CambioEstado {
  estadoAnterior: 'pendiente' | 'en-proceso' | 'resuelta';
  estadoNuevo: 'pendiente' | 'en-proceso' | 'resuelta';
  fecha: Date;
  usuario: string;
  comentario?: string;
}

export interface EstadisticasReporte {
  totalReportes: number;
  porTipo: Record<string, number>;
  porCategoria: Record<string, number>;
  porPrioridad: Record<string, number>;
  porEstado: Record<string, number>;
  pendientesAlta: number;
  promedioResolucion: number;
}

// ============================================
// TIPOS PARA GESTIÓN DE SERVICIOS Y TAREAS
// ============================================

// Profesionales de la clínica
export interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
  especialidad: 'medicina' | 'fisioterapia' | 'enfermeria';
  /** Color identificativo en formato hexadecimal (ej: "#3B82F6"). Usado en agenda y vistas multi-profesional */
  color?: string;
  email: string;
  telefono?: string;
  activo: boolean;
  
  // Disponibilidad y capacidad
  horasSemanales: number;
  diasTrabajo: string[];
  horaInicio: string;
  horaFin: string;
  
  // Estadísticas
  serviciosAsignados: number;
  cargaTrabajo: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Grupos de pacientes
export interface GrupoPaciente {
  id: string;
  nombre: string;
  pacientes: string[];
  color: string;
  activo: boolean;
  
  // Profesionales asignados por defecto
  medicinaPrincipal?: string;
  fisioterapiaPrincipal?: string;
  enfermeriaPrincipal?: string;
  
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Catálogo de Servicios (plantillas)
export interface CatalogoServicio {
  id: string;
  nombre: string;
  categoria: 'medicina' | 'fisioterapia' | 'enfermeria';
  /** Color del servicio en formato hexadecimal (ej: "#10B981"). Se aplica a eventos de agenda de este servicio */
  color: string;
  descripcion?: string;
  protocolosRequeridos?: string[];
  
  // Configuración del servicio
  tiempoEstimado: number;
  requiereSala: boolean;
  salaPredeterminada?: string;
  requiereSupervision: boolean;
  requiereApoyo: boolean;
  
  // Para cálculos
  frecuenciaMensual?: number;
  cargaMensualEstimada?: string;
  
  // Profesionales que pueden realizar este servicio
  profesionalesHabilitados: string[];

  activo: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Servicios Asignados (instancias reales del catálogo)
export interface ServicioAsignado {
  id: string;
  
  // Referencia al catálogo y grupo
  catalogoServicioId: string;
  catalogoServicioNombre: string;
  grupoId: string;
  grupoNombre: string;
  
  // Estado del servicio
  esActual: boolean;
  estado: 'activo' | 'pendiente' | 'coordinacion' | 'pausado' | 'completado';
  tiquet: 'SI' | 'NO' | 'CORD' | 'ESPACH' | string;
  
  // Asignación de profesionales
  profesionalPrincipalId: string;
  profesionalPrincipalNombre: string;
  profesionalSegundaOpcionId?: string;
  profesionalSegundaOpcionNombre?: string;
  profesionalTerceraOpcionId?: string;
  profesionalTerceraOpcionNombre?: string;
  
  // Detalles de ejecución
  requiereApoyo: boolean;
  sala?: string;
  tiempoReal?: number;
  
  // Planificación
  fechaProgramada?: Date;
  horaInicio?: string;
  horaFin?: string;
  
  // Seguimiento
  ultimaRealizacion?: Date;
  proximaRealizacion?: Date;
  vecesRealizadoMes: number;
  
  // Observaciones
  notas?: string;
  supervision: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;
}

// Salas de la clínica
export interface Sala {
  id: string;
  nombre: string;
  tipo: 'medicina' | 'fisioterapia' | 'enfermeria' | 'general';
  capacidad: number;
  equipamiento?: string[];
  activa: boolean;
  
  ocupacionActual?: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// Estadísticas y reportes
export interface EstadisticasServicios {
  totalServicios: number;
  serviciosActivos: number;
  serviciosPendientes: number;
  serviciosCoordinacion: number;
  
  porCategoria: {
    medicina: number;
    fisioterapia: number;
    enfermeria: number;
  };
  
  conTicket: number;
  sinTicket: number;
  enCoordinacion: number;
  
  cargaTotalMensual: number;
  distribucionPorProfesional: {
    profesionalId: string;
    profesionalNombre: string;
    serviciosAsignados: number;
    cargaPorcentaje: number;
  }[];
  
  ocupacionSalas: {
    salaId: string;
    salaNombre: string;
    ocupacionPorcentaje: number;
    serviciosProgramados: number;
  }[];
}

// Plantilla de horario semanal
export interface HorarioSemanal {
  id: string;
  profesionalId: string;
  profesionalNombre: string;
  semana: string;
  
  bloques: {
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';
    horaInicio: string;
    horaFin: string;
    servicioAsignadoId?: string;
    grupoId?: string;
    tipo: 'disponible' | 'ocupado' | 'descanso';
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

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
// AÑADE ESTO AL FINAL DE /types/index.ts

// ============================================
// TIPOS PARA INVENTARIO
// ============================================

export interface ProductoInventario {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'medicamento' | 'fungible' | 'equipamiento' | 'limpieza' | 'oficina' | 'otro';
  subcategoria?: string;
  
  // Stock
  cantidadActual: number;
  cantidadMinima: number;
  cantidadMaxima: number;
  unidadMedida: 'unidad' | 'caja' | 'paquete' | 'litro' | 'gramo' | 'kilo' | 'metro' | 'otro';
  
  // Proveedor
  proveedorId?: string;
  proveedorNombre?: string;
  codigoProveedor?: string;
  
  // Ubicación
  ubicacion: string;
  ubicacionSecundaria?: string;
  
  // Información adicional
  lote?: string;
  fechaCaducidad?: Date;
  precio?: number;
  codigoBarras?: string;
  imagenUrl?: string;
  
  // Alertas
  alertaStockBajo: boolean;
  alertaCaducidad: boolean;
  
  // Estado
  activo: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;
}

// ============================================
// TIPOS PARA PROTOCOLOS CLÍNICOS
// ============================================

export type ProtocolArea = 'medicina' | 'fisioterapia' | 'enfermeria' | 'administracion' | 'marketing' | 'operaciones';
export type ProtocolStatus = 'borrador' | 'revision' | 'publicado' | 'retirado';

export interface Protocolo {
  id: string;
  titulo: string;
  area: ProtocolArea;
  estado: ProtocolStatus;
  descripcion?: string;
  ultimaVersionId?: string;
  requiereQuiz: boolean;
  visiblePara: Array<'admin' | 'coordinacion' | 'terapeuta' | 'admin_ops' | 'marketing' | 'invitado'>;
  checklistBasica?: string[];
  creadoPor: string;
  creadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
  modificadoPor?: string;
}

export interface ProtocoloVersion {
  id: string;
  protocoloId: string;
  version: number;
  titulo: string;
  contenido: string;
  checklist: Array<{ item: string; requerido: boolean }>;
  guionComunicacion?: string;
  anexos?: Array<{ nombre: string; url: string }>;
  quiz?: {
    preguntas: Array<{ pregunta: string; opciones: string[]; respuestaCorrecta: number }>;
  };
  codigoQrUrl?: string;
  aprobado: boolean;
  aprobadoPorUid?: string;
  aprobadoPorNombre?: string;
  aprobadoEn?: Date;
  createdAt: Date;
  createdPor: string;
}

export interface ProtocoloLectura {
  id: string;
  protocoloId: string;
  version: number;
  usuarioUid: string;
  usuarioNombre?: string;
  resultadoQuiz?: number;
  aprobadoQuiz?: boolean;
  checklistConfirmada: boolean;
  leidoEn: Date;
}

export interface AuditLogEntry {
  id: string;
  actorUid: string;
  actorNombre?: string;
  modulo: 'protocolos' | 'mejoras' | 'agenda' | 'pacientes' | string;
  accion: string;
  entidadId: string;
  entidadTipo?: string;
  rutaDetalle?: string;
  resumen?: string;
  detalles?: Record<string, unknown>;
  createdAt: Date;
}

// ============================================
// TIPOS PARA MEJORAS CONTINUAS
// ============================================

export type MejoraEstado = 'idea' | 'en-analisis' | 'planificada' | 'en-progreso' | 'completada';
export type MejoraArea = 'salas' | 'equipos' | 'procedimientos' | 'software' | 'comunicacion' | 'otro';

export interface MejoraRICE {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  score: number;
}

export interface Mejora {
  id: string;
  titulo: string;
  descripcion: string;
  area: MejoraArea;
  estado: MejoraEstado;
  responsableUid?: string;
  responsableNombre?: string;
  rice: MejoraRICE;
  evidenciasCount: number;
  creadoPor: string;
  creadoPorNombre?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MejoraEvidencia {
  id: string;
  mejoraId: string;
  autorUid: string;
  autorNombre?: string;
  tipo: 'imagen' | 'documento' | 'enlace' | 'texto';
  url?: string;
  descripcion?: string;
  createdAt: Date;
}

export interface MejoraTarea {
  id: string;
  mejoraId: string;
  titulo: string;
  estado: 'pendiente' | 'en-curso' | 'hecho';
  responsableUid?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  productoNombre: string;
  
  tipo: 'entrada' | 'salida' | 'ajuste' | 'devolucion' | 'caducado' | 'perdida';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;
  
  motivo?: string;
  observaciones?: string;
  
  // Referencias
  servicioRelacionadoId?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  
  // Metadata
  fecha: Date;
  creadoPor: string;
  createdAt: Date;
}

export interface EstadisticasInventario {
  totalProductos: number;
  productosActivos: number;
  productosStockBajo: number;
  productosProximosCaducar: number;
  
  porCategoria: Record<string, number>;
  valorTotalInventario: number;
  
  movimientosUltimoMes: {
    entradas: number;
    salidas: number;
    ajustes: number;
  };
}

// ============================================
// TIPOS PARA PACIENTES
// ============================================

export type GeneroPaciente = 'masculino' | 'femenino' | 'otro' | 'no-especificado';
export type EstadoPaciente = 'activo' | 'inactivo' | 'egresado';

export interface ContactoEmergencia {
  nombre: string;
  parentesco: string;
  telefono: string;
}

export interface ConsentimientoPaciente {
  tipo: string;
  fecha: Date;
  documentoId?: string;
  firmadoPor?: string;
}

export interface Paciente {
  id: string;
  numeroHistoria: string; // NHC - Número de Historia Clínica (auto-generado, único)
  nombre: string;
  apellidos: string;
  fechaNacimiento: Date;
  genero: GeneroPaciente;
  documentoId?: string;
  tipoDocumento?: string;
  
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  
  aseguradora?: string;
  numeroPoliza?: string;
  
  alergias: string[];
  alertasClinicas: string[];
  diagnosticosPrincipales: string[];
  riesgo: 'alto' | 'medio' | 'bajo';
  
  contactoEmergencia?: ContactoEmergencia;
  consentimientos: ConsentimientoPaciente[];
  
  estado: EstadoPaciente;
  profesionalReferenteId?: string;
  grupoPacienteId?: string;
  
  notasInternas?: string;
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;
}

export interface RegistroHistorialPaciente {
  id: string;
  pacienteId: string;
  eventoAgendaId?: string;
  servicioId?: string;
  servicioNombre?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  fecha: Date;
  tipo: 'consulta' | 'tratamiento' | 'seguimiento' | 'incidencia';
  descripcion: string;
  resultado?: string;
  planesSeguimiento?: string;
  adjuntos?: string[];
  adjuntosMetadata?: Array<{ url: string; storagePath?: string }>;
  linkExpiresAt?: Date;
  createdAt: Date;
  creadoPor: string;
}

// ============================================
// TIPOS PARA FACTURACIÓN DE PACIENTES
// ============================================

export interface FacturaItem {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export type EstadoFactura = 'pagada' | 'pendiente' | 'vencida';

export interface PacienteFactura {
  id: string;
  pacienteId: string;
  numero: string;
  fecha: Date;
  vencimiento?: Date;
  concepto: string;
  estado: EstadoFactura;
  total: number;
  pagado: number;
  metodoPago?: string;
  fechaPago?: Date;
  items: FacturaItem[];
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresupuestoItem {
  concepto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export type EstadoPresupuesto = 'pendiente' | 'aceptado' | 'rechazado' | 'caducado';

export interface PacientePresupuesto {
  id: string;
  pacienteId: string;
  numero: string;
  fecha: Date;
  validoHasta?: Date;
  concepto: string;
  estado: EstadoPresupuesto;
  total: number;
  items: PresupuestoItem[];
  notas?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TipoDocumentoPaciente =
  | 'informe'
  | 'consentimiento'
  | 'receta'
  | 'imagen'
  | 'analitica'
  | 'factura'
  | 'otro';

export interface PacienteDocumento {
  id: string;
  pacienteId: string;
  nombre: string;
  tipo: TipoDocumentoPaciente;
  tamaño: number;
  url: string;
  storagePath?: string;
  fechaSubida: Date;
  subidoPor: string;
  etiquetas: string[];
  createdAt: Date;
  updatedAt: Date;
}

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

// ============================================
// TIPOS PARA NOTIFICACIONES
// ============================================

export type TipoNotificacion = 'seguimiento' | 'stock' | 'incidencia' | 'protocolo' | 'mejora' | 'agenda' | 'sistema';
export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  prioridad: PrioridadNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  
  // Enlaces
  url?: string;
  entidadId?: string;
  entidadTipo?: string;

  // Metadata
  destinatarioUid: string;
  createdAt: Date;
  leidaEn?: Date;
}

// ============================================
// TIPOS PARA MÓDULO DE FORMULARIOS
// ============================================

/**
 * Tipos de formularios disponibles en la clínica
 * Cada tipo puede tener un generador de PDF específico
 */
export type TipoFormulario =
  | 'triaje_telefonico'
  | 'exploracion_fisica'
  | 'peticion_pruebas'
  | 'hoja_recomendaciones'
  | 'consentimiento_informado'
  | 'citacion'
  | 'valoracion_inicial'
  | 'seguimiento'
  | 'alta_medica'
  | 'informe_clinico'
  | 'receta_medica'
  | 'volante_derivacion'
  | 'otro';

/**
 * Estados del formulario plantilla
 */
export type EstadoFormularioPlantilla = 'activo' | 'inactivo' | 'borrador' | 'archivado';

/**
 * Estados de una respuesta de formulario
 */
export type EstadoRespuestaFormulario = 'borrador' | 'completado' | 'validado' | 'archivado';

/**
 * Tipos de campos soportados en los formularios
 */
export type TipoCampoFormulario =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'tel'
  | 'date'
  | 'time'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'signature'
  | 'scale'
  | 'yesno';

/**
 * Definición de un campo en un formulario
 */
export interface CampoFormulario {
  id: string;
  nombre: string;
  etiqueta: string;
  tipo: TipoCampoFormulario;
  descripcion?: string;
  placeholder?: string;

  // Validaciones
  requerido: boolean;
  min?: number;
  max?: number;
  pattern?: string;

  // Opciones para select, radio, checkbox
  opciones?: Array<{ valor: string; etiqueta: string }>;

  // Configuración visual
  ancho?: 'full' | 'half' | 'third';
  orden: number;
  seccion?: string;

  // Visibilidad condicional
  mostrarSi?: {
    campoId: string;
    operador: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    valor: string | number | boolean;
  };
}

/**
 * Plantilla de formulario (template reutilizable)
 * Similar a los formularios en Gravity Forms
 */
export interface FormularioPlantilla {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoFormulario;
  version: number;
  estado: EstadoFormularioPlantilla;

  // Estructura del formulario
  campos: CampoFormulario[];
  secciones?: Array<{ id: string; nombre: string; descripcion?: string; orden: number }>;

  // Configuración
  requiereValidacionMedica: boolean;
  generaPDF: boolean;
  templatePDF?: string; // Referencia al template PDF específico

  // Permisos
  rolesPermitidos: UserRole[];
  especialidadesPermitidas?: Array<'medicina' | 'fisioterapia' | 'enfermeria'>;

  // Estadísticas (similares a Gravity Forms)
  totalRespuestas: number;
  totalVistas: number;
  tasaConversion: number; // (respuestas completadas / vistas) * 100

  // Configuración de notificaciones
  notificarAlCompletar?: boolean;
  emailsNotificacion?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;

  // Campos personalizados adicionales (para futura extensibilidad)
  metadatos?: Record<string, string | number | boolean | null>;
}

/**
 * Respuesta/Instancia completada de un formulario
 * Cada respuesta está asociada a un paciente
 */
export interface RespuestaFormulario {
  id: string;

  // Relación con plantilla
  formularioPlantillaId: string;
  formularioNombre: string;
  formularioTipo: TipoFormulario;
  formularioVersion: number;

  // Relación con entidades
  pacienteId: string;
  pacienteNombre: string;
  pacienteNHC?: string;
  eventoAgendaId?: string; // Opcional: asociado a una cita
  servicioId?: string; // Opcional: asociado a un servicio
  episodioId?: string; // Opcional: para futura implementación de episodios

  // Datos del formulario
  respuestas: Record<string, string | number | boolean | string[] | null>; // { campoId: valor }
  estado: EstadoRespuestaFormulario;

  // Validación médica
  validadoPor?: string;
  validadoPorNombre?: string;
  fechaValidacion?: Date;
  notasValidacion?: string;

  // PDF generado
  pdfGenerado: boolean;
  pdfUrl?: string;
  pdfStoragePath?: string;

  // Firmas digitales (si aplica)
  firmaPaciente?: string; // URL o base64
  firmaProfesional?: string;

  // Seguimiento
  requiereSeguimiento: boolean;
  fechaSeguimiento?: Date;
  estadoSeguimiento?: 'pendiente' | 'en-proceso' | 'completado';

  // Metadata
  completadoEn?: Date;
  tiempoCompletado?: number; // segundos
  ip?: string;
  userAgent?: string;

  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;

  // Notas internas
  notasInternas?: string;
}

/**
 * Estadísticas generales del módulo de formularios
 */
export interface EstadisticasFormularios {
  totalPlantillas: number;
  plantillasActivas: number;
  totalRespuestas: number;
  respuestasCompletadas: number;
  respuestasPendientes: number;

  porTipo: Record<TipoFormulario, {
    total: number;
    completadas: number;
    tasaConversion: number;
  }>;

  porMes: Array<{
    mes: string;
    totalRespuestas: number;
    completadas: number;
  }>;

  plantillasMasUsadas: Array<{
    id: string;
    nombre: string;
    tipo: TipoFormulario;
    totalRespuestas: number;
    tasaConversion: number;
  }>;

  tiempoPromedioCompletado: number; // en segundos
}
