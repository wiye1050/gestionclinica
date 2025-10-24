'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createProtocolAction } from '../actions';

export default function NuevoProtocoloPage() {
  const [state, formAction, pending] = useActionState(createProtocolAction, {
    success: false,
    error: null as string | null
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Protocolo</h1>
          <p className="text-gray-600 mt-1">Crea un protocolo y publica su primera versión más tarde.</p>
        </div>
        <Link
          href="/dashboard/protocolos"
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancelar
        </Link>
      </header>

      <form action={formAction} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Título</label>
          <input
            name="titulo"
            type="text"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Área</label>
          <select
            name="area"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          >
            <option value="medicina">Medicina</option>
            <option value="fisioterapia">Fisioterapia</option>
            <option value="enfermeria">Enfermería</option>
            <option value="administracion">Administración</option>
            <option value="marketing">Marketing</option>
            <option value="operaciones">Operaciones</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            name="descripcion"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            rows={4}
          />
        </div>
        <div className="flex items-center gap-2">
          <input id="requiereQuiz" name="requiereQuiz" type="checkbox" className="h-4 w-4" />
          <label htmlFor="requiereQuiz" className="text-sm text-gray-700">
            Requiere quiz para confirmar lectura
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Visible para</label>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {['admin', 'coordinacion', 'terapeuta', 'admin_ops', 'marketing', 'invitado'].map((rol) => (
              <label key={rol} className="flex items-center gap-2">
                <input name="visiblePara" type="checkbox" value={rol} defaultChecked={rol !== 'invitado'} />
                <span>{rol}</span>
              </label>
            ))}
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {pending ? 'Guardando…' : 'Crear protocolo'}
        </button>
      </form>
    </div>
  );
}
