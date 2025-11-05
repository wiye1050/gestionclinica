// components/pacientes/v2/PatientProfileLayout.tsx
// Layout principal con navegación de tabs

import { Paciente } from '@/types';
import { Actividad } from '@/types/paciente-v2';
import PatientHeader from './PatientHeader';
import PatientTimeline from './PatientTimeline';
import {
  LayoutGrid,
  FileText,
  Calendar,
  Folder,
  CreditCard,
  MessageSquare,
  Plus,
  Upload,
  StickyNote,
} from 'lucide-react';

export type PatientTab =
  | 'resumen'
  | 'historial-clinico'
  | 'citas'
  | 'documentos'
  | 'facturacion'
  | 'notas';

interface PatientProfileLayoutProps {
  paciente: Paciente;
  actividades: Actividad[];
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  onNewCita: () => void;
  onNewNota: () => void;
  onUploadDoc: () => void;
  children: React.ReactNode;
}

export default function PatientProfileLayout({
  paciente,
  actividades,
  activeTab,
  onTabChange,
  onNewCita,
  onNewNota,
  onUploadDoc,
  children,
}: PatientProfileLayoutProps) {
  const tabs: { id: PatientTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'historial-clinico', label: 'Historial Clínico', icon: <FileText className="w-4 h-4" /> },
    { id: 'citas', label: 'Citas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'documentos', label: 'Documentos', icon: <Folder className="w-4 h-4" /> },
    { id: 'facturacion', label: 'Facturación', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'notas', label: 'Notas', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header con información del paciente */}
      <PatientHeader paciente={paciente} profesionalReferente={null} />

      {/* Layout de 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal (2/3) */}
        <div className="lg:col-span-2">
          {/* Tabs de navegación */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Acciones rápidas */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={onNewCita}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva Cita
              </button>
              <button
                onClick={onNewNota}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <StickyNote className="w-4 h-4" />
                Nueva Nota
              </button>
              <button
                onClick={onUploadDoc}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Subir Documento
              </button>
            </div>
          </div>

          {/* Contenido del tab activo */}
          <div>{children}</div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          <PatientTimeline actividades={actividades} maxItems={8} />
        </div>
      </div>
    </div>
  );
}
