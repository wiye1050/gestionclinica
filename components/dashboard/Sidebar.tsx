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
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [gestionOpen, setGestionOpen] = useState(true);

  const menuItems = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Reporte Diario', href: '/dashboard/reporte-diario', icon: FileText },
    { name: 'KPIs', href: '/dashboard/kpis', icon: BarChart3 },
  ];

  const gestionItems = [
    { name: 'Profesionales', href: '/dashboard/profesionales', icon: UserCheck },
    { name: 'Catálogo Servicios', href: '/dashboard/catalogo-servicios', icon: List },
    { name: 'Tratamientos', href: '/dashboard/tratamientos', icon: Layers },
    { name: 'Servicios Asignados', href: '/dashboard/servicios', icon: ClipboardList },
  ];

  const otrosItems = [
    { name: 'Supervisión', href: '/dashboard/supervision', icon: Users },
    { name: 'Inventario', href: '/dashboard/inventario', icon: Package },
    { name: 'Proyectos', href: '/dashboard/proyectos', icon: FolderKanban },
    { name: 'Informes', href: '/dashboard/informes', icon: FileBarChart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-2">
        {/* Items principales */}
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Sección Gestión de Servicios */}
        <div className="pt-2">
          <button
            onClick={() => setGestionOpen(!gestionOpen)}
            className="flex items-center justify-between w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-5 h-5" />
              <span className="font-medium">Gestión de Servicios</span>
            </div>
            {gestionOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          {gestionOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {gestionItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-sm ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
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

        {/* Otros items */}
        <div className="pt-2 border-t border-gray-200 mt-2">
          {otrosItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}