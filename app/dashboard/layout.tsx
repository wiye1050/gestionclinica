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
      <div className="min-h-screen bg-bg text-text">
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-text-muted">Instituto Ordóñez</p>
              <h1 className="text-xl font-semibold text-text">Panel operativo</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={open}
                className="inline-flex items-center gap-2 rounded-pill border border-border bg-card px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-cardHover focus-visible:focus-ring md:hidden"
                aria-label="Abrir búsqueda"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                onClick={open}
                className="hidden items-center gap-2 rounded-pill border border-border bg-card px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-cardHover focus-visible:focus-ring md:inline-flex"
              >
                <Search className="h-4 w-4" />
                <span>Buscar</span>
                <kbd className="hidden items-center gap-1 rounded-pill border border-border px-2 py-0.5 text-[11px] text-text-muted md:flex">
                  ⌘K
                </kbd>
              </button>

              <NotificacionesDropdown userUid={user.uid} />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-text">{user.displayName || user.email}</p>
                  <p className="text-xs text-text-muted">Administrador</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-sm font-semibold text-white">
                  {(user.displayName || user.email || 'U')[0]?.toUpperCase()}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-pill border border-border px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:focus-ring"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex">
          <Sidebar />
          <main className="flex-1 px-6 py-8 lg:px-8">
            {children}
          </main>
        </div>

        <GlobalSearch isOpen={isOpen} onClose={close} />
      </div>
    </QueryProvider>
  );
}
