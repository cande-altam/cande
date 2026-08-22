// =============================================================
// extraer-factura.js — Netlify Function
// Recibe una foto de factura (base64) y usa la API de Claude
// (visión) para extraer proveedor, monto, fecha e ítems.
// Mantiene la API key en el servidor: nunca se expone al cliente.
// =============================================================

const BASE_PROMPT = `Sos un asistente que extrae datos de facturas de proveedores para un negocio gastronómico argentino (panadería/pastelería).
Analizá la imagen y devolvé SOLO un JSON válido, sin texto adicional y sin bloques de markdown, con esta forma exacta:
{
  "proveedor": string | null,
  "cuit": string | null,
  "fecha": "YYYY-MM-DD" | null,
  "numeroFactura": string | null,
  "montoTotal": number | null,
  "iva": number | null,
  "descuentos": number | null,
  "preciosIncluyenIva": boolean | null,
  "cantidadItemsDeclarada": number | null,
  "subtotal": number | null,
  "items": [
    { "nombre": string, "insumoId": string | null, "marca": string | null, "cantidad": number | null, "unidad": string | null, "contenidoPorUnidad": number | null, "unidadContenido": string | null, "precioUnitario": number | null, "importe": number | null }
  ],
  "calidadImagen": "buena" | "regular" | "mala",
  "camposIlegibles": [string]
}
Reglas:
- Si no podés leer un dato con confianza, poné null. No inventes valores.
- IMPORTANTE — para ahorrar espacio, OMITÍ del JSON los campos que sean null. Si no leíste la marca, simplemente no incluyas "marca". Los ítems son lo único que no se puede recortar.
- **SEPARADOR DECIMAL: NO LO ASUMAS, DEDUCILO DE LA ARITMÉTICA.** Los comprobantes argentinos usan indistintamente coma o punto como separador decimal, y a veces el mismo negocio recibe de los dos tipos. La única forma confiable de saberlo es la cuenta: **cantidad × precioUnitario tiene que dar el importe impreso de esa línea**. Probá las dos lecturas y quedate con la que cierra.
  Ejemplos reales, los dos correctos según el ticket: "4,660 x $ 8029,34 = $37.416,72" → la cantidad es 4,66 (coma decimal); "5.950 x $ 11191.40 = $66.588,86" → la cantidad es 5,95 (PUNTO decimal). Si en cualquiera de los dos se toma el separador como si fuera de miles, el resultado da decenas de millones: eso es la señal de que la lectura está mal.
  Devolvé SIEMPRE los números con punto decimal (4.66, 5.95, 8029.34).
- **DISPOSICIÓN EN VARIOS RENGLONES**: en los tickets de mayorista cada ítem ocupa DOS o TRES renglones — primero "cantidad x $ precio unitario" con el importe a la derecha, y DEBAJO la descripción del producto. A veces hay un tercer renglón con la cantidad de piezas ("1 H", "3 HORMA", "2 H"). Esos renglones son UN SOLO ítem: la descripción es la del renglón de abajo, y la cantidad/precio los de arriba. No los tomes como ítems separados ni pierdas la descripción.
- **PRODUCTOS POR PESO**: cuando la cantidad tiene decimales (4,660 / 10,460 / 6,000) el producto se vende POR KILO: "cantidad" es el peso en kg y "precioUnitario" es el precio por kg. En ese caso "contenidoPorUnidad" es 1 — el precio YA es por unidad de medida, no es un bulto. El renglón "3 HORMA" o "1 H" indica cuántas piezas son, no cambia el precio por kilo.
- **LÍNEAS DE DESCUENTO**: las líneas con importe NEGATIVO o que empiezan con "OFS", "DTO", "DESC", "BONIF", "AHORRO" son descuentos/ofertas, NO son ítems comprados. NO las incluyas en "items"; sumalas en "descuentos" como número positivo.
- **CUIDADO — "CLIENTE" NO ES EL PROVEEDOR**: muchos tickets muestran arriba los datos de QUIEN COMPRA (etiquetados "CLIENTE", "Sr./Sres.", "Razón social del cliente") junto a su CUIT y condición fiscal. Ese NO es el proveedor: es el negocio que está cargando la factura. El proveedor es quien EMITE el comprobante (suele estar en el encabezado del ticket, arriba de todo, o en el pie junto al CAE). Cuando el ticket muestra LOS DOS (arriba de todo el emisor con su CUIT e IIBB, y más abajo el bloque "CLIENTE"), el proveedor es SIEMPRE el de arriba — el que tiene el domicilio comercial y el "Inicio Act.". Si lo único que se ve es el bloque del CLIENTE, devolvé "proveedor": null y "cuit": null — es preferible que el usuario lo elija a crear un proveedor con el nombre del propio negocio.
- "montoTotal" es el TOTAL final del comprobante (el que se pagó), como número sin símbolos ni separadores de miles.
- "iva" es el monto de IVA discriminado (ej. la línea "IVA 21%"), en pesos, no un porcentaje. Si hay varias alícuotas, sumalas.
- "preciosIncluyenIva": mirá si los precios de las líneas ya tienen el IVA o no. Si el comprobante muestra SUBTOTAL + IVA = TOTAL, entonces los precios de las líneas son SIN IVA → false. Si el total coincide con la suma de los importes de las líneas, son con IVA → true. Si no podés determinarlo, null.
- "subtotal": el SUBTOTAL impreso (antes del IVA), si figura. Es el control de completitud más confiable que hay: **la suma de los importes de todas las líneas, menos los descuentos, tiene que dar el subtotal**. Antes de responder, hacé esa cuenta; si no cierra, te faltaron líneas o leíste mal un importe — revisá de nuevo.
- "cantidadItemsDeclarada": si el ticket trae un contador tipo "Cantidad de ítems: 40", copiá ese número tal cual, pero NO lo uses como control: en los tickets reales ese número no coincide con la cantidad de productos (uno con 15 productos declaraba 40). El control bueno es el del subtotal.
- "items" son las líneas de detalle (productos comprados). Si no hay detalle legible, devolvé un array vacío.
- "marca" de cada ítem: la marca comercial si figura en la línea (ej. "Levadura Leudex"). Un mismo insumo puede comprarse en varias marcas a distinto precio, así que no se puede perder.
- Para cada ítem: "cantidad" y "unidad" son los impresos; "importe" es el subtotal de esa línea. No confundas la columna de cantidad con la de código de producto — es el error más común. Si solo hay precio unitario e importe, inferí cantidad = importe / precioUnitario.
- "fecha" en formato ISO YYYY-MM-DD.
- "contenidoPorUnidad" / "unidadContenido": para productos vendidos por BULTO donde el precio de la línea es el del bulto entero y no el de la unidad de medida. Ejemplos: "Dulce de leche x 25 kg" → 25 / "kg"; "Gaseosa fardo x6" → 6 / "unidad". Si se vende suelto o por peso, poné 1. Si no podés determinarlo, omitilo — NO adivines.
- "calidadImagen": qué tan legible está la foto ("buena", "regular", "mala").
- "camposIlegibles": los campos que no pudiste leer con confianza. Array vacío si leíste todo. Sé honesto: es preferible declarar que no se leyó a inventar.`;

const CATALOG_INSTRUCTIONS = `

Además, tenés una lista de insumos YA CARGADOS en el sistema (id y nombre). Para cada ítem de la factura, fijate si corresponde a uno de esos insumos ya existentes, aunque el texto de la factura tenga mayúsculas, abreviaturas, marca o tamaño de envase distintos al nombre guardado (ejemplo: "LECHE ENT. SACHET X 1LT" es el mismo insumo que "Leche entera"). Si estás razonablemente seguro de la coincidencia, poné el "id" EXACTO de ese insumo en "insumoId" del ítem. Si el ítem no corresponde a ningún insumo de la lista (es nuevo), poné "insumoId": null — nunca inventes un id que no esté en la lista.
- "nombre" de cada ítem: si coincide con un insumo de la lista, copiá su nombre EXACTO tal como aparece en la lista; si es un insumo nuevo, un nombre corto y claro, sin marca ni tamaño de envase.

Para cada insumo de la lista te paso, cuando se conocen: su unidad de medida, el contenido por unidad que ya está configurado (cuántas unidades de medida trae cada unidad de compra) y el último precio conocido POR UNIDAD DE MEDIDA. Usalos como control de coherencia: si el precio unitario que leés en la factura es muy distinto del último conocido (por ejemplo 25 veces mayor), es casi seguro que el precio de la factura es por bulto y no por unidad de medida — en ese caso completá "contenidoPorUnidad" con el factor que corresponda en vez de forzar el precio.

Lista de insumos ya cargados (id → nombre · unidad · contenido por unidad · último precio conocido):
`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "ANTHROPIC_API_KEY no está configurada en Netlify (Site settings → Environment variables)." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body inválido." }) };
  }

  const { imageBase64, mediaType, insumosConocidos, pistas, modelo } = payload;
  if (!imageBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta la imagen." }) };
  }

  let prompt = BASE_PROMPT;
  // Segundo intento: el primero no pudo identificar la factura y el usuario contestó lo que sabía.
  // Con esos datos como ancla el modelo suele poder leer el resto (sabe qué proveedor buscar en el
  // encabezado, con qué CUIT contrastar, y no tiene que adivinar el número de comprobante).
  if (pistas && (pistas.proveedorNombre || pistas.cuit || pistas.numero)) {
    const partes = [];
    if (pistas.proveedorNombre) partes.push(`el proveedor es "${pistas.proveedorNombre}"`);
    if (pistas.cuit) partes.push(`su CUIT es ${pistas.cuit}`);
    if (pistas.numero) partes.push(`el N° de comprobante es ${pistas.numero}`);
    prompt += `\n\nIMPORTANTE — el usuario ya confirmó estos datos de la factura porque el primer intento de lectura falló: ${partes.join(", ")}. Tomalos como ciertos (devolvelos tal cual en los campos correspondientes) y concentrate en leer lo que falta: fecha, monto total, IVA y sobre todo el detalle de ítems con sus cantidades y precios. Si aun así no podés leer algo, dejalo en null y declaralo en "camposIlegibles".`;
  }
  if (Array.isArray(insumosConocidos) && insumosConocidos.length) {
    // Defensive cap so a very large catalog can't balloon the request indefinitely.
    const lista = insumosConocidos.slice(0, 600)
      .filter((it) => it && it.id && it.nombre)
      .map((it) => {
        const partes = [`${it.id} → ${it.nombre}`];
        if (it.unidad) partes.push(`unidad: ${it.unidad}`);
        if (it.contenidoPorUnidad) partes.push(`contenido por unidad: ${it.contenidoPorUnidad}`);
        if (it.ultimoPrecio) partes.push(`último precio conocido: ${it.ultimoPrecio}`);
        // Cómo lo escribieron facturas anteriores. Es la pista más fuerte que hay para matchear:
        // muestra el texto real que imprime el proveedor, no el nombre prolijo del catálogo.
        if (Array.isArray(it.alias) && it.alias.length) partes.push(`en facturas aparece como: ${it.alias.join(" / ")}`);
        return partes.join(" · ");
      })
      .join("\n");
    prompt += CATALOG_INSTRUCTIONS + lista;
  }

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // La restricción real de este escaneo NO es la capacidad del modelo sino el TIEMPO: la
        // función serverless corta a los pocos segundos, y con Sonnet hasta una imagen mínima se
        // pasaba (502 a los 6,5 s medido en producción). Haiku hace esta tarea —leer un ticket y
        // devolver JSON— muy por debajo de ese límite. Sonnet queda disponible como modo "preciso"
        // para las facturas difíciles, donde el usuario acepta esperar.
        model: modelo === "preciso" ? "claude-sonnet-5" : "claude-haiku-4-5",
        // Una factura de mayorista con 30 ítems necesita cerca de 1.700 tokens de salida; con el
        // techo anterior (1536) el JSON salía CORTADO y el escaneo fallaba entero. Es un techo, no
        // un objetivo: el modelo corta cuando termina, y se le pide omitir los campos nulos para
        // que el detalle largo entre holgado.
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
            { type: "text", text: prompt }
          ]
        }]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: `Error de la API de IA: ${errText}` }) };
    }

    const data = await resp.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return { statusCode: 502, body: JSON.stringify({ error: "La IA no devolvió un resultado reconocible." }) };
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      // Si se cortó por longitud, el JSON queda incompleto. Se avisa como tal para que el cliente
      // pueda reintentar leyendo la factura por partes en vez de mostrar un error genérico.
      const truncado = data.stop_reason === "max_tokens";
      return {
        statusCode: 502,
        body: JSON.stringify({
          truncado,
          error: truncado
            ? "La factura tiene demasiado detalle y la lectura quedó cortada. Se va a reintentar leyéndola por partes."
            : "No se pudo interpretar la respuesta de la IA."
        })
      };
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Error desconocido al escanear la factura." }) };
  }
};
