import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCurrentUser } from '@/lib/auth/server';
import { canViewFinances } from '@/lib/auth/roles';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }
  if (!canViewFinances(currentUser.roles)) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 });
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: 'Firebase Admin no está configurado para el resumen financiero.' },
      { status: 500 }
    );
  }

  try {
    const today = new Date();
    const mesInicio = new Date(today.getFullYear(), today.getMonth(), 1);
    const mesFin = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const mesInicioTs = Timestamp.fromDate(mesInicio);
    const mesFinTs = Timestamp.fromDate(mesFin);

    const [facturasMesSnap, pagosMesSnap, pendientesSnap] = await Promise.all([
      adminDb
        .collectionGroup('facturas')
        .where('fecha', '>=', mesInicioTs)
        .where('fecha', '<', mesFinTs)
        .orderBy('fecha', 'asc')
        .get(),
      adminDb
        .collectionGroup('facturas')
        .where('fechaPago', '>=', mesInicioTs)
        .where('fechaPago', '<', mesFinTs)
        .orderBy('fechaPago', 'asc')
        .get(),
      adminDb
        .collectionGroup('facturas')
        .where('estado', 'in', ['pendiente', 'vencida'])
        .get(),
    ]);

    const facturadoMes = facturasMesSnap.docs.reduce((sum, docSnap) => {
      const data = docSnap.data() ?? {};
      return sum + Number(data.total ?? 0);
    }, 0);

    const cobradoMes = pagosMesSnap.docs.reduce((sum, docSnap) => {
      const data = docSnap.data() ?? {};
      const pagado = Number(data.pagado ?? 0);
      const total = Number(data.total ?? 0);
      return sum + (pagado || total);
    }, 0);

    let totalPendiente = 0;
    let totalVencido = 0;
    let facturasPendientes = 0;

    pendientesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data() ?? {};
      const total = Number(data.total ?? 0);
      const pagado = Number(data.pagado ?? 0);
      const estado = data.estado ?? 'pendiente';

      if (estado === 'pendiente') {
        totalPendiente += Math.max(total - pagado, 0);
        facturasPendientes += 1;
      }
      if (estado === 'vencida') {
        totalVencido += Math.max(total - pagado, 0);
      }
    });

    return NextResponse.json({
      facturadoMes,
      cobradoMes,
      totalPendiente,
      totalVencido,
      facturasPendientes,
      totalFacturado: facturadoMes,
    });
  } catch (error) {
    logger.error('Error generando resumen financiero', error as Error);
    return NextResponse.json({ error: 'No se pudo obtener el resumen financiero.' }, { status: 500 });
  }
}
