# Candela Café & Patisserie — Herramientas de Administración

Este repositorio (rama `claude/business-app-features-9mfa1a`) contiene las herramientas internas de **uso exclusivo de administración** para costear productos y armar presupuestos a clientes. No incluye el sistema de Pedidos de Producción (locales ↔ áreas de producción) ni el de Pedidos de Clientes — esos viven en otras ramas/sitios.

| App | Carpeta | Para qué sirve |
|---|---|---|
| **Costeo & Proveedores** | `costeo-proveedores/` | Facturas de proveedores, órdenes de pago, precio e historial de insumos, costeo automático de productos, comparación con inflación |
| **Presupuestos** | `presupuestos/` | Cotizaciones a clientes con ítems libres; al aceptarse, registra el pedido en el sistema de Pedidos de Clientes (otro proyecto/rama) |

---

## Módulo: Costeo & Proveedores (IA)

Ubicado en `costeo-proveedores/`. Permite:

- Registrar facturas de proveedores sacándoles una foto — opcionalmente escaneada automáticamente con IA (proveedor, monto, fecha, ítems), siempre revisable/editable antes de guardar. Cada ítem muestra la cantidad e importe de línea que interpretó la IA (para poder notar si leyó mal una cantidad antes de guardar), avisa si cantidad × precio no cierra con el importe, y avisa si el precio cambia fuerte contra el último conocido. Si al guardar algún precio no llega a actualizar el costo de referencia de un insumo, queda un aviso explícito con el detalle — nunca pasa en silencio. Si el recibo no trae razón social ni CUIT legibles (algunos proveedores chicos solo dan un recibo de pago), el sistema intenta reconocer el proveedor por el tipo de productos comprados (ej. frutas/verduras → el proveedor con rubro "Verdulería").
- Generar automáticamente la orden de pago de cada factura y marcarla pagada/no pagada.
- Mantener un catálogo de insumos con su precio actual e historial de precios. Un mismo insumo puede comprarse a varios proveedores, y un mismo proveedor puede tener varias marcas a precios distintos (ej. **un solo insumo "Levadura"**, con 4 líneas de precio: Leudex y Duquesa, cada una comprada en Calsa y en Casa Naoum) — cada combinación proveedor+marca es su propia línea de precio dentro del mismo insumo, no insumos separados. Para armar esas líneas no hace falta pasar por factura ni fusionar nada: cada fila tiene un botón **"➕ Precio"** para cargar cada combinación directo, una por vez. **Regla de costeo: siempre se costea con el precio MÁS ALTO** entre todas las líneas del insumo. Si una compra sale más barata (incluso si es la última compra de la propia línea que se venía usando), queda registrada y **destacada en verde como oportunidad de compra, pero NO baja el costo** — así el precio de venta nunca se calcula sobre un precio circunstancialmente bajo. Cada línea guarda entonces dos valores: el más alto que se le registró (base de costeo) y su última compra real (referencia para comprar). Si una línea se cargó mal e infla el costo, se la puede quitar con el botón 🗑️ de su fila. Un insumo también puede tener su propia receta (para bases/preparaciones elaboradas como crema chantilly o bizcochuelo) — en ese caso su costo se calcula en vivo a partir de sus propios ingredientes, y ese costo se propaga automáticamente a cualquier producto que la use.
- Si el catálogo YA TIENE insumos separados que en realidad son el mismo producto con la marca metida en el nombre (ej. "Levadura Leudex" y "Levadura Duquesa" cargados como dos insumos distintos, típico de datos cargados antes de esta funcionalidad), el botón "🏷️ Detectar variantes de marca" en Insumos los agrupa y sugiere fusionarlos en uno solo, asignándole a cada línea la marca que le corresponde — no se pierde el detalle al unificarlos. Entiende nombres de varias palabras (ej. "Baño de chocolate semiamargo Alpino" y "Baño de chocolate semiamargo Lodiser" se agrupan entre sí por "Baño de chocolate semiamargo"), pero nunca mezcla productos genuinamente distintos aunque compartan casi todo el nombre (ej. "Baño de chocolate semiamargo" y "Baño de chocolate blanco" quedan separados; "Leche entera" y "Leche descremada" también). De todas formas, nunca fusiona nada sin que lo confirmes. El botón "🔀 Agrupar insumos a mano" hace lo mismo pero eligiendo vos mismo cuáles van juntos, sin depender de ninguna sugerencia automática. Esto es para **arreglar** insumos que quedaron mal separados — para cargar las variantes de marca/proveedor de un insumo que ya es único, no hace falta fusionar nada: se usa el formulario "+ Agregar otro proveedor/marca" mencionado arriba.
- Cargar productos con su receta (qué insumos y en qué cantidad llevan, incluyendo bases) y calcular su costo automáticamente a partir del precio de los insumos. La pestaña **Productos** clasifica cada uno como elaborado/preparación/retail (según la categoría que le cargues), tiene el precio de venta editable ahí mismo (con un precio sugerido según el modelo de costeo, redondeado de 100 en 100) y muestra de un vistazo si se está vendiendo a pérdida, con margen bajo, o si su costo cambió en los últimos días (por facturas cargadas). Cada producto tiene un panel "📋 Receta" para verla, modificarla, armarla desde cero o vaciarla sin tener que abrir el formulario completo de edición.
- Si algo quedó mal clasificado (un insumo que en realidad es de reventa, o un producto que en realidad es una materia prima), los botones "➡️ A Productos" / "➡️ A Insumos" lo mueven de un catálogo al otro conservando el costo que ya tenía cargado. No se puede mover un insumo que se usa en alguna receta, ni algo que tiene su propia receta (bases/productos elaborados) — hay que resolver eso primero.
- La pestaña **💬 Consultas** deja hacerle preguntas en lenguaje natural a la IA sobre las compras ya cargadas (ej. "¿Cuándo compramos queso crema por última vez?", "¿Qué proveedor nos vende más barata la harina?") — responde en base al historial de precios de los insumos, las facturas y los proveedores, sin inventar datos que no estén cargados.
- La pestaña **📋 Recetas y Bases** reúne, en cards con tablas editables, las recetas de todos los productos elaborados/preparación y las de las bases (insumos con receta propia) — se puede ver, armar o modificar cualquier receta o base desde un solo lugar, sin tener que ir producto por producto.
- Cuando el precio de un insumo o el costo de un producto sube respecto a lo que se venía usando, queda una alerta con el número resaltado en rojo y el detalle completo (proveedor, precio anterior, precio nuevo, % de suba, fecha). Las subas de 15% o más en un solo salto se marcan como **abruptas** con una notificación más grande (🚨). La pestaña **Análisis** tiene una sección "🚨 Alertas de subas de precio" que junta todas las alertas vigentes (insumos y productos) en un solo lugar, pensada para poder avisarle directo al área de compras, y otra "💡 Oportunidades de compra" con las bajas recientes — las que conviene aprovechar al comprar, aunque no bajen el costeo.
- Comparar la variación de precio de cada insumo contra la inflación mensual cargada a mano, y alertar cuáles subieron por encima de la inflación. La misma pestaña **Análisis** también aplica un modelo de costeo sugerido (28% costo variable / 37% costos fijos / 20% renta esperada / 15% mermas) para detectar productos cuyo precio de venta quedó por debajo de lo que sugiere el modelo.
- Guardar banco y alias de cobro de cada proveedor, además de sus datos de contacto.
- Llevar el control de IVA crédito fiscal (pestaña **IVA**): cada factura puede cargar su IVA discriminado (a mano o vía el escaneo por IA), y el sistema lo suma por mes. Cargando también el IVA débito fiscal del mes (de las ventas, a mano) calcula el saldo a pagar o a favor.
- Buscador de texto en las vistas de listado (Facturas, Pagos, Proveedores, Insumos, Productos, Recetas y Bases) para encontrar rápido por nombre, proveedor, marca, CUIT o N° de factura según la vista.

### Acceso

URL: `https://<tu-sitio>.netlify.app/costeo-proveedores/`. Contraseña inicial: `costeo2025` (cambiable desde la pestaña **Configuración**).

### Configuración en Firebase

Usa el proyecto Firebase `pedidos-de-produccion-ee3cb` (ya existente), bajo la rama de datos `costeo/`. **No requiere ninguna configuración adicional** — las fotos de facturas se guardan comprimidas (como texto, base64) directo en la misma Realtime Database que ya está habilitada, en vez de usar Firebase Storage, así que no hace falta activar ni configurar nada nuevo.

> Nota: esto hace que cada factura con foto ocupe más espacio en la base de datos que si estuviera en Storage. Para el volumen de un negocio como este no debería ser un problema, pero si en algún momento la base crece mucho y querés optimizar, se puede migrar a Firebase Storage más adelante.

### Funciones con IA (opcional)

Dos funciones usan la API de Claude (Anthropic) y comparten la misma configuración:

- `netlify/functions/extraer-factura.js`: al subir una foto de la factura (de la cámara o de la galería/archivos), la escanea automáticamente.
- `netlify/functions/consultar.js`: responde las preguntas en lenguaje natural de la pestaña **Consultas**.

Para que funcionen:

1. Desplegar el sitio en Netlify **vía GitHub** (Add new site → Import from Git) — el deploy por drag & drop no empaqueta funciones.
2. En el sitio de Netlify → **Site configuration → Environment variables**, agregar `ANTHROPIC_API_KEY` con una clave válida de [console.anthropic.com](https://console.anthropic.com/), con crédito cargado en **Plans & Billing**.

Si la clave no está configurada, o el escaneo falla, no pasa nada: el formulario de "Nueva factura" se completa a mano igual (o con el botón "Reintentar escaneo"), sin ninguna dependencia de la IA para funcionar. La pestaña Consultas, sin la clave configurada, muestra un aviso claro en vez de una respuesta.

El escaneo identifica al proveedor por **razón social o CUIT** (lo que efectivamente figura impreso en la factura), no por el nombre comercial con el que está cargado en el sistema. También recibe el catálogo de insumos ya cargados y trata de matchear cada línea de la factura contra un insumo existente (aunque el texto tenga mayúsculas, abreviaturas o tamaño de envase distintos, ej. "LECHE ENT. X 1LT" ≈ "Leche entera"), en vez de crear un insumo nuevo por cada factura. Una vez elegido el proveedor, el buscador de insumos de esa vista prioriza los productos que ya le compraste antes a ese proveedor.

En la pestaña **Insumos** hay un botón "Buscar posibles duplicados" que revisa el catálogo (nombres casi idénticos) y sugiere pares para fusionar — no fusiona nada automáticamente, siempre queda a criterio de quien lo revisa.

---

## Módulo: Presupuestos

Ubicado en `presupuestos/`. URL: `https://<tu-sitio>.netlify.app/presupuestos/`. Contraseña inicial: `presupuestos2025` (cambiable desde **Configuración**).

Permite armar cotizaciones para clientes con ítems libres (descripción + área de producción + cantidad + precio unitario, subtotal y total automáticos, descuento opcional), con estados **Borrador → Enviado → Aceptado / Rechazado**, un buscador por cliente o N° de presupuesto, y una vista imprimible/PDF (botón "Ver / Imprimir").

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

La raíz del sitio (`/`) muestra una página simple con links a las dos apps.

---

## Estructura de archivos

```
├── index.html                — Página de inicio (links a las dos apps)
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
