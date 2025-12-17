'use client';

import { ReactNode } from 'react';
import { ArrowLeft, Activity, Users, Calendar, BarChart3, Clock, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import type { CatalogoServicio } from '@/types';
import type { ServicioTab } from './types';

interface Tab {
  id: ServicioTab;
  label: string;
  icon: React.ElementType;
}

interface ServicioProfileLayoutProps {
  servicio: CatalogoServicio;
  activeTab: ServicioTab;
  onTabChange: (tab: ServicioTab) => void;
  children: ReactNode;
  tabs?: Tab[];
}

const DEFAULT_TABS: Tab[] = [
  { id: 'resumen', label: 'Resumen', icon: Activity },
  { id: 'profesionales', label: 'Profesionales', icon: Users },
  { id: 'citas', label: 'Citas', icon: Calendar },
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
];

const getCategoriaColor = (categoria: CatalogoServicio['categoria']) => {
  switch (categoria) {
    case 'medicina':
      return 'bg-blue-bg text-blue border-blue';
    case 'fisioterapia':
      return 'bg-success-bg text-success border-success';
    case 'enfermeria':
      return 'bg-purple-bg text-purple border-purple';
    default:
      return 'bg-text-subtle-bg text-text-subtle border-text-subtle';
  }
};

const getCategoriaIcon = (categoria: CatalogoServicio['categoria']) => {
  switch (categoria) {
    case 'medicina':
      return Stethoscope;
    case 'fisioterapia':
      return Activity;
    case 'enfermeria':
      return Users;
    default:
      return Activity;
  }
};

export default function ServicioProfileLayout({
  servicio,
  activeTab,
  onTabChange,
  children,
  tabs = DEFAULT_TABS,
}: ServicioProfileLayoutProps) {
  const CategoriaIcon = getCategoriaIcon(servicio.categoria);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/dashboard/servicios"
        className="inline-flex items-center gap-2 text-text-subtle hover:text-text transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a servicios
      </Link>

      {/* Header */}
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Color indicator */}
          <div
            className="w-2 h-16 rounded-full flex-shrink-0"
            style={{ backgroundColor: servicio.color }}
          />

          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-text mb-2">{servicio.nombre}</h1>
                {servicio.descripcion && (
                  <p className="text-text-subtle mb-3">{servicio.descripcion}</p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  {/* Categoría badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-sm font-medium border ${getCategoriaColor(servicio.categoria)}`}
                  >
                    <CategoriaIcon className="h-4 w-4" />
                    {servicio.categoria.charAt(0).toUpperCase() + servicio.categoria.slice(1)}
                  </span>

                  {/* Tiempo estimado */}
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-subtle">
                    <Clock className="h-4 w-4" />
                    {servicio.tiempoEstimado} min
                  </span>

                  {/* Estado */}
                  {servicio.activo ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-sm font-medium bg-success-bg text-success border border-success">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-sm font-medium bg-text-subtle-bg text-text-subtle border border-text-subtle">
                      Inactivo
                    </span>
                  )}
                </div>

                {/* Características adicionales */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-text-subtle">
                  {servicio.requiereSala && (
                    <span>
                      📍 Requiere sala
                      {servicio.salaPredeterminada && ` (${servicio.salaPredeterminada})`}
                    </span>
                  )}
                  {servicio.requiereSupervision && <span>👁️ Requiere supervisión</span>}
                  {servicio.requiereApoyo && <span>🤝 Requiere apoyo</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card rounded-t-2xl">
        <div className="flex gap-1 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2
                  ${
                    isActive
                      ? 'border-brand text-brand'
                      : 'border-transparent text-text-subtle hover:text-text hover:border-text-subtle'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
