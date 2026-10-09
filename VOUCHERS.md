# 🎟️ Vouchers

Pestaña del sistema para **generar vouchers** (de regalo o vendidos) y **validarlos en caja**. Cada voucher tiene un código único con QR, el diseño de la tarjeta física de Candela y **se usa una sola vez**.

## Qué se puede hacer

| Sección | Para qué |
|---|---|
| **🔎 Validar** | Escanear el QR del voucher con la cámara o escribir el código. Aparece si está **Vigente**, **Vencido**, **Ya fue usado** (cuándo, en qué local y quién lo canjeó) o **Anulado**, y qué incluye. Si está vigente, se toca **Canjear ahora** y queda usado. |
| **➕ Generar** | Armar el voucher con vista previa en vivo y generarlo. Después se puede **imprimir**, **mandar por WhatsApp** o **descargar la imagen**. |
| **📋 Vouchers** | Lista con filtros (vigentes, por vencer, usados, vencidos, anulados), búsqueda por código, cliente o producto, y el total vendido en vouchers. Tocando uno se abre en *Validar*. |

### Tipos de voucher
- **Productos**: por ejemplo "Merienda para 2" con 2 cafés con leche y 2 medialunas. Los productos se eligen del menú o se escriben a mano.
- **Monto**: por ejemplo una gift card de $15.000. Se usa entero en una sola compra.

### Origen
- **🎁 Regalo**: sorteo, promoción, compensación o cortesía, con el motivo.
- **💵 Venta**: con lo que se cobró y el medio de pago.

### Lo que dice el voucher
El voucher replica el diseño original. Se pueden cambiar los textos:
- **Frase de arriba**: "¡Felicidades! Ganaste:" o "¡Te hicieron un regalo!".
- **Título**: "MERIENDA PARA 2".
- **Texto grande**: "GRATIS" o "$15.000".
- **Fecha de vencimiento**: por defecto, **30 días**.

En el recuadro rojo va el **QR y el código del voucher** (por ejemplo `CND-7K3M-Q9XP`), en lugar del QR de redes. El código no usa letras ni números que se confunden (0, O, 1, I, L), así que se puede dictar o tipear sin errores.

Se pueden generar **varios iguales de una vez** (hasta 50, cada uno con su código), por ejemplo para un sorteo.

### Imprimir
Sale una hoja A4 con cada voucher en tamaño real (90 × 50 mm): el dorso y el frente uno al lado del otro. Se recorta por el contorno y se dobla por la línea del medio, y queda de doble faz.

### WhatsApp
- **En el celular**: se abre el menú de compartir con la imagen del voucher y el mensaje.
- **En la compu**: se descarga la imagen y se abre WhatsApp Web con el mensaje (y el número, si se cargó) para adjuntarla.

## Controles de seguridad

Los aplican las **reglas de la base de datos** (`database.rules.json` → `vouchers`). Nadie puede saltearlos, aunque sepa programar:

- Solo el **personal habilitado** (la misma cuenta del ⭐ Club) puede ver, generar, canjear o anular vouchers. Los clientes no pueden ver la lista de códigos ni crearse uno.
- **Un solo uso**: una vez canjeado o anulado, el voucher queda congelado y ya no se puede volver a canjear, reactivar ni borrar. Si dos cajas lo canjean al mismo tiempo, la segunda recibe el aviso de que ya fue usado.
- **Vencido no se canjea**: el servidor controla la fecha, no el celular.
- El contenido (qué incluye, monto, vencimiento) **no se puede cambiar** después de generado.
- Queda registrado **quién lo generó** y **quién, cuándo y en qué local lo canjeó**, con la hora del servidor y el email de la cuenta.

## Puesta en marcha (una sola vez)

1. **Publicar las reglas** ⚠️: en [console.firebase.google.com](https://console.firebase.google.com/), proyecto **pedidos-de-clientes-4775b**, ir a **Realtime Database → Rules**. Copiá y guardá las reglas actuales por si hay que volver atrás. Después reemplazalas por el contenido de [`database.rules.json`](database.rules.json) y tocá **Publish**. Sin este paso, la pestaña muestra "No se pudieron leer los vouchers".
2. **Publicar el sitio** con los archivos nuevos: `index.html`, `js/vouchers.js`, `img/voucher-frente.svg` e `img/voucher-dorso.svg`.
3. Entrar a **🎟️ Vouchers** con la cuenta del personal (la misma del Club). Si la cuenta no está habilitada, la pantalla indica qué nodo agregar en `fidelizacion/staff`.
4. Generar un voucher de prueba, validarlo escaneándolo con el celular y canjearlo.
