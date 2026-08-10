// =============================================================
// extraer-lista-precios.js — Netlify Function
// Recibe la lista de precios que manda un proveedor —como foto
// (base64) o como texto pegado (WhatsApp, mail, PDF copiado)— y
// usa la API de Claude para extraer cada línea con su precio,
// matcheándola contra el catálogo de insumos y productos.
// Mantiene la API key en el servidor: nunca se expone al cliente.
// =============================================================

const BASE_PROMPT = `Sos un asistente que interpreta LISTAS DE PRECIOS que los proveedores le mandan a un negocio gastronómico argentino (panadería/pastelería/cafetería).
Una lista de precios NO es una factura: no hay una compra, no hay cantidades compradas ni total a pagar. Es un catálogo de qué vende ese proveedor y a qué precio.
Devolvé SOLO un JSON válido, sin texto adicional y sin bloques de markdown, con esta forma exacta:
{
  "proveedor": string | null,
  "cuit": string | null,
  "fecha": "YYYY-MM-DD" | null,
  "items": [
    { "nombre": string, "insumoId": string | null, "productoId": string | null, "marca": string | null, "codigo": string | null, "unidad": string | null, "contenidoPorUnidad": number | null, "unidadContenido": string | null, "precio": number | null, "precioIncluyeIva": boolean | null }
  ],
  "calidadImagen": "buena" | "regular" | "mala",
  "camposIlegibles": [string],
  "notas": string | null
}
Reglas:
- Si no podés leer un dato con confianza, poné null. No inventes valores.
- "proveedor" es la razón social o el nombre del proveedor que emite la lista, si figura. Si la lista no lo dice (ej. es un mensaje de WhatsApp suelto), poné null.
- "fecha" es la fecha de vigencia de la lista en formato ISO YYYY-MM-DD, si figura ("Lista vigente desde...", "Precios al 12/05/2026"). Si no figura, null.
- "items": UNA ENTRADA POR CADA LÍNEA DE LA LISTA. Es lo más importante de la extracción — no resumas ni agrupes, no saltees líneas. Si la lista tiene 80 productos, devolvé 80 items.
- "precio": el precio de venta por unidad tal como figura en la lista, como número sin símbolos ni separadores de miles (punto decimal). Si la lista muestra varios precios por línea (ej. precio de lista y precio con descuento, o por menor y por mayor), tomá el que corresponda a la compra habitual del negocio (el precio mayorista / el efectivamente vigente) y aclaralo en "notas".
- "precioIncluyeIva": true si la lista aclara que los precios son finales/con IVA incluido, false si aclara que son netos/sin IVA, null si no lo aclara.
- "marca": la marca comercial del producto si figura (ej. "Leudex", "Duquesa", "Alpino", "Lodiser"). Un mismo insumo puede venderse en varias marcas a distinto precio y ese detalle no se puede perder. Si la línea no tiene marca, null.
- "codigo": el código de artículo del proveedor, si la lista lo trae.
- "contenidoPorUnidad" / "unidadContenido": MUY IMPORTANTE. Muchas líneas están cotizadas por bulto/fardo/balde/caja y no por unidad de medida. Ejemplos: "Dulce de leche x 25 kg" → contenidoPorUnidad: 25, unidadContenido: "kg"; "Gaseosa 500ml fardo x6" → 6 / "unidad"; "Aceite caja x 12" → 12 / "unidad". Buscalo en el texto de la línea (x25kg, x 6, fardo, caja, balde, pack, bidón). Si se vende suelto, poné 1. Si no podés determinarlo con confianza, null — NO adivines.
- "calidadImagen": tu evaluación de qué tan legible está la imagen ("buena", "regular", "mala"). Si te pasaron texto en vez de una imagen, poné "buena".
- "camposIlegibles": nombres de los campos que no pudiste leer con confianza y dejaste en null por eso (ej. ["fecha", "items[7].precio"]). Array vacío si leíste todo con confianza. Sé honesto: es preferible declarar que no se leyó a inventar.
- "notas": una aclaración breve solo si hay algo que el usuario necesita saber para interpretar bien la lista (ej. "los precios figuran sin IVA", "hay dos columnas de precio: se tomó la mayorista", "la lista sigue en otra página"). Si no hay nada que aclarar, null.`;

const CATALOG_INSTRUCTIONS = `

Además, tenés el catálogo YA CARGADO en el sistema. Para cada línea de la lista de precios, fijate si corresponde a algo que ya existe, aunque el texto del proveedor use mayúsculas, abreviaturas, códigos, marca o tamaño de envase distintos al nombre guardado (ejemplo: "LECHE ENT. SACHET X 1LT" es el mismo insumo que "Leche entera").
- Si corresponde a un INSUMO ya cargado, poné su id EXACTO en "insumoId" y dejá "productoId" en null.
- Si corresponde a un PRODUCTO de reventa ya cargado, poné su id EXACTO en "productoId" y dejá "insumoId" en null.
- Si no corresponde a nada del catálogo, poné ambos en null — nunca inventes un id que no esté en las listas de abajo.
- "nombre": si matcheó, copiá el nombre EXACTO del catálogo; si es nuevo, un nombre corto y claro, sin marca ni tamaño de envase.
- No fuerces matches dudosos: "Baño de chocolate semiamargo" y "Baño de chocolate blanco" son cosas DISTINTAS aunque se parezcan, igual que "Leche entera" y "Leche descremada". Ante la duda, dejá el id en null y que lo resuelva el usuario.

De cada insumo te paso, cuando se conocen, su unidad de medida, el contenido por unidad ya configurado y el último precio conocido POR UNIDAD DE MEDIDA. Usalos como control de coherencia: si el precio de la lista es muy distinto del último conocido (por ejemplo 25 veces mayor), es casi seguro que está cotizado por bulto — completá "contenidoPorUnidad" con el factor que corresponda en vez de forzar el precio.

Insumos ya cargados (id → nombre · unidad · contenido por unidad · último precio conocido):
`;

const PRODUCTOS_INSTRUCTIONS = `

Productos de reventa ya cargados (id → nombre · costo actual):
`;

function formatearInsumos(insumosConocidos) {
  return insumosConocidos.slice(0, 600)
    .filter((it) => it && it.id && it.nombre)
    .map((it) => {
      const partes = [`${it.id} → ${it.nombre}`];
      if (it.unidad) partes.push(`unidad: ${it.unidad}`);
      if (it.contenidoPorUnidad) partes.push(`contenido por unidad: ${it.contenidoPorUnidad}`);
      if (it.ultimoPrecio) partes.push(`último precio conocido: ${it.ultimoPrecio}`);
      return partes.join(" · ");
    })
    .join("\n");
}

function formatearProductos(productosConocidos) {
  return productosConocidos.slice(0, 400)
    .filter((it) => it && it.id && it.nombre)
    .map((it) => `${it.id} → ${it.nombre}${it.costo ? ` · costo actual: ${it.costo}` : ""}`)
    .join("\n");
}

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

  const { imageBase64, mediaType, texto, insumosConocidos, productosConocidos, proveedorNombre, modelo } = payload;
  const textoLimpio = typeof texto === "string" ? texto.trim() : "";
  if (!imageBase64 && !textoLimpio) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta la lista: mandá una foto o pegá el texto." }) };
  }

  let prompt = BASE_PROMPT;
  if (proveedorNombre) {
    prompt += `\n\nEl usuario ya indicó que esta lista es del proveedor "${proveedorNombre}". Usalo como contexto; igual devolvé en "proveedor" lo que figure impreso en la lista (o null si no figura).`;
  }
  if (Array.isArray(insumosConocidos) && insumosConocidos.length) {
    prompt += CATALOG_INSTRUCTIONS + formatearInsumos(insumosConocidos);
  }
  if (Array.isArray(productosConocidos) && productosConocidos.length) {
    prompt += PRODUCTOS_INSTRUCTIONS + formatearProductos(productosConocidos);
  }
  if (textoLimpio) {
    // Cap defensivo: una lista pegada muy larga no puede inflar el request sin límite.
    prompt += `\n\nEsta es la lista de precios, en texto:\n---\n${textoLimpio.slice(0, 60000)}\n---`;
  }

  const content = [];
  if (imageBase64) {
    content.push({ type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } });
  }
  content.push({ type: "text", text: prompt });

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        // El techo de salida está atado al tiempo: generar 16.000 tokens tarda más de lo que la
        // función serverless puede esperar antes de cortar, así que una lista larga SIEMPRE daba
        // "tiempo de espera agotado". El cliente ahora manda la lista por partes (ver
        // leerListaPrecios), y cada parte entra cómoda en este techo más chico.
        // Mismo criterio que el escaneo de facturas: el límite es el tiempo de la función, no la
        // capacidad del modelo. Haiku entra holgado; Sonnet queda para el modo "preciso".
        model: modelo === "preciso" ? "claude-sonnet-5" : "claude-haiku-4-5",
        max_tokens: 4000,
        messages: [{ role: "user", content }]
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
      // Con listas muy largas el corte por max_tokens deja el JSON incompleto. Se avisa con un
      // mensaje accionable en vez de un error genérico: la lista se puede cargar por partes.
      const truncado = data.stop_reason === "max_tokens";
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: truncado
            ? "La lista es muy larga y la respuesta quedó cortada. Probá cargarla por partes (por ejemplo, una foto o un bloque de texto por página)."
            : "No se pudo interpretar la respuesta de la IA."
        })
      };
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Error desconocido al leer la lista de precios." }) };
  }
};
