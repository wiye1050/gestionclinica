import ServiciosClient from './ServiciosClient';
import {
  deserializeServiciosModule,
  getServiciosModuleSerialized,
} from '@/lib/server/servicios';

export default async function ServiciosPage() {
  const serialized = await getServiciosModuleSerialized();
  const { servicios, profesionales, grupos, catalogo } = deserializeServiciosModule(serialized);

  return (
    <ServiciosClient
      initialServicios={servicios}
      initialProfesionales={profesionales}
      initialGrupos={grupos}
      initialCatalogo={catalogo}
    />
  );
}
