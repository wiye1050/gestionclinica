'use client';
import { useState, useMemo, useCallback } from 'react';
import { FileText, Euro, Clock, CheckCircle2, AlertCircle, Calendar, Send, Download, Eye, Plus, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { PacienteFactura, PacientePresupuesto } from '@/types';

interface Props {
  facturas: PacienteFactura[];
  presupuestos: PacientePresupuesto[];
  onNuevaFactura?: () => void;
  onNuevoPresupuesto?: () => void;
  onVerFactura?: (id: string) => void;
  onEnviarFactura?: (id: string) => void;
  onDescargarPDF?: (id: string) => void;
  onRegistrarPago?: (id: string) => void;
}

export default function PatientFacturacionTab({
  facturas,
  presupuestos,
  onNuevaFactura,
  onNuevoPresupuesto,
  onVerFactura,
  onEnviarFactura,
  onDescargarPDF,
  onRegistrarPago
}: Props) {
  const [vistaActiva, setVistaActiva] = useState<'facturas' | 'presupuestos'>('facturas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
      }),
    []
  );
  const formatCurrency = useCallback((amount: number) => currencyFormatter.format(amount), [currencyFormatter]);

  const resumenFinanciero = useMemo(() => {
    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0);
    const totalPagado = facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.pagado, 0);
    const totalPendiente = facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + (f.total - f.pagado), 0);
    const totalVencido = facturas.filter(f => f.estado === 'vencida').reduce((sum, f) => sum + (f.total - f.pagado), 0);

    return { totalFacturado, totalPagado, totalPendiente, totalVencido };
  }, [facturas]);

  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      const matchEstado = filtroEstado === 'todos' || f.estado === filtroEstado;
      const matchBusqueda = f.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        f.concepto.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [facturas, filtroEstado, busqueda]);

  const presupuestosFiltrados = useMemo(() => {
    return presupuestos.filter(p => {
      const matchEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
      const matchBusqueda = p.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.concepto.toLowerCase().includes(busqueda.toLowerCase());
      return matchEstado && matchBusqueda;
    });
  }, [presupuestos, filtroEstado, busqueda]);

  const getEstadoFacturaColor = (estado: string) => {
    switch (estado) {
      case 'pagada': return 'bg-success-bg text-success border-success';
      case 'pendiente': return 'bg-warning-bg text-warning border-warning';
      case 'vencida': return 'bg-danger-bg text-danger border-danger';
      default: return 'bg-muted text-text-muted border-border';
    }
  };

  const getEstadoPresupuestoColor = (estado: string) => {
    switch (estado) {
      case 'aceptado': return 'bg-success-bg text-success border-success';
      case 'pendiente': return 'bg-warning-bg text-warning border-warning';
      case 'rechazado': return 'bg-danger-bg text-danger border-danger';
      case 'caducado': return 'bg-muted text-text-muted border-border';
      default: return 'bg-muted text-text-muted border-border';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pagada':
      case 'aceptado':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'vencida':
      case 'rechazado':
        return <AlertCircle className="w-4 h-4" />;
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const safeFormatDate = (date?: Date | null) =>
    date ? format(date, 'dd MMM yyyy', { locale: es }) : 'Sin fecha';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Facturación</h2>
          <p className="text-sm text-text-muted mt-1">Gestión de facturas y presupuestos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onNuevaFactura}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-2xl hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Factura
          </button>
          <button
            onClick={onNuevoPresupuesto}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-text rounded-2xl hover:bg-cardHover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Presupuesto
          </button>
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-brand-subtle border border-brand rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-brand font-medium">Total Facturado</p>
              <p className="text-2xl font-bold text-brand mt-1">
                {formatCurrency(resumenFinanciero.totalFacturado)}
              </p>
            </div>
            <Euro className="w-8 h-8 text-brand opacity-50" />
          </div>
        </div>

        <div className="bg-success-bg border border-success rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-success font-medium">Pagado</p>
              <p className="text-2xl font-bold text-success mt-1">
                {formatCurrency(resumenFinanciero.totalPagado)}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
          </div>
        </div>

        <div className="bg-warning-bg border border-warning rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-warning font-medium">Pendiente</p>
              <p className="text-2xl font-bold text-warning mt-1">
                {formatCurrency(resumenFinanciero.totalPendiente)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-warning opacity-50" />
          </div>
        </div>

        <div className="bg-danger-bg border border-danger rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-danger font-medium">Vencido</p>
              <p className="text-2xl font-bold text-danger mt-1">
                {formatCurrency(resumenFinanciero.totalVencido)}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-danger opacity-50" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setVistaActiva('facturas')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            vistaActiva === 'facturas'
              ? 'text-brand'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Facturas
          {vistaActiva === 'facturas' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
        </button>
        <button
          onClick={() => setVistaActiva('presupuestos')}
          className={`px-4 py-2 font-medium transition-colors relative ${
            vistaActiva === 'presupuestos'
              ? 'text-brand'
              : 'text-text-muted hover:text-text'
          }`}
        >
          Presupuestos
          {vistaActiva === 'presupuestos' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand" />
          )}
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por número o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-2xl focus-visible:focus-ring"
          />
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
              filtroEstado === 'todos'
                ? 'bg-brand text-white'
                : 'bg-muted text-text hover:bg-cardHover'
            }`}
          >
            Todos
          </button>
          {vistaActiva === 'facturas' ? (
            <>
              <button
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  filtroEstado === 'pendiente'
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => setFiltroEstado('pagada')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  filtroEstado === 'pagada'
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                Pagada
              </button>
              <button
                onClick={() => setFiltroEstado('vencida')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  filtroEstado === 'vencida'
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                Vencida
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setFiltroEstado('pendiente')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filtroEstado === 'pendiente'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendiente
              </button>
              <button
                onClick={() => setFiltroEstado('aceptado')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  filtroEstado === 'aceptado'
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                Aceptado
              </button>
              <button
                onClick={() => setFiltroEstado('rechazado')}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                  filtroEstado === 'rechazado'
                    ? 'bg-brand text-white'
                    : 'bg-muted text-text hover:bg-cardHover'
                }`}
              >
                Rechazado
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lista de facturas */}
      {vistaActiva === 'facturas' && (
        <div className="space-y-3">
          {facturasFiltradas.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-2xl border-2 border-dashed border-border">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text font-medium">No hay facturas</p>
              <p className="text-sm text-text-muted mt-2">Las facturas aparecerán aquí</p>
            </div>
          ) : (
            facturasFiltradas.map((factura) => (
              <div
                key={factura.id}
                className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">{factura.numero}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getEstadoFacturaColor(factura.estado)}`}>
                        {getEstadoIcon(factura.estado)}
                        {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                      </span>
                    </div>
                    <p className="text-text mb-3">{factura.concepto}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Emitida: {safeFormatDate(factura.fecha)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Vence: {safeFormatDate(factura.vencimiento)}
                      </div>
                      {factura.fechaPago && (
                        <div className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="w-4 h-4" />
                          Pagada: {safeFormatDate(factura.fechaPago)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-text">{formatCurrency(factura.total)}</p>
                    {factura.estado !== 'pagada' && factura.pagado > 0 && (
                      <p className="text-sm text-text-muted mt-1">
                        Pagado: {formatCurrency(factura.pagado)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => onVerFactura?.(factura.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand-subtle rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => onDescargarPDF?.(factura.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:bg-muted rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => onEnviarFactura?.(factura.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                  {factura.estado !== 'pagada' && (
                    <button
                      onClick={() => onRegistrarPago?.(factura.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-success hover:bg-success-bg rounded transition-colors ml-auto"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Registrar Pago
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Lista de presupuestos */}
      {vistaActiva === 'presupuestos' && (
        <div className="space-y-3">
          {presupuestosFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-muted rounded-2xl border-2 border-dashed border-border">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text font-medium">No hay presupuestos</p>
              <p className="text-sm text-text-muted mt-2">Los presupuestos aparecerán aquí</p>
            </div>
          ) : (
            presupuestosFiltrados.map((presupuesto) => (
              <div
                key={presupuesto.id}
                className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text">{presupuesto.numero}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getEstadoPresupuestoColor(presupuesto.estado)}`}>
                        {getEstadoIcon(presupuesto.estado)}
                        {presupuesto.estado.charAt(0).toUpperCase() + presupuesto.estado.slice(1)}
                      </span>
                    </div>
                    <p className="text-text mb-3">{presupuesto.concepto}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Emitido: {safeFormatDate(presupuesto.fecha)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Válido hasta: {safeFormatDate(presupuesto.validoHasta)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-text">{formatCurrency(presupuesto.total)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => onVerFactura?.(presupuesto.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand-subtle rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => onDescargarPDF?.(presupuesto.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => onEnviarFactura?.(presupuesto.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Enviar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
