import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const proyectosEjemplo = [
  {
    nombre: 'Portal del Paciente',
    descripcion: 'Implementación de portal web para que pacientes accedan a su historial, citas y resultados',
    tipo: 'desarrollo',
    estado: 'en-curso',
    prioridad: 'critica',
    responsableUid: 'demo-user-1',
    responsableNombre: 'Dr. García López',
    progreso: 65,
    fechaInicio: new Date('2025-09-01'),
    fechaFinEstimada: new Date('2025-12-15'),
    presupuesto: 25000,
    horasEstimadas: 320,
    tags: ['frontend', 'pacientes', 'web', 'urgente'],
    color: '#3b82f6',
    hitos: [
      {
        id: '1',
        nombre: 'Diseño UI/UX completado',
        descripcion: 'Wireframes y prototipos aprobados',
        fechaObjetivo: new Date('2025-09-30'),
        fechaCompletado: new Date('2025-09-28'),
        completado: true,
        orden: 1,
      },
      {
        id: '2',
        nombre: 'Backend API lista',
        descripcion: 'Endpoints de autenticación y datos',
        fechaObjetivo: new Date('2025-10-31'),
        fechaCompletado: new Date('2025-10-29'),
        completado: true,
        orden: 2,
      },
      {
        id: '3',
        nombre: 'Frontend funcional',
        descripcion: 'Todas las vistas implementadas',
        fechaObjetivo: new Date('2025-11-30'),
        completado: false,
        orden: 3,
      },
    ],
    tareas: [
      {
        id: '1',
        titulo: 'Implementar login con Firebase',
        estado: 'completada',
        prioridad: 'alta',
        asignadoA: 'dev-1',
        asignadoNombre: 'Juan Pérez',
        fechaLimite: new Date('2025-10-15'),
        completadaEn: new Date('2025-10-14'),
        estimacionHoras: 8,
        horasReales: 7,
        orden: 1,
        createdAt: new Date('2025-09-15'),
        updatedAt: new Date('2025-10-14'),
      },
      {
        id: '2',
        titulo: 'Diseñar dashboard del paciente',
        estado: 'en-curso',
        prioridad: 'alta',
        asignadoA: 'dev-2',
        asignadoNombre: 'María González',
        fechaLimite: new Date('2025-11-05'),
        estimacionHoras: 16,
        orden: 2,
        createdAt: new Date('2025-10-20'),
        updatedAt: new Date('2025-10-25'),
      },
    ],
    actualizaciones: [
      {
        id: '1',
        fecha: new Date('2025-10-29'),
        texto: 'Backend completado al 100%. Pasamos a frontend.',
        tipo: 'hito',
        autor: 'demo-user-1',
        autorNombre: 'Dr. García López',
      },
      {
        id: '2',
        fecha: new Date('2025-10-25'),
        texto: 'Progreso del 65% alcanzado. Frontend avanzando según lo previsto.',
        tipo: 'progreso',
        autor: 'demo-user-1',
        autorNombre: 'Dr. García López',
      },
    ],
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-10-29'),
    creadoPor: 'demo-user-1',
  },
  {
    nombre: 'Sistema de Telemedicina',
    descripcion: 'Integración de videoconsultas con Daily.co para consultas remotas',
    tipo: 'desarrollo',
    estado: 'planificacion',
    prioridad: 'alta',
    responsableUid: 'demo-user-2',
    responsableNombre: 'Dra. Martínez Silva',
    progreso: 15,
    fechaInicio: new Date('2025-11-01'),
    fechaFinEstimada: new Date('2026-01-31'),
    presupuesto: 18000,
    horasEstimadas: 240,
    tags: ['telemedicina', 'video', 'integracion'],
    color: '#10b981',
    hitos: [],
    tareas: [],
    actualizaciones: [
      {
        id: '1',
        fecha: new Date('2025-10-20'),
        texto: 'Reunión inicial con equipo. Definiendo alcance.',
        tipo: 'nota',
        autor: 'demo-user-2',
        autorNombre: 'Dra. Martínez Silva',
      },
    ],
    createdAt: new Date('2025-10-15'),
    updatedAt: new Date('2025-10-20'),
    creadoPor: 'demo-user-2',
  },
  {
    nombre: 'Migración a Next.js 15',
    descripcion: 'Actualizar toda la aplicación a Next.js 15 con App Router',
    tipo: 'infraestructura',
    estado: 'completado',
    prioridad: 'media',
    responsableUid: 'demo-user-1',
    responsableNombre: 'Dr. García López',
    progreso: 100,
    fechaInicio: new Date('2025-08-01'),
    fechaFinEstimada: new Date('2025-09-30'),
    fechaFinReal: new Date('2025-09-28'),
    presupuesto: 12000,
    presupuestoGastado: 11500,
    horasEstimadas: 160,
    horasReales: 155,
    tags: ['infraestructura', 'migration', 'nextjs'],
    color: '#8b5cf6',
    hitos: [
      {
        id: '1',
        nombre: 'Migración completada',
        fechaObjetivo: new Date('2025-09-30'),
        fechaCompletado: new Date('2025-09-28'),
        completado: true,
        orden: 1,
      },
    ],
    tareas: [],
    actualizaciones: [],
    createdAt: new Date('2025-08-01'),
    updatedAt: new Date('2025-09-28'),
    creadoPor: 'demo-user-1',
  },
  {
    nombre: 'Campaña Marketing Digital',
    descripcion: 'Estrategia de marketing digital para atraer nuevos pacientes',
    tipo: 'marketing',
    estado: 'en-curso',
    prioridad: 'media',
    responsableUid: 'demo-user-3',
    responsableNombre: 'Ana Rodríguez',
    progreso: 40,
    fechaInicio: new Date('2025-10-01'),
    fechaFinEstimada: new Date('2025-12-31'),
    presupuesto: 8000,
    tags: ['marketing', 'seo', 'redes-sociales'],
    color: '#f59e0b',
    hitos: [],
    tareas: [],
    actualizaciones: [],
    createdAt: new Date('2025-10-01'),
    updatedAt: new Date('2025-10-29'),
    creadoPor: 'demo-user-3',
  },
  {
    nombre: 'Optimización Base de Datos',
    descripcion: 'Mejorar rendimiento de queries en Firestore',
    tipo: 'mejora',
    estado: 'pausado',
    prioridad: 'baja',
    responsableUid: 'demo-user-1',
    responsableNombre: 'Dr. García López',
    progreso: 25,
    fechaInicio: new Date('2025-09-15'),
    fechaFinEstimada: new Date('2025-11-30'),
    horasEstimadas: 80,
    tags: ['performance', 'firestore', 'backend'],
    color: '#6366f1',
    hitos: [],
    tareas: [],
    actualizaciones: [
      {
        id: '1',
        fecha: new Date('2025-10-10'),
        texto: 'Pausado temporalmente por prioridades más altas.',
        tipo: 'bloqueador',
        autor: 'demo-user-1',
        autorNombre: 'Dr. García López',
      },
    ],
    createdAt: new Date('2025-09-15'),
    updatedAt: new Date('2025-10-10'),
    creadoPor: 'demo-user-1',
  },
];

async function seedProyectos() {
  console.log('🌱 Iniciando seed de proyectos de ejemplo...');

  try {
    for (const proyecto of proyectosEjemplo) {
      const docRef = await addDoc(collection(db, 'proyectos'), {
        ...proyecto,
        fechaInicio: proyecto.fechaInicio ? Timestamp.fromDate(proyecto.fechaInicio) : null,
        fechaFinEstimada: proyecto.fechaFinEstimada ? Timestamp.fromDate(proyecto.fechaFinEstimada) : null,
        fechaFinReal: proyecto.fechaFinReal ? Timestamp.fromDate(proyecto.fechaFinReal) : null,
        createdAt: Timestamp.fromDate(proyecto.createdAt),
        updatedAt: Timestamp.fromDate(proyecto.updatedAt),
        hitos: proyecto.hitos.map(h => ({
          ...h,
          fechaObjetivo: Timestamp.fromDate(h.fechaObjetivo),
          fechaCompletado: h.fechaCompletado ? Timestamp.fromDate(h.fechaCompletado) : null,
        })),
        tareas: proyecto.tareas.map(t => ({
          ...t,
          fechaLimite: t.fechaLimite ? Timestamp.fromDate(t.fechaLimite) : null,
          completadaEn: t.completadaEn ? Timestamp.fromDate(t.completadaEn) : null,
          createdAt: Timestamp.fromDate(t.createdAt),
          updatedAt: Timestamp.fromDate(t.updatedAt),
        })),
        actualizaciones: proyecto.actualizaciones.map(a => ({
          ...a,
          fecha: Timestamp.fromDate(a.fecha),
        })),
      });

      console.log(`✅ Proyecto "${proyecto.nombre}" creado con ID: ${docRef.id}`);
    }

    console.log('🎉 Seed completado exitosamente!');
    console.log(`📊 Total proyectos creados: ${proyectosEjemplo.length}`);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedProyectos().then(() => process.exit(0));
}

export { seedProyectos };
