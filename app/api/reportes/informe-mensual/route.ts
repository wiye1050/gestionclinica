import { NextResponse, type NextRequest } from 'next/server';
import { getMonthlyReportData } from '@/lib/server/informes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { year, month } = body ?? {};

    if (typeof year !== 'number' || typeof month !== 'number') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const data = await getMonthlyReportData(year, month);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[informe-mensual] Error al generar datos', error);
    return NextResponse.json(
      { error: 'No se pudo generar el informe mensual' },
      { status: 500 }
    );
  }
}
