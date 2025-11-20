'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { LogOut, Search, Mail, Activity, HelpCircle, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { GlobalSearch } from '@/components/ui/GlobalSearch';
import { useGlobalSearch } from '@/lib/hooks/useGlobalSearch';
import { NotificacionesDropdown } from '@/components/ui/NotificacionesDropdown';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
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
  const ThemeIcon = isDark ? Sun : Moon;

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
          <header className="rounded-xl border border-white/40 bg-white/85 px-4 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.06)] backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-semibold text-slate-900">Instituto Ordóñez</h1>
                <span className="hidden sm:inline text-xs text-slate-500">Panel operativo</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={open}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-white md:hidden"
                  aria-label="Abrir búsqueda"
                >
                  <Search className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={open}
                  className="hidden items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-white md:inline-flex"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Buscar</span>
                  <kbd className="hidden items-center gap-0.5 rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 md:flex">
                    ⌘K
                  </kbd>
                </button>
                <div className="hidden lg:flex items-center gap-1 rounded-full border border-slate-200/70 bg-white px-1.5 py-1 text-[11px] font-semibold text-slate-600">
                  <a
                    href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-slate-50"
                  >
                    <Mail className="h-3 w-3" />
                    Correo
                  </a>
                  <span className="h-3 w-px bg-slate-200" />
                  <a
                    href="https://app.clinic-cloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 hover:bg-slate-50"
                  >
                    <Activity className="h-3 w-3" />
                    Clinic Cloud
                  </a>
                </div>
                <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                  <span className={`h-2 w-2 rounded-full ${statusMeta[alertStatus].dot}`}></span>
                  <span className="hidden xl:inline">{statusMeta[alertStatus].label}</span>
                  {alertCount !== null && alertCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      {alertCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleTheme}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200/60 bg-white/80 p-1.5 text-xs text-slate-600 transition hover:bg-white"
                  aria-label="Cambiar tema"
                >
                  <ThemeIcon className="h-3.5 w-3.5" />
                </button>
                <a
                  href="https://support.clinic-cloud.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200/60 bg-white/80 p-1.5 text-xs font-medium text-slate-600 transition hover:bg-white"
                  aria-label="Centro de ayuda"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </a>
                <NotificacionesDropdown userUid={user.uid} />
                <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-2.5 py-1">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">{user.displayName || user.email}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-xs font-semibold text-white shadow-md shadow-brand/20">
                    {(user.displayName || user.email || 'U')[0]?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mt-3 flex gap-3">
            <div className="hidden shrink-0 lg:block">
              <div className="sticky top-16 w-48">
                <Sidebar />
              </div>
            </div>
            <main className="flex-1 min-w-0">
              <div className="dashboard-canvas">
                <div className="dashboard-canvas__inner">
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
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
