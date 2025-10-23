/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ProductoInventario } from '@/types';
import { Plus, Package, AlertTriangle, Download, Edit, Trash2, Search } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function InventarioPage() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [productoEditando, setProductoEditando] = useState<ProductoInventario | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'fungible' as ProductoInventario['categoria'],
    cantidadActual: 0,
    cantidadMinima: 10,
    cantidadMaxima: 100,
    unidadMedida: 'unidad' as ProductoInventario['unidadMedida'],
    ubicacion: '',
    precio: 0,
  });

  // Cargar productos
  useEffect(() => {
    const q = query(collection(db, 'inventario-productos'), orderBy('nombre'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ProductoInventario[];
      setProductos(data);
    });
    return () => unsubscribe();
  }, []);

  // Crear/Editar producto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const alertaStockBajo = form.cantidadActual <= form.cantidadMinima;

    const productoData = {
      ...form,
      alertaStockBajo,
      alertaCaducidad: false,
      activo: true,
      updatedAt: new Date(),
      modificadoPor: user.email,
    };

    try {
      if (productoEditando) {
        await updateDoc(doc(db, 'inventario-productos', productoEditando.id), productoData);
        alert('✅ Producto actualizado');
      } else {
        await addDoc(collection(db, 'inventario-productos'), {
          ...productoData,
          createdAt: new Date(),
          creadoPor: user.email,
        });
        alert('✅ Producto creado');
      }
      resetForm();
    } catch (error) { console.error(error); console.error('Error:', error);
      alert('❌ Error al guardar');
    }
  };

  // Eliminar producto
  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await deleteDoc(doc(db, 'inventario-productos', id));
      alert('✅ Eliminado');
    } catch (error) { console.error(error); alert('❌ Error al eliminar');
    }
  };

  // Editar producto
  const editar = (producto: ProductoInventario) => {
    setProductoEditando(producto);
    setForm({
      nombre: producto.nombre,
      categoria: producto.categoria,
      cantidadActual: producto.cantidadActual,
      cantidadMinima: producto.cantidadMinima,
      cantidadMaxima: producto.cantidadMaxima,
      unidadMedida: producto.unidadMedida,
      ubicacion: producto.ubicacion || '',
      precio: producto.precio || 0,
    });
    setMostrarForm(true);
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      categoria: 'fungible',
      cantidadActual: 0,
      cantidadMinima: 10,
      cantidadMaxima: 100,
      unidadMedida: 'unidad',
      ubicacion: '',
      precio: 0,
    });
    setProductoEditando(null);
    setMostrarForm(false);
  };

  // Exportar
  const exportar = () => {
    const datos = productos.map(p => ({
      Nombre: p.nombre,
      Categoría: p.categoria,
      Stock: p.cantidadActual,
      Mínimo: p.cantidadMinima,
      Máximo: p.cantidadMaxima,
      Unidad: p.unidadMedida,
      Ubicación: p.ubicacion,
      Precio: p.precio || 0,
      Estado: p.alertaStockBajo ? 'STOCK BAJO' : 'OK',
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtrar
  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Estadísticas
  const stats = {
    total: productos.length,
    stockBajo: productos.filter(p => p.alertaStockBajo).length,
    valorTotal: productos.reduce((acc, p) => acc + ((p.precio || 0) * p.cantidadActual), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Inventario</h1>
          <p className="text-gray-600 mt-1">Gestión de productos y stock</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={exportar} className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </button>
          <button onClick={() => setMostrarForm(true)} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Productos</p>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Stock Bajo</p>
          <p className="text-2xl font-bold text-red-600">{stats.stockBajo}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Valor Total</p>
          <p className="text-2xl font-bold text-green-600">€{stats.valorTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Alerta */}
      {stats.stockBajo > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">⚠️ Alerta de Stock</h3>
              <p className="text-sm text-yellow-700 mt-1">{stats.stockBajo} producto(s) con stock bajo</p>
            </div>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{producto.nombre}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{producto.categoria}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={producto.alertaStockBajo ? 'text-red-600 font-bold' : 'text-gray-900'}>
                    {producto.cantidadActual} {producto.unidadMedida}
                  </span>
                  <span className="text-xs text-gray-500 block">
                    Min: {producto.cantidadMinima} | Max: {producto.cantidadMaxima}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{producto.ubicacion || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">€{(producto.precio || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  {producto.alertaStockBajo ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Stock Bajo</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">OK</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button onClick={() => editar(producto)} className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminar(producto.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productosFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay productos</p>
          </div>
        )}
      </div>

      {/* Modal Formulario */}
      {mostrarForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({...form, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({...form, categoria: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="medicamento">Medicamento</option>
                      <option value="fungible">Material Fungible</option>
                      <option value="equipamiento">Equipamiento</option>
                      <option value="limpieza">Limpieza</option>
                      <option value="oficina">Oficina</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad *</label>
                    <select
                      value={form.unidadMedida}
                      onChange={(e) => setForm({...form, unidadMedida: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="caja">Caja</option>
                      <option value="paquete">Paquete</option>
                      <option value="litro">Litro</option>
                      <option value="kilo">Kilo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual *</label>
                    <input
                      type="number"
                      value={form.cantidadActual}
                      onChange={(e) => setForm({...form, cantidadActual: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                    <input
                      type="number"
                      value={form.cantidadMinima}
                      onChange={(e) => setForm({...form, cantidadMinima: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Máximo *</label>
                    <input
                      type="number"
                      value={form.cantidadMaxima}
                      onChange={(e) => setForm({...form, cantidadMaxima: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input
                      type="text"
                      value={form.ubicacion}
                      onChange={(e) => setForm({...form, ubicacion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Ej: Almacén principal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                    <input
                      type="number"
                      value={form.precio}
                      onChange={(e) => setForm({...form, precio: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
                    {productoEditando ? 'Actualizar' : 'Crear'}
                  </button>
                  <button type="button" onClick={resetForm} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}