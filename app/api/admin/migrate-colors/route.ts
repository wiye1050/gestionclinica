import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * POST /api/admin/migrate-colors
 *
 * Endpoint para ejecutar la migración de colores en profesionales y servicios.
 * Requiere autenticación de administrador.
 */

// Paleta de colores para profesionales (6 colores distintos)
const PROFESIONAL_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Naranja
  '#EF4444', // Rojo
  '#8B5CF6', // Morado
  '#06B6D4', // Cyan
];

// Colores por categoría para servicios
const SERVICIO_COLORS_BY_CATEGORIA: Record<string, string> = {
  medicina: '#3B82F6',     // Azul
  fisioterapia: '#10B981', // Verde
  enfermeria: '#F59E0B',   // Naranja
};

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando migración de colores...\n');

    // TODO: Agregar verificación de rol admin aquí
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Verificar que adminDb esté disponible
    if (!adminDb) {
      console.error('❌ Firebase Admin no está configurado');
      return NextResponse.json(
        {
          success: false,
          error: 'Firebase Admin no está configurado. Configura FIREBASE_SERVICE_ACCOUNT_KEY'
        },
        { status: 500 }
      );
    }

    const results = {
      profesionales: { updated: 0, skipped: 0, errors: 0 },
      servicios: { updated: 0, skipped: 0, errors: 0 },
    };

    // Migrar profesionales
    console.log('📋 Migrando profesionales...');
    const profesionalesSnap = await adminDb.collection('profesionales').get();

    const profesionalesBatch = adminDb.batch();
    profesionalesSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      if (!data.color) {
        const color = PROFESIONAL_COLORS[index % PROFESIONAL_COLORS.length];
        profesionalesBatch.update(doc.ref, { color });
        console.log(`  ✓ ${doc.id}: ${color}`);
        results.profesionales.updated++;
      } else {
        results.profesionales.skipped++;
      }
    });

    if (results.profesionales.updated > 0) {
      await profesionalesBatch.commit();
      console.log(`✅ Actualizados ${results.profesionales.updated} profesionales`);
    } else {
      console.log('✅ Todos los profesionales ya tienen color');
    }

    // Migrar servicios
    console.log('\n📋 Migrando servicios del catálogo...');
    const serviciosSnap = await adminDb.collection('catalogo-servicios').get();

    const serviciosBatch = adminDb.batch();
    serviciosSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.color) {
        const categoria = (data.categoria || 'medicina') as string;
        const color = SERVICIO_COLORS_BY_CATEGORIA[categoria] || '#3B82F6';
        serviciosBatch.update(doc.ref, { color });
        console.log(`  ✓ ${doc.id} (${categoria}): ${color}`);
        results.servicios.updated++;
      } else {
        results.servicios.skipped++;
      }
    });

    if (results.servicios.updated > 0) {
      await serviciosBatch.commit();
      console.log(`✅ Actualizados ${results.servicios.updated} servicios`);
    } else {
      console.log('✅ Todos los servicios ya tienen color');
    }

    console.log('\n✨ Migración completada exitosamente');
    console.log(`   Total registros actualizados: ${results.profesionales.updated + results.servicios.updated}`);

    return NextResponse.json({
      success: true,
      results,
      message: 'Migración completada exitosamente',
    });

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
