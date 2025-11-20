'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import { LogOut, Search, Mail, Activity, HelpCircle } from 'lucide-react';
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
          <header className="rounded-[18px] border border-white/40 bg-white/85 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">Instituto Ordóñez</p>
                <h1 className="text-lg font-semibold text-slate-900">Panel operativo</h1>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={open}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white md:hidden"
                  aria-label="Abrir búsqueda"
                >
                  <Search className="h-4 w-4" />
                </button>
                <button
                  onClick={open}
                  className="hidden items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white md:inline-flex"
                >
                  <Search className="h-4 w-4" />
                  <span>Buscar</span>
                  <kbd className="hidden items-center gap-1 rounded-full border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 md:flex">
                    ⌘K
                  </kbd>
                </button>
                <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                  <a
                    href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 hover:bg-slate-50"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Correo
                  </a>
                  <span className="h-4 w-px bg-slate-200" />
                  <a
                    href="https://app.clinic-cloud.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 hover:bg-slate-50"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    Clinic Cloud
                  </a>
                </div>
                <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta[alertStatus].dot}`}></span>
                  <span>{statusMeta[alertStatus].label}</span>
                  {alertCount !== null && alertCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                      {alertCount}
                    </span>
                  )}
                </div>
                <a
                  href="https://support.clinic-cloud.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200/60 bg-white/80 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-white"
                  aria-label="Centro de ayuda"
                >
                  <HelpCircle className="h-4 w-4" />
                </a>
                <NotificacionesDropdown userUid={user.uid} />
                <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{user.displayName || user.email}</p>
                    <p className="text-[11px] text-slate-500">Administrador</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-sm font-semibold text-white shadow-lg shadow-brand/30">
                    {(user.displayName || user.email || 'U')[0]?.toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </header>

          <div className="mt-4 flex gap-4">
            <div className="hidden shrink-0 lg:block">
              <div className="sticky top-20 w-56">
                <Sidebar />
              </div>
            </div>
            <main className="flex-1 overflow-x-auto">
              <div className="dashboard-canvas min-w-[1100px]">
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
