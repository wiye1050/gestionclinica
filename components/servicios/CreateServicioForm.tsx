import type { CatalogoServicio, GrupoPaciente, Profesional } from '@/types';

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
  return (
    <div className="panel-block p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-text">Asignar servicio a grupo</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1">
              Servicio del Catálogo *
            </label>
            <select
              value={formData.catalogoServicioId}
              onChange={(e) => onChange({ ...formData, catalogoServicioId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg text-text"
              required
            >
              <option value="">Seleccionar servicio...</option>
              {catalogoServicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre} ({servicio.tiempoEstimado} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Grupo *</label>
            <select
              value={formData.grupoId}
              onChange={(e) => onChange({ ...formData, grupoId: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
              required
            >
              <option value="">Seleccionar grupo...</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Tiquet CRM</label>
            <select
              value={formData.tiquet}
              onChange={(e) => onChange({ ...formData, tiquet: e.target.value as TiquetValue })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
            >
              <option value="SI">SI</option>
              <option value="NO">NO</option>
              <option value="CORD">CORD</option>
              <option value="ESPACH">ESPACH</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Citar con (Principal) *</label>
            <select
              value={formData.profesionalPrincipalId}
              onChange={(e) =>
                onChange({ ...formData, profesionalPrincipalId: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
              required
            >
              <option value="">Seleccionar profesional...</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Segunda Opción</label>
            <select
              value={formData.profesionalSegundaOpcionId}
              onChange={(e) =>
                onChange({ ...formData, profesionalSegundaOpcionId: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
            >
              <option value="">Seleccionar profesional...</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Tercera Opción</label>
            <select
              value={formData.profesionalTerceraOpcionId}
              onChange={(e) =>
                onChange({ ...formData, profesionalTerceraOpcionId: e.target.value })
              }
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
            >
              <option value="">Seleccionar profesional...</option>
              {profesionales.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} {prof.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1">Sala (opcional)</label>
            <input
              type="text"
              value={formData.sala}
              onChange={(e) => onChange({ ...formData, sala: e.target.value })}
              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-text focus-visible:focus-ring"
              placeholder="Sobreescribir sala predeterminada"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.esActual}
              onChange={(e) => onChange({ ...formData, esActual: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-text">Es actual</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.requiereApoyo}
              onChange={(e) => onChange({ ...formData, requiereApoyo: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-text">Requiere apoyo</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.supervision}
              onChange={(e) => onChange({ ...formData, supervision: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <span className="text-sm text-text">Supervisión</span>
          </label>
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
