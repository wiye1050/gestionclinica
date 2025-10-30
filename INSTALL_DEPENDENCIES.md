# 🔧 INSTALACIÓN REQUERIDA

## Error Actual
```
Module not found: Can't resolve '@tanstack/react-query'
```

## Solución

Ejecuta este comando en la terminal desde la raíz del proyecto:

```bash
npm install @tanstack/react-query@^5.59.0 @tanstack/react-query-devtools@^5.59.0
```

O si usas yarn:

```bash
yarn add @tanstack/react-query@^5.59.0 @tanstack/react-query-devtools@^5.59.0
```

## Verificación

Después de instalar, tu `package.json` debería incluir:

```json
"dependencies": {
  "@tanstack/react-query": "^5.59.0",
  "@tanstack/react-query-devtools": "^5.59.0",
  // ... otras dependencias
}
```

## Reiniciar el servidor

```bash
npm run dev
```

## ¿Por qué React Query?

React Query es la librería de gestión de estado asíncrono que permite:
- ✅ Caché automático de datos
- ✅ Sincronización en background
- ✅ Invalidación inteligente
- ✅ Reducción del 60% en llamadas a Firebase
- ✅ Mejor experiencia de usuario

Es una dependencia estándar en proyectos Next.js modernos y no agrega peso significativo al bundle (~10KB gzipped).
