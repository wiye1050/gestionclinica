'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

// Mapa de rutas a nombres legibles
const routeNames: Record<string, string> = {
  dashboard: 'Inicio',
  agenda: 'Agenda',
  pacientes: 'Pacientes',
  'reporte-diario': 'Reporte Diario',
  protocolos: 'Protocolos',
  inventario: 'Inventario',
  supervision: 'Supervisión',
  kpis: 'KPIs',
  mejoras: 'Mejoras',
  proyectos: 'Proyectos',
  informes: 'Informes',
  profesionales: 'Profesionales',
  'catalogo-servicios': 'Catálogo Servicios',
  tratamientos: 'Tratamientos',
  servicios: 'Servicios Asignados',
  auditoria: 'Auditoría',
  nuevo: 'Nuevo',
  editar: 'Editar',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Dividir la ruta en segmentos
  const segments = pathname.split('/').filter(Boolean);

  // Si estamos en /dashboard, no mostrar breadcrumbs
  if (segments.length <= 1) {
    return null;
  }

  // Construir los breadcrumbs
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // Determinar el nombre a mostrar
    let name = routeNames[segment] || segment;

    // Si es un ID (UUID o similar), mostrar algo más amigable
    if (segment.length > 20 || /^[a-f0-9-]+$/i.test(segment)) {
      name = 'Detalle';
    }

    return {
      name,
      href,
      isLast,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-xs">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Home className="h-3 w-3" />
      </Link>

      {breadcrumbs.slice(1).map((crumb) => (
        <div key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-slate-300" />
          {crumb.isLast ? (
            <span className="font-medium text-slate-900">{crumb.name}</span>
          ) : (
            <Link
              href={crumb.href}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              {crumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
