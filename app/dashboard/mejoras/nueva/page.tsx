'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { crearMejoraAction } from '../actions';

export default function NuevaMejoraPage() {
  const [state, formAction, pending] = useActionState(crearMejoraAction, {
    success: false,
    error: null as string | null
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva mejora</h1>
          <p className="text-gray-600 mt-1">Registra una oportunidad de mejora y calcula su impacto.</p>
        </div>
        <Link
          href="/dashboard/mejoras"
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </Link>
      </header>

      <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input name="titulo" type="text" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea name="descripcion" rows={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Área</label>
          <select name="area" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
            <option value="salas">Salas</option>
            <option value="equipos">Equipos</option>
            <option value="procedimientos">Procedimientos</option>
            <option value="software">Software</option>
            <option value="comunicacion">Comunicación</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reach</label>
            <input name="reach" type="number" min={0} defaultValue={0} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Impact</label>
            <input name="impact" type="number" min={0} max={10} defaultValue={5} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confidence (%)</label>
            <input name="confidence" type="number" min={0} max={100} defaultValue={80} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Effort</label>
            <input name="effort" type="number" min={1} defaultValue={1} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>
        {state.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-blue-600 px-4 py-2 text-text hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {pending ? 'Guardando…' : 'Crear mejora'}
        </button>
      </form>
    </div>
  );
}
