'use client';

import { useState } from 'react';
import { Proyecto, ProyectoHito, ProyectoTarea, ProyectoActualizacion } from '@/types/proyectos';
import { 
  X, Calendar, Users, Tag, DollarSign, Clock, Link as LinkIcon,
  Target, CheckCircle, AlertCircle, TrendingUp, MessageSquare,
  Edit, Trash2, Plus, FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProyectoDetalleProps {
  proyecto: Proyecto;
  onClose: () => void;
  onEditar: (proyecto: Proyecto) => void;
  onEliminar: (id: string) => void;
}

export default function ProyectoDetalle({ proyecto, onClose, onEditar, onEliminar }: ProyectoDetalleProps) {
  const [tab, setTab] = useState<'general' | 'tareas' | 'hitos' | 'actualizaciones'>('general');

  const tareasCompletadas = proyecto.tareas?.filter(t => t.estado === 'completada').length || 0;
  const totalTareas = proyecto.tareas?.length || 0;
  const hitosCompletados = proyecto.hitos?.filter(h => h.completado).length || 0;
  const totalHitos = proyecto.hitos?.length || 0;

  const COLORES_ESTADO = {
    propuesta: 'bg-gray-100 text-gray-700',
    planificacion: 'bg-blue-100 text-blue-700',
    'en-curso': 'bg-yellow-100 text-yellow-700',
    pausado: 'bg-orange-100 text-orange-700',
    completado: 'bg-green-100 text-green-700',
    cancelado: 'bg-red-100 text-red-700',
  };

  const COLORES_PRIORIDAD = {
    critica: 'text-red-600 bg-red-50',
    alta: 'text-orange-600 bg-orange-50',
    media: 'text-yellow-600 bg-yellow-50',
    baja: 'text-gray-600 bg-gray-50',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold">{proyecto.nombre}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${COLORES_ESTADO[proyecto.estado]}`}>
                {proyecto.estado}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${COLORES_PRIORIDAD[proyecto.prioridad]}`}>
                {proyecto.prioridad}
              </span>
            </div>
            <p className="text-blue-100">{proyecto.descripcion}</p>
            
            {/* Stats rápidos */}
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Progreso: {proyecto.progreso}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Tareas: {tareasCompletadas}/{totalTareas}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Hitos: {hitosCompletados}/{totalHitos}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEditar(proyecto)}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (confirm('¿Eliminar este proyecto?')) {
                  onEliminar(proyecto.id);
                  onClose();
                }
              }}
              className="p-2 hover:bg-red-600 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setTab('general')}
              className={`py-3 border-b-2 font-medium transition-colors ${
                tab === 'general'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setTab('tareas')}
              className={`py-3 border-b-2 font-medium transition-colors ${
                tab === 'tareas'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tareas ({totalTareas})
            </button>
            <button
              onClick={() => setTab('hitos')}
              className={`py-3 border-b-2 font-medium transition-colors ${
                tab === 'hitos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Hitos ({totalHitos})
            </button>
            <button
              onClick={() => setTab('actualizaciones')}
              className={`py-3 border-b-2 font-medium transition-colors ${
                tab === 'actualizaciones'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Actualizaciones ({proyecto.actualizaciones?.length || 0})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'general' && (
            <div className="space-y-6">
              {/* Info Principal */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo</label>
                    <p className="text-gray-900 capitalize">{proyecto.tipo}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Responsable</label>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-gray-900">{proyecto.responsableNombre}</p>
                    </div>
                  </div>

                  {proyecto.fechaInicio && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha Inicio</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {format(proyecto.fechaInicio, 'dd MMMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}

                  {proyecto.fechaFinEstimada && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Fecha Estimada</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {format(proyecto.fechaFinEstimada, 'dd MMMM yyyy', { locale: es })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {proyecto.presupuesto && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Presupuesto</label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {proyecto.presupuesto.toLocaleString('es-ES')}€
                          {proyecto.presupuestoGastado && (
                            <span className="text-sm text-gray-500 ml-2">
                              (Gastado: {proyecto.presupuestoGastado.toLocaleString('es-ES')}€)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {proyecto.horasEstimadas && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Horas</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {proyecto.horasEstimadas}h estimadas
                          {proyecto.horasReales && (
                            <span className="text-sm text-gray-500 ml-2">
                              ({proyecto.horasReales}h reales)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {proyecto.tags && proyecto.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Etiquetas</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {proyecto.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de Progreso */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Progreso General</label>
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all flex items-center justify-end pr-2"
                    style={{ width: `${proyecto.progreso}%` }}
                  >
                    <span className="text-xs font-bold text-white">{proyecto.progreso}%</span>
                  </div>
                </div>
              </div>

              {/* Equipo */}
              {proyecto.equipo && proyecto.equipo.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Equipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {proyecto.equipo.map((miembro, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{miembro.nombre}</p>
                          <p className="text-sm text-gray-500">{miembro.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enlaces */}
              {proyecto.enlaces && proyecto.enlaces.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Enlaces</label>
                  <div className="space-y-2">
                    {proyecto.enlaces.map((enlace, idx) => (
                      <a
                        key={idx}
                        href={enlace.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <LinkIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-900">{enlace.titulo}</span>
                        <span className="text-xs text-gray-500 ml-auto">{enlace.tipo}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'tareas' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Tareas del Proyecto</h3>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Tarea
                </button>
              </div>
              
              {proyecto.tareas && proyecto.tareas.length > 0 ? (
                proyecto.tareas.map((tarea) => (
                  <div key={tarea.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{tarea.titulo}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            tarea.estado === 'completada' ? 'bg-green-100 text-green-700' :
                            tarea.estado === 'en-curso' ? 'bg-blue-100 text-blue-700' :
                            tarea.estado === 'bloqueada' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {tarea.estado}
                          </span>
                        </div>
                        {tarea.descripcion && (
                          <p className="text-sm text-gray-600">{tarea.descripcion}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {tarea.asignadoNombre && (
                            <span>👤 {tarea.asignadoNombre}</span>
                          )}
                          {tarea.fechaLimite && (
                            <span>📅 {format(tarea.fechaLimite, 'dd MMM', { locale: es })}</span>
                          )}
                          {tarea.estimacionHoras && (
                            <span>⏱️ {tarea.estimacionHoras}h</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay tareas creadas</p>
              )}
            </div>
          )}

          {tab === 'hitos' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Hitos del Proyecto</h3>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nuevo Hito
                </button>
              </div>

              {proyecto.hitos && proyecto.hitos.length > 0 ? (
                proyecto.hitos.map((hito) => (
                  <div key={hito.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${hito.completado ? 'text-green-600' : 'text-gray-400'}`}>
                        {hito.completado ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{hito.nombre}</h4>
                        {hito.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{hito.descripcion}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>📅 Objetivo: {format(hito.fechaObjetivo, 'dd MMM yyyy', { locale: es })}</span>
                          {hito.fechaCompletado && (
                            <span className="text-green-600">
                              ✅ Completado: {format(hito.fechaCompletado, 'dd MMM yyyy', { locale: es })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No hay hitos definidos</p>
              )}
            </div>
          )}

          {tab === 'actualizaciones' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-900">Actualizaciones</h3>
                <button className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Nueva Actualización
                </button>
              </div>

              {proyecto.actualizaciones && proyecto.actualizaciones.length > 0 ? (
                <div className="space-y-3">
                  {proyecto.actualizaciones.map((act) => (
                    <div key={act.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${
                          act.tipo === 'progreso' ? 'text-blue-600' :
                          act.tipo === 'bloqueador' ? 'text-red-600' :
                          act.tipo === 'hito' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{act.autorNombre || 'Usuario'}</span>
                            <span className="text-xs text-gray-500">
                              {format(act.fecha, 'dd MMM yyyy, HH:mm', { locale: es })}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              act.tipo === 'progreso' ? 'bg-blue-100 text-blue-700' :
                              act.tipo === 'bloqueador' ? 'bg-red-100 text-red-700' :
                              act.tipo === 'hito' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {act.tipo}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{act.texto}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay actualizaciones</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
