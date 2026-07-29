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
| Encargado de local | — | ⬜ Pendiente |

### 🥖 Local de producción

| Área | Manual | Estado |
|---|---|---|
| Panadería | — | ⬜ Pendiente |
| Pastelería | — | ⬜ Pendiente |
| Facturería | — | ⬜ Pendiente |
| Especialidades | — | ⬜ Pendiente |
| Sandwiches | — | ⬜ Pendiente |
| Cocina San Luis | — | ⬜ Pendiente |
| Compras / Despacho | — | ⬜ Pendiente |

### 📋 Documentos comunes

Aplican a varios roles a la vez. **Son la fuente única de verdad** — si cambia un
horario, un PIN o una URL, se actualiza acá primero.

| Documento | Contenido |
|---|---|
| [comunes/herramientas-digitales.md](comunes/herramientas-digitales.md) | FUDO, las dos webs, PINs por área, horarios límite |
| [comunes/atencion-y-reclamos.md](comunes/atencion-y-reclamos.md) | Método LAST, 7 pasos de atención, upselling, tiempos |
| [comunes/higiene-y-presentacion.md](comunes/higiene-y-presentacion.md) | Higiene personal, manipulación, cadena de frío, qué reportar |

### 🧩 Para escribir un manual nuevo

[`_plantilla.md`](_plantilla.md) — estructura vacía con la misma forma que los tres ya
escritos. Copiala, renombrala y completala.

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

- [ ] **Horarios de corte inconsistentes.** El `README.md` de la app de Pedidos de
      Producción dice que Facturería, Especialidades y Sandwiches son *"sin corte"*.
      Los manuales v2.0 dicen **21:00 hs**. Acá se tomó el valor de los manuales por
      ser más recientes — falta alinear la app.
- [ ] **"Cocina San Luis" no existe como área en la app.** Aparece en los manuales con
      corte a las 21:00 hs, pero no está en la lista de áreas del sistema.
- [ ] **"Compras" no tiene manual.** Es un rol activo en la app (despacho de mercadería
      e insumos) y todavía no está documentado.
- [ ] **PINs en texto plano.** Los PINs por área están escritos en los manuales. Si
      alguna vez se rotan, hay que actualizarlos en los tres archivos.
- [ ] **Nombre de marca en los documentos originales.** Los Google Docs siguen diciendo
      *Candecafé*. Acá ya está corregido a **Candela Café & Patisserie**; falta
      actualizarlos en Drive.
