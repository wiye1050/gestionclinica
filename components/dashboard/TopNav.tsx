'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Bell } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AuditLogEntryState = {
  id: string;
  modulo: string;
  accion: string;
  detalles: Record<string, unknown>;
  createdAt: Date;
};

export default function TopNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntryState[]>([]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const value = doc.data();
        const createdAt = value.createdAt?.toDate?.() ?? new Date();
        return {
          id: doc.id,
          modulo: value.modulo as string,
          accion: value.accion as string,
          detalles: value.detalles ?? {},
          createdAt
        } satisfies AuditLogEntryState;
      });
      setLogs(data);
      if (!open) {
        setUnread(true);
      }
    });
    return unsubscribe;
  }, [open]);

  const formattedLogs = useMemo(() => {
    return logs.map((log) => {
      const fecha = log.createdAt.toLocaleString('es-ES');
      const descripcion = `${log.modulo?.toUpperCase?.() ?? 'Sistema'} · ${log.accion ?? ''}`;
      return { ...log, descripcion, fecha };
    });
  }, [logs]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
    setUnread(false);
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
          <Link href="/dashboard/auditoria" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Auditoría
          </Link>
          <Link href="/dashboard/informes" className="px-4 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium">
            Informes
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={handleToggle} className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {unread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                <div className="px-4 py-2 border-b border-gray-100 font-semibold text-gray-700">
                  Notificaciones recientes
                </div>
                <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {formattedLogs.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-500">Sin actividad reciente.</li>
                  ) : (
                    formattedLogs.map((log) => (
                      <li key={log.id} className="px-4 py-3 text-sm text-gray-600">
                        <p className="font-medium text-gray-800">{log.descripcion}</p>
                        <p className="text-xs text-gray-400">{log.fecha}</p>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

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
