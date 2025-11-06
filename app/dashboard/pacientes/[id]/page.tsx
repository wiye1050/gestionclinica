'use client';

// app/dashboard/pacientes/[id]/page.tsx
// Página principal de detalle de paciente - Sistema V2

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { usePacienteV2 } from '@/hooks/firestore/usePacienteV2';
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import PatientHistorialClinicoTab from '@/components/pacientes/v2/PatientHistorialClinicoTab';
import PatientCitasTab from '@/components/pacientes/v2/PatientCitasTab';
import PatientDocumentosTab from '@/components/pacientes/v2/PatientDocumentosTab';
import PatientFacturacionTab from '@/components/pacientes/v2/PatientFacturacionTab';
import PatientNotasTab from '@/components/pacientes/v2/PatientNotasTab';
import { Loader2 } from 'lucide-react';

export default function PacientePage() {
  const params = useParams();
  const pacienteId = params?.id as string;

  const [activeTab, setActiveTab] = useState<PatientTab>('resumen');

  // Hook principal que obtiene todos los datos
  const {
    paciente,
    profesionalReferente,
    citas,
    tratamientos,
    documentos,
    notas,
    actividades,
    loading,
    error,
  } = usePacienteV2(pacienteId);

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const citasRealizadas = citas.filter((c) => c.estado === 'realizada');
    const ultimaVisita = citasRealizadas.sort((a, b) => b.fecha.getTime() - a.fecha.getTime())[0]?.fecha;

    return {
      totalCitas: citas.length,
      ultimaVisita,
      tratamientosCompletados: tratamientos.filter((t) => t.estado === 'completado').length,
      facturasPendientes: 0, // TODO: Implementar cuando exista módulo de facturación
    };
  }, [citas, tratamientos]);

  // Preparar datos para los tabs
  const proximasCitas = useMemo(() => {
    const ahora = new Date();
    return citas
      .filter((c) => c.fecha > ahora && (c.estado === 'programada' || c.estado === 'confirmada'))
      .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
      .slice(0, 3);
  }, [citas]);

  const tratamientosActivos = useMemo(() => {
    return tratamientos.filter((t) => t.estado === 'activo');
  }, [tratamientos]);

  // Handlers de acciones
  const handleNewCita = () => {
    // TODO: Abrir modal/formulario de nueva cita
    console.log('Crear nueva cita');
    alert('Funcionalidad de nueva cita en desarrollo');
  };

  const handleNewNota = () => {
    // TODO: Abrir modal/formulario de nueva nota
    console.log('Crear nueva nota');
    alert('Funcionalidad de nueva nota en desarrollo');
  };

  const handleUploadDoc = () => {
    // TODO: Abrir modal/formulario de subida de documento
    console.log('Subir documento');
    alert('Funcionalidad de subir documento en desarrollo');
  };

  const handleVerDetalleCita = (citaId: string) => {
    console.log('Ver detalle de cita:', citaId);
    alert(`Ver detalle de cita ${citaId} - En desarrollo`);
  };

  const handleEditarNota = (notaId: string) => {
    console.log('Editar nota:', notaId);
    alert(`Editar nota ${notaId} - En desarrollo`);
  };

  const handleViewDoc = (documentoId: string) => {
    console.log('Ver documento:', documentoId);
  };

  const handleDownloadDoc = (documentoId: string) => {
    console.log('Descargar documento:', documentoId);
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del paciente...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-900 font-semibold mb-2">Error al cargar paciente</h2>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-yellow-900 font-semibold mb-2">Paciente no encontrado</h2>
          <p className="text-yellow-700 text-sm">
            No se encontró ningún paciente con el ID proporcionado.
          </p>
        </div>
      </div>
    );
  }

  // Datos mock para historial clínico (temporal)
  const alergiasMock = paciente.alergias.map((alergia) => ({
    nombre: alergia,
    severidad: 'moderada' as const,
    fechaDiagnostico: new Date(),
  }));

  return (
    <PatientProfileLayout
      paciente={paciente}
      actividades={actividades}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onNewCita={handleNewCita}
      onNewNota={handleNewNota}
      onUploadDoc={handleUploadDoc}
    >
      {/* Renderizar tab activo */}
      {activeTab === 'resumen' && (
        <PatientResumenTab
          paciente={paciente}
          profesionalReferente={profesionalReferente}
          proximasCitas={proximasCitas}
          tratamientosActivos={tratamientosActivos}
          estadisticas={estadisticas}
        />
      )}

      {activeTab === 'historial-clinico' && (
        <PatientHistorialClinicoTab
          alergias={alergiasMock}
          medicamentos={[]} // TODO: Implementar cuando existan
          antecedentes={[]} // TODO: Implementar cuando existan
          vacunas={[]} // TODO: Implementar cuando existan
        />
      )}

      {activeTab === 'citas' && (
        <PatientCitasTab
          citas={citas}
          onVerDetalle={handleVerDetalleCita}
          onNuevaCita={handleNewCita}
        />
      )}

      {activeTab === 'documentos' && (
        <PatientDocumentosTab
          documentos={documentos}
          onUpload={handleUploadDoc}
          onDownload={handleDownloadDoc}
          onView={handleViewDoc}
        />
      )}

      {activeTab === 'facturacion' && (
        <PatientFacturacionTab
          facturas={[]} // TODO: Implementar cuando exista módulo de facturación
          presupuestos={[]} // TODO: Implementar cuando exista módulo de facturación
        />
      )}

      {activeTab === 'notas' && (
        <PatientNotasTab notas={notas} onNuevaNota={handleNewNota} onEditarNota={handleEditarNota} />
      )}
    </PatientProfileLayout>
  );
}
