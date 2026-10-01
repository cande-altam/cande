# Integración Recetario → Sistema de Costeos

> **Para quien ejecuta esto (persona o Claude en el chat de Costeos):** este archivo describe cómo el sistema de **Costeos** de Candela tiene que leer las recetas que se cargan en el **Recetario** del sistema de Pedidos de Producción, y cómo calcular sus costos. Antes de programar, revisá cómo está hecho el sistema de Costeos (lenguaje, framework, dónde guarda los precios) y adaptá los ejemplos a ese código.

---

## 1. Qué hace cada sistema

| | Recetario (Pedidos de Producción) | Costeos |
|---|---|---|
| Es dueño de | Recetas, subrecetas, cantidades, mermas, empaque, rendimiento, porciones y catálogo de ingredientes | **Precios** de ingredientes y empaques, conversiones de unidades de compra y **cálculo de costos** |
| Escribe en | `recetario/…` | Su propia base o sus propios nodos. **Nunca** escribe en `recetario/` (las reglas lo rechazan). |
| Muestra costos | No | Sí |

El dato viaja en un solo sentido: **Recetario → Costeos**, solo lectura y en tiempo real. Si en el Recetario se cambia una receta, Costeos tiene que recalcular solo.

---

## 2. Conexión

### 2.1 Proyecto de Firebase del Recetario
Realtime Database del proyecto **pedidos-de-produccion-ee3cb**. Esta configuración es pública: ya está en el `index.html` del sistema de Producción.

```js
const recetarioConfig = {
  apiKey: "AIzaSyDtV-TC_GmylUNwwB1n-23u1t44C-ZtNvU",
  authDomain: "pedidos-de-produccion-ee3cb.firebaseapp.com",
  databaseURL: "https://pedidos-de-produccion-ee3cb-default-rtdb.firebaseio.com",
  projectId: "pedidos-de-produccion-ee3cb",
  storageBucket: "pedidos-de-produccion-ee3cb.firebasestorage.app",
  messagingSenderId: "744141794971",
  appId: "1:744141794971:web:9639c8bf3834e4978ae03e"
};
```

### 2.2 Cuenta de lectura para Costeos (pasos manuales, una sola vez)
Lo hace un administrador en [console.firebase.google.com](https://console.firebase.google.com/), proyecto **pedidos-de-produccion-ee3cb**:

1. **Authentication → Users → Add user**: email `costeos@recetario-candela.app` y una contraseña segura. A esa dirección no se envía nada.
2. Copiar el **User UID** de esa cuenta.
3. **Realtime Database → Data**: agregar `recetario/lectores/<UID>: true`.
4. Verificar que las reglas publicadas sean las de `database.rules.json` del repo de Producción. Ya incluyen el permiso de lectura para `recetario/lectores`.

Con esa cuenta, Costeos puede **leer** todas las áreas y el catálogo de ingredientes, pero no puede modificar nada.

> 🔐 **No guardes la contraseña de la cuenta en el código** si el repo de Costeos es público o el sistema corre en el navegador. Pedila una vez en una pantalla de ingreso (Firebase recuerda la sesión en ese dispositivo) o guardala como variable de entorno si Costeos corre en un servidor.

### 2.3 Opción A — Costeos es una app web con Firebase (SDK modular)
Usá una **instancia con nombre propio**, para no mezclar la sesión con la base de datos propia de Costeos, si la tiene:

```js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const recApp  = initializeApp(recetarioConfig, "recetario");
const recDb   = getDatabase(recApp);
const recAuth = getAuth(recApp);

// Pantalla de ingreso de Costeos → solo contraseña:
export const ingresarRecetario = pass =>
  signInWithEmailAndPassword(recAuth, "costeos@recetario-candela.app", pass);

onAuthStateChanged(recAuth, user => {
  if (!user) return;                       // mostrar el ingreso
  onValue(ref(recDb, "recetario/ingredientes"), s => { catalogo = s.val() || {}; recalcular(); });
  onValue(ref(recDb, "recetario/areas"), s => {
    const areas = s.val() || {};
    // Las fotos no hacen falta para costear: se descartan para no ocupar memoria.
    recetas = {};
    for (const [area, datos] of Object.entries(areas))
      for (const [id, r] of Object.entries(datos.recetas || {}))
        recetas[id] = { ...normalizar(r), id, area };
    recalcular();
  });
});
```

> Escuchar `recetario/areas` también descarga las fotos (unos 30–150 KB por receta). Con pocas decenas de recetas no es un problema. Si crecen mucho, escuchá `recetario/areas/<área>/recetas` por cada área conocida (`cocina`, …) en vez de `recetario/areas`. Por ahora la única área es `cocina`.

### 2.4 Opción B — Costeos corre en un servidor o script (REST)
1. Obtener el token de la cuenta:
   `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<apiKey>`
   con el cuerpo `{"email":"costeos@recetario-candela.app","password":"…","returnSecureToken":true}`. La respuesta trae `idToken`, que vale 1 hora, y `refreshToken`.
2. Leer los datos:
   - `GET {databaseURL}/recetario/ingredientes.json?auth=<idToken>`
   - `GET {databaseURL}/recetario/areas/cocina/recetas.json?auth=<idToken>`
3. Para renovar el token: `POST https://securetoken.googleapis.com/v1/token?key=<apiKey>` con `grant_type=refresh_token&refresh_token=…`.

### 2.5 Si Costeos usa este mismo proyecto de Firebase
Igual conviene usar la cuenta lectora. Además, **antes de publicar `database.rules.json`, hay que sumar a ese archivo los nodos propios de Costeos**, porque cualquier nodo que no esté listado queda bloqueado.

---

## 3. Estructura de datos (lo que se lee)

```
recetario/
  ingredientes/{ingredienteId}
  areas/{area}/recetas/{recetaId}
  areas/{area}/fotos/{recetaId}        ← ignorar para costeo
```

### 3.1 `recetario/ingredientes/{ingredienteId}`: catálogo compartido
| Campo | Tipo | Notas |
|---|---|---|
| `nombre` | string | Ej. `"Harina 000"`. Único por tipo, sin distinguir mayúsculas ni tildes. |
| `unidad` | string | Unidad con la que **se cargó por primera vez** en una receta. Es orientativa, no es la unidad de compra. |
| `tipo` | `"ingrediente"` \| `"empaque"` | |
| `creado` | number (ms) | |

Cuando alguien escribe un ingrediente nuevo en una receta, aparece solo en el catálogo con un `ingredienteId` nuevo.

### 3.2 `recetario/areas/{area}/recetas/{recetaId}`
| Campo | Tipo | Notas |
|---|---|---|
| `nombre`, `codigo`, `grupo` | string | `codigo` es único por área (`PLA001`, `SUB001`, …). |
| `tipo` | `"plato"` \| `"subreceta"` | |
| `rendimiento` | number \| null | Cuánto produce la receta completa. |
| `unidadRendimiento` | `"g"` `"kg"` `"ml"` `"l"` `"u"` `"porcion"` | |
| `porciones` | number \| null | |
| `margenSeguridad` | number | En %. Ej.: `10`. |
| `costearPorUnidad` | boolean | `true` = costear por unidad de rendimiento (por kg, por litro…), pensado para subrecetas. `false` = por porción. |
| `ingredientes` | array de líneas | Ver 3.3. |
| `empaque` | array | `{ ingredienteId, nombre, cantidad, unidad }` (sin merma). |
| `pasos`, `observaciones`, `alergenos`, `tieneFoto` | — | No se usan para costear. |
| `creada`, `actualizada` | number (ms) | `actualizada` sirve para detectar cambios. |
| `actualizadaPor` | string | |

### 3.3 Líneas de `ingredientes`
```js
{ tipo: "ingrediente", ingredienteId, nombre, cantidad, unidad, merma }
{ tipo: "subreceta",   recetaId,      nombre, cantidad, unidad, merma }
```
- `cantidad` es la **cantidad neta**. Si es `null`, significa "c/n" (cantidad necesaria, como la sal a gusto) y **se costea como 0**.
- `merma` es un % de 0 a 99, o `null` (= 0).
- `nombre` es solo una copia para mostrar. La referencia válida es `ingredienteId` / `recetaId`.
- `recetaId` apunta a una receta de **la misma área**.

### 3.4 Normalización obligatoria al leer
Realtime Database puede devolver los arrays como objetos (`{"0":…,"1":…}`) o con huecos, y omite los campos vacíos:

```js
const aArray = v => !v ? [] : Array.isArray(v) ? v.filter(Boolean) : Object.values(v);
function normalizar(r) {
  return { ...r, ingredientes: aArray(r.ingredientes), empaque: aArray(r.empaque),
           margenSeguridad: r.margenSeguridad || 0, porciones: r.porciones || null };
}
```

### 3.5 Ejemplo real
```json
{
  "nombre": "Croquetas de jamón (6 u.)", "codigo": "PLA001", "tipo": "plato", "grupo": "Entradas",
  "rendimiento": 1, "unidadRendimiento": "porcion", "porciones": 1,
  "margenSeguridad": 10, "costearPorUnidad": false,
  "ingredientes": [
    { "tipo": "subreceta",   "recetaId": "-Nx1", "nombre": "Masa de croquetas de jamón", "cantidad": 180, "unidad": "g", "merma": null },
    { "tipo": "ingrediente", "ingredienteId": "-Ni4", "nombre": "Huevo",       "cantidad": 0.5, "unidad": "u", "merma": 10 },
    { "tipo": "ingrediente", "ingredienteId": "-Ni5", "nombre": "Pan rallado", "cantidad": 45,  "unidad": "g", "merma": 20 }
  ],
  "empaque": [ { "ingredienteId": "-Ne1", "nombre": "Caja kraft 20x20", "cantidad": 1, "unidad": "u" } ],
  "actualizada": 1759276800000
}
```

---

## 4. Lo que Costeos tiene que agregar de su lado

### 4.1 Precios por ingrediente
Una tabla propia de Costeos, con `ingredienteId` como clave (no el nombre, porque el nombre puede cambiar):

| Campo | Ejemplo | Para qué |
|---|---|---|
| `ingredienteId` | `-Ni5` | Enlace con el catálogo del Recetario |
| `precio` | `2000` | Precio de la presentación de compra |
| `cantidadCompra` + `unidadCompra` | `1` `kg` | Ej.: "bolsa de 5 kg" → `5` `kg`; "maple de 30" → `30` `u` |
| `pesoPorUnidad` (opcional) | `60` g | Solo si las recetas usan `u` y se compra por peso, o al revés |
| `proveedor`, `fechaPrecio` | | Opcionales |

`precioUnitario = precio ÷ cantidadCompra`, expresado en la unidad base (g, ml o u).

### 4.2 Ingredientes sin precio
Mostrar una lista de **ingredientes del catálogo sin precio cargado**, sobre todo los nuevos. Las recetas que los usen tienen que marcarse como **"costo incompleto"**, nunca mostrarse como si costaran $0 sin aviso.

---

## 5. Cálculo

### 5.1 Unidades
Unidades base: **g** (masa), **ml** (volumen), **u** (unidad).

| Unidad | Base | Factor |
|---|---|---|
| g | g | 1 |
| kg | g | 1000 |
| ml | ml | 1 |
| l | ml | 1000 |
| u | u | 1 |
| porcion | — | Solo tiene sentido en subrecetas (ver 5.3) |

- Si la línea y el precio están en la misma familia (masa con masa, etc.), se convierte con el factor.
- Si cruzan familias (receta en `u`, compra en `kg`), se usa `pesoPorUnidad`. Si no está cargado, la línea queda **"sin conversión"** y la receta, con costo incompleto.
- Masa ↔ volumen (g ↔ ml): **no** convertir automáticamente; se marca como "sin conversión". Opcional: agregar densidad por ingrediente.

### 5.2 Costo de una línea de ingrediente o empaque
```
neta   = cantidad ?? 0
bruta  = neta ÷ (1 − (merma ?? 0)/100)          // empaque: bruta = neta (no tiene merma)
costo  = convertir(bruta, unidad → unidad base) × precioUnitario
```

### 5.3 Costo de una línea de subreceta
```
sub          = recetas[recetaId]
costoSubBase = costoSinMargen(sub)                           // ver 5.4; recursivo
si linea.unidad == "porcion":
    costoUnit = costoSubBase ÷ sub.porciones                 // costo por porción de la subreceta
si no:
    costoUnit = costoSubBase ÷ convertir(sub.rendimiento, sub.unidadRendimiento → base)
costo = convertir(bruta, linea.unidad → base) × costoUnit
```
- Si la línea y el rendimiento de la subreceta no son de la misma familia (por ejemplo, la subreceta rinde en `u` y la línea está en `g`), la línea queda "sin conversión".
- `costearPorUnidad` sirve para **mostrar** el costo de la subreceta por kg o por litro en vez de por porción. El costo de la línea se calcula siempre como arriba.

### 5.4 Costo de la receta
```
costoSinMargen(r) = Σ costo(ingredientes) + Σ costo(empaque)
costoTotal(r)     = costoSinMargen(r) × (1 + margenSeguridad/100)
costoPorPorcion   = costoTotal ÷ porciones                      (si porciones > 0)
costoPorUnidad    = costoTotal ÷ convertir(rendimiento → base)  (si costearPorUnidad; mostrar por kg o l)
```
**Margen de seguridad:** se aplica **solo en la receta que se está costeando**, no en sus subrecetas. Si no, el margen se suma dos veces.

### 5.5 Robustez
- Memorizar `costoSinMargen` por `recetaId` en cada recálculo.
- Protegerse de ciclos con un set de "visitando" y marcar error si hay uno. El Recetario no los permite, pero igual conviene el control.
- `recetaId` inexistente (subreceta borrada): marcar la línea como "subreceta faltante".
- Recalcular todo cada vez que llega un cambio de `recetario/areas` o `recetario/ingredientes`, o cuando cambia un precio en Costeos.

---

## 6. Prueba de aceptación (resultado exacto esperado)

**Precios:** leche entera $1500 por l · harina 000 $800 por kg · jamón cocido $9000 por kg · huevo $180 por u · pan rallado $2000 por kg · caja kraft $350 por u.

**Subreceta "Masa de croquetas de jamón":** rinde 1,2 kg, 1 porción, margen 0, `costearPorUnidad: true`.

| Línea | Neta | Merma | Bruta | Costo |
|---|---|---|---|---|
| Leche entera | 500 ml | — | 500 ml | 750,00 |
| Harina 000 | 80 g | — | 80 g | 64,00 |
| Jamón cocido | 200 g | 10 % | 222,22 g | 2000,00 |
| **Total** | | | | **2814,00** → **2345,00 por kg** |

**Plato "Croquetas de jamón (6 u.)":** 1 porción, margen 10 %.

| Línea | Neta | Merma | Bruta | Costo |
|---|---|---|---|---|
| Masa de croquetas (subreceta) | 180 g | — | 180 g | 0,18 kg × 2345 = 422,10 |
| Huevo | 0,5 u | 10 % | 0,5556 u | 100,00 |
| Pan rallado | 45 g | 20 % | 56,25 g | 112,50 |
| Caja kraft (empaque) | 1 u | — | 1 u | 350,00 |
| Subtotal | | | | 984,60 |
| Margen 10 % | | | | 98,46 |
| **Costo total = costo por porción** | | | | **1083,06** |

Otras pruebas:
- Sacar el precio del huevo → el plato queda "costo incompleto" y figura en la lista de ingredientes sin precio.
- Cambiar en el Recetario el jamón a 250 g → Costeos se actualiza solo, sin recargar la página.
- Agregar en el Recetario un ingrediente nuevo → aparece en Costeos como "sin precio".

---

## 7. Checklist de entrega
- [ ] Cuenta `costeos@recetario-candela.app` creada y habilitada en `recetario/lectores/<UID>`
- [ ] Reglas `database.rules.json` publicadas, incluyendo los nodos propios de Costeos si usa la misma base
- [ ] Ingreso a Costeos con la contraseña de la cuenta lectora; la contraseña no queda en el código
- [ ] Lectura en tiempo real de `recetario/ingredientes` y de las recetas
- [ ] Tabla de precios por `ingredienteId`, con presentación de compra y conversión
- [ ] Lista de ingredientes sin precio y aviso de "costo incompleto"
- [ ] Cálculo según la sección 5, con subrecetas recursivas y margen solo arriba
- [ ] La prueba de aceptación de la sección 6 da exactamente 2345,00 por kg y 1083,06
