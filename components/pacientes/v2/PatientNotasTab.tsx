'use client';
import { useState, useMemo } from 'react';
import { StickyNote, Plus, Search, Filter, User, Calendar, Lock, Users, X, Tag, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Nota {
  id: string;
  titulo: string;
  contenido: string;
  categoria: 'clinica' | 'comunicacion' | 'alerta' | 'administrativa';
  autor: string;
  fecha: Date;
  esPrivada: boolean;
  etiquetas: string[];
}

interface Props {
  notas: Nota[];
  onNuevaNota?: () => void;
  onEditarNota?: (id: string) => void;
  onEliminarNota?: (id: string) => void;
}

const CATEGORIAS = [
  { value: 'clinica', label: 'Clínicas', color: 'blue', icon: StickyNote },
  { value: 'comunicacion', label: 'Comunicaciones', color: 'purple', icon: Users },
  { value: 'alerta', label: 'Alertas', color: 'red', icon: Filter },
  { value: 'administrativa', label: 'Administrativas', color: 'gray', icon: Tag }
];

export default function PatientNotasTab({
  notas,
  onNuevaNota,
  onEditarNota,
  onEliminarNota
}: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas');
  const [soloPrivadas, setSoloPrivadas] = useState(false);

  const notasFiltradas = useMemo(() => {
    return notas.filter(nota => {
      const matchBusqueda = nota.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        nota.contenido.toLowerCase().includes(busqueda.toLowerCase()) ||
        nota.etiquetas.some(tag => tag.toLowerCase().includes(busqueda.toLowerCase()));
      const matchCategoria = categoriaFiltro === 'todas' || nota.categoria === categoriaFiltro;
      const matchPrivada = !soloPrivadas || nota.esPrivada;
      return matchBusqueda && matchCategoria && matchPrivada;
    });
  }, [notas, busqueda, categoriaFiltro, soloPrivadas]);

  const notasPorCategoria = useMemo(() => {
    return CATEGORIAS.map(cat => ({
      ...cat,
      count: notas.filter(n => n.categoria === cat.value).length
    }));
  }, [notas]);

  const getCategoriaColor = (categoria: string) => {
    const cat = CATEGORIAS.find(c => c.value === categoria);
    return cat?.color || 'gray';
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-brand-subtle text-brand border-brand',
      purple: 'bg-accent-bg text-accent border-accent',
      red: 'bg-danger-bg text-danger border-danger',
      gray: 'bg-muted text-text-muted border-border'
    };
    return colorMap[color] || colorMap.gray;
  };

  const getColorBadge = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-brand',
      purple: 'bg-accent',
      red: 'bg-danger',
      gray: 'bg-muted'
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text">Notas</h2>
          <p className="text-sm text-text-muted mt-1">{notas.length} notas totales</p>
        </div>
        <button
          onClick={onNuevaNota}
          className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-2xl hover:opacity-90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Nota
        </button>
      </div>

      {/* Categorías */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {notasPorCategoria.map((cat) => {
          const IconComponent = cat.icon;
          return (
            <button
              key={cat.value}
              onClick={() => setCategoriaFiltro(cat.value === categoriaFiltro ? 'todas' : cat.value)}
              className={`p-4 rounded-2xl border-2 transition-all ${
                categoriaFiltro === cat.value
                  ? 'border-brand bg-brand-subtle'
                  : 'border-border bg-card hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-lg ${getColorClass(cat.color)} flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-text">{cat.label}</p>
                  <p className="text-xs text-text-muted">{cat.count} notas</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar en notas, etiquetas..."
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
        <button
          onClick={() => setSoloPrivadas(!soloPrivadas)}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-colors ${
            soloPrivadas
              ? 'bg-brand-subtle border-brand text-brand'
              : 'bg-card border-border text-text hover:bg-cardHover'
          }`}
        >
          <Lock className="w-4 h-4" />
          Solo privadas
        </button>
      </div>

      {/* Timeline de notas */}
      <div className="space-y-4">
        {notasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-2xl border-2 border-dashed border-border">
            <StickyNote className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text font-medium">
              {busqueda ? 'No se encontraron notas' : 'No hay notas'}
            </p>
            <p className="text-sm text-text-muted mt-2">
              {busqueda ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera nota'}
            </p>
          </div>
        ) : (
          notasFiltradas.map((nota, index) => (
            <div key={nota.id} className="relative">
              {/* Línea del timeline */}
              {index < notasFiltradas.length - 1 && (
                <div className="absolute left-5 top-12 w-0.5 h-full bg-border" />
              )}
              
              <div className="flex gap-4">
                {/* Círculo del timeline con color de categoría */}
                <div className="relative flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${getColorBadge(getCategoriaColor(nota.categoria))} flex items-center justify-center z-10 relative`}>
                    {nota.esPrivada ? (
                      <Lock className="w-5 h-5 text-white" />
                    ) : (
                      <StickyNote className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Contenido de la nota */}
                <div className="flex-1 bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-text">{nota.titulo}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getColorClass(getCategoriaColor(nota.categoria))}`}>
                          {CATEGORIAS.find(c => c.value === nota.categoria)?.label}
                        </span>
                        {nota.esPrivada && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-text-muted border border-border flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Privada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {nota.autor}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(nota.fecha, 'dd MMM yyyy, HH:mm', { locale: es })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditarNota?.(nota.id)}
                        className="p-2 text-text-muted hover:bg-muted rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEliminarNota?.(nota.id)}
                        className="p-2 text-danger hover:bg-danger-bg rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none text-text mb-3">
                    {nota.contenido.split('\n').map((linea, i) => (
                      <p key={i} className={i > 0 ? 'mt-2' : ''}>{linea}</p>
                    ))}
                  </div>

                  {nota.etiquetas.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                      {nota.etiquetas.map((etiqueta, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-muted text-text-muted text-xs rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {etiqueta}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
