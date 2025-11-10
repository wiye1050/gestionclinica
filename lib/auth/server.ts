import { cookies } from 'next/headers';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '@/lib/firebaseAdmin';
import { SESSION_COOKIE_NAME } from './session';
import { AppRole } from './roles';

interface CurrentUser {
  uid: string;
  email?: string;
  displayName?: string;
  roles?: AppRole[];
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (process.env.MOCK_AUTH === 'true') {
    const cookieStore = await cookies();
    const mockUid = cookieStore.get('mock_uid')?.value;
    if (!mockUid) return null;
    return {
      uid: mockUid,
      email: cookieStore.get('mock_email')?.value,
      displayName: cookieStore.get('mock_name')?.value,
      roles: (cookieStore.get('mock_roles')?.value?.split(',') as AppRole[]) ?? ['coordinacion']
    };
  }

  if (!adminAuth) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] Firebase Admin no configurado; getCurrentUser devuelve null.');
    }
    return null;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = (await adminAuth.verifySessionCookie(sessionCookie, true)) as DecodedIdToken &
      Record<string, unknown>;

    const claims = decoded as Record<string, unknown>;
    const rawRoles =
      claims.roles ??
      (typeof claims.customClaims === 'object' && claims.customClaims
        ? (claims.customClaims as Record<string, unknown>).roles
        : undefined);

    const roles =
      Array.isArray(rawRoles)
        ? (rawRoles.filter((role): role is AppRole =>
            ['admin', 'coordinacion', 'terapeuta', 'admin_ops', 'marketing', 'invitado'].includes(
              String(role)
            )
          ) as AppRole[])
        : [];

    return {
      uid: decoded.uid,
      email: decoded.email ?? undefined,
      displayName: decoded.name ?? undefined,
      roles: roles.length > 0 ? roles : ['invitado']
    };
  } catch (error) {
    console.warn('[auth] Sesión inválida, se ignorará la cookie', error);
    return null;
  }
}
