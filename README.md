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

> Además del sistema de Pedidos de Producción, el repo incluye `costeo-proveedores/` (app separada, ver más abajo), `netlify/functions/` (función serverless para el escaneo de facturas) y `netlify.toml` (configuración de deploy/funciones de Netlify).

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

## Módulo: Costeo & Proveedores (IA)

App separada, de uso exclusivo de administración, ubicada en `costeo-proveedores/` (no forma parte del sistema de Pedidos de Producción). Permite:

- Registrar facturas de proveedores sacándoles una foto — opcionalmente escaneada automáticamente con IA (proveedor, monto, fecha, ítems), siempre revisable/editable antes de guardar.
- Generar automáticamente la orden de pago de cada factura y marcarla pagada/no pagada.
- Mantener un catálogo de insumos con su precio actual e historial de precios.
- Cargar productos con su receta (qué insumos y en qué cantidad llevan) y calcular su costo automáticamente a partir del precio de los insumos.
- Comparar la variación de precio de cada insumo contra la inflación mensual cargada a mano, y alertar cuáles subieron por encima de la inflación.

### Acceso

URL: `https://<tu-sitio>.netlify.app/costeo-proveedores/`. Contraseña inicial: `costeo2025` (cambiable desde la pestaña **Configuración**).

### Datos

Usa el **mismo proyecto Firebase** que el sistema de Pedidos de Producción, bajo la rama `costeo/` (no pisa los datos existentes). Las fotos de facturas se guardan en Firebase Storage.

En Firebase Console → **Storage → Rules**, pegar (mismo criterio que las reglas de Realtime Database):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Escaneo automático por IA (opcional)

El botón "Escanear con IA" llama a una función serverless (`netlify/functions/extraer-factura.js`) que usa la API de Claude (Anthropic) para leer la factura. Esto requiere:

1. Desplegar el sitio en Netlify **vía GitHub** (Add new site → Import from Git) — el deploy por drag & drop no empaqueta funciones.
2. En el sitio de Netlify → **Site configuration → Environment variables**, agregar `ANTHROPIC_API_KEY` con una clave válida de [console.anthropic.com](https://console.anthropic.com/).

Si la clave no está configurada, o el escaneo falla, no pasa nada: el formulario de "Nueva factura" se completa a mano igual, sin ninguna dependencia de la IA para funcionar.

---

## Módulo: Presupuestos

App separada, de uso exclusivo de administración, ubicada en `presupuestos/`. URL: `https://<tu-sitio>.netlify.app/presupuestos/`. Contraseña inicial: `presupuestos2025` (cambiable desde **Configuración**). Usa el mismo proyecto Firebase que Pedidos de Producción, bajo la rama `presupuestos/` (no pisa datos existentes).

Permite armar cotizaciones para clientes con ítems libres (descripción + cantidad + precio unitario, subtotal y total automáticos, descuento opcional), con estados **Borrador → Enviado → Aceptado / Rechazado** y una vista imprimible/PDF (botón "Ver / Imprimir").

### Integración con Pedidos de Clientes

Este módulo **no incluye** un sistema de seguimiento de pedidos de clientes propio — eso ya existe como app separada (rama `claude/stoic-cori-7e9bj9`, proyecto Firebase `pedidos-de-clientes-4775b`). Presupuestos solo **escribe** ahí: al marcar un presupuesto como **Aceptado**, pide los datos que ese sistema necesita y no están en la cotización (local de retiro, vendedor/a, hora de entrega, seña), y registra un pedido nuevo con el mismo formato que usa esa app (mismo `orderCounter`, mismo `orders/{id}`, misma ficha de `clients/{id}`). Cada ítem del presupuesto lleva asignada un área de producción (Panadería/Pastelería/Facturería/Especialidades/Sándwiches) para que el pedido aparezca correctamente en la Cuadra de esa área.

> ⚠️ Los arrays de vendedores (`VENDEDORES`) y locales (`LOCALES_CLIENTE`) están duplicados en `presupuestos/index.html` para poder armar el pedido con el formato exacto que espera el otro sistema. Si el equipo de vendedores o los locales cambian allá, hay que actualizarlos acá también.

---

## Notas técnicas

- **Framework**: ninguno — HTML + CSS + JS vanilla
- **Base de datos**: Firebase Realtime Database (tiempo real con `onValue`)
- **Zona horaria**: America/Argentina/Buenos_Aires (UTC-3)
- **Compatibilidad**: Chrome, Safari, Firefox, Edge modernos; optimizado para móvil
- **Impresión**: estilos `@media print` ocultan nav y botones, muestran tabla limpia
