'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { LogOut, Search } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown';
import { QueryProvider } from '@/lib/providers/QueryProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOpen, open, close } = useGlobalSearch();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut(auth);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <QueryProvider>
      <div className="min-h-screen bg-gray-50">
      {/* Header Superior */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-8 py-4 flex items-center justify-between">
          {/* Logo e Identidad */}
          <div>
            <h1 className="text-2xl font-bold text-blue-700">INSTITUTO ORDÓÑEZ</h1>
            <p className="text-sm text-gray-600">Medicina Regenerativa y Traumatología</p>
          </div>

          {/* Usuario y Acciones */}
          <div className="flex items-center space-x-6">
            {/* Botón de Búsqueda */}
            <button
              onClick={open}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
              <span className="text-sm hidden md:inline">Buscar</span>
              <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs font-sans text-gray-400">
                ⌘K
              </kbd>
            </button>

            {/* Notificaciones */}
            <NotificacionesDropdown userUid={user.uid} />

            {/* Usuario */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.displayName || user.email}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {(user.displayName || user.email || 'U')[0].toUpperCase()}
              </div>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Búsqueda Global */}
      <GlobalSearch isOpen={isOpen} onClose={close} />
    </div>
    </QueryProvider>
  );
}