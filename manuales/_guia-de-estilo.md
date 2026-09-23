# Guía de estilo de los manuales

*Versión 1.0 · Septiembre 2026*

Esta guía existe para que **todos los manuales se lean como si los hubiera escrito la
misma persona**, aunque los escriban personas distintas en momentos distintos. Se
aplica a los manuales que ya existen y a cualquiera que se agregue.

---

## 1. A quién le hablamos

A **la persona que ocupa el puesto**, no a quien la supervisa.

| Regla | Así sí | Así no |
|---|---|---|
| **Voseo, segunda persona** | "Contá el fondo antes de abrir." | "El cajero deberá contar el fondo." |
| **Imperativo corto** | "Cargá la venta y después cobrá." | "Es importante que se tenga en cuenta cargar la venta." |
| **La regla antes que la explicación** | "Leudar no es reponer: es prever." | Un párrafo sobre la importancia de prever |
| **Escrito para el día en que falta el que sabía** | Se escribe lo obvio | "Esto ya lo saben todos" |
| **Lo que no se sabe, se marca** | "Pendiente: tiempo de horneado" | Inventar un dato |

---

## 2. Cómo se nombran las cosas

Un solo nombre para cada cosa, siempre igual.

| Se escribe | No se escribe |
|---|---|
| **Candela Café & Patisserie** | Candecafé, Panadería Candela, Candela Panadería |
| **Experto del turno** | Encargado, encargado de local, supervisor |
| **Gerencia** (Cande) · **Dirección** (el dueño) · **Administración** | "la jefa", "los de arriba" |
| **San Luis** · **SLA 5.0** · **cuadra de producción** | "el local", "la fábrica" |
| **FUDO** | Fudo, el sistema |
| **Web de Pedidos de Producción** — `pedidos-produccion.netlify.app` | la app, la página |
| **Web de Pedidos de Clientes** — `pedidos-de-clientes-cc.netlify.app` | la web de encargos |
| **PedidosYa** · **Cheaf** | Pedidos Ya, pedidosya |
| **sándwich / sándwiches** (el área: **Sándwiches**) | sandwich, sanguche |
| **miñón** · **chipá** · **freezer** | mignon, chipa, frizer |
| **take away** · **delivery** | para llevar / envío, mezclados |
| **latero** · **lata** · **cajón** · **canasto** | bandeja (cuando es lata) |
| **hs** después de la hora: **9:00 hs** | 9hs, 9 hs., a las 9 |

---

## 3. Estructura de cada manual

Todos los manuales siguen el mismo orden. Si una sección no aplica, se elimina; no se
deja vacía.

1. **Título** (H1) y una línea en cursiva: *Versión · Mes año · Aplica a …*
2. **Objetivo del rol** (o **Para qué sirve**, en los documentos comunes)
3. **Tus herramientas digitales** — solo las que usa el rol
4. **Secciones numeradas** (H2): `## 1. Apertura`, `## 2. …`
5. **Indicadores de desempeño**
6. **Checklist** — corto (ver sección 6)
7. **Pendientes de definición** — siempre al final, antes de los documentos relacionados
8. **Documentos relacionados**

---

## 4. Jerarquía de títulos

| Nivel | Uso | En Drive |
|---|---|---|
| **H1** | Nombre del manual. **Uno solo por manual** — y las carátulas de cada parte | 20 pt, negrita |
| **H2** | Secciones del manual, numeradas: `1.`, `2.` | 14 pt, negrita |
| **H3** | Subsecciones dentro de una sección | 12 pt, negrita |
| **H4** | Solo el título de un cuadro destacado | 11 pt, negrita |

Nunca se usa un encabezado para escribir un párrafo, y nunca se salta un nivel (de H2
directo a H4).

---

## 5. Estética

| | |
|---|---|
| **Tipografía** | Calibri en todo |
| **Cuerpo** | 11 pt, negro, interlineado 1.45 |
| **Tablas** | Encabezado con fondo `#e5e1cc`, bordes 1 pt `#dedad8`. **Toda tabla tiene fila de encabezado** |
| **Cuadros destacados** | Solo fondo de color, sin barra lateral |
| **Checklists** | Párrafos con ☐, sin recuadro |
| **Emojis** | No se usan |
| **Negrita** | Para la palabra que hay que ver de un vistazo, no para frases enteras |

### Los cinco cuadros

El color lo define la marca que va en la primera línea del cuadro:

| Marca | Color | Para qué |
|---|---|---|
| `> [!regla]` | `#f9ddd8` | La regla que resume una sección |
| `> [!prohibido]` | `#fdecea` | Lo que no se hace nunca |
| `> [!atencion]` | `#fffbe6` | Advertencia, error frecuente |
| `> [!pendiente]` | `#f0eee2` | Algo que falta definir |
| `> [!nota]` | `#f7f5ea` | Aclaración o referencia a otro manual |

**Un cuadro por idea.** Si una sección tiene más cuadros que párrafos, sobran cuadros.

---

## 6. Checklists

> [!regla]
> ### Un checklist largo no se hace: se tilda.
> Cada checklist tiene **como máximo 10 ítems por momento** (apertura, durante,
> cierre). Si hacen falta más, el resto va a una lista de tareas del puesto, no al
> checklist.

- Cada ítem empieza con el **resultado**, no con la acción: "Caja contada y registrada
  en FUDO", no "Contar la caja".
- Lo que ya está en el checklist de otro rol **no se repite**.
- Los ítems innegociables van **primero**.

---

## 7. Lo que no se repite entre manuales

Cuando un mismo contenido está en dos manuales, tarde o temprano dice dos cosas
distintas. Cada tema tiene **un solo lugar**, y los demás manuales lo nombran.

| Tema | Vive en |
|---|---|
| Paso a paso de FUDO, las webs, PedidosYa y Cheaf | Herramientas digitales |
| Método LAST y los pasos de la atención | Atención al cliente y reclamos |
| Consumo del personal | Jornada, presentismo y consumo del personal |
| Calendario de proveedores y pagos | Pedidos y pagos a proveedores |
| Vehículo y traslado | Vehículo y traslado de mercadería |
| Mercadería que llega mal | Mercadería para cambio |
| Temperaturas, rotulado, cadena de frío | Higiene, manipulación y presentación |

Los manuales de cada rol conservan **lo que ese rol necesita en el turno** (qué
herramienta usa, qué horario le toca) y remiten al documento común para el detalle.
