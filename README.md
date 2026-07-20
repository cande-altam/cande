# Candela Café & Patisserie — Herramientas de Administración

Este repositorio (rama `claude/business-app-features-9mfa1a`) contiene las herramientas internas de **uso exclusivo de administración** para costear productos y armar presupuestos a clientes. No incluye el sistema de Pedidos de Producción (locales ↔ áreas de producción) ni el de Pedidos de Clientes — esos viven en otras ramas/sitios.

| App | Carpeta | Para qué sirve |
|---|---|---|
| **Costeo & Proveedores** | `costeo-proveedores/` | Facturas de proveedores, órdenes de pago, precio e historial de insumos, costeo automático de productos, comparación con inflación |
| **Presupuestos** | `presupuestos/` | Cotizaciones a clientes con ítems libres; al aceptarse, registra el pedido en el sistema de Pedidos de Clientes (otro proyecto/rama) |

---

## Módulo: Costeo & Proveedores (IA)

Ubicado en `costeo-proveedores/`. Permite:

- Registrar facturas de proveedores sacándoles una foto — opcionalmente escaneada automáticamente con IA (proveedor, monto, fecha, ítems), siempre revisable/editable antes de guardar.
- Generar automáticamente la orden de pago de cada factura y marcarla pagada/no pagada.
- Mantener un catálogo de insumos con su precio actual e historial de precios.
- Cargar productos con su receta (qué insumos y en qué cantidad llevan) y calcular su costo automáticamente a partir del precio de los insumos.
- Comparar la variación de precio de cada insumo contra la inflación mensual cargada a mano, y alertar cuáles subieron por encima de la inflación.

### Acceso

URL: `https://<tu-sitio>.netlify.app/costeo-proveedores/`. Contraseña inicial: `costeo2025` (cambiable desde la pestaña **Configuración**).

### Configuración en Firebase

Usa el proyecto Firebase `pedidos-de-produccion-ee3cb` (ya existente), bajo la rama de datos `costeo/`. **No requiere ninguna configuración adicional** — las fotos de facturas se guardan comprimidas (como texto, base64) directo en la misma Realtime Database que ya está habilitada, en vez de usar Firebase Storage, así que no hace falta activar ni configurar nada nuevo.

> Nota: esto hace que cada factura con foto ocupe más espacio en la base de datos que si estuviera en Storage. Para el volumen de un negocio como este no debería ser un problema, pero si en algún momento la base crece mucho y querés optimizar, se puede migrar a Firebase Storage más adelante.

### Escaneo automático por IA (opcional)

El botón "Escanear con IA" llama a una función serverless (`netlify/functions/extraer-factura.js`) que usa la API de Claude (Anthropic) para leer la factura. Esto requiere:

1. Desplegar el sitio en Netlify **vía GitHub** (Add new site → Import from Git) — el deploy por drag & drop no empaqueta funciones.
2. En el sitio de Netlify → **Site configuration → Environment variables**, agregar `ANTHROPIC_API_KEY` con una clave válida de [console.anthropic.com](https://console.anthropic.com/).

Si la clave no está configurada, o el escaneo falla, no pasa nada: el formulario de "Nueva factura" se completa a mano igual, sin ninguna dependencia de la IA para funcionar.

---

## Módulo: Presupuestos

Ubicado en `presupuestos/`. URL: `https://<tu-sitio>.netlify.app/presupuestos/`. Contraseña inicial: `presupuestos2025` (cambiable desde **Configuración**).

Permite armar cotizaciones para clientes con ítems libres (descripción + área de producción + cantidad + precio unitario, subtotal y total automáticos, descuento opcional), con estados **Borrador → Enviado → Aceptado / Rechazado** y una vista imprimible/PDF (botón "Ver / Imprimir").

### Configuración en Firebase

Usa el mismo proyecto Firebase `pedidos-de-produccion-ee3cb`, bajo la rama de datos `presupuestos/`. No requiere ninguna configuración adicional (ya tiene Realtime Database habilitada y con reglas abiertas).

### Integración con Pedidos de Clientes

Este módulo **no incluye** un sistema de seguimiento de pedidos de clientes propio — eso ya existe como app separada, en otra rama del repo (`claude/stoic-cori-7e9bj9`), con su propio proyecto Firebase (`pedidos-de-clientes-4775b`) y su propio sitio de Netlify. Presupuestos solo **escribe** ahí: al marcar un presupuesto como **Aceptado**, pide los datos que ese sistema necesita y no están en la cotización (local de retiro, vendedor/a, hora de entrega, seña), y registra un pedido nuevo con el mismo formato que usa esa app (mismo `orderCounter`, mismo `orders/{id}`, misma ficha de `clients/{id}`). Cada ítem del presupuesto lleva asignada un área de producción (Panadería/Pastelería/Facturería/Especialidades/Sándwiches) para que el pedido aparezca correctamente en la Cuadra de esa área.

Presupuestos no necesita que el sitio de Pedidos de Clientes esté desplegado para funcionar — escribe directo en su base de Firebase. Ese sitio solo hace falta para que alguien pueda ver y gestionar los pedidos generados (marcarlos en preparación, listos, entregados).

> ⚠️ Los arrays de vendedores (`VENDEDORES`) y locales (`LOCALES_CLIENTE`) están duplicados en `presupuestos/index.html` para poder armar el pedido con el formato exacto que espera el otro sistema. Si el equipo de vendedores o los locales cambian allá, hay que actualizarlos acá también.

---

## Desplegar en Netlify

1. [app.netlify.com](https://app.netlify.com/) → **Add new site → Import an existing project → GitHub**.
2. Elegir el repositorio y la rama `claude/business-app-features-9mfa1a`.
3. **Publish directory**: `/` (raíz del repo).
4. **Deploy site**.
5. (Opcional, para el escaneo por IA) Agregar la variable de entorno `ANTHROPIC_API_KEY` como se explica arriba.

La raíz del sitio (`/`) no tiene una página propia — se entra directamente a `/costeo-proveedores/` o `/presupuestos/`.

---

## Estructura de archivos

```
├── costeo-proveedores/
│   └── index.html          — App de Costeo & Proveedores (HTML+CSS+JS autocontenido)
├── presupuestos/
│   └── index.html          — App de Presupuestos (HTML+CSS+JS autocontenido)
├── netlify/
│   └── functions/
│       └── extraer-factura.js  — Función serverless: escaneo de facturas por IA
├── netlify.toml             — Configuración de deploy/funciones de Netlify
└── README.md
```

---

## Notas técnicas

- **Framework**: ninguno — HTML + CSS + JS vanilla (Firebase v10 modular vía CDN)
- **Base de datos**: Firebase Realtime Database (tiempo real con `onValue`)
- **Zona horaria**: America/Argentina/Buenos_Aires (UTC-3)
- **Compatibilidad**: Chrome, Safari, Firefox, Edge modernos; optimizado para móvil
- **Impresión**: estilos `@media print` en Presupuestos para la vista de cotización
