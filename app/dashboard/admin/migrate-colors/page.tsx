'use client';

import { useState } from 'react';
import { Play, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function MigrateColorsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const executeMigration = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/migrate-colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.results);
      } else {
        setError(data.error || 'Error desconocido');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Migración de Colores
        </h1>
        <p className="mb-6 text-sm text-gray-600">
          Este script asigna colores por defecto a profesionales y servicios que aún no tienen uno.
        </p>

        <div className="mb-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
          <h2 className="mb-2 text-sm font-semibold text-blue-900">
            ℹ️ ¿Qué hace esta migración?
          </h2>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• Asigna colores rotativos a <strong>profesionales</strong> sin color</li>
            <li>• Asigna colores por categoría a <strong>servicios</strong> sin color</li>
            <li>• No modifica registros que ya tienen color</li>
            <li>• Es segura y puede ejecutarse múltiples veces</li>
          </ul>
        </div>

        {!result && !error && (
          <button
            onClick={executeMigration}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ejecutando migración...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Ejecutar Migración
              </>
            )}
          </button>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">
                  Error en la migración
                </h3>
                <p className="mt-1 text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                <div>
                  <h3 className="text-sm font-semibold text-green-900">
                    ✅ Migración completada exitosamente
                  </h3>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  👨‍⚕️ Profesionales
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actualizados:</span>
                    <span className="font-semibold text-green-600">
                      {result.profesionales.updated}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ya tenían color:</span>
                    <span className="font-semibold text-gray-600">
                      {result.profesionales.skipped}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">
                  🏥 Servicios
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actualizados:</span>
                    <span className="font-semibold text-green-600">
                      {result.servicios.updated}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ya tenían color:</span>
                    <span className="font-semibold text-gray-600">
                      {result.servicios.skipped}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                ← Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
