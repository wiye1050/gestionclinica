'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  Plus,
  Clock,
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Edit2,
  Trash2,
  Save,
  X,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { formatDateTime } from '@/lib/utils/helpers';
import { sanitizeHTML } from '@/lib/utils/sanitize';
import type { SerializedDailyReport } from '@/lib/server/reports';
import { CompactFilters, type ActiveFilterChip } from '@/components/shared/CompactFilters';
import { KPIGrid } from '@/components/shared/KPIGrid';
import {
  useReportesDiarios,
  type DailyReport,
  MAX_REPORTES_DEFAULT,
} from '@/lib/hooks/useReportesDiarios';
import {
  useCreateReporteDiario,
  useUpdateReporteDiario,
  useDeleteReporteDiario,
} from '@/lib/hooks/useReportesDiarios.mutations';

type TipoReporte = 'incidencia' | 'mejora' | 'operacion' | 'nota';
type CategoriaReporte = 'personal' | 'material-sala' | 'servicio' | 'paciente' | 'software';
type PrioridadReporte = 'baja' | 'media' | 'alta';
type ResponsableReporte = 'direccion' | 'administracion' | 'coordinacion';
type EstadoReporte = 'pendiente' | 'en-proceso' | 'resuelta';

type Report = DailyReport;

interface Props {
  initialReports: SerializedDailyReport[];
}

export default function ReporteDiarioClient({ initialReports }: Props) {
  const { user } = useAuth();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoReporte>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<'todos' | PrioridadReporte>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoReporte>('todos');
  const [filtroResponsable, setFiltroResponsable] = useState<'todos' | ResponsableReporte>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [soloSeguimiento, setSoloSeguimiento] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [reporteEditando, setReporteEditando] = useState<{
    tipo: TipoReporte;
    categoria: CategoriaReporte;
    prioridad: PrioridadReporte;
    responsable: ResponsableReporte;
    descripcion: string;
    accionInmediata: string;
    requiereSeguimiento: boolean;
  } | null>(null);

  const [nuevoReporte, setNuevoReporte] = useState<{
    tipo: TipoReporte;
    categoria: CategoriaReporte;
    prioridad: PrioridadReporte;
    responsable: ResponsableReporte;
    descripcion: string;
    accionInmediata: string;
    requiereSeguimiento: boolean;
  }>({
    tipo: 'incidencia',
    categoria: 'personal',
    prioridad: 'media',
    responsable: 'coordinacion',
    descripcion: '',
    accionInmediata: '',
    requiereSeguimiento: false,
  });

  const {
    data: reportes = [],
    isLoading,
    isFetching,
    error,
  } = useReportesDiarios({
    initialData: initialReports,
    limit: MAX_REPORTES_DEFAULT,
  });
  const createReporteMutation = useCreateReporteDiario(MAX_REPORTES_DEFAULT);
  const updateReporteMutation = useUpdateReporteDiario(MAX_REPORTES_DEFAULT);
  const deleteReporteMutation = useDeleteReporteDiario(MAX_REPORTES_DEFAULT);

  const sanitizeReportePayload = <T extends { descripcion: string; accionInmediata: string }>(data: T): T => ({
    ...data,
    descripcion: sanitizeHTML(data.descripcion),
    accionInmediata: data.accionInmediata ? sanitizeHTML(data.accionInmediata) : '',
  });
  const sanitizeReporteState = (data: typeof nuevoReporte) => ({
    ...data,
    descripcion: sanitizeHTML(data.descripcion),
    accionInmediata: data.accionInmediata ? sanitizeHTML(data.accionInmediata) : '',
  });

  const handleCrearReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const ahora = new Date();
    try {
      const payload = sanitizeReportePayload(sanitizeReporteState(nuevoReporte));
      await createReporteMutation.mutateAsync({
        ...payload,
        fecha: ahora.toISOString(),
        hora: `${ahora.getHours().toString().padStart(2, '0')}:${ahora
          .getMinutes()
          .toString()
          .padStart(2, '0')}`,
      });

      setNuevoReporte({
        tipo: 'incidencia',
        categoria: 'personal',
        prioridad: 'media',
        responsable: 'coordinacion',
        descripcion: '',
        accionInmediata: '',
        requiereSeguimiento: false,
      });

      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear reporte:', error);
      alert(error instanceof Error ? error.message : 'Error al crear reporte');
    }
  };

  const cambiarEstado = async (reporteId: string, nuevoEstado: EstadoReporte) => {
    if (!user) return;
    try {
      await updateReporteMutation.mutateAsync({ id: reporteId, changes: { estado: nuevoEstado } });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error instanceof Error ? error.message : 'Error al cambiar estado');
    }
  };

  const eliminarReporte = async (reporteId: string) => {
    if (
      !confirm('¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.')
    ) {
      return;
    }

    try {
      await deleteReporteMutation.mutateAsync(reporteId);
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar el reporte');
    }
  };

  const iniciarEdicion = (reporte: Report) => {
    setEditandoId(reporte.id);
    setReporteEditando({
      tipo: reporte.tipo,
      categoria: reporte.categoria,
      prioridad: reporte.prioridad,
      responsable: reporte.responsable,
      descripcion: sanitizeHTML(reporte.descripcion ?? ''),
      accionInmediata: reporte.accionInmediata ? sanitizeHTML(reporte.accionInmediata) : '',
      requiereSeguimiento: reporte.requiereSeguimiento,
    });
  };

  const guardarEdicion = async (reporteId: string) => {
    if (!user || !reporteEditando) return;

    try {
      const payload = sanitizeReportePayload(reporteEditando);
      await updateReporteMutation.mutateAsync({ id: reporteId, changes: payload });

      setEditandoId(null);
      setReporteEditando(null);
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar el reporte');
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setReporteEditando(null);
  };

  const exportarAExcel = async () => {
    const XLSX = await import('xlsx');
    const datosExcel = reportesFiltrados.map((reporte) => ({
      Fecha: formatDateTime(reporte.createdAt ?? new Date()),
      Tipo: reporte.tipo.toUpperCase(),
      'Categoría': reporte.categoria.replace('-', '/'),
      Prioridad: reporte.prioridad.toUpperCase(),
      Estado: reporte.estado.replace('-', ' ').toUpperCase(),
      Responsable: reporte.responsable,
      Descripción: reporte.descripcion,
      'Acción Inmediata': reporte.accionInmediata || 'N/A',
      'Requiere Seguimiento': reporte.requiereSeguimiento ? 'Sí' : 'No',
      'Reportado Por': reporte.reportadoPor,
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes Diarios');
    ws['!cols'] = [
      { wch: 20 },
      { wch: 12 },
      { wch: 15 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 50 },
      { wch: 30 },
      { wch: 18 },
      { wch: 25 },
    ];
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reportes_Diarios_${fecha}.xlsx`);
  };

  const normalizedSearch = busqueda.trim().toLowerCase();

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((reporte) => {
      const cumpleTipo = filtroTipo === 'todos' || reporte.tipo === filtroTipo;
      const cumplePrioridad = filtroPrioridad === 'todos' || reporte.prioridad === filtroPrioridad;
      const cumpleEstado = filtroEstado === 'todos' || reporte.estado === filtroEstado;
      const cumpleResponsable = filtroResponsable === 'todos' || reporte.responsable === filtroResponsable;
      const cumpleSeguimiento = !soloSeguimiento || reporte.requiereSeguimiento;
      const descripcion = (reporte.descripcion ?? '').toLowerCase();
      const reportadoPor = (reporte.reportadoPor ?? '').toLowerCase();
      const responsable = (reporte.responsable ?? '').toLowerCase();
      const cumpleBusqueda =
        normalizedSearch.length === 0 ||
        descripcion.includes(normalizedSearch) ||
        reportadoPor.includes(normalizedSearch) ||
        responsable.includes(normalizedSearch);

      return (
        cumpleTipo &&
        cumplePrioridad &&
        cumpleEstado &&
        cumpleResponsable &&
        cumpleSeguimiento &&
        cumpleBusqueda
      );
    });
  }, [
    reportes,
    filtroTipo,
    filtroPrioridad,
    filtroEstado,
    filtroResponsable,
    soloSeguimiento,
    normalizedSearch,
  ]);

  const stats = useMemo(() => {
    const pendientes = reportesFiltrados.filter((r) => r.estado === 'pendiente').length;
    const enProceso = reportesFiltrados.filter((r) => r.estado === 'en-proceso').length;
    const resueltas = reportesFiltrados.filter((r) => r.estado === 'resuelta').length;
    const altaPrioridad = reportesFiltrados.filter((r) => r.prioridad === 'alta' && r.estado !== 'resuelta').length;
    return {
      total: reportesFiltrados.length,
      pendientes,
      enProceso,
      resueltas,
      altaPrioridad,
    };
  }, [reportesFiltrados]);

  const kpiItems = useMemo(
    () => [
      {
        id: 'total',
        label: 'Total reportes',
        value: stats.total,
        helper: `Últimos ${MAX_REPORTES_DEFAULT}`,
        accent: 'brand' as const,
        icon: <ClipboardList className="h-5 w-5 text-brand" />,
      },
      {
        id: 'pendientes',
        label: 'Pendientes',
        value: stats.pendientes,
        helper: 'Sin iniciar',
        accent: 'red' as const,
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      },
      {
        id: 'en-proceso',
        label: 'En proceso',
        value: stats.enProceso,
        helper: 'En seguimiento',
        accent: 'blue' as const,
        icon: <Clock className="h-5 w-5 text-blue-500" />,
      },
      {
        id: 'resueltas',
        label: 'Resueltas',
        value: stats.resueltas,
        helper: 'Cerradas',
        accent: 'green' as const,
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      },
      {
        id: 'alta',
        label: 'Alta prioridad',
        value: stats.altaPrioridad,
        helper: 'Pendientes críticos',
        accent: 'purple' as const,
        icon: <AlertCircle className="h-5 w-5 text-violet-500" />,
      },
    ],
    [stats.total, stats.pendientes, stats.enProceso, stats.resueltas, stats.altaPrioridad]
  );

  const activeFilters: ActiveFilterChip[] = [];
  if (normalizedSearch.length > 0) {
    activeFilters.push({
      id: 'search',
      label: 'Búsqueda',
      value: busqueda,
      onRemove: () => setBusqueda(''),
    });
  }
  if (filtroTipo !== 'todos') {
    activeFilters.push({
      id: 'tipo',
      label: 'Tipo',
      value: filtroTipo,
      onRemove: () => setFiltroTipo('todos'),
    });
  }
  if (filtroPrioridad !== 'todos') {
    activeFilters.push({
      id: 'prioridad',
      label: 'Prioridad',
      value: filtroPrioridad,
      onRemove: () => setFiltroPrioridad('todos'),
    });
  }
  if (filtroEstado !== 'todos') {
    activeFilters.push({
      id: 'estado',
      label: 'Estado',
      value: filtroEstado,
      onRemove: () => setFiltroEstado('todos'),
    });
  }
  if (filtroResponsable !== 'todos') {
    activeFilters.push({
      id: 'responsable',
      label: 'Responsable',
      value: filtroResponsable,
      onRemove: () => setFiltroResponsable('todos'),
    });
  }
  if (soloSeguimiento) {
    activeFilters.push({
      id: 'seguimiento',
      label: 'Seguimiento',
      value: 'Solo pendientes',
      onRemove: () => setSoloSeguimiento(false),
    });
  }

  const clearFilters = () => {
    setBusqueda('');
    setFiltroTipo('todos');
    setFiltroPrioridad('todos');
    setFiltroEstado('todos');
    setFiltroResponsable('todos');
    setSoloSeguimiento(false);
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'baja':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-red-100 text-red-800';
      case 'en-proceso':
        return 'bg-blue-100 text-blue-800';
      case 'resuelta':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const showSkeleton = isLoading && reportes.length === 0;
  const isEmptyState = !isLoading && !error && reportesFiltrados.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reporte Diario</h1>
          <p className="text-gray-600 mt-1">Registro de incidencias, mejoras y operaciones</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportarAExcel}
            className="flex items-center space-x-2 bg-green-600 text-text px-4 py-2 rounded-lg hover:bg-green-700"
            title="Exportar reportes filtrados a Excel"
          >
            <Download className="w-5 h-5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center space-x-2 bg-blue-600 text-text px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Reporte</span>
          </button>
        </div>
      </div>

      <KPIGrid items={kpiItems} />

      <CompactFilters
        search={{
          value: busqueda,
          onChange: setBusqueda,
          placeholder: 'Buscar por descripción, responsable o autor',
        }}
        selects={[
          {
            id: 'tipo',
            label: 'Tipo',
            value: filtroTipo,
            onChange: (value) => setFiltroTipo(value as typeof filtroTipo),
            options: [
              { value: 'todos', label: 'Todos los tipos' },
              { value: 'incidencia', label: 'Incidencia' },
              { value: 'mejora', label: 'Mejora' },
              { value: 'operacion', label: 'Operación' },
              { value: 'nota', label: 'Nota' },
            ],
          },
          {
            id: 'prioridad',
            label: 'Prioridad',
            value: filtroPrioridad,
            onChange: (value) => setFiltroPrioridad(value as typeof filtroPrioridad),
            options: [
              { value: 'todos', label: 'Todas las prioridades' },
              { value: 'baja', label: 'Baja' },
              { value: 'media', label: 'Media' },
              { value: 'alta', label: 'Alta' },
            ],
          },
          {
            id: 'estado',
            label: 'Estado',
            value: filtroEstado,
            onChange: (val) => setFiltroEstado(val as typeof filtroEstado),
            options: [
              { value: 'todos', label: 'Todos los estados' },
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'en-proceso', label: 'En proceso' },
              { value: 'resuelta', label: 'Resuelta' },
            ],
          },
          {
            id: 'responsable',
            label: 'Responsable',
            value: filtroResponsable,
            onChange: (val) => setFiltroResponsable(val as typeof filtroResponsable),
            options: [
              { value: 'todos', label: 'Todos' },
              { value: 'direccion', label: 'Dirección' },
              { value: 'administracion', label: 'Administración' },
              { value: 'coordinacion', label: 'Coordinación' },
            ],
          },
        ]}
        activeFilters={activeFilters}
        onClear={activeFilters.length ? clearFilters : undefined}
      >
        <button
          type="button"
          onClick={() => setSoloSeguimiento((prev) => !prev)}
          className={`rounded-pill border px-4 py-2 text-xs font-semibold transition-colors focus-visible:focus-ring ${
            soloSeguimiento
              ? 'border-brand bg-brand-subtle text-brand'
              : 'border-border bg-card text-text'
          }`}
        >
          {soloSeguimiento ? 'Solo seguimiento' : 'Incluir seguimiento'}
        </button>
      </CompactFilters>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Nuevo Reporte</h2>
          <form onSubmit={handleCrearReporte} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={nuevoReporte.tipo}
                  onChange={(e) =>
                    setNuevoReporte({ ...nuevoReporte, tipo: e.target.value as TipoReporte })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="incidencia">Incidencia</option>
                  <option value="mejora">Mejora</option>
                  <option value="operacion">Operación</option>
                  <option value="nota">Nota</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={nuevoReporte.categoria}
                  onChange={(e) =>
                    setNuevoReporte({
                      ...nuevoReporte,
                      categoria: e.target.value as CategoriaReporte,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="personal">Personal</option>
                  <option value="material-sala">Material/Sala</option>
                  <option value="servicio">Servicio</option>
                  <option value="paciente">Paciente</option>
                  <option value="software">Software</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={nuevoReporte.prioridad}
                  onChange={(e) =>
                    setNuevoReporte({
                      ...nuevoReporte,
                      prioridad: e.target.value as PrioridadReporte,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <select
                  value={nuevoReporte.responsable}
                  onChange={(e) =>
                    setNuevoReporte({
                      ...nuevoReporte,
                      responsable: e.target.value as ResponsableReporte,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="direccion">Dirección</option>
                  <option value="administracion">Administración</option>
                  <option value="coordinacion">Coordinación</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea
                value={nuevoReporte.descripcion}
                onChange={(e) => setNuevoReporte({ ...nuevoReporte, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                required
                placeholder="Describe detalladamente lo sucedido..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Acción Inmediata Tomada (opcional)
              </label>
              <textarea
                value={nuevoReporte.accionInmediata}
                onChange={(e) =>
                  setNuevoReporte({ ...nuevoReporte, accionInmediata: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="¿Qué se hizo en el momento?"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="seguimiento"
                checked={nuevoReporte.requiereSeguimiento}
                onChange={(e) =>
                  setNuevoReporte({ ...nuevoReporte, requiereSeguimiento: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="seguimiento" className="ml-2 text-sm text-gray-700">
                Requiere seguimiento
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-text px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-5 h-5" />
                <span>Guardar</span>
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="flex items-center space-x-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message || 'No se pudieron cargar los reportes.'}
          </div>
        )}

        {showSkeleton ? (
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex animate-pulse items-center gap-4 text-sm text-text-muted">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-border" />
                    <div className="h-3 w-36 rounded bg-border/80" />
                  </div>
                  <div className="h-6 w-20 rounded-full bg-border" />
                  <div className="h-6 w-20 rounded-full bg-border" />
                  <div className="h-4 w-24 rounded bg-border" />
                </div>
              ))}
            </div>
          </div>
        ) : isEmptyState ? (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-text-muted">
            <p className="font-medium text-text">No hay reportes que coincidan con los filtros.</p>
            <p className="mt-1 text-text-muted">
              Ajusta la búsqueda o crea un nuevo registro para comenzar el seguimiento.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsable
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reportado
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportesFiltrados.map((reporte) => (
                  <tr key={reporte.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="bg-blue-50 text-blue-700 rounded-full p-2">
                            <Clock className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {reporte.tipo}
                          </p>
                          {editandoId === reporte.id ? (
                            <textarea
                              value={reporteEditando?.descripcion ?? ''}
                              onChange={(e) =>
                                setReporteEditando((prev) =>
                                  prev ? { ...prev, descripcion: e.target.value } : prev
                                )
                              }
                              className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                              rows={3}
                            />
                          ) : (
                            <p className="text-sm text-gray-600">{reporte.descripcion}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDateTime(reporte.createdAt ?? new Date())}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadColor(reporte.prioridad)}`}>
                        {reporte.prioridad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(reporte.estado)}`}>
                        {reporte.estado.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {reporte.responsable}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reporte.reportadoPor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editandoId === reporte.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => guardarEdicion(reporte.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-200"
                          >
                            <Save className="h-4 w-4" />
                            Guardar
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => iniciarEdicion(reporte)}
                            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => cambiarEstado(reporte.id, 'resuelta')}
                            className="inline-flex items-center gap-1 rounded-md bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-100"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Resolver
                          </button>
                          <button
                            onClick={() => eliminarReporte(reporte.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && isFetching && (
          <p className="text-right text-xs text-text-muted">Actualizando datos...</p>
        )}
      </div>
    </div>
  );
}
