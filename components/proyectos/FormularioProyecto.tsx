'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Proyecto, TipoProyecto, EstadoProyecto, PrioridadProyecto } from '@/types/proyectos';
import { X, Save, User, Tag, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface FormularioProyectoProps {
  proyecto?: Proyecto;
  onSubmit: (datos: any) => void;
  onCancelar: () => void;
  profesionales: Array<{ uid: string; nombre: string }>;
}

export default function FormularioProyecto({ 
  proyecto, 
  onSubmit, 
  onCancelar,
  profesionales 
}: FormularioProyectoProps) {
  const esEdicion = !!proyecto;
  const [tags, setTags] = useState<string[]>(proyecto?.tags || []);
  const [nuevoTag, setNuevoTag] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: proyecto ? {
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion,
      tipo: proyecto.tipo,
      estado: proyecto.estado,
      prioridad: proyecto.prioridad,
      responsableUid: proyecto.responsableUid,
      fechaInicio: proyecto.fechaInicio ? format(proyecto.fechaInicio, 'yyyy-MM-dd') : '',
      fechaFinEstimada: proyecto.fechaFinEstimada ? format(proyecto.fechaFinEstimada, 'yyyy-MM-dd') : '',
      presupuesto: proyecto.presupuesto,
      horasEstimadas: proyecto.horasEstimadas,
      color: proyecto.color || '#3b82f6',
    } : {
      tipo: 'desarrollo' as TipoProyecto,
      estado: 'propuesta' as EstadoProyecto,
      prioridad: 'media' as PrioridadProyecto,
      color: '#3b82f6',
    }
  });

  const agregarTag = () => {
    if (nuevoTag.trim() && !tags.includes(nuevoTag.trim())) {
      setTags([...tags, nuevoTag.trim()]);
      setNuevoTag('');
    }
  };

  const eliminarTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onFormSubmit = (data: any) => {
    const responsable = profesionales.find(p => p.uid === data.responsableUid);
    
    onSubmit({
      ...data,
      responsableNombre: responsable?.nombre || '',
      tags,
      progreso: proyecto?.progreso || 0,
      hitos: proyecto?.hitos || [],
      actualizaciones: proyecto?.actualizaciones || [],
      tareas: proyecto?.tareas || [],
      equipo: proyecto?.equipo || [],
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
      fechaFinEstimada: data.fechaFinEstimada ? new Date(data.fechaFinEstimada) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {esEdicion ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button
            onClick={onCancelar}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Proyecto *
              </label>
              <input
                {...register('nombre', { required: 'El nombre es requerido' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Portal del Paciente"
              />
              {errors.nombre && (
                <p className="text-red-600 text-sm mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe los objetivos del proyecto..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  {...register('tipo', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desarrollo">Desarrollo</option>
                  <option value="operacional">Operacional</option>
                  <option value="investigacion">Investigación</option>
                  <option value="marketing">Marketing</option>
                  <option value="mejora">Mejora</option>
                  <option value="infraestructura">Infraestructura</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                <select
                  {...register('estado', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="propuesta">Propuesta</option>
                  <option value="planificacion">Planificación</option>
                  <option value="en-curso">En Curso</option>
                  <option value="pausado">Pausado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                <select
                  {...register('prioridad', { required: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                {...register('color')}
                className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Responsable */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Responsable</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable *</label>
              <select
                {...register('responsableUid', { required: 'Selecciona un responsable' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecciona...</option>
                {profesionales.map(p => (
                  <option key={p.uid} value={p.uid}>{p.nombre}</option>
                ))}
              </select>
              {errors.responsableUid && (
                <p className="text-red-600 text-sm mt-1">{errors.responsableUid.message}</p>
              )}
            </div>
          </div>

          {/* Fechas y Recursos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Fechas y Recursos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  {...register('fechaInicio')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin Estimada</label>
                <input
                  type="date"
                  {...register('fechaFinEstimada')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presupuesto (€)</label>
                <input
                  type="number"
                  {...register('presupuesto')}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horas Estimadas</label>
                <input
                  type="number"
                  {...register('horasEstimadas')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Etiquetas</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoTag}
                onChange={(e) => setNuevoTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarTag())}
                placeholder="Agregar etiqueta..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={agregarTag}
                className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => eliminarTag(tag)}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancelar}
              className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {esEdicion ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
