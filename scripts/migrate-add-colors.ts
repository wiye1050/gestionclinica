import { db } from './_shared-firebase-client';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { getExtendedPaletteColor } from '../lib/utils/colorGenerator';

/**
 * Script de migración para agregar campo `color` a profesionales y servicios existentes
 *
 * FASE 1: Fundamentos - Migración de datos
 *
 * Este script asigna colores por defecto a:
 * - Profesionales sin campo color (usa paleta extendida con generación HSL)
 * - Servicios del catálogo sin campo color (usa colores por categoría)
 *
 * MEJORA: Usa generación dinámica de colores HSL para clínicas con >8 profesionales
 */

// Colores por categoría para servicios
const SERVICIO_COLORS_BY_CATEGORIA = {
  medicina: '#3B82F6',     // Azul
  fisioterapia: '#10B981', // Verde
  enfermeria: '#F59E0B',   // Naranja
};

interface ProfesionalDoc {
  color?: string;
}

interface ServicioDoc {
  color?: string;
  categoria?: 'medicina' | 'fisioterapia' | 'enfermeria';
}

async function migrateProfesionales() {
  console.log('📋 Migrando profesionales...');
  const col = collection(db, 'profesionales');
  const snap = await getDocs(col);
  const batch = writeBatch(db);
  let count = 0;

  snap.docs.forEach((d, index) => {
    const data = d.data() as ProfesionalDoc;
    if (!data.color) {
      // Usar paleta extendida con generación HSL para >8 profesionales
      const color = getExtendedPaletteColor(index);
      batch.update(doc(db, 'profesionales', d.id), { color });
      console.log(`  ✓ ${d.id}: ${color} ${index >= 8 ? '(HSL generated)' : '(fixed palette)'}`);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Actualizados ${count} profesionales con campo 'color'`);
  } else {
    console.log('✅ Todos los profesionales ya tienen color');
  }

  return count;
}

async function migrateServicios() {
  console.log('\n📋 Migrando servicios del catálogo...');
  const col = collection(db, 'catalogo-servicios');
  const snap = await getDocs(col);
  const batch = writeBatch(db);
  let count = 0;

  snap.docs.forEach((d) => {
    const data = d.data() as ServicioDoc;
    if (!data.color) {
      // Asignar color según categoría
      const categoria = data.categoria || 'medicina';
      const color = SERVICIO_COLORS_BY_CATEGORIA[categoria];
      batch.update(doc(db, 'catalogo-servicios', d.id), { color });
      console.log(`  ✓ ${d.id} (${categoria}): ${color}`);
      count++;
    }
  });

  if (count > 0) {
    await batch.commit();
    console.log(`✅ Actualizados ${count} servicios con campo 'color'`);
  } else {
    console.log('✅ Todos los servicios ya tienen color');
  }

  return count;
}

async function main() {
  console.log('🚀 Iniciando migración de colores...\n');

  try {
    const profesionalesUpdated = await migrateProfesionales();
    const serviciosUpdated = await migrateServicios();

    console.log('\n✨ Migración completada exitosamente');
    console.log(`   Total registros actualizados: ${profesionalesUpdated + serviciosUpdated}`);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ Error fatal:', e);
  process.exit(1);
});
