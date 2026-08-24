# Control de Stock Semanal — Candela Café & Patisserie

Libro de Excel para la prueba de **una semana** de control de stock de insumos y
producción, y para el cruce posterior contra facturas de compra y los reportes de Fudo.

## Archivos

| Archivo | Qué es |
|---|---|
| `crear_en_sheets.gs` | **Apps Script que construye la planilla en Google Sheets.** Es el camino principal. |
| `clasificar_insumos.py` | Unifica las variantes de nombre y clasifica cada insumo como central o por área. |
| `verificar_apps_script.js` | Corre el Apps Script contra un mock de `SpreadsheetApp` para validarlo sin Google. |
| `Control_Stock_Semanal_Candela.xlsx` | ⚠️ **DESACTUALIZADO.** Quedó con la lista sin deduplicar, semana de lunes a domingo y una sola semana. No usar sin regenerarlo. |
| `generar_planillas.py` | Genera el `.xlsx` (también desactualizado). |

## Crear la planilla en Google Sheets

1. Crear una hoja de cálculo **nueva y vacía** en Google Sheets.
2. **Extensiones → Apps Script**.
3. Borrar lo que haya y pegar todo `crear_en_sheets.gs`.
4. Guardar, elegir la función `crearPlanilla` y **Ejecutar**.
   La primera vez pide autorización: *Revisar permisos → elegir la cuenta →
   Configuración avanzada → Ir a (nombre del proyecto) → Permitir*.
5. Volver a la hoja de cálculo: quedan las 19 pestañas creadas.

El script se niega a ejecutarse si la hoja ya tiene pestañas de la planilla, para no
pisar datos cargados. Si hay que rehacerla, correrlo en una hoja nueva.

> Esa planilla es **solo de carga**: no lleva hojas de análisis, porque la comparación
> se hace aparte sobre estos datos.

## Alcance de la medición

Dos semanas, de **martes a lunes**: del **01/09 al 07/09** y del **22/09 al 28/09**.

Los dos resultados que se buscan:

- **Consumo real por insumo** = stock inicial + compras − stock final.
- **Diferencia por producto** = elaborado − vendido − consumo interno − descarte.

## Deduplicación de insumos

La lista pasó de 159 filas a **134** (111 insumos distintos). Dos cambios:

1. **Variantes de escritura unificadas** — `Frutilla` / `Frutillas` / `Frutilla x kg` → `Frutilla`;
   `Tomates` / `Tomate x kg` → `Tomate`; y así con arándanos, kiwi, palta, ciruela, banana,
   jengibre, rúcula y tomate cherry. **No** se fusionaron `Harina 000` con `Harina 0000`,
   `Durazno` con `Durazno al natural`, ni `Albahaca` con `Albahaca hidropónica`: son productos
   distintos.
2. **Alcance por insumo** — los secos de depósito (harina, azúcar, huevos, grasa, chocolate)
   se cuentan **una sola vez**; los perecederos que cada área guarda en su heladera (manteca,
   crema, quesos, fiambres, fruta) se cuentan **por área**. Así Azúcar deja de aparecer 4 veces
   y Manteca 3. Los críticos bajaron de 62 a **51**.

La columna `ALCANCE` de la pestaña `Insumos` es editable: si un insumo está clasificado mal,
se corrige ahí.

## Regenerar el libro

El catálogo de áreas, productos e insumos se extrae de `index.html`
(`AREAS`, `PRODUCTOS_DEFAULT`, `INSUMOS_PRODUCCION`), así que si el catálogo cambia
se puede volver a generar el libro sin tipear nada a mano:

```bash
pip install openpyxl
cd planillas
python3 generar_planillas.py            # lee ../index.html y escribe el .xlsx
```

> Regenerar **pisa** el archivo `.xlsx`. Si ya hay datos cargados de una semana,
> guardar una copia antes.

## Al abrirlo por primera vez

El libro se entrega con las fórmulas escritas pero **sin valores en caché**: se calculan
solos al abrirlo en Excel, LibreOffice o Google Sheets. Un visor rápido (la vista previa
de Drive, Quick Look, el adjunto de WhatsApp) puede mostrar celdas en blanco donde hay
fórmulas — hay que abrirlo con una planilla de cálculo de verdad.

## Estructura del libro (25 hojas)

**Preparación**
- `Instructivo` — cómo se usa, día por día, y cómo leer cada señal.
- `Guia Sheets` — cómo pasarlo a Google Sheets, qué ajustar al imprimir y cómo proteger las fórmulas.
- `Config` — fecha de la semana, responsables por área, motivos de descarte, límites de tolerancia.
- `Insumos` / `Productos` — maestros traídos del catálogo (159 insumos, 141 productos).

**Registro en el piso (imprimibles)**
- `1 Inv Inicial` — conteo del lunes, todos los insumos, bultos + parcial.
- `2 Ingresos` — mercadería que entra durante la semana.
- `3 Conteo Diario` — solo insumos críticos, un bloque por día.
- `4 Prod <Área>` — producción diaria por área: elaborado y descarte por producto (6 hojas).
- `5 Descartes` — detalle de cada descarte con su motivo.
- `6 Inv Final` — conteo del domingo.

**Carga posterior**
- `7 Facturas` — facturas de compra de la semana.
- `8 Fudo Ventas` / `8 Fudo Stock` / `8 Fudo Consumos` — exports de Fudo con mapeo a los nombres de Candela.

**Análisis**
- `A Consumo Insumos` — consumo real = inicial + ingresos − final, contra facturas y contra Fudo.
- `B Concil Productos` — elaborado − vendido − consumo interno − descarte = diferencia sin explicar.
- `C Consumo Diario` — consumo día por día de los críticos, para ubicar el día del desvío.
- `Tablero` — estado de carga, resumen, top de desvíos y descartes por motivo y por área.

## Convención de colores

- **Celda amarilla, letra azul** → la completa una persona. Es el único lugar donde se escribe.
- **Letra negra** → fórmula.
- **Letra verde** → trae el dato de otra hoja.
- **Fondo rojo claro** → alerta: el desvío supera la tolerancia definida en `Config`.

## Usarlo en Google Sheets

El libro funciona en Google Sheets: las 21 funciones que usa son todas compatibles, y los
desplegables, el formato condicional y los filtros sobreviven a la importación. **Lo único
que Sheets no importa es la configuración de impresión** (áreas de impresión, repetición de
encabezados, orientación); hay que fijarla una vez al imprimir cada planilla.

Los pasos y los ajustes concretos están en la hoja `Guia Sheets` del propio libro.

## Límites del método

- **No se lleva stock de producto terminado.** La diferencia de la hoja `B Concil Productos`
  incluye lo que quedó en exhibición al cierre del domingo: se lee como tendencia y por
  casos grandes, no como un número exacto por producto.
- **Una semana no distingue una causa estable de una casualidad.** Sirve para señalar
  dónde mirar, no para concluir.
- **El resultado depende del conteo.** Un inventario inicial hecho "a ojo" produce
  números prolijos y falsos.
- **Cocina San Luis** no tiene productos en el catálogo de la app: su planilla de
  producción viene en blanco para escribirlos a mano.
