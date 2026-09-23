# Manuales de Procedimientos — Candela Café & Patisserie

> **La versión vigente es el documento de Google Drive.** Estos archivos son el material
> de trabajo: se escriben acá, se arman con `herramientas/armar-manual.py` y se pegan
> en Drive. **Cuando haya diferencia entre el repo y Drive, gana Drive.**
>
> Documento vigente hasta septiembre de 2026:
> [Manuales de Procedimientos — Candela Café & Patisserie](https://docs.google.com/document/d/1m1GcwS1IfsuxwWdi8OZNSrcDIK5QLzHbOXG3MBE6oLk/edit)

En septiembre de 2026 estos archivos se **reconstruyeron a partir del documento de
Drive** y se unificaron. Qué se cambió y qué falta está en
[`_informe-revision-2026-09.md`](_informe-revision-2026-09.md).

---

## Estructura del documento

| Parte | Manuales |
|---|---|
| **Portada** | [`_portada.md`](_portada.md): cómo se lee, índice y control de versiones |
| **1. Documentos comunes** | [organigrama](comunes/organigrama.md) · [código de ética](comunes/codigo-de-etica.md) · [inducción](comunes/induccion-personal-nuevo.md) · [jornada y presentismo](comunes/jornada-y-presentismo.md) · [higiene](comunes/higiene-y-presentacion.md) · [emergencias](comunes/emergencias-y-seguridad.md) · [atención y reclamos](comunes/atencion-y-reclamos.md) · [herramientas digitales](comunes/herramientas-digitales.md) · [vajilla](comunes/vajilla.md) · [mercadería para cambio](comunes/mercaderia-para-cambio.md) · [pedidos y pagos a proveedores](comunes/pedidos-y-pagos-a-proveedores.md) · [inventario y recuento](comunes/inventario-y-recuento.md) · [vehículo](comunes/vehiculo-de-transporte.md) |
| **2. Locales de venta** | [experto del turno](venta/experto-del-turno.md) · [cajeros](venta/cajeros.md) · [vendedores y mozos](venta/vendedores-y-mozos.md) · [baristas](venta/baristas.md) |
| **3. Cocina de los locales** | [cocina de locales](venta/cocina.md) · [jefe de cocina](venta/jefe-de-cocina.md) · [ayudante de cocina](produccion/ayudante-de-cocina.md) |
| **4. Cuadra de producción** | [maestro de área](produccion/maestro-de-area.md) · [panadería](produccion/panaderia.md) · [pastelería](produccion/pasteleria.md) · [facturería](produccion/factureria.md) · [especialidades](produccion/especialidades.md) · [sándwiches](produccion/sandwiches.md) · [bases](produccion/bases.md) |
| **5. Apoyo** | [compras](produccion/compras.md) · [limpieza](limpieza.md) |
| **6. Guías internas** | [guía de estilo](_guia-de-estilo.md) · [cuestionario de producción](produccion/_cuestionario-areas-produccion.md) · [plantilla](_plantilla.md) |

El orden de arriba es el del documento, y está definido en `herramientas/armar-manual.py`.

---

## Cómo se trabaja

1. **Se escribe en Markdown**, siguiendo la [guía de estilo](_guia-de-estilo.md).
2. **Se arma el documento:** `python3 herramientas/armar-manual.py salida/manual-unificado.html`.
3. **Se pasa a Drive:** abrir el HTML en el navegador, `Ctrl+A`, `Ctrl+C` y pegar.
   También se puede convertir a `.docx` con LibreOffice y subirlo a Drive.

---

## La app de Manuales

`manuales/index.html` es una app de lectura que se sembró en agosto con la versión de
entonces de estos archivos, y **no se actualiza sola**. Hoy su contenido está
desactualizado respecto de esta versión.
