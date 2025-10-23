/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ServicioAsignado, Profesional, GrupoPaciente, CatalogoServicio } from '@/types';
import { Plus, Filter, Users, UserCheck, Clock, CheckSquare, Square, Trash2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ServiciosPage() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<ServicioAsignado[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [grupos, setGrupos] = useState<GrupoPaciente[]>([]);
  const [catalogoServicios, setCatalogoServicios] = useState<CatalogoServicio[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtroGrupo, setFiltroGrupo] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  // Estado del formulario
  const [nuevoServicio, setNuevoServicio] = useState({
    catalogoServicioId: '',
    grupoId: '',
    tiquet: 'NO' as 'SI' | 'NO' | 'CORD' | 'ESPACH',
    profesionalPrincipalId: '',
    profesionalSegundaOpcionId: '',
    profesionalTerceraOpcionId: '',
    requiereApoyo: false,
    sala: '',
    supervision: false,
    esActual: false,
  });

  // Cargar datos
  useEffect(() => {
    // Cargar servicios asignados
    const qServicios = query(collection(db, 'servicios-asignados'), orderBy('createdAt', 'desc'));
    const unsubServicios = onSnapshot(qServicios, (snapshot) => {
      const serviciosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        fechaProgramada: doc.data().fechaProgramada?.toDate(),
      })) as ServicioAsignado[];
      setServicios(serviciosData);
    });

    // Cargar profesionales
    const qProfesionales = query(collection(db, 'profesionales'), orderBy('nombre'));
    const unsubProfesionales = onSnapshot(qProfesionales, (snapshot) => {
      const profesionalesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Profesional[];
      setProfesionales(profesionalesData.filter(p => p.activo));
    });

    // Cargar grupos
    const qGrupos = query(collection(db, 'grupos-pacientes'), orderBy('nombre'));
    const unsubGrupos = onSnapshot(qGrupos, (snapshot) => {
      const gruposData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as GrupoPaciente[];
      setGrupos(gruposData.filter(g => g.activo));
    });

    // Cargar catálogo de servicios
    const qCatalogo = query(collection(db, 'catalogo-servicios'), orderBy('nombre'));
    const unsubCatalogo = onSnapshot(qCatalogo, (snapshot) => {
      const catalogoData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as CatalogoServicio[];
      setCatalogoServicios(catalogoData.filter(s => s.activo));
    });

    return () => {
      unsubServicios();
      unsubProfesionales();
      unsubGrupos();
      unsubCatalogo();
    };
  }, []);

  // Crear servicio
  const handleCrearServicio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const catalogoServicio = catalogoServicios.find(s => s.id === nuevoServicio.catalogoServicioId);
    const grupo = grupos.find(g => g.id === nuevoServicio.grupoId);
    const profPrincipal = profesionales.find(p => p.id === nuevoServicio.profesionalPrincipalId);
    const profSegunda = profesionales.find(p => p.id === nuevoServicio.profesionalSegundaOpcionId);
    const profTercera = profesionales.find(p => p.id === nuevoServicio.profesionalTerceraOpcionId);

    if (!catalogoServicio || !grupo || !profPrincipal) {
      alert('Faltan datos obligatorios');
      return;
    }

    try {
      await addDoc(collection(db, 'servicios-asignados'), {
        catalogoServicioId: catalogoServicio.id,
        catalogoServicioNombre: catalogoServicio.nombre,
        grupoId: grupo.id,
        grupoNombre: grupo.nombre,
        esActual: nuevoServicio.esActual,
        estado: 'activo',
        tiquet: nuevoServicio.tiquet,
        profesionalPrincipalId: profPrincipal.id,
        profesionalPrincipalNombre: `${profPrincipal.nombre} ${profPrincipal.apellidos}`,
        profesionalSegundaOpcionId: nuevoServicio.profesionalSegundaOpcionId || null,
        profesionalSegundaOpcionNombre: profSegunda ? `${profSegunda.nombre} ${profSegunda.apellidos}` : '',
        profesionalTerceraOpcionId: nuevoServicio.profesionalTerceraOpcionId || null,
        profesionalTerceraOpcionNombre: profTercera ? `${profTercera.nombre} ${profTercera.apellidos}` : '',
        requiereApoyo: nuevoServicio.requiereApoyo || catalogoServicio.requiereApoyo,
        sala: nuevoServicio.sala || catalogoServicio.salaPredeterminada || '',
        tiempoReal: catalogoServicio.tiempoEstimado,
        supervision: nuevoServicio.supervision || catalogoServicio.requiereSupervision,
        vecesRealizadoMes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        creadoPor: user.email,
      });

      // Reset form
      setNuevoServicio({
        catalogoServicioId: '',
        grupoId: '',
        tiquet: 'NO',
        profesionalPrincipalId: '',
        profesionalSegundaOpcionId: '',
        profesionalTerceraOpcionId: '',
        requiereApoyo: false,
        sala: '',
        supervision: false,
        esActual: false,
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al crear servicio:', error);
    }
  };

  // Cambiar checkbox "ACTUAL"
  const toggleActual = async (servicioId: string, valorActual: boolean) => {
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        esActual: !valorActual,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  // Actualizar tiquet
  const actualizarTiquet = async (servicioId: string, nuevoTiquet: string) => {
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        tiquet: nuevoTiquet,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar tiquet:', error);
    }
  };

  // Actualizar profesional
  const actualizarProfesional = async (servicioId: string, campo: string, profesionalId: string) => {
    const prof = profesionales.find(p => p.id === profesionalId);
    const nombreCompleto = prof ? `${prof.nombre} ${prof.apellidos}` : '';
    
    try {
      await updateDoc(doc(db, 'servicios-asignados', servicioId), {
        [campo]: profesionalId,
        [`${campo}Nombre`]: nombreCompleto,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al actualizar profesional:', error);
    }
  };

  // Eliminar servicio
  const eliminarServicio = async (servicioId: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    
    try {
      await deleteDoc(doc(db, 'servicios-asignados', servicioId));
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  // Exportar a Excel
  const exportarAExcel = () => {
    const datosExcel = serviciosFiltrados.map(servicio => ({
      'Servicio': servicio.catalogoServicioNombre,
      'Grupo': servicio.grupoNombre,
      'Actual': servicio.esActual ? 'Sí' : 'No',
      'Tiquet': servicio.tiquet,
      'Profesional Principal': servicio.profesionalPrincipalNombre,
      'Segunda Opción': servicio.profesionalSegundaOpcionNombre || '-',
      'Tercera Opción': servicio.profesionalTerceraOpcionNombre || '-',
      'Sala': servicio.sala || '-',
      'Tiempo': servicio.tiempoReal ? `${servicio.tiempoReal} min` : '-',
      'Requiere Apoyo': servicio.requiereApoyo ? 'Sí' : 'No',
      'Supervisión': servicio.supervision ? 'Sí' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(datosExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Servicios');

    const colWidths = [
      { wch: 30 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, 
      { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, 
      { wch: 10 }, { wch: 15 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Servicios_Asignados_${fecha}.xlsx`);
  };

  // Filtrar servicios
  const serviciosFiltrados = servicios.filter(servicio => {
    const cumpleGrupo = filtroGrupo === 'todos' || servicio.grupoId === filtroGrupo;
    const cumpleEstado = filtroEstado === 'todos' || servicio.tiquet === filtroEstado;
    return cumpleGrupo && cumpleEstado;
  });

  // Obtener color del tiquet
  const getColorTiquet = (tiquet: string) => {
    switch (tiquet) {
      case 'SI': return 'bg-green-100 text-green-800';
      case 'NO': return 'bg-red-100 text-red-800';
      case 'CORD': return 'bg-yellow-100 text-yellow-800';
      case 'ESPACH': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Servicios Asignados</h1>
          <p className="text-gray-600 mt-1">Asignación de servicios del catálogo a grupos específicos</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportarAExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span>Asignar Servicio</span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Total Servicios</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{servicios.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-purple-600" />
            <p className="text-sm text-gray-600">Grupos Activos</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{grupos.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <p className="text-sm text-gray-600">Profesionales</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{profesionales.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-gray-600">Actuales</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{servicios.filter(s => s.esActual).length}</p>
        </div>
      </div>

      {/* Aviso si faltan datos */}
      {(catalogoServicios.length === 0 || grupos.length === 0 || profesionales.length === 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">⚠️ Faltan datos necesarios:</p>
          <ul className="text-yellow-700 text-sm mt-2 space-y-1">
            {catalogoServicios.length === 0 && <li>• Crea servicios en el Catálogo de Servicios</li>}
            {profesionales.length === 0 && <li>• Añade profesionales en la sección Profesionales</li>}
            {grupos.length === 0 && <li>• Crea grupos de pacientes</li>}
          </ul>
        </div>
      )}

      {/* Formulario Asignar Servicio */}
      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Asignar Servicio a Grupo</h2>
          <form onSubmit={handleCrearServicio} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio del Catálogo *</label>
                <select
                  value={nuevoServicio.catalogoServicioId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, catalogoServicioId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar servicio...</option>
                  {catalogoServicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.nombre} ({servicio.tiempoEstimado} min)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                <select
                  value={nuevoServicio.grupoId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, grupoId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar grupo...</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tiquet CRM</label>
                <select
                  value={nuevoServicio.tiquet}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, tiquet: e.target.value as 'SI' | 'NO' | 'CORD' | 'ESPACH'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="SI">SI</option>
                  <option value="NO">NO</option>
                  <option value="CORD">CORD</option>
                  <option value="ESPACH">ESPACH</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Citar con (Principal) *</label>
                <select
                  value={nuevoServicio.profesionalPrincipalId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalPrincipalId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Segunda Opción</label>
                <select
                  value={nuevoServicio.profesionalSegundaOpcionId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalSegundaOpcionId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tercera Opción</label>
                <select
                  value={nuevoServicio.profesionalTerceraOpcionId}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, profesionalTerceraOpcionId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Seleccionar profesional...</option>
                  {profesionales.map(prof => (
                    <option key={prof.id} value={prof.id}>{prof.nombre} {prof.apellidos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sala (opcional)</label>
                <input
                  type="text"
                  value={nuevoServicio.sala}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, sala: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Sobreescribir sala predeterminada"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.esActual}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, esActual: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Es actual</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.requiereApoyo}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, requiereApoyo: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Requiere apoyo</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={nuevoServicio.supervision}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, supervision: e.target.checked})}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Supervisión</span>
              </label>
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Asignar Servicio
              </button>
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <select
            value={filtroGrupo}
            onChange={(e) => setFiltroGrupo(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map(grupo => (
              <option key={grupo.id} value={grupo.id}>{grupo.nombre}</option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todos los tickets</option>
            <option value="SI">SI</option>
            <option value="NO">NO</option>
            <option value="CORD">CORD</option>
            <option value="ESPACH">ESPACH</option>
          </select>
        </div>
      </div>

      {/* Tabla de Servicios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actual</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiquet</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citar con</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">2ª Opción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">3ª Opción</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Apoyo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sala</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tiempo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serviciosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    No hay servicios asignados. Usa el botón "Asignar Servicio"
                  </td>
                </tr>
              ) : (
                serviciosFiltrados.map((servicio) => (
                  <tr key={servicio.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActual(servicio.id, servicio.esActual)}
                        className="text-gray-600 hover:text-blue-600"
                      >
                        {servicio.esActual ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {servicio.catalogoServicioNombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {servicio.grupoNombre}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={servicio.tiquet}
                        onChange={(e) => actualizarTiquet(servicio.id, e.target.value)}
                        className={`px-2 py-1 rounded text-xs font-medium ${getColorTiquet(servicio.tiquet)}`}
                      >
                        <option value="SI">SI</option>
                        <option value="NO">NO</option>
                        <option value="CORD">CORD</option>
                        <option value="ESPACH">ESPACH</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={servicio.profesionalPrincipalId}
                        onChange={(e) => actualizarProfesional(servicio.id, 'profesionalPrincipalId', e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Seleccionar...</option>
                        {profesionales.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nombre} {prof.apellidos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={servicio.profesionalSegundaOpcionId || ''}
                        onChange={(e) => actualizarProfesional(servicio.id, 'profesionalSegundaOpcionId', e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">-</option>
                        {profesionales.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nombre} {prof.apellidos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={servicio.profesionalTerceraOpcionId || ''}
                        onChange={(e) => actualizarProfesional(servicio.id, 'profesionalTerceraOpcionId', e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">-</option>
                        {profesionales.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nombre} {prof.apellidos}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {servicio.requiereApoyo && <span className="text-orange-600">✓</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {servicio.sala || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {servicio.tiempoReal ? `${servicio.tiempoReal}min` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => eliminarServicio(servicio.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}