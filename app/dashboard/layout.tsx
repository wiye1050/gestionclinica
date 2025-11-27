import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/');
  }

  return <DashboardLayoutClient initialUser={currentUser}>{children}</DashboardLayoutClient>;
}
