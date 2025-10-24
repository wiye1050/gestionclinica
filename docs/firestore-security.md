# Firestore Security Recommendations

> **Nota:** ajusta estas reglas a tu estructura exacta y prueba con la herramienta de simulación de Firebase antes de desplegar en producción.

## Reglas base

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function hasRole(role) {
      return isSignedIn() && role in request.auth.token.roles;
    }

    // Permitir solo lectura a usuarios autenticados por defecto.
    match /{document=**} {
      allow read: if isSignedIn();
      allow write: if false;
    }
```

### Pacientes (`pacientes`, `pacientes-historial`)

```javascript
    match /pacientes/{pacienteId} {
      allow read: if hasRole('coordinacion') || hasRole('direccion') || (
        hasRole('profesional') &&
        exists(/databases/$(database)/documents/agenda-eventos/{eventId})
          where resource.data.pacienteId == pacienteId &&
                resource.data.profesionalId == request.auth.uid
      );

      allow create, update: if hasRole('coordinacion') || hasRole('direccion');
      allow delete: if false;
    }

    match /pacientes-historial/{historialId} {
      allow read: if hasRole('coordinacion') || hasRole('direccion') || hasRole('profesional');
      allow create: if hasRole('coordinacion') || hasRole('profesional');
      allow update: if hasRole('coordinacion') || hasRole('profesional');
      allow delete: if false;
    }
```

### Agenda (`agenda-eventos`, `agenda-bloques`)

```javascript
    match /agenda-eventos/{eventoId} {
      allow read: if isSignedIn();
      allow create, update: if hasRole('coordinacion') || hasRole('direccion');
      allow delete: if hasRole('coordinacion') || hasRole('direccion');
    }

    match /agenda-bloques/{bloqueId} {
      allow read: if isSignedIn();
      allow write: if hasRole('coordinacion') || hasRole('direccion');
    }
```

### Servicios, Tratamientos, Profesionales

```javascript
    match /catalogo-servicios/{id} {
      allow read: if isSignedIn();
      allow write: if hasRole('coordinacion') || hasRole('direccion');
    }

    match /profesionales/{id} {
      allow read: if isSignedIn();
      allow write: if hasRole('direccion');
    }

    match /servicios-asignados/{id} {
      allow read: if isSignedIn();
      allow write: if hasRole('coordinacion');
    }
  }
}
```

## Buenas prácticas

- Usa **roles en custom claims** (`roles: ['coordinacion']`) para evaluar permisos.
- Limita los campos accesibles: para datos muy sensibles crea subcolecciones con reglas más estrictas.
- Añade validaciones en reglas (por ejemplo, evitar fechas anteriores en agenda).
- Registra auditoría en Cloud Functions si necesitas histórico de cambios delicados.
- Cuando generes enlaces temporales (por ejemplo, historiales PDF en Storage), define un proceso que elimine objetos caducados y actualice el registro correspondiente en `pacientes-historial`.
