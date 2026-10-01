# 📖 Recetario — Fichas técnicas por área

Sección **Recetario** del sistema de Pedidos de Producción. Por ahora es de **Cocina**: se entra solo con contraseña, la carga el encargado y el equipo trabaja con las fichas impresas. Está preparada para sumar las demás áreas de producción.

## Qué se puede hacer

| Pantalla | Qué tiene |
|---|---|
| **Listado** | Buscar por nombre o código. Filtrar por tipo (plato o subreceta) y por grupo. Cada receta muestra sus líneas, lo que produce y la fecha de la última actualización. |
| **Ficha** | Foto, preparación paso a paso y alérgenos. Tabla de ingredientes con cantidad neta, merma y cantidad bruta. Empaque. En qué recetas se usa cada subreceta. |
| **Editar / Nueva receta** | Datos generales (nombre, tipo, código, grupo, rendimiento y porciones). Ingredientes y subrecetas con su merma. Empaque. Pasos, foto y observaciones. Alérgenos de la ANMAT. Datos para el costeo. |
| **PDF** | **Descargar ficha (PDF)** abre la ficha técnica lista para imprimir o guardar como PDF (en el cuadro de impresión, elegí "Guardar como PDF"). **Imprimir recetario** junta todas las recetas filtradas, una por hoja, para armar la carpeta de la cocina. |

### Reglas del recetario
- **Subrecetas**: preparaciones base (masas, salsas, rellenos) que se usan dentro de otras recetas. Una receta no puede usarse a sí misma, ni en forma directa ni indirecta.
- **Merma**: la cantidad bruta se calcula como `neta ÷ (1 − merma %)`. Por ejemplo, 45 g con 20 % de merma dan 56,25 g brutos.
- **Alérgenos**: son los de declaración obligatoria del Código Alimentario Argentino (art. 235 séptimo): gluten (TACC), crustáceos, huevo, pescado, maní, soja, leche, frutos secos y sulfitos. Los alérgenos de una subreceta **se heredan solos** en los platos que la usan.
- **Códigos**: si se dejan vacíos, se asignan solos (`PLA001`, `SUB001`, …). No se pueden repetir.
- No se puede eliminar una subreceta mientras alguna receta la use.
- Si dos personas editan la misma receta a la vez, al guardar se avisa antes de pisar los cambios de la otra.
- **No se calculan costos acá.** Los calcula el sistema de Costeos a partir de estos datos (ver más abajo).

---

## Puesta en marcha (una sola vez)

Todo se hace en [console.firebase.google.com](https://console.firebase.google.com/), en el proyecto **pedidos-de-produccion-ee3cb**.

### 1. Activar el inicio de sesión
**Build → Authentication → Get started → Sign-in method** → activar **Correo electrónico/contraseña**.

### 2. Crear la cuenta del recetario
Al recetario se entra **solo con contraseña**. Por detrás, cada área usa una cuenta fija de Firebase:

**Authentication → Users → Add user**
- Email: `cocina@recetario-candela.app` (a esa dirección no se envía nada; solo identifica la cuenta)
- Contraseña: la que va a usar el encargado. Que sea segura: es la única llave del recetario.

Copiá el **User UID** de la cuenta.

> **Para cambiar la contraseña:** borrá la cuenta en **Authentication → Users** y creala de nuevo con el mismo email y la contraseña nueva. Como el UID cambia, actualizalo también en el paso 3. Las recetas no se pierden.

### 3. Habilitar la cuenta
**Realtime Database → Data**: agregá este nodo con el UID que copiaste:

```
recetario
  └─ miembros
       └─ <UID>
            ├─ nombre: "Cocina"        ← aparece como autor de los cambios
            └─ areas
                 └─ cocina: true
```

Si la cuenta todavía no está habilitada, el mismo recetario muestra el UID que hay que cargar.

> Es importante habilitar por UID y no solo por email: así nadie puede crear una cuenta parecida y entrar.

### 4. Publicar las reglas de seguridad ⚠️
Sin este paso, las recetas **no son privadas**.

**Realtime Database → Rules**:
1. **Antes de cambiar nada, copiá y guardá las reglas actuales** por si hay que volver atrás.
2. Reemplazalas por el contenido de [`database.rules.json`](database.rules.json) y tocá **Publish**.

Estas reglas dejan el resto del sistema (pedidos, catálogo, insumos, stock, avisos) **igual que hoy** y cierran el recetario: solo lo ven las cuentas habilitadas de cada área.

> Si en **Data** ves carpetas principales que no están en `database.rules.json`, avisá antes de publicar: habría que agregarlas a las reglas. Esto importa sobre todo si el sistema de Costeos u otro sistema guarda datos en esta misma base.

---

## Sumar otra área (Pastelería, Panadería…)
1. En `js/recetario.js`, agregar el área a `AREAS_RECETARIO`:
   ```js
   pasteleria: { label: "Pastelería", icon: "🎂" },
   ```
2. Crear la cuenta `pasteleria@recetario-candela.app` con su contraseña y habilitarla con `recetario/miembros/<UID>/areas/pasteleria: true`.

Con más de un área, la pantalla de ingreso muestra botones para elegir el área antes de poner la contraseña. Cada área tiene sus propias recetas y su propia contraseña. El catálogo de ingredientes es compartido entre todas las áreas.

---

## Para el sistema de Costeos
Todo lo necesario para conectar Costeos con el recetario está en [`INTEGRACION_COSTEOS.md`](INTEGRACION_COSTEOS.md).
