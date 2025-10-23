import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAEW7rs_D5wCaLLUUhE7cdSr_UhfvIi8Bk",
  authDomain: "clinica-gestion-8ad19.firebaseapp.com",
  projectId: "clinica-gestion-8ad19",
  storageBucket: "clinica-gestion-8ad19.firebasestorage.app",
  messagingSenderId: "1038663504704",
  appId: "1:1038663504704:web:0d7cd4e59df77c53f7c6a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedData() {
  console.log('🌱 Creando datos de ejemplo...');

  // Crear profesionales
  const profesionales = [
    {
      nombre: 'Marcos',
      apellidos: 'García',
      especialidad: 'medicina',
      email: 'marcos@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Daniela',
      apellidos: 'López',
      especialidad: 'medicina',
      email: 'daniela@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Jose Luis',
      apellidos: 'Martínez',
      especialidad: 'fisioterapia',
      email: 'joseluis@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Guille',
      apellidos: 'Rodríguez',
      especialidad: 'fisioterapia',
      email: 'guille@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Claudia',
      apellidos: 'Fernández',
      especialidad: 'enfermeria',
      email: 'claudia@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Simón',
      apellidos: 'Torres',
      especialidad: 'medicina',
      email: 'simon@clinica.com',
      activo: true,
      horasSemanales: 40,
      diasTrabajo: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
      horaInicio: '09:00',
      horaFin: '18:00',
      serviciosAsignados: 0,
      cargaTrabajo: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const prof of profesionales) {
    await addDoc(collection(db, 'profesionales'), prof);
    console.log(`✅ Profesional creado: ${prof.nombre} ${prof.apellidos}`);
  }

  // Crear grupos
  const grupos = [
    {
      nombre: 'Grupo 1: Marcos y Guille',
      pacientes: ['Marcos', 'Guille'],
      color: '#3B82F6',
      activo: true,
      medicinaPrincipal: 'Marcos',
      fisioterapiaPrincipal: 'Guille',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Grupo 2: Daniela y Guille',
      pacientes: ['Daniela', 'Guille'],
      color: '#10B981',
      activo: true,
      medicinaPrincipal: 'Daniela',
      fisioterapiaPrincipal: 'Guille',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      nombre: 'Grupo 3: Simón y Guille',
      pacientes: ['Simón', 'Guille'],
      color: '#F59E0B',
      activo: true,
      medicinaPrincipal: 'Simón',
      fisioterapiaPrincipal: 'Guille',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  for (const grupo of grupos) {
    await addDoc(collection(db, 'grupos-pacientes'), grupo);
    console.log(`✅ Grupo creado: ${grupo.nombre}`);
  }

  console.log('🎉 Datos de ejemplo creados correctamente!');
  process.exit(0);
}

seedData().catch(console.error);