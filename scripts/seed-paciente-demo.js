/**
 * Script para poblar Firestore con datos de prueba usando Firebase Client SDK
 * Ejecutar: node scripts/seed-paciente-demo.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Cargar variables de entorno desde .env.local
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: No se encontró .env.local');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnvLocal();

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const pacienteId = 'paciente-demo-001';

async function seedData() {
  try {
    console.log('🌱 Iniciando población de datos de prueba...\n');

    // 1. Crear paciente
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

    // 2. Crear profesional referente
    console.log('👨‍⚕️ Creando profesional referente...');
    await setDoc(doc(db, 'profesionales', 'prof-001'), {
      nombre: 'Dr. García López',
      especialidad: 'Medicina General',
      email: 'garcia@clinica.com',
      telefono: '+34 600 111 222'
    });
    console.log('✅ Profesional creado\n');

    // 3. Crear historial clínico
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

    // 4. Crear citas
    console.log('📅 Creando citas...');
    const citas = [
      {
        id: 'cita-001',
        fecha: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        tipo: 'Control rutinario',
        profesional: 'Dr. García López',
        profesionalId: 'prof-001',
        consultorio: 'Consultorio 3',
        estado: 'programada',
        notas: 'Control de hipertensión',
        duracion: 30
      },
      {
        id: 'cita-002',
        fecha: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
        tipo: 'Consulta general',
        profesional: 'Dr. García López',
        profesionalId: 'prof-001',
        consultorio: 'Consultorio 3',
        estado: 'completada',
        notas: 'Ajuste de medicación',
        duracion: 30
      }
    ];

    for (const cita of citas) {
      await setDoc(doc(db, 'pacientes', pacienteId, 'citas', cita.id), {
        ...cita,
        pacienteId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    console.log('✅ Citas creadas\n');

    // 5. Crear tratamiento
    console.log('💊 Creando tratamiento...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'tratamientos', 'trat-001'), {
      pacienteId,
      nombre: 'Control de Hipertensión',
      descripcion: 'Tratamiento farmacológico y seguimiento',
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
        }
      ],
      notas: 'Paciente cumple bien con el tratamiento',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Tratamiento creado\n');

    // 6. Crear documentos
    console.log('📄 Creando documentos...');
    const documentos = [
      {
        id: 'doc-001',
        nombre: 'Analítica Completa - Enero 2024.pdf',
        tipo: 'analitica',
        tamaño: 245678,
        url: 'https://example.com/docs/analitica-001.pdf',
        fechaSubida: Timestamp.now(),
        subidoPor: 'Dr. García López',
        subidoPorId: 'prof-001',
        etiquetas: ['sangre', 'rutina', '2024']
      }
    ];

    for (const documento of documentos) {
      await setDoc(doc(db, 'pacientes', pacienteId, 'documentos', documento.id), {
        ...documento,
        pacienteId,
        createdAt: Timestamp.now()
      });
    }
    console.log('✅ Documentos creados\n');

    // 7. Crear factura
    console.log('💰 Creando factura...');
    await setDoc(doc(db, 'pacientes', pacienteId, 'facturas', 'fact-001'), {
      pacienteId,
      numero: 'F-2024-001',
      fecha: Timestamp.fromDate(new Date(2024, 9, 1)),
      vencimiento: Timestamp.fromDate(new Date(2024, 9, 31)),
      concepto: 'Consultas - Octubre 2024',
      estado: 'pendiente',
      total: 120,
      pagado: 0,
      items: [
        { concepto: 'Consulta médica', cantidad: 2, precioUnitario: 40, total: 80 },
        { concepto: 'Analítica', cantidad: 1, precioUnitario: 40, total: 40 }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Factura creada\n');

    // 8. Crear presupuesto
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
        { concepto: 'Analítica completa', cantidad: 1, precioUnitario: 70, total: 70 }
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✅ Presupuesto creado\n');

    // 9. Crear notas
    console.log('📝 Creando notas...');
    const notas = [
      {
        id: 'nota-001',
        titulo: 'Seguimiento de medicación',
        contenido: 'Paciente refiere buena tolerancia al tratamiento. TA controlada en 130/80.',
        categoria: 'clinica',
        autor: 'Dr. García López',
        autorId: 'prof-001',
        fecha: Timestamp.now(),
        esPrivada: false,
        etiquetas: ['hipertension', 'medicacion']
      }
    ];

    for (const nota of notas) {
      await setDoc(doc(db, 'pacientes', pacienteId, 'notas', nota.id), {
        ...nota,
        pacienteId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    }
    console.log('✅ Notas creadas\n');

    // 10. Crear actividades
    console.log('🔔 Creando actividades...');
    const actividades = [
      {
        id: 'act-001',
        tipo: 'cita',
        titulo: 'Cita programada',
        descripcion: 'Control rutinario con Dr. García',
        fecha: Timestamp.now(),
        usuario: 'Recepción',
        usuarioId: 'recep-001',
        relacionadoId: 'cita-001'
      }
    ];

    for (const actividad of actividades) {
      await setDoc(doc(db, 'pacientes', pacienteId, 'actividades', actividad.id), actividad);
    }
    console.log('✅ Actividades creadas\n');

    console.log('🎉 ¡Datos creados exitosamente!\n');
    console.log(`📍 ID del paciente: ${pacienteId}`);
    console.log(`🔗 URL: http://localhost:3002/dashboard/pacientes/${pacienteId}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedData().then(() => {
  console.log('✅ Script completado');
  process.exit(0);
});
