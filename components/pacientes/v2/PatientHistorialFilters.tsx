import { HISTORIAL_FILTROS, type HistorialFiltro } from './pacientesConstants';

interface PatientHistorialFiltersProps {
  filtro: HistorialFiltro;
  onFiltroChange: (filtro: HistorialFiltro) => void;
  onExportarExcel: () => void;
  onExportarPDF: () => void;
  onCompartirCorreo: () => void;
  compartiendo: boolean;
  historialCount: number;
}

export default function PatientHistorialFilters({
  filtro,
  onFiltroChange,
  onExportarExcel,
  onExportarPDF,
  onCompartirCorreo,
  compartiendo,
  historialCount,
}: PatientHistorialFiltersProps) {
  const hasHistorial = historialCount > 0;

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-text">Historial del paciente</h2>
        <p className="text-sm text-text-muted">
          Registros de atenciones, seguimientos y cambios administrativos.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-text-muted">Mostrar:</span>
        {HISTORIAL_FILTROS.map((filtroItem) => (
          <button
            key={filtroItem.value}
            onClick={() => onFiltroChange(filtroItem.value)}
            className={`rounded-pill px-3 py-1 transition-colors ${
              filtro === filtroItem.value
                ? 'bg-brand text-white'
                : 'bg-muted text-text hover:bg-cardHover'
            }`}
          >
            {filtroItem.label}
          </button>
        ))}
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={onExportarExcel}
            className="rounded-pill border border-success px-3 py-1 text-success hover:bg-success-bg"
            disabled={!hasHistorial}
          >
            Exportar Excel
          </button>
          <button
            onClick={onExportarPDF}
            className="rounded-pill border border-brand px-3 py-1 text-brand hover:bg-brand-subtle"
            disabled={!hasHistorial}
          >
            Exportar PDF
          </button>
          <button
            onClick={onCompartirCorreo}
            className="rounded-pill border border-brand px-3 py-1 text-brand hover:bg-brand-subtle disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasHistorial || compartiendo}
          >
            {compartiendo ? 'Preparando…' : 'Enviar por correo'}
          </button>
        </div>
      </div>
    </div>
  );
}
