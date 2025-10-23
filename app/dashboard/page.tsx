'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { Mail, Cloud, BarChart3, Wrench, AlertTriangle, Package, ExternalLink, TrendingUp } from 'lucide-react';
import { collection, getCountFromServer, query, where } from 'firebase/firestore';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    serviciosActivos: 0,
    incidenciasPendientes: 0,
    productosStockBajo: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Servicios activos
        const serviciosQ = query(
          collection(db, 'servicios-asignados'),
          where('estado', '==', 'activo')
        );
        const serviciosCount = await getCountFromServer(serviciosQ);

        // Incidencias de alta prioridad sin resolver
        const incidenciasQ = query(
          collection(db, 'daily-reports'),
          where('prioridad', '==', 'alta'),
          where('resuelta', '==', false),
        );
        const incidenciasCount = await getCountFromServer(incidenciasQ);

        // Productos con alerta de stock bajo
        const inventarioQ = query(
          collection(db, 'inventario-productos'),
          where('alertaStockBajo', '==', true)
        );
        const inventarioCount = await getCountFromServer(inventarioQ);

        setStats({
          serviciosActivos: serviciosCount.data().count,
          incidenciasPendientes: incidenciasCount.data().count,
          productosStockBajo: inventarioCount.data().count,
        });
      } catch (error) {
        console.error('Error cargando contadores del dashboard:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Panel de Control</h2>
        <p className="text-gray-600 mt-1">Instituto Ordóñez - Sistema de Gestión Clínica</p>
      </div>

      {/* Tarjetas de acceso rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="https://email.ionos.es/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <Mail className="w-10 h-10" />
            <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl font-bold mb-1">Correo Corporativo</h3>
          <p className="text-blue-100 text-sm">Acceder al email</p>
        </a>

        <a
          href="https://app.clinic-cloud.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-4">
            <Cloud className="w-10 h-10" />
            <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl font-bold mb-1">ClinicCloud</h3>
          <p className="text-purple-100 text-sm">Gestión de agenda CRM</p>
        </a>

        <a href="/dashboard/kpis" className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-lg hover:shadow-xl transition-all p-6 text-white group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-10 h-10" />
            <TrendingUp className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl font-bold mb-1">KPIs y Métricas</h3>
          <p className="text-green-100 text-sm">Ver estadísticas</p>
        </a>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Servicios Activos</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.serviciosActivos}</p>
              <p className="text-gray-500 text-xs mt-1">En ejecución</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Wrench className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Incidencias Críticas</p>
              <p className={`text-3xl font-bold mt-2 ${stats.incidenciasPendientes > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.incidenciasPendientes}
              </p>
              <p className="text-gray-500 text-xs mt-1">Alta prioridad</p>
            </div>
            <div className={`p-3 rounded-full ${stats.incidenciasPendientes > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
              <AlertTriangle className={`w-8 h-8 ${stats.incidenciasPendientes > 0 ? 'text-red-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Productos Stock Bajo</p>
              <p className={`text-3xl font-bold mt-2 ${stats.productosStockBajo > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                {stats.productosStockBajo}
              </p>
              <p className="text-gray-500 text-xs mt-1">Requieren atención</p>
            </div>
            <div className={`p-3 rounded-full ${stats.productosStockBajo > 0 ? 'bg-yellow-100' : 'bg-green-100'}`}>
              <Package className={`w-8 h-8 ${stats.productosStockBajo > 0 ? 'text-yellow-600' : 'text-green-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Estado General */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Estado General</h3>
        <div className="space-y-3">
          {stats.productosStockBajo > 0 && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <span className="text-lg text-yellow-600">⚠️</span>
              <span className="text-sm text-yellow-800">
                {stats.productosStockBajo} producto{stats.productosStockBajo > 1 ? 's' : ''} con stock bajo
              </span>
            </div>
          )}
          {stats.incidenciasPendientes > 0 && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <span className="text-lg text-red-600">⚠️</span>
              <span className="text-sm text-red-800">
                {stats.incidenciasPendientes} incidencia{stats.incidenciasPendientes > 1 ? 's' : ''} pendiente{stats.incidenciasPendientes > 1 ? 's' : ''} de alta prioridad
              </span>
            </div>
          )}
          {stats.productosStockBajo === 0 && stats.incidenciasPendientes === 0 && (
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
              <span className="text-lg text-green-600">✅</span>
              <span className="text-sm text-green-800">No hay alertas críticas</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
