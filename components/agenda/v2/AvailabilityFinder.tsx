'use client';

import { useState } from 'react';
import { Calendar, Clock, User, Search, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui';
import Card from '@/components/ui/Card';
import { toast } from 'sonner';

interface SlotDisponible {
  inicio: Date;
  fin: Date;
  profesionalId: string;
  profesionalNombre: string;
  salaId?: string;
  salaNombre?: string;
  score: number;
  razon?: string;
}

interface Profesional {
  id: string;
  nombre: string;
  apellidos: string;
}

interface AvailabilityFinderProps {
  profesionales: Profesional[];
  onSelectSlot: (slot: SlotDisponible) => void;
  onClose?: () => void;
  defaultProfesionalId?: string;
  defaultDuracion?: number;
}

export default function AvailabilityFinder({
  profesionales,
  onSelectSlot,
  onClose,
  defaultProfesionalId,
  defaultDuracion = 30,
}: AvailabilityFinderProps) {
  const [profesionalId, setProfesionalId] = useState(defaultProfesionalId || '');
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duracionMinutos, setDuracionMinutos] = useState(defaultDuracion);
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [excluirAlmuerzo, setExcluirAlmuerzo] = useState(true);

  const [buscando, setBuscando] = useState(false);
  const [slots, setSlots] = useState<SlotDisponible[]>([]);
  const [slotSeleccionado, setSlotSeleccionado] = useState<SlotDisponible | null>(null);

  const buscarDisponibilidad = async () => {
    setBuscando(true);
    setSlots([]);
    setSlotSeleccionado(null);

    try {
      const response = await fetch('/api/agenda/disponibilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profesionalId: profesionalId || undefined,
          fecha,
          duracionMinutos,
          preferencias: {
            horaInicio,
            horaFin,
            excluirAlmuerzo,
            profesionalPreferido: profesionalId || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al buscar disponibilidad');
      }

      const data = await response.json();
      setSlots(data.slots || []);

      if (data.slots.length === 0) {
        toast.info('No se encontraron horarios disponibles con los criterios especificados');
      }
    } catch (error) {
      toast.error('Error al buscar disponibilidad');
      console.error(error);
    } finally {
      setBuscando(false);
    }
  };

  const handleSelectSlot = (slot: SlotDisponible) => {
    setSlotSeleccionado(slot);
  };

  const handleConfirmar = () => {
    if (slotSeleccionado) {
      onSelectSlot(slotSeleccionado);
      onClose?.();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-brand';
    if (score >= 40) return 'text-warn';
    return 'text-text-muted';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Aceptable';
    return 'Disponible';
  };

  return (
    <div className="space-y-6">
      {/* Formulario de búsqueda */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text">Buscar Disponibilidad</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profesional */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Profesional
              </label>
              <select
                value={profesionalId}
                onChange={(e) => setProfesionalId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-text focus-visible:focus-ring"
              >
                <option value="">Cualquier profesional</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} {prof.apellidos}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-text focus-visible:focus-ring"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            {/* Duración */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Duración (minutos)
              </label>
              <input
                type="number"
                value={duracionMinutos}
                onChange={(e) => setDuracionMinutos(parseInt(e.target.value))}
                min={15}
                max={180}
                step={15}
                className="w-full rounded-lg border border-border bg-card px-4 py-2 text-sm text-text focus-visible:focus-ring"
              />
            </div>

            {/* Horario preferido */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">
                Horario preferido
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
                />
                <span className="self-center text-text-muted">-</span>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus-visible:focus-ring"
                />
              </div>
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="excluir-almuerzo"
              checked={excluirAlmuerzo}
              onChange={(e) => setExcluirAlmuerzo(e.target.checked)}
              className="h-4 w-4 text-brand border-border rounded focus:ring-brand"
            />
            <label htmlFor="excluir-almuerzo" className="text-sm text-text">
              Excluir horario de almuerzo (13:00 - 15:00)
            </label>
          </div>

          {/* Botón buscar */}
          <Button
            onClick={buscarDisponibilidad}
            disabled={buscando}
            variant="primary"
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {buscando ? 'Buscando...' : 'Buscar Horarios Disponibles'}
          </Button>
        </div>
      </Card>

      {/* Resultados */}
      {slots.length > 0 && (
        <Card>
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-text">
              Horarios Disponibles ({slots.length})
            </h4>

            <div className="space-y-2">
              {slots.map((slot, index) => {
                const isSelected = slotSeleccionado?.inicio === slot.inicio;
                return (
                  <button
                    key={index}
                    onClick={() => handleSelectSlot(slot)}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? 'border-brand bg-brand-subtle'
                          : 'border-border bg-card hover:border-brand/50 hover:bg-cardHover'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-base font-semibold text-text">
                            {format(slot.inicio, 'HH:mm', { locale: es })} -{' '}
                            {format(slot.fin, 'HH:mm', { locale: es })}
                          </span>
                          <span className={`text-xs font-medium ${getScoreColor(slot.score)}`}>
                            ● {getScoreLabel(slot.score)} ({slot.score})
                          </span>
                        </div>
                        <div className="text-sm text-text-muted">
                          <User className="inline h-3 w-3 mr-1" />
                          {slot.profesionalNombre}
                        </div>
                        {slot.razon && (
                          <div className="text-xs text-text-muted mt-1">
                            {slot.razon}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-brand flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleConfirmar}
                disabled={!slotSeleccionado}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Usar este Horario
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
