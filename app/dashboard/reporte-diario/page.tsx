'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { DailyReport } from '@/types';
import { Plus, Filter, Search, Clock, AlertCircle, Edit2, Trash2, Save, X, Download } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/helpers';
import * as XLSX from 'xlsx';

type TipoReporte = 'incidencia' | 'mejora' | 'operacion' | 'nota';
type CategoriaReporte = 'personal' | 'material-sala' | 'servicio' | 'paciente' | 'software';
type PrioridadReporte = 'baja' | 'media' | 'alta';
type ResponsableReporte = 'direccion' | 'administracion' | 'coordinacion';

export default function ReporteDiarioPage() {
  const { user } = useAuth();
  const [reportes, setReportes] = useState<DailyReport[]>([]);
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

  useEffect(() => {
    const q = query(
      collection(db, 'reportes-diarios'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as DailyReport[];
      
      setReportes(reportesData);
    });

    return () => unsubscribe();
  }, []);

  const handleCrearReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const ahora = new Date();
    const hora = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    try {
      await addDoc(collection(db, 'reportes-diarios'), {
        ...nuevoReporte,
        fecha: ahora,
        hora,
        estado: 'pendiente',
        reportadoPor: user.email,
        reportadoPorId: user.uid,
        createdAt: ahora,
        updatedAt: ahora,
        historialEstados: [{
          estadoAnterior: 'pendiente',
          estadoNuevo: 'pendiente',
          fecha: ahora,
          usuario: user.email,
          comentario: 'Reporte creado'
        }]
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
    }
  };

  const cambiarEstado = async (reporteId: string, nuevoEstado: 'pendiente' | 'en-proceso' | 'resuelta') => {
    if (!user) return;
    
    const ahora = new Date();
    const reporteRef = doc(db, 'reportes-diarios', reporteId);
    
    await updateDoc(reporteRef, {
      estado: nuevoEstado,
      updatedAt: ahora,
      modificadoPor: user.email,
      ...(nuevoEstado === 'resuelta' && { fechaResolucion: ahora })
    });
  };

  const eliminarReporte = async (reporteId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const reporteRef = doc(db, 'reportes-diarios', reporteId);
      await deleteDoc(reporteRef);
    } catch (error) {
      console.error('Error al eliminar reporte:', error);
      alert('Error al eliminar el reporte');
    }
  };

  const iniciarEdicion = (reporte: DailyReport) => {
    setEditandoId(reporte.id);
    setReporteEditando({
      tipo: reporte.tipo,
      categoria: reporte.categoria,
      prioridad: reporte.prioridad,
      responsable: reporte.responsable,
      descripcion: reporte.descripcion,
      accionInmediata: reporte.accionInmediata || '',
      requiereSeguimiento: reporte.requiereSeguimiento,
    });
  };

  const guardarEdicion = async (reporteId: string) => {
    if (!user || !reporteEditando) return;
    
    try {
      const reporteRef = doc(db, 'reportes-diarios', reporteId);
      await updateDoc(reporteRef, {
        ...reporteEditando,
        updatedAt: new Date(),
        modificadoPor: user.email,
      });
      
      setEditandoId(null);
      setReporteEditando(null);
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      alert('Error al actualizar el reporte');
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setReporteEditando(null);
  };

  const exportarAExcel = () => {
    // Preparar datos para Excel
    const datosExcel = reportesFiltrados.map(reporte => ({
      'Fecha': formatDateTime(reporte.createdAt),
      'Tipo': reporte.tipo.toUpperCase(),
      'Categoría': reporte.categoria.replace('-', '/'),
      'Prioridad': reporte.prioridad.toUpperCase(),
      'Estado': reporte.estado.replace('-', ' ').toUpperCase(),
      'Responsable': reporte.responsable,
      'Descripción': reporte.descripcion,
      'Acción Inmediata': reporte.accionInmediata || 'N/A',
      'Requiere Seguimiento': reporte.requiereSeguimiento ? 'Sí' : 'No',
      'Reportado Por': reporte.reportadoPor,
    }));

    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reportes Diarios');

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 20 }, // Fecha
      { wch: 12 }, // Tipo
      { wch: 15 }, // Categoría
      { wch: 10 }, // Prioridad
      { wch: 15 }, // Estado
      { wch: 15 }, // Responsable
      { wch: 50 }, // Descripción
      { wch: 30 }, // Acción Inmediata
      { wch: 18 }, // Requiere Seguimiento
      { wch: 25 }, // Reportado Por
    ];
    ws['!cols'] = colWidths;

    // Generar archivo
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Reportes_Diarios_${fecha}.xlsx`);
  };

  const reportesFiltrados = reportes.filter(reporte => {
    const cumpleTipo = filtroTipo === 'todos' || reporte.tipo === filtroTipo;
    const cumplePrioridad = filtroPrioridad === 'todos' || reporte.prioridad === filtroPrioridad;
    const cumpleBusqueda = reporte.descripcion.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleTipo && cumplePrioridad && cumpleBusqueda;
  });

  const stats = {
    total: reportes.length,
    pendientes: reportes.filter(r => r.estado === 'pendiente').length,
    enProceso: reportes.filter(r => r.estado === 'en-proceso').length,
    resueltas: reportes.filter(r => r.estado === 'resuelta').length,
    altaPrioridad: reportes.filter(r => r.prioridad === 'alta' && r.estado !== 'resuelta').length,
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-red-100 text-red-800';
      case 'en-proceso': return 'bg-blue-100 text-blue-800';
      case 'resuelta': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            title="Exportar reportes filtrados a Excel"
          >
            <Download className="w-5 h-5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
                  onChange={(e) => setNuevoReporte({...nuevoReporte, tipo: e.target.value as TipoReporte})}
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
                  onChange={(e) => setNuevoReporte({...nuevoReporte, categoria: e.target.value as CategoriaReporte})}
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
                  onChange={(e) => setNuevoReporte({...nuevoReporte, prioridad: e.target.value as PrioridadReporte})}
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
                  onChange={(e) => setNuevoReporte({...nuevoReporte, responsable: e.target.value as ResponsableReporte})}
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
                onChange={(e) => setNuevoReporte({...nuevoReporte, descripcion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={4}
                required
                placeholder="Describe detalladamente lo sucedido..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Acción Inmediata Tomada (opcional)</label>
              <textarea
                value={nuevoReporte.accionInmediata}
                onChange={(e) => setNuevoReporte({...nuevoReporte, accionInmediata: e.target.value})}
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
                onChange={(e) => setNuevoReporte({...nuevoReporte, requiereSeguimiento: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="seguimiento" className="text-sm text-gray-700">Requiere seguimiento posterior</label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Crear Reporte
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
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
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en descripción..."
                className="w-full pl-10 pr-3 py-1 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reportesFiltrados.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500">No hay reportes que coincidan con los filtros</p>
          </div>
        ) : (
          reportesFiltrados.map((reporte) => (
            <div key={reporte.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              {editandoId === reporte.id && reporteEditando ? (
                // MODO EDICIÓN
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={reporteEditando.tipo}
                        onChange={(e) => setReporteEditando({...reporteEditando, tipo: e.target.value as TipoReporte})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                        value={reporteEditando.categoria}
                        onChange={(e) => setReporteEditando({...reporteEditando, categoria: e.target.value as CategoriaReporte})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                        value={reporteEditando.prioridad}
                        onChange={(e) => setReporteEditando({...reporteEditando, prioridad: e.target.value as PrioridadReporte})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="baja">Baja</option>
                        <option value="media">Media</option>
                        <option value="alta">Alta</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                      <select
                        value={reporteEditando.responsable}
                        onChange={(e) => setReporteEditando({...reporteEditando, responsable: e.target.value as ResponsableReporte})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
                      value={reporteEditando.descripcion}
                      onChange={(e) => setReporteEditando({...reporteEditando, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Acción Inmediata</label>
                    <textarea
                      value={reporteEditando.accionInmediata}
                      onChange={(e) => setReporteEditando({...reporteEditando, accionInmediata: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`seguimiento-${reporte.id}`}
                      checked={reporteEditando.requiereSeguimiento}
                      onChange={(e) => setReporteEditando({...reporteEditando, requiereSeguimiento: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor={`seguimiento-${reporte.id}`} className="text-sm text-gray-700">Requiere seguimiento posterior</label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => guardarEdicion(reporte.id)}
                      className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      <Save className="w-4 h-4" />
                      <span>Guardar</span>
                    </button>
                    <button
                      onClick={cancelarEdicion}
                      className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  </div>
                </div>
              ) : (
                // MODO VISTA
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadColor(reporte.prioridad)}`}>
                        {reporte.prioridad.toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(reporte.estado)}`}>
                        {reporte.estado.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {reporte.tipo.toUpperCase()}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {reporte.categoria.replace('-', '/')}
                      </span>
                    </div>
                    
                    <p className="text-gray-900 font-medium mb-2">{reporte.descripcion}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(reporte.createdAt)}</span>
                      </div>
                      <span>•</span>
                      <span>Responsable: {reporte.responsable}</span>
                      <span>•</span>
                      <span>Por: {reporte.reportadoPor}</span>
                    </div>

                    {reporte.accionInmediata && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Acción inmediata:</span> {reporte.accionInmediata}
                        </p>
                      </div>
                    )}

                    {reporte.requiereSeguimiento && (
                      <div className="mt-2 flex items-center space-x-2 text-orange-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Requiere seguimiento</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {reporte.estado === 'pendiente' && (
                      <button
                        onClick={() => cambiarEstado(reporte.id, 'en-proceso')}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      >
                        Iniciar
                      </button>
                    )}
                    {reporte.estado === 'en-proceso' && (
                      <button
                        onClick={() => cambiarEstado(reporte.id, 'resuelta')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                      >
                        Resolver
                      </button>
                    )}
                    <button
                      onClick={() => iniciarEdicion(reporte)}
                      className="flex items-center justify-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-sm hover:bg-yellow-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => eliminarReporte(reporte.id)}
                      className="flex items-center justify-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}