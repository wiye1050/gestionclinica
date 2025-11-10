'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  Plus,
  Filter,
  Search,
  Clock,
  AlertCircle,
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

type TipoReporte = 'incidencia' | 'mejora' | 'operacion' | 'nota';
type CategoriaReporte = 'personal' | 'material-sala' | 'servicio' | 'paciente' | 'software';
type PrioridadReporte = 'baja' | 'media' | 'alta';
type ResponsableReporte = 'direccion' | 'administracion' | 'coordinacion';
type EstadoReporte = 'pendiente' | 'en-proceso' | 'resuelta';

type Report = {
  id: string;
  tipo: TipoReporte;
  categoria: CategoriaReporte;
  prioridad: PrioridadReporte;
  responsable: ResponsableReporte;
  descripcion: string;
  accionInmediata?: string;
  requiereSeguimiento: boolean;
  estado: EstadoReporte;
  reportadoPor: string;
  reportadoPorId: string;
  createdAt?: Date;
  updatedAt?: Date;
  fecha?: Date;
};

const deserialize = (serialized: SerializedDailyReport): Report => ({
  ...serialized,
  createdAt: serialized.createdAt ? new Date(serialized.createdAt) : undefined,
  updatedAt: serialized.updatedAt ? new Date(serialized.updatedAt) : undefined,
  fecha: serialized.fecha ? new Date(serialized.fecha) : undefined,
});

interface Props {
  initialReports: SerializedDailyReport[];
}

export default function ReporteDiarioClient({ initialReports }: Props) {
  const { user } = useAuth();
  const [reportes, setReportes] = useState<Report[]>(() =>
    initialReports.map((report) => deserialize(report))
  );
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
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

  const requestReporte = async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
      ...options,
    });
    let payload: Record<string, unknown> = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      const message = typeof payload.error === 'string' ? payload.error : 'Operación no disponible';
      throw new Error(message);
    }
    return payload;
  };

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

  useEffect(() => {
    const q = query(collection(db, 'reportes-diarios'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportesData = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          tipo: data.tipo ?? 'incidencia',
          categoria: data.categoria ?? 'personal',
          prioridad: data.prioridad ?? 'media',
          responsable: data.responsable ?? 'coordinacion',
          descripcion: data.descripcion ?? '',
          accionInmediata: data.accionInmediata ?? '',
          requiereSeguimiento: Boolean(data.requiereSeguimiento),
          estado: data.estado ?? 'pendiente',
          reportadoPor: data.reportadoPor ?? 'sistema',
          reportadoPorId: data.reportadoPorId ?? 'sistema',
          createdAt: data.createdAt?.toDate?.(),
          updatedAt: data.updatedAt?.toDate?.(),
          fecha: data.fecha?.toDate?.(),
        } as Report;
      });

      setReportes(reportesData);
    });

    return () => unsubscribe();
  }, []);

  const handleCrearReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const ahora = new Date();
    try {
      const payload = sanitizeReportePayload(sanitizeReporteState(nuevoReporte));
      await requestReporte('/api/reportes/diarios', {
        method: 'POST',
        body: JSON.stringify({
          ...payload,
          fecha: ahora.toISOString(),
          hora: `${ahora.getHours().toString().padStart(2, '0')}:${ahora
            .getMinutes()
            .toString()
            .padStart(2, '0')}`,
        }),
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
      await requestReporte(`/api/reportes/diarios/${reporteId}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
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
      await requestReporte(`/api/reportes/diarios/${reporteId}`, { method: 'DELETE' });
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
      await requestReporte(`/api/reportes/diarios/${reporteId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

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

  const reportesFiltrados = useMemo(() => {
    return reportes.filter((reporte) => {
      const cumpleTipo = filtroTipo === 'todos' || reporte.tipo === filtroTipo;
      const cumplePrioridad = filtroPrioridad === 'todos' || reporte.prioridad === filtroPrioridad;
      const cumpleBusqueda = reporte.descripcion.toLowerCase().includes(busqueda.toLowerCase());

      return cumpleTipo && cumplePrioridad && cumpleBusqueda;
    });
  }, [reportes, filtroTipo, filtroPrioridad, busqueda]);

  const stats = {
    total: reportes.length,
    pendientes: reportes.filter((r) => r.estado === 'pendiente').length,
    enProceso: reportes.filter((r) => r.estado === 'en-proceso').length,
    resueltas: reportes.filter((r) => r.estado === 'resuelta').length,
    altaPrioridad: reportes.filter((r) => r.prioridad === 'alta' && r.estado !== 'resuelta').length,
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

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Reportes</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Pendientes</p>
          <p className="text-2xl font-bold text-red-600">{stats.pendientes}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">En Proceso</p>
          <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Resueltas</p>
          <p className="text-2xl font-bold text-green-600">{stats.resueltas}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600 font-medium">Alta Prioridad</p>
          </div>
          <p className="text-2xl font-bold text-red-700">{stats.altaPrioridad}</p>
        </div>
      </div>

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

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center border rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar descripción..."
              className="w-full text-sm outline-none"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="todos">Todos los tipos</option>
            <option value="incidencia">Incidencia</option>
            <option value="mejora">Mejora</option>
            <option value="operacion">Operación</option>
            <option value="nota">Nota</option>
          </select>
          <select
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="todos">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
          </select>
          <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-700">
            <Filter className="w-4 h-4" />
            Filtros avanzados
          </button>
        </div>
      </div>

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
    </div>
  );
}
