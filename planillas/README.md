# Control de Stock — Candela Café & Patisserie

Control de stock de **insumos y productos** en los 3 locales (Cuadra de Producción,
SLA 5.0, San Luis), durante dos semanas.

| Archivo | Qué es |
|---|---|
| `control_stock_v2.gs` | **El archivo a usar.** Apps Script que construye las 20 pestañas en Google Sheets. |
| `insumos_export_firebase.json` | Export real de `costeo/insumos` (213 registros). Fuente de los insumos. |
| `clasificar_insumos.py` | Reproduce `insumos_procesados.json`: fusiones, precios descartados, ambitos, críticos. |
| `insumos_procesados.json` | Resultado de esa clasificación (227 filas) — es lo que está embebido en el `.gs`. |
| `verificar.js` | Corre el Apps Script contra un mock de `SpreadsheetApp`, sin necesidad de Google. |

## Cómo crear (o rehacer) la planilla

**No pude subir el archivo directo a Drive.** El libro completo pesa ~145 KB; mi
límite real de transmisión de un archivo binario a través de esta sesión es de
~17 KB (lo comprobé con una prueba: el visor de archivos trunca a los ~22.500
caracteres de base64). Apps Script es texto, así que no tiene ese problema — se
transmite completo y se ejecuta dentro de la hoja de Google Sheets que ya tenés.

1. Abrir la hoja de cálculo (puede ser una existente: el script borra su
   contenido actual y lo reemplaza).
2. **Extensiones → Apps Script**. *(No funciona desde la app de Drive/Sheets del
   celular — el editor de Apps Script solo corre en navegador de escritorio.)*
3. Borrar lo que haya en el editor y pegar todo `control_stock_v2.gs`.
4. Guardar, elegir la función `construirTodo` y **Ejecutar**.
   Pide confirmación (borra el contenido actual) y, la primera vez, autorización:
   *Revisar permisos → elegir la cuenta → Configuración avanzada → Ir a
   (nombre del proyecto) → Permitir*.
5. Volver a la hoja: quedan las 20 pestañas armadas.

Se puede volver a ejecutar `construirTodo` en cualquier momento para rehacer todo
desde cero (por ejemplo, si se actualiza el catálogo de insumos).

## Qué mide

Dos semanas, de **martes a lunes**: **01/09–07/09** y **22/09–28/09**.

Información que se recopila:

- **Cantidades iniciales y finales de cada insumo** — conteo físico, 4 veces
  (inicio/cierre de cada semana). Todos los insumos, no solo los críticos.
- **Compras de insumos críticos** — únicamente desde las facturas de compra,
  cargadas después de la semana. No hay conteo físico diario.
- **Cantidades elaboradas de cada producto** — planilla diaria por ambito
  (maestro de área, barista, jefe/ayudante de cocina), con descarte.
- **Datos de Fudo** — stock cargado (insumos y productos) y ventas por día.

Con eso, el análisis (que se hace aparte de este libro) calcula:

- **Consumo real por insumo** = stock inicial + compras − stock final
- **Diferencia por producto** = elaborado − vendido − consumo interno − descarte

## Los 3 locales

- **Cuadra de Producción** — 5 áreas (Panadería, Pastelería, Especialidades,
  Facturería, Sandwiches), cada una con su maestro de área.
- **SLA 5.0** — local de venta con **barra** (bebidas con café, chocolatada,
  submarino, té). No elabora productos de panadería/pastelería.
- **San Luis** — local de venta con barra igual que SLA 5.0, y además
  **Cocina San Luis** (jefe de cocina + ayudante), que prepara Frappuccino,
  licuados, smoothies, jugos exprimidos y limonadas.

## Las 20 pestañas

**Referencia** — `Instrucciones`, `Config`, `Insumos`, `Productos`, `Listas` (oculta).

**Carga diaria** — `1 Stock` (4 conteos), `2 Compras` (solo críticos, desde
facturas), `3 Prod` × 8 ámbitos (5 áreas + Barra SLA 5.0 + Barra San Luis +
Cocina San Luis, grilla de 14 días), `4 Descartes`.

**Al cerrar cada semana** (desde Fudo) — `5 Ventas Fudo` (14 días por producto),
`6 Fudo Stock Insumos`, `7 Fudo Stock Productos`, `8 Consumos internos`.

## Los insumos

227 filas (203 insumos distintos; los de barra se cuentan por duplicado en
los 2 locales de venta), del export real de costeo, ya depurado:

- **9 productos fusionados** que estaban cargados 2-3 veces con distinta
  presentación o marca (Azúcar, Manteca, Mayonesa, Miel de abeja, Galletas
  chocolinas, Queso tybo, Queso muzzarella, Lentejas chocolate, Cerezas en lata).
- **8 precios descartados** por imposibles (Manteca en pilón a $121.332/kg —
  el doble que el segundo más caro de todo el catálogo — y otros 7). Esas
  celdas quedan vacías a propósito.
- **43 insumos críticos** (únicos): staples de alto consumo (harinas, azúcar,
  manteca, margarinas, grasa, levadura, huevos, crema, leche, dulce de leche,
  café) más los de precio alto por kilo.
- **9 ámbitos**: Depósito central + las 5 áreas de la cuadra + Barra SLA 5.0 +
  Barra San Luis + Cocina San Luis.

### Límite conocido — revisar antes de arrancar

El export no trae información de área. Los insumos de **barra** (café, leche,
syrups) y de **Cocina San Luis** (fruta, helado) se asignaron por **palabra
clave**: hay que confirmarlos contra lo real.

Más importante: los perecederos de la **cuadra** (manteca, crema, quesos,
fruta) se intentaron matchear contra el catálogo viejo de la app para
asignarles su área específica (Panadería, Pastelería, etc.), pero **ningún
nombre coincidió de forma exacta** — así que los 164 insumos de "Depósito
central" incluyen todo lo que debería contarse por área de la cuadra. La
columna `AMBITO` de la pestaña `Insumos` es editable: si hace falta ese
nivel de detalle, hay que reasignarlos a mano.

## Convención de colores

- **Celda amarilla, letra azul** → la completa una persona. Es el único lugar
  donde se escribe.
- **Letra negra** → fórmula.
- **Letra verde** → trae el dato de otra hoja.

## Verificar el script sin Google

```bash
cd planillas && node verificar.js
```

Corre `construirTodo()` contra un mock de `SpreadsheetApp` dos veces seguidas
(debe reconstruir limpio ambas veces) y una vez cancelando (no debe tocar
nada). Controla dimensiones de `setValues`/`setFormulas`, filtros sobre
celdas combinadas, y el borrado completo de pestañas previas.
