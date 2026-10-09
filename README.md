# Candela Café & Patisserie — Sitio unificado

Este repositorio aloja **todos los sistemas internos de Candela**, cada uno en su
propia **subcarpeta**, para que nunca se pisen entre sí.

## Estructura

```
/                       → index.html (página de inicio con enlaces a cada sistema)
/produccion/            → Pedidos de Producción  ✅ (activo)
/administracion/        → Administración          (por importar)
/clientes/              → Clientes / Club Candela (por importar)
/recetario/             → Recetario de cocina     (por importar)
/manuales/              → Manuales de procedimientos (por importar)
/stock/                 → Control de stock        (por importar)
```

## Regla de oro (para no romper nada)

- **Cada sistema se edita y despliega SOLO dentro de su subcarpeta.**
- **Nunca** reemplazar el `index.html` de la raíz por el de un sistema puntual:
  la raíz es solo la página de inicio.
- Cada `index.html` de sistema es autónomo (su propio HTML/CSS/JS/Firebase).

## Estado de la migración

| Sistema | Subcarpeta | Branch de origen | Estado |
|---|---|---|---|
| Pedidos de Producción | `/produccion/` | `claude/quirky-meitner-fhx26k` | ✅ Importado |
| Administración | `/administracion/` | (a confirmar) | ⏳ Pendiente |
| Clientes / Club Candela | `/clientes/` | (a confirmar) | ⏳ Pendiente |
| Recetario | `/recetario/` | `claude/recetario-cocina` | ⏳ Pendiente |
| Manuales | `/manuales/` | `claude/manuales-procedimientos-areas-fhxu13` | ⏳ Pendiente |
| Control de stock | `/stock/` | `claude/stock-control-spreadsheets-pnq4g6` | ⏳ Pendiente |

> Los sistemas pendientes se importan una vez confirmada cuál es la branch
> vigente de cada uno (hay varias branches por sistema).
