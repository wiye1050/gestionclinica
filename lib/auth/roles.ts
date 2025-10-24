export type AppRole = 'admin' | 'coordinacion' | 'terapeuta' | 'admin_ops' | 'marketing' | 'invitado';

export const ROLE_HIERARCHY: Record<AppRole, AppRole[]> = {
  admin: ['admin', 'coordinacion', 'terapeuta', 'admin_ops', 'marketing', 'invitado'],
  coordinacion: ['coordinacion', 'terapeuta', 'admin_ops', 'marketing', 'invitado'],
  terapeuta: ['terapeuta', 'invitado'],
  admin_ops: ['admin_ops', 'invitado'],
  marketing: ['marketing', 'invitado'],
  invitado: ['invitado']
};

export const hasRole = (roles: AppRole[] | undefined, required: AppRole) => {
  if (!roles || roles.length === 0) return false;
  if (roles.includes('admin')) return true;
  return roles.includes(required);
};

export const canManageProtocolos = (roles: AppRole[] | undefined) =>
  hasRole(roles, 'admin') || hasRole(roles, 'coordinacion');

export const canApproveProtocolos = (roles: AppRole[] | undefined) =>
  hasRole(roles, 'admin') || hasRole(roles, 'coordinacion');

export const canReadProtocolos = (roles: AppRole[] | undefined) =>
  !!roles && roles.length > 0;

export const canReadMejoras = canReadProtocolos;

export const canManageMejoras = (roles: AppRole[] | undefined) =>
  hasRole(roles, 'admin') || hasRole(roles, 'coordinacion') || hasRole(roles, 'admin_ops');
