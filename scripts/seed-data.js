/**
 * Script para poblar Firestore con datos de prueba
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const pacienteId = 'paciente-demo-001';

async function seedData() {
  try {
    console.log('🌱 Iniciando población de datos de prueba...\n');

    console.log('📋 Creando paciente...');
    await setDoc(doc(db, 'pacientes', pacienteId), {
      nombre: 'Juan',
      apellidos: 'Pérez García',
      email: 'juan.perez@example.com',
      telefono: '+34 600 123 456',
      dni: '12345678A',
      fechaNacimiento: Timestamp.fromDate(new Date(1985, 5, 15)),
      direccion: 'Calle Mayor 123, 28013 Madrid',
      alergias: ['Penicilina', 'Frutos secos'],
      alertasMedicas: ['Hipertensión controlada'],
      diagnosticos: ['Hipertensión arterial'],
      contactoEmergencia: {
        nombre: 'María Pérez García',
        relacion: 'Hermana',
        telefono: '+34 600 654 321'
      },
      profesionalReferenteId: 'prof-001',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Paciente creado\n');

    console.log('🏥 Creando historial clínico...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'historial', 'clinico'), {
      alergias: [
        { nombre: 'Penicilina', severidad: 'grave', notas: 'Reacción anafiláctica en 2010' },
        { nombre: 'Frutos secos', severidad: 'moderada', notas: 'Urticaria' }
      ],
      medicacionActual: [
        { nombre: 'Enalapril', dosis: '10mg', frecuencia: '1 vez al día', fechaInicio: Timestamp.fromDate(new Date(2023, 0, 1)) },
        { nombre: 'Atorvastatina', dosis: '20mg', frecuencia: '1 vez al día', fechaInicio: Timestamp.fromDate(new Date(2023, 0, 1)) }
      ],
      antecedentesPersonales: [
        { tipo: 'Quirúrgico', descripcion: 'Apendicectomía en 2010', fecha: Timestamp.fromDate(new Date(2010, 6, 15)) }
      ],
      antecedentesFamiliares: [
        { tipo: 'Cardiovascular', descripcion: 'Padre con hipertensión arterial' }
      ],
      vacunas: [
        { nombre: 'COVID-19 (Pfizer)', fecha: Timestamp.fromDate(new Date(2023, 10, 15)), lote: 'AB12345' },
        { nombre: 'Gripe', fecha: Timestamp.fromDate(new Date(2024, 9, 10)), lote: 'FLU2024' }
      ],
      grupoSanguineo: 'A',
      factorRh: '+',
      updatedAt: Timestamp.now()
    });
    console.log('✅ Historial clínico creado\n');

    console.log('📅 Creando citas...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'citas', 'cita-001'), {
      pacienteId,
      fecha: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      tipo: 'Control rutinario',
      profesional: 'Dr. García López',
      profesionalId: 'prof-001',
      consultorio: 'Consultorio 3',
      estado: 'programada',
      notas: 'Control de hipertensión',
      duracion: 30,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    await setDoc(doc(db, 'pacientes', pacienteId, 'citas', 'cita-002'), {
      pacienteId,
      fecha: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      tipo: 'Consulta general',
      profesional: 'Dr. García López',
      profesionalId: 'prof-001',
      consultorio: 'Consultorio 3',
      estado: 'completada',
      notas: 'Ajuste de medicación',
      duracion: 30,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Citas creadas\n');

    console.log('💊 Creando tratamiento...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'tratamientos', 'trat-001'), {
      pacienteId,
      nombre: 'Control de Hipertensión',
      descripcion: 'Tratamiento farmacológico y seguimiento para control de presión arterial',
      profesional: 'Dr. García López',
      profesionalId: 'prof-001',
      fechaInicio: Timestamp.fromDate(new Date(2023, 0, 1)),
      estado: 'activo',
      progreso: 75,
      sesionesTotales: 12,
      sesionesCompletadas: 9,
      sesiones: [
        {
          id: 'sesion-001',
          numero: 1,
          fecha: Timestamp.fromDate(new Date(2023, 0, 15)),
          estado: 'completada',
          notas: 'Inicio de tratamiento. TA: 150/95',
          profesional: 'Dr. García López',
          profesionalId: 'prof-001'
        },
        {
          id: 'sesion-002',
          numero: 2,
          fecha: Timestamp.fromDate(new Date(2023, 1, 15)),
          estado: 'completada',
          notas: 'Mejora notable. TA: 140/90',
          profesional: 'Dr. García López',
          profesionalId: 'prof-001'
        }
      ],
      notas: 'Paciente cumple bien con el tratamiento',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Tratamiento creado\n');

    console.log('📄 Creando documentos...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'documentos', 'doc-001'), {
      pacienteId,
      nombre: 'Analítica Completa - Enero 2024.pdf',
      tipo: 'analitica',
      tamaño: 245678,
      url: 'https://example.com/docs/analitica-001.pdf',
      fechaSubida: Timestamp.now(),
      subidoPor: 'Dr. García López',
      subidoPorId: 'prof-001',
      etiquetas: ['sangre', 'rutina', '2024'],
      createdAt: Timestamp.now()
    });
    
    await setDoc(doc(db, 'pacientes', pacienteId, 'documentos', 'doc-002'), {
      pacienteId,
      nombre: 'Consentimiento Informado.pdf',
      tipo: 'consentimiento',
      tamaño: 128456,
      url: 'https://example.com/docs/consentimiento-001.pdf',
      fechaSubida: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)),
      subidoPor: 'Dra. Martínez',
      subidoPorId: 'prof-002',
      etiquetas: ['consentimiento', 'tratamiento'],
      createdAt: Timestamp.now()
    });
    console.log('✅ Documentos creados\n');

    console.log('💰 Creando factura...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'facturas', 'fact-001'), {
      pacienteId,
      numero: 'F-2024-001',
      fecha: Timestamp.fromDate(new Date(2024, 9, 1)),
      vencimiento: Timestamp.fromDate(new Date(2024, 9, 31)),
      concepto: 'Consultas y analíticas - Octubre 2024',
      estado: 'pendiente',
      total: 120,
      pagado: 0,
      items: [
        { concepto: 'Consulta médica', cantidad: 2, precioUnitario: 40, total: 80 },
        { concepto: 'Analítica completa', cantidad: 1, precioUnitario: 40, total: 40 }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Factura creada\n');

    console.log('📊 Creando presupuesto...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'presupuestos', 'pres-001'), {
      pacienteId,
      numero: 'P-2024-001',
      fecha: Timestamp.now(),
      validoHasta: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      concepto: 'Chequeo anual completo',
      estado: 'pendiente',
      total: 350,
      items: [
        { concepto: 'Consulta cardiológica', cantidad: 1, precioUnitario: 80, total: 80 },
        { concepto: 'Electrocardiograma', cantidad: 1, precioUnitario: 50, total: 50 },
        { concepto: 'Analítica completa', cantidad: 1, precioUnitario: 70, total: 70 },
        { concepto: 'Ecografía abdominal', cantidad: 1, precioUnitario: 150, total: 150 }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Presupuesto creado\n');

    console.log('📝 Creando notas...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'notas', 'nota-001'), {
      pacienteId,
      titulo: 'Seguimiento de medicación',
      contenido: 'Paciente refiere buena tolerancia al tratamiento. No efectos secundarios. TA controlada en 130/80.',
      categoria: 'clinica',
      autor: 'Dr. García López',
      autorId: 'prof-001',
      fecha: Timestamp.now(),
      esPrivada: false,
      etiquetas: ['hipertension', 'medicacion', 'seguimiento'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    await setDoc(doc(db, 'pacientes', pacienteId, 'notas', 'nota-002'), {
      pacienteId,
      titulo: 'Llamada telefónica',
      contenido: 'Paciente llamó para consultar sobre efectos secundarios. Se le explicó que son normales y temporales.',
      categoria: 'comunicacion',
      autor: 'Recepción',
      autorId: 'recep-001',
      fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      esPrivada: false,
      etiquetas: ['telefono', 'consulta'],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Notas creadas\n');

    console.log('🔔 Creando actividades...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'actividades', 'act-001'), {
      tipo: 'cita',
      titulo: 'Cita programada',
      descripcion: 'Control rutinario con Dr. García',
      fecha: Timestamp.now(),
      usuario: 'Recepción',
      usuarioId: 'recep-001',
      relacionadoId: 'cita-001'
    });
    
    await setDoc(doc(db, 'pacientes', pacienteId, 'actividades', 'act-002'), {
      tipo: 'documento',
      titulo: 'Documento subido',
      descripcion: 'Analítica Completa - Enero 2024.pdf',
      fecha: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      usuario: 'Dr. García López',
      usuarioId: 'prof-001',
      relacionadoId: 'doc-001'
    });
    
    await setDoc(doc(db, 'pacientes', pacienteId, 'actividades', 'act-003'), {
      tipo: 'nota',
      titulo: 'Nota añadida',
      descripcion: 'Seguimiento de medicación',
      fecha: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      usuario: 'Dr. García López',
      usuarioId: 'prof-001',
      relacionadoId: 'nota-001'
    });
    console.log('✅ Actividades creadas\n');

    console.log('👨‍⚕️ Creando profesional referente...');
    await setDoc(doc(db, 'profesionales', 'prof-001'), {
      nombre: 'Dr. García López',
      especialidad: 'Medicina General',
      email: 'garcia@clinica.com',
      telefono: '+34 600 111 222'
    });
    console.log('✅ Profesional creado\n');

    console.log('🎉 ¡Datos de prueba creados exitosamente!\n');
    console.log(`📍 ID del paciente: ${pacienteId}`);
    console.log(`🔗 URL: http://localhost:3002/dashboard/pacientes/${pacienteId}\n`);

  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
    process.exit(1);
  }
}

seedData().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
});
