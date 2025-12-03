// types/modules/inventario.ts

// ============================================
// TIPOS PARA INVENTARIO
// ============================================

export interface ProductoInventario {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: 'medicamento' | 'fungible' | 'equipamiento' | 'limpieza' | 'oficina' | 'otro';
  subcategoria?: string;

  // Stock
  cantidadActual: number;
  cantidadMinima: number;
  cantidadMaxima: number;
  unidadMedida: 'unidad' | 'caja' | 'paquete' | 'litro' | 'gramo' | 'kilo' | 'metro' | 'otro';

  // Proveedor
  proveedorId?: string;
  proveedorNombre?: string;
  codigoProveedor?: string;

  // Ubicación
  ubicacion: string;
  ubicacionSecundaria?: string;

  // Información adicional
  lote?: string;
  fechaCaducidad?: Date;
  precio?: number;
  codigoBarras?: string;
  imagenUrl?: string;

  // Alertas
  alertaStockBajo: boolean;
  alertaCaducidad: boolean;

  // Estado
  activo: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  creadoPor: string;
  modificadoPor?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  productoNombre: string;

  tipo: 'entrada' | 'salida' | 'ajuste' | 'devolucion' | 'caducado' | 'perdida';
  cantidad: number;
  cantidadAnterior: number;
  cantidadNueva: number;

  motivo?: string;
  observaciones?: string;

  // Referencias
  servicioRelacionadoId?: string;
  profesionalId?: string;
  profesionalNombre?: string;

  // Metadata
  fecha: Date;
  creadoPor: string;
  createdAt: Date;
}

export interface EstadisticasInventario {
  totalProductos: number;
  productosActivos: number;
  productosStockBajo: number;
  productosProximosCaducar: number;

  porCategoria: Record<string, number>;
  valorTotalInventario: number;

  movimientosUltimoMes: {
    entradas: number;
    salidas: number;
    ajustes: number;
  };
}
