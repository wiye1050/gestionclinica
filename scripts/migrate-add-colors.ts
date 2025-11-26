import { db } from './_shared-firebase-client';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

/**
 * Script de migración para agregar campo `color` a profesionales y servicios existentes
 *
 * FASE 1: Fundamentos - Migración de datos
 *
 * Este script asigna colores por defecto a:
 * - Profesionales sin campo color (usa paleta rotativa)
 * - Servicios del catálogo sin campo color (usa colores por categoría)
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
      // Asignar color rotativo de la paleta
      const color = PROFESIONAL_COLORS[index % PROFESIONAL_COLORS.length];
      batch.update(doc(db, 'profesionales', d.id), { color });
      console.log(`  ✓ ${d.id}: ${color}`);
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
