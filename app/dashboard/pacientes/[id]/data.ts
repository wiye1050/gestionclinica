import { serverFetchGet } from '@/lib/utils/serverFetch';
import { logger } from '@/lib/utils/logger';
import type {
  Paciente,
  Profesional,
  RegistroHistorialPaciente,
  ServicioAsignado,
  PacienteFactura,
  PacientePresupuesto,
  PacienteDocumento,
  RespuestaFormulario,
} from '@/types';

/**
 * Data structure returned by the detail API endpoint
 */
export interface PatientDetailData {
  paciente: Paciente;
  historial: RegistroHistorialPaciente[];
  serviciosRelacionados: ServicioAsignado[];
  facturas: PacienteFactura[];
  presupuestos: PacientePresupuesto[];
  documentos: PacienteDocumento[];
}

/**
 * Fetch complete patient detail data from server
 * Used in Server Components for initial data loading
 */
export async function fetchPatientDetail(pacienteId: string): Promise<PatientDetailData | null> {
  try {
    const data = await serverFetchGet<PatientDetailData>(
      `/api/pacientes/${pacienteId}/detail`,
      `paciente-detail-${pacienteId}`,
      'fetch-patient-detail'
    );
    return data;
  } catch (error) {
    logger.error('Error fetching patient detail:', error as Error);
    return null;
  }
}

/**
 * Fetch all professionals from server
 * Used in Server Components for professional selection
 */
export async function fetchProfesionales(): Promise<Profesional[]> {
  try {
    const data = await serverFetchGet<Profesional[]>(
      '/api/profesionales?limit=200',
      'profesionales-all',
      'fetch-profesionales'
    );
    return data || [];
  } catch (error) {
    logger.error('Error fetching profesionales:', error as Error);
    return [];
  }
}

/**
 * Fetch patient form responses from server
 * Used in Server Components for form history
 */
export async function fetchPatientFormResponses(pacienteId: string): Promise<RespuestaFormulario[]> {
  try {
    const data = await serverFetchGet<RespuestaFormulario[]>(
      `/api/formularios/respuestas?pacienteId=${pacienteId}&limit=100`,
      `formularios-respuestas-${pacienteId}`,
      'fetch-form-responses'
    );
    return data || [];
  } catch (error) {
    logger.error('Error fetching form responses:', error as Error);
    return [];
  }
}

/**
 * Fetch all patient data in parallel for maximum performance
 * This is the recommended method for Server Components
 */
export async function fetchAllPatientData(pacienteId: string) {
  const [detailData, profesionales, formResponses] = await Promise.all([
    fetchPatientDetail(pacienteId),
    fetchProfesionales(),
    fetchPatientFormResponses(pacienteId),
  ]);

  return {
    detailData,
    profesionales,
    formResponses,
  };
}
