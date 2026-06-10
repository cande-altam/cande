// =============================================================
// catalogo.js — Static seed catalog + Firebase catalog loader
// =============================================================
// This seed data is used the very first time the app runs.
// Once stored in Firebase under catalogo/productos and
// catalogo/insumos it can be edited through the Admin panel.
// =============================================================

const SEED_PRODUCTOS = {
  panaderia: [
    { nombre: "Facturas surtidas", unidad: "docena" },
    { nombre: "Medialunas de manteca", unidad: "docena" },
    { nombre: "Medialunas de grasa", unidad: "docena" },
    { nombre: "Croissant", unidad: "unidad" },
    { nombre: "Pan lactal grande", unidad: "unidad" },
    { nombre: "Pan de campo", unidad: "unidad" },
    { nombre: "Pan de hamburguesa", unidad: "docena" },
    { nombre: "Pan de hot dog", unidad: "docena" },
    { nombre: "Pan árabe", unidad: "unidad" },
    { nombre: "Chipá", unidad: "docena" },
    { nombre: "Pan brioche", unidad: "unidad" },
    { nombre: "Baguette", unidad: "unidad" },
    { nombre: "Tostadas francesas", unidad: "docena" },
    { nombre: "Rosca de manteca", unidad: "unidad" },
    { nombre: "Prepizza", unidad: "unidad" },
  ],
  pasteleria: [
    { nombre: "Torta de chocolate", unidad: "unidad" },
    { nombre: "Lemon pie", unidad: "unidad" },
    { nombre: "Cheesecake clásico", unidad: "unidad" },
    { nombre: "Cheesecake de maracuyá", unidad: "unidad" },
    { nombre: "Brownies", unidad: "docena" },
    { nombre: "Muffins de arándanos", unidad: "docena" },
    { nombre: "Muffins de chips de chocolate", unidad: "docena" },
    { nombre: "Cupcakes surtidos", unidad: "docena" },
    { nombre: "Tiramisú (porción)", unidad: "porciones" },
    { nombre: "Opera (porción)", unidad: "porciones" },
    { nombre: "Selva Negra (porción)", unidad: "porciones" },
    { nombre: "Alfajores de maicena", unidad: "docena" },
    { nombre: "Cookies de chocolate", unidad: "docena" },
    { nombre: "Cinnamon rolls", unidad: "docena" },
    { nombre: "Éclair de chocolate", unidad: "docena" },
    { nombre: "Macaron surtidos", unidad: "docena" },
  ],
  factureria: [
    { nombre: "Empanadas de carne cortada", unidad: "docena" },
    { nombre: "Empanadas de pollo", unidad: "docena" },
    { nombre: "Empanadas de jamón y queso", unidad: "docena" },
    { nombre: "Empanadas de verdura", unidad: "docena" },
    { nombre: "Empanadas de humita", unidad: "docena" },
    { nombre: "Tarta de jamón y queso (bandeja)", unidad: "unidad" },
    { nombre: "Tarta de cebolla y queso (bandeja)", unidad: "unidad" },
    { nombre: "Tarta de espinaca y ricota (bandeja)", unidad: "unidad" },
    { nombre: "Quiche lorraine (bandeja)", unidad: "unidad" },
    { nombre: "Quiche de puerro (bandeja)", unidad: "unidad" },
    { nombre: "Pascualina (bandeja)", unidad: "unidad" },
    { nombre: "Strüdel de manzana", unidad: "unidad" },
    { nombre: "Tarta de choclo (bandeja)", unidad: "unidad" },
  ],
  especialidades: [
    { nombre: "Waffles (porción 2u)", unidad: "porciones" },
    { nombre: "Crepes dulces (x2)", unidad: "porciones" },
    { nombre: "Crepes salados (x2)", unidad: "porciones" },
    { nombre: "Pancakes (x3)", unidad: "porciones" },
    { nombre: "French toast", unidad: "porciones" },
    { nombre: "Granola casera", unidad: "kg" },
    { nombre: "Mermelada de ciruela", unidad: "unidad" },
    { nombre: "Mermelada de durazno", unidad: "unidad" },
    { nombre: "Dulce de leche artesanal", unidad: "kg" },
    { nombre: "Mantequilla de maní", unidad: "unidad" },
  ],
  sandwiches: [
    { nombre: "Sandwich de miga simple (x12)", unidad: "unidad" },
    { nombre: "Sandwich de miga doble (x12)", unidad: "unidad" },
    { nombre: "Wrap de pollo", unidad: "unidad" },
    { nombre: "Wrap vegetariano", unidad: "unidad" },
    { nombre: "Tostado de jamón y queso", unidad: "unidad" },
    { nombre: "Tostado caprese", unidad: "unidad" },
    { nombre: "Bagel salmón", unidad: "unidad" },
    { nombre: "Club sandwich", unidad: "unidad" },
    { nombre: "Medialunas rellenas (x6)", unidad: "unidad" },
    { nombre: "Focaccia", unidad: "unidad" },
    { nombre: "Burrata toast", unidad: "unidad" },
  ],
};

const SEED_INSUMOS = {
  panaderia: [
    { nombre: "Harina 000", unidad: "kg" },
    { nombre: "Harina 0000", unidad: "kg" },
    { nombre: "Harina integral", unidad: "kg" },
    { nombre: "Levadura fresca", unidad: "kg" },
    { nombre: "Manteca", unidad: "kg" },
    { nombre: "Margarina", unidad: "kg" },
    { nombre: "Azúcar", unidad: "kg" },
    { nombre: "Sal fina", unidad: "kg" },
    { nombre: "Huevos", unidad: "unidad" },
    { nombre: "Leche entera", unidad: "litros" },
    { nombre: "Grasa vacuna", unidad: "kg" },
    { nombre: "Almidón de maíz (fécula)", unidad: "kg" },
    { nombre: "Esencia de vainilla", unidad: "unidad" },
  ],
  pasteleria: [
    { nombre: "Chocolate cobertura semi amargo", unidad: "kg" },
    { nombre: "Chocolate cobertura blanco", unidad: "kg" },
    { nombre: "Crema de leche", unidad: "litros" },
    { nombre: "Queso crema", unidad: "kg" },
    { nombre: "Manteca sin sal", unidad: "kg" },
    { nombre: "Azúcar impalpable", unidad: "kg" },
    { nombre: "Cacao en polvo", unidad: "kg" },
    { nombre: "Arándanos frescos", unidad: "kg" },
    { nombre: "Limones", unidad: "unidad" },
    { nombre: "Maracuyá", unidad: "kg" },
    { nombre: "Gelatina sin sabor", unidad: "unidad" },
    { nombre: "Polvo de hornear", unidad: "unidad" },
    { nombre: "Bicarbonato de sodio", unidad: "unidad" },
  ],
  factureria: [
    { nombre: "Harina 0000", unidad: "kg" },
    { nombre: "Carne picada especial", unidad: "kg" },
    { nombre: "Pollo", unidad: "kg" },
    { nombre: "Jamón cocido", unidad: "kg" },
    { nombre: "Queso mozzarella", unidad: "kg" },
    { nombre: "Cebolla", unidad: "kg" },
    { nombre: "Espinaca", unidad: "kg" },
    { nombre: "Ricota", unidad: "kg" },
    { nombre: "Manzana verde", unidad: "kg" },
    { nombre: "Aceitunas verdes", unidad: "kg" },
    { nombre: "Pimentón dulce", unidad: "unidad" },
    { nombre: "Comino", unidad: "unidad" },
  ],
  especialidades: [
    { nombre: "Harina leudante", unidad: "kg" },
    { nombre: "Leche entera", unidad: "litros" },
    { nombre: "Huevos", unidad: "unidad" },
    { nombre: "Manteca", unidad: "kg" },
    { nombre: "Miel", unidad: "kg" },
    { nombre: "Avena arrollada", unidad: "kg" },
    { nombre: "Frutos secos surtidos", unidad: "kg" },
    { nombre: "Canela en polvo", unidad: "unidad" },
    { nombre: "Frutas de estación", unidad: "kg" },
    { nombre: "Jarabe de arce", unidad: "unidad" },
  ],
  sandwiches: [
    { nombre: "Lechuga mantecosa", unidad: "kg" },
    { nombre: "Tomate", unidad: "kg" },
    { nombre: "Palta/Aguacate", unidad: "kg" },
    { nombre: "Salmón ahumado", unidad: "kg" },
    { nombre: "Pechuga de pollo", unidad: "kg" },
    { nombre: "Queso brie", unidad: "kg" },
    { nombre: "Burrata", unidad: "unidad" },
    { nombre: "Rúcula", unidad: "kg" },
    { nombre: "Mayonesa", unidad: "kg" },
    { nombre: "Mostaza dijon", unidad: "unidad" },
    { nombre: "Tortillas de trigo", unidad: "unidad" },
  ],
};

// ---------------------------------------------------------------
// Catalog manager — loads from Firebase, falls back to seed data
// ---------------------------------------------------------------
const Catalogo = (() => {
  let _productos = null;
  let _insumos = null;

  async function _seedIfEmpty(ref, seed) {
    return new Promise((resolve) => {
      ref.once("value", async (snap) => {
        if (!snap.exists()) {
          // Write seed data
          const updates = {};
          seed.forEach((item) => {
            const key = ref.push().key;
            updates[key] = item;
          });
          await ref.update(updates);
          resolve(updates);
        } else {
          resolve(snap.val());
        }
      });
    });
  }

  async function init() {
    const db = firebase.database();

    // Ensure seed data exists for each area
    for (const area of PRODUCTION_ROLES) {
      const prodRef = db.ref(`catalogo/productos/${area}`);
      const insRef = db.ref(`catalogo/insumos/${area}`);

      await _seedIfEmpty(prodRef, SEED_PRODUCTOS[area] || []);
      await _seedIfEmpty(insRef, SEED_INSUMOS[area] || []);
    }
  }

  function getProductos(area, callback) {
    const db = firebase.database();
    return db.ref(`catalogo/productos/${area}`).on("value", (snap) => {
      callback(snap.val() || {});
    });
  }

  function getInsumos(area, callback) {
    const db = firebase.database();
    return db.ref(`catalogo/insumos/${area}`).on("value", (snap) => {
      callback(snap.val() || {});
    });
  }

  function getAllProductos(callback) {
    const db = firebase.database();
    return db.ref("catalogo/productos").on("value", (snap) => {
      callback(snap.val() || {});
    });
  }

  function getAllInsumos(callback) {
    const db = firebase.database();
    return db.ref("catalogo/insumos").on("value", (snap) => {
      callback(snap.val() || {});
    });
  }

  return { init, getProductos, getInsumos, getAllProductos, getAllInsumos };
})();
