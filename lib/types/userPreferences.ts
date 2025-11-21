// Tipos para preferencias de usuario

export interface UserPreferences {
  // Apariencia
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  compactMode: boolean;

  // Notificaciones
  notifications: {
    email: boolean;
    push: boolean;
    sonido: boolean;
    resumenDiario: boolean;
  };

  // Agenda
  agenda: {
    vistaDefecto: 'dia' | 'semana' | 'mes';
    horaInicio: number; // 0-23
    horaFin: number; // 0-23
    duracionCitaDefecto: number; // minutos
    mostrarFinesDeSemana: boolean;
  };

  // Dashboard
  dashboard: {
    widgetsVisibles: string[];
    widgetsOrden: string[];
  };

  // Accesibilidad
  accesibilidad: {
    tamanoFuente: 'pequeno' | 'normal' | 'grande';
    reducirAnimaciones: boolean;
    altoContraste: boolean;
  };
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  sidebarCollapsed: false,
  compactMode: false,

  notifications: {
    email: true,
    push: true,
    sonido: true,
    resumenDiario: false,
  },

  agenda: {
    vistaDefecto: 'semana',
    horaInicio: 8,
    horaFin: 20,
    duracionCitaDefecto: 30,
    mostrarFinesDeSemana: false,
  },

  dashboard: {
    widgetsVisibles: ['citas', 'tareas', 'pacientes', 'reportes', 'inventario', 'mejoras'],
    widgetsOrden: ['citas', 'tareas', 'pacientes', 'reportes', 'inventario', 'mejoras'],
  },

  accesibilidad: {
    tamanoFuente: 'normal',
    reducirAnimaciones: false,
    altoContraste: false,
  },
};

// Tipo para actualización parcial de preferencias
export type UserPreferencesUpdate = Partial<{
  theme: UserPreferences['theme'];
  sidebarCollapsed: boolean;
  compactMode: boolean;
  notifications: Partial<UserPreferences['notifications']>;
  agenda: Partial<UserPreferences['agenda']>;
  dashboard: Partial<UserPreferences['dashboard']>;
  accesibilidad: Partial<UserPreferences['accesibilidad']>;
}>;
