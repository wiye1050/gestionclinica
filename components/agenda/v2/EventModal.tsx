'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Calendar, Clock, User, MapPin, AlertCircle } from 'lucide-react';
import { AgendaEvent } from './agendaHelpers';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Partial<AgendaEvent>) => Promise<void>;
  event?: AgendaEvent | null;
  initialDate?: Date;
  profesionales: Array<{ id: string; nombre: string; apellidos: string }>;
  salas: Array<{ id: string; nombre: string }>;
  pacientes?: Array<{ id: string; nombre: string; apellidos: string }>;
}

export default function EventModal({
  isOpen,
  onClose,
  onSave,
  event,
  initialDate,
  profesionales,
  salas,
  pacientes = [],
}: EventModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'consulta' as AgendaEvent['tipo'],
    fechaInicio: '',
    horaInicio: '',
    duracion: 30,
    profesionalId: '',
    salaId: '',
    pacienteId: '',
    prioridad: 'media' as AgendaEvent['prioridad'],
    notas: '',
  });

  useEffect(() => {
    if (event) {
      // Modo edición
      setFormData({
        titulo: event.titulo,
        tipo: event.tipo,
        fechaInicio: format(event.fechaInicio, 'yyyy-MM-dd'),
        horaInicio: format(event.fechaInicio, 'HH:mm'),
        duracion: Math.round((event.fechaFin.getTime() - event.fechaInicio.getTime()) / 60000),
        profesionalId: event.profesionalId || '',
        salaId: event.salaId || '',
        pacienteId: event.pacienteId || '',
        prioridad: event.prioridad || 'media',
        notas: event.notas || '',
      });
    } else if (initialDate) {
      // Modo creación con fecha inicial
      setFormData(prev => ({
        ...prev,
        fechaInicio: format(initialDate, 'yyyy-MM-dd'),
        horaInicio: format(initialDate, 'HH:mm'),
      }));
    }
  }, [event, initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fechaInicio = new Date(`${formData.fechaInicio}T${formData.horaInicio}`);
      const fechaFin = new Date(fechaInicio.getTime() + formData.duracion * 60000);

      const profesional = profesionales.find(p => p.id === formData.profesionalId);
      const sala = salas.find(s => s.id === formData.salaId);
      const paciente = pacientes.find(p => p.id === formData.pacienteId);

      const eventData: Partial<AgendaEvent> = {
        titulo: formData.titulo,
        tipo: formData.tipo,
        fechaInicio,
        fechaFin,
        profesionalId: formData.profesionalId || undefined,
        profesionalNombre: profesional ? `${profesional.nombre} ${profesional.apellidos}` : undefined,
        salaId: formData.salaId || undefined,
        salaNombre: sala?.nombre,
        pacienteId: formData.pacienteId || undefined,
        pacienteNombre: paciente ? `${paciente.nombre} ${paciente.apellidos}` : undefined,
        prioridad: formData.prioridad,
        notas: formData.notas,
        estado: event?.estado || 'programada',
      };

      await onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Título de la cita *
            </label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Ej: Consulta inicial"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Tipo de cita *
            </label>
            <select
              required
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value as AgendaEvent['tipo'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="consulta">Consulta</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="revision">Revisión</option>
              <option value="tratamiento">Tratamiento</option>
              <option value="urgencia">Urgencia</option>
              <option value="administrativo">Administrativo</option>
            </select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha *
              </label>
              <input
                type="date"
                required
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora *
              </label>
              <input
                type="time"
                required
                value={formData.horaInicio}
                onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>

          {/* Duración */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Duración (minutos) *
            </label>
            <select
              required
              value={formData.duracion}
              onChange={(e) => setFormData({ ...formData, duracion: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>1 hora</option>
              <option value={90}>1 hora 30 min</option>
              <option value={120}>2 horas</option>
            </select>
          </div>

          {/* Profesional y Sala */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Profesional
              </label>
              <select
                value={formData.profesionalId}
                onChange={(e) => setFormData({ ...formData, profesionalId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Sin asignar</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" />
                Sala
              </label>
              <select
                value={formData.salaId}
                onChange={(e) => setFormData({ ...formData, salaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Sin asignar</option>
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paciente */}
          {pacientes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Paciente
              </label>
              <select
                value={formData.pacienteId}
                onChange={(e) => setFormData({ ...formData, pacienteId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="">Sin asignar</option>
                {pacientes.map((pac) => (
                  <option key={pac.id} value={pac.id}>
                    {pac.nombre} {pac.apellidos}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Prioridad
            </label>
            <select
              value={formData.prioridad}
              onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as AgendaEvent['prioridad'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="Información adicional..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (event ? 'Actualizar' : 'Crear Cita')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
