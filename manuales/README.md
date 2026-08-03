# Manuales de Procedimientos — Candela Café & Patisserie

Panadería y cafetería de especialidad. **Dos locales de venta** (SLA 5.0 y San Luis)
y **un local de producción**.

> **Sobre el nombre:** en 2025 se fusionaron las marcas de panadería y cafetería en
> una sola. Podés encontrar documentos viejos que digan *Candecafé*, *Panadería
> Candela* o *Candela Panadería*. **El único nombre que se usa para identificar al
> negocio es "Candela Café & Patisserie".**

---

## Índice de manuales

### 🏪 Locales de venta

| Área / Rol | Manual | Estado |
|---|---|---|
| Cajeros | [venta/cajeros.md](venta/cajeros.md) | ✅ v2.0 — Junio 2026 |
| Vendedores y Mozos | [venta/vendedores-y-mozos.md](venta/vendedores-y-mozos.md) | ✅ v2.0 — Junio 2026 |
| Baristas | [venta/baristas.md](venta/baristas.md) | ✅ v2.0 — Junio 2026 |
| Encargado de local | [venta/encargado-de-local.md](venta/encargado-de-local.md) | 🟠 v0.9 — **Borrador, falta confirmar** |

### 🥖 Local de producción

| Área | Manual | Estado |
|---|---|---|
| Panadería | — | ⬜ Pendiente |
| Pastelería | — | ⬜ Pendiente |
| Facturería | — | ⬜ Pendiente |
| Especialidades | — | ⬜ Pendiente |
| Sandwiches | — | ⬜ Pendiente |
| Compras | [produccion/compras.md](produccion/compras.md) | 🟡 v1.0 — Julio 2026 · con puntos a definir |

> **Cocina San Luis no lleva manual propio.** Forma parte del local San Luis y
> funciona de forma independiente **solo para pedir insumos**, no como área de
> producción aparte. Su operación queda cubierta por los manuales de venta.

### 📋 Documentos comunes

Aplican a varios roles a la vez. **Son la fuente única de verdad** — si cambia un
horario, un PIN o una URL, se actualiza acá primero.

| Documento | Contenido |
|---|---|
| [comunes/herramientas-digitales.md](comunes/herramientas-digitales.md) | FUDO, las dos webs, PINs por área, horarios límite |
| [comunes/atencion-y-reclamos.md](comunes/atencion-y-reclamos.md) | Método LAST, 7 pasos de atención, upselling, tiempos |
| [comunes/higiene-y-presentacion.md](comunes/higiene-y-presentacion.md) | Higiene personal, manipulación, cadena de frío, qué reportar |
| [comunes/pedidos-y-pagos-a-proveedores.md](comunes/pedidos-y-pagos-a-proveedores.md) | Calendario de pedidos y pagos por proveedor, circuito de autorización |

### 🧩 Para escribir un manual nuevo

| Documento | Para qué |
|---|---|
| [`_plantilla.md`](_plantilla.md) | Estructura vacía con la misma forma que los manuales ya escritos |
| [`produccion/_cuestionario-areas-produccion.md`](produccion/_cuestionario-areas-produccion.md) | Guía de preguntas para relevar un área de producción. **Se puede reenviar tal cual** a quien está en el puesto |

---

## Datos de referencia rápida

### Horarios límite — Pedidos de Producción

| Área | Cargar antes de |
|---|---|
| Panadería | 9:00 hs |
| Pastelería | 16:00 hs |
| Especialidades | 21:00 hs |
| Facturería | 21:00 hs |
| Sandwiches | 21:00 hs |
| Cocina San Luis | 21:00 hs |

### Herramientas

| Herramienta | URL |
|---|---|
| Pedidos de Producción | `pedidos-produccion.netlify.app` |
| Pedidos de Clientes | `pedidos-de-clientes-cc.netlify.app` |
| FUDO | *(punto de venta)* |

---

## Cómo mantener estos manuales

1. **Un cambio, un lugar.** Si el dato está en `comunes/`, se edita ahí. Los manuales
   de rol repiten las tablas críticas a propósito (para que se puedan imprimir
   sueltos), así que al cambiar un horario hay que revisarlas todas —
   `grep -rn "16:00" manuales/` te las muestra.
2. **Versionar al publicar.** Subí el número de versión y la fecha en el encabezado
   cada vez que salga una versión nueva al equipo.
3. **El checklist es lo que más se usa.** Es la parte del manual que la gente mira
   todos los días. Mantenelo corto y accionable.

---

## Pendientes detectados

Cosas que salieron al pasar los manuales a este formato y que conviene resolver:

- [x] ~~**Horarios de corte inconsistentes.**~~ **Resuelto:** el corte de Facturería,
      Especialidades y Sandwiches es **21:00 hs**, y la app en vivo (`index.html`) ya
      lo tiene bien. El *"sin corte"* aparecía solo en `js/config.js` y en el
      `README.md` de la raíz — ver "Archivos obsoletos" más abajo.
- [x] ~~**"Cocina San Luis" no existe como área en la app.**~~ **Resuelto:** sí existe,
      y está bien modelada (`cuadra:false`). No es un área de producción aparte —
      es parte del local San Luis y solo pide insumos por su cuenta.
- [x] ~~**"Compras" no tiene manual."**~~ **Escrito** en
      [produccion/compras.md](produccion/compras.md) v1.0. Queda en amarillo porque
      tiene seis puntos de proceso sin definir, listados al final del propio manual —
      entre ellos **el manejo del efectivo**, que es el más importante.
- [ ] **Archivos obsoletos en el repo.** `index.html` es autocontenido y no carga nada
      de `js/`. La carpeta `js/` completa y el `README.md` de la raíz son scaffold de
      la primera versión y describen un sistema que ya no es el que corre: cortes
      distintos, sin Cocina San Luis, contraseñas que no coinciden
      (`admin2024` vs. `candela2025`). Conviene borrarlos o marcarlos como obsoletos
      para que nadie los tome como referencia.
- [ ] **PINs en texto plano.** Los PINs por área están escritos en los manuales. Si
      alguna vez se rotan, hay que actualizarlos en los tres archivos.
- [ ] **Nombre de marca en los documentos originales.** Los Google Docs siguen diciendo
      *Candecafé*. Acá ya está corregido a **Candela Café & Patisserie**; falta
      actualizarlos en Drive.
