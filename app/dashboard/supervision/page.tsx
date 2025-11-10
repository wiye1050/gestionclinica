import SupervisionClient from './SupervisionClient';
import {
  getSerializedEvaluaciones,
  getSerializedServiciosActuales,
  getSerializedProfesionales,
  getSerializedGrupos,
} from '@/lib/server/supervision';

export default async function SupervisionPage() {
  const [evaluaciones, servicios, profesionales, grupos] = await Promise.all([
    getSerializedEvaluaciones(),
    getSerializedServiciosActuales(),
    getSerializedProfesionales(),
    getSerializedGrupos(),
  ]);

  return (
    <SupervisionClient
      initialEvaluaciones={evaluaciones}
      initialServicios={servicios}
      initialProfesionales={profesionales}
      initialGrupos={grupos}
    />
  );
}
