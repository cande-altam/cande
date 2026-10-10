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
| Administración (suite) | `/administracion/` | `claude/business-app-features-9mfa1a` | ✅ Importado |
| Clientes / Club Candela | `/clientes/` | `club-candela` | ✅ Importado |

> Nota: la suite de Administración ya incluye módulos propios (recetario,
> cronogramas, presupuestos, informes, vacaciones), por lo que no se importaron
> como sistemas separados para evitar duplicados.
