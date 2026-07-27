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
  "items": [
    { "nombre": string, "insumoId": string | null, "marca": string | null, "cantidad": number | null, "unidad": string | null, "contenidoPorUnidad": number | null, "unidadContenido": string | null, "precioUnitario": number | null, "importe": number | null }
  ],
  "calidadImagen": "buena" | "regular" | "mala",
  "camposIlegibles": [string]
}
Reglas:
- Si no podés leer un dato con confianza, poné null. No inventes valores.
- "proveedor" debe ser la RAZÓN SOCIAL del proveedor (el nombre legal/fiscal que figura en la factura, normalmente junto al CUIT o en el encabezado impositivo) — NO un nombre de fantasía, marca o logo comercial si son distintos de la razón social.
- "montoTotal" es el total final de la factura (con IVA si corresponde), como número sin símbolos de moneda ni separadores de miles (usá punto decimal).
- "iva" es el monto de IVA discriminado en la factura (suele figurar como "IVA 21%", "IVA 10.5%", o la suma de varias alícuotas de IVA si hay más de una) — un número en pesos, no un porcentaje. Si la factura es de un monotributista y no discrimina IVA, poné null. Si hay varias líneas de IVA a distintas alícuotas, sumalas en un solo número.
- "items" son las líneas de detalle de la factura (insumos comprados). Si no hay detalle de líneas legible, devolvé un array vacío.
- "marca" de cada ítem: la marca comercial del producto SI figura impresa en la línea de detalle (ej. "Levadura Leudex", "Levadura Duquesa") — un mismo insumo puede comprarse en varias marcas distintas al mismo o a distinto proveedor, y cada marca puede tener su propio precio, así que es importante no perderla. Si no hay marca legible o el ítem no es de ese tipo (ej. es un insumo genérico sin marca), poné null.
- Para cada ítem: "cantidad" y "unidad" son los que figuran impresos en la línea (ej. "5", "kg"); "importe" es el subtotal de esa línea (cantidad × precio unitario, tal como figura impreso, sin IVA a menos que la factura solo muestre precios con IVA incluido). Prestá especial atención a no confundir la columna de cantidad con la de código de producto o de precio — son la causa más común de error. Si la factura solo muestra precio unitario e importe pero no cantidad explícita, podés inferir "cantidad" = importe / precioUnitario; si solo muestra cantidad e importe, inferí "precioUnitario" = importe / cantidad. Si algún valor no cierra o no es legible, poné null en ese campo en vez de adivinar.
- "fecha" en formato ISO YYYY-MM-DD.
- "contenidoPorUnidad" / "unidadContenido": MUY IMPORTANTE. Muchos productos se venden por bulto/fardo/balde/caja, y el precio de la línea es el del BULTO, no el de la unidad de medida real. Ejemplos: "Dulce de leche Campo Quijano x 25 kg" → contenidoPorUnidad: 25, unidadContenido: "kg" (cada unidad comprada trae 25 kg); "Gaseosa 500ml fardo x6" → contenidoPorUnidad: 6, unidadContenido: "unidad"; "Aceite caja x 12 botellas" → 12 / "unidad". Buscá esta información en el texto del ítem (x25kg, x 6, fardo, caja, balde, pack, bidón). Si el ítem se vende suelto, sin bulto, poné contenidoPorUnidad: 1. Si no podés determinarlo con confianza, poné null — NO adivines.
- "calidadImagen": tu evaluación de qué tan legible está la foto ("buena" si se lee todo con claridad, "regular" si hay partes dudosas, "mala" si gran parte es ilegible).
- "camposIlegibles": lista de los nombres de los campos que NO pudiste leer con confianza y dejaste en null por eso (ej. ["numeroFactura", "cuit", "items[2].precioUnitario"]). Si pudiste leer todo con confianza, devolvé un array vacío. Sé honesto acá: es preferible declarar que no se leyó a inventar un valor.`;

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

  const { imageBase64, mediaType, insumosConocidos, pistas } = payload;
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
        model: "claude-sonnet-5",
        max_tokens: 1536,
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
      return { statusCode: 502, body: JSON.stringify({ error: "No se pudo interpretar la respuesta de la IA." }) };
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(parsed) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Error desconocido al escanear la factura." }) };
  }
};
