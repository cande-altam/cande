# Estado del proyecto y cómo continuarlo

**Manuales de Procedimientos — Candela Café & Patisserie**
*Actualizado: 23 de septiembre de 2026*

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

> **Regla de marca, sin excepciones:** el único nombre es "Candela Café & Patisserie".
> *Candecafé* o *Panadería Candela* son marcas anteriores. **No se usan más.**

---

## Lo que pasó el 23 de septiembre de 2026

Cande pidió: leer el manual completo de Drive, compararlo con información vigente y con
manuales de negocios parecidos, unificar texto, tono, tipografía, jerarquía y estética,
sugerir cambios y pendientes, y **completar los manuales que faltaban hasta que solo
queden pendientes las recetas.**

Se hizo así:

1. Se leyó el documento de Drive completo (6.339 líneas, 26 manuales) y **se reconstruyó
   el repo a partir de Drive**, que era la versión vigente. Los cambios que había solo
   en el repo (cocina de locales, reparto barra/cocina, qué sale de vitrina, horario de
   los pedidos de la noche) se incorporaron.
2. Se unificó todo según la nueva [guía de estilo](_guia-de-estilo.md).
3. Se escribieron o completaron: **Inducción**, **Inventario y recuento**, **Jefe de
   cocina** (reescrito), **Maestro de área**, y el **proceso** de Panadería, Pastelería,
   Facturería, Especialidades, Sándwiches y Bases.
4. Se eliminó **Encargado de local** y se integró **Administración** en *Pedidos y pagos
   a proveedores*.
5. Todo lo revisado y decidido está en el
   [informe de revisión](_informe-revision-2026-09.md), sección 4.

**Entregado a Cande:** `salida/manual-unificado.html` (para pegar en Drive),
`manual-unificado.docx` (para subir a Drive) e `informe-revision.html`. La carpeta
`salida/` no se versiona: se regenera con `herramientas/armar-manual.py`.

> **Pendiente de Cande:** pasar el documento unificado a Drive (informe, sección 7).
> Hasta que lo haga, el documento vigente sigue siendo el viejo.

---

## Las reglas de trabajo del proyecto

### 1. Drive es la versión vigente

Los archivos del repo son material de trabajo. **Cuando haya diferencia, gana Drive.**
Si Cande editó Drive después de esta fecha, antes de tocar el repo hay que **leer Drive
y traer sus cambios**.

### 2. La estética

| | |
|---|---|
| **Tipografía** | Calibri en todo; cuerpo 11 pt, interlineado 1.45 |
| **Encabezados** | H1 20 pt · H2 14 pt · H3 12 pt · H4 11 pt, negrita y negros |
| **Tablas** | Encabezado `#e5e1cc`, bordes 1 pt `#dedad8` |
| **Cuadros** | `> [!regla]` `[!prohibido]` `[!atencion]` `[!pendiente]` `[!nota]` |
| **Emojis** | Ninguno |

Herramientas: `herramientas/md-a-googledocs.py` (conversor) y
`herramientas/armar-manual.py` (arma el documento completo en el orden correcto).

### 3. Cómo se escriben

- **Para la persona que ocupa el puesto**, en voseo e imperativo.
- **La regla antes que la explicación.**
- **Lo que no se sabe se marca como pendiente**, no se inventa.
- **Checklists de 10 ítems como máximo por momento.**
- **Cada tema en un solo lugar** (tabla en la guía de estilo, sección 7).

---

## Decisiones ya tomadas

No hace falta volver a preguntarlas.

| Tema | Decisión |
|---|---|
| **Organigrama** | Dirección (el dueño) → Gerencia (Cande) → Administración · Compras · Locales de venta · Cocina de locales · Cuadra de producción. Limpieza: San Luis y cuadra |
| **Experto del turno** | Reemplazó a "Encargado de local". Rol dentro del turno, rota, lo elige Gerencia, cobra bono |
| **Barra** | No es un puesto: es el espacio de trabajo del barista |
| **Bachero** | Es el ayudante de cocina |
| **Reparto de la carta** | Si lleva café, barra; si no lleva café y hay que prepararla, cocina; si hay que calentarlo, comanda. Frappuccino: cocina |
| **Cocina** | Un jefe de cocina para los dos locales, a la mañana en San Luis; cubre descansos y reemplaza. San Luis con cámara (~40 min), SLA sin cámara (~2 h). San Luis hace miga y ciabatta para SLA |
| **Consumo interno** | Pan diario 500 g de miñón + 4 tortillas + 2 facturas; consumo interno 3 tortillas o 3 facturas + 1 café. Lo demás a cuenta corriente |
| **Pedidos de producción** | 9:00 panadería · 16:00 pastelería · 21:00 especialidades, facturería, sándwiches y cocina (tope de verificación: se puede cargar hasta el fin del turno) |
| **Pedido de insumos** | Hasta las 9:00 hs del día de compra; lo ideal, al cierre del turno anterior *(unificado en septiembre; a confirmar por Cande)* |
| **Heladeras** | Chequeo al inicio de cada turno, todos los roles. 4 °C o menos; freezer −18 °C o menos |
| **Limpieza profunda de cocina** | Los lunes |
| **Botiquín y matafuegos** | Botiquín en la barra junto a la caja; un matafuego en salón y uno en cocina |
| **Heladera de tortas** | Arriba porciones y mini cakes; medio tortas; abajo tartas y pedidos. Por sabor; lo más fresco adelante |

---

## El problema de los 366 ítems

De **6 incidentes reales** de San Luis, **4 ya estaban escritos palabra por palabra en
un checklist.** Escribirlo con más énfasis no lo resuelve. En septiembre se acortaron
todos los checklists (máximo 10 ítems por momento), y en el informe hay **una propuesta
de núcleo innegociable de 10 ítems "antes de abrir"** para que Cande la defina.

---

## Lo que falta

### Lo inmediato

1. **Las recetas**: las fichas de producto de cada área (ver informe, sección 5). Sobre
   todo **Sándwiches**, que no tiene ninguna, y el **armado de cada torta**.
2. **Que Cande pase el documento unificado a Drive.**
3. **Las 15 definiciones de Gerencia** listadas en el informe, sección 5.

### Cuando lleguen las recetas

Se completan en la sección **Fichas de producto** de cada manual de producción, con el
modelo de ficha de la *Plantilla* (parte B). Después se vuelve a armar el documento.

---

## Cómo retomar

1. Leer este documento y el informe de revisión.
2. **Leer el documento de Drive** y comparar con el repo: si Cande cambió algo, traerlo.
3. Trabajar en la rama `claude/manuales-procedimientos-areas-fhxu13`.
4. Escribir en Markdown, armar con `herramientas/armar-manual.py`, pasar a Drive.

> **Cómo prefiere trabajar Cande:** preguntas **de a una**, no listas de preguntas. Y
> cuando algo no está claro, **que se marque como pendiente en vez de inventarlo.**
