/**
 * CANDELA CAFE & PATISSERIE — Control de Stock Semanal
 * Construye la planilla de captura en Google Sheets.
 *
 * COMO USARLO
 *   1. Crear una hoja de calculo NUEVA y VACIA en Google Sheets.
 *   2. Extensiones -> Apps Script.
 *   3. Borrar lo que haya y pegar TODO este archivo.
 *   4. Guardar (icono de disquete) y elegir la funcion "crearPlanilla".
 *   5. Ejecutar. La primera vez pide autorizacion: Revisar permisos -> elegir la
 *      cuenta -> Configuracion avanzada -> Ir a (nombre del proyecto) -> Permitir.
 *   6. Volver a la hoja de calculo: ya estan todas las pestanas creadas.
 *
 * Esta planilla es SOLO DE CARGA. El analisis (stock inicial + compras - ventas
 * - stock final) se hace aparte, sobre estos mismos datos.
 *
 * Generado desde el catalogo real de la app de Pedidos de Produccion.
 */

// ====================== DATOS DEL CATALOGO ======================
const AREAS     = [["panaderia", "Panadería"], ["pasteleria", "Pastelería"], ["especialidades", "Especialidades"], ["factureria", "Facturería"], ["sandwiches", "Sandwiches"], ["cocina_sl", "Cocina San Luis"]];
const INSUMOS   = [["Panadería", "Aceite de girasol", "L", 5, "NO", ""], ["Panadería", "Aceite de oliva", "L", 5, "NO", ""], ["Panadería", "Aditivo", "kg", 1, "NO", ""], ["Panadería", "Avena", "kg", 1, "NO", ""], ["Panadería", "Azucar", "kg", 1, "SI", ""], ["Panadería", "Azucar impalpable", "kg", 1, "NO", ""], ["Panadería", "Berlina", "kg", 1, "NO", ""], ["Panadería", "Bicarbonato de amonio", "kg", 1, "NO", ""], ["Panadería", "Bicarbonato de sodio", "kg", 1, "NO", ""], ["Panadería", "Canela en polvo", "kg", 1, "NO", ""], ["Panadería", "Fecula", "kg", 1, "NO", ""], ["Panadería", "Grasa", "kg", 1, "SI", ""], ["Panadería", "Harina 000 x25kg", "kg", 25, "SI", ""], ["Panadería", "Harina 0000 x25kg", "kg", 25, "SI", ""], ["Panadería", "Huevos", "u", 30, "SI", ""], ["Panadería", "Levadura", "kg", 1, "SI", ""], ["Panadería", "Margarina hojaldre", "kg", 1, "SI", ""], ["Panadería", "Margarina masa", "kg", 1, "SI", ""], ["Panadería", "Mejorador", "kg", 1, "NO", ""], ["Panadería", "Mix de semillas", "kg", 1, "NO", ""], ["Panadería", "Otentic", "kg", 1, "NO", ""], ["Panadería", "Panes blandos", "kg", 1, "NO", ""], ["Panadería", "Panes granos andinos", "kg", 1, "NO", ""], ["Panadería", "Panes multicereal", "kg", 1, "NO", ""], ["Panadería", "Panes salvado", "kg", 1, "NO", ""], ["Panadería", "Polvo para hornear", "kg", 1, "NO", ""], ["Panadería", "Premezcla muffin", "kg", 1, "NO", ""], ["Panadería", "Premezcla pan de papa", "kg", 1, "NO", ""], ["Panadería", "Premezcla pan de queso", "kg", 1, "NO", ""], ["Panadería", "Propionato de calcio", "kg", 1, "NO", ""], ["Panadería", "Sal", "kg", 1, "NO", ""], ["Panadería", "Salvado de trigo", "kg", 1, "NO", ""], ["Panadería", "Semillas de amapola", "kg", 1, "NO", ""], ["Panadería", "Semillas de sesamo", "kg", 1, "NO", ""], ["Panadería", "Spekkel", "kg", 1, "NO", ""], ["Panadería", "Oregano", "kg", 1, "NO", ""], ["Panadería", "Romero", "kg", 1, "NO", ""], ["Panadería", "Albahaca", "kg", 1, "NO", ""], ["Panadería", "Tomates cherry", "kg", 1, "NO", "Verdulería"], ["Panadería", "Cebolla morada", "kg", 1, "NO", "Verdulería"], ["Panadería", "Albahaca hidropónica", "kg", 1, "NO", "Verdulería"], ["Panadería", "Rúcula", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Almendras", "kg", 1, "SI", ""], ["Pastelería", "Arandanos congelados", "kg", 1, "SI", ""], ["Pastelería", "Azucar", "kg", 1, "SI", ""], ["Pastelería", "Azucar impalpable", "kg", 1, "NO", ""], ["Pastelería", "Baño alpino", "kg", 1, "SI", ""], ["Pastelería", "Baño lodiser semiamargo", "kg", 1, "SI", ""], ["Pastelería", "Cacao", "kg", 1, "NO", ""], ["Pastelería", "Chocolate chip", "kg", 1, "SI", ""], ["Pastelería", "Chocolate gotas", "kg", 1, "SI", ""], ["Pastelería", "Chocolate moldeo", "kg", 1, "SI", ""], ["Pastelería", "Coco rallado", "kg", 1, "NO", ""], ["Pastelería", "Confites mini", "kg", 1, "NO", ""], ["Pastelería", "Crema de leche", "L", 1, "SI", ""], ["Pastelería", "Crema Vegetal", "L", 1, "SI", ""], ["Pastelería", "Crocante de mani", "kg", 1, "NO", ""], ["Pastelería", "Dulce de leche repostero", "kg", 1, "SI", ""], ["Pastelería", "Dulce de membrillo", "kg", 1, "NO", ""], ["Pastelería", "Durazno al natural", "kg", 1, "NO", ""], ["Pastelería", "Esencia de vainilla", "L", 1, "NO", ""], ["Pastelería", "Fondant", "kg", 1, "NO", ""], ["Pastelería", "Fruta abrillantada", "kg", 1, "NO", ""], ["Pastelería", "Frutillas", "kg", 1, "NO", ""], ["Pastelería", "Frutos del bosque", "kg", 1, "SI", ""], ["Pastelería", "Galletas chocolinas", "kg", 1, "NO", ""], ["Pastelería", "Galletas oreo", "kg", 1, "NO", ""], ["Pastelería", "Huevos", "u", 30, "SI", ""], ["Pastelería", "Leche entera", "L", 1, "SI", ""], ["Pastelería", "Manteca", "kg", 1, "SI", ""], ["Pastelería", "Mermelada durazno", "kg", 1, "NO", ""], ["Pastelería", "Mermelada membrillo", "kg", 1, "NO", ""], ["Pastelería", "Miel de abeja", "kg", 5, "NO", ""], ["Pastelería", "Mix de frutos rojos", "kg", 1, "SI", ""], ["Pastelería", "Nueces", "kg", 1, "SI", ""], ["Pastelería", "Nutella", "kg", 1, "SI", ""], ["Pastelería", "Pistachos", "kg", 1, "SI", ""], ["Pastelería", "Satin carrot", "kg", 1, "NO", ""], ["Pastelería", "Tegral brownie", "kg", 1, "NO", ""], ["Pastelería", "Variegato Maracuya", "L", 1, "NO", ""], ["Pastelería", "Frutilla", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Arándanos", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Limón", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Durazno", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Kiwi", "kg", 1, "NO", "Verdulería"], ["Pastelería", "Ananá", "kg", 1, "NO", "Verdulería"], ["Especialidades", "Almidón de maiz", "kg", 1, "NO", ""], ["Especialidades", "Azucar", "kg", 1, "SI", ""], ["Especialidades", "Dulce de leche repostero", "kg", 1, "SI", ""], ["Especialidades", "Esencia de vainilla", "L", 1, "NO", ""], ["Especialidades", "Fecula", "kg", 1, "NO", ""], ["Especialidades", "Grasa", "kg", 1, "SI", ""], ["Especialidades", "Huevos", "u", 30, "SI", ""], ["Especialidades", "Jamon cocido", "kg", 1, "SI", ""], ["Especialidades", "Leche entera", "L", 1, "SI", ""], ["Especialidades", "Manteca", "kg", 1, "SI", ""], ["Especialidades", "Mayonesa", "kg", 1, "NO", ""], ["Especialidades", "Nueces", "kg", 1, "SI", ""], ["Especialidades", "Panes blandos", "kg", 1, "NO", ""], ["Especialidades", "Queso crema", "kg", 1, "SI", ""], ["Especialidades", "Queso cremoso", "kg", 1, "SI", ""], ["Especialidades", "Queso sardo", "kg", 1, "SI", ""], ["Especialidades", "Queso tybo", "kg", 1, "SI", ""], ["Especialidades", "Sal", "kg", 1, "NO", ""], ["Especialidades", "Tomates", "kg", 1, "NO", ""], ["Especialidades", "Tomates cherrys", "kg", 1, "NO", ""], ["Especialidades", "Naranja", "kg", 1, "NO", "Verdulería"], ["Especialidades", "Limón", "kg", 1, "NO", "Verdulería"], ["Especialidades", "Durazno", "kg", 1, "NO", "Verdulería"], ["Facturería", "Azucar", "kg", 1, "SI", ""], ["Facturería", "Berlina", "kg", 1, "NO", ""], ["Facturería", "Cacao", "kg", 1, "NO", ""], ["Facturería", "Crema de leche", "L", 1, "SI", ""], ["Facturería", "Crema Vegetal", "L", 1, "SI", ""], ["Facturería", "Dulce de leche repostero", "kg", 1, "SI", ""], ["Facturería", "Dulce de membrillo", "kg", 1, "NO", ""], ["Facturería", "Esencia de vainilla", "L", 1, "NO", ""], ["Facturería", "Grasa", "kg", 1, "SI", ""], ["Facturería", "Huevos", "u", 30, "SI", ""], ["Facturería", "Leche entera", "L", 1, "SI", ""], ["Facturería", "Levadura", "kg", 1, "SI", ""], ["Facturería", "Manteca", "kg", 1, "SI", ""], ["Facturería", "Margarina masa", "kg", 1, "SI", ""], ["Facturería", "Mermelada membrillo", "kg", 1, "NO", ""], ["Facturería", "Sal", "kg", 1, "NO", ""], ["Sandwiches", "Rúcula hidropónica", "kg", 1, "NO", "Verdulería"], ["Sandwiches", "Lechuga hidropónica", "kg", 1, "NO", "Verdulería"], ["Sandwiches", "Tomates", "kg", 1, "NO", "Verdulería"], ["Sandwiches", "Tomates cherry", "kg", 1, "NO", "Verdulería"], ["Sandwiches", "Albahaca hidropónica", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Detergente", "L", 5, "NO", ""], ["Cocina San Luis", "Lavandina", "L", 5, "NO", ""], ["Cocina San Luis", "Queso de máquina barra", "kg", 1, "SI", ""], ["Cocina San Luis", "Queso cheddar fetas", "kg", 1, "SI", ""], ["Cocina San Luis", "Queso roquefort", "kg", 1, "SI", ""], ["Cocina San Luis", "Queso parmesano rallo", "kg", 1, "SI", ""], ["Cocina San Luis", "Queso crema s/sabor", "kg", 1, "NO", ""], ["Cocina San Luis", "Jamón cocido paladini", "kg", 1, "SI", ""], ["Cocina San Luis", "Salame milán", "kg", 1, "SI", ""], ["Cocina San Luis", "Lomo ahumado feteado", "kg", 1, "SI", ""], ["Cocina San Luis", "Panceta ahumada feteada", "kg", 1, "SI", ""], ["Cocina San Luis", "Salchicha viena f/larga", "kg", 1, "NO", ""], ["Cocina San Luis", "Leche entera", "L", 1, "SI", ""], ["Cocina San Luis", "Crema de leche", "L", 1, "SI", ""], ["Cocina San Luis", "Pomelo", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Naranja", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Limón", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Lechuga crespa", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Tomate x kg", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Tomate Cherry x kg", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Rúcula", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Ciruela x kg", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Kiwi x kg", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Banana x unidad", "u", 1, "NO", "Verdulería"], ["Cocina San Luis", "Palta x kg", "kg", 1, "SI", "Verdulería"], ["Cocina San Luis", "Frutilla x kg", "kg", 1, "SI", "Verdulería"], ["Cocina San Luis", "Arándanos x caja", "caja", 1, "SI", "Verdulería"], ["Cocina San Luis", "Menta", "kg", 1, "NO", "Verdulería"], ["Cocina San Luis", "Jengibre x unidad", "u", 1, "NO", "Verdulería"]];   // [area, insumo, unidad, contenidoPorBulto, critico, proveedor]
const PRODUCTOS = [["Panadería", "Bagel", "u"], ["Panadería", "Bizcochos", "kg"], ["Panadería", "Bizcochos de margarina", "kg"], ["Panadería", "Bizcochos redondos", "kg"], ["Panadería", "Bollitos B/N", "u"], ["Panadería", "Bollos grandes", "u"], ["Panadería", "Caseras", "u"], ["Panadería", "Caseritas", "u"], ["Panadería", "Chatas", "kg"], ["Panadería", "Cremona", "u"], ["Panadería", "Focaccia", "u"], ["Panadería", "Libritos", "u"], ["Panadería", "Mini Baguette", "u"], ["Panadería", "Miñon", "kg"], ["Panadería", "Pan de hamburguesa x6", "u"], ["Panadería", "Pan de leche", "u"], ["Panadería", "Pan de papa grande", "u"], ["Panadería", "Pan de papa x4", "u"], ["Panadería", "Pan de Viena", "u"], ["Panadería", "Pan lactal blanco", "u"], ["Panadería", "Pan lactal granos andinos", "u"], ["Panadería", "Pan lactal multicereal", "u"], ["Panadería", "Pan lactal salvado", "u"], ["Panadería", "Pan tostadas blanco", "u"], ["Panadería", "Pan tostadas granos andinos", "u"], ["Panadería", "Pan tostadas multicereal", "u"], ["Panadería", "Pan tostadas salvado", "u"], ["Panadería", "Pizzetas x4", "u"], ["Panadería", "Pre-pizzas", "u"], ["Panadería", "Salvado", "u"], ["Panadería", "Tortillas", "u"], ["Panadería", "Tortillon", "u"], ["Panadería", "TT Bizcochos", "kg"], ["Panadería", "TT Bollitos blancos", "u"], ["Panadería", "TT Bollitos negros", "u"], ["Panadería", "TT Caseras", "u"], ["Panadería", "TT Caseritas", "u"], ["Panadería", "TT Chatas", "kg"], ["Panadería", "TT Facturas", "u"], ["Panadería", "TT Miñon", "kg"], ["Panadería", "TT Salvado", "u"], ["Panadería", "TT Tortillas", "u"], ["Pastelería", "Alemana", "u"], ["Pastelería", "Bariloche", "u"], ["Pastelería", "Cabsha", "u"], ["Pastelería", "Cheesecake frutos rojos", "u"], ["Pastelería", "Cheesecake maracuyá", "u"], ["Pastelería", "Cheesecake NY cocido", "u"], ["Pastelería", "Chocotorta", "u"], ["Pastelería", "Delicia con chocolates", "u"], ["Pastelería", "Delicia con frutas", "u"], ["Pastelería", "Lemon Pie", "u"], ["Pastelería", "Marquise", "u"], ["Pastelería", "Mini Cabsha", "u"], ["Pastelería", "Mini Lemon Pie", "u"], ["Pastelería", "Mini Turrón Salteño", "u"], ["Pastelería", "Minitarta frutal", "u"], ["Pastelería", "Nutella", "u"], ["Pastelería", "Oreo", "u"], ["Pastelería", "Porción Alemana", "u"], ["Pastelería", "Porción Bariloche", "u"], ["Pastelería", "Porción Brownie c/fruta", "u"], ["Pastelería", "Porción Brownie c/chocolates", "u"], ["Pastelería", "Porción Carrot Cake", "u"], ["Pastelería", "Porción Cheesecake frutos rojos", "u"], ["Pastelería", "Porción Cheesecake maracuyá", "u"], ["Pastelería", "Porción Oreo", "u"], ["Pastelería", "Porción Pistachos", "u"], ["Pastelería", "Porción Red Velvet", "u"], ["Pastelería", "Porción Selva Negra", "u"], ["Pastelería", "Porción Tiramisú", "u"], ["Pastelería", "Porción Tres Leches", "u"], ["Pastelería", "Rogel", "u"], ["Pastelería", "Selva Negra", "u"], ["Pastelería", "Tarta frutal", "u"], ["Pastelería", "Tiramisú", "u"], ["Pastelería", "Torta de duraznos", "u"], ["Pastelería", "Torta de hojaldre", "u"], ["Pastelería", "Tres Leches", "u"], ["Pastelería", "Turrón Salteño", "u"], ["Especialidades", "Alfajores choco blanco", "u"], ["Especialidades", "Alfajores choco negro", "u"], ["Especialidades", "Alfajores choco negro grande", "u"], ["Especialidades", "Alfajores impalpable", "u"], ["Especialidades", "Boulévant", "u"], ["Especialidades", "Budín x kg naranja y amapola", "kg"], ["Especialidades", "Budín x kg nuez y dulce", "kg"], ["Especialidades", "Budín x unidad chico", "u"], ["Especialidades", "Cañoncitos", "u"], ["Especialidades", "Carasucias", "u"], ["Especialidades", "Chipa", "u"], ["Especialidades", "Chipa crudo bandeja x30", "u"], ["Especialidades", "Chips p/sandwich", "u"], ["Especialidades", "Conitos", "u"], ["Especialidades", "Cookies chips choco", "u"], ["Especialidades", "Cupcake", "u"], ["Especialidades", "Donas", "u"], ["Especialidades", "Figazzas", "u"], ["Especialidades", "Galletas de agua", "u"], ["Especialidades", "Galletas de agua semillas", "u"], ["Especialidades", "Maicenas chicas", "u"], ["Especialidades", "Maicenas grandes", "u"], ["Especialidades", "Milhojas c/chocolate", "u"], ["Especialidades", "Milhojas c/fondant", "u"], ["Especialidades", "Palmeritas", "u"], ["Especialidades", "Pan saborizado", "u"], ["Especialidades", "Pasta frola de cayote", "u"], ["Especialidades", "Pasta frola membrillo", "u"], ["Especialidades", "Pepitas", "u"], ["Especialidades", "Pizzeta de copetín", "u"], ["Especialidades", "Plancha de hojaldre x kg", "kg"], ["Especialidades", "Scones con fruta", "u"], ["Especialidades", "Scones sin fruta", "u"], ["Especialidades", "Spekell", "kg"], ["Especialidades", "Strudel", "u"], ["Especialidades", "Torta x porción", "u"], ["Facturería", "Churros rellenos x unidad", "u"], ["Facturería", "Churros x unidad", "u"], ["Facturería", "Croissant", "u"], ["Facturería", "Facturas c/crema", "u"], ["Facturería", "Facturas c/crema y DDL", "u"], ["Facturería", "Facturas c/crema y membr.", "u"], ["Facturería", "Libritos", "u"], ["Facturería", "Medialunas", "u"], ["Facturería", "Medialunas crudas x16", "u"], ["Facturería", "Medialunas saladas", "u"], ["Facturería", "Minifacturas", "kg"], ["Facturería", "Pan dulce", "u"], ["Facturería", "Roll de canela", "u"], ["Facturería", "Sacramento jamón y queso", "u"], ["Facturería", "Sacramentos", "u"], ["Facturería", "Vigilantes", "u"], ["Sandwiches", "Ciabatta de Lomito ahumado, muzzarella y rúcula con oliva", "u"], ["Sandwiches", "Ciabatta de Muzzarella, provolone, albahaca y cherrys confitados", "u"], ["Sandwiches", "Baguette de jamón cocido, queso, lechuga y tomate", "u"], ["Sandwiches", "Baguette de salame y queso", "u"], ["Sandwiches", "Miga de jamón cocido y queso", "u"], ["Sandwiches", "Miga de Ternera y tomate", "u"], ["Sandwiches", "Miga de ternera y huevo", "u"], ["Sandwiches", "Miga de crudo y queso", "u"], ["Sandwiches", "Miga de cantimpalo y queso", "u"]];   // [area, producto, unidad]
const MOTIVOS   = ["Quemado / mal cocido", "Mal armado / defectuoso", "Vencido / pasado", "Caido / roto", "Sobrante no vendido", "Prueba / degustacion", "Consumo del personal", "Devolucion de local", "Otro"];
const UNIDADES  = ["kg", "u", "L", "caja", "docena", "bandeja"];
const TIPOS     = ["Consumo del personal", "Cortesia", "Prueba / degustacion", "Merma", "Otro"];
const PROD_SHEETS = {"panaderia": "4 Prod Panaderia", "pasteleria": "4 Prod Pasteleria", "especialidades": "4 Prod Especialidades", "factureria": "4 Prod Factureria", "sandwiches": "4 Prod Sandwiches", "cocina_sl": "4 Prod Cocina SL"}; // clave de area -> nombre de pestana
const EXTRA_FILAS = {"panaderia": 8, "pasteleria": 8, "especialidades": 8, "factureria": 8, "sandwiches": 8, "cocina_sl": 40}; // filas en blanco por area para productos nuevos

const DIAS = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'];

// ====================== PALETA (la de la app) ======================
const C_TIT   = '#4E2A1E';
const C_SUB   = '#6B3A2A';
const C_ACC   = '#F0C97A';
const C_BANDA = '#FFF8F0';
const C_INPUT = '#FFF3CD';
const C_BORDE = '#E8D5C0';
const C_CALC  = '#E8D5C0';
const FUENTE  = 'Arial';

const HOJAS = ['Instrucciones','Config','Insumos','Productos','1 Stock inicial','2 Compras',
               '3 Conteo diario'].concat(AREAS.map(function(a){return PROD_SHEETS[a[0]];}))
               .concat(['5 Descartes','6 Stock final','7 Ventas Fudo','8 Consumos internos',
                        '9 Recetas','Listas']);

// ====================== PUNTO DE ENTRADA ======================
function crearPlanilla() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // No pisar datos ya cargados.
  const existentes = ss.getSheets().map(function(h){ return h.getName(); })
                       .filter(function(n){ return HOJAS.indexOf(n) >= 0; });
  if (existentes.length > 0) {
    throw new Error('Esta hoja de calculo ya tiene pestanas de la planilla (' +
      existentes.join(', ') + '). Para no pisar datos cargados, ejecute el script ' +
      'en una hoja de calculo NUEVA Y VACIA.');
  }

  const previas = ss.getSheets();

  crearListas_(ss);
  crearInstrucciones_(ss);
  crearConfig_(ss);
  crearInsumos_(ss);
  crearProductos_(ss);
  crearStock_(ss, '1 Stock inicial', 'PLANILLA 1 - STOCK INICIAL DE INSUMOS',
    'Se cuenta el LUNES temprano, antes de producir. Bultos cerrados + lo que hay suelto del envase abierto.');
  crearCompras_(ss);
  crearConteoDiario_(ss);
  AREAS.forEach(function(a){ crearProduccion_(ss, a[0], a[1]); });
  crearDescartes_(ss);
  crearStock_(ss, '6 Stock final', 'PLANILLA 6 - STOCK FINAL DE INSUMOS',
    'Se cuenta el DOMINGO al cierre, con el mismo criterio que el inicial y, si se puede, la misma persona.');
  crearVentasFudo_(ss);
  crearConsumosInternos_(ss);
  crearRecetas_(ss);

  // Borrar las hojas que ya existian (la "Hoja 1" vacia por defecto).
  previas.forEach(function(h){
    if (h.getLastRow() === 0 && h.getLastColumn() === 0) { ss.deleteSheet(h); }
  });

  ss.setActiveSheet(ss.getSheetByName('Instrucciones'));
  SpreadsheetApp.getUi().alert('Listo. Se crearon ' + HOJAS.length +
    ' pestanas.\n\nSiguiente paso: revisar en la pestana "Insumos" la columna ' +
    'CONTENIDO POR BULTO, que viene inferida del nombre.');
}

// ====================== HELPERS ======================
function hoja_(ss, nombre) {
  const h = ss.insertSheet(nombre);
  h.getRange(1, 1, h.getMaxRows(), h.getMaxColumns()).setFontFamily(FUENTE).setFontSize(10);
  return h;
}

function titulo_(h, ncols, texto, sub) {
  h.getRange(1, 1, 1, ncols).merge().setValue(texto)
   .setBackground(C_TIT).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(13)
   .setVerticalAlignment('middle');
  h.setRowHeight(1, 30);
  h.getRange(2, 1, 1, ncols).merge().setValue(sub)
   .setBackground(C_SUB).setFontColor('#FFFFFF').setFontSize(9)
   .setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(2, 26);
}

function cabecera_(h, fila, encabezados) {
  h.getRange(fila, 1, 1, encabezados.length).setValues([encabezados])
   .setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9)
   .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(fila, 34);
}

function anchos_(h, ws) { ws.forEach(function(w, i){ h.setColumnWidth(i + 1, w); }); }

function input_(h, f, c, nf, nc) {
  h.getRange(f, c, nf, nc).setBackground(C_INPUT).setFontColor('#0000FF')
   .setBorder(true, true, true, true, true, true, C_BORDE, SpreadsheetApp.BorderStyle.SOLID);
}

function calc_(h, f, c, nf, nc) {
  h.getRange(f, c, nf, nc).setBackground(C_CALC).setFontWeight('bold');
}

function lista_(h, f, c, nf, rango) {
  const dv = SpreadsheetApp.newDataValidation().requireValueInRange(rango, true)
             .setAllowInvalid(true).build();
  h.getRange(f, c, nf, 1).setDataValidation(dv);
}

function bandas_(h, f, nf, nc) {
  for (var r = f; r < f + nf; r++) {
    if ((r - f) % 2 === 1) { h.getRange(r, 1, 1, nc).setBackground(C_BANDA); }
  }
}

/** Cabecera de dos filas: los 7 dias arriba, sub-columnas abajo. */
function cabeceraDias_(h, fijas, subs) {
  const nf = fijas.length;
  for (var i = 0; i < nf; i++) {
    h.getRange(1, i + 1, 2, 1).merge().setValue(fijas[i])
     .setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9)
     .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  }
  for (var d = 0; d < 7; d++) {
    const c0 = nf + 1 + d * subs.length;
    h.getRange(1, c0, 1, subs.length).merge()
     .setFormula('=IF(Config!$B$3="","' + DIAS[d].substring(0,3) + '",UPPER("' +
                 DIAS[d].substring(0,3) + '")&" "&TEXT(Config!$B$3+' + d + ',"dd/mm"))')
     .setBackground(C_ACC).setFontColor(C_TIT).setFontWeight('bold').setFontSize(9)
     .setHorizontalAlignment('center').setVerticalAlignment('middle');
    h.getRange(2, c0, 1, subs.length).setValues([subs])
     .setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(8)
     .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  }
  h.setRowHeight(1, 22); h.setRowHeight(2, 24);
  h.setFrozenRows(2); h.setFrozenColumns(nf);
}

function unicos_(arr, idx) {
  const vistos = {}, out = [];
  arr.forEach(function(r){ if (!vistos[r[idx]]) { vistos[r[idx]] = 1; out.push(r[idx]); } });
  return out;
}
function criticos_() { return INSUMOS.filter(function(r){ return r[4] === 'SI'; }); }
function rgAreas_(ss) { return ss.getSheetByName('Listas').getRange(2, 1, AREAS.length, 1); }
function rgInsumos_(ss) { return ss.getSheetByName('Listas').getRange(2, 2, unicos_(INSUMOS,1).length, 1); }
function rgMotivos_(ss) { return ss.getSheetByName('Listas').getRange(2, 3, MOTIVOS.length, 1); }
function rgUnidades_(ss) { return ss.getSheetByName('Listas').getRange(2, 4, UNIDADES.length, 1); }
function rgProductos_(ss) { return ss.getSheetByName('Listas').getRange(2, 5, unicos_(PRODUCTOS,1).length, 1); }
function rgTipos_(ss) { return ss.getSheetByName('Listas').getRange(2, 6, TIPOS.length, 1); }

// ====================== LISTAS (oculta) ======================
function crearListas_(ss) {
  const h = hoja_(ss, 'Listas');
  const col = function(a){ return a.map(function(v){ return [v]; }); };
  h.getRange(1,1,1,6).setValues([['AREAS','INSUMOS','MOTIVOS','UNIDADES','PRODUCTOS','TIPOS']])
   .setFontWeight('bold');
  const ar = AREAS.map(function(a){ return [a[1]]; });
  const iu = col(unicos_(INSUMOS,1)), pu = col(unicos_(PRODUCTOS,1));
  h.getRange(2,1,ar.length,1).setValues(ar);
  h.getRange(2,2,iu.length,1).setValues(iu);
  h.getRange(2,3,MOTIVOS.length,1).setValues(col(MOTIVOS));
  h.getRange(2,4,UNIDADES.length,1).setValues(col(UNIDADES));
  h.getRange(2,5,pu.length,1).setValues(pu);
  h.getRange(2,6,TIPOS.length,1).setValues(col(TIPOS));
  h.hideSheet();
}

// ====================== INSTRUCCIONES ======================
function crearInstrucciones_(ss) {
  const h = hoja_(ss, 'Instrucciones');
  anchos_(h, [30, 900]);
  titulo_(h, 2, 'CONTROL DE STOCK SEMANAL - CANDELA CAFE & PATISSERIE',
    'Planilla de CARGA. El analisis (stock inicial + compras - ventas - stock final) se hace aparte, sobre estos datos.');
  const G = [
   ['h','ANTES DE ARRANCAR'],
   ['li','Pestana CONFIG: poner la fecha del lunes de arranque y el jefe de cada area. Todas las fechas del libro se completan solas.'],
   ['li','Pestana INSUMOS: revisar CONTENIDO POR BULTO de los ' + INSUMOS.length + ' insumos. Vienen inferidos del nombre (ej. "Harina 000 x25kg" -> 25 kg por bulto) y hay que confirmarlos contra el envase real. Si esto esta mal, el analisis sale mal.'],
   ['li','Pestana INSUMOS, columna CRITICO: vienen ' + criticos_().length + ' marcados con SI. Son los unicos que se cuentan todos los dias.'],
   ['h','LO QUE SE CARGA TODOS LOS DIAS'],
   ['li','1 STOCK INICIAL - el lunes temprano, antes de producir. Todos los insumos, area por area.'],
   ['li','2 COMPRAS - cada vez que entra mercaderia, en el momento. Un ingreso sin anotar aparece despues como un faltante que no existe.'],
   ['li','3 CONTEO DIARIO - al cierre de cada jornada, solo los insumos criticos. Son unos 10 por area, 5 minutos.'],
   ['li','4 PRODUCCION (una pestana por area) - lo ELABORADO y lo DESCARTADO de cada producto, por dia.'],
   ['li','5 DESCARTES - una linea por cada cosa que se tira, CON EL MOTIVO. Es lo que despues justifica los faltantes.'],
   ['li','6 STOCK FINAL - el domingo al cierre, mismo criterio que el inicial.'],
   ['h','LO QUE SE CARGA AL TERMINAR LA SEMANA'],
   ['li','7 VENTAS FUDO - pegar el export de ventas por producto y mapear cada linea al producto y area de Candela.'],
   ['li','8 CONSUMOS INTERNOS - consumos del personal y cortesias registrados en Fudo. Sin esto, el consumo legitimo se confunde con robo.'],
   ['li','9 RECETAS (opcional) - cuanto insumo lleva cada producto. Si se completa, aunque sea de los 10 productos que mas se venden, la comparacion cierra a nivel insumo en vez de quedarse en el nivel producto.'],
   ['h','COMO CONTAR EL STOCK'],
   ['p','Bultos cerrados + lo que hay suelto del envase abierto. Ejemplo: 3 bolsas de 25 kg mas 8,5 kg sueltos -> BULTOS = 3, PARCIAL = 8,5. El TOTAL (83,5 kg) lo calcula la planilla.'],
   ['h','REGLA DE ORO'],
   ['p','Solo se escribe en las celdas AMARILLAS. Lo demas es formula o dato del catalogo: si se pisa, se rompe el analisis.'],
   ['warn','Con varias personas editando el mismo archivo alguien va a pisar una formula sin darse cuenta. Conviene proteger: Datos -> Proteger hojas y rangos. Y si algo sale mal, Archivo -> Historial de versiones permite volver atras.'],
  ];
  var r = 4;
  G.forEach(function(x){
    const tipo = x[0], txt = x[1];
    const cel = h.getRange(r, 2);
    if (tipo === 'h') {
      cel.setValue(txt).setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
      h.setRowHeight(r, 24);
    } else {
      cel.setValue(tipo === 'li' ? '   -  ' + txt : txt).setWrap(true).setVerticalAlignment('top');
      if (tipo === 'warn') { cel.setBackground('#FDECEA').setFontColor('#C0392B').setFontWeight('bold'); }
      h.setRowHeight(r, Math.max(20, 15 * Math.ceil(txt.length / 105)));
    }
    r++;
  });
  h.setFrozenRows(3);
}

// ====================== CONFIG ======================
function crearConfig_(ss) {
  const h = hoja_(ss, 'Config');
  anchos_(h, [230, 160, 260, 200]);
  titulo_(h, 4, 'CONFIGURACION DE LA SEMANA',
    'Completar solo las celdas amarillas. Las fechas de todas las pestanas salen de aca.');
  h.getRange(3,1).setValue('Fecha de inicio (lunes)').setFontWeight('bold');
  input_(h, 3, 2, 1, 1); h.getRange(3,2).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(3,3).setValue('Escriba aca la fecha del lunes en que arranca el control.').setFontStyle('italic').setFontColor('#7A5C4A');
  h.getRange(4,1).setValue('Fecha de cierre (domingo)').setFontWeight('bold');
  h.getRange(4,2).setFormula('=IF($B$3="","",$B$3+6)').setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');

  cabecera_(h, 6, ['DIA','FECHA','OBSERVACIONES DEL DIA','']);
  bandas_(h, 7, 7, 4);
  for (var i = 0; i < 7; i++) {
    const r = 7 + i;
    h.getRange(r,1).setValue(DIAS[i].charAt(0) + DIAS[i].substring(1).toLowerCase()).setFontWeight('bold');
    h.getRange(r,2).setFormula('=IF($B$3="","",$B$3+' + i + ')')
     .setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
    input_(h, r, 3, 1, 2);
  }

  h.getRange(15,1,1,4).merge().setValue('RESPONSABLES POR AREA')
   .setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold');
  cabecera_(h, 16, ['AREA','DONDE SE ELABORA','JEFE DE AREA','FIRMA / ACLARACION']);
  const filas = AREAS.map(function(a){
    return [a[1], a[0] === 'cocina_sl' ? 'Local San Luis' : 'Central', '', ''];
  });
  h.getRange(17, 1, filas.length, 4).setValues(filas);
  h.getRange(17, 1, filas.length, 1).setFontWeight('bold');
  bandas_(h, 17, filas.length, 4);
  input_(h, 17, 2, filas.length, 3);
  h.setFrozenRows(2);
}

// ====================== INSUMOS (maestro) ======================
function crearInsumos_(ss) {
  const h = hoja_(ss, 'Insumos');
  anchos_(h, [130, 260, 70, 110, 90, 120, 110]);
  titulo_(h, 7, 'MAESTRO DE INSUMOS DE PRODUCCION (' + INSUMOS.length + ')',
    'REVISAR ANTES DE ARRANCAR: UNIDAD y CONTENIDO POR BULTO se infirieron del nombre. Corregir lo que no coincida con el envase real.');
  cabecera_(h, 3, ['AREA','INSUMO','UNIDAD','CONTENIDO\nPOR BULTO','CRITICO\n(conteo diario)','PROVEEDOR','COSTO POR\nUNIDAD $']);
  const filas = INSUMOS.map(function(r){ return [r[0], r[1], r[2], r[3], r[4], r[5], '']; });
  h.getRange(4, 1, filas.length, 7).setValues(filas);
  h.getRange(4, 2, filas.length, 1).setFontWeight('bold');
  h.getRange(4, 3, filas.length, 3).setHorizontalAlignment('center');
  h.getRange(4, 4, filas.length, 1).setNumberFormat('#,##0.##');
  bandas_(h, 4, filas.length, 7);
  input_(h, 4, 3, filas.length, 5);
  h.getRange(4, 7, filas.length, 1).setNumberFormat('$#,##0.00');
  lista_(h, 4, 3, filas.length, rgUnidades_(ss));
  h.getRange(4, 5, filas.length, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['SI','NO'], true).setAllowInvalid(true).build());
  h.setFrozenRows(3); h.setFrozenColumns(2);
  h.getRange(3, 1, filas.length + 1, 7).createFilter();
}

// ====================== PRODUCTOS (maestro) ======================
function crearProductos_(ss) {
  const h = hoja_(ss, 'Productos');
  anchos_(h, [130, 420, 70, 130]);
  titulo_(h, 4, 'MAESTRO DE PRODUCTOS ELABORADOS (' + PRODUCTOS.length + ')',
    'Cocina San Luis no tiene productos en el catalogo de la app: se cargan a mano en su pestana de produccion.');
  cabecera_(h, 3, ['AREA','PRODUCTO','UNIDAD','DONDE SE ELABORA']);
  const filas = PRODUCTOS.map(function(r){
    return [r[0], r[1], r[2], r[0] === 'Cocina San Luis' ? 'Local San Luis' : 'Central'];
  });
  h.getRange(4, 1, filas.length, 4).setValues(filas);
  h.getRange(4, 3, filas.length, 2).setHorizontalAlignment('center');
  bandas_(h, 4, filas.length, 4);
  h.setFrozenRows(3); h.setFrozenColumns(2);
  h.getRange(3, 1, filas.length + 1, 4).createFilter();
}

// ====================== STOCK INICIAL / FINAL ======================
function crearStock_(ss, nombre, tit, sub) {
  const h = hoja_(ss, nombre);
  anchos_(h, [130, 260, 65, 95, 85, 85, 95, 90, 230]);
  titulo_(h, 9, tit, sub + '  |  Filtre por AREA para trabajar area por area.');
  cabecera_(h, 3, ['AREA','INSUMO','UNIDAD','CONTENIDO\nPOR BULTO','BULTOS\nCERRADOS',
                   'PARCIAL\n(suelto)','TOTAL\n(calculado)','CONTO\n(iniciales)','OBSERVACIONES']);
  const n = INSUMOS.length;
  const datos = INSUMOS.map(function(r){ return [r[0], r[1], r[2], r[3]]; });
  h.getRange(4, 1, n, 4).setValues(datos);
  h.getRange(4, 2, n, 1).setFontWeight('bold');
  h.getRange(4, 3, n, 2).setHorizontalAlignment('center');
  const fs = [];
  for (var i = 0; i < n; i++) {
    const r = 4 + i;
    fs.push(['=IF(AND(E' + r + '="",F' + r + '=""),"",IFERROR(E' + r + '*D' + r + ',0)+IFERROR(F' + r + ',0))']);
  }
  h.getRange(4, 7, n, 1).setFormulas(fs);
  input_(h, 4, 5, n, 2); input_(h, 4, 8, n, 2);
  calc_(h, 4, 7, n, 1);
  h.getRange(4, 4, n, 4).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  bandas_(h, 4, n, 4);
  h.setFrozenRows(3); h.setFrozenColumns(2);
  h.getRange(3, 1, n + 1, 9).createFilter();
}

// ====================== COMPRAS ======================
function crearCompras_(ss) {
  const h = hoja_(ss, '2 Compras');
  anchos_(h, [95, 160, 140, 130, 260, 110, 65, 120]);
  titulo_(h, 8, 'PLANILLA 2 - COMPRAS E INGRESOS DE MERCADERIA',
    'Una linea cada vez que entra mercaderia, EN EL MOMENTO. La CANTIDAD va en la unidad base del insumo (kg, u, L), no en bultos.');
  cabecera_(h, 3, ['FECHA','PROVEEDOR','N° REMITO / FACTURA','AREA','INSUMO',
                   'CANTIDAD\n(unidad base)','UNIDAD','IMPORTE TOTAL $']);
  const n = 200;
  input_(h, 4, 1, n, 8);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,6,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,7,n,1).setHorizontalAlignment('center');
  h.getRange(4,8,n,1).setNumberFormat('$#,##0.00');
  lista_(h, 4, 4, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgInsumos_(ss));
  lista_(h, 4, 7, n, rgUnidades_(ss));
  h.setFrozenRows(3);
  h.getRange(3, 1, n + 1, 8).createFilter();
}

// ====================== CONTEO DIARIO DE CRITICOS ======================
function crearConteoDiario_(ss) {
  const h = hoja_(ss, '3 Conteo diario');
  const crit = criticos_();
  anchos_(h, [130, 240, 60, 90, 70,70, 70,70, 70,70, 70,70, 70,70, 70,70, 70,70]);
  cabeceraDias_(h, ['AREA','INSUMO','UNID.','CONTENIDO\nPOR BULTO'], ['Bultos','Parcial']);
  const datos = crit.map(function(r){ return [r[0], r[1], r[2], r[3]]; });
  h.getRange(3, 1, crit.length, 4).setValues(datos);
  h.getRange(3, 2, crit.length, 1).setFontWeight('bold');
  h.getRange(3, 3, crit.length, 2).setHorizontalAlignment('center');
  input_(h, 3, 5, crit.length, 14);
  h.getRange(3, 5, crit.length, 14).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  bandas_(h, 3, crit.length, 4);
  h.getRange(2, 1, crit.length + 1, 18).createFilter();
}

// ====================== PRODUCCION DIARIA POR AREA ======================
function crearProduccion_(ss, clave, etiqueta) {
  const h = hoja_(ss, PROD_SHEETS[clave]);
  anchos_(h, [420, 60, 80,70, 80,70, 80,70, 80,70, 80,70, 80,70, 80,70]);
  cabeceraDias_(h, ['PRODUCTO - ' + etiqueta.toUpperCase(), 'UNID.'], ['Elaborado','Descarte']);
  const props = PRODUCTOS.filter(function(r){ return r[0] === etiqueta; });
  const extra = EXTRA_FILAS[clave] || 8;
  const total = props.length + extra;
  if (props.length > 0) {
    h.getRange(3, 1, props.length, 2).setValues(props.map(function(r){ return [r[1], r[2]]; }));
  }
  bandas_(h, 3, total, 2);
  if (extra > 0) { input_(h, 3 + props.length, 1, extra, 2); }
  h.getRange(3, 2, total, 1).setHorizontalAlignment('center');
  input_(h, 3, 3, total, 14);
  h.getRange(3, 3, total, 14).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
}

// ====================== DESCARTES ======================
function crearDescartes_(ss) {
  const h = hoja_(ss, '5 Descartes');
  anchos_(h, [95, 130, 340, 90, 65, 190, 130, 230]);
  titulo_(h, 8, 'PLANILLA 5 - DESCARTES, QUEMADO Y TIRADO',
    'Una linea por cada cosa que se descarta, CON EL MOTIVO. Lo que no se anota aca se lee despues como perdida sin explicacion.');
  cabecera_(h, 3, ['FECHA','AREA','PRODUCTO O INSUMO','CANTIDAD','UNIDAD','MOTIVO','RESPONSABLE','OBSERVACIONES']);
  const n = 200;
  input_(h, 4, 1, n, 8);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,5,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 2, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgUnidades_(ss));
  lista_(h, 4, 6, n, rgMotivos_(ss));
  h.setFrozenRows(3);
  h.getRange(3, 1, n + 1, 8).createFilter();
}

// ====================== VENTAS SEGUN FUDO ======================
function crearVentasFudo_(ss) {
  const h = hoja_(ss, '7 Ventas Fudo');
  anchos_(h, [320, 120, 140, 360]);
  titulo_(h, 4, 'CARGA 7 - VENTAS POR PRODUCTO SEGUN FUDO',
    'Pegar el export de Fudo en las columnas A y B. Despues indicar a que AREA y a que PRODUCTO de Candela corresponde cada linea: lo que no se mapea no entra en la comparacion.');
  cabecera_(h, 3, ['PRODUCTO SEGUN FUDO\n(pegar del export)','UNIDADES\nVENDIDAS','AREA DE CANDELA','PRODUCTO DE CANDELA']);
  const n = 300;
  input_(h, 4, 1, n, 4);
  h.getRange(4,2,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,3,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 3, n, rgAreas_(ss));
  lista_(h, 4, 4, n, rgProductos_(ss));
  h.setFrozenRows(3);
  h.getRange(3, 1, n + 1, 4).createFilter();
}

// ====================== CONSUMOS INTERNOS ======================
function crearConsumosInternos_(ss) {
  const h = hoja_(ss, '8 Consumos internos');
  anchos_(h, [95, 340, 130, 90, 65, 180, 150]);
  titulo_(h, 7, 'CARGA 8 - CONSUMOS INTERNOS Y CORTESIAS',
    'Todo lo que se consumio sin venderse: personal, cortesias, pruebas. Es lo que separa el consumo legitimo del faltante real.');
  cabecera_(h, 3, ['FECHA','PRODUCTO DE CANDELA','AREA','CANTIDAD','UNIDAD','TIPO','RESPONSABLE / SECTOR']);
  const n = 200;
  input_(h, 4, 1, n, 7);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,5,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 2, n, rgProductos_(ss));
  lista_(h, 4, 3, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgUnidades_(ss));
  lista_(h, 4, 6, n, rgTipos_(ss));
  h.setFrozenRows(3);
  h.getRange(3, 1, n + 1, 7).createFilter();
}

// ====================== RECETAS (opcional) ======================
function crearRecetas_(ss) {
  const h = hoja_(ss, '9 Recetas');
  anchos_(h, [130, 340, 260, 140, 65]);
  titulo_(h, 5, 'CARGA 9 - RECETAS / FICHAS TECNICAS  (OPCIONAL PERO MUY UTIL)',
    'Cuanto insumo lleva UNA unidad de cada producto. Con esto la comparacion cierra a nivel insumo: se puede calcular cuanta harina DEBERIA haberse usado segun lo que se vendio. Sin esto, la comparacion se queda a nivel producto. Alcanza con cargar los 10 o 15 productos que mas se venden.');
  cabecera_(h, 3, ['AREA','PRODUCTO','INSUMO','CANTIDAD POR UNIDAD\nDE PRODUCTO','UNIDAD']);
  const n = 300;
  input_(h, 4, 1, n, 5);
  h.getRange(4,1,n,1).setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.####').setHorizontalAlignment('center');
  h.getRange(4,5,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 1, n, rgAreas_(ss));
  lista_(h, 4, 2, n, rgProductos_(ss));
  lista_(h, 4, 3, n, rgInsumos_(ss));
  lista_(h, 4, 5, n, rgUnidades_(ss));
  h.setFrozenRows(3);
  h.getRange(3, 1, n + 1, 5).createFilter();
}
