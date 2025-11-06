import { cookies } from 'next/headers';
// import { getAuth } from 'firebase-admin/auth';
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

  // Пока не есть Firebase Admin настроен, возвращаем учетку администратора по умолчанию.
  return {
    uid: 'dev-admin',
    email: 'dev@local.test',
    displayName: 'Dev Admin',
    roles: ['admin']
  };
}
