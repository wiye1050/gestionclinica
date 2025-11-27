/**
 * Centralized API role validation
 *
 * This module provides consistent role sets and validation helpers for all API routes.
 *
 * Role hierarchy:
 * - admin: Full system access
 * - coordinador: Manage resources, create/update/delete
 * - profesional: Read access to clinical data
 * - paciente: Limited access to own data (handled separately)
 */

import type { AppRole } from './roles';

/**
 * Standard role sets for common API operations
 */
export const API_ROLES = {
  /** Full admin access only */
  ADMIN_ONLY: new Set<AppRole>(['admin']),

  /** Create, update, delete operations */
  WRITE: new Set<AppRole>(['admin', 'coordinador']),

  /** Read access for all staff members */
  READ: new Set<AppRole>(['admin', 'coordinador', 'profesional']),

  /** Clinical staff (for patient data scoping) */
  CLINICAL: new Set<AppRole>(['profesional']),
} as const;

/**
 * Alias for backward compatibility
 */
export const ALLOWED_ROLES = API_ROLES.WRITE;
export const VIEW_ROLES = API_ROLES.READ;
export const CREATE_UPDATE_ROLES = API_ROLES.WRITE;
export const ADMIN_ROLES = API_ROLES.WRITE;
export const CLINICAL_ROLES = API_ROLES.CLINICAL;

/**
 * Check if user has any of the required roles
 *
 * @param userRoles - Array of roles from the user object
 * @param requiredRoles - Set of roles that grant access
 * @returns true if user has at least one required role
 *
 * @example
 * ```ts
 * const user = await getCurrentUser();
 * if (!hasAnyRole(user.roles, API_ROLES.WRITE)) {
 *   return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
 * }
 * ```
 */
export function hasAnyRole(
  userRoles: AppRole[] | undefined,
  requiredRoles: Set<AppRole>
): boolean {
  return (userRoles ?? []).some((role) => requiredRoles.has(role));
}

/**
 * Check if user is an admin
 */
export function isAdmin(userRoles: AppRole[] | undefined): boolean {
  return hasAnyRole(userRoles, API_ROLES.ADMIN_ONLY);
}

/**
 * Check if user can write (create/update/delete)
 */
export function canWrite(userRoles: AppRole[] | undefined): boolean {
  return hasAnyRole(userRoles, API_ROLES.WRITE);
}

/**
 * Check if user can read
 */
export function canRead(userRoles: AppRole[] | undefined): boolean {
  return hasAnyRole(userRoles, API_ROLES.READ);
}

/**
 * Check if user is clinical staff
 */
export function isClinical(userRoles: AppRole[] | undefined): boolean {
  return hasAnyRole(userRoles, API_ROLES.CLINICAL);
}
