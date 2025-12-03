// types/modules/formularios.ts

import type { UserRole } from './auth';

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
  | 'yesno'
  | 'heading'
  | 'paragraph';

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
