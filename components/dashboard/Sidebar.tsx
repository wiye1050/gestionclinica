'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  BarChart3,
  CheckSquare,
  Users,
  Package,
  FolderKanban,
  FileBarChart,
  UserCheck,
  List,
  Layers,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  UserCircle,
  Lightbulb,
  BookOpen,
  ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [gestionOpen, setGestionOpen] = useState(true);
  const [coordinacionOpen, setCoordinacionOpen] = useState(true);

  const menuItems = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Agenda', href: '/dashboard/agenda', icon: CalendarDays },
    { name: 'Pacientes', href: '/dashboard/pacientes', icon: UserCircle },
  ];

  const coordinacionItems = [
    { name: 'Reporte Diario', href: '/dashboard/reporte-diario', icon: FileText },
    { name: 'KPIs', href: '/dashboard/kpis', icon: BarChart3 },
    { name: 'Mejoras', href: '/dashboard/mejoras', icon: Lightbulb },
    { name: 'Supervisión', href: '/dashboard/supervision', icon: Users },
    { name: 'Informes', href: '/dashboard/informes', icon: FileBarChart },
  ];

  const gestionItems = [
    { name: 'Profesionales', href: '/dashboard/profesionales', icon: UserCheck },
    { name: 'Catálogo Servicios', href: '/dashboard/catalogo-servicios', icon: List },
    { name: 'Tratamientos', href: '/dashboard/tratamientos', icon: Layers },
    { name: 'Servicios Asignados', href: '/dashboard/servicios', icon: ClipboardList },
  ];

  return (
    <aside className="hidden w-64 border-r border-border bg-card p-4 lg:block">
      <nav className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                isActive ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-muted hover:bg-cardHover'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Coordinación */}
        <div className="pt-2">
          <button
            onClick={() => setCoordinacionOpen(!coordinacionOpen)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-cardHover"
          >
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">Coordinación</span>
            </div>
            {coordinacionOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {coordinacionOpen && (
            <div className="ml-3 mt-2 space-y-1">
              {coordinacionItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-2xl px-3 py-2 text-xs transition-colors ${
                      isActive ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-muted hover:bg-cardHover'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Sección Gestión de Servicios */}
        <div className="pt-2">
          <button
            onClick={() => setGestionOpen(!gestionOpen)}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-text transition-colors hover:bg-cardHover"
          >
            <div className="flex items-center space-x-3">
              <ClipboardList className="w-5 h-5" />
              <span className="font-medium">Gestión</span>
            </div>
            {gestionOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {gestionOpen && (
            <div className="ml-3 mt-2 space-y-1">
              {gestionItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 rounded-2xl px-3 py-2 text-xs transition-colors ${
                      isActive ? 'bg-brand-subtle text-brand font-semibold' : 'text-text-muted hover:bg-cardHover'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Items directos */}
        <div className="mt-4 space-y-1 border-t border-border pt-4">
          <Link
            href="/dashboard/auditoria"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
              pathname === '/dashboard/auditoria'
                ? 'bg-brand-subtle text-brand font-semibold'
                : 'text-text-muted hover:bg-cardHover'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Auditoría</span>
          </Link>
          <Link
            href="/dashboard/inventario"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
              pathname === '/dashboard/inventario'
                ? 'bg-brand-subtle text-brand font-semibold'
                : 'text-text-muted hover:bg-cardHover'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Inventario</span>
          </Link>
          <Link
            href="/dashboard/protocolos"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
              pathname.startsWith('/dashboard/protocolos')
                ? 'bg-brand-subtle text-brand font-semibold'
                : 'text-text-muted hover:bg-cardHover'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Protocolos</span>
          </Link>
          <Link
            href="/dashboard/proyectos"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
              pathname === '/dashboard/proyectos'
                ? 'bg-brand-subtle text-brand font-semibold'
                : 'text-text-muted hover:bg-cardHover'
            }`}
          >
            <FolderKanban className="w-5 h-5" />
            <span>Proyectos</span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
