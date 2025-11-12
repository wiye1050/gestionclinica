'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, Package, Lightbulb, ClipboardList, ArrowRight } from 'lucide-react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SearchResult {
  id: string;
  type: 'paciente' | 'servicio' | 'protocolo' | 'mejora' | 'inventario' | 'navegacion';
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

const NAVIGATION_LINKS: SearchResult[] = [
    {
      id: 'nav-pacientes',
      type: 'navegacion',
      title: 'Pacientes',
      subtitle: 'Ver todos los pacientes',
      url: '/dashboard/pacientes',
      icon: <Users className="w-5 h-5 text-blue-600" />
    },
    {
      id: 'nav-servicios',
      type: 'navegacion',
      title: 'Servicios',
      subtitle: 'Gestionar servicios asignados',
      url: '/dashboard/servicios',
      icon: <ClipboardList className="w-5 h-5 text-purple-600" />
    },
    {
      id: 'nav-protocolos',
      type: 'navegacion',
      title: 'Protocolos',
      subtitle: 'Ver protocolos clínicos',
      url: '/dashboard/protocolos',
      icon: <FileText className="w-5 h-5 text-green-600" />
    },
    {
      id: 'nav-inventario',
      type: 'navegacion',
      title: 'Inventario',
      subtitle: 'Control de stock',
      url: '/dashboard/inventario',
      icon: <Package className="w-5 h-5 text-orange-600" />
    },
    {
      id: 'nav-mejoras',
      type: 'navegacion',
      title: 'Mejoras',
      subtitle: 'Propuestas de mejora',
      url: '/dashboard/mejoras',
      icon: <Lightbulb className="w-5 h-5 text-yellow-600" />
    },
    {
      id: 'nav-nuevo-paciente',
      type: 'navegacion',
      title: 'Nuevo paciente',
      subtitle: 'Crear ficha de paciente',
      url: '/dashboard/pacientes/nuevo',
      icon: <Users className="w-5 h-5 text-blue-600" />
    }
  ]

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleSelect = useCallback((result: SearchResult) => {
    router.push(result.url);
    onClose();
  }, [onClose, router]);

  // Buscar en Firestore
  const performSearch = useCallback(async (term: string) => {
    if (term.length < 2) {
      setResults(NAVIGATION_LINKS);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    const lowerTerm = term.toLowerCase();

    try {
      // Buscar pacientes
      const pacientesSnap = await getDocs(query(collection(db, 'pacientes'), limit(50)));
      pacientesSnap.docs.forEach((doc) => {
        const data = doc.data();
        const nombre = `${data.nombre} ${data.apellidos}`.toLowerCase();
        const dni = data.documentoId?.toLowerCase() || '';
        
        if (nombre.includes(lowerTerm) || dni.includes(lowerTerm)) {
          searchResults.push({
            id: doc.id,
            type: 'paciente',
            title: `${data.nombre} ${data.apellidos}`,
            subtitle: data.documentoId || 'Sin documento',
            url: `/dashboard/pacientes/${doc.id}`,
            icon: <Users className="w-5 h-5 text-blue-600" />
          });
        }
      });

      // Buscar protocolos
      const protocolosSnap = await getDocs(query(collection(db, 'protocolos'), limit(50)));
      protocolosSnap.docs.forEach((doc) => {
        const data = doc.data();
        const titulo = data.titulo?.toLowerCase() || '';
        
        if (titulo.includes(lowerTerm)) {
          searchResults.push({
            id: doc.id,
            type: 'protocolo',
            title: data.titulo,
            subtitle: data.area || 'Sin área',
            url: `/dashboard/protocolos/${doc.id}`,
            icon: <FileText className="w-5 h-5 text-green-600" />
          });
        }
      });

      // Buscar mejoras
      const mejorasSnap = await getDocs(query(collection(db, 'mejoras'), limit(50)));
      mejorasSnap.docs.forEach((doc) => {
        const data = doc.data();
        const titulo = data.titulo?.toLowerCase() || '';
        
        if (titulo.includes(lowerTerm)) {
          searchResults.push({
            id: doc.id,
            type: 'mejora',
            title: data.titulo,
            subtitle: `${data.area} - RICE: ${data.rice?.score?.toFixed(1) || 'N/A'}`,
            url: `/dashboard/mejoras/${doc.id}`,
            icon: <Lightbulb className="w-5 h-5 text-yellow-600" />
          });
        }
      });

      // Buscar inventario (vía API)
      try {
        const response = await fetch('/api/inventario?limit=50');
        const inventario = await response.json();
        if (response.ok && Array.isArray(inventario?.productos)) {
          inventario.productos.forEach((item: { id: string; nombre?: string; stock?: number }) => {
            const nombre = item.nombre?.toLowerCase() ?? '';
            if (nombre.includes(lowerTerm)) {
              searchResults.push({
                id: item.id,
                type: 'inventario',
                title: item.nombre ?? 'Producto',
                subtitle: `Stock: ${item.stock ?? 0}`,
                url: '/dashboard/inventario',
                icon: <Package className="w-5 h-5 text-orange-600" />,
              });
            }
          });
        }
      } catch (error) {
        console.warn('[global-search] No se pudo consultar el inventario', error);
      }

      // Agregar enlaces de navegación que coincidan
      const matchingNav = NAVIGATION_LINKS.filter(link =>
        link.title.toLowerCase().includes(lowerTerm) ||
        link.subtitle?.toLowerCase().includes(lowerTerm)
      );

      setResults([...searchResults.slice(0, 10), ...matchingNav]);
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        performSearch(searchTerm);
      } else {
        setResults(NAVIGATION_LINKS);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelect, isOpen, onClose, results, selectedIndex]);

  // Resetear al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setResults(NAVIGATION_LINKS);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl px-4">
        <div className="rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/10 dark:bg-gray-800 dark:ring-gray-700">
          {/* Input */}
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-700">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pacientes, protocolos, servicios..."
              className="flex-1 border-0 bg-transparent py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 dark:text-white dark:placeholder-gray-500"
              autoFocus
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-xs font-sans text-gray-400 dark:border-gray-700">
              ESC
            </kbd>
          </div>

          {/* Resultados */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Buscando...
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No se encontraron resultados
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {result.icon}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline">
                <kbd className="rounded border border-gray-200 px-1.5 py-0.5 dark:border-gray-700">↑↓</kbd> navegar
              </span>
              <span>
                <kbd className="rounded border border-gray-200 px-1.5 py-0.5 dark:border-gray-700">Enter</kbd> seleccionar
              </span>
            </div>
            <span>{results.length} resultados</span>
          </div>
        </div>
      </div>
    </>
  );
}
