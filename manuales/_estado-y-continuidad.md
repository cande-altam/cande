# Estado del proyecto y cómo continuarlo

**Manuales de Procedimientos — Candela Café & Patisserie**
*Actualizado: septiembre 2026*

> Este documento existe para que **cualquier sesión nueva pueda retomar el trabajo sin
> volver a preguntar lo que ya se preguntó**. No es un manual: es el mapa del proyecto.

---

## El negocio

| | |
|---|---|
| **Nombre** | **Candela Café & Patisserie** |
| **Rubro** | Panadería y cafetería de especialidad |
| **Ciudad** | Salta, Argentina |
| **Locales de venta** | **SLA 5.0** y **San Luis** |
| **Local de producción** | **Cuadra de producción** |

> ### Regla de marca, sin excepciones.
> **El único nombre que se puede usar para identificar al negocio es "Candela Café &
> Patisserie".** Documentos viejos dicen *Candecafé* o *Panadería Candela*: son marcas
> anteriores que se fusionaron. **No se usan más.**

---

## Las tres reglas de trabajo del proyecto

### 1. Drive es la versión vigente

El documento de Google Drive es la **fuente de verdad**. Los archivos de este
repositorio son **material de trabajo**: se escriben acá y se pegan allá.

**Cuando haya diferencia entre el repo y Drive, gana Drive.** El `README.md` del repo
lleva un aviso que dice exactamente esto.

### 2. La estética del documento de Drive

No se inventa. Se extrajo **exportando el documento de Drive como HTML y midiendo lo
que usa**.

| | |
|---|---|
| **Tipografía** | Calibri en todo |
| **Cuerpo** | 11 pt, negro, interlineado 1.45 |
| **Encabezados** | H1 20 pt · H2 14 pt · H3 12 pt · H4 11 pt — todos negrita y negros |
| **Tablas** | Encabezado con fondo `#e5e1cc`, bordes 1 pt `#dedad8` |
| **Cuadros destacados** | Solo fondo de color, **sin barra lateral** |
| **Checklists** | Párrafos con ☐, **sin recuadro** |
| **Emojis** | **Se eliminan todos** |

**La herramienta está en `herramientas/md-a-googledocs.py`.** Convierte el Markdown a
HTML listo para pegar. Se abre el HTML en el navegador, `Ctrl+A`, `Ctrl+C`, y se pega
en el documento de Drive.

```python
import sys; sys.path.insert(0, 'herramientas')
from md_a_googledocs import documento
html = documento('Título', [('Nombre del manual', open('manuales/venta/cocina.md').read())])
```

### 3. Cómo se escriben los manuales

Están escritos **para la persona que ocupa el puesto**, no para quien lo supervisa.

- **Regla antes que explicación.** *"Leudar no es reponer: es prever"* antes que un
  párrafo sobre la importancia de la previsión.
- **Se escribe para el día en que falta el que sabía.** Si algo parece obvio, se
  escribe igual.
- **Lo que no se sabe se marca como pendiente**, no se inventa. Cada manual termina
  con su lista de *Pendientes de definición*.
- **Los checklists se mantienen cortos.** Ver "El problema de los 366 ítems".

---

## Dónde está cada cosa

```
manuales/
  README.md                    indice, con el aviso de que Drive es lo vigente
  _estado-y-continuidad.md     este documento
  _plantilla.md
  limpieza.md
  comunes/                     aplican a todas las areas
  venta/                       locales de venta
  produccion/                  cuadra de produccion y compras
herramientas/
  md-a-googledocs.py           conversor a la estetica de Drive
```

| Carpeta | Manuales |
|---|---|
| **comunes/** | atención y reclamos · código de ética · emergencias y seguridad · herramientas digitales · higiene y presentación · jornada y presentismo · mercadería para cambio · organigrama · pedidos y pagos a proveedores · vajilla · vehículo de transporte |
| **venta/** | baristas · cajeros · **cocina** · experto del turno · vendedores y mozos |
| **produccion/** | ayudante de cocina · bases · compras · especialidades · factureria · jefe de cocina · maestro de área · panadería · pastelería · sandwiches |

**Rama de trabajo:** `claude/manuales-procedimientos-areas-fhxu13`

---

## Decisiones ya tomadas

No hace falta volver a preguntarlas.

### Estructura

| | |
|---|---|
| **Organigrama** | Dirección (el dueño) → Gerencia (Cande) → Administración · Compras · Locales de venta · Cocina de locales · Cuadra de producción. Limpieza atraviesa los tres locales |
| **Experto del Turno** | **Reemplazó a "Encargado de Local".** No es un nivel del organigrama: es un rol dentro del turno, rota, y lo elige Gerencia por performance. Cobra bono extra |
| **Barra** | **No es un puesto**: es el espacio físico de trabajo del barista, como el mostrador del vendedor o la cocina del cocinero |
| **Bachero** | **No es un rol aparte**: es el ayudante de cocina |

### Reparto de la carta

| Barra | Cocina | Mostrador |
|---|---|---|
| Todo lo que lleva café, frío o caliente · chocolatadas · submarinos · infusiones | Todos los combos · elaborados · sanguchazos · licuados, smoothies, jugos exprimidos, limonadas · **Frappuccino** | Gaseosa · agua · budines, donas, alfajores, cookies · porciones y tartas |

> **Si lleva café es de barra; si no lleva café y hay que prepararla es de cocina; si
> hay que calentarlo va por comanda.** El Frappuccino es la única excepción.

### Cocina

| | **San Luis** | **SLA 5.0** |
|---|---|---|
| **Cámara de fermentación** | Sí — leudado ~40 min | No — leudado en lateros, ~2 h |
| **Quién dispara la reposición** | **Ventas pide**, 1 hora antes mínimo | **Cocina lo prevé sola** |
| **Hornea** | Panes y facturas para panadería + medialunas y chipá | Solo medialunas y chipá |
| **Sándwiches de miga y ciabatta** | Los elabora y **abastece a SLA** | Los recibe |
| **Bagels, baguettes, focaccias** | Propios | Propios |

**Un solo jefe de cocina para los dos locales**, a la mañana en San Luis. **Cubre los
descansos y reemplaza si falta un cocinero.** Tres de las cuatro guardias diarias
funcionan sin él — por eso el manual está escrito para alguien solo.

### Consumo interno

Ya está definido en el manual, **no volver a marcarlo como faltante**:

| | |
|---|---|
| **Pan diario** | 500 g de miñón + 4 tortillas + 2 facturas |
| **Consumo interno** | 3 tortillas **o** 3 facturas + 1 café o infusión |
| **Todo lo demás** | A la cuenta corriente del empleado. **Ni efectivo ni pagos digitales** |

### Otras

- **Pedidos de producción**: 9:00 panadería · 16:00 pastelería · 21:00 especialidades,
  facturería, sandwiches y cocina de los dos locales. **El horario es el tope de
  verificación, no la hora de cargarlo**: se puede hasta el fin del turno.
- **Chequeo de heladeras**: al inicio de cada turno, **todos los roles**, cada uno el
  de su sector.
- **Limpieza profunda de cocina**: los **lunes**.
- **Botiquín**: en la barra, junto a la caja. **Matafuegos**: uno en salón y uno en
  cocina de cada local.
- **Heladera de tortas**: piso superior porciones y mini cakes · pisos siguientes
  tortas · último piso tartas y pedidos. Por sabor, y dentro de cada sabor **lo más
  fresco adelante** (a la vista del cliente) y lo más viejo atrás.

---

## El problema de los 366 ítems

Es el hallazgo más importante del proyecto y conviene no perderlo.

Se analizaron **6 incidentes reales** del local San Luis. **Cuatro de los seis ya
estaban escritos, palabra por palabra, en un checklist** — organización de heladeras de
fiambres, limpieza del baño interno, regado de plantas, residuos en canteros.

> ### Escribirlo con más énfasis no lo va a resolver.
> Hay **366 ítems de checklist** en el manual, **82 solo en Vendedores y Mozos**. Un
> checklist de 82 ítems no se hace: se tilda.

**La recomendación pendiente** es definir un **núcleo innegociable de 8 a 10 ítems**
"antes de abrir", separado del resto. Y que el control del Experto sea sobre ese
núcleo, no sobre los 366.

---

## Lo que falta

### Lo inmediato

1. **Las recetas de cocina.** Cande las va a pasar. Faltan sobre todo las de los
   sanguchazos, porque **SLA elabora sus propios bagels, baguettes y focaccias** y hoy
   dependen de la memoria de quien los hizo la última vez.
2. **La revisión completa del manual** — pedida y no hecha todavía: *"revisá que
   información está faltando o debería corregirse en la totalidad del manual"*.
3. **Manuales generales faltantes**: **inducción de personal nuevo** e
   **inventario / recuento**. Primeros auxilios ya está dentro de *Emergencias y
   seguridad*.

### Lo que depende de Cande

| | |
|---|---|
| **Ctrl+H en Drive** | Quedaban **49 menciones de "encargado"** sin reemplazar, y *"Encargado de Local"* todavía coexiste con *Experto del Turno* |
| **Manual del vehículo duplicado** | Está copiado entero dentro de **Compras** y de **Ayudante de Cocina**, ~19.000 caracteres cada uno |
| **Calendario de proveedores** | Las dos tablas se contradicen: FRUTOS SECOS y CONGELADOS figuran martes y viernes en una y lunes y jueves en la otra; GALOPPO falta el lunes; **viernes son 12 proveedores, no 10** |
| **Dónde se carga el informe del Experto** | Es lo único que falta para que el circuito funcione. Va en una de las webs que ya se usan |

### Pendientes de definición por manual

Hay **156 pendientes marcados** en 22 manuales. Los que más pesan:

| Manual | Pendiente |
|---|---|
| **Emergencias** | Qué tiene el botiquín y quién lo repone · de qué tipo son los matafuegos y cuándo vencen · teléfonos de Gerencia, Administración y cobertura médica |
| **Cocina** | Tiempos de horneado por producto · recetas de sanguchazos · si el chequeo de heladeras deja registro |
| **Experto del turno** | Dónde se carga el informe · tope de compensación · quién autoriza roturas y diferencias de inventario |
| **Organigrama** | Confirmar el nombre de **Dirección** para el dueño, para no confundirlo con Gerencia |

Las áreas de producción (panadería, pastelería, facturería, especialidades, sandwiches)
tienen **10 pendientes cada una** y son las menos relevadas del proyecto.

---

## Cómo retomar

1. Leer este documento.
2. Mirar el **documento de Drive**, que es lo vigente.
3. Trabajar en la rama `claude/manuales-procedimientos-areas-fhxu13`.
4. Escribir en Markdown, convertir con `herramientas/md-a-googledocs.py`, y pegar en
   Drive.

> **Cómo prefiere trabajar Cande:** preguntas **de a una**, no listas de preguntas. Y
> cuando algo no está claro, **que se lo marque como pendiente en vez de inventarlo.**
