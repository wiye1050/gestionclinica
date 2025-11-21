'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Palette,
  Bell,
  Calendar,
  LayoutDashboard,
  Accessibility,
  RotateCcw,
  Loader2,
  Check,
} from 'lucide-react';
import { useUserPreferences } from '@/lib/hooks/useUserPreferences';
import { UserPreferences } from '@/lib/types/userPreferences';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabId = 'apariencia' | 'notificaciones' | 'agenda' | 'dashboard' | 'accesibilidad';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Palette;
}

const tabs: Tab[] = [
  { id: 'apariencia', label: 'Apariencia', icon: Palette },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'accesibilidad', label: 'Accesibilidad', icon: Accessibility },
];

export function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { preferences, loading, updatePreferences, resetPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<TabId>('apariencia');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Estado para el portal (necesitamos esperar a que el DOM esté listo)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleUpdate = async (updates: Parameters<typeof updatePreferences>[0]) => {
    try {
      setSaving(true);
      await updatePreferences(updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error manejado en el hook
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (confirm('¿Restablecer todas las preferencias a valores por defecto?')) {
      try {
        setSaving(true);
        await resetPreferences();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        // Error manejado en el hook
      } finally {
        setSaving(false);
      }
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Container para centrar */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden z-[10000]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Configuración</h2>
            <div className="flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
              {saved && <Check className="h-4 w-4 text-success" />}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex" style={{ height: '500px' }}>
            {/* Sidebar de tabs */}
            <div className="w-48 border-r border-slate-100 bg-slate-50/50 p-3 flex flex-col gap-1 overflow-y-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}

            <div className="mt-auto pt-3 border-t border-slate-200">
              <button
                onClick={handleReset}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Restablecer todo
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-brand" />
              </div>
            ) : (
              <>
                {activeTab === 'apariencia' && (
                  <AparienciaTab preferences={preferences} onUpdate={handleUpdate} />
                )}
                {activeTab === 'notificaciones' && (
                  <NotificacionesTab preferences={preferences} onUpdate={handleUpdate} />
                )}
                {activeTab === 'agenda' && (
                  <AgendaTab preferences={preferences} onUpdate={handleUpdate} />
                )}
                {activeTab === 'dashboard' && (
                  <DashboardTab preferences={preferences} onUpdate={handleUpdate} />
                )}
                {activeTab === 'accesibilidad' && (
                  <AccesibilidadTab preferences={preferences} onUpdate={handleUpdate} />
                )}
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// ========== COMPONENTES DE TABS ==========

interface TabProps {
  preferences: UserPreferences;
  onUpdate: (updates: Parameters<ReturnType<typeof useUserPreferences>['updatePreferences']>[0]) => void;
}

function AparienciaTab({ preferences, onUpdate }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Tema</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onUpdate({ theme })}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${
                preferences.theme === theme
                  ? 'border-brand bg-brand/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className={`h-8 w-8 rounded-lg ${
                  theme === 'light'
                    ? 'bg-white border border-slate-200'
                    : theme === 'dark'
                    ? 'bg-slate-800'
                    : 'bg-gradient-to-br from-white to-slate-800'
                }`}
              />
              <span className="text-xs font-medium capitalize">
                {theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Oscuro'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Opciones de interfaz</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Sidebar colapsado por defecto"
            description="Mostrar el sidebar minimizado al iniciar"
            checked={preferences.sidebarCollapsed}
            onChange={(checked) => onUpdate({ sidebarCollapsed: checked })}
          />
          <ToggleOption
            label="Modo compacto"
            description="Reducir espaciado y tamaños para ver más contenido"
            checked={preferences.compactMode}
            onChange={(checked) => onUpdate({ compactMode: checked })}
          />
        </div>
      </div>
    </div>
  );
}

function NotificacionesTab({ preferences, onUpdate }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Canales de notificación</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Notificaciones por email"
            description="Recibir alertas importantes por correo electrónico"
            checked={preferences.notifications.email}
            onChange={(checked) => onUpdate({ notifications: { email: checked } })}
          />
          <ToggleOption
            label="Notificaciones push"
            description="Recibir notificaciones en el navegador"
            checked={preferences.notifications.push}
            onChange={(checked) => onUpdate({ notifications: { push: checked } })}
          />
          <ToggleOption
            label="Sonido de notificación"
            description="Reproducir sonido al recibir notificaciones"
            checked={preferences.notifications.sonido}
            onChange={(checked) => onUpdate({ notifications: { sonido: checked } })}
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Resúmenes</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Resumen diario"
            description="Recibir un email con el resumen de actividad del día"
            checked={preferences.notifications.resumenDiario}
            onChange={(checked) => onUpdate({ notifications: { resumenDiario: checked } })}
          />
        </div>
      </div>
    </div>
  );
}

function AgendaTab({ preferences, onUpdate }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Vista por defecto</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'dia', label: 'Día' },
            { value: 'semana', label: 'Semana' },
            { value: 'mes', label: 'Mes' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onUpdate({ agenda: { vistaDefecto: value } })}
              className={`rounded-lg border-2 px-4 py-2 text-xs font-medium transition ${
                preferences.agenda.vistaDefecto === value
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Horario de trabajo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hora inicio</label>
            <select
              value={preferences.agenda.horaInicio}
              onChange={(e) => onUpdate({ agenda: { horaInicio: Number(e.target.value) } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Hora fin</label>
            <select
              value={preferences.agenda.horaFin}
              onChange={(e) => onUpdate({ agenda: { horaFin: Number(e.target.value) } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {String(i).padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Duración de cita por defecto</h3>
        <select
          value={preferences.agenda.duracionCitaDefecto}
          onChange={(e) => onUpdate({ agenda: { duracionCitaDefecto: Number(e.target.value) } })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value={15}>15 minutos</option>
          <option value={30}>30 minutos</option>
          <option value={45}>45 minutos</option>
          <option value={60}>1 hora</option>
          <option value={90}>1 hora 30 minutos</option>
          <option value={120}>2 horas</option>
        </select>
      </div>

      <div>
        <ToggleOption
          label="Mostrar fines de semana"
          description="Incluir sábado y domingo en la vista de agenda"
          checked={preferences.agenda.mostrarFinesDeSemana}
          onChange={(checked) => onUpdate({ agenda: { mostrarFinesDeSemana: checked } })}
        />
      </div>
    </div>
  );
}

function DashboardTab({ preferences, onUpdate }: TabProps) {
  const widgets = [
    { id: 'citas', label: 'Citas de hoy' },
    { id: 'tareas', label: 'Mis tareas' },
    { id: 'pacientes', label: 'Pacientes recientes' },
    { id: 'reportes', label: 'Reportes pendientes' },
    { id: 'inventario', label: 'Alertas de inventario' },
    { id: 'mejoras', label: 'Propuestas de mejora' },
    { id: 'metricas', label: 'Métricas del mes' },
    { id: 'qa', label: 'Control de calidad' },
  ];

  const toggleWidget = (widgetId: string) => {
    const current = preferences.dashboard.widgetsVisibles;
    const updated = current.includes(widgetId)
      ? current.filter((id) => id !== widgetId)
      : [...current, widgetId];
    onUpdate({ dashboard: { widgetsVisibles: updated } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Widgets visibles</h3>
        <p className="text-xs text-slate-500 mb-4">
          Selecciona qué widgets quieres ver en tu dashboard
        </p>
        <div className="space-y-2">
          {widgets.map((widget) => (
            <label
              key={widget.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
            >
              <input
                type="checkbox"
                checked={preferences.dashboard.widgetsVisibles.includes(widget.id)}
                onChange={() => toggleWidget(widget.id)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-sm text-slate-700">{widget.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccesibilidadTab({ preferences, onUpdate }: TabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Tamaño de fuente</h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { value: 'pequeno', label: 'Pequeño', size: 'text-xs' },
            { value: 'normal', label: 'Normal', size: 'text-sm' },
            { value: 'grande', label: 'Grande', size: 'text-base' },
          ] as const).map(({ value, label, size }) => (
            <button
              key={value}
              onClick={() => onUpdate({ accesibilidad: { tamanoFuente: value } })}
              className={`rounded-lg border-2 px-4 py-3 font-medium transition ${size} ${
                preferences.accesibilidad.tamanoFuente === value
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Opciones de accesibilidad</h3>
        <div className="space-y-3">
          <ToggleOption
            label="Reducir animaciones"
            description="Minimizar movimiento y transiciones"
            checked={preferences.accesibilidad.reducirAnimaciones}
            onChange={(checked) => onUpdate({ accesibilidad: { reducirAnimaciones: checked } })}
          />
          <ToggleOption
            label="Alto contraste"
            description="Aumentar contraste de colores para mejor legibilidad"
            checked={preferences.accesibilidad.altoContraste}
            onChange={(checked) => onUpdate({ accesibilidad: { altoContraste: checked } })}
          />
        </div>
      </div>
    </div>
  );
}

// ========== COMPONENTES AUXILIARES ==========

interface ToggleOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, description, checked, onChange }: ToggleOptionProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="pt-0.5">
        <button
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            checked ? 'bg-brand' : 'bg-slate-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </label>
  );
}
