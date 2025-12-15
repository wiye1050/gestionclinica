import { adminDb } from '@/lib/firebaseAdmin';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cached } from '@/lib/server/cache';

export interface ProfesionalEstadisticas {
  profesionalId: string;
  profesionalNombre: string;
  // Estadísticas de citas
  citasProgramadas: number;
  citasRealizadas: number;
  citasCanceladas: number;
  tasaRealizacion: number; // Porcentaje de citas realizadas vs programadas
  // Pacientes
  pacientesAtendidos: number; // Pacientes únicos
  pacientesActivos: number; // Pacientes con citas recientes (últimos 3 meses)
  // Servicios
  serviciosOfrecidos: string[];
  servicioMasSolicitado?: string;
  // Carga de trabajo
  horasTrabajadas: number; // Estimado basado en duración de citas
  horasDisponibles: number; // Basado en horasSemanales
  porcentajeUso: number; // horasTrabajadas / horasDisponibles
  // Tendencias
  mesActual: {
    citasRealizadas: number;
    pacientesAtendidos: number;
  };
  mesAnterior: {
    citasRealizadas: number;
    pacientesAtendidos: number;
  };
  // Próximas citas
  proximasCitas: number;
}

/**
 * Calcula estadísticas de un profesional para un rango de fechas
 */
export async function calcularEstadisticasProfesional(
  profesionalId: string,
  fechaInicio: Date = subMonths(new Date(), 3),
  fechaFin: Date = new Date()
): Promise<ProfesionalEstadisticas | null> {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado');
  }

  // Obtener datos del profesional
  const profSnap = await adminDb.collection('profesionales').doc(profesionalId).get();
  if (!profSnap.exists) {
    return null;
  }

  const profData = profSnap.data() ?? {};
  const nombre = profData.nombre ?? '';
  const apellidos = profData.apellidos ?? '';
  const profesionalNombre = `${nombre} ${apellidos}`.trim();
  const horasSemanales = profData.horasSemanales ?? 40;

  // Obtener eventos del profesional en el rango de fechas
  const eventosSnap = await adminDb
    .collection('agenda-eventos')
    .where('profesionalId', '==', profesionalId)
    .where('fechaInicio', '>=', fechaInicio)
    .where('fechaInicio', '<=', fechaFin)
    .get();

  const eventos = eventosSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Estadísticas generales
  const citasProgramadas = eventos.filter((e: any) => e.estado === 'programada').length;
  const citasRealizadas = eventos.filter((e: any) => e.estado === 'realizada').length;
  const citasCanceladas = eventos.filter((e: any) => e.estado === 'cancelada').length;
  const tasaRealizacion =
    citasProgramadas + citasRealizadas > 0
      ? (citasRealizadas / (citasProgramadas + citasRealizadas)) * 100
      : 0;

  // Pacientes únicos
  const pacientesIds = new Set(
    eventos.filter((e: any) => e.pacienteId).map((e: any) => e.pacienteId)
  );
  const pacientesAtendidos = pacientesIds.size;

  // Pacientes activos (últimos 3 meses)
  const hace3Meses = subMonths(new Date(), 3);
  const eventosRecientes = eventos.filter(
    (e: any) => e.fechaInicio && e.fechaInicio.toDate() >= hace3Meses
  );
  const pacientesActivosIds = new Set(
    eventosRecientes.filter((e: any) => e.pacienteId).map((e: any) => e.pacienteId)
  );
  const pacientesActivos = pacientesActivosIds.size;

  // Servicios
  const serviciosSet = new Set(
    eventos.filter((e: any) => e.servicioNombre).map((e: any) => e.servicioNombre)
  );
  const serviciosOfrecidos = Array.from(serviciosSet);

  // Servicio más solicitado
  const serviciosCuenta: Record<string, number> = {};
  eventos.forEach((e: any) => {
    if (e.servicioNombre) {
      serviciosCuenta[e.servicioNombre] = (serviciosCuenta[e.servicioNombre] || 0) + 1;
    }
  });
  const servicioMasSolicitado =
    Object.keys(serviciosCuenta).length > 0
      ? Object.entries(serviciosCuenta).sort(([, a], [, b]) => b - a)[0][0]
      : undefined;

  // Horas trabajadas (estimado: 1 hora por cita realizada, ajustable)
  const horasTrabajadas = citasRealizadas * 1; // Asumimos 1 hora promedio por cita

  // Horas disponibles en el período (aproximado)
  const semanasEnPeriodo = Math.ceil(
    (fechaFin.getTime() - fechaInicio.getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  const horasDisponibles = horasSemanales * semanasEnPeriodo;
  const porcentajeUso = horasDisponibles > 0 ? (horasTrabajadas / horasDisponibles) * 100 : 0;

  // Tendencias: mes actual vs mes anterior
  const inicioMesActual = startOfMonth(new Date());
  const finMesActual = endOfMonth(new Date());
  const inicioMesAnterior = startOfMonth(subMonths(new Date(), 1));
  const finMesAnterior = endOfMonth(subMonths(new Date(), 1));

  const eventosMesActual = eventos.filter((e: any) => {
    const fecha = e.fechaInicio?.toDate?.() || e.fechaInicio;
    return fecha >= inicioMesActual && fecha <= finMesActual && e.estado === 'realizada';
  });

  const eventosMesAnterior = eventos.filter((e: any) => {
    const fecha = e.fechaInicio?.toDate?.() || e.fechaInicio;
    return fecha >= inicioMesAnterior && fecha <= finMesAnterior && e.estado === 'realizada';
  });

  const pacientesMesActual = new Set(
    eventosMesActual.filter((e: any) => e.pacienteId).map((e: any) => e.pacienteId)
  ).size;

  const pacientesMesAnterior = new Set(
    eventosMesAnterior.filter((e: any) => e.pacienteId).map((e: any) => e.pacienteId)
  ).size;

  // Próximas citas (futuras)
  const ahora = new Date();
  const proximasCitas = eventos.filter((e: any) => {
    const fecha = e.fechaInicio?.toDate?.() || e.fechaInicio;
    return fecha > ahora && (e.estado === 'programada' || e.estado === 'confirmada');
  }).length;

  return {
    profesionalId,
    profesionalNombre,
    citasProgramadas,
    citasRealizadas,
    citasCanceladas,
    tasaRealizacion: Math.round(tasaRealizacion * 10) / 10,
    pacientesAtendidos,
    pacientesActivos,
    serviciosOfrecidos,
    servicioMasSolicitado,
    horasTrabajadas,
    horasDisponibles,
    porcentajeUso: Math.round(porcentajeUso * 10) / 10,
    mesActual: {
      citasRealizadas: eventosMesActual.length,
      pacientesAtendidos: pacientesMesActual,
    },
    mesAnterior: {
      citasRealizadas: eventosMesAnterior.length,
      pacientesAtendidos: pacientesMesAnterior,
    },
    proximasCitas,
  };
}

/**
 * Obtiene estadísticas con caché
 */
export async function getEstadisticasProfesional(
  profesionalId: string,
  mesesAtras: number = 3
): Promise<ProfesionalEstadisticas | null> {
  return cached(
    ['profesional-stats', profesionalId, mesesAtras],
    async () => {
      const fechaInicio = subMonths(new Date(), mesesAtras);
      const fechaFin = new Date();
      return calcularEstadisticasProfesional(profesionalId, fechaInicio, fechaFin);
    },
    { revalidate: 300, tags: ['profesional-stats', `profesional-${profesionalId}`] } // 5 minutos
  );
}
