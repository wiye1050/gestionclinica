import type { CatalogoServicio, GrupoPaciente, Profesional } from '@/types';
import { FormField, FormSection } from '@/components/shared/form';

type TiquetValue = 'SI' | 'NO' | 'CORD' | 'ESPACH';

export type NuevoServicioForm = {
  catalogoServicioId: string;
  grupoId: string;
  tiquet: TiquetValue;
  profesionalPrincipalId: string;
  profesionalSegundaOpcionId: string;
  profesionalTerceraOpcionId: string;
  requiereApoyo: boolean;
  sala: string;
  supervision: boolean;
  esActual: boolean;
};

interface CreateServicioFormProps {
  formData: NuevoServicioForm;
  onChange: (data: NuevoServicioForm) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  catalogoServicios: CatalogoServicio[];
  grupos: GrupoPaciente[];
  profesionales: Profesional[];
}

export default function CreateServicioForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  catalogoServicios,
  grupos,
  profesionales,
}: CreateServicioFormProps) {
  const servicioOptions = catalogoServicios.map((s) => ({
    value: s.id,
    label: `${s.nombre} (${s.tiempoEstimado} min)`,
  }));

  const grupoOptions = grupos.map((g) => ({ value: g.id, label: g.nombre }));

  const profesionalOptions = profesionales.map((p) => ({
    value: p.id,
    label: `${p.nombre} ${p.apellidos}`,
  }));

  return (
    <div className="panel-block p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-text">Asignar servicio a grupo</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <FormSection title="Información básica" description="Selecciona el servicio y grupo">
          <FormField
            name="catalogoServicioId"
            label="Servicio del Catálogo"
            type="select"
            required
            value={formData.catalogoServicioId}
            onChange={(e) => onChange({ ...formData, catalogoServicioId: e.target.value })}
            options={servicioOptions}
            placeholder="Seleccionar servicio..."
          />

          <FormField
            name="grupoId"
            label="Grupo"
            type="select"
            required
            value={formData.grupoId}
            onChange={(e) => onChange({ ...formData, grupoId: e.target.value })}
            options={grupoOptions}
            placeholder="Seleccionar grupo..."
          />

          <FormField
            name="tiquet"
            label="Tiquet CRM"
            type="select"
            value={formData.tiquet}
            onChange={(e) => onChange({ ...formData, tiquet: e.target.value as TiquetValue })}
            options={[
              { value: 'SI', label: 'SI' },
              { value: 'NO', label: 'NO' },
              { value: 'CORD', label: 'CORD' },
              { value: 'ESPACH', label: 'ESPACH' },
            ]}
          />

          <FormField
            name="sala"
            label="Sala"
            type="text"
            value={formData.sala}
            onChange={(e) => onChange({ ...formData, sala: e.target.value })}
            placeholder="Sobreescribir sala predeterminada"
            helperText="Opcional: deja vacío para usar la sala predeterminada"
          />
        </FormSection>

        <FormSection title="Profesionales asignados" description="Selecciona hasta 3 profesionales">
          <FormField
            name="profesionalPrincipalId"
            label="Citar con (Principal)"
            type="select"
            required
            value={formData.profesionalPrincipalId}
            onChange={(e) => onChange({ ...formData, profesionalPrincipalId: e.target.value })}
            options={profesionalOptions}
            placeholder="Seleccionar profesional..."
          />

          <FormField
            name="profesionalSegundaOpcionId"
            label="Segunda Opción"
            type="select"
            value={formData.profesionalSegundaOpcionId}
            onChange={(e) => onChange({ ...formData, profesionalSegundaOpcionId: e.target.value })}
            options={profesionalOptions}
            placeholder="Seleccionar profesional..."
          />

          <FormField
            name="profesionalTerceraOpcionId"
            label="Tercera Opción"
            type="select"
            value={formData.profesionalTerceraOpcionId}
            onChange={(e) => onChange({ ...formData, profesionalTerceraOpcionId: e.target.value })}
            options={profesionalOptions}
            placeholder="Seleccionar profesional..."
          />
        </FormSection>

        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted p-4">
          <FormField
            name="esActual"
            label="Es actual"
            type="checkbox"
            checked={formData.esActual}
            onChange={(e) =>
              onChange({ ...formData, esActual: (e.target as HTMLInputElement).checked })
            }
            fullWidth={false}
          />

          <FormField
            name="requiereApoyo"
            label="Requiere apoyo"
            type="checkbox"
            checked={formData.requiereApoyo}
            onChange={(e) =>
              onChange({ ...formData, requiereApoyo: (e.target as HTMLInputElement).checked })
            }
            fullWidth={false}
          />

          <FormField
            name="supervision"
            label="Supervisión"
            type="checkbox"
            checked={formData.supervision}
            onChange={(e) =>
              onChange({ ...formData, supervision: (e.target as HTMLInputElement).checked })
            }
            fullWidth={false}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-gradient px-6 py-2.5 text-sm">
            Asignar Servicio
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-pill border border-border bg-card px-5 py-2 text-sm font-medium text-text hover:bg-cardHover focus-visible:focus-ring"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
