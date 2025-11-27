import { adminDb } from '@/lib/firebaseAdmin';
import { cached } from '@/lib/server/cache';

const assertAdminDb = () => {
  if (!adminDb) {
    throw new Error('Firebase Admin no está configurado. Define FIREBASE_SERVICE_ACCOUNT_KEY o las variables FIREBASE_ADMIN_*');
  }
  return adminDb;
};

type ProfessionalSummary = {
  nombre: string;
  especialidad?: string;
  serviciosAsignados: number;
};

type ServiceSummary = {
  servicio: string;
  grupo: string;
  estado: string;
  ticket: string;
};

type EvaluationSummary = {
  profesional: string;
  servicio: string;
  promedio: number;
  protocoloSeguido: boolean;
};

type InventoryAlertSummary = {
  nombre: string;
  categoria?: string;
  stockActual?: number;
  stockMinimo?: number;
};

export type MonthlyReportData = {
  resumen: {
    profesionalesActivos: number;
    serviciosActivos: number;
    evaluacionesMes: number;
    proyectosActivos: number;
    reportesMes: number;
    productosBajoStock: number;
  };
  profesionales: ProfessionalSummary[];
  servicios: ServiceSummary[];
  evaluaciones: EvaluationSummary[];
  inventario: InventoryAlertSummary[];
};

const average = (...values: Array<number | undefined>): number => {
  const valid = values.filter((value): value is number => typeof value === 'number');
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, value) => acc + value, 0);
  return sum / valid.length;
};

export async function getMonthlyReportData(year: number, month: number): Promise<MonthlyReportData> {
  const db = assertAdminDb();

  return cached(
    ['monthly-report', year, month],
    async () => {
      const inicioMes = new Date(year, month, 1);
      const finMes = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const [
        profesionalesSnap,
        serviciosSnap,
        evaluacionesSnap,
        proyectosSnap,
        reportesSnap,
        inventarioSnap,
      ] = await Promise.all([
        db.collection('profesionales').limit(500).get(),
        db.collection('servicios-asignados').limit(500).get(),
        db
          .collection('evaluaciones-sesion')
          .where('fecha', '>=', inicioMes)
          .where('fecha', '<=', finMes)
          .limit(750)
          .get(),
        db.collection('proyectos').limit(200).get(),
        db
          .collection('daily-reports')
          .where('fecha', '>=', inicioMes)
          .where('fecha', '<=', finMes)
          .limit(500)
          .get(),
        db.collection('inventario-productos').limit(500).get(),
      ]);

      const profesionalesActivos = profesionalesSnap.docs.filter((doc) => doc.data()?.activo).length;
      const serviciosActivos = serviciosSnap.docs.filter((doc) => doc.data()?.estado === 'activo').length;
      const evaluacionesMes = evaluacionesSnap.size;
      const proyectosActivos = proyectosSnap.docs.filter((doc) => doc.data()?.estado === 'en-curso').length;
      const reportesMes = reportesSnap.size;
      const productosBajoStock = inventarioSnap.docs.filter((doc) => doc.data()?.alertaStockBajo).length;

      const profesionales: ProfessionalSummary[] = profesionalesSnap.docs
        .filter((doc) => doc.data()?.activo)
        .map((doc) => {
          const data = doc.data() ?? {};
          return {
            nombre: `${data.nombre ?? ''} ${data.apellidos ?? ''}`.trim() || 'Sin nombre',
            especialidad: data.especialidad ?? '—',
            serviciosAsignados: Number(data.serviciosAsignados ?? 0),
          };
        })
        .slice(0, 25);

      const servicios: ServiceSummary[] = serviciosSnap.docs
        .map((doc) => {
          const data = doc.data() ?? {};
          return {
            servicio: data.catalogoServicioNombre ?? 'Sin nombre',
            grupo: data.grupoNombre ?? 'Sin grupo',
            estado: data.estado ?? 'desconocido',
            ticket: data.tiquet ?? 'N/A',
          };
        })
        .slice(0, 20);

      const evaluaciones: EvaluationSummary[] = evaluacionesSnap.docs
        .map((doc) => {
          const data = doc.data() ?? {};
          const promedio = average(
            data.aplicacionProtocolo,
            data.manejoPaciente,
            data.usoEquipamiento,
            data.comunicacion
          );
          return {
            profesional: data.profesionalNombre ?? 'Sin nombre',
            servicio: data.servicioNombre ?? 'Sin servicio',
            promedio: Number(promedio.toFixed(1)),
            protocoloSeguido: Boolean(data.protocoloSeguido),
          };
        })
        .slice(0, 15);

      const inventario: InventoryAlertSummary[] = inventarioSnap.docs
        .filter((doc) => doc.data()?.alertaStockBajo)
        .map((doc) => {
          const data = doc.data() ?? {};
          return {
            nombre: data.nombre ?? 'Sin nombre',
            categoria: data.categoria ?? '—',
            stockActual: Number(data.cantidadActual ?? data.stock ?? 0),
            stockMinimo: Number(data.cantidadMinima ?? data.stockMinimo ?? 0),
          };
        })
        .slice(0, 15);

      return {
        resumen: {
          profesionalesActivos,
          serviciosActivos,
          evaluacionesMes,
          proyectosActivos,
          reportesMes,
          productosBajoStock,
        },
        profesionales,
        servicios,
        evaluaciones,
        inventario,
      } satisfies MonthlyReportData;
    },
    { revalidate: 900, tags: ['reports', 'monthly'] }
  );
}
