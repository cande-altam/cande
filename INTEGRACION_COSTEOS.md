# Integración Recetario → Costeo & Proveedores

> **Para quien ejecuta esto (persona o Claude en el chat de Costeo):** este archivo describe qué hay que construir en `costeo-proveedores/index.html` para que Costeo **lea las recetas del Recetario (`recetario/`) y calcule su costo** con los precios que ya maneja. Las dos apps están en este mismo repositorio (rama `claude/business-app-features-9mfa1a`) y usan **la misma base** de Firebase (`pedidos-de-produccion-ee3cb`). Los nombres de funciones de Costeo que se mencionan son los que existen hoy en ese archivo: verificalos antes de tocar nada, porque el código cambia.

---

## 1. Qué hace cada app

| | Recetario (`recetario/`) | Costeo & Proveedores (`costeo-proveedores/`) |
|---|---|---|
| Es dueño de | Recetas y subrecetas: ingredientes, cantidades netas, **merma**, empaque, rendimiento, porciones, margen de seguridad. Catálogo de ingredientes del recetario. | **Precios** (facturas, listas, historial), insumos, bases, productos, precio de venta, IVA. |
| Escribe en | `recetario/…` | `costeo/…` — **nunca** en `recetario/` (las reglas lo rechazan) |
| Calcula costos | No | **Sí** |

El dato viaja en un solo sentido: **Recetario → Costeo**, solo lectura y en tiempo real. Si la cocina cambia una receta, Costeo recalcula solo. Si sube un insumo, también.

---

## 2. Acceso a los datos del Recetario

`recetario/` es privado. Lo aplican las reglas del servidor (README → *Recetario → Reglas de seguridad completas*). Costeo hoy entra con su propia contraseña (`costeo/config/adminPassword`), que **no** es una sesión de Firebase. Por eso necesita una **cuenta lectora**.

### 2.1 Pasos manuales (una sola vez, en la consola de Firebase)
1. **Authentication → Users → Add user**: `costeo@candela-app.com` con una contraseña segura. Ese mail no recibe correo.
2. Tener publicadas las reglas completas del README: reconocen esta cuenta **por su email** y le dan solo lectura. No hace falta cargar nada en Data.

La cuenta lectora puede **leer** todas las áreas y el catálogo de ingredientes, pero no puede modificar nada.

### 2.2 En el código de Costeo
Hay que usar una **instancia de Firebase con nombre propio**. La instancia por defecto de Costeo (`const app = initializeApp(firebaseConfig)`) tiene que seguir sin sesión, como hoy, para no alterar su comportamiento ni el de las reglas de `costeo/`.

```js
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const RECETARIO_LECTOR_EMAIL = "costeo@candela-app.com";
const recApp  = initializeApp(firebaseConfig, "recetario-lector");   // misma config de Costeo
const recDb   = getDatabase(recApp);
const recAuth = getAuth(recApp);

onAuthStateChanged(recAuth, user => {
  state.recetarioConectado = !!user;
  if (user) escucharRecetario(); else render();
});
// Desde Configuración: "Conectar con el Recetario" → pide la contraseña una sola vez.
// Firebase recuerda la sesión en ese navegador; no guardar la contraseña en el código ni en la base.
window.conectarRecetario = pass => signInWithEmailAndPassword(recAuth, RECETARIO_LECTOR_EMAIL, pass);
```

- Mostrar los errores de Auth traducidos, con el mismo criterio que `mensajeDeError()` de `informes/index.html` y `recetario/index.html`.
- `permission-denied` al leer significa que falta el paso 2.1.3 o que las reglas no están publicadas. Decirlo así en pantalla.
- Si no hay sesión con el Recetario, Costeo funciona **igual que hoy**. Las recetas vinculadas muestran "Recetario sin conectar" y conservan su costo anterior.

### 2.3 Qué escuchar
```js
function escucharRecetario() {
  onValue(ref(recDb, "recetario/ingredientes"), s => { state.recIngredientes = s.val() || {}; invalidarCacheCosteo(); render(); });
  // Por ahora hay un área ("cocina"). Escuchar por área evita bajar las fotos (recetario/areas/*/fotos).
  for (const area of ["cocina"]) {
    onValue(ref(recDb, `recetario/areas/${area}/recetas`), s => {
      state.recRecetas[area] = normalizarRecetas(s.val() || {});
      invalidarCacheCosteo(); render();
    });
  }
}
```
No hace falta leer `recetario/areas/*/fotos`.

---

## 3. Estructura de datos que se lee

### 3.1 `recetario/ingredientes/{ingredienteId}`
| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | string | Ej. `"Harina 000"`. Único por tipo (sin distinguir mayúsculas ni tildes). |
| `unidad` | string | Unidad con la que se cargó **la primera vez** en una receta (`g`, `kg`, `ml`, `l`, `u`). Es orientativa. |
| `tipo` | `"ingrediente"` \| `"empaque"` | |
| `creado` | number (ms) | |

Cuando la cocina escribe un ingrediente nuevo en una receta, aparece solo acá con un id nuevo.

### 3.2 `recetario/areas/{área}/recetas/{recetaId}`
| Campo | Tipo | Notas |
|---|---|---|
| `nombre`, `codigo`, `grupo` | string | `codigo` es único por área (`PLA001`, `SUB001`…). |
| `tipo` | `"plato"` \| `"subreceta"` | |
| `rendimiento` | number \| null | Cuánto produce la receta completa. |
| `unidadRendimiento` | `g` `kg` `ml` `l` `u` `porcion` | |
| `porciones` | number \| null | |
| `margenSeguridad` | number (%) | Ej. `10`. |
| `costearPorUnidad` | boolean | `true`: mostrar el costo por unidad de rendimiento (por kg, por l). `false`: por porción. |
| `ingredientes` | array de líneas (3.3) | |
| `empaque` | array | `{ ingredienteId, nombre, cantidad, unidad }`, sin merma. |
| `actualizada` | number (ms) | Sirve para detectar cambios. |
| `pasos`, `observaciones`, `alergenos`, `tieneFoto`, `creada`, `actualizadaPor` | — | No se usan para costear. |

### 3.3 Líneas de `ingredientes`
```js
{ tipo: "ingrediente", ingredienteId, nombre, cantidad, unidad, merma }
{ tipo: "subreceta",   recetaId,      nombre, cantidad, unidad, merma }
```
- `cantidad` es la **cantidad neta**. Si es `null`, significa "c/n" (sal a gusto) y se costea como **0**, con aviso.
- `merma` es un % de 0 a 99, o `null` (= 0).
- `nombre` es una copia para mostrar. La referencia válida es `ingredienteId` / `recetaId`.
- `recetaId` apunta a una receta de **la misma área**. El Recetario no permite ciclos.

### 3.4 Normalización al leer (obligatoria)
Realtime Database puede devolver los arrays como objetos u omitir los campos vacíos:
```js
const aArray = v => !v ? [] : Array.isArray(v) ? v.filter(Boolean) : Object.values(v);
function normalizarRecetas(obj) {
  const out = {};
  for (const [id, r] of Object.entries(obj)) out[id] = { ...r, id,
    ingredientes: aArray(r.ingredientes), empaque: aArray(r.empaque),
    margenSeguridad: Number(r.margenSeguridad) || 0 };
  return out;
}
```

---

## 4. Lo que hay que construir en Costeo

### 4.1 Vínculo ingrediente del Recetario ↔ insumo de Costeo
Nuevo nodo en Costeo: `costeo/vinculosRecetario/{ingredienteId}: insumoId`.

- Se arma con una pantalla de **"Ingredientes del Recetario"**, por ejemplo una pestaña dentro de "Recetas y bases". Lista los ingredientes y envases del Recetario con su insumo vinculado, o "Sin vincular".
- Sugerencias con el matcher que ya existe: **`buscarInsumoParaTexto(nombre)`**.
  - Confianza `"alias"` o `"alta"`: se puede **proponer** preseleccionado, pero **igual se confirma**. Nunca vincular en silencio: es la misma lección de las facturas.
  - Confianza `"media"`: mostrar `candidatos` y preguntar.
  - Sin match: ofrecer el desplegable con todo el catálogo, o "➕ Crear insumo «…»" (decisión explícita, como en facturas).
- Un insumo puede estar vinculado a varios ingredientes del Recetario (ej. "Huevo" y "Huevos").
- Cada ingrediente del Recetario sin vincular deja las recetas que lo usan en **costo incompleto**.

### 4.2 Vínculo plato del Recetario ↔ producto de Costeo
Nuevo campo en el producto: `costeo/productos/{id}/recetario = { area, recetaId }`.

- En la ficha del producto: "📖 Usar receta del Recetario" (elegir de la lista de platos).
- Atajo: desde la lista de platos del Recetario, "Crear producto" (nombre = nombre del plato, sin precio de venta).
- **Fuente de costo:** si el producto tiene `recetario` y el Recetario está conectado, el costo sale del Recetario. Esto tiene prioridad sobre `receta` propia, `insumoVinculadoId` y costo manual.
  - Agregar `"recetario"` a `costoProductoFuente()`.
  - Agregar el caso al principio de `calcCostoProducto()`.
  - La receta propia (`receta`) **no se borra**: queda como respaldo si se desvincula.
- Las **subrecetas** del Recetario no hace falta cargarlas como "bases" en Costeo: se costean adentro del cálculo (5.3). Si más adelante se quiere usar una subreceta del Recetario como base en otro producto de Costeo, se puede vincular un insumo-base a `{ area, recetaId }` con el mismo criterio.

### 4.3 Avisos
- Productos con receta del Recetario que tienen **costo incompleto**, con el motivo por línea: ingrediente sin vincular, unidades incompatibles, subreceta faltante, "c/n".
- Ingredientes nuevos del Recetario sin vincular (contador visible, como el de facturas).

---

## 5. Cálculo

### 5.1 Precio del insumo
Usar **siempre `precioEfectivoInsumo(insumoId)`**: ya aplica la regla del negocio (el más alto de los últimos 60 días, las listas solo suben el costo, las bases se recalculan desde su receta). No reimplementar nada de eso. El resultado es el precio **por la unidad del insumo** (`ins.unidad`: kg, l, unidad…).

### 5.2 Conversión de unidades (línea del Recetario → unidad del insumo)
Las líneas del Recetario vienen en `g` `kg` `ml` `l` `u` `porcion`. `ins.unidad` es texto libre: `kg`, `gr`, `l`, `lt`, `litros`, `unidad`, `u`, `un`, vacío…

Ojo: `FACTORES_UNIDAD` y `normUnidadCorta()` alcanzan para facturas, pero **no cubren todo** lo que se necesita acá. Por ejemplo, `normUnidadCorta("lt")` devuelve `"lt"` y no hay factor `l→lt`, y no existen `u`/`unidad`/`un`. Conviene un helper propio:

```js
// Familia y factor a la unidad base de cada familia (g, ml, u).
const UNID_REC = {
  g:["masa",1], gr:["masa",1], grs:["masa",1], gramo:["masa",1], gramos:["masa",1],
  kg:["masa",1000], kgs:["masa",1000], kilo:["masa",1000], kilos:["masa",1000],
  ml:["vol",1], cc:["vol",1], l:["vol",1000], lt:["vol",1000], lts:["vol",1000], litro:["vol",1000], litros:["vol",1000],
  u:["u",1], un:["u",1], uni:["u",1], unid:["u",1], unidad:["u",1], unidades:["u",1],
};
function convertirCantidad(cant, desde, hacia) {        // null = incompatible
  const a = UNID_REC[normUnidadCorta(desde)], b = UNID_REC[normUnidadCorta(hacia)];
  if (!a || !b || a[0] !== b[0]) return null;
  return cant * a[1] / b[1];
}
```
- Si el insumo **no tiene unidad** cargada, no adivinar: la línea queda como "unidad del insumo sin configurar" (costo incompleto), con un botón que lleve a cargarla.
- Masa ↔ volumen (g ↔ ml) y unidad ↔ peso **no** se convierten: quedan como "incompatible". Opcional para más adelante: un `pesoPorUnidad` en el insumo.

### 5.3 Fórmulas
```
bruta(línea)         = (cantidad ?? 0) ÷ (1 − (merma ?? 0)/100)      // empaque: bruta = cantidad

costo(línea ingrediente/empaque):
    insumoId = costeo/vinculosRecetario[ingredienteId]               // sin vínculo → incompleto
    costo    = convertirCantidad(bruta, línea.unidad, ins.unidad) × precioEfectivoInsumo(insumoId)

costo(línea subreceta):
    sub = recRecetas[área][recetaId]                                  // no existe → incompleto
    si línea.unidad == "porcion":  costoUnit = costoBase(sub) ÷ sub.porciones
    si no:                         costoUnit = costoBase(sub) ÷ convertirCantidad(sub.rendimiento, sub.unidadRendimiento, línea.unidad)
    costo = bruta × costoUnit

costoBase(receta)     = Σ costo(ingredientes) + Σ costo(empaque)      // SIN margen
costoTotal(receta)    = costoBase × (1 + margenSeguridad/100)         // margen SOLO en la receta que se costea
costoPorPorción       = costoTotal ÷ porciones
costoPorUnidad        = costoTotal ÷ rendimiento                      // si costearPorUnidad (mostrar por kg o por l)
```
- **El margen de seguridad no se aplica dentro de las subrecetas**: si no, se suma dos veces.
- El costo que devuelve `calcCostoProducto()` para un producto vinculado es **`costoPorPorción`** si el plato tiene `porciones`, y si no, `costoTotal`. Así queda comparable con `precioVenta`, que es por unidad vendida.
- **IVA:** el resultado hereda el criterio de `precioEfectivoInsumo()`, igual que una receta propia de Costeo hoy. No agregar ni sacar IVA en este cálculo.
- Memorizar `costoBase` por `recetaId` dentro del mismo cache que `invalidarCacheCosteo()` limpia, y protegerse de ciclos con un set de "visitando", igual que en `precioEfectivoInsumo`.
- `costoHistorial` del producto: si Costeo registra cambios de costo, registrar también los que vienen del Recetario, con fuente `"recetario"`.

---

## 6. Prueba de aceptación (resultado exacto esperado)

**Insumos en Costeo**, vinculados a los ingredientes de mismo nombre del Recetario:

| Insumo | `unidad` | `precioEfectivoInsumo` |
|---|---|---|
| Leche entera | l | 1500 |
| Harina 000 | kg | 800 |
| Jamón cocido | kg | 9000 |
| Huevo | unidad | 180 |
| Pan rallado | kg | 2000 |
| Caja kraft 20x20 | u | 350 |

**Subreceta "Masa de croquetas de jamón"** (rinde 1,2 kg, margen 0, `costearPorUnidad: true`):

| Línea | Neta | Merma | Bruta | Convertida | Costo |
|---|---|---|---|---|---|
| Leche entera | 500 ml | — | 500 ml | 0,5 l | 750,00 |
| Harina 000 | 80 g | — | 80 g | 0,08 kg | 64,00 |
| Jamón cocido | 200 g | 10 % | 222,22 g | 0,2222 kg | 2000,00 |
| **costoBase** | | | | | **2814,00** → **2345,00 por kg** |

**Plato "Croquetas de jamón (6 u.)"** (1 porción, margen 10 %), vinculado a un producto:

| Línea | Neta | Merma | Bruta | Costo |
|---|---|---|---|---|
| Masa de croquetas (subreceta) | 180 g | — | 180 g | 180 × 2814 ÷ 1200 = 422,10 |
| Huevo | 0,5 u | 10 % | 0,5556 u | 100,00 |
| Pan rallado | 45 g | 20 % | 56,25 g | 112,50 |
| Caja kraft (empaque) | 1 u | — | 1 u | 350,00 |
| costoBase | | | | 984,60 |
| **costoTotal = costo por porción** (× 1,10) | | | | **1083,06** |

Más pruebas:
1. Desvincular "Huevo" → el producto pasa a **costo incompleto** con el motivo "Huevo sin vincular". Nunca debe mostrar 983,06 como si estuviera completo.
2. Cambiar la unidad del insumo "Pan rallado" a `l` → la línea queda "incompatible" y el producto, incompleto.
3. En el Recetario, cambiar el jamón a 250 g → Costeo se actualiza sin recargar la página.
4. Cargar una factura con jamón más caro → sube el costo del plato (vía `precioEfectivoInsumo`).
5. Sin conexión con el Recetario (cerrar la sesión lectora) → Costeo sigue andando y avisa "Recetario sin conectar".
6. `https://pedidos-de-produccion-ee3cb-default-rtdb.firebaseio.com/recetario.json` en una ventana privada → `Permission denied`.

---

## 7. Checklist
- [ ] **Cuenta `costeo@candela-app.com` creada** — paso manual en la consola de Firebase (Authentication → Users → Add user), no se puede hacer desde el código. Pendiente.
- [ ] **Reglas completas del README publicadas** — paso manual en la consola de Firebase (Realtime Database → Rules). Pendiente.
- [x] Instancia `"recetario-lector"` con sesión propia; la instancia por defecto de Costeo queda igual
- [x] Botón "Conectar con el Recetario" en Configuración; la contraseña no queda en el código
- [x] Pantalla de vínculos ingrediente ↔ insumo, con `buscarInsumoParaTexto` y confirmación explícita (pestaña "📖 Recetario" en Recetas y Bases)
- [x] Producto ↔ plato (`costeo/productos/{id}/recetario`), con fuente de costo `"recetario"` — selector en el formulario de producto + atajo "Crear producto" desde la lista de platos
- [x] Cálculo según la sección 5: merma, subrecetas, conversión, margen solo arriba
- [x] Avisos de costo incompleto con motivo por línea (badge "⚠️ Costo incompleto" en la tabla de Productos, con el detalle en el título)
- [x] La prueba de la sección 6 da exactamente **2345,00 por kg** y **1083,06** — cubierto por test automatizado (`run-recetario-calculo.mjs`), reproduce el ejemplo entero y da esos números exactos
- [x] README de Costeo actualizado con la integración

**Falta lo de arriba (los dos primeros ítems) para que la conexión funcione de verdad en producción.**
El código ya está — mientras la cuenta no exista, "Conectar con el Recetario" va a fallar con el
mensaje traducido correspondiente (`auth/invalid-credential` o `permission-denied`) y la app sigue
funcionando igual que siempre, sin romper nada.
