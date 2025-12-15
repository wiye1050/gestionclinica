'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProyectoProfileLayout from '@/components/proyectos/v2/ProyectoProfileLayout';
import ProyectoResumenTab from '@/components/proyectos/v2/ProyectoResumenTab';
import ProyectoTareasTab from '@/components/proyectos/v2/ProyectoTareasTab';
import ProyectoHitosTab from '@/components/proyectos/v2/ProyectoHitosTab';
import ProyectoEquipoTab from '@/components/proyectos/v2/ProyectoEquipoTab';
import ProyectoEstadisticasTab from '@/components/proyectos/v2/ProyectoEstadisticasTab';
import type { ProyectoTab } from '@/components/proyectos/v2/types';
import type { Proyecto } from '@/types/proyectos';
import type { ProyectoEstadisticas } from '@/lib/server/proyectosStats';
import { TabErrorBoundary } from '@/components/pacientes/TabErrorBoundary';
import { deserializeProyectos } from '@/lib/server/proyectos';
import type { SerializedProyecto } from '@/lib/server/proyectos';

interface ProyectoDetailClientProps {
  proyectoData: SerializedProyecto;
  estadisticas?: ProyectoEstadisticas | null;
}

export default function ProyectoDetailClient({
  proyectoData,
  estadisticas,
}: ProyectoDetailClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProyectoTab>('resumen');

  // Deserialize proyecto
  const proyecto: Proyecto = deserializeProyectos([proyectoData])[0];

  const handleNuevaTarea = () => {
    // TODO: Implementar modal de nueva tarea
    console.log('Nueva tarea');
  };

  return (
    <ProyectoProfileLayout
      proyecto={proyecto}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <TabErrorBoundary tabName={activeTab}>
        {/* Resumen */}
        {activeTab === 'resumen' && (
          <ProyectoResumenTab proyecto={proyecto} estadisticas={estadisticas} />
        )}

        {/* Tareas */}
        {activeTab === 'tareas' && (
          <ProyectoTareasTab
            proyecto={proyecto}
            onNuevaTarea={handleNuevaTarea}
          />
        )}

        {/* Hitos */}
        {activeTab === 'hitos' && <ProyectoHitosTab proyecto={proyecto} />}

        {/* Equipo */}
        {activeTab === 'equipo' && <ProyectoEquipoTab proyecto={proyecto} />}

        {/* Estadísticas */}
        {activeTab === 'estadisticas' && (
          <ProyectoEstadisticasTab proyecto={proyecto} estadisticas={estadisticas} />
        )}
      </TabErrorBoundary>
    </ProyectoProfileLayout>
  );
}
