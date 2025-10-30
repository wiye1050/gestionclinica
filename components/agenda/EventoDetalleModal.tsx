'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DetailPanel from '@/components/shared/DetailPanel';
import { EstadoEventoAgenda } from '@/types';
import {
  Clock,
  User,
  MapPin,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  MessageSquare
} from 'lucide-react';

interface AgendaEvent {
  id: string;
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  estado: EstadoEventoAgenda;
  tipo: string;
  pacienteId?: string;
  pacienteNombre?: string;
  profesionalId?: string;
  profesionalNombre?: string;
  salaId?: string;
  salaNombre?: string;
  prioridad?: 'alta' | 'media' | 'baja';
  notas?: string;
  motivoConsulta?: string;
}

interface EventoDetalleModalProps {
  evento: AgendaEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateEstado: (nuevoEstado: EstadoEventoAgenda) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

const ESTADO_INFO = {
  programada: {
    color: 'blue',
    icon: Calendar,
    label: 'Programada',
    actions: ['confirmar', 'cancelar']
  },
  confirmada: {
    color: 'green',
    icon: CheckCircle,
    label: 'Confirmada',
    actions: ['completar', 'cancelar']
  },
  realizada: {
    color: 'gray',
    icon: CheckCircle,
    label: 'Realizada',
    actions: []
  },
  cancelada: {
    color: 'red',
    icon: XCircle,
    label: 'Cancelada',
    actions: ['reprogramar']
  },
};

const PRIORIDAD_COLORS = {
  alta: 'text-red-600 bg-red-100',
  media: 'text-yellow-600 bg-yellow-100',
  baja: 'text-green-600 bg-green-100',
};

export default function EventoDetalleModal({
  evento,
  isOpen,
  onClose,
  onUpdateEstado,
  onEdit,
  onDelete,
  onDuplicate
}: EventoDetalleModalProps) {
  const [tab, setTab] = useState<'detalles' | 'notas' | 'historial'>('detalles');

  if (!evento) return null;

  const estadoInfo = ESTADO_INFO[evento.estado];
  const Icon = estadoInfo.icon;
  const duracionMinutos = Math.round((evento.fechaFin.getTime() - evento.fechaInicio.getTime()) / 60000);

  const tabs = [
    { id: 'detalles', label: 'Detalles', content: null },
    { id: 'notas', label: 'Notas', content: null },
    { id: 'historial', label: 'Historial', content: null },
  ];

  return (
    <DetailPanel
      isOpen={isOpen}
      onClose={onClose}
      title={evento.titulo || 'Evento sin título'}
      subtitle={`${format(evento.fechaInicio, "dd 'de' MMMM 'de' yyyy", { locale: es })}`}
      tabs={tabs}
      currentTab={tab}
      onTabChange={(t) => setTab(t as typeof tab)}
      headerColor={`from-${estadoInfo.color}-600 to-${estadoInfo.color}-700`}
      actions={
        <>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              title="Editar"
            >
              <Edit className="w-5 h-5" />
            </button>
          )}
          {onDuplicate && (
            <button
              onClick={onDuplicate}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
              title="Duplicar"
            >
              <Copy className="w-5 h-5" />
            </button>
          )}
          {onDelete && evento.estado !== 'realizada' && (
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-700 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </>
      }
    >
      {tab === 'detalles' && (
        <div className="space-y-6">
          {/* Estado y Prioridad */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 bg-${estadoInfo.color}-100 text-${estadoInfo.color}-700 rounded-lg font-medium`}>
              <Icon className="w-5 h-5" />
              <span>{estadoInfo.label}</span>
            </div>
            
            {evento.prioridad && (
              <div className={`px-4 py-2 rounded-lg font-medium ${PRIORIDAD_COLORS[evento.prioridad]}`}>
                {evento.prioridad === 'alta' && <AlertCircle className="w-5 h-5 inline mr-2" />}
                Prioridad {evento.prioridad}
              </div>
            )}
          </div>

          {/* Información Principal */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Horario
                </label>
                <p className="text-gray-900">
                  {format(evento.fechaInicio, 'HH:mm')} - {format(evento.fechaFin, 'HH:mm')}
                </p>
                <p className="text-sm text-gray-500">
                  Duración: {duracionMinutos} minutos
                </p>
              </div>

              {evento.pacienteNombre && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Paciente
                  </label>
                  <p className="text-gray-900 font-medium">{evento.pacienteNombre}</p>
                  {evento.pacienteId && (
                    <a
                      href={`/dashboard/pacientes/${evento.pacienteId}`}
                      className="text-sm text-blue-600 hover:text-blue-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver ficha del paciente →
                    </a>
                  )}
                </div>
              )}

              {evento.tipo && (
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Tipo de cita
                  </label>
                  <p className="text-gray-900 capitalize">{evento.tipo.replace('-', ' ')}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {evento.profesionalNombre && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    Profesional
                  </label>
                  <p className="text-gray-900">{evento.profesionalNombre}</p>
                </div>
              )}

              {evento.salaNombre && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Sala
                  </label>
                  <p className="text-gray-900">{evento.salaNombre}</p>
                </div>
              )}
            </div>
          </div>

          {/* Motivo de consulta */}
          {evento.motivoConsulta && (
            <div>
              <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Motivo de consulta
              </label>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                {evento.motivoConsulta}
              </p>
            </div>
          )}

          {/* Acciones de Estado */}
          {estadoInfo.actions.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Cambiar estado
              </label>
              <div className="flex flex-wrap gap-2">
                {estadoInfo.actions.map((action) => {
                  const actionMap: Record<string, { label: string; estado: EstadoEventoAgenda; color: string }> = {
                    confirmar: { label: 'Confirmar cita', estado: 'confirmada', color: 'green' },
                    completar: { label: 'Marcar como realizada', estado: 'realizada', color: 'gray' },
                    cancelar: { label: 'Cancelar', estado: 'cancelada', color: 'red' },
                    reprogramar: { label: 'Reprogramar', estado: 'programada', color: 'blue' },
                  };

                  const actionInfo = actionMap[action];
                  
                  return (
                    <button
                      key={action}
                      onClick={() => onUpdateEstado(actionInfo.estado)}
                      className={`px-4 py-2 bg-${actionInfo.color}-600 text-white hover:bg-${actionInfo.color}-700 rounded-lg font-medium transition-colors`}
                    >
                      {actionInfo.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'notas' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notas internas
            </label>
            {evento.notas ? (
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
                {evento.notas}
              </p>
            ) : (
              <p className="text-gray-500 italic">No hay notas para este evento</p>
            )}
          </div>

          <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition-colors">
            Añadir nota
          </button>
        </div>
      )}

      {tab === 'historial' && (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">
            Historial de cambios del evento (próximamente)
          </p>
          
          {/* Ejemplo de historial */}
          <div className="space-y-2">
            <div className="border-l-2 border-blue-600 pl-4 py-2">
              <p className="text-sm font-medium text-gray-900">Evento creado</p>
              <p className="text-xs text-gray-500">
                {format(evento.fechaInicio, "dd/MM/yyyy HH:mm")}
              </p>
            </div>
          </div>
        </div>
      )}
    </DetailPanel>
  );
}
