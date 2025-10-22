'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Bell } from 'lucide-react';

export default function TopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-blue-600">Gestión Clínica</h1>
        </div>

        <div className="hidden md:flex items-center space-x-1">
          <Link href="/dashboard" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Inicio
          </Link>
          <Link href="/dashboard/reporte-diario" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Reporte Diario
          </Link>
          <Link href="/dashboard/kpis" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            KPIs
          </Link>
          <Link href="/dashboard/tareas-servicios" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Tareas
          </Link>
          <Link href="/dashboard/supervision" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Supervisión
          </Link>
          <Link href="/dashboard/inventario" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Inventario
          </Link>
          <Link href="/dashboard/proyectos" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Proyectos
          </Link>
          <Link href="/dashboard/informes" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Informes
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}