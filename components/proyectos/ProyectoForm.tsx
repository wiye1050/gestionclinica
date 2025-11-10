'use client';

import { useState, useEffect } from 'react';
import { Proyecto, TipoProyecto, EstadoProyecto, PrioridadProyecto } from '@/types/proyectos';
import { X, Save, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { sanitizeHTML, sanitizeInput, sanitizeStringArray } from '@/lib/utils/sanitize';

type ProyectoDraft = Omit<Proyecto, 'id'> & { id?: string };

interface ProyectoFormProps {
  proyecto?: Proyecto | null;
  onClose: () => void;
  onGuardar: (proyecto: ProyectoDraft) => void;
  profesionales: Array<{ uid: string; nombre: string }>;
}

export default function ProyectoForm({ proyecto, onClose, onGuardar, profesionales }: ProyectoFormProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'desarrollo' as TipoProyecto,
    estado: 'propuesta' as EstadoProyecto,
    prioridad: 'media' as PrioridadProyecto,
    responsableUid: '',
    responsableNombre: '',
    fechaInicio: '',
    fechaFinEstimada: '',
    progreso: 0,
    presupuesto: 0,
    horasEstimadas: 0,
    tags: '',
    color: '#3b82f6',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (proyecto) {
      setFormData({
        nombre: proyecto.nombre || '',
        descripcion: proyecto.descripcion || '',
        tipo: proyecto.tipo || 'desarrollo',
        estado: proyecto.estado || 'propuesta',
        prioridad: proyecto.prioridad || 'media',
        responsableUid: proyecto.responsableUid || '',
        responsableNombre: proyecto.responsableNombre || '',
        fechaInicio: proyecto.fechaInicio ? format(proyecto.fechaInicio, 'yyyy-MM-dd') : '',
        fechaFinEstimada: proyecto.fechaFinEstimada ? format(proyecto.fechaFinEstimada, 'yyyy-MM-dd') : '',
        progreso: proyecto.progreso || 0,
        presupuesto: proyecto.presupuesto || 0,
        horasEstimadas: proyecto.horasEstimadas || 0,
        tags: proyecto.tags?.join(', ') || '',
        color: proyecto.color || '#3b82f6',
      });
    }
  }, [proyecto]);

  const handleChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleResponsableChange = (uid: string) => {
    const profesional = profesionales.find(p => p.uid === uid);
    setFormData(prev => ({
      ...prev,
      responsableUid: uid,
      responsableNombre: profesional?.nombre || '',
    }));
  };

  const validar = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria';
    }
    if (!formData.responsableUid) {
      newErrors.responsableUid = 'Debes seleccionar un responsable';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validar()) return;

    const tagsArray = sanitizeStringArray(
      formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
    );

    const proyectoData: ProyectoDraft = {
      nombre: sanitizeInput(formData.nombre),
      descripcion: sanitizeHTML(formData.descripcion),
      tipo: formData.tipo,
      estado: formData.estado,
      prioridad: formData.prioridad,
      responsableUid: sanitizeInput(formData.responsableUid),
      responsableNombre: sanitizeInput(formData.responsableNombre),
      progreso: formData.progreso,
      tags: tagsArray,
      color: sanitizeInput(formData.color),
      hitos: proyecto?.hitos || [],
      tareas: proyecto?.tareas || [],
      actualizaciones: proyecto?.actualizaciones || [],
      createdAt: proyecto?.createdAt || new Date(),
      updatedAt: new Date(),
      creadoPor: proyecto?.creadoPor || 'current-user',
    };

    if (formData.fechaInicio) {
      proyectoData.fechaInicio = new Date(formData.fechaInicio);
    }
    if (formData.fechaFinEstimada) {
      proyectoData.fechaFinEstimada = new Date(formData.fechaFinEstimada);
    }
    if (formData.presupuesto > 0) {
      proyectoData.presupuesto = formData.presupuesto;
    }
    if (formData.horasEstimadas > 0) {
      proyectoData.horasEstimadas = formData.horasEstimadas;
    }

    if (proyecto?.id) {
      proyectoData.id = proyecto.id;
    }

    onGuardar(proyectoData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-card rounded-3xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {proyecto ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-brand/90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Información Básica
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus-visible:focus-ring ${
                  errors.nombre ? 'border-red-500' : 'border-b border-borderorder'
                }`}
                placeholder="Ej: Implementación Portal Paciente"
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Descripción *
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 border rounded-lg focus-visible:focus-ring ${
                  errors.descripcion ? 'border-red-500' : 'border-b border-borderorder'
                }`}
                placeholder="Describe el objetivo y alcance del proyecto..."
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value as TipoProyecto)}
                  className="w-full px-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
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
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Estado
                </label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value as EstadoProyecto)}
                  className="w-full px-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                >
                  <option value="propuesta">Propuesta</option>
                  <option value="planificacion">Planificación</option>
                  <option value="en-curso">En Curso</option>
                  <option value="pausado">Pausado</option>
                  <option value="completado">Completado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Prioridad
                </label>
                <select
                  value={formData.prioridad}
                  onChange={(e) => handleChange('prioridad', e.target.value as PrioridadProyecto)}
                  className="w-full px-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleChange('color', e.target.value)}
                  className="w-full h-10 px-2 border border-b border-borderorder rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Responsable y Fechas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Responsable y Fechas
            </h3>

            <div>
              <label className="block text-sm font-medium text-text-muted mb-1">
                Responsable *
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <select
                  value={formData.responsableUid}
                  onChange={(e) => handleResponsableChange(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus-visible:focus-ring ${
                    errors.responsableUid ? 'border-red-500' : 'border-b border-borderorder'
                  }`}
                >
                  <option value="">Selecciona un responsable</option>
                  {profesionales.map((prof) => (
                    <option key={prof.uid} value={prof.uid}>
                      {prof.nombre}
                    </option>
                  ))}
                </select>
              </div>
              {errors.responsableUid && (
                <p className="text-red-500 text-sm mt-1">{errors.responsableUid}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Fecha de Inicio
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="date"
                    value={formData.fechaInicio}
                    onChange={(e) => handleChange('fechaInicio', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Fecha Estimada Fin
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="date"
                    value={formData.fechaFinEstimada}
                    onChange={(e) => handleChange('fechaFinEstimada', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recursos */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Recursos
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Progreso (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progreso}
                  onChange={(e) => handleChange('progreso', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Presupuesto (€)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="number"
                    min="0"
                    value={formData.presupuesto}
                    onChange={(e) => handleChange('presupuesto', parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">
                  Horas Estimadas
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                  <input
                    type="number"
                    min="0"
                    value={formData.horasEstimadas}
                    onChange={(e) => handleChange('horasEstimadas', parseInt(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Etiquetas */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Etiquetas
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              className="w-full px-4 py-2 border border-b border-borderorder rounded-lg focus-visible:focus-ring"
              placeholder="Separadas por comas: frontend, urgent, v2.0"
            />
            <p className="text-sm text-text-muted mt-1">Separa las etiquetas con comas</p>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-b border-borderorder text-text-muted hover:bg-cardHover rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-brand text-white hover:bg-brand/90 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {proyecto ? 'Guardar Cambios' : 'Crear Proyecto'}
          </button>
        </div>
      </div>
    </div>
  );
}
