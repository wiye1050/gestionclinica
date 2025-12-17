'use client';

import { useState } from 'react';
import type { SerializedCatalogoServicio } from '@/lib/utils/servicios';
import type { CatalogoServicio } from '@/types';
import type { CatalogoServicioEstadisticas } from '@/lib/server/serviciosStats';
import type { ServicioTab } from '@/components/servicios/v2/types';

import ServicioProfileLayout from '@/components/servicios/v2/ServicioProfileLayout';
import ServicioResumenTab from '@/components/servicios/v2/ServicioResumenTab';
import ServicioProfesionalesTab from '@/components/servicios/v2/ServicioProfesionalesTab';
import ServicioCitasTab from '@/components/servicios/v2/ServicioCitasTab';
import ServicioEstadisticasTab from '@/components/servicios/v2/ServicioEstadisticasTab';
import { TabErrorBoundary } from '@/components/pacientes/TabErrorBoundary';

interface ServicioDetailClientProps {
  servicioData: SerializedCatalogoServicio;
  estadisticas: CatalogoServicioEstadisticas | null;
}

export default function ServicioDetailClient({
  servicioData,
  estadisticas,
}: ServicioDetailClientProps) {
  const [activeTab, setActiveTab] = useState<ServicioTab>('resumen');

  // Deserialize servicio (dates from strings back to Date objects)
  const servicio: CatalogoServicio = {
    ...servicioData,
    createdAt: servicioData.createdAt ? new Date(servicioData.createdAt) : undefined,
    updatedAt: servicioData.updatedAt ? new Date(servicioData.updatedAt) : undefined,
  };

  return (
    <ServicioProfileLayout servicio={servicio} activeTab={activeTab} onTabChange={setActiveTab}>
      <TabErrorBoundary tabName={activeTab}>
        {activeTab === 'resumen' && (
          <ServicioResumenTab servicio={servicio} estadisticas={estadisticas} />
        )}
        {activeTab === 'profesionales' && (
          <ServicioProfesionalesTab servicio={servicio} estadisticas={estadisticas} />
        )}
        {activeTab === 'citas' && <ServicioCitasTab servicio={servicio} estadisticas={estadisticas} />}
        {activeTab === 'estadisticas' && (
          <ServicioEstadisticasTab servicio={servicio} estadisticas={estadisticas} />
        )}
      </TabErrorBoundary>
    </ServicioProfileLayout>
  );
}
