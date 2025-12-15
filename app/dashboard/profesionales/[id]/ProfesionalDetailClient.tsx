'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfesionalProfileLayout from '@/components/profesionales/v2/ProfesionalProfileLayout';
import ProfesionalResumenTab from '@/components/profesionales/v2/ProfesionalResumenTab';
import ProfesionalEstadisticasTab from '@/components/profesionales/v2/ProfesionalEstadisticasTab';
import ProfesionalAgendaTab, {
  type CitaProfesional,
} from '@/components/profesionales/v2/ProfesionalAgendaTab';
import type { ProfesionalTab } from '@/components/profesionales/v2/types';
import type { Profesional } from '@/types';
import type { ProfesionalEstadisticas } from '@/lib/server/profesionalesStats';
import { TabErrorBoundary } from '@/components/pacientes/TabErrorBoundary';
import { Clock } from 'lucide-react';

interface ProfesionalDetailClientProps {
  profesional: Profesional;
  estadisticas?: ProfesionalEstadisticas | null;
}

export default function ProfesionalDetailClient({
  profesional,
  estadisticas,
}: ProfesionalDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfesionalTab>('resumen');

  // Mock citas - en producción esto vendría de una API
  // TODO: Implementar endpoint para obtener citas del profesional
  const citas: CitaProfesional[] = [];

  const handleVerDetalleCita = (cita: CitaProfesional) => {
    // Navegar a la cita en la agenda
    router.push(`/dashboard/agenda?evento=${cita.id}`);
  };

  return (
    <ProfesionalProfileLayout
      profesional={profesional}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabErrorBoundary tabName={activeTab}>
        {/* Resumen */}
        {activeTab === 'resumen' && (
          <ProfesionalResumenTab profesional={profesional} estadisticas={estadisticas} />
        )}

        {/* Agenda */}
        {activeTab === 'agenda' && (
          <ProfesionalAgendaTab
            profesional={profesional}
            citas={citas}
            onVerDetalle={handleVerDetalleCita}
          />
        )}

        {/* Disponibilidad */}
        {activeTab === 'disponibilidad' && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="h-12 w-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-muted mb-2">Gestión de disponibilidad</p>
              <p className="text-sm text-text-muted">
                Esta funcionalidad se implementará en una próxima versión
              </p>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {activeTab === 'estadisticas' && (
          <ProfesionalEstadisticasTab profesional={profesional} estadisticas={estadisticas} />
        )}
      </TabErrorBoundary>
    </ProfesionalProfileLayout>
  );
}
