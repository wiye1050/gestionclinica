'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { FormularioPlantilla, RespuestaFormulario, Paciente } from '@/types';
import FormularioRenderer from '@/components/formularios/FormularioRenderer';
import { Button } from '@/components/ui';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface CompletarFormularioClientProps {
  plantilla: FormularioPlantilla;
  respuesta: RespuestaFormulario;
  paciente: Paciente;
  userId: string;
}

export default function CompletarFormularioClient({
  plantilla,
  respuesta,
  paciente,
  userId,
}: CompletarFormularioClientProps) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async (
    respuestas: Record<string, string | number | boolean | string[] | null>,
    estado: 'borrador' | 'completado'
  ) => {
    setGuardando(true);
    try {
      const tiempoCompletado = estado === 'completado'
        ? Math.round((Date.now() - new Date(respuesta.createdAt).getTime()) / 1000 / 60)
        : undefined;

      const response = await fetch(`/api/formularios/respuestas/${respuesta.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respuestas,
          estado,
          tiempoCompletado,
          completadoEn: estado === 'completado' ? new Date().toISOString() : undefined,
          modificadoPor: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al guardar formulario');
      }

      if (estado === 'completado') {
        toast.success('Formulario completado correctamente');
        router.push(`/dashboard/pacientes/${paciente.id}?tab=formularios`);
      } else {
        toast.success('Borrador guardado correctamente');
      }
    } catch (error) {
      logger.error('Error guardando formulario:', error);
      throw error;
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    if (confirm('�Deseas cancelar? Los cambios no guardados se perder�n.')) {
      router.push(`/dashboard/pacientes/${paciente.id}?tab=formularios`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/pacientes/${paciente.id}?tab=formularios`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Completar Formulario</h1>
          <p className="text-sm text-gray-500">
            {plantilla.nombre} - {paciente.nombre} {paciente.apellidos}
          </p>
        </div>
      </div>

      {/* Formulario */}
      <FormularioRenderer
        plantilla={plantilla}
        pacienteId={paciente.id}
        pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
        pacienteNHC={paciente.numeroHistoria}
        eventoAgendaId={respuesta.eventoAgendaId}
        servicioId={respuesta.servicioId}
        episodioId={respuesta.episodioId}
        userId={userId}
        respuestaInicial={respuesta.respuestas}
        onGuardar={handleGuardar}
        onCancel={handleCancelar}
      />
    </div>
  );
}
