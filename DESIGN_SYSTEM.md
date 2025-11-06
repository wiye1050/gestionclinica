# 🎨 GUÍA DE ESTILO - SISTEMA DE DISEÑO

## Paleta de Colores Principal

### Azul (Primary) - Profesional Médico
```css
--primary-500: #3b82f6  /* Azul principal */
--primary-600: #2563eb  /* Botones, enlaces activos */
--primary-700: #1d4ed8  /* Hover de botones */
```

**Uso:**
- Botones principales: `bg-blue-600 text-white`
- Enlaces: `text-blue-600 hover:text-blue-700`
- Estados activos en sidebar: `bg-blue-50 text-blue-600`
- Badges informativos: `bg-blue-100 text-blue-700`

### Grises - Estructura y Texto
```css
--gray-900: #111827  /* Texto principal - NEGRO */
--gray-600: #4b5563  /* Texto secundario */
--gray-500: #6b7280  /* Texto terciario, placeholders */
--gray-200: #e5e7eb  /* Bordes */
--gray-100: #f3f4f6  /* Fondos secundarios */
--gray-50: #f9fafb   /* Fondo de página */
```

**Uso:**
- Texto principal: `text-gray-900` (negro)
- Texto secundario: `text-gray-600`
- Fondos: `bg-white` (cards), `bg-gray-50` (página)
- Bordes: `border-gray-200`

### Verde (Success) - Estados Positivos
```css
--success-600: #16a34a  /* Exitoso, completado */
--success-100: #dcfce7  /* Badge de éxito */
```

**Uso:**
- Botones de éxito: `bg-green-600 text-white`
- Badges: `bg-green-100 text-green-700`
- Estados "realizada", "activo", "aprobado"

### Rojo (Error) - Alertas y Peligro
```css
--error-600: #dc2626    /* Peligro, errores */
--error-100: #fee2e2    /* Badge de error */
```

**Uso:**
- Botones peligrosos: `bg-red-600 text-white`
- Badges: `bg-red-100 text-red-700`
- Estados "cancelada", "crítico", "pendiente urgente"

### Amarillo (Warning) - Advertencias
```css
--warning-600: #d97706   /* Advertencias */
--warning-100: #fef3c7   /* Badge de advertencia */
```

**Uso:**
- Badges: `bg-yellow-100 text-yellow-700`
- Estados "en proceso", "media prioridad"

### Morado (Purple) - Especial
```css
--purple-600: #9333ea
--purple-100: #faf5ff
```

**Uso:**
- Badges de categorías especiales
- Iconos diferenciadores

---

## 🎯 Componentes Comunes

### Botones

#### Primario (Acciones principales)
```tsx
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
  Guardar
</button>
```

#### Secundario (Acciones secundarias)
```tsx
<button className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg">
  Cancelar
</button>
```

#### Peligro (Eliminar, cancelar)
```tsx
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
  Eliminar
</button>
```

### Cards
```tsx
<div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-bold text-gray-900">Título</h3>
  <p className="text-gray-600">Contenido</p>
</div>
```

### Badges

#### Estado completado/activo
```tsx
<span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
  Completada
</span>
```

#### Estado pendiente/crítico
```tsx
<span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
  Pendiente
</span>
```

#### Estado en proceso
```tsx
<span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
  En proceso
</span>
```

#### Informativo
```tsx
<span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
  Programada
</span>
```

### Inputs
```tsx
<div>
  <label className="block text-sm font-medium text-gray-900 mb-2">
    Nombre
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
    placeholder="Escribe aquí..."
  />
</div>
```

### Tablas
```tsx
<table className="w-full">
  <thead className="bg-gray-50">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
        Columna
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-4 text-sm text-gray-900">
        Contenido
      </td>
    </tr>
  </tbody>
</table>
```

---

## 📏 Espaciado

- **Pequeño:** `p-2` o `p-4` (8px - 16px)
- **Medio:** `p-4` o `p-6` (16px - 24px)
- **Grande:** `p-6` o `p-8` (24px - 32px)

- **Gap entre elementos:** `gap-2`, `gap-4`, `gap-6`
- **Margin:** `mb-2`, `mb-4`, `mb-6`, `mt-4`, etc.

---

## 🔤 Tipografía

### Títulos
```tsx
<h1 className="text-3xl font-bold text-gray-900">Título Principal</h1>
<h2 className="text-2xl font-bold text-gray-900">Subtítulo</h2>
<h3 className="text-xl font-semibold text-gray-900">Sección</h3>
```

### Párrafos
```tsx
<p className="text-gray-900">Texto principal</p>
<p className="text-gray-600">Texto secundario</p>
<p className="text-sm text-gray-500">Texto pequeño/ayuda</p>
```

---

## ✅ Reglas de Oro

1. **Texto principal siempre en negro** (`text-gray-900`)
2. **Fondo de cards siempre blanco** (`bg-white`)
3. **Fondo de página siempre gris claro** (`bg-gray-50`)
4. **Botones principales en azul** (`bg-blue-600`)
5. **Bordes sutiles** (`border-gray-200`)
6. **Badges con fondo claro + texto oscuro** (ej: `bg-green-100 text-green-700`)
7. **Hover siempre con transición** (`hover:bg-gray-50 transition-colors`)
8. **Iconos del mismo color que el texto** (heredan automáticamente)

---

## 🚫 Evitar

- ❌ Texto gris claro sobre fondo blanco (mal contraste)
- ❌ Demasiados colores en una misma vista
- ❌ Badges con fondo oscuro sin buen contraste
- ❌ Mezclar estilos de botones
- ❌ Usar `text-gray-500` o `text-gray-400` para texto principal

---

## 📱 Responsive

- Sidebar: Ocultar en móvil o convertir a drawer
- Tablas: Scroll horizontal en móvil
- Espaciado: Reducir padding en móvil (`md:p-6 p-4`)
- Grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
