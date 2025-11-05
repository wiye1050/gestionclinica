'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, CheckCircle, AlertTriangle, Package, FileText, Clock } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notificacion } from '@/types';
import { getPendingFollowUpPatientIds } from '@/lib/utils/followUps';

interface NotificacionesDropdownProps {
  userUid: string;
}

export function NotificacionesDropdown({ userUid }: NotificacionesDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar notificaciones del sistema
  useEffect(() => {
    const generarNotificacionesAutomaticas = async () => {
      const notifs: Notificacion[] = [];

      try {
        // 1. Seguimientos pendientes
        const seguimientosPendientes = await getPendingFollowUpPatientIds();
        if (seguimientosPendientes.size > 0) {
          notifs.push({
            id: 'auto-seguimientos',
            tipo: 'seguimiento',
            prioridad: 'alta',
            titulo: 'Seguimientos pendientes',
            mensaje: `Tienes ${seguimientosPendientes.size} paciente(s) con seguimiento pendiente`,
            leida: false,
            url: '/dashboard/pacientes?filtro=seguimiento',
            destinatarioUid: userUid,
            createdAt: new Date()
          });
        }

        // 2. Stock bajo
        const inventarioSnap = await getDocs(
          query(
            collection(db, 'inventario-productos'),
            where('alertaStockBajo', '==', true),
            limit(100)
          )
        );
        if (inventarioSnap.size > 0) {
          notifs.push({
            id: 'auto-stock',
            tipo: 'stock',
            prioridad: 'media',
            titulo: 'Stock bajo',
            mensaje: `${inventarioSnap.size} producto(s) con stock bajo`,
            leida: false,
            url: '/dashboard/inventario',
            destinatarioUid: userUid,
            createdAt: new Date()
          });
        }

        // 3. Incidencias críticas pendientes
        const incidenciasSnap = await getDocs(
          query(
            collection(db, 'reportes-diarios'),
            where('prioridad', '==', 'alta'),
            where('estado', '==', 'pendiente'),
            limit(100)
          )
        );
        if (incidenciasSnap.size > 0) {
          notifs.push({
            id: 'auto-incidencias',
            tipo: 'incidencia',
            prioridad: 'alta',
            titulo: 'Incidencias críticas',
            mensaje: `${incidenciasSnap.size} incidencia(s) de alta prioridad pendiente(s)`,
            leida: false,
            url: '/dashboard/reporte-diario',
            destinatarioUid: userUid,
            createdAt: new Date()
          });
        }

        setNotificaciones(notifs);
      } catch (error) {
        console.error('Error generando notificaciones:', error);
      } finally {
        setLoading(false);
      }
    };

    generarNotificacionesAutomaticas();
    
    // Actualizar cada 2 minutos
    const interval = setInterval(generarNotificacionesAutomaticas, 120000);
    return () => clearInterval(interval);
  }, [userUid]);

  const handleClickNotificacion = (notif: Notificacion) => {
    if (notif.url) {
      router.push(notif.url);
    }
    setIsOpen(false);
  };

  const marcarComoLeida = (notifId: string) => {
    setNotificaciones(prev =>
      prev.map(n => (n.id === notifId ? { ...n, leida: true, leidaEn: new Date() } : n))
    );
  };

  const marcarTodasLeidas = () => {
    setNotificaciones(prev =>
      prev.map(n => ({ ...n, leida: true, leidaEn: new Date() }))
    );
  };

  const getIcono = (tipo: string) => {
    switch (tipo) {
      case 'seguimiento':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'stock':
        return <Package className="w-5 h-5 text-yellow-600" />;
      case 'incidencia':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'protocolo':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'mejora':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta':
        return 'border-l-4 border-red-500';
      case 'media':
        return 'border-l-4 border-yellow-500';
      case 'baja':
        return 'border-l-4 border-blue-500';
      default:
        return '';
    }
  };

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <div className="relative">
      {/* Botón */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 top-12 z-40 w-96 rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notificaciones ({noLeidas})
              </h3>
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            {/* Lista */}
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  Cargando...
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No tienes notificaciones
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notificaciones.map((notif) => (
                    <div
                      key={notif.id}
                      className={`relative cursor-pointer p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                        !notif.leida ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      } ${getPrioridadColor(notif.prioridad)}`}
                      onClick={() => handleClickNotificacion(notif)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          {getIcono(notif.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {notif.titulo}
                          </p>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                            {notif.mensaje}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {notif.createdAt.toLocaleString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!notif.leida && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              marcarComoLeida(notif.id);
                            }}
                            className="flex-shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <X className="h-4 w-4 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
