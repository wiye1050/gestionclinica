import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { getCurrentUser } from '@/lib/auth/server';
import { logger } from '@/lib/utils/logger';
import { rateLimit, RATE_LIMIT_STRICT } from '@/lib/middleware/rateLimit';

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

const limiter = rateLimit(RATE_LIMIT_STRICT);

export async function POST(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = await limiter(request);
  if (rateLimitResult) return rateLimitResult;

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!(currentUser.roles ?? []).includes('admin')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    logger.info('🚀 Iniciando migración de colores...\n');

    // Verificar que adminDb esté disponible
    if (!adminDb) {
      logger.error('❌ Firebase Admin no está configurado');
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
    logger.info('📋 Migrando profesionales...');
    const profesionalesSnap = await adminDb.collection('profesionales').get();

    const profesionalesBatch = adminDb.batch();
    profesionalesSnap.docs.forEach((doc, index) => {
      const data = doc.data();
      if (!data.color) {
        const color = PROFESIONAL_COLORS[index % PROFESIONAL_COLORS.length];
        profesionalesBatch.update(doc.ref, { color });
        logger.debug(`  ✓ ${doc.id}: ${color}`);
        results.profesionales.updated++;
      } else {
        results.profesionales.skipped++;
      }
    });

    if (results.profesionales.updated > 0) {
      await profesionalesBatch.commit();
      logger.info(`✅ Actualizados ${results.profesionales.updated} profesionales`);
    } else {
      logger.info('✅ Todos los profesionales ya tienen color');
    }

    // Migrar servicios
    logger.info('\n📋 Migrando servicios del catálogo...');
    const serviciosSnap = await adminDb.collection('catalogo-servicios').get();

    const serviciosBatch = adminDb.batch();
    serviciosSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.color) {
        const categoria = (data.categoria || 'medicina') as string;
        const color = SERVICIO_COLORS_BY_CATEGORIA[categoria] || '#3B82F6';
        serviciosBatch.update(doc.ref, { color });
        logger.debug(`  ✓ ${doc.id} (${categoria}): ${color}`);
        results.servicios.updated++;
      } else {
        results.servicios.skipped++;
      }
    });

    if (results.servicios.updated > 0) {
      await serviciosBatch.commit();
      logger.info(`✅ Actualizados ${results.servicios.updated} servicios`);
    } else {
      logger.info('✅ Todos los servicios ya tienen color');
    }

    logger.info('\n✨ Migración completada exitosamente');
    logger.info(`   Total registros actualizados: ${results.profesionales.updated + results.servicios.updated}`);

    return NextResponse.json({
      success: true,
      results,
      message: 'Migración completada exitosamente',
    });

  } catch (error) {
    logger.error('❌ Error durante la migración:', error as Error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
