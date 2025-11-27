import { adminDb } from '@/lib/firebaseAdmin';
import { cached } from '@/lib/server/cache';

type InventarioItem = {
  id: string;
  nombre: string;
  categoria?: string;
  stock: number;
  stockMinimo: number;
  proveedor?: string;
  precio?: number;
  alertaStockBajo: boolean;
};

export type InventarioSnapshot = {
  productos: InventarioItem[];
  stockBajo: number;
  total: number;
};

export async function getInventarioSnapshot(): Promise<InventarioSnapshot> {
  if (!adminDb) {
    return { productos: [], stockBajo: 0, total: 0 };
  }

  return cached(
    ['inventario', 'snapshot'],
    async () => {
      const snapshot = await adminDb
        .collection('inventario-productos')
        .orderBy('nombre')
        .limit(200)
        .get();
      const productos: InventarioItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() ?? {};
        return {
          id: docSnap.id,
          nombre: data.nombre ?? 'Sin nombre',
          categoria: data.categoria ?? 'general',
          stock: data.cantidadActual ?? data.stock ?? 0,
          stockMinimo: data.cantidadMinima ?? data.stockMinimo ?? 0,
          proveedor: data.proveedorNombre ?? data.proveedor ?? '',
          precio: typeof data.precio === 'number' ? data.precio : undefined,
          alertaStockBajo: Boolean(data.alertaStockBajo),
        };
      });

      const stockBajo = productos.filter((p) => p.alertaStockBajo).length;
      return {
        productos,
        stockBajo,
        total: productos.length,
      } satisfies InventarioSnapshot;
    },
    { revalidate: 120, tags: ['inventario'] }
  );
}
