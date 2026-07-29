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
| 3 | **Web Pedidos de Producción**<br>`pedidos-produccion.netlify.app` | Pedido diario de cada área de producción | Cajeros, Vendedores, Mozos, Baristas |

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
