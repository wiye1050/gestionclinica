'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  BarChart3,
  Users,
  Package,
  FolderKanban,
  FileBarChart,
  UserCheck,
  List,
  Layers,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  UserCircle,
  Lightbulb,
  BookOpen,
  ShieldCheck,
  Settings,
  UsersRound,
  type LucideIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserRole, UserRole } from '@/lib/utils/userRoles';

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
  badgeKey?: string;
}

interface MenuSection {
  id: string;
  title: string;
  icon: LucideIcon;
  color: string;
  items: MenuItem[];
  collapsible: boolean;
  defaultOpen: boolean;
}

interface SidebarBadges {
  reportes: number;
  stockBajo: number;
  proyectosAtrasados: number;
  mejorasPendientes: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { role, loading: roleLoading } = useUserRole();

  // Estado de secciones colapsables
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({
    operaciones: false,
    coordinacion: false,
    configuracion: false,
  });

  // Badges de notificación
  const [badges, setBadges] = useState<SidebarBadges>({
    reportes: 0,
    stockBajo: 0,
    proyectosAtrasados: 0,
    mejorasPendientes: 0,
  });

  // Rol del usuario (default a recepcion para mostrar al menos módulos básicos mientras carga)
  const userRole: UserRole = role || 'recepcion';

  // Cargar estado guardado de localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-sections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSectionStates(prev => ({ ...prev, ...parsed }));
      } catch {
        // Ignorar errores de parsing
      }
    }
  }, []);

  // Auto-abrir sección según ruta actual
  useEffect(() => {
    const operacionesRoutes = ['/dashboard/reporte-diario', '/dashboard/protocolos', '/dashboard/inventario'];
    const coordinacionRoutes = ['/dashboard/supervision', '/dashboard/kpis', '/dashboard/mejoras', '/dashboard/proyectos', '/dashboard/informes'];
    const configuracionRoutes = ['/dashboard/profesionales', '/dashboard/catalogo-servicios', '/dashboard/tratamientos', '/dashboard/servicios', '/dashboard/auditoria'];

    if (operacionesRoutes.some(route => pathname.startsWith(route))) {
      setSectionStates(prev => ({ ...prev, operaciones: true }));
    } else if (coordinacionRoutes.some(route => pathname.startsWith(route))) {
      setSectionStates(prev => ({ ...prev, coordinacion: true }));
    } else if (configuracionRoutes.some(route => pathname.startsWith(route))) {
      setSectionStates(prev => ({ ...prev, configuracion: true }));
    }
  }, [pathname]);

  // Cargar badges de notificación
  useEffect(() => {
    let active = true;

    const fetchBadges = async () => {
      try {
        // Reportes pendientes
        const reportesSnap = await getDocs(
          query(collection(db, 'reportes-diarios'), where('estado', '==', 'pendiente'))
        );

        // Stock bajo
        const stockSnap = await getDocs(
          query(collection(db, 'inventario-productos'), where('alertaStockBajo', '==', true))
        );

        // Proyectos atrasados
        const hoy = new Date();
        const proyectosSnap = await getDocs(
          query(collection(db, 'proyectos'), where('estado', '==', 'en-curso'))
        );
        const atrasados = proyectosSnap.docs.filter(doc => {
          const data = doc.data();
          const fechaFin = data.fechaFin?.toDate?.();
          return fechaFin && fechaFin < hoy;
        }).length;

        // Mejoras pendientes
        const mejorasSnap = await getDocs(
          query(collection(db, 'mejoras'), where('estado', '==', 'pendiente'))
        );

        if (active) {
          setBadges({
            reportes: reportesSnap.size,
            stockBajo: stockSnap.size,
            proyectosAtrasados: atrasados,
            mejorasPendientes: mejorasSnap.size,
          });
        }
      } catch (error) {
        console.error('Error cargando badges del sidebar:', error);
      }
    };

    fetchBadges();
    // Refrescar cada 5 minutos
    const interval = setInterval(fetchBadges, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const toggleSection = (sectionId: string) => {
    setSectionStates(prev => {
      const newState = { ...prev, [sectionId]: !prev[sectionId] };
      // Guardar en localStorage
      localStorage.setItem('sidebar-sections', JSON.stringify(newState));
      return newState;
    });
  };

  // Definición de secciones y módulos
  const sections: MenuSection[] = [
    {
      id: 'principal',
      title: 'Principal',
      icon: Home,
      color: 'text-brand',
      collapsible: false,
      defaultOpen: true,
      items: [
        { name: 'Inicio', href: '/dashboard', icon: Home, roles: ['admin', 'coordinador', 'profesional', 'recepcion'] },
        { name: 'Agenda', href: '/dashboard/agenda', icon: CalendarDays, roles: ['admin', 'coordinador', 'profesional', 'recepcion'] },
        { name: 'Pacientes', href: '/dashboard/pacientes', icon: UserCircle, roles: ['admin', 'coordinador', 'profesional', 'recepcion'] },
      ],
    },
    {
      id: 'operaciones',
      title: 'Operaciones',
      icon: FileText,
      color: 'text-emerald-600',
      collapsible: true,
      defaultOpen: false,
      items: [
        { name: 'Reporte Diario', href: '/dashboard/reporte-diario', icon: FileText, roles: ['admin', 'coordinador', 'profesional'], badgeKey: 'reportes' },
        { name: 'Protocolos', href: '/dashboard/protocolos', icon: BookOpen, roles: ['admin', 'coordinador', 'profesional'] },
        { name: 'Inventario', href: '/dashboard/inventario', icon: Package, roles: ['admin', 'coordinador'], badgeKey: 'stockBajo' },
      ],
    },
    {
      id: 'coordinacion',
      title: 'Coordinación',
      icon: Users,
      color: 'text-violet-600',
      collapsible: true,
      defaultOpen: false,
      items: [
        { name: 'Supervisión', href: '/dashboard/supervision', icon: Users, roles: ['admin', 'coordinador'] },
        { name: 'KPIs', href: '/dashboard/kpis', icon: BarChart3, roles: ['admin', 'coordinador'] },
        { name: 'Mejoras', href: '/dashboard/mejoras', icon: Lightbulb, roles: ['admin', 'coordinador'], badgeKey: 'mejorasPendientes' },
        { name: 'Proyectos', href: '/dashboard/proyectos', icon: FolderKanban, roles: ['admin', 'coordinador'], badgeKey: 'proyectosAtrasados' },
        { name: 'Informes', href: '/dashboard/informes', icon: FileBarChart, roles: ['admin', 'coordinador'] },
      ],
    },
    {
      id: 'configuracion',
      title: 'Configuración',
      icon: Settings,
      color: 'text-slate-500',
      collapsible: true,
      defaultOpen: false,
      items: [
        { name: 'Usuarios', href: '/dashboard/usuarios', icon: UsersRound, roles: ['admin'] },
        { name: 'Profesionales', href: '/dashboard/profesionales', icon: UserCheck, roles: ['admin'] },
        { name: 'Catálogo Servicios', href: '/dashboard/catalogo-servicios', icon: List, roles: ['admin'] },
        { name: 'Tratamientos', href: '/dashboard/tratamientos', icon: Layers, roles: ['admin'] },
        { name: 'Servicios Asignados', href: '/dashboard/servicios', icon: ClipboardList, roles: ['admin', 'coordinador'] },
        { name: 'Auditoría', href: '/dashboard/auditoria', icon: ShieldCheck, roles: ['admin'] },
      ],
    },
  ];

  // Filtrar secciones y items según rol
  const filteredSections = sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(userRole)),
    }))
    .filter(section => section.items.length > 0);

  const getBadgeValue = (badgeKey?: string): number => {
    if (!badgeKey) return 0;
    return badges[badgeKey as keyof SidebarBadges] || 0;
  };

  const getBadgeColor = (badgeKey?: string): string => {
    switch (badgeKey) {
      case 'reportes':
        return 'bg-danger text-white';
      case 'stockBajo':
        return 'bg-warn text-white';
      case 'proyectosAtrasados':
        return 'bg-amber-500 text-white';
      case 'mejorasPendientes':
        return 'bg-brand text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  // Mostrar skeleton mientras carga el rol
  if (roleLoading) {
    return (
      <aside className="sidebar-panel flex w-full flex-col gap-2 px-3 py-4">
        <div className="space-y-3">
          {/* Skeleton de sección Principal */}
          <div className="space-y-1">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
            <div className="space-y-1">
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
          {/* Skeleton de otras secciones */}
          <div className="space-y-1">
            <div className="h-9 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar-panel flex w-full flex-col gap-2 px-3 py-4">
      <nav className="space-y-1">
        {filteredSections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = section.collapsible ? sectionStates[section.id] : true;
          const hasActiveItem = section.items.some(item =>
            pathname === item.href || pathname.startsWith(item.href + '/')
          );

          return (
            <div key={section.id} className="space-y-1">
              {/* Header de sección */}
              {section.collapsible ? (
                <button
                  onClick={() => toggleSection(section.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition hover:bg-slate-50 ${
                    hasActiveItem ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SectionIcon className={`h-3.5 w-3.5 ${section.color}`} />
                    <span>{section.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              ) : (
                <div className="px-3 py-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${section.color}`}>
                    {section.title}
                  </span>
                </div>
              )}

              {/* Items de la sección */}
              {isOpen && (
                <div className={section.collapsible ? 'ml-2 space-y-0.5' : 'space-y-0.5'}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                      (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const badgeValue = getBadgeValue(item.badgeKey);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? '' : section.color}`} />
                          <span>{item.name}</span>
                        </div>
                        {badgeValue > 0 && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : getBadgeColor(item.badgeKey)
                          }`}>
                            {badgeValue > 99 ? '99+' : badgeValue}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}

              {/* Separador entre secciones */}
              {section.id !== 'configuracion' && (
                <div className="my-2 border-t border-slate-100" />
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
