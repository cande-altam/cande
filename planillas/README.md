# Control de Stock Semanal — Candela Café & Patisserie

Libro de Excel para la prueba de **una semana** de control de stock de insumos y
producción, y para el cruce posterior contra facturas de compra y los reportes de Fudo.

## Archivos

| Archivo | Qué es |
|---|---|
| `Control_Stock_Semanal_Candela.xlsx` | El libro listo para usar e imprimir. |
| `generar_planillas.py` | Script que genera el libro desde el catálogo real de la app. |

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

## Estructura del libro (24 hojas)

**Preparación**
- `Instructivo` — cómo se usa, día por día, y cómo leer cada señal.
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
