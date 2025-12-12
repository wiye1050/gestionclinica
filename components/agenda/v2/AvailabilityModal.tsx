'use client';

import { X } from 'lucide-react';
import AvailabilityFinder from './AvailabilityFinder';

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

interface AvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  profesionales: Profesional[];
  onSelectSlot: (slot: SlotDisponible) => void;
  defaultProfesionalId?: string;
  defaultDuracion?: number;
}

/**
 * Modal wrapper para el componente AvailabilityFinder
 * Permite buscar horarios disponibles y seleccionar uno para crear/editar un evento
 */
export default function AvailabilityModal({
  isOpen,
  onClose,
  profesionales,
  onSelectSlot,
  defaultProfesionalId,
  defaultDuracion,
}: AvailabilityModalProps) {
  if (!isOpen) return null;

  const handleSelectSlot = (slot: SlotDisponible) => {
    onSelectSlot(slot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="panel-block shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sticky top-0 border-b border-border bg-card">
          <h2 className="text-xl font-semibold text-text">
            Buscar Disponibilidad
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors hover:bg-cardHover"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <AvailabilityFinder
            profesionales={profesionales}
            onSelectSlot={handleSelectSlot}
            onClose={onClose}
            defaultProfesionalId={defaultProfesionalId}
            defaultDuracion={defaultDuracion}
          />
        </div>
      </div>
    </div>
  );
}
