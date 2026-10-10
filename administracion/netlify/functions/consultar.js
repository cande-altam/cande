// =============================================================
// consultar.js — Netlify Function
// Recibe una pregunta en lenguaje natural + un resumen de los datos
// de compras (insumos, facturas, proveedores) y usa la API de Claude
// para responderla, basándose únicamente en esos datos.
// Mantiene la API key en el servidor: nunca se expone al cliente.
// =============================================================

const BASE_PROMPT = `Sos un asistente que responde preguntas sobre las compras de un negocio gastronómico argentino (panadería/pastelería), usando ÚNICAMENTE los datos en JSON que te paso abajo — no inventes ni asumas datos que no estén ahí.
Respondé en español, de forma clara, breve y directa. Cuando la respuesta involucre una fecha, precio, proveedor o monto, citalo concretamente (ej. "El 12/03/2026, a Distribuidora Sur, a $1.200 la unidad"). Si la pregunta pide "la última vez" o algo similar, fijate bien en las fechas para identificar el evento más reciente.
Si los datos no alcanzan para responder con certeza, decilo explícitamente en vez de adivinar o inventar.
Distinguí siempre entre COMPRAS y PRECIOS DE LISTA: "historialCompras" y "facturas" son compras que efectivamente se hicieron; "preciosDeListaSinComprar" y "listasPrecios" son cotizaciones que mandó el proveedor pero que todavía no se compraron. Una pregunta del tipo "¿cuándo compramos X por última vez?" o "¿cuánto le compramos a tal proveedor?" se responde solo con compras. Si además hay un precio de lista relevante (por ejemplo, es más barato que lo que se viene pagando), podés mencionarlo aparte y aclarando que es una cotización, no una compra.`;

// Tope defensivo: evita mandar un contexto desmedido a la API si el catálogo creciera mucho.
const MAX_CONTEXTO_CHARS = 700000;

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

  const { pregunta, contexto } = payload;
  if (!pregunta || typeof pregunta !== "string" || !pregunta.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Falta la pregunta." }) };
  }

  let contextoJson = JSON.stringify(contexto || {});
  if (contextoJson.length > MAX_CONTEXTO_CHARS) {
    return { statusCode: 413, body: JSON.stringify({ error: "Hay demasiados datos cargados para consultar de una vez. Probá una pregunta más acotada (ej. con un rango de fechas o un proveedor puntual)." }) };
  }

  const prompt = `${BASE_PROMPT}\n\nDatos disponibles (JSON):\n${contextoJson}\n\nPregunta: ${pregunta.trim()}`;

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
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: `Error de la API de IA: ${errText}` }) };
    }

    const data = await resp.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const respuesta = textBlock ? textBlock.text.trim() : "";
    if (!respuesta) {
      return { statusCode: 502, body: JSON.stringify({ error: "La IA no devolvió una respuesta reconocible." }) };
    }

    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ respuesta }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Error desconocido al consultar." }) };
  }
};
