'use client';

import { Paciente, Profesional } from '@/types';
import { useMemo } from 'react';
import KanbanBoard, { KanbanColumn } from '@/components/shared/KanbanBoard';
import { Phone, Mail, AlertCircle, User } from 'lucide-react';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface PacientesKanbanProps {
  pacientes: Paciente[];
  profesionales: Profesional[];
  pacientesSeguimiento: Set<string>;
}

const riesgoColors: Record<string, string> = {
  alto: 'border-l-4 border-red-500',
  medio: 'border-l-4 border-yellow-500',
  bajo: 'border-l-4 border-green-500'
};

export default function PacientesKanban({
  pacientes,
  profesionales,
  pacientesSeguimiento
}: PacientesKanbanProps) {
  const profesionalesMap = useMemo(
    () =>
      profesionales.reduce<Record<string, string>>((acc, profesional) => {
        acc[profesional.id] = `${profesional.nombre} ${profesional.apellidos}`;
        return acc;
      }, {}),
    [profesionales]
  );

  const columns: KanbanColumn<Paciente>[] = useMemo(() => {
    const activos = pacientes.filter(p => p.estado === 'activo');
    const inactivos = pacientes.filter(p => p.estado === 'inactivo');
    const egresados = pacientes.filter(p => p.estado === 'egresado');

    return [
      {
        id: 'activo',
        title: 'Activos',
        color: 'green',
        items: activos
      },
      {
        id: 'inactivo',
        title: 'Inactivos',
        color: 'gray',
        items: inactivos
      },
      {
        id: 'egresado',
        title: 'Egresados',
        color: 'blue',
        items: egresados
      }
    ];
  }, [pacientes]);

  const handleDragEnd = async (pacienteId: string, fromColumn: string, toColumn: string) => {
    try {
      const pacienteRef = doc(db, 'pacientes', pacienteId);
      await updateDoc(pacienteRef, {
        estado: toColumn,
        updatedAt: new Date()
      });
      
      toast.success(`Paciente movido a ${toColumn}`);
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error al cambiar el estado del paciente');
    }
  };

  const renderCard = (paciente: Paciente) => {
    const requiereSeguimiento = pacientesSeguimiento.has(paciente.id);
    const riesgoClass = riesgoColors[paciente.riesgo ?? ''] ?? '';

    return (
      <Link href={`/dashboard/pacientes/${paciente.id}`}>
        <div className={`surface-card p-4 hover:shadow-md transition cursor-pointer ${riesgoClass}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">
              {paciente.nombre} {paciente.apellidos}
            </h4>
            {requiereSeguimiento && (
              <span className="flex-shrink-0">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            {paciente.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{paciente.telefono}</span>
              </div>
            )}
            {paciente.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                <span className="truncate">{paciente.email}</span>
              </div>
            )}
            {paciente.profesionalReferenteId && (
              <div className="flex items-center gap-2">
                <User className="h-3 w-3" />
                <span className="truncate">
                  {profesionalesMap[paciente.profesionalReferenteId] || 'No asignado'}
                </span>
              </div>
            )}
          </div>

          {paciente.riesgo && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <span className={`inline-flex text-xs font-medium ${
                paciente.riesgo === 'alto' ? 'text-red-700' :
                paciente.riesgo === 'medio' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                Riesgo {paciente.riesgo}
              </span>
            </div>
          )}

          {requiereSeguimiento && (
            <div className="mt-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                <AlertCircle className="h-3 w-3" />
                Seguimiento
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  return (
    <KanbanBoard
      columns={columns}
      renderCard={renderCard}
      onDragEnd={handleDragEnd}
      keyExtractor={(p) => p.id}
      emptyMessage="No hay pacientes"
    />
  );
}
