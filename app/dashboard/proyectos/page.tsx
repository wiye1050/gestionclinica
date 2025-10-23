/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Proyecto } from '@/types';
import { Plus, Edit2, Trash2, Clock, User, Calendar, X, Save } from 'lucide-react';

export default function ProyectosPage() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [nuevaActualizacion, setNuevaActualizacion] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'externo' as 'externo' | 'interno' | 'investigacion',
    estado: 'propuesta' as 'propuesta' | 'en-curso' | 'completado',
    prioridad: 'media' as 'baja' | 'media' | 'alta',
    responsable: '',
    fechaInicio: '',
    fechaFinEstimada: ''});

  // Cargar proyectos
  useEffect(() => {
    const q = query(collection(db, 'proyectos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const proyectosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        fechaInicio: doc.data().fechaInicio?.toDate(),
        fechaFinEstimada: doc.data().fechaFinEstimada?.toDate(),
        fechaFinReal: doc.data().fechaFinReal?.toDate(),
        actualizaciones: (doc.data().actualizaciones || []).map((act: any) => ({ ...(act ?? {}),
          ...act,
          fecha: typeof act?.fecha?.toDate === 'function' ? act.fecha.toDate() : act?.fecha}))})) as Proyecto[];
      setProyectos(proyectosData);
    });

    return () => unsubscribe();
  }, []);

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      tipo: 'externo',
      estado: 'propuesta',
      prioridad: 'media',
      responsable: '',
      fechaInicio: '',
      fechaFinEstimada: ''});
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Crear o actualizar proyecto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const datos: any = {
      ...formData,
      fechaInicio: formData.fechaInicio ? new Date(formData.fechaInicio) : null,
      fechaFinEstimada: formData.fechaFinEstimada ? new Date(formData.fechaFinEstimada) : null,
      updatedAt: new Date()};

    try {
      if (editandoId) {
        await updateDoc(doc(db, 'proyectos', editandoId), datos);
      } else {
        await addDoc(collection(db, 'proyectos'), {
          ...datos,
          actualizaciones: [],
          createdAt: new Date(),
          creadoPor: user.email});
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar proyecto:', error);
      alert('Error al guardar proyecto');
    }
  };

  // Iniciar edición
  const iniciarEdicion = (proyecto: Proyecto) => {
    setFormData({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      tipo: proyecto.tipo,
      estado: proyecto.estado,
      prioridad: proyecto.prioridad,
      responsable: proyecto.responsable,
      fechaInicio: proyecto.fechaInicio ? proyecto.fechaInicio.toISOString().split('T')[0] : '',
      fechaFinEstimada: proyecto.fechaFinEstimada ? proyecto.fechaFinEstimada.toISOString().split('T')[0] : ''});
    setEditandoId(proyecto.id);
    setMostrarFormulario(true);
  };

  // Eliminar proyecto
  const eliminarProyecto = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.')) return;

    try {
      await deleteDoc(doc(db, 'proyectos', id));
      if (proyectoSeleccionado?.id === id) {
        setProyectoSeleccionado(null);
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar proyecto');
    }
  };

  // Cambiar estado del proyecto
  const cambiarEstado = async (id: string, nuevoEstado: 'propuesta' | 'en-curso' | 'completado') => {
    try {
      const datos: any = {
        estado: nuevoEstado,
        updatedAt: new Date()};

      if (nuevoEstado === 'completado') {
        (datos as any).fechaFinReal = new Date();
      }

      await updateDoc(doc(db, 'proyectos', id), datos);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  // Añadir actualización
  const añadirActualizacion = async () => {
    if (!proyectoSeleccionado || !nuevaActualizacion.trim() || !user) return;

    const nuevaAct = {
      id: Date.now().toString(),
      fecha: new Date(),
      texto: nuevaActualizacion.trim(),
      autor: user.email || 'Usuario'};

    try {
      await updateDoc(doc(db, 'proyectos', proyectoSeleccionado.id), {
        actualizaciones: [nuevaAct, ...proyectoSeleccionado.actualizaciones],
        updatedAt: new Date()});
      setNuevaActualizacion('');
    } catch (error) {
      console.error('Error al añadir actualización:', error);
    }
  };

  // Filtrar proyectos por estado
  const propuestas = proyectos.filter(p => p.estado === 'propuesta');
  const enCurso = proyectos.filter(p => p.estado === 'en-curso');
  const completados = proyectos.filter(p => p.estado === 'completado');

  // Colores
  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'propuesta': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'en-curso': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completado': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'externo': return 'bg-purple-100 text-purple-800';
      case 'interno': return 'bg-blue-100 text-blue-800';
      case 'investigacion': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorPrioridad = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baja': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha?: Date) => {
    if (!fecha) return '-';
    return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(fecha);
  };

  const formatearFechaRelativa = (fecha: Date) => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
    return formatearFecha(fecha);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Proyectos</h1>
          <p className="text-gray-600 mt-1">Gestión de proyectos y nuevas iniciativas</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">🟡 PROPUESTAS</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{propuestas.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">🔵 EN CURSO</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{enCurso.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-300 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">🟢 COMPLETADOS</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{completados.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-200">
          <h2 className="text-xl font-semibold mb-4">
            {editandoId ? '✏️ Editar Proyecto' : '✨ Nuevo Proyecto'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Ej: Nueva Clínica Madrid"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Describe el proyecto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="externo">Externo</option>
                  <option value="interno">Interno</option>
                  <option value="investigacion">Investigación</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => setFormData({...formData, estado: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="propuesta">Propuesta</option>
                  <option value="en-curso">En Curso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => setFormData({...formData, prioridad: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <input
                  type="text"
                  value={formData.responsable}
                  onChange={(e) => setFormData({...formData, responsable: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del responsable"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                <input
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({...formData, fechaInicio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Estimada</label>
                <input
                  type="date"
                  value={formData.fechaFinEstimada}
                  onChange={(e) => setFormData({...formData, fechaFinEstimada: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? 'Actualizar' : 'Crear'} Proyecto</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Proyectos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {proyectos.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 text-lg">No hay proyectos registrados</p>
            <p className="text-gray-400 text-sm mt-2">Crea tu primer proyecto con el botón "Nuevo Proyecto"</p>
          </div>
        ) : (
          proyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className={`bg-white rounded-lg shadow-lg border-2 hover:shadow-xl transition-all cursor-pointer ${getColorEstado(proyecto.estado)}`}
              onClick={() => setProyectoSeleccionado(proyecto)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {proyecto.nombre}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorTipo(proyecto.tipo)}`}>
                        {proyecto.tipo.charAt(0).toUpperCase() + proyecto.tipo.slice(1)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorPrioridad(proyecto.prioridad)}`}>
                        Prioridad: {proyecto.prioridad.charAt(0).toUpperCase() + proyecto.prioridad.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        iniciarEdicion(proyecto);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarProyecto(proyecto.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Descripción */}
                {proyecto.descripcion && (
                  <p className="text-gray-600 text-sm mb-4">{proyecto.descripcion}</p>
                )}

                {/* Info */}
                <div className="space-y-2 text-sm mb-4">
                  {proyecto.responsable && (
                    <div className="flex items-center space-x-2 text-gray-700">
                      <User className="w-4 h-4" />
                      <span>{proyecto.responsable}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatearFecha(proyecto.fechaInicio)} 
                      {proyecto.fechaFinEstimada && ` → ${formatearFecha(proyecto.fechaFinEstimada)}`}
                    </span>
                  </div>
                </div>

                {/* Últimas actualizaciones */}
                {proyecto.actualizaciones.length > 0 && (
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-gray-700 mb-2">📝 Últimas actualizaciones:</p>
                    <div className="space-y-1">
                      {proyecto.actualizaciones.slice(0, 2).map((act) => (
                        <div key={act.id} className="text-xs text-gray-600 flex items-start space-x-2">
                          <span className="text-gray-400">{formatearFechaRelativa(act.fecha)}</span>
                          <span>-</span>
                          <span className="flex-1">{act.texto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Botones de estado */}
                <div className="flex space-x-2 mt-4">
                  {proyecto.estado === 'propuesta' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(proyecto.id, 'en-curso');
                      }}
                      className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      → Iniciar
                    </button>
                  )}
                  {proyecto.estado === 'en-curso' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cambiarEstado(proyecto.id, 'completado');
                      }}
                      className="flex-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200"
                    >
                      ✓ Completar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de detalles del proyecto */}
      {proyectoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header del modal */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {proyectoSeleccionado.nombre}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorEstado(proyectoSeleccionado.estado)}`}>
                      {proyectoSeleccionado.estado === 'propuesta' ? '🟡 Propuesta' : 
                       proyectoSeleccionado.estado === 'en-curso' ? '🔵 En Curso' : 
                       '🟢 Completado'}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorTipo(proyectoSeleccionado.tipo)}`}>
                      {proyectoSeleccionado.tipo.charAt(0).toUpperCase() + proyectoSeleccionado.tipo.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorPrioridad(proyectoSeleccionado.prioridad)}`}>
                      Prioridad: {proyectoSeleccionado.prioridad.charAt(0).toUpperCase() + proyectoSeleccionado.prioridad.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setProyectoSeleccionado(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Descripción */}
              {proyectoSeleccionado.descripcion && (
                <div className="mb-4">
                  <p className="text-gray-700">{proyectoSeleccionado.descripcion}</p>
                </div>
              )}

              {/* Info del proyecto */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                {proyectoSeleccionado.responsable && (
                  <div>
                    <p className="text-xs text-gray-500">Responsable</p>
                    <p className="text-sm font-medium text-gray-900">{proyectoSeleccionado.responsable}</p>
                  </div>
                )}
                {proyectoSeleccionado.fechaInicio && (
                  <div>
                    <p className="text-xs text-gray-500">Fecha Inicio</p>
                    <p className="text-sm font-medium text-gray-900">{formatearFecha(proyectoSeleccionado.fechaInicio)}</p>
                  </div>
                )}
                {proyectoSeleccionado.fechaFinEstimada && (
                  <div>
                    <p className="text-xs text-gray-500">Fecha Fin Estimada</p>
                    <p className="text-sm font-medium text-gray-900">{formatearFecha(proyectoSeleccionado.fechaFinEstimada)}</p>
                  </div>
                )}
                {proyectoSeleccionado.fechaFinReal && (
                  <div>
                    <p className="text-xs text-gray-500">Fecha Completado</p>
                    <p className="text-sm font-medium text-green-700">{formatearFecha(proyectoSeleccionado.fechaFinReal)}</p>
                  </div>
                )}
              </div>

              {/* Añadir actualización */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Nueva Actualización
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={nuevaActualizacion}
                    onChange={(e) => setNuevaActualizacion(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        añadirActualizacion();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Escribe una actualización..."
                  />
                  <button
                    onClick={añadirActualizacion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Timeline de actualizaciones */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  📅 Timeline de Actualizaciones
                </h3>
                {proyectoSeleccionado.actualizaciones.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No hay actualizaciones aún. Añade la primera arriba.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {proyectoSeleccionado.actualizaciones.map((act) => (
                      <div key={act.id} className="flex space-x-3 border-l-2 border-blue-300 pl-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {formatearFechaRelativa(act.fecha)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{act.autor}</span>
                          </div>
                          <p className="text-sm text-gray-700">{act.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}