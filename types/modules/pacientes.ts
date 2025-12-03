// types/modules/pacientes.ts

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
