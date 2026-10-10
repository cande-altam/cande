# Candela Café & Patisserie — Sistema de Pedidos de Producción

Sistema interno de pedidos para las dos sucursales (SLA 5.0 y San Luis) hacia las áreas de producción.

---

## Configuración rápida

### 1. Crear proyecto en Firebase

1. Ir a [console.firebase.google.com](https://console.firebase.google.com/)
2. Crear un proyecto nuevo (ej: `candela-produccion`)
3. En el proyecto, ir a **Build → Realtime Database → Create database**
   - Elegir la región más cercana (ej: `us-central1`)
   - Iniciar en **modo de prueba** (luego configurar reglas)

### 2. Copiar credenciales

1. En Firebase Console → **Project Settings** (ícono de engranaje) → **Your apps → Web app**
2. Si no hay una app web, hacer click en `</>` para registrar una
3. Copiar el objeto `firebaseConfig` que aparece
4. Abrir `js/config.js` y reemplazar los valores `TODO_...` con los valores reales:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "candela-produccion.firebaseapp.com",
  databaseURL: "https://candela-produccion-default-rtdb.firebaseio.com",
  projectId: "candela-produccion",
  storageBucket: "candela-produccion.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc..."
};
```

### 3. Reglas de seguridad (Realtime Database)

En Firebase Console → **Realtime Database → Rules**, pegar:

```json
{
  "rules": {
    ".read":  "auth == null",
    ".write": "auth == null"
  }
}
```

> **Nota**: Esta configuración permite acceso sin autenticación de Firebase, lo cual es intencional — el sistema usa contraseñas compartidas por rol (almacenadas en Firebase). Si querés mayor seguridad, podés implementar autenticación anónima de Firebase.

### 4. Desplegar en Netlify

**Opción A — Drag & drop (más simple):**
1. Ir a [app.netlify.com](https://app.netlify.com/) e iniciar sesión
2. Arrastrar la carpeta `pedido-de-produccion/` al área de deploy
3. ¡Listo! Copiar la URL generada y compartirla con el equipo

**Opción B — Desde GitHub:**
1. Subir los archivos a un repositorio de GitHub
2. En Netlify → **Add new site → Import from Git**
3. Seleccionar el repositorio
4. En "Publish directory" poner: `/` (raíz del repo)
5. Click en **Deploy site**

---

## Contraseñas por defecto

| Rol | Contraseña inicial |
|---|---|
| SLA 5.0 | `candela123` |
| San Luis | `candela123` |
| Panadería | `produccion123` |
| Pastelería | `produccion123` |
| Facturería | `produccion123` |
| Especialidades | `produccion123` |
| Sandwiches | `produccion123` |
| Compras | `compras123` |
| Admin | `admin2024` |

Las contraseñas se pueden cambiar desde el **Panel de Admin** (rol `admin`).

---

## Estructura de archivos

```
pedido-de-produccion/
├── index.html          — App HTML única (SPA)
├── css/
│   └── styles.css      — Estilos (mobile-first, paleta café)
├── js/
│   ├── config.js       — Configuración Firebase y contraseñas por defecto
│   ├── auth.js         — Login / logout / sesión
│   ├── catalogo.js     — Catálogo de productos e insumos (seed + Firebase)
│   ├── mercaderia.js   — Flujo de pedidos de mercadería
│   ├── insumos.js      — Flujo de pedidos de insumos
│   ├── admin.js        — Panel de administración
│   └── app.js          — Shell, router, navegación
└── README.md
```

---

## Flujo de uso

### Locales (SLA 5.0 / San Luis)
1. Ingresan con su contraseña
2. Seleccionan el área (Panadería, Pastelería, etc.)
3. Cargan cantidades de productos del catálogo
4. Hacen click en **"Hacer pedido"**
5. Si es fuera del horario de corte → se muestra aviso amarillo

### Áreas de producción
1. Ingresan con su contraseña
2. Ven el consolidado de ambos locales para hoy
3. Pueden marcar **"En producción"** y luego **"Listo para despacho"**
4. Pueden imprimir la vista consolidada (botón Imprimir)

### Compras (despacho de mercadería)
1. Ingresan con su contraseña
2. Ven los pedidos con estado **"Listo para despacho"**
3. Hacen click en **"Despachar a [local]"** por pedido
4. También gestionan los pedidos de insumos de todas las áreas

### Admin
1. Ingresa con `admin` / `admin2024`
2. Puede editar el catálogo de productos e insumos por área
3. Puede cambiar contraseñas de cualquier rol
4. Puede ver todos los pedidos con filtros por fecha, área y estado

---

## Horarios de corte

| Área | Corte |
|---|---|
| Panadería | 9:00 hs |
| Pastelería | 16:00 hs |
| Facturería | Sin corte |
| Especialidades | Sin corte |
| Sandwiches | Sin corte |

Los pedidos fuera de horario se marcan con el indicador **⏰ Fuera de horario** pero igual se envían.

---

## Notas técnicas

- **Framework**: ninguno — HTML + CSS + JS vanilla
- **Base de datos**: Firebase Realtime Database (tiempo real con `onValue`)
- **Zona horaria**: America/Argentina/Buenos_Aires (UTC-3)
- **Compatibilidad**: Chrome, Safari, Firefox, Edge modernos; optimizado para móvil
- **Impresión**: estilos `@media print` ocultan nav y botones, muestran tabla limpia
