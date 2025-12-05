'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs';
import { UserDropdown } from '@/components/dashboard/UserDropdown';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logger } from '@/lib/utils/logger';

type InitialUser = {
  uid: string;
  email?: string;
  displayName?: string;
  roles?: string[];
};

export function DashboardLayoutClient({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: InitialUser;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { isOpen, open, close } = useGlobalSearch();
  const [alertStatus, setAlertStatus] = useState<'ok' | 'warn' | 'critical'>('ok');
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const statusMeta = {
    ok: { dot: 'bg-success', label: 'Sin incidencias' },
    warn: { dot: 'bg-warn', label: 'Incidencias pendientes' },
    critical: { dot: 'bg-danger', label: 'Incidencias críticas' },
  } as const;
  const [isDark, setIsDark] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let isMounted = true;

    const fetchIncidencias = async () => {
      try {
        const q = query(
          collection(db, 'reportes-diarios'),
          where('estado', 'in', ['pendiente', 'en-proceso'])
        );
        const snapshot = await getCountFromServer(q);
        if (!isMounted) return;
        const count = Number(snapshot.data().count ?? 0);
        setAlertCount(count);
        if (count === 0) {
          setAlertStatus('ok');
        } else if (count < 5) {
          setAlertStatus('warn');
        } else {
          setAlertStatus('critical');
        }
      } catch {
        if (isMounted) {
          setAlertCount(null);
          setAlertStatus('warn');
        }
      }
    };

    fetchIncidencias();
    const interval = setInterval(fetchIncidencias, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldUseDark);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', shouldUseDark);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next);
      localStorage.setItem('theme', next ? 'dark' : 'light');
    }
  };

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión?')) {
      const result = await logout();
      if (!result.success) {
        logger.error('No se pudo cerrar sesión', result.error);
      }
      router.push('/');
    }
  };

  const resolvedUser = user ?? initialUser;
  const dropdownUser = user ?? {
    displayName: initialUser.displayName ?? null,
    email: initialUser.email ?? null,
  };

  if (loading && !resolvedUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!resolvedUser) {
    return null;
  }

  return (
    <QueryProvider>
      <div className="app-shell app-shell--dashboard text-text">
        <div className="app-shell__content min-h-screen w-full px-0 py-0 bg-white">
          <header
            className={`sticky top-0 z-30 rounded-none border-b bg-brand/5 px-2 py-1.5 transition-all duration-150 ${
              isScrolled
                ? 'border-brand/20 shadow-[0_2px_6px_rgba(0,135,205,0.12)]'
                : 'border-brand/15 shadow-[0_1px_4px_rgba(0,135,205,0.08)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2">
                <ErrorBoundary fallback={
                  <div className="rounded-lg border border-danger/20 bg-danger-bg p-4">
                    <p className="text-sm font-medium text-danger">Error cargando menú</p>
                    <p className="text-xs text-text-muted mt-1">Recarga la página</p>
                  </div>
                }>
                  <Sidebar orientation="horizontal" />
                </ErrorBoundary>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <span className="h-6 w-px bg-slate-200" />
                <button
                  onClick={open}
                  className="flex w-40 items-center gap-1.5 rounded-md border border-slate-200/70 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600 transition-colors hover:bg-white hover:border-slate-300"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">Buscar...</span>
                  <kbd className="hidden lg:flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                    ⌘K
                  </kbd>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={open}
                  className="md:hidden inline-flex items-center justify-center rounded-md border border-slate-200/60 bg-white p-2 text-slate-600 transition hover:bg-white"
                  aria-label="Abrir búsqueda"
                >
                  <Search className="h-4 w-4" />
                </button>

                <button
                  className="hidden sm:inline-flex h-8 min-w-[34px] items-center justify-center gap-1 rounded-full border border-slate-200/70 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600"
                  title={statusMeta[alertStatus].label}
                  aria-label="Incidencias"
                  type="button"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  {alertCount !== null && alertCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-1 py-0.5 text-[10px] font-bold text-slate-700">
                      {alertCount}
                    </span>
                  )}
                </button>

                <NotificacionesDropdown userUid={resolvedUser.uid} />

                <UserDropdown
                  user={dropdownUser}
                  isDark={isDark}
                  onToggleTheme={toggleTheme}
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </header>

          <div className="mt-0 flex flex-col gap-0">
            <main className="min-w-0 flex-1">
              <div className="dashboard-canvas p-0 bg-transparent">
                <div className="dashboard-canvas__inner p-0 rounded-none">
                  <ErrorBoundary>{children}</ErrorBoundary>
                </div>
              </div>
            </main>
          </div>

          <GlobalSearch isOpen={isOpen} onClose={close} />
        </div>
      </div>
    </QueryProvider>
  );
}
