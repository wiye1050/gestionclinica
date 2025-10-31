# Ficha de Paciente V2 - Sistema Completo

## 📁 Archivos Creados

```
components/pacientes/v2/
├── PatientHeader.tsx              # Header con foto, datos y acciones
├── PatientTimeline.tsx            # Timeline de actividad lateral
├── PatientResumenTab.tsx          # Tab de Resumen (dashboard)
└── PatientProfileLayout.tsx       # Layout principal (integra todo)
```

## 🚀 Cómo Usar

### 1. Importar componentes

```tsx
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import { Activity } from '@/components/pacientes/v2/PatientTimeline';
```

### 2. Ejemplo de implementación completa

```tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import PatientProfileLayout, { PatientTab } from '@/components/pacientes/v2/PatientProfileLayout';
import PatientResumenTab from '@/components/pacientes/v2/PatientResumenTab';
import { Activity } from '@/components/pacientes/v2/PatientTimeline';

export default function PacientePage() {
  const params = useParams();
  const pacienteId = params?.id as string;
  
  const [activeTab, setActiveTab] = useState<PatientTab>('resumen');
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  
  // Datos de ejemplo - reemplazar con tus queries reales
  const actividades: Activity[] = [
    {
      id: '1',
      tipo: 'cita',
      titulo: 'Consulta con Dr. García',
      descripcion: 'Control post-operatorio',
      fecha: new Date(),
      usuario: 'Dr. García'
    },
    {
      id: '2',
      tipo: 'documento',
      titulo: 'Informe subido',
      fecha: new Date(Date.now() - 86400000), // ayer
    }
  ];

  const proximasCitas = [
    {
      id: '1',
      fecha: new Date(Date.now() + 7 * 86400000),
      profesional: 'Dr. García',
      tipo: 'Seguimiento'
    }
  ];

  const tratamientosActivos = [
    {
      id: '1',
      nombre: 'Fisioterapia post-operatoria',
      progreso: 65,
      profesional: 'Dr. Martínez'
    }
  ];

  const estadisticas = {
    totalCitas: 45,
    ultimaVisita: new Date(Date.now() - 14 * 86400000),
    tratamientosCompletados: 3,
    facturasPendientes: 120
  };

  if (!paciente) return <div>Cargando...</div>;

  return (
    <PatientProfileLayout
      paciente={paciente}
      actividades={actividades}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onNewCita={() => console.log('Nueva cita')}
      onNewNota={() => console.log('Nueva nota')}
      onUploadDoc={() => console.log('Subir doc')}
    >
      {activeTab === 'resumen' && (
        <PatientResumenTab
          paciente={paciente}
          profesionalReferente={null}
          proximasCitas={proximasCitas}
          tratamientosActivos={tratamientosActivos}
          estadisticas={estadisticas}
        />
      )}

      {activeTab === 'historial-clinico' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2>Historial Clínico</h2>
          {/* Tu contenido del historial */}
        </div>
      )}

      {activeTab === 'citas' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2>Citas</h2>
          {/* Tu contenido de citas */}
        </div>
      )}

      {/* Resto de tabs... */}
    </PatientProfileLayout>
  );
}
```

## 🎨 Características

### PatientHeader
- Avatar con iniciales
- Badge de alertas médicas
- Datos principales (edad, DNI, teléfono, email)
- Alertas críticas destacadas (alergias)
- Botones de acción:
  - Nueva Cita
  - Editar
  - Más acciones (dropdown)

### PatientTimeline
- Actividad reciente ordenada por fecha
- Iconos por tipo de actividad
- Colores por estado
- Scroll infinito
- Tiempo relativo ("Hace 2h", "Ayer", etc.)

### PatientResumenTab
- Datos personales completos
- Contacto de emergencia
- Profesional referente
- Alertas médicas (alergias, alertas clínicas, diagnósticos)
- Próximas citas (3 más cercanas)
- Tratamientos activos con progreso
- Estadísticas (total citas, última visita, completados, pendiente)

### PatientProfileLayout
- Layout responsive (3 columnas desktop, 1 móvil)
- Tabs de navegación
- Timeline lateral sticky
- Integra todo el sistema

## 📋 Tipos de Actividad

```tsx
type ActivityType = 
  | 'cita'           // Azul
  | 'documento'      // Púrpura
  | 'receta'         // Rosa
  | 'tratamiento'    // Verde
  | 'nota'           // Gris
  | 'factura'        // Esmeralda
  | 'pago';          // Esmeralda
```

## 🎯 Próximos Pasos

### Fase 2 - Tabs Adicionales (Ya implementados los componentes base)
1. **Historial Clínico completo**
   - Alergias con severidad
   - Antecedentes personales/familiares
   - Medicación actual
   - Vacunaciones
   - Resultados de laboratorio

2. **Tab de Citas**
   - Timeline de todas las citas
   - Vista de detalle de cada cita
   - Notas de evolución

3. **Tab de Tratamientos**
   - Activos/Pendientes/Completados
   - Progreso por sesión
   - Documentos relacionados

### Fase 3 - Documentos
- Gestor de carpetas
- Upload múltiple
- Preview de archivos
- Búsqueda

### Fase 4 - Facturación
- Resumen financiero
- Lista de facturas
- Presupuestos
- PDFs

### Fase 5 - Notas
- Sistema de notas internas
- Con etiquetas
- Búsqueda
- Privadas/compartidas

## 💡 Tips

1. **Responsive**: El layout se adapta automáticamente
   - Desktop: Header + Tabs + Contenido (8 col) + Timeline (4 col)
   - Mobile: Todo en 1 columna, timeline colapsable

2. **Sticky Timeline**: Usa `sticky top-6` para que el timeline se quede visible al scroll

3. **Colores funcionales**: 
   - Rojo: Alertas críticas
   - Verde: Completado/éxito
   - Azul: Info/acciones
   - Amarillo: Avisos
   
4. **Iconos**: Usa Lucide React para consistencia

## 🔄 Migración desde V1

Para migrar gradualmente:

```tsx
// Opción 1: Ruta nueva
/dashboard/pacientes/[id]/v2

// Opción 2: Feature flag
const useV2 = true;
{useV2 ? <NuevaFicha /> : <FichaAntigua />}
```

## 📦 Dependencias

- Lucide React (iconos)
- date-fns (fechas)
- Tailwind CSS (estilos)
- Next.js 15
- TypeScript

---

**Estado:** ✅ Fase 1 completada (Header + Layout + Resumen + Timeline)

**Siguiente:** Implementar tabs adicionales según prioridad
