# 📖 Recetario — Fichas técnicas por área

Sección **Recetario** del sistema de Pedidos de Producción. Por ahora la usa solo el equipo de **Cocina**, entrando con usuario y contraseña. Está preparada para sumar las demás áreas de producción.

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

### 2. Crear las cuentas del equipo
**Authentication → Users → Add user**. Al ingresar, el usuario escribe solo su nombre de usuario y el sistema completa `@recetario-candela.app`:

| En el recetario escriben | Se crea en Firebase como |
|---|---|
| `cocina` | `cocina@recetario-candela.app` |
| `juan` | `juan@recetario-candela.app` |

A esas direcciones no se envía ningún correo; solo sirven de usuario. Si prefieren usar un email real, también se puede: en ese caso se escribe el email completo al ingresar.

Copiá el **User UID** de cada cuenta.

### 3. Habilitar cada cuenta
**Realtime Database → Data**: agregá este nodo por cada cuenta:

```
recetario
  └─ miembros
       └─ <UID>
            ├─ nombre: "Juan"          ← aparece como autor de los cambios
            └─ areas
                 └─ cocina: true
```

Para quitarle el acceso a alguien, borrá su nodo. Si una cuenta todavía no está habilitada, el mismo recetario muestra el UID que hay que cargar.

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
2. Habilitar a sus cuentas con `recetario/miembros/<UID>/areas/pasteleria: true`.

Cada área tiene sus propias recetas. Una cuenta con varias áreas elige cuál ver. El catálogo de ingredientes es compartido entre todas las áreas.

---

## Para el sistema de Costeos

### Cómo lee los datos
1. Crear una cuenta de Firebase (email y contraseña) para Costeos.
2. Habilitarla como lectora con `recetario/lectores/<UID>: true`. Así puede **leer** todas las áreas y el catálogo de ingredientes, pero no puede modificarlos.
3. Iniciar sesión con esa cuenta y leer los nodos. Si Costeos corre fuera de la web, puede usar la API REST pasando el token de la sesión: `GET https://pedidos-de-produccion-ee3cb-default-rtdb.firebaseio.com/recetario/areas.json?auth=<ID_TOKEN>`.

### Estructura

```
recetario/
  ingredientes/{ingredienteId}        ← catálogo compartido; Costeos le asigna el precio a cada uno
    nombre:  "Harina 000"
    unidad:  "g"                       ← unidad con la que se cargó por primera vez
    tipo:    "ingrediente" | "empaque"
    creado:  1759276800000

  areas/{area}/recetas/{recetaId}
    nombre, codigo, tipo ("plato" | "subreceta"), grupo
    rendimiento: 1.2                   ← cuánto produce la receta completa
    unidadRendimiento: "kg"            ← g | kg | ml | l | u | porcion
    porciones: 6
    margenSeguridad: 10                ← % a sumar al costo total
    costearPorUnidad: true             ← true: costo por unidad de rendimiento (kg, l…); false: por porción
    ingredientes: [
      { tipo: "ingrediente", ingredienteId, nombre, cantidad, unidad, merma },
      { tipo: "subreceta",   recetaId,      nombre, cantidad, unidad, merma }
    ]
    empaque: [ { ingredienteId, nombre, cantidad, unidad } ]
    pasos: ["…", "…"]
    observaciones, alergenos: { gluten: true, leche: true, … }   ← solo los marcados a mano
    tieneFoto, creada, actualizada, actualizadaPor

  areas/{area}/fotos/{recetaId}        ← foto en JPEG (data URL); Costeos no la necesita
```

- `cantidad` es la **cantidad neta**. Si está en `null`, significa "cantidad necesaria" (c/n), como la sal a gusto, y se costea como 0.
- `merma` está en % (de 0 a 99) y puede ser `null`.
- `nombre` en las líneas es una copia para leer más fácil. La referencia que vale es `ingredienteId` o `recetaId`.

### Cálculo sugerido
```
bruta(línea)         = cantidad ÷ (1 − merma/100)                 (convertida a la unidad del precio: g↔kg, ml↔l)
costo(ingrediente)   = bruta × precio unitario del ingrediente
costo(subreceta)     = bruta × costoUnitario(subreceta)
costoUnitario(sub)   = costoTotal(sub) ÷ rendimiento               (si costearPorUnidad)
                     = costoTotal(sub) ÷ porciones                 (si no: la línea se carga en porciones)
costoTotal(receta)   = (Σ costo(ingredientes) + Σ costo(empaque)) × (1 + margenSeguridad/100)
costoPorPorción      = costoTotal ÷ porciones
```
Las subrecetas nunca forman ciclos (el recetario no lo permite), así que el cálculo recursivo siempre termina.
