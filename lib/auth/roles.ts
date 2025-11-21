// Sistema unificado de roles para la clínica
export type AppRole = 'admin' | 'coordinador' | 'profesional' | 'recepcion' | 'invitado';

// Jerarquía de roles: cada rol incluye los permisos de los roles listados
export const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  admin: ['admin', 'coordinador', 'profesional', 'recepcion', 'invitado'],
  coordinador: ['coordinador', 'profesional', 'recepcion', 'invitado'],
  profesional: ['profesional', 'invitado'],
  recepcion: ['recepcion', 'invitado'],
  invitado: ['invitado']
};

// Descripciones de roles para UI
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  coordinador: 'Coordinador',
  profesional: 'Profesional',
  recepcion: 'Recepción',
  invitado: 'Invitado'
};

// Descripciones detalladas
export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acceso completo al sistema',
  coordinador: 'Gestión de agenda, inventario, proyectos y usuarios',
  profesional: 'Atención a pacientes, citas y reportes',
  recepcion: 'Gestión de citas y datos básicos de pacientes',
  invitado: 'Solo lectura básica'
};

// Función para verificar si tiene un rol específico
export const hasRole = (roles: AppRole[] | undefined, required: AppRole): boolean => {
  if (!roles || roles.length === 0) return false;
  // Admin tiene acceso a todo
  if (roles.includes('admin')) return true;
  return roles.includes(required);
};

// Función para verificar si tiene alguno de los roles
export const hasAnyRole = (roles: AppRole[] | undefined, required: AppRole[]): boolean => {
  if (!roles || roles.length === 0) return false;
  if (roles.includes('admin')) return true;
  return required.some(r => roles.includes(r));
};

// Permisos específicos por funcionalidad
export const canManageProtocolos = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

export const canApproveProtocolos = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

export const canReadProtocolos = (roles: AppRole[] | undefined): boolean =>
  !!roles && roles.length > 0;

export const canManageMejoras = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

export const canManageInventario = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

export const canManageAgenda = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador', 'profesional', 'recepcion']);

export const canCreateAgendaEvents = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador', 'profesional', 'recepcion']);

export const canManageUsers = (roles: AppRole[] | undefined): boolean =>
  hasRole(roles, 'admin');

export const canViewFinances = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

export const canManagePatients = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador', 'profesional']);

export const canViewFullPatientHistory = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador', 'profesional']);

export const canManageProyectos = (roles: AppRole[] | undefined): boolean =>
  hasAnyRole(roles, ['admin', 'coordinador']);

// Alias para compatibilidad
export const canReadMejoras = canReadProtocolos;
