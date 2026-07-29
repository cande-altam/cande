# Manual de Procedimientos — Cajeros

**Candela Café & Patisserie**
*Versión 2.0 | Junio 2026*

---

## 🎯 Objetivo del rol

El/la cajero/a **registra todas las ventas del local**, maneja la caja con
exactitud y coordina los pedidos de clientes con el equipo de producción usando
las herramientas digitales.

---

## 🖥️ Tus herramientas digitales

Trabajás con tres herramientas:

1. **FUDO** — Sistema de punto de venta. Ventas, caja, stock y cuentas corrientes.
2. **Web Pedidos de Clientes** — `pedidos-de-clientes-cc.netlify.app`
   Para cargar encargues y pedidos a futuro.
3. **Web Pedidos de Producción** — `pedidos-produccion.netlify.app`
   Para cargar el pedido diario de cada área.

> 📖 Paso a paso completo, PINs y horarios límite en
> **[Herramientas digitales](../comunes/herramientas-digitales.md)**.

---

## 1. Apertura de caja

1. Contá el **fondo inicial**.
2. Registrá la apertura en **FUDO**.
3. Verificá que haya **cambio suficiente** en billetes y monedas.

> ⚠️ **Si el fondo no cuadra, avisá al encargado antes de atender al público.**

---

## 2. Registro de ventas

1. El cliente pide → cargás los productos en **FUDO**.
2. **Confirmás el total** con el cliente.
3. Cobrás y emitís el comprobante (ticket o factura).
4. Todo queda en FUDO — nada se deja sin registrar.

> ⚠️ **Nunca se entrega un producto sin que esté registrado en FUDO.**

---

## 3. Medios de pago y facturación

### Efectivo
- Contá el dinero **frente al cliente**.
- Entregá el cambio de inmediato.

### Tarjeta (débito / crédito)
- El cliente pasa la tarjeta en el lector.
- **Esperá la confirmación del sistema** antes de entregar el producto.

### Transferencia / Mercado Pago
- **Verificá en el celular que el pago llegó** antes de entregar.

### Facturación
- **Ticket:** siempre.
- **Factura A o B:** cuando el cliente la pide → completar datos en FUDO.

---

## 4. Devoluciones

1. Escuchá el motivo de la devolución.
2. **Avisá al encargado** para que autorice.
3. Registrá la devolución en FUDO.

> ⚠️ **Sin autorización del encargado, no se hace ninguna devolución.**

---

## 5. Señas — Cómo registrar un adelanto

Cuando un cliente deja una seña para un pedido futuro:

1. Cargá el pedido en la **Web de Pedidos de Clientes**.
2. Registrá el **cobro de la seña en FUDO**.
3. Entregá un **comprobante** al cliente con el monto y la fecha de entrega.
4. **Anotá en el pedido de la web** el monto ya abonado.

> ℹ️ El pedido queda en la web y el pago queda en FUDO — **los dos registros son
> necesarios**.

---

## 6. Cuentas corrientes

- Las cuentas corrientes se gestionan desde **FUDO**.
- **Confirmá siempre el saldo disponible** antes de cerrar la venta.
- Para habilitar una nueva CC, el cliente debe estar **dado de alta por el encargado**.

---

## 7. Cierre de caja

1. Contá **todo el efectivo** en caja.
2. Registrá el cierre en **FUDO**.
3. Separá el **fondo para el turno siguiente**.
4. Prepará el **sobre de depósito**.
5. Entregá el sobre al **encargado**.

> ⚠️ **Si hay diferencia, informala antes de salir** (ver Sección 8).

---

## 8. Diferencias de caja

| Caso | Qué hacer |
|---|---|
| **Sobrante** | Informar al encargado — **no tocarlo** |
| **Faltante** | Informar al encargado — puede requerir descuento según reglamento |

> ⚠️ **Las diferencias siempre se reportan, aunque sean pequeñas.**

---

## 9. Movimientos de stock

- **Roturas, consumo interno, diferencias de inventario** → se registran en FUDO.
- Pedí **autorización al encargado** antes de registrar cualquier movimiento especial.

---

## 10. Pedidos de mercadería

Los pedidos de mercadería se cargan desde la **Web de Pedidos de Producción**.

> **No se usan papeles ni WhatsApp para esto — todo va a la web.**

---

## 11. 🖥️ Web — Pedidos de Clientes

`pedidos-de-clientes-cc.netlify.app`

**¿Para qué sirve?** Para cargar pedidos de clientes a futuro: tortas de
cumpleaños, encargues especiales, catering.

**¿Cuándo se usa?** Cada vez que un cliente hace un pedido para retirar **en otro
día o en otra fecha**.

### Paso a paso

1. Ingresá a `pedidos-de-clientes-cc.netlify.app`
2. Tocá **"Ventas"** en el menú
3. Completá los datos del cliente: nombre completo, teléfono, fecha de entrega,
   local (SLA 5.0 o San Luis)
4. Agregá los productos por área — el sistema pide un **PIN** por área:

   | Área | PIN |
   |---|---|
   | Panadería | `1111` |
   | Pastelería | `2222` |
   | Facturería | `3333` |
   | Especialidades | `4444` |
   | Sandwiches | `5555` |
   | PIN maestro (ver todo) | `1412` |

5. Ingresá el PIN → seleccioná productos y cantidades → repetí para cada área
6. Revisá el pedido completo
7. Tocá **"Confirmar"**

✅ El pedido queda registrado y llega automáticamente al área de producción.

### Errores frecuentes

- ❌ **Fecha mal cargada** → verificá en el calendario.
- ❌ **PIN incorrecto** → consultá la tabla de PINs.
- ❌ **Pedido no confirmado** → siempre tocá "Confirmar" al final.

---

## 12. 🖥️ Web — Pedidos de Producción

`pedidos-produccion.netlify.app`

**¿Para qué sirve?** Para avisarle a producción cuánto necesita preparar de cada
producto. Se carga **una vez por turno**, antes del horario límite de cada área.

### Horarios límite

> ⚠️ **Si no cargás a tiempo, producción no puede cumplir.**

| Área | Cargar antes de |
|---|---|
| Panadería | **9:00 hs** |
| Pastelería | **16:00 hs** |
| Especialidades | **21:00 hs** |
| Facturería | **21:00 hs** |
| Sandwiches | **21:00 hs** |
| Cocina San Luis | **21:00 hs** |

### Paso a paso

1. Ingresá a `pedidos-produccion.netlify.app`
2. Seleccioná el local: **SLA 5.0** o **San Luis**
3. Seleccioná el área (ej: Panadería)
4. Ingresá las cantidades de cada producto
5. Revisá el pedido
6. Tocá **"Confirmar pedido"**

✅ Producción ya puede ver el pedido desde su pantalla.

### Importante

- Cargá siempre **antes del horario límite**.
- El pedido es para el **día siguiente** (salvo que el encargado indique otra cosa).
- Si te olvidaste, **avisá al encargado inmediatamente**.

---

## 13. Atención de llamadas y WhatsApp

1. Atendé con: *"Candela Café & Patisserie, ¡hola! ¿En qué te puedo ayudar?"*
2. Si el cliente hace un pedido → **cargalo en la Web de Pedidos de Clientes**
   (Sección 11).
3. Si es una consulta de precio o disponibilidad → respondé y anotá si hay pedido.
4. **WhatsApp: respondé en menos de 10 minutos** en horario comercial.

---

## 14. Indicadores de desempeño (KPIs)

| Indicador | Meta |
|---|---|
| Diferencia de caja | **0** por turno |
| Ventas registradas en FUDO | **100%** |
| Pedidos de Producción | Cargados **antes del horario límite** de cada área |
| Pedidos de Clientes | Cargados **en el momento** que el cliente lo solicita |
| Respuesta WhatsApp | **< 10 minutos** en horario comercial |

---

## 15. Faltas y consecuencias

| Falta | Consecuencia |
|---|---|
| No registrar una venta en FUDO | Llamado de atención escrito |
| Diferencia de caja sin informar | Descuento según reglamento |
| Pedido de producción no cargado a tiempo | Se registra como incidencia |
| Pedido de cliente no cargado | Se registra como incidencia |

---

## ✅ Checklist diario — Cajero/a

*Imprimí o revisá este checklist en cada turno.*

### Apertura

- ☐ Fondo de caja contado y registrado en FUDO
- ☐ Cambio suficiente disponible
- ☐ FUDO funcionando correctamente
- ☐ Web Pedidos de Clientes accesible (abrir y verificar)
- ☐ Web Pedidos de Producción accesible (abrir y verificar)
- ☐ Revisé los pedidos de clientes pendientes del día
- ☐ Cargué el pedido de **Panadería** antes de las **9:00 hs**

### Durante el turno

- ☐ Todas las ventas registradas en FUDO
- ☐ Comprobantes entregados a cada cliente
- ☐ Pedido de **Pastelería** cargado antes de las **16:00 hs**
- ☐ Pedidos de Clientes cargados en el momento que se reciben
- ☐ WhatsApp respondido en menos de 10 minutos

### Cierre

- ☐ Pedidos de Producción cargados para el turno noche
      (Especialidades / Facturería / Sandwiches / Cocina San Luis — antes de las **21:00 hs**)
- ☐ Pedidos de Clientes del día: todos cargados, ninguno pendiente
- ☐ Caja contada y registrada en FUDO
- ☐ Diferencia informada al encargado (si la hay)
- ☐ Fondo separado para el turno siguiente
- ☐ Sobre de depósito preparado y entregado

---

## Documentos relacionados

- [Herramientas digitales](../comunes/herramientas-digitales.md)
- [Atención al cliente y reclamos](../comunes/atencion-y-reclamos.md)
- [Higiene y presentación](../comunes/higiene-y-presentacion.md)
