# ⭐ Club Candela — Tarjeta de sellos con QR

Programa de fidelización: el cliente escanea un QR en la mesa o el mostrador, se registra una sola vez (nombre, WhatsApp, cumpleaños) y suma **1 sello por día**. Con **10 visitas** canjea **una merienda gratis** en caja.

La tarjeta digital es una **réplica de la tarjeta física** (mismo arte, armado a partir del PDF original): el frente "Tarjeta de FIDELIDAD", y en el dorso el nombre del cliente en "Cliente:", su QR personal y los 10 casilleros, donde cada visita se marca con el **isotipo de Candela**. El cliente puede dar vuelta la tarjeta tocándola, y cuando suma un sello la tarjeta gira sola y el isotipo cae en el casillero como un sello de goma.

## Cómo funciona

| Quién | Qué hace |
|---|---|
| **Cliente** | Escanea el QR de la mesa → la primera vez completa sus datos y elige un **PIN de 4 números** → se suma el sello del día. Desde otro celular o navegador entra con **“¿Ya tenés tarjeta?”** (WhatsApp + PIN). |
| **Mozos** | Nada. |
| **Caja** | Cuando el cliente tiene premio, escanea el código de su tarjeta (o lo busca por WhatsApp) en **⭐ Club → Atender** y toca **Entregar premio**. |
| **Encargado** | En **👥 Clientes** ve la base unificada (pedidos + Club, cruzados por WhatsApp): socios, premios pendientes, cumpleaños próximos y clientes inactivos, y exporta a CSV. En ⭐ Club imprime los QR y ajusta el premio y los límites. |

### Controles de seguridad
Las **reglas de la base de datos** (`database.rules.json`) aplican estos controles. Nadie puede saltearlos desde el celular, aunque sepa programar.

- **1 sello por día** por cliente.
- **Tope semanal** (por defecto 4) y **horario de atención**: fuera de horario no se suman sellos.
- **Un WhatsApp = una tarjeta.** La tarjeta se puede abrir en otros celulares o navegadores con el WhatsApp y el PIN. Para que nadie adivine un PIN probando, se permite **1 intento cada 10 segundos por número**, y el PIN no lo puede leer nadie más que el cliente y el personal.
- **Privacidad:** un cliente solo puede ver su propia tarjeta. La lista de clientes, los teléfonos y las visitas solo los ve el personal habilitado.
- **Nadie se suma sellos a mano** ni modifica la configuración. El premio solo lo descuenta el personal.
- **Canje con el personal:** antes de entregar el premio, la caja ve el historial de visitas (fecha, hora y local) y detecta cualquier cosa rara.

> Todavía **no hay verificación del WhatsApp** por código. Alguien podría registrarse con un número falso, pero igual queda limitado a 1 sello por día y a lo que la caja ve al canjear. La verificación se puede sumar más adelante sin rehacer nada.

---

## Puesta en marcha (una sola vez)

Todo se hace en [console.firebase.google.com](https://console.firebase.google.com/), en el proyecto **pedidos-de-clientes-4775b**.

### 1. Activar el inicio de sesión
**Build → Authentication → Get started → Sign-in method** y activar:
- **Anónimo**: lo usa la tarjeta del cliente, que no tiene que crear contraseña.
- **Correo electrónico/contraseña**: lo usa el personal.

### 2. Crear la cuenta del personal
**Authentication → Users → Add user**: por ejemplo `caja@candela.com` con una contraseña segura. Pueden ser varias cuentas, una por local o por encargado.

Copiá el **User UID** de cada cuenta (la columna de la derecha).

### 3. Habilitar esa cuenta como personal
**Build → Realtime Database → Data**: agregá este nodo por cada cuenta, con el UID que copiaste:

```
fidelizacion
  └─ staff
       └─ <UID de la cuenta>: true
```

Para quitarle el acceso a alguien, borrá su nodo.

### 4. Publicar las reglas de seguridad ⚠️
**Realtime Database → Rules**:
1. **Antes de cambiar nada, copiá y guardá las reglas actuales** por si hay que volver atrás.
2. Reemplazalas por el contenido de [`database.rules.json`](database.rules.json) y tocá **Publish**.

Estas reglas dejan el sistema de pedidos (`orders`, `menu`, `clients`, etc.) **igual de abierto que hoy**, así que no se rompe nada, y cierran la parte del Club.

> Si en **Data** ves otras carpetas principales además de `orders`, `orderCounter`, `menu`, `clients`, `catalogo`, `config`, `pedidos_insumos`, `pedidos_mercaderia` y `fidelizacion`, avisá antes de publicar: habría que agregarlas a las reglas.

### 5. Publicar el sitio
Subí los archivos nuevos junto con `index.html` (Netlify o donde esté publicado): `tarjeta.html`, la carpeta `js/` y la carpeta `img/`.

### 6. Configurar e imprimir
1. En el sistema, entrá a **⭐ Club** con la cuenta del personal.
2. En **⚙️ Configuración** ajustá el premio, el tope semanal y el horario. Los casilleros quedan fijos en 10, como la tarjeta física. El texto del premio aparece en la tarjeta: "Completá 10 visitas, accedé a *[premio]* y a más promociones exclusivas".
3. En **🖨️ QR de mesas** imprimí el QR de cada local (sale una hoja A4 con 4 tarjetitas).
4. Probalo con tu celular antes de ponerlo en las mesas.

---

## Base de clientes unificada (👥 Clientes)

La pestaña **👥 Clientes** junta en un solo lugar a los clientes de pedidos y a los socios del Club:

- Se cruzan por **WhatsApp**. Los teléfonos de pedidos se normalizan a 10 números, así que "0387 15 400-1122", "+54 9 387 4001122" y "387 4001122" cuentan como la misma persona. Si alguien fue cargado con nombres distintos, aparece "También cargado como…".
- Cada cliente muestra sus pedidos (productos más pedidos e historial) y, si es socio, sus sellos, visitas, premios canjeados y cumpleaños, con el botón **Abrir en ⭐ Club**.
- Filtros: con pedidos, socios del Club, en ambas, premio pendiente, cumpleaños en 7 días y 30+ días sin venir. El **CSV** exporta la lista filtrada con el WhatsApp listo para campañas (549…).
- Los datos del Club solo aparecen con la sesión del personal abierta en ⭐ Club. Sin sesión se ven solo los datos de pedidos.
- No se modifica ni se mezcla nada en la base de datos: la unión se hace al mostrar la lista.

## Situaciones frecuentes

**El cliente abre el QR y le pide registrarse, pero ya tenía tarjeta.**
Pasa cuando abre el QR en otro celular, desde otra app (cámara de Instagram, WhatsApp, Google Lens), en modo incógnito o después de borrar los datos del navegador. Toca **“¿Ya tenés tarjeta?”** y entra con su WhatsApp y su PIN: ve su tarjeta con todos los sellos y se suma el sello del día. Si al registrarse pone el mismo WhatsApp y el mismo PIN, entra solo.

**No tiene PIN o se lo olvidó.** (Los que se registraron antes del PIN lo crean desde su tarjeta, en el recuadro “🔑 Creá tu PIN”.)
En la caja: **⭐ Club → Atender → buscar su WhatsApp → 🔑 Asignar PIN**, el cliente elige 4 números y entra con “¿Ya tenés tarjeta?”. No hace falta la cámara.

**Pasar la tarjeta escaneando (alternativa).** En el celular nuevo, “¿Ya tenés tarjeta?” → “Mostrar código para el personal”. En la caja: **Atender → buscar su WhatsApp → 📱 Pasar a otro celular → escanear ese código**.

**"No se pudo abrir la cámara".**
El navegador necesita permiso de cámara y el sistema tiene que estar abierto con `https://`. Mientras tanto se puede buscar al cliente por WhatsApp.

**Un cliente pide la baja.**
Borrá su nodo en `fidelizacion/tarjetas/<id>` y su teléfono en `fidelizacion/telefonos/<número>` desde la consola de Firebase.

## Archivos

```
tarjeta.html              — Página del cliente (se abre con el QR de mesa)
js/fidelizacion-comun.js  — Reglas de día/semana/horario compartidas
js/club-personal.js       — Vista ⭐ Club del sistema interno
js/vendor/                — Librerías de QR (generar y escanear)
img/tarjeta-frente.svg    — Frente de la tarjeta (vector, del PDF original)
img/tarjeta-dorso.svg     — Dorso sin los datos variables (nombre, QR, texto del premio)
img/isotipo.svg           — Isotipo: el sello de cada visita
img/isotipo-crema.svg     — Isotipo en crema para el encabezado
img/logo.png              — Logo (ícono al guardar en el celular)
database.rules.json       — Reglas de seguridad de Firebase
```

**Datos en Firebase:** `fidelizacion/config`, `locales`, `staff`, `tarjetas/{id}`, `telefonos/{whatsapp}`, `visitas/{id}` y `canjes`.
