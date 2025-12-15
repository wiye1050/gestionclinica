'use client';

import { ReactNode } from 'react';
import type { Profesional } from '@/types';
import type { ProfesionalTab } from './types';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  BarChart3,
  User,
  Mail,
  Phone,
  Activity,
} from 'lucide-react';

interface Tab {
  key: ProfesionalTab;
  label: string;
  icon: ReactNode;
  count?: number;
}

interface ProfesionalProfileLayoutProps {
  profesional: Profesional;
  activeTab: ProfesionalTab;
  onTabChange: (tab: ProfesionalTab) => void;
  children: ReactNode;
  tabs?: Tab[];
}

export default function ProfesionalProfileLayout({
  profesional,
  activeTab,
  onTabChange,
  children,
  tabs,
}: ProfesionalProfileLayoutProps) {
  const defaultTabs: Tab[] = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
    { key: 'disponibilidad', label: 'Disponibilidad', icon: <Clock className="w-4 h-4" /> },
    { key: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const tabsToShow = tabs || defaultTabs;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
        {/* Header del profesional */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: profesional.color || '#0087cd' }}
              >
                {profesional.nombre?.charAt(0).toUpperCase()}
                {profesional.apellidos?.charAt(0).toUpperCase()}
              </div>

              {/* Info básica */}
              <div>
                <h1 className="text-2xl font-bold text-text">
                  {profesional.nombre} {profesional.apellidos}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-muted">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-subtle px-3 py-1 text-brand font-semibold capitalize">
                    <Activity className="w-3 h-3" />
                    {profesional.especialidad}
                  </span>
                  {profesional.email && (
                    <a
                      href={`mailto:${profesional.email}`}
                      className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      {profesional.email}
                    </a>
                  )}
                  {profesional.telefono && (
                    <a
                      href={`tel:${profesional.telefono}`}
                      className="inline-flex items-center gap-1 hover:text-brand transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      {profesional.telefono}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Estado */}
            <div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  profesional.activo
                    ? 'bg-success-bg text-success'
                    : 'bg-muted text-text-muted'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    profesional.activo ? 'bg-success' : 'bg-text-muted'
                  }`}
                />
                {profesional.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="bg-card rounded-2xl shadow-sm border border-border">
          <div className="flex overflow-x-auto">
            {tabsToShow.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-brand text-brand'
                      : 'border-transparent text-text-muted hover:text-text hover:border-border'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        isActive ? 'bg-brand-subtle text-brand' : 'bg-muted text-text-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido del tab activo */}
        <div>{children}</div>
      </div>
    </div>
  );
}
