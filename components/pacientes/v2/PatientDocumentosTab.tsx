'use client';
import { useState, useMemo } from 'react';
import { FileText, Upload, Download, Trash2, Share2, Eye, Search, Grid, List, Folder, Image, FileSpreadsheet, File, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Documento {
  id: string;
  nombre: string;
  tipo: 'informe' | 'consentimiento' | 'receta' | 'imagen' | 'analitica' | 'factura' | 'otro';
  tamaño: number;
  url: string;
  fechaSubida: Date;
  subidoPor: string;
  etiquetas: string[];
}

interface Props {
  documentos: Documento[];
  onUpload?: (files: FileList) => void;
  onDelete?: (id: string) => void;
  onShare?: (id: string) => void;
  onDownload?: (id: string) => void;
  onView?: (id: string) => void;
  readOnlyIds?: string[];
}

const TIPOS_DOCUMENTOS = [
  { value: 'informe', label: 'Informes Médicos', icon: FileText, color: 'blue' },
  { value: 'consentimiento', label: 'Consentimientos', icon: FileText, color: 'green' },
  { value: 'receta', label: 'Recetas', icon: FileText, color: 'purple' },
  { value: 'imagen', label: 'Imágenes', icon: Image, color: 'pink' },
  { value: 'analitica', label: 'Analíticas', icon: FileSpreadsheet, color: 'orange' },
  { value: 'factura', label: 'Facturas', icon: File, color: 'indigo' },
  { value: 'otro', label: 'Otros', icon: File, color: 'gray' }
];

export default function PatientDocumentosTab({
  documentos,
  onUpload,
  onDelete,
  onShare,
  onDownload,
  onView,
  readOnlyIds = [],
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [vistaGrid, setVistaGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const readOnlySet = useMemo(() => new Set(readOnlyIds), [readOnlyIds]);

  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
      const matchBusqueda = doc.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        doc.etiquetas.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
      const matchTipo = tipoFiltro === 'todos' || doc.tipo === tipoFiltro;
      return matchBusqueda && matchTipo;
    });
  }, [documentos, busqueda, tipoFiltro]);

  const documentosPorTipo = useMemo(() => {
    const grupos = TIPOS_DOCUMENTOS.map(tipo => ({
      ...tipo,
      count: documentos.filter(d => d.tipo === tipo.value).length
    }));
    return grupos;
  }, [documentos]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (onUpload && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onUpload && e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  const getIconoTipo = (tipo: string) => {
    const tipoDoc = TIPOS_DOCUMENTOS.find(t => t.value === tipo);
    const IconComponent = tipoDoc?.icon || File;
    return <IconComponent className="w-5 h-5" />;
  };

  const getColorTipo = (tipo: string) => {
    const tipoDoc = TIPOS_DOCUMENTOS.find(t => t.value === tipo);
    return tipoDoc?.color || 'gray';
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-brand-subtle text-brand',
      green: 'bg-success-bg text-success',
      purple: 'bg-accent-bg text-accent',
      pink: 'bg-accent-bg text-accent',
      orange: 'bg-warning-bg text-warning',
      indigo: 'bg-accent-bg text-accent',
      gray: 'bg-muted text-text-muted'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Documentos</h2>
          <p className="text-sm text-text-muted mt-1">{documentos.length} archivos totales</p>
        </div>
        <label className="relative cursor-pointer">
          <input
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <span className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-2xl hover:opacity-90 transition-colors">
            <Upload className="w-4 h-4" />
            Subir archivos
          </span>
        </label>
      </div>

      {/* Zona de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging ? 'border-brand bg-brand-subtle' : 'border-border bg-muted'
        }`}
      >
        <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text font-medium">Arrastra archivos aquí o haz clic para seleccionar</p>
        <p className="text-sm text-text-muted mt-2">Soporta múltiples archivos (PDF, JPG, PNG, DOCX, etc.)</p>
      </div>

      {/* Tipos de documentos */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {documentosPorTipo.map((tipo) => {
          const IconComponent = tipo.icon;
          return (
            <button
              key={tipo.value}
              onClick={() => setTipoFiltro(tipo.value === tipoFiltro ? 'todos' : tipo.value)}
              className={`p-3 rounded-2xl border-2 transition-all ${
                tipoFiltro === tipo.value
                  ? 'border-brand bg-brand-subtle'
                  : 'border-border bg-card hover:border-border'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${getColorClass(tipo.color)} flex items-center justify-center mx-auto mb-2`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-text text-center">{tipo.label.split(' ')[0]}</p>
              <p className="text-xs text-text-muted text-center">{tipo.count}</p>
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda y controles */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por nombre o etiquetas..."
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
        <div className="flex gap-2">
          <button
            onClick={() => setVistaGrid(true)}
            className={`p-2 rounded-2xl border ${
              vistaGrid ? 'bg-brand-subtle border-brand text-brand' : 'bg-card border-border text-text-muted'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setVistaGrid(false)}
            className={`p-2 rounded-2xl border ${
              !vistaGrid ? 'bg-brand-subtle border-brand text-brand' : 'bg-card border-border text-text-muted'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Lista de documentos */}
      {documentosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-2xl border-2 border-dashed border-border">
          <Folder className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <p className="text-text font-medium">
            {busqueda ? 'No se encontraron documentos' : 'No hay documentos'}
          </p>
          <p className="text-sm text-text-muted mt-2">
            {busqueda ? 'Intenta con otros términos de búsqueda' : 'Sube archivos para empezar'}
          </p>
        </div>
      ) : vistaGrid ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentosFiltrados.map((doc) => {
            const isReadOnly = readOnlySet.has(doc.id);
            return (
            <div
              key={doc.id}
              className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-lg ${getColorClass(getColorTipo(doc.tipo))} flex items-center justify-center flex-shrink-0`}>
                  {getIconoTipo(doc.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text truncate" title={doc.nombre}>
                    {doc.nombre}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {formatBytes(doc.tamaño)} • {format(doc.fechaSubida, 'dd MMM yyyy', { locale: es })}
                  </p>
                  <p className="text-xs text-text-muted">Por {doc.subidoPor}</p>
                  {isReadOnly && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-600">Solo lectura</p>
                  )}
                  {doc.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.etiquetas.slice(0, 2).map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-muted text-text-muted text-xs rounded">
                          {tag}
                        </span>
                      ))}
                      {doc.etiquetas.length > 2 && (
                        <span className="px-2 py-0.5 bg-muted text-text-muted text-xs rounded">
                          +{doc.etiquetas.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={() => onView?.(doc.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-brand hover:bg-brand-subtle rounded transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={() => onDownload?.(doc.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-text-muted hover:bg-muted rounded transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onShare?.(doc.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => !isReadOnly && onDelete?.(doc.id)}
                  disabled={isReadOnly}
                  className={`flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded transition-colors ${
                    isReadOnly
                      ? 'text-text-muted bg-muted cursor-not-allowed opacity-60'
                      : 'text-danger hover:bg-danger-bg'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {documentosFiltrados.map((doc) => {
            const isReadOnly = readOnlySet.has(doc.id);
            return (
            <div
              key={doc.id}
              className="p-4 hover:bg-cardHover transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg ${getColorClass(getColorTipo(doc.tipo))} flex items-center justify-center flex-shrink-0`}>
                  {getIconoTipo(doc.tipo)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-text truncate">{doc.nombre}</h3>
                  <p className="text-sm text-text-muted">
                    {formatBytes(doc.tamaño)} • {format(doc.fechaSubida, 'dd MMM yyyy', { locale: es })} • Por {doc.subidoPor}
                  </p>
                  {isReadOnly && (
                    <p className="text-[11px] font-semibold text-amber-600 mt-1">Solo lectura</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView?.(doc.id)}
                    className="p-2 text-brand hover:bg-brand-subtle rounded transition-colors"
                    title="Ver"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload?.(doc.id)}
                    className="p-2 text-text-muted hover:bg-muted rounded transition-colors"
                    title="Descargar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onShare?.(doc.id)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                    title="Compartir"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => !isReadOnly && onDelete?.(doc.id)}
                    disabled={isReadOnly}
                    className={`p-2 rounded transition-colors ${
                      isReadOnly
                        ? 'text-text-muted cursor-not-allowed opacity-60'
                        : 'text-danger hover:bg-danger-bg'
                    }`}
                    title={isReadOnly ? 'Documento de solo lectura' : 'Eliminar'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
}
