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
    <aside className="sidebar-panel flex h-full w-full flex-col gap-4 px-4 py-6">
      <nav className="space-y-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-[0_16px_35px_rgba(15,23,42,0.25)]'
                  : 'text-slate-600 hover:bg-slate-50'
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
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                    className={`flex items-center space-x-3 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-900/90 text-white shadow-[0_12px_30px_rgba(15,23,42,0.2)]'
                        : 'text-slate-500 hover:bg-slate-50'
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
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
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
                    className={`flex items-center space-x-3 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                      isActive
                        ? 'bg-slate-900/90 text-white shadow-[0_12px_30px_rgba(15,23,42,0.2)]'
                        : 'text-slate-500 hover:bg-slate-50'
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
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard/auditoria"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              pathname === '/dashboard/auditoria'
                ? 'bg-slate-900 text-white shadow-[0_16px_35px_rgba(15,23,42,0.25)]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Auditoría</span>
          </Link>
          <Link
            href="/dashboard/inventario"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              pathname === '/dashboard/inventario'
                ? 'bg-slate-900 text-white shadow-[0_16px_35px_rgba(15,23,42,0.25)]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Inventario</span>
          </Link>
          <Link
            href="/dashboard/protocolos"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              pathname.startsWith('/dashboard/protocolos')
                ? 'bg-slate-900 text-white shadow-[0_16px_35px_rgba(15,23,42,0.25)]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>Protocolos</span>
          </Link>
          <Link
            href="/dashboard/proyectos"
            className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
              pathname === '/dashboard/proyectos'
                ? 'bg-slate-900 text-white shadow-[0_16px_35px_rgba(15,23,42,0.25)]'
                : 'text-slate-600 hover:bg-slate-50'
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
