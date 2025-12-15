'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, CheckSquare, Target, Users, BarChart3 } from 'lucide-react';
import type { ProyectoTab } from './types';
import type { Proyecto } from '@/types/proyectos';

interface Tab {
  key: ProyectoTab;
  label: string;
  icon: ReactNode;
}

interface ProyectoProfileLayoutProps {
  proyecto: Proyecto;
  activeTab: ProyectoTab;
  onTabChange: (tab: ProyectoTab) => void;
  children: ReactNode;
  tabs?: Tab[];
}

// Mapeo de estados a colores
const getEstadoColor = (estado: Proyecto['estado']) => {
  switch (estado) {
    case 'propuesta':
      return 'bg-purple-bg text-purple border-purple';
    case 'planificacion':
      return 'bg-brand-subtle text-brand border-brand';
    case 'en-curso':
      return 'bg-success-bg text-success border-success';
    case 'pausado':
      return 'bg-warn-bg text-warn border-warn';
    case 'completado':
      return 'bg-green-bg text-green border-green';
    case 'cancelado':
      return 'bg-danger-bg text-danger border-danger';
  }
};

// Mapeo de prioridades a colores
const getPrioridadColor = (prioridad: Proyecto['prioridad']) => {
  switch (prioridad) {
    case 'critica':
      return 'bg-danger text-white';
    case 'alta':
      return 'bg-warn text-white';
    case 'media':
      return 'bg-brand text-white';
    case 'baja':
      return 'bg-muted text-text';
  }
};

export default function ProyectoProfileLayout({
  proyecto,
  activeTab,
  onTabChange,
  children,
  tabs,
}: ProyectoProfileLayoutProps) {
  const defaultTabs: Tab[] = [
    { key: 'resumen', label: 'Resumen', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'tareas', label: 'Tareas', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'hitos', label: 'Hitos', icon: <Target className="w-4 h-4" /> },
    { key: 'equipo', label: 'Equipo', icon: <Users className="w-4 h-4" /> },
    { key: 'estadisticas', label: 'Estadísticas', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  const tabsToShow = tabs || defaultTabs;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
        {/* Back button */}
        <Link
          href="/dashboard/proyectos"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-brand transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
        </Link>

        {/* Project info */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            {/* Title and type */}
            <div className="flex items-start gap-3 mb-3">
              {/* Color indicator */}
              {proyecto.color && (
                <div
                  className="w-6 h-6 rounded-lg border-2 border-white shadow-sm flex-shrink-0 mt-1"
                  style={{ backgroundColor: proyecto.color }}
                  title={`Color: ${proyecto.color}`}
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text mb-2">{proyecto.nombre}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Estado */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoColor(proyecto.estado)}`}>
                    {proyecto.estado.replace('-', ' ').toUpperCase()}
                  </span>
                  {/* Prioridad */}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadColor(proyecto.prioridad)}`}>
                    {proyecto.prioridad.toUpperCase()}
                  </span>
                  {/* Tipo */}
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-text">
                    {proyecto.tipo.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {proyecto.descripcion && (
              <p className="text-text-muted text-sm line-clamp-2">{proyecto.descripcion}</p>
            )}
          </div>

          {/* Quick info */}
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="text-sm">
              <span className="text-text-muted">Responsable:</span>
              <p className="font-medium text-text">{proyecto.responsableNombre}</p>
            </div>
            {proyecto.fechaFinEstimada && (
              <div className="text-sm">
                <span className="text-text-muted">Fecha estimada:</span>
                <p className="font-medium text-text">
                  {new Date(proyecto.fechaFinEstimada).toLocaleDateString('es-ES')}
                </p>
              </div>
            )}
            <div className="text-sm">
              <span className="text-text-muted">Progreso:</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${proyecto.progreso}%` }}
                  />
                </div>
                <span className="font-semibold text-brand text-sm">{proyecto.progreso}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-t border-border pt-4 overflow-x-auto">
          {tabsToShow.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-pill text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-brand text-white'
                  : 'bg-muted text-text hover:bg-muted/80'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>{children}</div>
    </div>
  );
}
