'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { logger } from '@/lib/utils/logger';

interface PacienteImport {
  numeroHistoria: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  email?: string;
  fechaNacimiento?: string;
  documentoId?: string;
  genero?: string;
  direccion?: string;
  codigoPostal?: string;
  ciudad?: string;
}

interface ImportResult {
  total: number;
  importados: number;
  errores: Array<{ nhc: string; error: string }>;
  duplicados: string[];
}

/**
 * Parsea el nombre completo en formato "APELLIDOS, NOMBRE"
 */
function parseNombreCompleto(valor: string): { nombre: string; apellidos: string } {
  if (!valor || !valor.trim()) {
    return { nombre: '', apellidos: '' };
  }

  const partes = valor.split(',');
  if (partes.length >= 2) {
    return {
      apellidos: partes[0].trim(),
      nombre: partes.slice(1).join(',').trim(),
    };
  }

  // Si no hay coma, intentar separar por espacios (último es nombre)
  const palabras = valor.trim().split(/\s+/);
  if (palabras.length > 1) {
    return {
      nombre: palabras[palabras.length - 1],
      apellidos: palabras.slice(0, -1).join(' '),
    };
  }

  return { nombre: valor.trim(), apellidos: '' };
}

/**
 * Mapea género del CSV al formato de la aplicación
 */
function mapGenero(valor?: string): 'masculino' | 'femenino' | 'otro' | 'no-especificado' {
  if (!valor) return 'no-especificado';
  const lower = valor.toLowerCase().trim();
  if (lower === 'hombre' || lower === 'masculino' || lower === 'm') return 'masculino';
  if (lower === 'mujer' || lower === 'femenino' || lower === 'f') return 'femenino';
  return 'no-especificado';
}

/**
 * Limpia y normaliza un teléfono
 */
function limpiarTelefono(valor?: string): string {
  if (!valor) return '';
  // Eliminar todo excepto números y +
  return valor.replace(/[^\d+]/g, '');
}

/**
 * Parsea CSV con delimitador ;
 */
function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ';' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

export default function ImportarPacientesPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PacienteImport[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Cargar roles del usuario
  useEffect(() => {
    async function loadUserRoles() {
      if (!user?.uid) {
        setLoadingRoles(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const roles = userData?.roles;
          const role = userData?.role; // Campo singular alternativo

          // Verificar si es admin en diferentes formatos
          let hasAdmin = false;

          if (Array.isArray(roles)) {
            hasAdmin = roles.includes('admin');
          } else if (typeof roles === 'string') {
            hasAdmin = roles === 'admin';
          } else if (typeof role === 'string') {
            hasAdmin = role === 'admin';
          }

          setIsAdmin(hasAdmin);
        }
      } catch (error) {
        logger.error('Error loading user roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    }

    loadUserRoles();
  }, [user?.uid]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);
    setParseError(null);

    try {
      const content = await selectedFile.text();
      const rows = parseCSV(content);

      if (rows.length < 2) {
        setParseError('El archivo debe contener al menos una fila de datos además de los encabezados');
        return;
      }

      // Encontrar índices de columnas basados en encabezados
      const headers = rows[0].map((h) => h.toLowerCase().replace(/['"]/g, '').trim());

      const colIndices = {
        nhc: headers.findIndex((h) => h.includes('núm') || h === 'num' || h === 'nhc'),
        nombre: headers.findIndex((h) => h.includes('apellidos') || h.includes('nombre')),
        sexo: headers.findIndex((h) => h === 'sexo' || h === 'género' || h === 'genero'),
        dni: headers.findIndex((h) => h === 'dni' || h.includes('documento')),
        telefono: headers.findIndex((h) => h.includes('teléfono') || h.includes('telefono')),
        email: headers.findIndex((h) => h === 'email' || h.includes('correo')),
        direccion: headers.findIndex((h) => h.includes('domicilio') || h.includes('dirección')),
        cp: headers.findIndex((h) => h === 'cp' || h.includes('postal')),
        poblacion: headers.findIndex((h) => h.includes('poblacion') || h.includes('ciudad')),
      };

      if (colIndices.nhc === -1 || colIndices.nombre === -1) {
        setParseError(
          'No se encontraron las columnas requeridas (Núm. y Apellidos/Nombre). ' +
            `Columnas encontradas: ${headers.join(', ')}`
        );
        return;
      }

      const pacientes: PacienteImport[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const nhc = row[colIndices.nhc]?.replace(/['"]/g, '').trim();
        const nombreCompleto = row[colIndices.nombre]?.replace(/['"]/g, '').trim();

        if (!nhc || !nombreCompleto) continue;

        const { nombre, apellidos } = parseNombreCompleto(nombreCompleto);

        if (!nombre && !apellidos) continue;

        pacientes.push({
          numeroHistoria: nhc,
          nombre: nombre || 'Sin nombre',
          apellidos: apellidos || '',
          telefono: colIndices.telefono >= 0 ? limpiarTelefono(row[colIndices.telefono]) : undefined,
          email: colIndices.email >= 0 ? row[colIndices.email]?.replace(/['"]/g, '').trim() : undefined,
          documentoId: colIndices.dni >= 0 ? row[colIndices.dni]?.replace(/['"]/g, '').trim() : undefined,
          genero: colIndices.sexo >= 0 ? mapGenero(row[colIndices.sexo]) : undefined,
          direccion: colIndices.direccion >= 0 ? row[colIndices.direccion]?.replace(/['"]/g, '').trim() : undefined,
          codigoPostal: colIndices.cp >= 0 ? row[colIndices.cp]?.replace(/['"]/g, '').trim() : undefined,
          ciudad: colIndices.poblacion >= 0 ? row[colIndices.poblacion]?.replace(/['"]/g, '').trim() : undefined,
        });
      }

      if (pacientes.length === 0) {
        setParseError('No se encontraron pacientes válidos en el archivo');
        return;
      }

      setPreview(pacientes);
    } catch (error) {
      logger.error('Error parsing CSV:', error);
      setParseError('Error al leer el archivo CSV');
    }
  }, []);

  const handleImport = async () => {
    if (preview.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/pacientes/importar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pacientes: preview }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al importar');
      }

      setResult(data);

      if (data.importados > 0) {
        toast.success(`${data.importados} pacientes importados correctamente`);
      }

      if (data.duplicados?.length > 0) {
        toast.warning(`${data.duplicados.length} pacientes ya existían (se omitieron)`);
      }
    } catch (error) {
      logger.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar pacientes');
    } finally {
      setImporting(false);
    }
  };

  if (loadingRoles) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
        Verificando permisos...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
        Solo los administradores pueden importar pacientes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Importar pacientes</h1>
          <p className="mt-1 text-gray-600">
            Importa pacientes desde un archivo CSV exportado de Clinic Cloud.
          </p>
        </div>
        <Link
          href="/dashboard/pacientes"
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
        >
          Volver
        </Link>
      </header>

      {/* Instrucciones */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Instrucciones</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <p>El archivo CSV debe contener las siguientes columnas:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong>Núm.</strong> - Número de historia clínica (requerido)
            </li>
            <li>
              <strong>Apellidos, Nombre</strong> - Nombre completo del paciente (requerido)
            </li>
            <li>
              <strong>Sexo</strong> - Género del paciente
            </li>
            <li>
              <strong>DNI</strong> - Documento de identidad
            </li>
            <li>
              <strong>Teléfono</strong> - Número de teléfono
            </li>
            <li>
              <strong>Email</strong> - Correo electrónico
            </li>
            <li>
              <strong>Domicilio, CP, Poblacion</strong> - Dirección
            </li>
          </ul>
          <p className="mt-4 text-amber-600">
            Los pacientes con NHC duplicados serán omitidos. El contador de NHC se actualizará
            automáticamente al valor más alto importado.
          </p>
        </div>
      </section>

      {/* Selector de archivo */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Seleccionar archivo</h2>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            Archivo seleccionado: <strong>{file.name}</strong>
          </p>
        )}
        {parseError && (
          <p className="mt-2 text-sm text-red-600">{parseError}</p>
        )}
      </section>

      {/* Preview */}
      {preview.length > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Vista previa ({preview.length} pacientes)
            </h2>
            <button
              onClick={handleImport}
              disabled={importing}
              className="rounded-lg bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {importing ? 'Importando...' : 'Importar pacientes'}
            </button>
          </div>

          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    NHC
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Apellidos
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    DNI
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Teléfono
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {preview.slice(0, 100).map((paciente, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-brand">
                      {paciente.numeroHistoria}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                      {paciente.nombre}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-900">
                      {paciente.apellidos}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                      {paciente.documentoId || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                      {paciente.telefono || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm text-gray-500">
                      {paciente.email || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 100 && (
              <p className="mt-2 text-center text-sm text-gray-500">
                Mostrando 100 de {preview.length} pacientes
              </p>
            )}
          </div>
        </section>
      )}

      {/* Resultados */}
      {result && (
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resultado de la importación</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Total procesados</p>
              <p className="text-2xl font-bold text-gray-900">{result.total}</p>
            </div>
            <div className="rounded-lg bg-success-bg p-4">
              <p className="text-sm text-success">Importados</p>
              <p className="text-2xl font-bold text-success">{result.importados}</p>
            </div>
            <div className="rounded-lg bg-warn-bg p-4">
              <p className="text-sm text-warn">Duplicados (omitidos)</p>
              <p className="text-2xl font-bold text-warn">{result.duplicados.length}</p>
            </div>
            <div className="rounded-lg bg-danger-bg p-4">
              <p className="text-sm text-danger">Errores</p>
              <p className="text-2xl font-bold text-danger">{result.errores.length}</p>
            </div>
          </div>

          {result.duplicados.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">
                NHCs duplicados (ya existían en el sistema):
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {result.duplicados.slice(0, 20).join(', ')}
                {result.duplicados.length > 20 && ` ... y ${result.duplicados.length - 20} más`}
              </p>
            </div>
          )}

          {result.errores.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Errores:</p>
              <ul className="mt-1 text-sm text-red-600">
                {result.errores.slice(0, 10).map((err, i) => (
                  <li key={i}>
                    NHC {err.nhc}: {err.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
