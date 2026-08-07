# Herramientas digitales — Candela Café & Patisserie

> **Documento común.** Esta es la fuente única de verdad para URLs, PINs y horarios
> límite. Si algo cambia, se cambia **acá primero** y después en los manuales que
> lo repiten.

---

## Las tres herramientas

| # | Herramienta | Para qué sirve | Quién la usa |
|---|---|---|---|
| 1 | **FUDO** | Punto de venta: ventas, caja, stock, cuentas corrientes | Cajeros, Vendedores, Mozos, Baristas |
| 2 | **Web Pedidos de Clientes**<br>`pedidos-de-clientes-cc.netlify.app` | Encargues y pedidos a futuro (tortas, catering, eventos) | Cajeros, Vendedores, Mozos |
| 3 | **Web Pedidos de Producción**<br>`pedidos-produccion.netlify.app` | Dos cosas distintas: el **pedido de producción** (qué hay que producir) y el **pedido de insumos** (qué hay que comprar) | **Todas las áreas y los dos locales** |

> **Baristas:** la Web de Pedidos de Clientes **no es de tu área** — esa la usan
> caja y ventas.

---

## Horarios límite — Pedidos de Producción

Se carga **una vez por turno**, antes del horario límite de cada área.

| Área | Cargar antes de |
|---|---|
| Panadería | **9:00 hs** |
| Pastelería | **16:00 hs** |
| Especialidades | **21:00 hs** |
| Facturería | **21:00 hs** |
| Sandwiches | **21:00 hs** |
| Cocina San Luis | **21:00 hs** |

> ℹ️ **Sobre Cocina San Luis:** forma parte del local San Luis, no es un área de
> producción aparte. Funciona de forma independiente **solo para pedir insumos** —
> por eso aparece en esta lista con su propio horario. No tiene cuadra de producción
> ni personal propio: la operación es del local San Luis.

> ⚠️ **Si no cargás a tiempo, producción no puede cumplir.**
> El pedido es para el **día siguiente**, salvo que el encargado indique otra cosa.
> Si te olvidaste, avisá al encargado **inmediatamente** — no lo dejes pasar.

---

## Pedidos de insumos

> ### 🔑 Todas las áreas hacen su propio pedido de insumos, todos los días.
> No hay excepciones. **Lo que un área no carga, nadie lo compra.**

No confundir con el pedido de producción: son **dos cosas distintas dentro de la misma
web**.

| | **Pedido de producción** | **Pedido de insumos** |
|---|---|---|
| **Para qué** | Decirle a producción **cuánto preparar** | Decirle a Compras **qué falta comprar** |
| **Quién lo carga** | Los locales de venta | **Todas las áreas y los dos locales** |
| **Qué se pide** | Productos terminados | Insumos, materias primas y elementos |
| **Cada cuánto** | Una vez por turno | **Todos los días** |

### Paso a paso

1. Ingresá a **`pedidos-produccion.netlify.app`** → **Pedido de insumos**
2. Seleccioná **el local o el área** que corresponda
3. Cargá **todos los insumos, elementos o materias que falten**
4. Por cada insumo indicá **cantidad** y **prioridad**. También podés agregar
   **comentarios aclaratorios**

### Las tres prioridades

| Color | Prioridad | Qué significa |
|---|---|---|
| 🔴 **Rojo** | **Urgente** | Se necesita **hoy**. Compras tiene que conseguirlo sí o sí |
| 🟡 **Amarillo** | **Media** | Se está por acabar. Se compra si el recorrido lo permite |
| 🟢 **Verde** | **Baja** | Reposición normal. Puede esperar al próximo recorrido |

> ℹ️ **En la pantalla los colores aparecen con otro nombre:** verde figura como
> *"Stock OK"*, amarillo como *"Stock bajo"* y rojo como *"Urgente"*. Es la misma
> escala — el color es lo que manda.

### Los comentarios

Sirven para aclararle algo **a la persona de Compras**: una marca específica, un
tamaño, un proveedor preferido, cualquier condición particular.

> **Usalos.** Un comentario a tiempo evita que vuelva la compra equivocada.

### Importante

- **Cargá el pedido antes de las 9:00 hs** — a esa hora Compras revisa el pedido
  completo y arma el recorrido del día. Lo que entre después, probablemente quede
  para mañana.
- **Un insumo en rojo no puede quedar sin cargar.** Si te olvidaste y lo necesitás
  hoy, avisá directamente a Compras además de cargarlo.
- Lo que Compras no llega a comprar queda como **pendiente** y aparece solo en el
  pedido del día siguiente.

> 📖 Qué hace Compras con esto: **[Manual de Compras](../produccion/compras.md)**.

---

## PINs por área — Web Pedidos de Clientes

Al cargar productos, el sistema pide un PIN por cada área:

| Área | PIN |
|---|---|
| Panadería | `1111` |
| Pastelería | `2222` |
| Facturería | `3333` |
| Especialidades | `4444` |
| Sandwiches | `5555` |
| **PIN maestro** (ver todo) | `1412` |

---

## Paso a paso — Cargar un Pedido de Producción

1. Abrí el navegador e ingresá a **`pedidos-produccion.netlify.app`**
2. Seleccioná el local: **SLA 5.0** o **San Luis**
3. Seleccioná el área (ej: Panadería)
4. Ingresá las cantidades de cada producto
5. Revisá el pedido
6. Tocá **"Confirmar pedido"**

✅ Producción puede ver el pedido de inmediato desde su pantalla.

### Guía de envío

Dice **qué mercadería va a qué local** y **en qué cantidad**. La usa quien prepara y
traslada mercadería entre la cuadra de producción y los locales de venta.

1. Ingresá a **`pedidos-produccion.netlify.app`**
2. Tocá **"Guía de envío"** en el menú

> ⚠️ **Las cantidades se chequean acá, no de memoria.** Es lo que evita que un local
> se quede corto y el otro con sobrante.

### Ver la guía de producción

1. Ingresá a **`pedidos-produccion.netlify.app`**
2. Seleccioná el local
3. Tocá **"Guía"** o **"Cuadra"** en el menú
4. Podés imprimir o consultar desde la pantalla

---

## Paso a paso — Cargar un Pedido de Cliente

1. Abrí el navegador e ingresá a **`pedidos-de-clientes-cc.netlify.app`**
2. Tocá **"Ventas"** en el menú
3. Completá los datos del cliente:
   - Nombre completo
   - Teléfono
   - Fecha de entrega
   - Local (SLA 5.0 o San Luis)
4. Agregá los productos por área — el sistema pide el **PIN del área** (ver tabla arriba)
5. Ingresá el PIN → elegí productos y cantidades
6. Repetí para cada área que corresponda
7. Revisá el pedido completo
8. Tocá **"Confirmar"**

✅ El pedido queda registrado y llega automáticamente al área de producción.

### Errores frecuentes

| Error | Cómo evitarlo |
|---|---|
| ❌ Fecha mal cargada | Verificá en el calendario antes de confirmar |
| ❌ PIN incorrecto | Consultá la tabla de PINs de arriba |
| ❌ Pedido sin confirmar | Siempre tocá **"Confirmar"** al final |

---

## Reglas que no se negocian

- **Nada se entrega sin registrar en FUDO.** Ninguna venta, ningún producto.
- **Los pedidos de mercadería van a la web.** No se usan papeles ni WhatsApp para esto.
- **Un pedido con seña deja dos registros:** el pedido en la web y el cobro en FUDO.
  Los dos son necesarios.
