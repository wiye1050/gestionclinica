// components/pacientes/v2/PatientFacturacionTab.tsx
// Tab de facturación (temporal hasta implementar módulo de facturación)

import { DollarSign, FileText, AlertCircle } from 'lucide-react';

// TODO: Crear interfaces apropiadas cuando se implemente facturación
interface Factura {
  id: string;
  numero: string;
  fecha: Date;
  monto: number;
  estado: 'pagada' | 'pendiente' | 'vencida';
  concepto: string;
}

interface Presupuesto {
  id: string;
  fecha: Date;
  monto: number;
  estado: 'pendiente' | 'aceptado' | 'rechazado';
  descripcion: string;
}

interface PatientFacturacionTabProps {
  facturas: Factura[];
  presupuestos: Presupuesto[];
}

export default function PatientFacturacionTab({ facturas, presupuestos }: PatientFacturacionTabProps) {
  const totalPendiente = facturas
    .filter((f) => f.estado === 'pendiente' || f.estado === 'vencida')
    .reduce((sum, f) => sum + f.monto, 0);

  const totalPagado = facturas.filter((f) => f.estado === 'pagada').reduce((sum, f) => sum + f.monto, 0);

  return (
    <div className="space-y-6">
      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Pagado</p>
              <p className="text-2xl font-bold text-green-600">{totalPagado.toFixed(2)} €</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pendiente</p>
              <p className="text-2xl font-bold text-yellow-600">{totalPendiente.toFixed(2)} €</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Facturas</p>
              <p className="text-2xl font-bold text-gray-900">{facturas.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Facturas */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Facturas</h3>
        {facturas.length > 0 ? (
          <div className="space-y-3">
            {facturas.map((factura) => (
              <div key={factura.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Factura #{factura.numero}</p>
                    <p className="text-sm text-gray-600">{factura.concepto}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {factura.fecha.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{factura.monto.toFixed(2)} €</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-medium mt-1 ${
                        factura.estado === 'pagada'
                          ? 'bg-green-100 text-green-700'
                          : factura.estado === 'vencida'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {factura.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay facturas registradas</p>
            <p className="text-xs text-gray-400 mt-2">
              El módulo de facturación estará disponible próximamente
            </p>
          </div>
        )}
      </div>

      {/* Presupuestos */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Presupuestos</h3>
        {presupuestos.length > 0 ? (
          <div className="space-y-3">
            {presupuestos.map((presupuesto) => (
              <div key={presupuesto.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{presupuesto.descripcion}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {presupuesto.fecha.toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{presupuesto.monto.toFixed(2)} €</p>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-full font-medium mt-1 ${
                        presupuesto.estado === 'aceptado'
                          ? 'bg-green-100 text-green-700'
                          : presupuesto.estado === 'rechazado'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {presupuesto.estado}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay presupuestos registrados</p>
        )}
      </div>
    </div>
  );
}
