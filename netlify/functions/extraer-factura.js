// =============================================================
// extraer-factura.js — Netlify Function
// Recibe una foto de factura (base64) y usa la API de Claude
// (visión) para extraer proveedor, monto, fecha e ítems.
// Mantiene la API key en el servidor: nunca se expone al cliente.
// =============================================================

const EXTRACTION_PROMPT = `Sos un asistente que extrae datos de facturas de proveedores para un negocio gastronómico argentino (panadería/pastelería).
Analizá la imagen y devolvé SOLO un JSON válido, sin texto adicional y sin bloques de markdown, con esta forma exacta:
{
  "proveedor": string | null,
  "cuit": string | null,
  "fecha": "YYYY-MM-DD" | null,
  "numeroFactura": string | null,
  "montoTotal": number | null,
  "items": [
    { "nombre": string, "cantidad": number | null, "unidad": string | null, "precioUnitario": number | null }
  ]
}
Reglas:
- Si no podés leer un dato con confianza, poné null. No inventes valores.
- "montoTotal" es el total final de la factura (con IVA si corresponde), como número sin símbolos de moneda ni separadores de miles (usá punto decimal).
- "items" son las líneas de detalle de la factura (insumos comprados). Si no hay detalle de líneas legible, devolvé un array vacío.
- "fecha" en formato ISO YYYY-MM-DD.`;

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

  const { imageBase64, mediaType } = payload;
  if (!imageBase64) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta la imagen." }) };
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
        max_tokens: 1024,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
            { type: "text", text: EXTRACTION_PROMPT }
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
