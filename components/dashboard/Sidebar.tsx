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
  FileBarChart
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Reporte Diario', href: '/dashboard/reporte-diario', icon: FileText },
    { name: 'KPIs', href: '/dashboard/kpis', icon: BarChart3 },
    { name: 'Tareas y Servicios', href: '/dashboard/tareas-servicios', icon: CheckSquare },
    { name: 'Supervisión', href: '/dashboard/supervision', icon: Users },
    { name: 'Inventario', href: '/dashboard/inventario', icon: Package },
    { name: 'Proyectos', href: '/dashboard/proyectos', icon: FolderKanban },
    { name: 'Informes', href: '/dashboard/informes', icon: FileBarChart },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      <nav className="space-y-2">
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
      </nav>
    </aside>
  );
}