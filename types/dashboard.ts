// Tipos para el dashboard principal

export interface RecentActivity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: Date;
}

export interface TodayAppointment {
  id: string;
  paciente?: string;
  profesional?: string;
  fecha: Date;
  servicio?: string;
  completada?: boolean;
}

export interface UserTask {
  id: string;
  titulo: string;
  prioridad: 'alta' | 'media' | 'baja';
  fechaLimite?: Date;
  completada: boolean;
}

export interface FinanceSummary {
  facturadoMes: number;
  cobradoMes: number;
  totalPendiente: number;
  totalVencido: number;
  facturasPendientes: number;
  totalFacturado: number;
}

export interface StockAlert {
  id: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
}

export interface StockAlerts {
  total: number;
  top: StockAlert[];
}

export interface FollowUpPatient {
  id: string;
  nombre: string;
  apellidos: string;
  plan?: string;
}

export interface RecentEvaluation {
  id: string;
  profesionalNombre: string;
  fecha: Date;
  promedioGeneral: number;
  servicioNombre: string;
}

export interface DashboardStats {
  serviciosActivos: number;
  incidenciasPendientes: number;
  productosStockBajo: number;
  cumplimientoProtocolos: number;
  seguimientosPendientes: number;
}

// Props para componentes de widgets
export interface WidgetProps {
  className?: string;
}

export interface AppointmentsWidgetProps extends WidgetProps {
  appointments: TodayAppointment[];
  loading: boolean;
}

export interface TasksWidgetProps extends WidgetProps {
  tasks: UserTask[];
  loading: boolean;
}

export interface FinanceWidgetProps extends WidgetProps {
  summary: FinanceSummary;
  loading: boolean;
}

export interface StockWidgetProps extends WidgetProps {
  alerts: StockAlerts;
  loading: boolean;
}

export interface FollowUpsWidgetProps extends WidgetProps {
  patients: FollowUpPatient[];
  loading: boolean;
}

export interface ActivityWidgetProps extends WidgetProps {
  activity: RecentActivity[];
  loading: boolean;
}

export interface EvaluationsWidgetProps extends WidgetProps {
  evaluations: RecentEvaluation[];
  loading: boolean;
}
