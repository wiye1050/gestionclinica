import Link from 'next/link';
import { resolverSeguimientoAction } from '@/app/dashboard/pacientes/actions';
import type { DocumentoPaciente } from './pacientesHelpers';

interface PatientResumenPendientesCardProps {
  pacienteId: string;
  documentos: DocumentoPaciente[];
  seguimientoPendiente: boolean;
}

export default function PatientResumenPendientesCard({
  pacienteId,
  documentos,
  seguimientoPendiente,
}: PatientResumenPendientesCardProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-text-muted">
            Pendientes y documentos
          </p>
          <p className="text-lg font-semibold text-text">Integración con otros módulos</p>
        </div>
        <Link
          href={`/dashboard/pacientes/${pacienteId}`}
          className="text-xs font-semibold text-brand hover:underline"
        >
          Ver ficha completa
        </Link>
      </div>
      {seguimientoPendiente ? (
        <div className="rounded-2xl border border-warn bg-warn-bg/30 px-4 py-3 text-sm">
          <p className="font-semibold text-warn">Seguimiento pendiente</p>
          <p className="text-text">
            Hay tareas de seguimiento registradas en el historial reciente. Revisa la pestaña de
            notas o marca el seguimiento como resuelto.
          </p>
          <form action={resolverSeguimientoAction} className="mt-2">
            <input type="hidden" name="pacienteId" value={pacienteId} />
            <button className="rounded-pill border border-success bg-success-bg px-3 py-1 text-xs font-semibold text-success hover:bg-success-bg/80 focus-visible:focus-ring">
              Marcar seguimiento resuelto
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-text-muted">No hay seguimientos pendientes registrados.</p>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-text-muted">
          Documentos recientes
        </p>
        {documentos.length === 0 ? (
          <p className="text-sm text-text-muted">Sin documentos adjuntos.</p>
        ) : (
          <div className="space-y-2">
            {documentos.slice(0, 3).map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-text">{doc.nombre}</p>
                  <p className="text-xs text-text-muted">
                    {doc.fechaSubida.toLocaleDateString('es-ES')} · {doc.subidoPor}
                  </p>
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Abrir
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
