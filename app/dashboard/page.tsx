'use client';

import KPICard from '@/components/dashboard/KPICard';
import { Activity, Users, Calendar, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-600 mt-2">Bienvenido al sistema de coordinación clínica</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Reportes Hoy"
          value="3"
          icon={<Activity className="w-6 h-6" />}
          trend="up"
          trendValue="12%"
          color="blue"
        />
        <KPICard
          title="Tareas Pendientes"
          value="8"
          icon={<Calendar className="w-6 h-6" />}
          trend="down"
          trendValue="5%"
          color="orange"
        />
        <KPICard
          title="KPIs en Objetivo"
          value="12/15"
          icon={<TrendingUp className="w-6 h-6" />}
          trend="up"
          trendValue="8%"
          color="green"
        />
        <KPICard
          title="Personal Activo"
          value="24"
          icon={<Users className="w-6 h-6" />}
          trend="stable"
          color="purple"
        />
      </div>

      {/* Sección de Alertas y Novedades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Recientes</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-red-900">Stock bajo en material quirúrgico</p>
                <p className="text-sm text-red-700">Hace 2 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-yellow-900">Evaluación de desempeño pendiente</p>
                <p className="text-sm text-yellow-700">Hace 5 horas</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="font-medium text-blue-900">Nuevo proyecto asignado</p>
                <p className="text-sm text-blue-700">Ayer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Reporte diario completado</p>
                <p className="text-xs text-gray-500">Hace 1 hora</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 pb-3 border-b">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">KPI de calidad actualizado</p>
                <p className="text-xs text-gray-500">Hace 3 horas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 pb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Nueva tarea asignada</p>
                <p className="text-xs text-gray-500">Hace 6 horas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}