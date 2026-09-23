# Herramientas digitales

*Versión 1.1 · Septiembre 2026 · Aplica a todos los roles que registran ventas o cargan pedidos*

## Para qué sirve

Es **el único lugar** donde está el paso a paso de cada herramienta. Los manuales de
cada rol dicen qué herramienta usa ese rol y remiten acá.

> [!regla]
> ### Lo que no está en el sistema, no existe.
> - **Nada se entrega sin registrar en FUDO.** Ninguna venta, ningún producto.
> - **Los pedidos van a la web.** No se usan papeles ni WhatsApp para esto.
> - **Un pedido con seña deja dos registros:** el pedido en la Web de Pedidos de
>   Clientes y el cobro en FUDO. Los dos son obligatorios.

---

## 1. Las herramientas

| Herramienta | Para qué sirve | Quién la usa |
|---|---|---|
| **FUDO** | Punto de venta: ventas, caja, stock, cuentas corrientes, gastos | Cajeros, vendedores, mozos, baristas, cocina |
| **Web de Pedidos de Producción** — `pedidos-produccion.netlify.app` | Pedido diario a cada área de producción, pedido de insumos, guía de producción y guía de envío | Todos los roles de venta, cocina, producción y Compras |
| **Web de Pedidos de Clientes** — `pedidos-de-clientes-cc.netlify.app` | Encargos y pedidos a futuro: tortas, catering, eventos. Sección Envíos | Cajeros, vendedores, mozos, cocina, producción, Compras, ayudante de cocina |
| **PedidosYa** — `web.restaurant-partners.com` | Pedidos de delivery | Cajeros, cocina |
| **Cheaf** — `admin.cheaf.com/dashboard` | Venta de surtido económico y pedidos por la app | Cajeros, cocina |

---

## 2. Horarios límite

| Pedido | Hora límite | Aclaración |
|---|---|---|
| **Panadería** | **9:00 hs** | |
| **Pastelería** | **16:00 hs** | |
| **Especialidades · Facturería · Sándwiches** | **21:00 hs** | |
| **Cocina de los locales** (producción e insumos) | **21:00 hs** | |
| **Pedido de insumos** de cualquier área | **9:00 hs** del día de compra | A las 9:00 Compras arma el recorrido. Lo ideal es cargarlo **al cierre de tu turno** |

> [!atencion]
> ### El horario límite es el tope, no la hora de hacerlo.
> Los pedidos de las 21:00 se pueden cargar hasta el final del turno. Conviene hacerlo
> en el momento más tranquilo, no en plena salida de comandas: **un pedido cargado
> apurado es un pedido mal cargado.**

**El pedido es para el día siguiente**, salvo que el Experto del turno indique otra
cosa. Si te olvidaste de cargarlo, **avisale al Experto del turno en ese momento**.

---

## 3. Cargar un pedido de producción

**Qué es:** le dice a cada área de la cuadra cuánto tiene que producir para tu local.

1. Entrá a `pedidos-produccion.netlify.app` → **Carga de pedidos**.
2. Elegí el local: **San Luis** o **SLA 5.0**.
3. Elegí el área (por ejemplo, Panadería).
4. Cargá la cantidad de cada producto.
5. Revisá el pedido.
6. Tocá **Confirmar pedido**. Producción lo ve en ese momento.

### Cómo calcular las cantidades

No se pide de memoria. Antes de cargar, mirá en FUDO:

| Qué mirás | Dónde |
|---|---|
| **Lo que se vendió** el día anterior y el mismo día de la semana pasada | FUDO → Reportes |
| **Lo que sobró o se tiró** | FUDO → Movimientos de stock |

Y ajustá según el día:

| Momento | Criterio |
|---|---|
| **Martes y miércoles** | Demanda moderada. Pedido estándar según el historial |
| **Lunes, jueves y viernes** | Más movimiento. Más cantidad en los productos de alta rotación |
| **Sábados y domingos** | Pico de ventas. Pedido ampliado, sobre todo panadería y cafetería |
| **Temporada alta** (verano, fiestas) | Revisarlo con Gerencia |
| **Temporada baja** | Bajar cantidades para no desperdiciar |
| **Feriados, clima, lluvia, frío o calor** | Cambian la demanda: tenelos en cuenta |
| **Fechas especiales** (Día de la Madre, Pascua) | La demanda puede ser mucho mayor |

### Ver la guía de producción

1. Entrá a `pedidos-produccion.netlify.app`.
2. Elegí el local.
3. Tocá **Guía** o **Cuadra** en el menú. Se puede imprimir o mirar en pantalla.

---

## 4. Cargar un pedido de insumos

**Qué es:** la lista de lo que tu área necesita que Compras consiga: materias primas,
descartables, productos de limpieza, herramientas.

> [!regla]
> ### Compras solo compra lo que está cargado.
> Cada área hace **su propio** pedido de insumos. Lo que no cargues, nadie lo compra.

1. Entrá a `pedidos-produccion.netlify.app` → **Pedido de insumos**.
2. Elegí tu local o tu área.
3. Cargá todo lo que falte.
4. Poné **cantidad** y **prioridad** a cada ítem, y si hace falta un comentario (marca,
   tamaño, proveedor).

| Color | Prioridad | Cuándo usarlo |
|---|---|---|
| **Rojo** | Urgente | Lo necesitás **hoy** |
| **Amarillo** | Media | Se está por acabar |
| **Verde** | Baja | Reposición normal |

---

## 5. Cargar un pedido de cliente

**Qué es:** todo pedido para retirar otro día u otra hora: tortas de cumpleaños,
encargos, catering.

1. Entrá a `pedidos-de-clientes-cc.netlify.app` → **Ventas**.
2. **Buscá si el cliente ya existe** antes de crearlo.
3. Completá los datos: nombre completo, teléfono, **fecha de entrega** y local (San
   Luis o SLA 5.0).
4. Agregá los productos por área. El sistema pide el **PIN de cada área**.
5. Repetí para cada área que corresponda.
6. Revisá el pedido completo.
7. Tocá **Confirmar**. El pedido llega solo a producción.

Si el cliente deja seña, **además** se registra el cobro en FUDO (ver *Cajeros*).

| Error frecuente | Cómo evitarlo |
|---|---|
| Fecha mal cargada | Mirá el calendario antes de confirmar |
| Producto o cantidad equivocada | Revisá el pedido antes de confirmar |
| Pedido sin confirmar | Siempre tocá **Confirmar** al final |
| Cliente duplicado | Buscá antes de crear uno nuevo |

---

## 6. PedidosYa y Cheaf

| | PedidosYa | Cheaf |
|---|---|---|
| **Dónde** | `web.restaurant-partners.com` | `admin.cheaf.com/dashboard` |
| **Horario** | Lunes a sábados, 9:00 a 21:00 hs | Lunes a sábados, 9:00 a 21:00 hs |
| **Qué se vende** | Carta de delivery | Surtido económico del día |

1. Iniciá sesión al abrir el turno. **Mientras la ventana esté abierta, el local recibe
   pedidos.**
2. **Mantené el stock actualizado.** Si figura algo que ya no hay, entra un pedido que
   no se puede cumplir.
3. Cada pedido que entra se carga en FUDO y va a cocina o a mostrador como cualquier
   otro, **con prioridad de take away**.

> [!prohibido]
> **Queda prohibido cancelar o rechazar pedidos.** Si hay un problema con un pedido,
> avisá al Experto del turno antes de tocar nada.

---

## Pendientes de definición

- [ ] **PINs de cada área** para la Web de Pedidos de Clientes: quién los da y quién
      los cambia. **No se escriben en este manual.**
- [ ] **Confirmar la dirección de la Web de Pedidos de Clientes.** En algunos manuales
      figuraba `pedidos-de-clientes.netlify.app`, sin "-cc".
- [ ] **Qué se hace si una app pide cancelar** por falta de stock que no se actualizó.
- [ ] **Horario de PedidosYa y Cheaf los domingos.**

---

## Documentos relacionados

- Cajeros — FUDO paso a paso: caja, señas, cuentas corrientes, stock
- Compras — cómo se usa el pedido de insumos del otro lado
- Atención al cliente y reclamos
