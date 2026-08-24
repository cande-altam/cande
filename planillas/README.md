# Control de Stock — Candela Café & Patisserie

Planilla de **carga** en Google Sheets para medir dos semanas de consumo y producción.

| Archivo | Qué es |
|---|---|
| `planilla_candela.gs` | **El archivo a usar.** Apps Script que construye la planilla en Google Sheets. |
| `insumos_export_firebase.json` | Export real de `costeo/insumos` (213 registros). Fuente de los insumos. |
| `depurar_insumos.py` | Documenta cómo se depuró esa lista: fusiones, precios descartados, clasificación. |
| `verificar.js` | Corre el Apps Script contra un mock de `SpreadsheetApp`, sin necesidad de Google. |

## Cómo crear la planilla

1. Crear una hoja de cálculo **nueva y vacía** en Google Sheets.
2. **Extensiones → Apps Script**.
3. Borrar lo que haya y pegar todo `planilla_candela.gs`.
4. Guardar, elegir la función `crearPlanilla` y **Ejecutar**.
   La primera vez pide autorización: *Revisar permisos → elegir la cuenta →
   Configuración avanzada → Ir a (nombre del proyecto) → Permitir*.
5. Volver a la hoja: quedan las 17 pestañas listas.

Para rehacerla más adelante conservando el mismo link, ejecutar `recrearPlanilla`.
Pide confirmación, porque borra lo ya cargado.

## Qué mide

Dos semanas, de **martes a lunes**: **01/09 al 07/09** y **22/09 al 28/09**.

Con lo que se carga se calculan después, por fuera de la planilla:

- **Consumo real por insumo** = stock inicial + compras − stock final
- **Diferencia por producto** = elaborado − vendido − consumo interno − descarte

## Las 17 pestañas

**Referencia** — `Instrucciones`, `Config`, `Insumos`, `Productos`, `Listas` (oculta).

**Carga diaria** — `1 Stock` (los cuatro conteos), `2 Compras`, `3 Conteo diario`
(solo críticos), `4 Prod` × 6 áreas, `5 Descartes`.

**Al cerrar cada semana** — `6 Ventas Fudo`, `7 Consumos internos`.

## Los insumos

Salen del export real del módulo de costeo (213 registros), ya depurado:

- **9 productos fusionados** que estaban cargados dos o tres veces con distinta
  presentación o marca: Azúcar, Manteca, Mayonesa, Miel de abeja, Galletas chocolinas,
  Queso tybo, Queso muzzarella, Lentejas chocolate y Cerezas en lata.
- **8 precios descartados** por imposibles, para no arrastrar el error al valorizar:
  Manteca en pilón ($121.332/kg, el doble que el segundo más caro del catálogo), Sal,
  Romero, Tulipas, MiniBaguette, Ganache, Saquito de té y Azúcar en sobre. Esas celdas
  quedan vacías a propósito.
- **146 insumos de producción** que se cuentan, y **57 de referencia** —semielaborados
  propios (almíbares, cremas, masas, tostadas, panes) y reventa o cafetería (gaseosas,
  café, syrups, yogures)— que aparecen en gris en el maestro y no se cuentan.
- **37 marcados como críticos**: se cuentan todos los días. Son los de precio alto por
  kilo más los staples de alto consumo.

El export no trae información de área, así que 125 insumos quedan en `Depósito central`
y 21 con área asignada por coincidencia con el catálogo de la app. La columna `AMBITO`
es editable si algún insumo se guarda en otro lado.

## Convención de colores

- **Celda amarilla, letra azul** → la completa una persona. Es el único lugar donde se escribe.
- **Letra negra** → fórmula.
- **Gris e itálica** → insumo de referencia, no se cuenta.

## Verificar el script sin Google

```bash
cd planillas && node verificar.js
```

Ejecuta `crearPlanilla` y `recrearPlanilla` contra un mock de `SpreadsheetApp` y controla
rangos, dimensiones de `setValues`, filtros sobre celdas combinadas y el borrado de pestañas.
