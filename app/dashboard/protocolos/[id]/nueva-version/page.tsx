'use client';

import { useParams } from 'next/navigation';
import { useActionState } from 'react';
import Link from 'next/link';
import { createProtocolVersionAction } from '../../actions';

export default function NuevaVersionPage() {
  const params = useParams<{ id: string }>();
  const protocoloId = params?.id ?? '';
  const [state, formAction, pending] = useActionState(createProtocolVersionAction, {
    success: false,
    error: null as string | null
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva versión</h1>
          <p className="text-gray-600 mt-1">Publica una actualización para este protocolo.</p>
        </div>
        <Link
          href={`/dashboard/protocolos/${protocoloId}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </Link>
      </header>

      <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <input type="hidden" name="protocoloId" value={protocoloId} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Contenido (Markdown/HTML)</label>
          <textarea name="contenido" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" rows={12} required />
        </div>
        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {pending ? 'Publicando…' : 'Guardar versión'}
        </button>
      </form>
    </div>
  );
}
