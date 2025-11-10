'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { LogOut, Search } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown';
import { QueryProvider } from '@/lib/providers/QueryProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { isOpen, open, close } = useGlobalSearch();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      const result = await logout();
      if (!result.success) {
        console.error('No se pudo cerrar sesión', result.error);
      }
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
      <div className="app-shell app-shell--dashboard text-text">
        <div className="app-shell__content min-h-screen px-4 py-6 lg:px-10">
          <header className="rounded-[28px] border border-white/30 bg-white/85 px-6 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-slate-500">Instituto Ordóñez</p>
                <h1 className="text-xl font-semibold text-slate-900">Panel operativo</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={open}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white md:hidden"
                  aria-label="Abrir búsqueda"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  onClick={open}
                  className="hidden items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-white md:inline-flex"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                  <kbd className="hidden items-center gap-1 rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 md:flex">
                    ⌘K
                  </kbd>
                </button>
                <NotificacionesDropdown userUid={user.uid} />
                <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">{user.displayName || user.email}</p>
                    <p className="text-xs text-slate-500">Administrador</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-sm font-semibold text-white shadow-lg shadow-brand/30">
                    {(user.displayName || user.email || 'U')[0]?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mt-6 flex gap-6">
            <div className="hidden shrink-0 lg:block">
              <div className="sticky top-24 w-64">
                <Sidebar />
              </div>
            </div>
            <main className="flex-1">
              <div className="dashboard-canvas">
                <div className="dashboard-canvas__inner">{children}</div>
              </div>
            </main>
          </div>

          <GlobalSearch isOpen={isOpen} onClose={close} />
        </div>
      </div>
    </QueryProvider>
  );
}
