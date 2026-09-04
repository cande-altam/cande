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
- **Cantidad y contenido por unidad en cada ítem.** El formulario de Nueva factura tiene una columna **Cantidad** (cuántas unidades se compraron) y otra **Contenido c/u** (cuánto trae cada unidad en la unidad de medida del insumo). Con eso, lo que se guarda como precio del insumo es siempre el precio **por unidad de medida**, no el precio del bulto: un balde de dulce de leche a $50.000 con contenido 25 kg se guarda como $2.000 por kg, y un fardo de gaseosa a $12.000 con contenido 6 se guarda como $2.000 por unidad. El factor queda guardado en el insumo, así que la próxima factura de ese producto ya se interpreta bien sola. Cuando `cantidad × precio` no coincide con el importe de la línea, el sistema lo señala y propone el contenido que haría cerrar la cuenta, en vez de guardar un precio mal.
- **Detección de facturas ya cargadas.** El aviso aparece **apenas se escanea**, no recién al guardar. Las señales se evalúan de forma independiente y alcanza con que dé una: mismo proveedor + mismo N° de comprobante (comparado sin espacios ni guiones, y tolerando que el OCR haya perdido el prefijo del punto de venta), o mismo proveedor + misma fecha + mismo monto. Si coinciden el monto y la fecha está a pocos días, se avisa como *posible* duplicado. Esto importa porque el N° de comprobante es el dato que peor lee el OCR: si fuera el criterio principal, un solo dígito mal leído volvería a cargar la misma factura sin que nadie se entere.
- **Cuando no se puede identificar una factura, el sistema pregunta.** Pasa tanto si el escaneo falla del todo (se pasó de tiempo, error de la IA) como si "salió bien" pero no reconoció nada, o si leyó un proveedor que no existe en el sistema — ese último caso no se da por bueno, porque si no se termina creando un proveedor duplicado en silencio. En todos, aparece un panel con preguntas concretas (de qué proveedor es, CUIT, N° de comprobante, fecha, monto) que se contestan **ahí mismo**, y un botón que vuelve a leer la misma foto pasándole esas respuestas a la IA como pistas: sabiendo de quién es la factura, normalmente ya reconoce los ítems. Siempre queda la opción de cargar todo a mano.
- **Resolución de la foto que se manda a escanear.** Es un equilibrio delicado y vale documentarlo: a 1000px el texto chico (N° de comprobante, cantidades) se volvía ilegible y varias facturas no se reconocían; se subió a 2000px y eso rompió **todas**, porque el modelo de visión usa hasta ~2576px de lado largo y una foto de 2000px consume cerca del triple de tokens de imagen, con lo que cada escaneo se pasaba del tiempo máximo que la función serverless puede tardar en responder. El valor actual es **1568px**, que alcanza para leer el texto chico y entra cómodo en tiempo. Si aun así se pasa (factura muy larga, conexión lenta), se reintenta **una** vez solo con una versión más liviana antes de darse por vencido. La copia que se archiva en la base sigue siendo chica, aparte.
- **Tickets de mayorista (el caso que más costó).** Un ticket real de 30 ítems no se podía leer, y la causa era un techo de salida demasiado bajo: el detalle necesitaba ~1.700 tokens y el límite era 1.536, así que el JSON salía **cortado** y fallaba la factura entera. Ahora el techo es holgado, se le pide a la IA que omita los campos vacíos (el detalle ocupa casi la mitad) y, si aun así la lectura se corta, la foto se **relee por franjas** —con solape para no perder la línea del corte— y los ítems se juntan. También hay un botón **"📄 Leer por partes"** para pedirlo a mano.
  - Ese tipo de ticket trae además cuatro trampas que ahora están contempladas: (a) **el separador decimal no se puede asumir** (ver abajo); (b) **cada ítem ocupa dos o tres renglones** (cantidad y precio arriba, la descripción abajo, a veces "3 HORMA" como tercer renglón); (c) las líneas **"OFS" con importe negativo son descuentos**, no productos, y van al campo de cargos; (d) **el bloque "CLIENTE" no es el proveedor** — es el propio negocio, y darlo por bueno creaba un proveedor con el nombre de uno mismo; si no se ve quién emite, se deja vacío para que lo elija el usuario.
- **La IA NO recibe el catálogo ni devuelve ids — y es la corrección más importante de todas.** Se le pasaban hasta 600 insumos como `id → nombre` y se le pedía copiar el id de Firebase (20 caracteres aleatorios) en cada línea. En una factura real de 8 productos **los corrió un renglón**: la manteca figuró como salamín, el jamón como manteca, el durazno como salsa de chocolate. Las cantidades y los precios estaban perfectos; solo los nombres estaban desplazados, y la columna de marca lo confirmaba (cada fila traía la marca del producto anterior).
  - Es el error esperable: copiar identificadores opacos fila por fila a lo largo de una lista larga es justo lo que un modelo de visión hace mal, y **un id equivocado no se puede detectar mirando** — parece un id válido. Encima el código le creía al id de la IA por encima de su propio matcher.
  - Ahora la IA devuelve **solo lo impreso en el ticket** y el reconocimiento contra el catálogo es 100% del cliente, que tiene los alias aprendidos, comparación determinística y le pregunta al usuario cuando duda. De yapa, sacar 600 insumos del prompt lo achica muchísimo, y acá el límite que manda es el **tiempo** de respuesta.
- **El texto del ticket nunca se oculta.** Esto es lo que hizo que el error de arriba fuera invisible: la fila mostraba el nombre del catálogo (`Salsa de chocolate`) y el texto real del comprobante (`DURAZNO DOÑA BERTINA`) no aparecía en ningún lado. Ahora cada fila muestra **"📄 En la factura dice «…» → se asoció a …"**, y ese texto se guarda con la factura (`textoFactura`), así que una carga vieja se puede auditar sin ir a buscar la foto. Un dato que el sistema interpretó tiene que poder compararse con el original.
- **Los descuentos no se cuentan dos veces.** Si la IA los reporta en `descuentos` **y además** los deja como líneas, son los mismos descuentos contados dos veces: en una factura real dieron $22.846 cuando el ticket decía $13.193. Cuando hay líneas de descuento identificadas se usa esa suma, que es la verificable ítem por ítem; el campo suelto queda solo para cuando no se detectó ninguna.
- **El contenido por unidad se convierte de unidad.** `PAQUETE X 500 GR` son 0,5 kg, no 500 — sin la conversión, el precio por kilo quedaba mil veces mal. Si el insumo todavía no tiene unidad configurada se usa la base (gr→kg, ml/cc→l), porque si no la conversión solo funcionaba en líneas ya matcheadas, que son justo las que menos la necesitan.
- **"Ese es MI negocio, no un proveedor".** Los tickets muestran arriba al emisor y más abajo el bloque `CLIENTE`, que es el propio negocio. Con la foto cortada solo se ve el segundo, y el escaneo lo tomó como proveedor. El panel ahora ofrece guardar ese CUIT como **CUIT propio** de un toque: a partir de ahí el escaneo nunca más lo toma como proveedor.
- **El detalle leído se limpia en código, no solo por prompt.** Todo lo de abajo estaba pedido en el prompt y nada más que en el prompt: si el modelo no obedecía, la factura entraba mal y no había red que la atajara. Ahora se verifica con código determinístico —el prompt sigue, pero como ayuda, no como garantía— y lo que se toca se **informa** en un aviso arriba del formulario, porque un cambio silencioso es un cambio que nadie revisa. Cuatro reglas:
  1. **La cantidad sale de la aritmética, no de leer el número.** `cantidad = importe / precio unitario` es exacto y no depende de si el ticket usa coma o punto: `66588,86 / 11191,40` da 5,95 sin tener que adivinar si "5.950" son cinco mil novecientos cincuenta o cinco kilos con novecientos cincuenta. Solo se corrige cuando la cantidad leída **no cierra** con el importe impreso (1% de tolerancia); si cierra, no se toca.
  2. **Los renglones que no nombran un producto se descartan.** En un ticket de mayorista cada ítem ocupa dos o tres renglones: `5.950 x $ 11191.40` / `JAMON COCIDO PALADINI GRANDE  $ 66588.86` / `1 H`. Los renglones 1 y 3 son partes del mismo ítem — tomarlos como productos cargaba **el jamón tres veces**. La regla no es una lista de formas (siempre aparece una nueva) sino: si sacando números, medidas y palabras de envase no queda ninguna palabra con significado, ahí no hay producto. Con una salvaguarda: se exige que el texto tenga algún dígito, porque un insumo que de verdad se llame "Bolsas" o "Cajas" tampoco deja palabras significativas y sí es algo que se compra.
  3. **Las líneas de descuento nunca entran como productos.** `OFS…`, importes negativos, `BONIF`, `DTO`: se suman aparte y van a "Otros cargos". En la factura de VIDT eran 5 líneas por $17.331,45 — y una de ellas, `OFS JAMON COCID`, era la cuarta aparición del mismo jamón.
  4. **Las repeticiones del mismo producto al mismo precio unitario se unen.** Cubre dos casos con una sola regla: el ticket que lista el producto dos veces (las dos mermeladas de durazno, las dos mayonesas de VIDT) y la relectura por franjas, que con el solape puede traer la misma línea repetida. Se exige **mismo precio unitario y misma marca** a propósito: dos precios distintos son dos cosas distintas y unirlas sería inventar.
  - Con la factura de VIDT completa: de 25 renglones crudos quedan 13 productos, el jamón uno solo con 5,95 kg, y la suma de las líneas menos los descuentos da exactamente el subtotal impreso de $518.530,31.
- **El separador decimal se deduce de la cuenta, no se asume.** Esto rompió una factura real y vale dejarlo escrito: primero se ajustó el escaneo con la regla "en Argentina la coma es el decimal y el punto es de miles", que arregló un ticket… y rompió el siguiente. Dos comprobantes reales del mismo negocio: `4,660 x $8029,34 = $37.416,72` (coma decimal, 4,66 kg) y `5.950 x $11191.40 = $66.588,86` (**punto** decimal, 5,95 kg). No hay una convención que valga para todos. Lo único que decide sin ambigüedad es la aritmética: **cantidad × precio unitario tiene que dar el importe impreso de la línea**, y la lectura equivocada se delata sola porque da decenas de millones. El escaneo prueba las dos y se queda con la que cierra.
  - Si el comprobante trae **SUBTOTAL**, ese es el **control de completitud**: la suma de los importes de las líneas, menos los descuentos, tiene que dar el subtotal impreso. Si falta plata, faltan líneas y el sistema lo avisa (con el monto) y relee por partes; si sobra, avisa que puede haber una línea repetida o un descuento cargado como producto. El contador **"Cantidad de ítems"** del ticket **no** sirve para esto y ya no se usa: cuenta unidades o bultos, no renglones — un ticket con 15 productos declaraba 40 y otro con 14 declaraba 30, y eso disparaba una alarma falsa de "faltan líneas" en cada escaneo bueno.
  - Cuando el ticket lista los precios **sin IVA** y lo suma al final (SUBTOTAL + IVA = TOTAL), el escaneo lo detecta y destilda solo la opción "Con IVA", para que los precios se guarden como lo que realmente son.
- **Ante un "tardó demasiado", se lee por partes — no se achica la foto.** Es un error de razonamiento que costó una ronda entera de arreglos inútiles: en una factura larga el tiempo se va **generando la respuesta** (30 ítems son más de 1.700 tokens de salida), no leyendo la imagen. Achicar la foto no reduce el detalle en absoluto, así que ese reintento estaba condenado a fallar igual. Partir la foto en franjas sí divide el trabajo: cada franja tiene menos ítems y cada pedido entra holgado en el tiempo disponible. La versión liviana quedó solo como último recurso, para cuando el problema es la subida.
- **El límite real del escaneo es el TIEMPO, no la capacidad del modelo.** Medido en producción con el autodiagnóstico: la función devolvía **HTTP 502 a los 6.475 ms con una imagen de 1×1 píxel** — o sea que se pasaba de tiempo sin tener nada que leer. Por eso el escaneo usa por defecto un modelo **rápido** (`claude-haiku-4-5`), que hace esta tarea —leer un ticket y devolver JSON— muy por debajo de ese límite. El modelo más potente (`claude-sonnet-5`) queda detrás del botón "🔍 Reintentar en alta resolución", para las facturas difíciles donde se acepta esperar. Es la misma lección que con la resolución de la foto: acá la restricción que manda es el tiempo disponible, y conviene gastarlo donde rinde.
- **Nunca se usa un valor que el propio modelo declaró ilegible.** Pasó con un ticket real: la IA marcó `cuit` como ilegible y aun así devolvió uno — el del **CLIENTE**, o sea el del propio negocio. Si un campo aparece en `camposIlegibles`, su valor se descarta: es más seguro dejarlo vacío que arrastrar un dato que el propio lector considera poco confiable. Además, en **Ajustes → Datos del negocio** se puede cargar el **CUIT propio**: con eso, el escaneo nunca lo toma por error como si fuera el del proveedor.
- **Si faltan líneas, se relee solo.** Cuando la suma de las líneas leídas no llega al subtotal del comprobante, el sistema ya sabe con certeza que faltan renglones — así que no espera a que el usuario lo resuelva: relee la foto por franjas una vez y completa. El botón para pedirlo a mano queda igual, como acción principal del aviso. Si hay líneas cuyo importe no se pudo leer, no acusa faltantes: lo dice y pide revisar, porque ahí la cuenta no prueba nada.
- **Corregir una factura ya cargada (✏️ en el detalle).** Abre la misma pantalla de Nueva factura pero llena con lo que está guardado, para arreglar una cantidad o un precio puntual sin volver a cargar las quince líneas. Al guardar se reescribe sobre el mismo id: primero se **deshace** lo que la versión vieja había dejado en el historial de los insumos y después se aplica la nueva, así el costeo queda como si se hubiera cargado bien de entrada — si las dos versiones convivieran, el costeo (que toma el máximo) se quedaría con la equivocada. Conserva la foto y la fecha de carga original, y no se detecta a sí misma como duplicada.
- **Borrar una factura mal cargada deshace su efecto en los costos.** Esto faltaba y era grave: una factura mal leída no queda solo fea en el listado — mete una compra carísima en el historial del insumo, y como el costeo usa el **máximo de los últimos 60 días**, un error de lectura se lleva puesto el costo de todos los productos que usan ese insumo durante dos meses, sin forma de deshacerlo desde la app. Ahora el botón **"🗑️ Borrar y deshacer"** (dentro del detalle 🔎) borra la factura, borra las compras que dejó en el historial de cada insumo, devuelve cada línea proveedor+marca a su última compra válida —y la elimina si no le queda ninguna— y recalcula el costo sin ella. Las cotizaciones de lista de precios no se tocan: no dependen de la factura. Detalle que costó un bug y quedó cubierto por un test: al recalcular hay que poner `precioActual` en cero primero, porque cuando un insumo se queda sin historial y sin líneas el cálculo cae como último recurso en el propio `precioActual` — y el precio que se estaba borrando se resucitaba solo.
- **Ver qué cargó realmente el sistema (🔎 en Facturas).** Cada factura registrada se puede abrir y ver, en texto plano, exactamente lo que quedó guardado: proveedor, CUIT, N°, total, IVA, si los precios se guardaron con o sin IVA, cada ítem con su cantidad y precio (y, si vino por bulto, también el precio por unidad de medida), cuáles no quedaron asociados a ningún insumo, y el **control de la plata** — si la suma de las líneas cubre el comprobante o no, y por cuánto. Un botón lo copia entero al portapapeles. Existe porque cuando una factura se carga mal, mirar la foto no alcanza: hay que poder comparar contra lo que el sistema entendió, y hasta ahora no había forma de sacar eso de la app.
- **Corte propio en vez del "Load failed" del navegador.** iOS aborta por su cuenta las conexiones largas y devuelve un `Load failed` que no le dice nada a nadie. Las llamadas al escaneo tienen ahora su propio límite (25 s) con `AbortController`: el mensaje es claro, y sobre todo permite decidir qué hacer después (releer por partes) en vez de quedar en un error opaco.
- **Autodiagnóstico cuando el escaneo falla.** "No se pudo escanear" tapaba cuatro problemas muy distintos que se arreglan en lugares distintos: la función no está publicada, falta la `ANTHROPIC_API_KEY`, se agota el tiempo, o la lectura de esa factura en particular falló. Desde afuera los cuatro se ven igual, así que cualquier arreglo era a ciegas. Ahora, cuando un escaneo falla, el sistema prueba solo la función con una imagen mínima y dice en pantalla **cuál de los cuatro es** — sin que haya que ir a buscar ningún botón de diagnóstico.
- **Escaneos con foto de mala calidad.** El escaneo devuelve además una evaluación de la calidad de la imagen y la lista de campos que no pudo leer, y avisa cuáles conviene verificar a mano en vez de dar por buenos datos dudosos. Para las facturas difíciles (letra muy chica, muchas líneas apretadas) hay un botón **"🔍 Reintentar en alta resolución"**: manda la foto con el máximo detalle a cambio de esperar más. Es deliberadamente opt-in — ponerlo por default fue justo lo que hizo que en un momento dejara de reconocerse cualquier factura.
- **Acceso.** La contraseña se guarda en la base (`costeo/config/adminPassword`) y llega de forma asincrónica al abrir la app. Ojo con esto, porque causó un bloqueo real: si alguien apretaba "Ingresar" antes de que esa config terminara de cargar, el código concluía que no había ninguna contraseña configurada y **escribía la de fábrica encima de la verdadera**, dejando al usuario afuera. Ahora, antes de dar por hecho que no hay contraseña, se lee el valor autoritativo de la base; la de fábrica solo se siembra si la base efectivamente no tiene ninguna. Si se pierde la contraseña, se ve y se cambia en la consola de Firebase, en esa misma ruta — el mensaje de error de la pantalla de login lo indica.
- **Diagnóstico (pestaña Configuración).** Dos cosas que evitan tener que adivinar cuando algo no anda: la **versión que está corriendo** en el navegador (si no coincide con la del último deploy, el navegador está mostrando una copia guardada y hay que forzar la recarga), y un botón **"🩺 Probar la conexión del escaneo"** que dice en un click si la función serverless está publicada, si le falta la `ANTHROPIC_API_KEY`, si se pasa de tiempo, o si está operativa.
- Generar automáticamente la orden de pago de cada factura y marcarla pagada/no pagada.
- **Regla de costeo (la fuente de verdad de todo el módulo):** un insumo se costea con el **precio más alto entre las compras de los últimos 2 meses**. De esa única regla salen las tres condiciones del negocio: (a) solo pesan los proveedores/marcas a los que realmente se les compra — si una línea no tuvo compras en 2 meses, deja de contar; (b) una compra puntual más barata **no** baja el costo, porque la compra cara reciente sigue mandando; (c) una baja **sostenida** sí termina bajando el costo sola, cuando la compra cara queda fuera de la ventana. Se recalcula en vivo, así que el paso del tiempo surte efecto sin necesidad de tocar nada. Si no hubo ninguna compra en la ventana, se usa la última conocida para no quedarse sin costo.
- **Listas de precios de proveedor (pestaña 🏷️ Listas de precios).** Los proveedores mandan periódicamente su lista completa; en vez de cargarla insumo por insumo, se le saca una foto o se pega el texto (WhatsApp, mail, PDF copiado) y la IA la lee entera. Cada línea se matchea contra el catálogo y queda en una tabla de revisión editable —con el precio de lista, el costo actual y la variación— donde se elige a qué insumo o producto va cada una y se aplican **solo las tildadas** (hay un atajo "🔺 Solo las que suben", que son las únicas que cambian el costeo). Las líneas cotizadas por bulto se convierten a precio por unidad de medida igual que en las facturas.
  - **Las listas largas se mandan por partes.** Una lista completa en un solo pedido necesita una respuesta larga, y generarla tarda más de lo que la función serverless puede esperar: por eso una lista entera siempre terminaba en *"tiempo de espera agotado"*. El texto se parte solo en bloques de 40 líneas y se manda uno por uno, con el progreso a la vista ("Leyendo parte 2 de 5..."). Si una parte falla, las demás igual se cargan y se avisa cuál reintentar. Con una foto no se puede partir el pedido, así que si se pasa de tiempo se reintenta una vez con una versión más liviana.
  - **Lectura sin IA (red de seguridad).** El botón **"⚡ Leer sin IA (nombre y precio)"** parsea el texto en el propio navegador, sin servidor: sirve para las listas que llegan como dos columnas (`Leche entera 1200`, `Queso crema; $1.234,56`, `Yogur - 750`) e interpreta separadores de miles y decimales al uso argentino. Es el camino garantizado cuando la función serverless no responde: nunca se puede quedar sin poder cargar una lista por un problema de infraestructura.
  - **El proceso está explicado en pasos** en la propia pantalla (elegir proveedor → pegar o subir la lista → revisar lo reconocido → aplicar), marcando en cuál se está.
  - **Cómo pesa una lista en el costeo:** una lista **no es una compra**, así que no entra en el historial de compras — pero sí participa del "precio más alto", con una restricción: **solo puede subir el costo, nunca bajarlo**. Si el proveedor manda una lista más cara, el costo se actualiza enseguida (es lo que vas a pagar en la próxima compra, y así el margen queda protegido sin esperar a comprar). Si la manda más barata, el precio se guarda y se destaca como oportunidad de compra, pero el costo recién baja cuando esa compra más barata se hace de verdad. Una lista de hace más de 2 meses deja de contar sola, igual que una compra vieja, y una compra real de esa misma línea proveedor+marca reemplaza al precio de lista (ya sabés lo que efectivamente pagaste). En el detalle del insumo, las líneas que vienen de una lista se marcan con **🏷️ Lista de precios**.
- Un mismo insumo puede comprarse a varios proveedores, y un mismo proveedor puede tener varias marcas a precios distintos (ej. **un solo insumo "Levadura"** con 4 líneas: Leudex y Duquesa, cada una en Calsa y en Casa Naoum). Cada combinación proveedor+marca es una línea dentro del mismo insumo, no insumos separados; cada fila tiene un botón **"➕ Precio"** para cargarlas de a una. En el detalle del insumo cada línea se marca con **⭐ Define el costo** (la más cara de las recientes), **💡 Más barato** (sirve para saber dónde comprar) o **⏳ Sin comprar hace +2 meses** (ya no entra en el cálculo). Un insumo también puede tener su propia receta (bases como crema chantilly o bizcochuelo) — ahí su costo se calcula en vivo desde sus ingredientes y se propaga a todo producto que la use.
- **El precio de un insumo se edita directo en la fila** de la tabla de Insumos: se escribe encima del número y se guarda al salir del campo o con Enter. No hay que abrir ningún panel ni completar un formulario. Es el camino más corto para lo más frecuente ("subió la leche, quiero poner el precio nuevo"); el precio queda sobre la línea proveedor+marca que hoy define el costo, sin crear una línea nueva por cada corrección. Para agregar *otro* proveedor o marca sigue estando el botón "➕ Precio".
- **Lo que se usa en producción Y además se vende (la leche, el jamón cocido).** No hay que duplicarlo ni moverlo de catálogo: en el detalle del insumo, el botón **"🛒 También se vende al público"** crea el producto tomando el costo *de ese insumo* (preguntando cuánto lleva cada unidad que vendés — 1 si vendés el sachet de litro, 0,25 si vendés un vaso de 250 ml). El precio se mantiene en un solo lugar y cualquier cambio de costo se propaga a los dos usos. Es distinto de "➡️ Mover a Productos", que lo saca de Insumos y solo sirve si en realidad no se usa en producción.
- **Fiambres y reventa:** un producto puede **vincularse a un insumo** para tomar de ahí su costo de compra. Es el caso del jamón cocido, que se revende por kilo y además se usa como insumo en recetas: se carga **una sola vez como insumo** — con todas sus líneas proveedor+marca — y el producto se costea con la misma regla, sin mantener el precio en dos lugares.
- Si el catálogo YA TIENE insumos separados que en realidad son el mismo producto con la marca metida en el nombre (ej. "Levadura Leudex" y "Levadura Duquesa" cargados como dos insumos distintos, típico de datos cargados antes de esta funcionalidad), el botón "🏷️ Detectar variantes de marca" en Insumos los agrupa y sugiere fusionarlos en uno solo, asignándole a cada línea la marca que le corresponde — no se pierde el detalle al unificarlos. Entiende nombres de varias palabras (ej. "Baño de chocolate semiamargo Alpino" y "Baño de chocolate semiamargo Lodiser" se agrupan entre sí por "Baño de chocolate semiamargo"), pero nunca mezcla productos genuinamente distintos aunque compartan casi todo el nombre (ej. "Baño de chocolate semiamargo" y "Baño de chocolate blanco" quedan separados; "Leche entera" y "Leche descremada" también). De todas formas, nunca fusiona nada sin que lo confirmes. El botón "🔀 Agrupar insumos a mano" hace lo mismo pero eligiendo vos mismo cuáles van juntos, sin depender de ninguna sugerencia automática. Esto es para **arreglar** insumos que quedaron mal separados — para cargar las variantes de marca/proveedor de un insumo que ya es único, no hace falta fusionar nada: se usa el formulario "+ Agregar otro proveedor/marca" mencionado arriba.
- **Reconocer un insumo aunque la factura lo escriba distinto (y dejar de fusionar a mano).** Era el trabajo repetitivo más caro del sistema: el proveedor imprime `CREMA DE LECHE LA SERENISIMA X 1LT`, el catálogo tiene `Crema de leche`, no matcheaba, se creaba un insumo nuevo — y a la factura siguiente, otra vez. El reconocimiento ahora tiene tres capas, de más a menos confiable:
  1. **Alias aprendidos.** El texto exacto que ya se resolvió antes para ese insumo. Un proveedor imprime siempre igual, así que esto liquida el caso repetido sin margen de error.
  2. **Nombre normalizado idéntico** (sin acentos, mayúsculas ni puntuación).
  3. **Parecido por palabras significativas**, sacando el ruido de envase y tamaño (`x`, `kg`, `sachet`, `balde`, números) y reduciendo plurales a una raíz común.
  - Sobre la raíz: no busca el singular correcto sino que singular y plural caigan en el **mismo** valor. Sacar solo la `s` fallaba con `panes`/`pan`; sacar `es` fallaba con `dulces`/`dulce`. Sacando la `s` y después la `e` final, los dos pares coinciden — `dulces`→`dulc`←`dulce`, `panes`→`pan`←`pan`.
  - Y sobre la métrica: el coeficiente de Dice castiga las palabras de más, así que `CREMA DE LECHE LA SERENISIMA X 1LT` contra `Crema de leche` daba 0,8 y quedaba abajo del umbral — se preguntaba algo obvio. Si el nombre del catálogo aparece **completo** dentro del texto de la factura, eso pesa más. Con una salvedad: se exige que el nombre del catálogo tenga al menos dos palabras, porque si no un insumo llamado `Leche` se comería `LECHE DESCREMADA`.
- **Crear un insumo es siempre una decisión explícita.** El recorrido al cargar una factura es *analizar cada línea → buscar coincidencias → preguntar → y recién si no existe, crear*. Al guardar, **ninguna** línea da de alta un insumo sin pasar por el panel de confirmación — tenga candidatos parecidos o no. Cada bloque muestra el texto impreso en la factura y ofrece tres caminos: los candidatos que se le parecen, un desplegable con **todo** el catálogo (por si la sugerencia no acierta), y "➕ Crear «…»" como última opción.
  - Antes solo se preguntaba cuando había algo parecido, y una línea sin coincidencias se creaba sola. Con el catálogo ya sin duplicados eso dejó de tener sentido: cada alta nueva ensucia un catálogo limpio, y revisarla cuesta un toque contra las horas que cuesta fusionar después.
  - Las líneas que el sistema **sí** resuelve solo (alias aprendido o coincidencia alta) no interrumpen, pero se listan en el mismo panel como "N líneas reconocidas solas: …". El análisis queda a la vista: si reconoció mal, se ve ahí y no tres semanas después en un costo raro.
  - Elegir un insumo existente **enseña el alias**, así que ese texto no vuelve a preguntarse nunca. Y elegir "➕ Crear insumo" desde el buscador de la propia fila ya cuenta como la decisión: el panel no lo vuelve a preguntar.
- **Fusionar enseña.** Cuando se fusionan insumos repetidos a mano, el que queda hereda los alias de los absorbidos y —lo importante— **sus nombres pasan a ser alias suyos**. Así el trabajo de fusionar no hay que repetirlo: la próxima factura que traiga el texto del insumo absorbido cae directo en el que sobrevivió, en vez de volver a crear el repetido que se acaba de eliminar. Los alias también se le mandan a la IA del escaneo, que es la mejor pista posible — le muestra el texto real del proveedor, no el nombre prolijo del catálogo.
- **🍞 Insumos que son productos.** Los productos terminados que se compran para revender (medialunas, budines, panes) se cuelan como insumos solos, porque el escaneo crea un insumo por cada línea de factura. Como insumos no se les puede poner precio de venta ni ver el margen. El detector los lista para revisar y moverlos **en lote** a Productos, con el costo que ya tenían. Es deliberadamente conservador: solo propone los que **no se usan en ninguna receta** y no son bases —si algo se usa para elaborar es materia prima aunque se llame "pan"— y descarta los que traen palabras de materia prima (`harina para pan`, `premezcla de bizcochuelo`, `pan rallado`).
- **Buscador de insumos y bases en el editor de recetas.** Cada fila de ingrediente es un desplegable con los 230+ insumos: encontrar una base ahí era imposible. Ahora todos los editores de receta (el panel 📋 de un producto, la card de una base, y los formularios de producto e insumo) tienen arriba un buscador que reduce las opciones de **todos** los desplegables del panel a la vez, con un contador de cuántas quedaron. Las bases se distinguen con 🧪 en la lista, así se ve de un vistazo qué es materia prima comprada y qué es una preparación propia.
  - Detalle que importa y está cubierto por un test: **el ingrediente que una fila ya tiene elegido nunca se filtra**, coincida o no con la búsqueda. Si desapareciera del desplegable, escribir en el buscador editaría en silencio las filas ya cargadas — un buscador no puede cambiar la receta. Por lo mismo, una fila agregada con el buscador activo nace ya filtrada.
- **Crear bases desde Recetas y Bases.** Una base es un insumo con receta propia (crema chantilly, bizcochuelo, almíbar): su costo sale de sus ingredientes y no de una factura. Antes había que ir a Insumos → Nuevo insumo y acordarse de armarle una receta — y ahí estaba el huevo y la gallina: la base no era base hasta tener su primer ingrediente, así que no había dónde cargárselo. Ahora el botón **"➕ Nueva base"** la crea vacía (marcada con `esBase`) y abre su card para llenarla en el momento. Si el nombre ya existe como insumo, no se duplica: ese insumo pasa a figurar también como base.
- Cargar productos con su receta (qué insumos y en qué cantidad llevan, incluyendo bases) y calcular su costo automáticamente a partir del precio de los insumos. La pestaña **Productos** clasifica cada uno como elaborado/preparación/retail (según la categoría que le cargues), tiene el precio de venta editable ahí mismo (con un precio sugerido según el modelo de costeo, redondeado de 100 en 100) y muestra de un vistazo si se está vendiendo a pérdida, con margen bajo, o si su costo cambió en los últimos días (por facturas cargadas). Cada producto tiene un panel "📋 Receta" para verla, modificarla, armarla desde cero o vaciarla sin tener que abrir el formulario completo de edición.
- Si algo quedó mal clasificado (un insumo que en realidad es de reventa, o un producto que en realidad es una materia prima), los botones "➡️ A Productos" / "➡️ A Insumos" lo mueven de un catálogo al otro conservando el costo que ya tenía cargado. No se puede mover un insumo que se usa en alguna receta, ni algo que tiene su propia receta (bases/productos elaborados) — hay que resolver eso primero.
- La pestaña **💬 Consultas** deja hacerle preguntas en lenguaje natural a la IA sobre las compras ya cargadas (ej. "¿Cuándo compramos queso crema por última vez?", "¿Qué proveedor nos vende más barata la harina?") — responde en base al historial de precios de los insumos, las facturas, los proveedores y las listas de precios cargadas, sin inventar datos que no estén cargados. Distingue explícitamente entre compras hechas y precios de lista todavía no comprados, así una pregunta como "¿cuándo compramos X?" no se contesta con una cotización.
- La pestaña **📋 Recetas y Bases** reúne, en cards con tablas editables, las recetas de todos los productos elaborados/preparación y las de las bases (insumos con receta propia) — se puede ver, armar o modificar cualquier receta o base desde un solo lugar, sin tener que ir producto por producto.
- Cuando el precio de un insumo o el costo de un producto sube respecto a lo que se venía usando, queda una alerta con el número resaltado en rojo y el detalle completo (proveedor, precio anterior, precio nuevo, % de suba, fecha). Las subas de 15% o más en un solo salto se marcan como **abruptas** con una notificación más grande (🚨). La pestaña **Análisis** tiene una sección "🚨 Alertas de subas de precio" que junta todas las alertas vigentes (insumos y productos) en un solo lugar, pensada para poder avisarle directo al área de compras, y otra "💡 Oportunidades de compra" con las bajas recientes — las que conviene aprovechar al comprar, aunque no bajen el costeo.
- Comparar la variación de precio de cada insumo contra la inflación mensual cargada a mano, y alertar cuáles subieron por encima de la inflación. La misma pestaña **Análisis** también aplica un modelo de costeo sugerido (28% costo variable / 37% costos fijos / 20% renta esperada / 15% mermas) para detectar productos cuyo precio de venta quedó por debajo de lo que sugiere el modelo.
- Guardar banco y alias de cobro de cada proveedor, además de sus datos de contacto.
- Llevar el control de IVA crédito fiscal (pestaña **IVA**): cada factura puede cargar su IVA discriminado (a mano o vía el escaneo por IA), y el sistema lo suma por mes. Cargando también el IVA débito fiscal del mes (de las ventas, a mano) calcula el saldo a pagar o a favor.
- **Precio de venta de los productos de reventa (modelo de la hoja PLU).** Los productos que se compran ya hechos y se revenden (almacén, bebidas, lácteos, fiambres) NO se costean con el modelo de producción, sino con la cadena de la hoja PLU del archivo Costos: **costo sin IVA → + impuestos (IVA) → = costo total → × (1 + % de ganancia) = precio sugerido de venta**. Los valores por defecto son los que más se repiten en esa hoja (IVA 21%, ganancia 30%), pero ambos son editables por producto, porque en los datos reales conviven alícuotas de 10,5% / 21% / 24% y márgenes de 30 / 34 / 35 / 40%. La tabla de Productos muestra el desglose debajo del precio sugerido, y el formulario de edición deja ajustar el costo sin IVA, la alícuota y el margen.
  - Al cargar una **lista de precios**, la tabla de revisión muestra para cada línea —antes de aplicar nada— el **costo sin IVA, los impuestos, el costo total, el % de ganancia (editable ahí mismo) y el precio de venta sugerido** que va a quedar, junto al precio de venta actual para poder compararlos. Si la lista aclara que sus precios son finales, se le descuenta el IVA para obtener el costo neto, porque toda la cadena arranca del costo sin IVA.
- **Precios pendientes de actualizar en la caja (FUDO).** Hay dos listas separadas para dos preguntas distintas, y conviene no confundirlas:
  - **"🔄 Precios a actualizar"** responde *"¿a qué productos les cambió el costo y su precio de venta quedó desfasado del sugerido?"*. Es un cálculo en vivo (no se guarda nada): compara el precio de venta cargado contra el que sugiere el costo actual, con la diferencia y el % de variación. Si el costo vuelve a moverse, la lista se actualiza sola. El precio se **edita ahí mismo**, sin tener que cerrar el panel y buscar la fila en la tabla completa de productos (que puede tener cientos): el campo "Precio nuevo" viene precargado con el sugerido, con un botón **✓** para aceptarlo tal cual, o se puede escribir otro valor. Apenas se guarda, la fila sale sola de la lista si el precio ya quedó al día — no hace falta cambiar de pestaña y volver para que se note.
  - **"📤 Precios editados"** responde la pregunta que hace falta cuando estás *vos* cambiando precios a mano en la pestaña Productos, para después pasarlos a la caja: *"¿qué precios toqué yo, y de cuánto a cuánto?"*. Cada vez que se guarda un precio de venta desde el campo de la tabla, queda registrado con el valor de **antes de la primera edición de esta tanda** y el valor actual — si tocás el mismo producto varias veces antes de pasarlo a FUDO, no se acumulan pasos intermedios, solo el "antes" y el "ahora" final. Si terminás volviendo al valor original, la entrada se borra sola porque no hay nada que actualizar. La fila del producto en la tabla muestra además un aviso **"📤 Falta pasar a FUDO"** mientras esté pendiente.
  - Las dos ofrecen **copiar** (nombre + precio nuevo, separado por tabulador — pega directo en una fila de Excel/Sheets) y **descargar CSV** (separado por punto y coma y con BOM, que es lo que abre bien Excel en configuración regional argentina). "Precios editados" además tiene un botón **"✅ Ya lo pasé a FUDO"** para vaciar la lista una vez que los cambios ya están en la caja (o quitar una fila puntual con el ✕), porque a diferencia de la otra lista, esta si no se vacía a mano se queda ahí para siempre.
- **🧃 Unificar productos similares (variantes de sabor y familias de marca).** El catálogo de retail termina cargando un producto por cada sabor ("Ades de manzana x 200", "Ades de naranja x 200 cc") o por cada marca de una misma familia de gaseosas (Coca Cola, Coca Cola Zero, Fanta, Fanta Light, Sprite, Sprite Zero) por separado, cuando conviene tener uno solo por medida. El botón **"🧃 Unificar similares"** en Productos detecta estos grupos —agrupando siempre por la misma medida, nunca mezclando medidas distintas— y los deja para revisar: se elige cuál producto queda como base (su costo y precio de venta son los que se conservan), se puede ajustar el nombre final, y recién ahí se confirma. Nunca se fusiona nada solo. Distingue variantes de sabor de productos genuinamente distintos con la misma lista de descriptores que ya usa "🏷️ Detectar variantes de marca" en Insumos, así "Leche entera" y "Leche descremada" no se agrupan entre sí.
- **Arreglado: productos que no sugerían actualizar su precio aunque el costo hubiera cambiado.** Pasaba por dos motivos:
  - Los productos vinculados a un insumo ("también se vende al público", la leche) nunca miraban el costo del insumo para el precio sugerido de reventa — solo lo usaban para la columna "Costo actual". Ahora el sugerido también sigue al insumo, sin sumarle IVA de nuevo (el precio del insumo ya se toma como costo final, igual que en esa columna).
  - El campo rápido de costo en la tabla de Productos escribía en `costoManual`, pero el sugerido prioriza `costoSinIva` en cuanto un producto lo tiene cargado (por el formulario completo o por "🍞 Insumos que son productos") — así que en esos productos, tocar ese campo no cambiaba nada. Ahora el campo edita `costoSinIva` directamente (precargado con el costo neto que se esté usando en ese momento) y dice "Costo sin IVA" en vez de "Costo manual".
- **Arreglado: productos que son insumo y retail a la vez (los fiambres) podían quedar con el costo desincronizado entre los dos lugares.** El formulario completo de producto permite elegir un insumo vinculado y a la vez tiene el campo de costo manual/sin IVA visible — nada impedía cargar los dos juntos (por ejemplo, si el costo se había cargado a mano antes de vincular el producto al insumo). Cuando eso pasaba, el precio sugerido de venta se quedaba con el costo manual viejo para siempre, aunque el insumo se encareciera con cada factura nueva, porque `costoSinIva` le ganaba al insumo en el cálculo. Tres cambios para que esto no vuelva a pasar:
  - El insumo vinculado ahora le gana SIEMPRE al costo manual/sin IVA en el cálculo del precio sugerido (antes solo se lo aplicaba a la columna "Costo actual", quedando inconsistente entre las dos).
  - Guardar el formulario completo de producto con un insumo vinculado elegido ahora descarta lo que hubiera en los campos de costo manual/sin IVA, en vez de guardarlo sin usar.
  - Un mantenimiento que corre solo al entrar a Productos limpia el costo manual/sin IVA de cualquier producto que ya haya quedado así en la base, para que el dato viejo no pueda confundir a nadie ni resucitar si el día de mañana se desvincula el insumo.
  - Se confirmó además que cargar una factura o una lista de precios para uno de estos productos ya actualizaba el insumo (el único lugar donde se guarda ese costo) y no el producto — eso ya funcionaba bien, quedó cubierto con tests para que siga así.
- **Navegación en dos niveles.** Las doce pestañas planas se agruparon en cuatro secciones según la tarea: **🛒 Compras** (nueva factura, facturas, órdenes de pago, listas de precios, proveedores, IVA), **📦 Catálogo** (insumos, productos, recetas y bases), **📈 Análisis** (análisis, consultas) y **⚙️ Ajustes**. La barra de arriba muestra solo los cuatro grupos y una segunda fila muestra las pestañas del grupo activo, así nunca hay más de seis opciones a la vista. Doce opciones planas obligan a leerlas todas para encontrar una, y en el celular quedaban apiladas en un menú larguísimo.
- **Rendimiento.** Con el catálogo real (200+ insumos, 260 productos, cientos de facturas) había tres problemas que hacían la app muy lenta, todos corregidos:
  - *Las funciones de render escribían en la base de datos.* Recalcular las bases y guardar el histórico de costos se hacía dentro del render; cada escritura despertaba a los listeners de Firebase, que volvían a renderizar, que volvían a escribir. Entrar a Productos disparaba una cascada encadenada. Ahora ese mantenimiento corre una sola vez por sesión, fuera del render, con los re-renders agrupados en uno solo.
  - *Recetas y Bases abría el formulario editable de todas las recetas a la vez.* Cada fila de ingrediente lleva un desplegable con todos los insumos, así que eran cientos de miles de `<option>`: **52 segundos y 26 MB de HTML**. Ahora las cards vienen colapsadas y se abre una por vez — más rápido y, sobre todo, usable: un muro de 260 formularios abiertos no se puede navegar. Bajó a **147 ms y 114 KB**.
  - *Las fotos de las facturas viajaban con el listado.* Se guardaban dentro de cada factura, así que se descargaban todas juntas al abrir la app (decenas de MB) y además se incrustaban en el HTML de la tabla: **19 segundos y 47 MB** para dibujar la lista. Ahora se guardan en `costeo/facturasFotos/{id}` y se cargan solo al pedirlas: **318 ms y 191 KB**. Para las facturas ya cargadas hay un botón de migración en Configuración → Rendimiento.
  - Además, el costo de cada insumo se memoiza durante el render (antes se recorría su historial completo una vez por cada producto que lo usa) y el historial de un insumo solo se arma si su fila está abierta.
- Buscador de texto en las vistas de listado (Facturas, Pagos, Proveedores, Insumos, Productos, Recetas y Bases, Listas de precios) para encontrar rápido por nombre, proveedor, marca, CUIT o N° de factura según la vista.

### Acceso

URL: `https://<tu-sitio>.netlify.app/costeo-proveedores/`. Contraseña inicial: `costeo2025` (cambiable desde la pestaña **Configuración**).

### Configuración en Firebase

Usa el proyecto Firebase `pedidos-de-produccion-ee3cb` (ya existente), bajo la rama de datos `costeo/`. **No requiere ninguna configuración adicional** — las fotos de facturas se guardan comprimidas (como texto, base64) directo en la misma Realtime Database que ya está habilitada, en vez de usar Firebase Storage, así que no hace falta activar ni configurar nada nuevo.

> Nota: esto hace que cada factura con foto ocupe más espacio en la base de datos que si estuviera en Storage. Para el volumen de un negocio como este no debería ser un problema, pero si en algún momento la base crece mucho y querés optimizar, se puede migrar a Firebase Storage más adelante.

### Funciones con IA (opcional)

Dos funciones usan la API de Claude (Anthropic) y comparten la misma configuración:

- `netlify/functions/extraer-factura.js`: al subir una foto de la factura (de la cámara o de la galería/archivos), la escanea automáticamente.
- `netlify/functions/extraer-lista-precios.js`: lee la lista de precios de un proveedor (foto o texto pegado) y devuelve cada línea con su precio, matcheada contra el catálogo.
- `netlify/functions/consultar.js`: responde las preguntas en lenguaje natural de la pestaña **Consultas**.

Para que funcionen:

1. Desplegar el sitio en Netlify **vía GitHub** (Add new site → Import from Git) — el deploy por drag & drop no empaqueta funciones.
2. En el sitio de Netlify → **Site configuration → Environment variables**, agregar `ANTHROPIC_API_KEY` con una clave válida de [console.anthropic.com](https://console.anthropic.com/), con crédito cargado en **Plans & Billing**.

Si la clave no está configurada, o el escaneo falla, no pasa nada: el formulario de "Nueva factura" se completa a mano igual (o con el botón "Reintentar escaneo"), sin ninguna dependencia de la IA para funcionar. La pestaña Consultas, sin la clave configurada, muestra un aviso claro en vez de una respuesta.

El escaneo identifica al proveedor por **razón social o CUIT** (lo que efectivamente figura impreso en la factura), no por el nombre comercial con el que está cargado en el sistema. También recibe el catálogo de insumos ya cargados y trata de matchear cada línea de la factura contra un insumo existente (aunque el texto tenga mayúsculas, abreviaturas o tamaño de envase distintos, ej. "LECHE ENT. X 1LT" ≈ "Leche entera"), en vez de crear un insumo nuevo por cada factura. Una vez elegido el proveedor, el buscador de insumos de esa vista prioriza los productos que ya le compraste antes a ese proveedor.

En la pestaña **Insumos** hay un botón "Buscar posibles duplicados" que revisa el catálogo (nombres casi idénticos) y sugiere pares para fusionar — no fusiona nada automáticamente, siempre queda a criterio de quien lo revisa.

---


- **Editar y copiar presupuestos ya hechos.** Un presupuesto guardado se puede **✏️ editar** —conservando su número, su estado y el pedido que haya generado— en lugar de rehacerlo de cero; y **📋 copiar**, que arma uno nuevo con los mismos ítems para el cliente que vuelve a pedir algo parecido. Si el presupuesto ya fue aceptado, editarlo avisa que el pedido del cliente ya salió con los valores anteriores y no se actualiza solo.
- **👥 Clientes.** No hay que cargarlos: se arman solos con los presupuestos, agrupados por teléfono (lo más estable) o, si no hay, por nombre normalizado — así "Perez" y "Familia Pérez" con el mismo teléfono son una sola ficha. La pestaña muestra cuántos presupuestos tiene cada uno, cuántos aceptó y el total cotizado, y desde ahí se puede ver o copiar cualquiera. Además, al escribir el nombre en un presupuesto nuevo aparece **qué se le cotizó antes** ("ya tiene 2 presupuestos, el último $450.000") con un atajo para copiar ese presupuesto, y se completa solo el teléfono ya conocido. Es la información que permite ofrecerle algo coherente con lo anterior.
- **Notas de varios párrafos.** El campo de aclaraciones pasó de una sola línea a un texto de varios renglones, y cada renglón se imprime como un **párrafo aparte** en el presupuesto. Las aclaraciones que se repiten (seña, validez, condiciones de entrega) se guardan una vez en **Configuración** y después se agregan con un click desde el propio presupuesto, sin volver a tipearlas.
- **🧮 Cantidades por evento (borrador y ayuda memoria).** Para pensar un evento antes de cotizarlo: se elige el tipo (coffee break, desayuno, cumpleaños infantil o adulto, mesa dulce) y la cantidad de invitados, y sale cuánto hay que preparar de cada cosa. Cada renglón tiene su cantidad **por persona** (o **cantidad fija**, para lo que no se multiplica — la torta principal es una sola sean 50 o 200 invitados) y un campo de **ayuda memoria** para las notas que uno siempre olvida ("los chicos comen la mitad", "contar los adultos aparte").
  - Las unidades contables se redondean **para arriba** (no se sirve media medialuna); las de peso o volumen conservan decimales, porque ahí sí tiene sentido "7,5 litros".
  - Es un **borrador**: ajustar una cantidad no toca la plantilla. Si esas cantidades nuevas son las buenas, **"⭐ Guardar como plantilla"** las deja para la próxima vez — así el ayuda memoria se va afinando con la experiencia real en vez de quedar en un papel.
  - Los borradores se guardan con nombre y fecha, se pueden retomar, y **"📝 Pasar a presupuesto"** los convierte en las líneas del presupuesto con las cantidades ya calculadas: solo queda ponerles precio.
  - Las plantillas iniciales son un punto de partida editable para no arrancar de una pantalla vacía — las cantidades reales las define el negocio, no el sistema.
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

## Módulo: Informes de Turno

Al terminar su turno, el **Experto Candela** deja un informe. Son hasta 4 por día (2 turnos × 2 locales: SLA 5.0 y San Luis) y **no se consolidan**: cada turno es su propio registro.

Son dos páginas separadas, siguiendo el patrón de `vacaciones/` (`pedido.html` para quien carga, `index.html` para quien lee):

| Archivo | Para quién | Acceso |
|---|---|---|
| `informes/carga.html` | El Experto, al cerrar el turno | Sin clave |
| `informes/index.html` | Gerencia | Cuenta de Firebase Auth (ver abajo) |

### La página de carga

La restricción de diseño que manda es el **tiempo**: un informe que lleva más de cinco minutos desde el celular se deja de hacer, y ahí se pierde el sistema entero. Todo lo demás sale de ahí:

- **Un botón grande de "Sin novedades"**, arriba de todo. Es la respuesta más frecuente y cuesta un toque: manda el informe con el equipo en "cumplió" y sin incidencias. Está **antes** del formulario largo a propósito — si hay que scrollear todo para encontrarlo, deja de ser un atajo.
- **Todo arranca en el estado normal.** Cada persona del checklist viene marcada como que cumplió; solo se toca a quien no. Marcar "No" abre el campo del motivo.
- **Los nombres vienen del cronograma** (ver abajo), así no hay que escribirlos.
- Las incidencias son las 8 del manual, como casillas, más un campo libre.

### Integración con Cronogramas

Se lee `cronogramas/state` una sola vez al abrir:

- **Quién fue el Experto**: `state.expertos` es la lista de gente marcada con ⭐. Ojo con la semántica — es una marca **permanente sobre la persona**, no "quién fue el Experto de este turno". Por eso el desplegable la cruza con quiénes están asignados a ese día/local/turno en `state.assign` y los muestra primero como "⭐ Expertos en este turno"; si hay uno solo, se elige solo.
- **El equipo del checklist**: sale de `state.assign` (clave `dia|local|turno|rol|indice`) más los sumados sueltos de `state.ex`. Los roles del manual no son los del cronograma: "Vendedor / Mozo" es `atencion`, "Ayudante de cocina" junta `cocina` y `ayudante`, y **Limpieza no existe en el cronograma** — esa fila va siempre a mano.

**Nada de esto es obligatorio.** Si el cronograma no está, falla la lectura o es de otra semana, el formulario avisa y sigue siendo completamente usable a mano. Un informe que no se puede cargar porque falla otro módulo es un informe que no se carga; está cubierto por un test que corre la página con la lectura del cronograma rota y envía igual.

### Un turno, un informe

El id del registro es determinístico: `{fecha}_{local}_{turno}`. Eso hace imposible que existan dos informes del mismo turno y convierte "qué turnos faltan" en una pregunta con respuesta exacta. Si se carga un informe donde ya había uno, se avisa **antes** de completar el formulario (enterarse al apretar Enviar es la forma de que el trabajo se haga dos veces) y el anterior se conserva en `informes/history/{id}/{ts}` — un informe es el registro de lo que pasó en un turno, pisarlo sin dejar rastro sería borrar información.

### La página de Gerencia

Lo que hace falta no es leer informes sueltos, es **ver si algo se repite**:

- **La semana de un vistazo**: los 4 turnos × 7 días, con ✓ (informó sin novedades), **!** (informó y hay algo para mirar), **falta** y · (todavía no terminó). Tocar un turno informado lo abre.
- **Incidencias que se repiten**, por tipo y por persona, en el rango elegido.
- **Filtros** por local, turno, persona (busca también dentro del checklist, no solo el Experto) y tipo de incidencia.
- **Alerta de informes faltantes**, deliberadamente conservadora: un turno se cuenta como faltante recién cuando **ya terminó** — el de la mañana a partir de las 16, el de la tarde al día siguiente. Marcar como faltante un turno en curso convierte la alerta en ruido, y una alerta ruidosa se ignora. Es la misma lección que dejó el contador de ítems en el módulo de costeo.

### Confidencialidad: cómo se hace cumplir de verdad

El requisito es que **solo Gerencia lea los informes**. Una contraseña escrita en la página no alcanza para eso, y conviene entender por qué: la clave se ve desde el navegador, y —más importante— la base de Firebase se lee **directo por HTTP** con la config que está en todas las páginas del sitio. Cualquiera con esa URL podía leer la rama entera sin pasar nunca por la pantalla de contraseña.

Por eso el acceso de Gerencia es una **cuenta real de Firebase Auth** y la restricción la aplica el **servidor**, con reglas de seguridad. La página ya está preparada; falta hacer los dos pasos en la consola de Firebase.

> **Orden importante.** Hacé los pasos 1 y 2 **antes** del 3. Si ponés las reglas primero, Gerencia queda afuera hasta que exista la cuenta.

#### Paso 1 — Habilitar el acceso por email y contraseña

1. [console.firebase.google.com](https://console.firebase.google.com/) → proyecto **pedidos-de-produccion-ee3cb**.
2. Menú izquierdo → **Authentication** → **Get started** (si es la primera vez).
3. Pestaña **Sign-in method** → **Email/Password** → **Habilitar** → **Guardar**.

#### Paso 2 — Crear la cuenta de Gerencia

1. Pestaña **Users** → **Add user**.
2. Email: `gerencia@candela-app.com` · Contraseña: la que elijas (que no sea una que uses en otro lado).
3. **Add user**.

Ese mail no recibe correo, es solo el identificador de la cuenta. Si preferís usar uno real —para poder recuperar la contraseña por mail—, creá la cuenta con ese y cambiá la constante `GERENCIA_EMAIL` arriba de todo del `<script>` de `informes/index.html`. Para cambiar la contraseña, alcanza con **Users → ⋮ → Reset password**.

#### Paso 3 — Las reglas de seguridad

**Realtime Database** → pestaña **Rules** → reemplazar todo por esto → **Publicar**:

```json
{
  "rules": {
    "costeo":       { ".read": true, ".write": true },
    "presupuestos": { ".read": true, ".write": true },
    "cronogramas":  { ".read": true, ".write": true },
    "vacaciones":   { ".read": true, ".write": true },

    "informes": {
      "envios": {
        ".read": "auth != null",
        "$turno": {
          "$ts": {
            ".write": "!data.exists() && newData.exists()",
            ".validate": "newData.hasChildren(['fecha','loc','turno','experto','enviadoEn'])"
          }
        }
      },
      "indice": {
        ".read": true,
        "$turno": {
          ".write": "newData.exists()",
          ".validate": "newData.hasChildren(['fecha','loc','turno','experto','enviadoEn'])"
        }
      }
    }
  }
}
```

**El detalle que hace que esto funcione o no:** en Realtime Database las reglas **cascadean hacia abajo y no se pueden revocar**. Si dejás un `".read": true` en la raíz, todo lo que cuelgue de ahí queda legible y las reglas de `informes` **no hacen absolutamente nada**. Por eso el permiso abierto se baja rama por rama en vez de estar arriba de todo. Si tenés reglas propias que no figuran acá, agregalas al mismo nivel que las otras cuatro — nunca en la raíz.

Qué queda garantizado por el servidor:

- **`informes/envios` solo lo lee una sesión autenticada.** Sin cuenta, la lectura se rechaza.
- **Los informes se escriben pero no se pisan ni se borran:** `!data.exists()` hace que cada envío sea de una sola escritura. Reemplazar un informe agrega una versión nueva; nadie puede borrar lo que otro escribió.
- **`informes/indice` es público a propósito**, pero guarda solo fecha, local, turno, quién lo mandó y cuándo — nada del contenido. Es lo que permite avisarle al Experto que ese turno ya informó sin dejar que lea lo que dice adentro.

#### Cómo verificar que quedó bien

1. Entrá a `informes/index.html` en una **ventana privada**. Debe pedir la contraseña y, con la correcta, mostrar los informes.
2. En esa misma ventana privada, abrí:
   `https://pedidos-de-produccion-ee3cb-default-rtdb.firebaseio.com/informes/envios.json`
   Tiene que devolver **`Permission denied`**. Si devuelve los informes, las reglas no se aplicaron (revisá que no haya quedado un `.read` en la raíz).
3. Probá `.../informes/indice.json`: eso **sí** tiene que responder, y solo con metadatos.

### Datos en Firebase

Mismo proyecto (`pedidos-de-produccion-ee3cb`), rama `informes/`:

- `informes/envios/{fecha}_{local}_{turno}/{ts}` — cada envío, **append-only**. El informe vigente de un turno es el envío con el timestamp más alto; los anteriores quedan como historial y se muestran en el detalle ("reemplazó a N versiones"). Nunca se sobrescribe nada: un informe es el registro de lo que pasó en un turno.
- `informes/indice/{fecha}_{local}_{turno}` — metadatos públicos (quién informó y cuándo), para el aviso de duplicado en la página de carga.

Este diseño append-only no es solo prolijidad: hace que la página de carga **nunca necesite leer un informe** para conservarlo al reemplazarlo — que es justo lo que las reglas le prohíben.

### Nombre del rol

El nombre oficial del rol es **"Experto Candela"** — así aparece en `cronogramas/index.html`, en el manual de carga y en Gerencia. (Hubo una sesión intermedia que probó unificarlo como "Experto del Turno" en los tres lugares; se revirtió a pedido explícito.) La clave de datos sigue siendo `state.expertos` — renombrarla habría roto lo ya cargado sin ganar nada.

---

### Adicionales / extras (no entran en el total)

Cosas que el cliente **puede** sumar y se cotizan para que sepa cuánto costarían —servicio de mozo, mantelería, una torta extra—, pero que no forman parte de lo presupuestado.

Van en su propia lista, en su propio bloque impreso al final del PDF, después del total y separados por una línea. La decisión de fondo: **`calcTotales` no los conoce**. No son ítems con una marca de "opcional" que haya que acordarse de excluir en cada cuenta — están en otra estructura, así que no hay forma de que se cuelen en el total por un olvido. En el formulario el total de adicionales se muestra en un renglón aparte con la aclaración de que no está incluido, y en el PDF el bloque lleva el aviso en el encabezado más un "si se suman todos: $X (aparte del total)".

El bloque impreso no se puede partir entre páginas (`break-inside: avoid`): si el título quedara en una hoja y los precios en la otra, se leería como si estuvieran incluidos.

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
├── index.html                — Página de inicio (links a los módulos)
├── costeo-proveedores/
│   └── index.html          — App de Costeo & Proveedores (HTML+CSS+JS autocontenido)
├── presupuestos/
│   └── index.html          — App de Presupuestos (HTML+CSS+JS autocontenido)
├── cronogramas/
│   └── index.html          — Turnos semanales (define quién es Experto Candela)
├── vacaciones/
│   ├── index.html          — Balance y calendario de vacaciones
│   └── pedido.html         — Formulario público de pedido
├── informes/
│   ├── carga.html          — Informe de turno: lo carga el Experto (sin clave)
│   └── index.html          — Informes de turno: lectura de Gerencia (clave propia)
├── netlify/
│   └── functions/
│       ├── extraer-factura.js       — Función serverless: escaneo de facturas por IA
│       ├── extraer-lista-precios.js — Función serverless: lectura de listas de precios por IA
│       └── consultar.js             — Función serverless: preguntas en lenguaje natural
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
