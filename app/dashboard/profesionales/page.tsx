import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/server';
import ProfesionalesClient from './ProfesionalesClient';
import {
  deserializeProfesionales,
  getSerializedProfesionales,
} from '@/lib/server/profesionales';

export default async function ProfesionalesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/');
  }

  const serialized = await getSerializedProfesionales();
  const profesionales = deserializeProfesionales(serialized);

  return <ProfesionalesClient initialProfesionales={profesionales} />;
}
