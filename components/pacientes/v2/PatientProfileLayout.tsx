'use client';

import { useState, ReactNode } from 'react';
import { Paciente } from '@/types';
import PatientHeader from './PatientHeader';
import PatientTimeline, { Activity } from './PatientTimeline';
import {
  LayoutDashboard,
  Heart,
  Calendar,
  FileText,
  DollarSign,
  MessageSquare,
  Activity as ActivityIcon
} from 'lucide-react';

export type PatientTab = 
  | 'resumen' 
  | 'historial-clinico' 
  | 'citas' 
  | 'tratamientos'
  | 'documentos'
  | 'facturacion'
  | 'notas';

interface Tab {
  key: PatientTab;
  label: string;
  icon: ReactNode;
  count?: number;
}

interface PatientProfileLayoutProps {
  paciente: Paciente;
  actividades: Activity[];
  activeTab: PatientTab;
  onTabChange: (tab: PatientTab) => void;
  children: ReactNode;
  tabs?: Tab[];
  onNewCita?: () => void;
  onNewNota?: () => void;
  onUploadDoc?: () => void;
}

export default function PatientProfileLayout({
  paciente,
  actividades,
  activeTab,
  onTabChange,
  children,
  tabs,
  onNewCita,
  onNewNota,
  onUploadDoc
}: PatientProfileLayoutProps) {
  const defaultTabs: Tab[] = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'historial-clinico', label: 'Historial Clínico', icon: <Heart className="w-4 h-4" /> },
    { key: 'citas', label: 'Citas', icon: <Calendar className="w-4 h-4" /> },
    { key: 'tratamientos', label: 'Tratamientos', icon: <ActivityIcon className="w-4 h-4" /> },
    { key: 'documentos', label: 'Documentos', icon: <FileText className="w-4 h-4" /> },
    { key: 'facturacion', label: 'Facturación', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'notas', label: 'Notas', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  const tabsToShow = tabs || defaultTabs;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <PatientHeader
          paciente={paciente}
          onNewCita={onNewCita}
          onNewNota={onNewNota}
          onUploadDoc={onUploadDoc}
        />

        {/* Tabs de navegación */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex overflow-x-auto">
            {tabsToShow.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout principal: Contenido + Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contenido principal (8 columnas en desktop) */}
          <div className="lg:col-span-8">
            {children}
          </div>

          {/* Timeline lateral (4 columnas en desktop) */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <PatientTimeline actividades={actividades} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
