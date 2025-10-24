'use client';

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/hooks/useAuth";
import { CatalogoServicio, Profesional } from "@/types";
import { Plus, Save, X, Trash2, Edit2 } from "lucide-react";

type CategoriaServicio = "medicina" | "fisioterapia" | "enfermeria";

interface FormData {
  nombre: string;
  categoria: CategoriaServicio;
  descripcion: string;
  tiempoEstimado: number;
  requiereSala: boolean;
  salaPredeterminada: string;
  requiereSupervision: boolean;
  requiereApoyo: boolean;
  profesionalesHabilitados: string[];
  frecuenciaMensual: number;
  activo: boolean;
}

const initialForm: FormData = {
  nombre: "",
  categoria: "medicina",
  descripcion: "",
  tiempoEstimado: 60,
  requiereSala: false,
  salaPredeterminada: "",
  requiereSupervision: false,
  requiereApoyo: false,
  profesionalesHabilitados: [],
  frecuenciaMensual: 0,
  activo: true
};

export default function CatalogoServiciosPage() {
  const { user } = useAuth();
  const [servicios, setServicios] = useState<CatalogoServicio[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  useEffect(() => {
    const qServicios = query(collection(db, "catalogo-servicios"), orderBy("nombre"));
    const unsubServicios = onSnapshot(
      qServicios,
      (snapshot) => {
        const serviciosData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          };
        }) as CatalogoServicio[];
        setServicios(serviciosData);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando catálogo de servicios:", err);
        const message = err instanceof Error ? err.message : "Error desconocido al cargar el catálogo.";
        setError(message);
        setLoading(false);
      }
    );

    const qProfesionales = query(collection(db, "profesionales"), orderBy("nombre"));
    const unsubProfesionales = onSnapshot(
      qProfesionales,
      (snapshot) => {
        const profesionalesData = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
            updatedAt: data.updatedAt?.toDate?.() ?? new Date()
          };
        }) as Profesional[];
        setProfesionales(profesionalesData.filter((prof) => prof.activo));
      },
      (err) => {
        console.error("Error cargando profesionales:", err);
      }
    );

    return () => {
      unsubServicios();
      unsubProfesionales();
    };
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      alert("Debes iniciar sesión para crear servicios.");
      return;
    }

    if (!formData.nombre.trim()) {
      alert("El nombre del servicio es obligatorio.");
      return;
    }

    const payload = {
      ...formData,
      profesionalesHabilitados: formData.profesionalesHabilitados,
      tiempoEstimado: Number(formData.tiempoEstimado),
      frecuenciaMensual: formData.frecuenciaMensual || 0,
      cargaMensualEstimada: formData.frecuenciaMensual
        ? `${formData.frecuenciaMensual} sesiones/mes`
        : undefined,
      updatedAt: new Date(),
      ...(editandoId
        ? {}
        : {
            createdAt: new Date(),
            creadoPor: user.email ?? "desconocido"
          })
    };

    try {
      if (editandoId) {
        await updateDoc(doc(db, "catalogo-servicios", editandoId), payload);
      } else {
        await addDoc(collection(db, "catalogo-servicios"), payload);
      }

      resetForm();
    } catch (err) {
      console.error("Error al guardar el servicio:", err);
      alert("No se pudo guardar el servicio. Inténtalo de nuevo.");
    }
  };

  const iniciarEdicion = (servicio: CatalogoServicio) => {
    setFormData({
      nombre: servicio.nombre,
      categoria: servicio.categoria,
      descripcion: servicio.descripcion || "",
      tiempoEstimado: servicio.tiempoEstimado,
      requiereSala: servicio.requiereSala,
      salaPredeterminada: servicio.salaPredeterminada || "",
      requiereSupervision: servicio.requiereSupervision,
      requiereApoyo: servicio.requiereApoyo,
      profesionalesHabilitados: servicio.profesionalesHabilitados || [],
      frecuenciaMensual: servicio.frecuenciaMensual || 0,
      activo: servicio.activo
    });
    setEditandoId(servicio.id);
    setMostrarFormulario(true);
  };

  const eliminarServicio = async (id: string) => {
    if (!confirm("¿Eliminar este servicio del catálogo? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "catalogo-servicios", id));
    } catch (err) {
      console.error("Error al eliminar servicio:", err);
      alert("No se pudo eliminar el servicio. Inténtalo de nuevo.");
    }
  };

  const toggleActivo = async (servicio: CatalogoServicio) => {
    try {
      await updateDoc(doc(db, "catalogo-servicios", servicio.id), {
        activo: !servicio.activo,
        updatedAt: new Date()
      });
    } catch (err) {
      console.error("Error al actualizar estado:", err);
      alert("No se pudo actualizar el estado del servicio.");
    }
  };

  const serviciosAgrupados = useMemo(() => {
    return {
      medicina: servicios.filter((s) => s.categoria === "medicina"),
      fisioterapia: servicios.filter((s) => s.categoria === "fisioterapia"),
      enfermeria: servicios.filter((s) => s.categoria === "enfermeria")
    };
  }, [servicios]);

  if (loading) {
    return <div className="p-4 text-gray-600">Cargando catálogo de servicios...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogo de Servicios</h1>
          <p className="text-gray-600 mt-1">
            Define los servicios disponibles para asignación y planificación.
          </p>
        </div>
        <button
          onClick={() => {
            setMostrarFormulario((prev) => !prev);
            if (editandoId && mostrarFormulario) {
              resetForm();
            }
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {mostrarFormulario ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          <span>{mostrarFormulario ? "Cancelar" : "Nuevo servicio"}</span>
        </button>
      </div>

      {mostrarFormulario && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editandoId ? "Editar Servicio" : "Crear nuevo Servicio"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría *
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      categoria: e.target.value as CategoriaServicio
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="medicina">Medicina</option>
                  <option value="fisioterapia">Fisioterapia</option>
                  <option value="enfermeria">Enfermería</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo estimado (min) *
                </label>
                <input
                  type="number"
                  min={5}
                  value={formData.tiempoEstimado}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tiempoEstimado: Number(e.target.value)
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia mensual estimada
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.frecuenciaMensual}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      frecuenciaMensual: Number(e.target.value)
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereSala}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, requiereSala: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span>Requiere sala</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereSupervision}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      requiereSupervision: e.target.checked
                    }))
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span>Requiere supervisión</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.requiereApoyo}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, requiereApoyo: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600"
                />
                <span>Requiere apoyo adicional</span>
              </label>
            </div>

            {formData.requiereSala && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sala predeterminada
                </label>
                <input
                  type="text"
                  value={formData.salaPredeterminada}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      salaPredeterminada: e.target.value
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Sala, quirófano, box..."
                />
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Profesionales habilitados</p>
              {profesionales.length === 0 ? (
                <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  No hay profesionales activos registrados. Añádelos en el módulo Profesionales
                  para poder asociarlos.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {profesionales.map((prof) => {
                    const checked = formData.profesionalesHabilitados.includes(prof.id);
                    return (
                      <label
                        key={prof.id}
                        className="flex items-center space-x-2 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              profesionalesHabilitados: e.target.checked
                                ? [...prev.profesionalesHabilitados, prof.id]
                                : prev.profesionalesHabilitados.filter((id) => id !== prof.id)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span>{`${prof.nombre} ${prof.apellidos}`}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.activo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, activo: e.target.checked }))
                }
                className="h-4 w-4 text-blue-600"
              />
              <span>Servicio activo</span>
            </label>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                disabled={!formData.nombre.trim()}
              >
                <Save className="w-4 h-4" />
                <span>{editandoId ? "Guardar cambios" : "Crear servicio"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {servicios.length === 0 ? (
        <div className="p-4 text-gray-600 border border-dashed border-gray-300 rounded-lg">
          Aún no hay servicios en el catálogo. Crea el primero.
        </div>
      ) : (
        <div className="space-y-6">
          {(["medicina", "fisioterapia", "enfermeria"] as CategoriaServicio[]).map((categoria) => {
            const lista = serviciosAgrupados[categoria];
            if (lista.length === 0) return null;
            return (
              <div key={categoria}>
                <h3 className="text-lg font-semibold text-gray-800 capitalize mb-3">
                  {categoria}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lista.map((servicio) => (
                    <div
                      key={servicio.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {servicio.nombre}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {servicio.tiempoEstimado} min •{" "}
                            {servicio.requiereSala ? "Requiere sala" : "Sin sala asignada"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            servicio.activo
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {servicio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      {servicio.descripcion && (
                        <p className="text-sm text-gray-600 mt-2">{servicio.descripcion}</p>
                      )}

                      <div className="text-sm text-gray-500 mt-3 space-y-1">
                        {servicio.salaPredeterminada && (
                          <p>
                            Sala predeterminada:{" "}
                            <span className="font-medium">{servicio.salaPredeterminada}</span>
                          </p>
                        )}
                        <p>
                          Supervisión:{" "}
                          <span className="font-medium">
                            {servicio.requiereSupervision ? "Sí" : "No"}
                          </span>
                        </p>
                        <p>
                          Apoyo adicional:{" "}
                          <span className="font-medium">
                            {servicio.requiereApoyo ? "Sí" : "No"}
                          </span>
                        </p>
                        {servicio.frecuenciaMensual !== undefined && servicio.frecuenciaMensual > 0 && (
                          <p>
                            Frecuencia mensual estimada:{" "}
                            <span className="font-medium">
                              {servicio.frecuenciaMensual} vez/veces
                            </span>
                          </p>
                        )}
                        {servicio.profesionalesHabilitados?.length ? (
                          <p>
                            Profesionales habilitados:{" "}
                            <span className="font-medium">
                              {servicio.profesionalesHabilitados
                                .map((id) => {
                                  const prof = profesionales.find((p) => p.id === id);
                                  return prof ? `${prof.nombre} ${prof.apellidos}` : "—";
                                })
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </p>
                        ) : (
                          <p className="text-yellow-700">Sin profesionales asignados.</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="space-x-2">
                          <button
                            onClick={() => iniciarEdicion(servicio)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => eliminarServicio(servicio.id)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                        <button
                          onClick={() => toggleActivo(servicio)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {servicio.activo ? "Marcar como inactivo" : "Activar servicio"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
