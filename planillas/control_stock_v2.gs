/**
 * ============================================================================
 *  CANDELA CAFE & PATISSERIE — CONTROL DE STOCK (3 locales)
 *  Reconstruye TODA la hoja de calculo activa: borra lo que haya y arma
 *  las 20 pestanas del control de stock.
 * ============================================================================
 *
 *  COMO USARLO
 *    1. Abrir la hoja de calculo donde se va a armar el control
 *       (en tu caso: la que ya tenes creada — este script BORRA su contenido
 *       actual y lo reemplaza).
 *    2. Extensiones -> Apps Script.
 *    3. Borrar lo que haya en el editor y pegar TODO este archivo.
 *    4. Guardar, elegir la funcion "construirTodo" en el desplegable de
 *       funciones, y Ejecutar.
 *    5. La primera vez pide autorizacion: Revisar permisos -> elegir la
 *       cuenta -> Configuracion avanzada -> Ir a (nombre del proyecto) ->
 *       Permitir.
 *    6. Volver a la hoja: quedan las 20 pestanas armadas.
 *
 *  QUE MIDE
 *    Dos semanas, de MARTES a LUNES:
 *        Semana 1   martes 01/09  ->  lunes 07/09
 *        Semana 2   martes 22/09  ->  lunes 28/09
 *    En los 3 locales: Cuadra de Produccion (5 areas), SLA 5.0 (barra) y
 *    San Luis (barra + Cocina San Luis).
 *
 *  QUE SE OBTIENE (el analisis se hace aparte, sobre estos datos)
 *    - Consumo real por insumo = stock inicial + compras - stock final
 *    - Diferencia por producto = elaborado - vendido - consumo interno - descarte
 *
 *  LOS INSUMOS (227 filas, 43 criticos)
 *    Vienen del export real del modulo de costeo, ya depurado (9 productos
 *    fusionados, 8 precios imposibles descartados) y clasificado en 9
 *    AMBITOS: deposito central, las 5 areas de la cuadra, Barra SLA 5.0,
 *    Barra San Luis y Cocina San Luis. Los de barra/Cocina San Luis se
 *    asignaron por palabra clave: HAY QUE REVISARLOS, es lo menos seguro
 *    de este libro.
 *
 *  NO HAY conteo fisico diario de insumos: el unico movimiento que se
 *  registra durante la semana es la COMPRA de insumos criticos (desde
 *  las facturas). El resto de los insumos solo se cuenta al inicio y al
 *  final de cada semana.
 * ============================================================================
 */

// ====================== DATOS ======================
const AREAS = [["panaderia", "Panadería"], ["pasteleria", "Pastelería"], ["especialidades", "Especialidades"], ["factureria", "Facturería"], ["sandwiches", "Sandwiches"], ["cocina_sl", "Cocina San Luis"]];
// [ambito, insumo, unidad, contenidoPorBulto, critico, precio, proveedor]
const INSUMOS = [["Deposito central", "Propionato de calcio", "kg", 1.0, "SI", 19911.6632, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Almidon de maiz", "kg", 1.0, "NO", 2453.4359, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Aceite de girasol", "L", 5.0, "NO", 3241.861, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Aceite de oliva", "L", 1.0, "SI", 28116.0204, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Aditivo", "kg", 1.0, "NO", 6068.9994, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Albahaca", "kg", 1.0, "NO", 5000, "-Oy9i7sX4WQLLHbd5dNR"], ["Cocina San Luis", "Anana", "kg", 1.0, "NO", "", ""], ["Deposito central", "Anana en lata", "kg", 1.0, "NO", 3567.8148, "-Oy3x6PIXYLxiYAtPhXd"], ["Cocina San Luis", "Arandanos", "kg", 1.0, "NO", "", ""], ["Cocina San Luis", "Arandanos congelados", "kg", 1.0, "NO", 6561.1, "-Oy3x6_YT0XO-LGdauVw"], ["Deposito central", "Avena", "kg", 1.0, "NO", 2649.7064, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Azucar", "kg", 1.0, "SI", 1000, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Azucar mascabo", "kg", 1.0, "NO", 1542.7984, "-Oy3x6PIXYLxiYAtPhXd"], ["Cocina San Luis", "Banana", "docena", 1.0, "NO", 166.6667, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Chocolate baño semiamargo", "kg", 1.0, "NO", 13132.0009, "-Oy3x5HICG7dqWSc5Hqw::lodiser"], ["Barra SLA 5.0", "Baño moldeo c/leche", "kg", 1.0, "NO", 9713.5896, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Baño moldeo c/leche", "kg", 1.0, "NO", 9713.5896, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Berlina", "kg", 1.0, "NO", 6525.1669, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Bicarbonato de amonio", "kg", 1.0, "NO", 9279.88, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Brownie express", "kg", 1.0, "NO", 10791.6853, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Cacao", "kg", 1.0, "SI", 45065.6514, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Canela en polvo", "kg", 1.0, "SI", 30000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Cerezas en lata", "kg", 1.0, "NO", 16912.2111, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Chocolate chip", "kg", 1.0, "SI", 18891.8994, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Chocolate moldeo", "kg", 1.0, "NO", 9610.0031, "-Oy3x5zQJsff2tXic0En"], ["Barra SLA 5.0", "Chocolate para submarino", "kg", 1.0, "SI", 25000, "-Oy3x5CU1wbvKIrHD_Ap"], ["Barra San Luis", "Chocolate para submarino", "kg", 1.0, "SI", 25000, "-Oy3x5CU1wbvKIrHD_Ap"], ["Deposito central", "Chocolino", "kg", 1.0, "NO", 11145.8696, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Ciruelas", "kg", 1.0, "NO", "", ""], ["Deposito central", "Coco rallado", "kg", 1.0, "NO", 6859.06, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Colorante en pasta", "u", 1.0, "NO", 736.032, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Confites mini", "kg", 1.0, "NO", 14880, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Crema Vegetal", "L", 1.0, "SI", 8159.22, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Crocante de mani", "kg", 1.0, "NO", 11052.9991, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Culatello", "kg", 1.0, "NO", 15000, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Dulce de leche repostero", "kg", 25.0, "SI", 4416, "-Oy3x5M5XcdKeUTevCcM::campo quijano"], ["Barra SLA 5.0", "Dulcerio tres leches", "kg", 1.0, "NO", 868.5269, "-Oy3x5PQG-Q_8gCTDCC4"], ["Barra San Luis", "Dulcerio tres leches", "kg", 1.0, "NO", 868.5269, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Durazno al natural", "kg", 1.0, "NO", 2944.1513, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Emulsionante en pasta", "kg", 1.0, "SI", 25158.1909, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Fecula", "kg", 1.0, "NO", 2049.596, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Fondant", "kg", 1.0, "NO", 2766.936, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Fruta abrillantada", "kg", 1.0, "NO", "", ""], ["Cocina San Luis", "Frutillas", "kg", 1.0, "NO", 12857.1429, "-Oy9i7sX4WQLLHbd5dNR"], ["Cocina San Luis", "Frutillas congeladas", "kg", 1.0, "NO", 6100, "-Oy3x6_YT0XO-LGdauVw"], ["Deposito central", "Frutos del bosque", "kg", 1.0, "SI", 33057.85, "-Oy3x5CU1wbvKIrHD_Ap"], ["Deposito central", "Galletas chocolinas", "kg", 1.0, "NO", 9200, "-Oy3x5U5rkDaNIAPsni2"], ["Deposito central", "Galletas lincoln", "kg", 1.0, "NO", "", ""], ["Deposito central", "Galletas oreo", "kg", 1.0, "NO", 1400, "-Oy9iFzRrmC155dtg5_V"], ["Deposito central", "Galletas vainillas", "kg", 1.0, "NO", 7500, "-Oy9iFzRrmC155dtg5_V"], ["Deposito central", "Granas", "kg", 1.0, "NO", 4816.4055, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Grasa", "kg", 1.0, "SI", 5079.6, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Harina 0000 x25kg", "kg", 25.0, "SI", 840, "-Oy3x6BB2k7o0gjXohnv"], ["Deposito central", "Jalea fruta", "kg", 1.0, "NO", 1479.265, "-Oy3x5HICG7dqWSc5Hqw::calsa"], ["Deposito central", "Jamon cocido", "kg", 1.0, "NO", 14983.0936, "-Oy3x6PIXYLxiYAtPhXd"], ["Cocina San Luis", "Kiwi", "kg", 1.0, "NO", 4500, "-Oy9i7sX4WQLLHbd5dNR"], ["Barra SLA 5.0", "Leche de almendras", "L", 1.0, "NO", 2310.82, "-Oy3x79ILHmcrJFf2cFU"], ["Barra San Luis", "Leche de almendras", "L", 1.0, "NO", 2310.82, "-Oy3x79ILHmcrJFf2cFU"], ["Barra SLA 5.0", "Leche de coco", "L", 1.0, "NO", 3946.06, "-Oy3x79ILHmcrJFf2cFU"], ["Barra San Luis", "Leche de coco", "L", 1.0, "NO", 3946.06, "-Oy3x79ILHmcrJFf2cFU"], ["Barra SLA 5.0", "Leche deslactosada", "L", 1.0, "NO", 1435.26, "-Oy5lEAvhTTuFPOgLwJI"], ["Barra San Luis", "Leche deslactosada", "L", 1.0, "NO", 1435.26, "-Oy5lEAvhTTuFPOgLwJI"], ["Deposito central", "Lentejas chocolate", "kg", 1.0, "NO", 14903.7152, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Levadura", "kg", 1.0, "SI", 6742.1999, "-Oy3x5HICG7dqWSc5Hqw"], ["Barra SLA 5.0", "licor", "L", 1.0, "NO", 8550.6667, "-Oy3x5U5rkDaNIAPsni2"], ["Barra San Luis", "licor", "L", 1.0, "NO", 8550.6667, "-Oy3x5U5rkDaNIAPsni2"], ["Cocina San Luis", "Limon", "kg", 1.0, "NO", "", ""], ["Deposito central", "Mani filetiado", "kg", 1.0, "NO", 7890.8677, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Manzana verde", "kg", 1.0, "NO", "", ""], ["Deposito central", "Margarina hojaldre", "kg", 1.0, "SI", 5630.401, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Mayonesa", "kg", 2900.0, "NO", 3973.6567, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Mermelada ciruela", "kg", 1.0, "NO", 3112.2907, "_manual"], ["Deposito central", "Mermelada durazno", "kg", 1.0, "NO", 4078.8626, "-Oy3x6PIXYLxiYAtPhXd::oriel"], ["Deposito central", "Mermelada frutilla", "kg", 1.0, "NO", 5490.375, "-Oy3x6PIXYLxiYAtPhXd::orieta"], ["Deposito central", "Miel de abeja", "kg", 1.0, "SI", 29495.5824, "-Oy3x6PIXYLxiYAtPhXd"], ["Cocina San Luis", "Miel de caña", "kg", 1.0, "NO", 12754.2816, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Mix de frutos rojos", "kg", 1.0, "NO", 8700.0076, "-Oy3x6_YT0XO-LGdauVw"], ["Deposito central", "Mix de semillas", "kg", 1.0, "NO", 5208, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Mortadela", "kg", 1.0, "NO", 13290, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Mortadela con pistachos", "kg", 1.0, "NO", 10320.01, "-Oy3x6FgGm8bAAjccrbI"], ["Cocina San Luis", "Naranja — paquete lt", "L", 1.0, "NO", 1200, ""], ["Deposito central", "Nutella", "kg", 1.0, "SI", 29001.6501, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Oregano", "kg", 1.0, "NO", "", ""], ["Deposito central", "Otentic", "kg", 1.0, "SI", 57233.3025, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Panes blandos", "kg", 1.0, "NO", 6987.7559, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Panes granos andinos", "kg", 1.0, "NO", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4::puratos"], ["Deposito central", "Panes multicereal", "kg", 1.0, "NO", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4::puratos"], ["Deposito central", "Panes salvado", "kg", 1.0, "NO", "", ""], ["Deposito central", "Pasas de uva", "kg", 1.0, "NO", "", ""], ["Deposito central", "Pasta de pistachos", "kg", 1.0, "SI", 55851.2368, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Pernil", "kg", 1.0, "NO", 8667.8108, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Polvo para hornear", "kg", 1.0, "NO", 15358.8506, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla muffin", "kg", 1.0, "NO", 9043.9998, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla pan de papa", "kg", 1.0, "SI", 19039.4238, ""], ["Deposito central", "Premezcla pan de queso", "kg", 1.0, "NO", 6885.0028, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Pulpalist neutro", "kg", 1.0, "NO", 9426.8002, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Queso cremoso", "kg", 1.0, "NO", 7293.9, "-Oy5lEAvhTTuFPOgLwJI"], ["Deposito central", "Romero", "kg", 1.0, "NO", "", "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Sal", "kg", 1.0, "NO", "", "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Salame — Milan", "kg", 1.0, "NO", 17879.01, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Salamin — paquete unidad", "u", 1.0, "NO", 29580.0956, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Salsa de chocolate x900gr", "kg", 1.0, "NO", 6611.5667, "-Oy3x5CU1wbvKIrHD_Ap"], ["Deposito central", "Salsa para pizza", "kg", 1.0, "NO", 856.8, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Salvado de trigo", "kg", 20.0, "NO", 948.0876, "-Oy3x5HICG7dqWSc5Hqw::jupiter"], ["Deposito central", "Semillas de amapola", "kg", 1.0, "SI", 18600, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Semillas de sesamo", "kg", 1.0, "NO", 12400, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Spekkel", "kg", 1.0, "NO", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4"], ["Barra SLA 5.0", "Syrope avellanas", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Syrope avellanas", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra SLA 5.0", "Syrope caramelo", "L", 1.0, "NO", 13899.996, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Syrope caramelo", "L", 1.0, "NO", 13899.996, "-Oy3x5zQJsff2tXic0En"], ["Barra SLA 5.0", "Syrope coco", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Syrope coco", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra SLA 5.0", "Syrope vainilla", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Syrope vainilla", "L", 1.0, "NO", 13900, "-Oy3x5zQJsff2tXic0En"], ["Barra SLA 5.0", "Syrup Pistacho", "L", 1.0, "NO", 17099.9983, "-Oy3x5zQJsff2tXic0En"], ["Barra San Luis", "Syrup Pistacho", "L", 1.0, "NO", 17099.9983, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Tegral torta", "kg", 1.0, "NO", 7457.8272, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Tomates", "kg", 1.0, "NO", 3000, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Tomates cherrys", "kg", 1.0, "NO", 2000, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Tulipas", "kg", 1.0, "NO", "", "_manual"], ["Deposito central", "Variegato Frutos del bosque", "kg", 1.0, "NO", 11764.624, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Variegato Maracuya", "kg", 1.0, "NO", 10821.8183, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Yogurt natural", "kg", 1.0, "NO", 5320, "-Oy9iSi3RKNpfwUiMVPE"], ["Deposito central", "Pistachos", "kg", 1.0, "SI", 39000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Bicarbonato de sodio", "kg", 1.0, "NO", 12000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Satin carrot", "kg", 1.0, "NO", 8855.8518, ""], ["Deposito central", "Premezcla brownie x3kg", "kg", 3.0, "NO", 11593.9982, ""], ["Deposito central", "Bondiola", "kg", 1.0, "SI", 27759.4691, ""], ["Deposito central", "Tegral brownie", "kg", 1.0, "NO", 11056.9824, ""], ["Barra SLA 5.0", "café instantaneo", "kg", 1.0, "SI", 6252.0942, ""], ["Barra San Luis", "café instantaneo", "kg", 1.0, "SI", 6252.0942, ""], ["Deposito central", "queso roquefort", "kg", 1.0, "NO", 14027.53, ""], ["Deposito central", "Cantimpalo", "kg", 1.0, "SI", 28023.6, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Lomito ahumado", "kg", 1.0, "SI", 37606.3039, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Pan de miga", "kg", 1.0, "NO", 12500, "-Oy3x6pWOEfg-38KOqwf"], ["Barra SLA 5.0", "Café — paquete 1/4", "u", 1.0, "NO", 13960.7, ""], ["Barra San Luis", "Café — paquete 1/4", "u", 1.0, "NO", 13960.7, ""], ["Deposito central", "Agua saboriz", "u", 1.0, "NO", 3200, ""], ["Deposito central", "Agua", "u", 1.0, "NO", 2500, ""], ["Deposito central", "Bagel", "kg", 1.0, "NO", 800, ""], ["Deposito central", "Churro", "u", 1.0, "NO", 600, ""], ["Deposito central", "Cookies", "u", 1.0, "NO", "", ""], ["Deposito central", "Croissant", "kg", 1.0, "NO", 1000, ""], ["Deposito central", "Donas", "kg", 1.0, "NO", 1400, ""], ["Cocina San Luis", "Durazno", "kg", 1.0, "NO", 1361, ""], ["Deposito central", "Focaccia", "kg", 1.0, "NO", 1000, ""], ["Deposito central", "Frutas", "kg", 1.0, "NO", 11040, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Ganache", "kg", 1.0, "NO", "", ""], ["Deposito central", "Gaseosa", "u", 1.0, "NO", 3200, ""], ["Cocina San Luis", "Helado", "kg", 1.0, "NO", 2400, ""], ["Barra SLA 5.0", "Leche Descremada", "L", 1.0, "NO", 1052.22, ""], ["Barra San Luis", "Leche Descremada", "L", 1.0, "NO", 1052.22, ""], ["Deposito central", "Lechuga", "kg", 1.0, "NO", "", ""], ["Deposito central", "MiniBaguette", "kg", 1.0, "NO", "", ""], ["Deposito central", "Queso crema x pouch", "kg", 1.0, "SI", 40387.6, "-OyYs0PCr53ZOD2Famxb::casancrem"], ["Deposito central", "Sirope", "kg", 1.0, "NO", "", ""], ["Deposito central", "Soda", "L", 1.0, "NO", 500, ""], ["Deposito central", "Tortillas", "u", 1.0, "NO", "", ""], ["Deposito central", "Tostadas Blancas", "kg", 1.0, "NO", 3500, ""], ["Deposito central", "Tostadas Granos Andinos", "kg", 1.0, "NO", 4200, ""], ["Deposito central", "Tostadas Multicereal", "kg", 1.0, "NO", 4200, ""], ["Deposito central", "Tostadas Salvados", "kg", 1.0, "NO", 3800, ""], ["Deposito central", "Hielo", "u", 1.0, "NO", 1000, ""], ["Barra SLA 5.0", "Azucar en Sobre", "kg", 1.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Barra San Luis", "Azucar en Sobre", "kg", 1.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Miga de jamon cocido", "kg", 1.0, "NO", "", ""], ["Deposito central", "Miga de jamon crudo", "kg", 1.0, "NO", "", ""], ["Deposito central", "Claras", "kg", 1.0, "NO", "", ""], ["Deposito central", "Premezcla Easy Pannettone", "kg", 1.0, "NO", "", ""], ["Deposito central", "Yemas", "kg", 1.0, "NO", "", ""], ["Deposito central", "Almendras", "kg", 1.0, "SI", 34720, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Azucar impalpable", "kg", 1.0, "NO", 3027.2784, "-Oy3x5HICG7dqWSc5Hqw"], ["Barra SLA 5.0", "Crema de leche", "kg", 1.0, "SI", 26012.19, "-Oy5lEAvhTTuFPOgLwJI"], ["Barra San Luis", "Crema de leche", "kg", 1.0, "SI", 26012.19, "-Oy5lEAvhTTuFPOgLwJI"], ["Deposito central", "Dulce de membrillo", "kg", 1.0, "NO", 3940.6022, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Esencia de vainilla", "kg", 1.0, "NO", 2683.2331, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Granola", "kg", 1.0, "NO", 13800, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Harina 000 x25kg", "kg", 25.0, "SI", 840, "-Oy3x6BB2k7o0gjXohnv"], ["Deposito central", "Huevos", "kg", 1.0, "SI", 4000, "-Oy9iHFKHzQfOCWS2yMx::lila"], ["Deposito central", "Jamon crudo", "kg", 1.0, "SI", 47650.01, "-Oy3x6FgGm8bAAjccrbI::la francisca"], ["Barra SLA 5.0", "Leche entera", "kg", 1.0, "SI", 1462.164, "-Oy3x5hUUrbMdfLny41w"], ["Barra San Luis", "Leche entera", "kg", 1.0, "SI", 1462.164, "-Oy3x5hUUrbMdfLny41w"], ["Deposito central", "Manteca", "kg", 1.0, "SI", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Margarina masa", "kg", 1.0, "SI", 5630.402, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Mermelada de membrillo", "kg", 1.0, "NO", 2254.5065, "-Oy3x5zQJsff2tXic0En"], ["Cocina San Luis", "Naranja", "kg", 1.0, "NO", 4500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Nueces", "kg", 1.0, "NO", 15000, "_manual"], ["Deposito central", "Palta", "kg", 1.0, "NO", 6500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Queso azul", "kg", 1.0, "SI", 25054.8324, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Queso de cabra", "kg", 1.0, "NO", 13900, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Queso sardo", "kg", 1.0, "NO", 13294.7056, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Queso tybo", "kg", 1.0, "SI", 33403.02, "-Oy3x6PIXYLxiYAtPhXd::la paulina"], ["Deposito central", "Rucula", "kg", 1.0, "NO", 500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Yogurt griego", "kg", 1.0, "NO", 6110, "-Oy9iSi3RKNpfwUiMVPE::mykra"], ["Deposito central", "Gelatina S/Sabor", "kg", 1.0, "SI", 47619.0476, "_manual"], ["Barra SLA 5.0", "Saquito de Te La Virginia", "kg", 1.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Barra San Luis", "Saquito de Te La Virginia", "kg", 1.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Salsa Inglesa", "kg", 1.0, "NO", 1319.0528, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Premezcla budin chocolate", "kg", 1.0, "NO", 7718.0011, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla budin vainilla", "kg", 1.0, "NO", 5422.9982, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Queso muzzarella", "kg", 1.0, "SI", 22473.33, "-Oy3x6PIXYLxiYAtPhXd::aurora"], ["Barra SLA 5.0", "Café en grano x kg", "kg", 1.0, "SI", 49610, "-Oy3x5kjWPRVdMK1uF8i::cherry’s season"], ["Barra San Luis", "Café en grano x kg", "kg", 1.0, "SI", 49610, "-Oy3x5kjWPRVdMK1uF8i::cherry’s season"], ["Barra SLA 5.0", "Crema Chantilly", "kg", 1.0, "NO", 5385.901122, "_manual"], ["Barra San Luis", "Crema Chantilly", "kg", 1.0, "NO", 5385.901122, "_manual"], ["Deposito central", "Bizcochuelo de Vainilla", "kg", 1.0, "NO", 3158.9565846875003, "_manual"], ["Deposito central", "Almibar Para Tortas", "kg", 1.0, "NO", 3565.2709519107993, "_manual"], ["Deposito central", "Masa Frola", "kg", 1.0, "NO", 1374.5139795999999, "_manual"], ["Barra SLA 5.0", "Crema Pastelera", "kg", 1.0, "NO", 1634.8938451722, "_manual"], ["Barra San Luis", "Crema Pastelera", "kg", 1.0, "NO", 1634.8938451722, "_manual"], ["Deposito central", "Almibar P/Facturas", "kg", 1.0, "NO", 2155.3277617146, "_manual"], ["Deposito central", "Powerade Mountain Blast", "u", 1.0, "NO", 11040, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Sprite 1.5L", "u", 1.0, "SI", 19999.88, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Sprite 2.25L", "u", 1.0, "SI", 24999.87, "-Oy3x5cgg3zdamPydBR_"], ["Cocina San Luis", "Smoothie mix violeta", "kg", 1.0, "NO", 5792.86, "-Oy3x6_YT0XO-LGdauVw::alif"], ["Cocina San Luis", "Smoothie mix amarillo", "kg", 1.0, "NO", 5792.86, "-Oy3x6_YT0XO-LGdauVw::alif"], ["Deposito central", "Vela corta", "u", 1.0, "NO", 1652.89, "-OyYsCLjF8XwEJhXle4Q"], ["Deposito central", "Bengala Gibre", "kg", 1.0, "NO", 826.45, "-OyYsCLjF8XwEJhXle4Q"], ["Deposito central", "Peceto", "kg", 1.0, "SI", 20000, "-Oy3x5sggwuQBtMEb2uy"], ["Deposito central", "Dulce de cayote", "kg", 1.0, "NO", 4000, "-OyZ4ZPPwu1kisPflQT4"], ["Barra SLA 5.0", "Stevia hileret x 400 sobres", "u", 400.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Barra San Luis", "Stevia hileret x 400 sobres", "u", 400.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Barra SLA 5.0", "Edulcorante hileret forte x 400 sobres", "u", 400.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Barra San Luis", "Edulcorante hileret forte x 400 sobres", "u", 400.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Higienol", "u", 30.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Horma", "u", 1.0, "NO", "", "-Oy3x6PIXYLxiYAtPhXd"]];
// [ambito/area, producto, unidad]
const PRODUCTOS = [["Panadería", "Bagel", "u"], ["Panadería", "Bizcochos", "kg"], ["Panadería", "Bizcochos de margarina", "kg"], ["Panadería", "Bizcochos redondos", "kg"], ["Panadería", "Bollitos B/N", "u"], ["Panadería", "Bollos grandes", "u"], ["Panadería", "Caseras", "u"], ["Panadería", "Caseritas", "u"], ["Panadería", "Chatas", "kg"], ["Panadería", "Cremona", "u"], ["Panadería", "Focaccia", "u"], ["Panadería", "Libritos", "u"], ["Panadería", "Mini Baguette", "u"], ["Panadería", "Miñon", "kg"], ["Panadería", "Pan de hamburguesa x6", "u"], ["Panadería", "Pan de leche", "u"], ["Panadería", "Pan de papa grande", "u"], ["Panadería", "Pan de papa x4", "u"], ["Panadería", "Pan de Viena", "u"], ["Panadería", "Pan lactal blanco", "u"], ["Panadería", "Pan lactal granos andinos", "u"], ["Panadería", "Pan lactal multicereal", "u"], ["Panadería", "Pan lactal salvado", "u"], ["Panadería", "Pan tostadas blanco", "u"], ["Panadería", "Pan tostadas granos andinos", "u"], ["Panadería", "Pan tostadas multicereal", "u"], ["Panadería", "Pan tostadas salvado", "u"], ["Panadería", "Pizzetas x4", "u"], ["Panadería", "Pre-pizzas", "u"], ["Panadería", "Salvado", "u"], ["Panadería", "Tortillas", "u"], ["Panadería", "Tortillon", "u"], ["Panadería", "TT Bizcochos", "kg"], ["Panadería", "TT Bollitos blancos", "u"], ["Panadería", "TT Bollitos negros", "u"], ["Panadería", "TT Caseras", "u"], ["Panadería", "TT Caseritas", "u"], ["Panadería", "TT Chatas", "kg"], ["Panadería", "TT Facturas", "u"], ["Panadería", "TT Miñon", "kg"], ["Panadería", "TT Salvado", "u"], ["Panadería", "TT Tortillas", "u"], ["Pastelería", "Alemana", "u"], ["Pastelería", "Bariloche", "u"], ["Pastelería", "Cabsha", "u"], ["Pastelería", "Cheesecake frutos rojos", "u"], ["Pastelería", "Cheesecake maracuyá", "u"], ["Pastelería", "Cheesecake NY cocido", "u"], ["Pastelería", "Chocotorta", "u"], ["Pastelería", "Delicia con chocolates", "u"], ["Pastelería", "Delicia con frutas", "u"], ["Pastelería", "Lemon Pie", "u"], ["Pastelería", "Marquise", "u"], ["Pastelería", "Mini Cabsha", "u"], ["Pastelería", "Mini Lemon Pie", "u"], ["Pastelería", "Mini Turrón Salteño", "u"], ["Pastelería", "Minitarta frutal", "u"], ["Pastelería", "Nutella", "u"], ["Pastelería", "Oreo", "u"], ["Pastelería", "Porción Alemana", "u"], ["Pastelería", "Porción Bariloche", "u"], ["Pastelería", "Porción Brownie c/fruta", "u"], ["Pastelería", "Porción Brownie c/chocolates", "u"], ["Pastelería", "Porción Carrot Cake", "u"], ["Pastelería", "Porción Cheesecake frutos rojos", "u"], ["Pastelería", "Porción Cheesecake maracuyá", "u"], ["Pastelería", "Porción Oreo", "u"], ["Pastelería", "Porción Pistachos", "u"], ["Pastelería", "Porción Red Velvet", "u"], ["Pastelería", "Porción Selva Negra", "u"], ["Pastelería", "Porción Tiramisú", "u"], ["Pastelería", "Porción Tres Leches", "u"], ["Pastelería", "Rogel", "u"], ["Pastelería", "Selva Negra", "u"], ["Pastelería", "Tarta frutal", "u"], ["Pastelería", "Tiramisú", "u"], ["Pastelería", "Torta de duraznos", "u"], ["Pastelería", "Torta de hojaldre", "u"], ["Pastelería", "Tres Leches", "u"], ["Pastelería", "Turrón Salteño", "u"], ["Especialidades", "Alfajores choco blanco", "u"], ["Especialidades", "Alfajores choco negro", "u"], ["Especialidades", "Alfajores choco negro grande", "u"], ["Especialidades", "Alfajores impalpable", "u"], ["Especialidades", "Boulévant", "u"], ["Especialidades", "Budín x kg naranja y amapola", "kg"], ["Especialidades", "Budín x kg nuez y dulce", "kg"], ["Especialidades", "Budín x unidad chico", "u"], ["Especialidades", "Cañoncitos", "u"], ["Especialidades", "Carasucias", "u"], ["Especialidades", "Chipa", "u"], ["Especialidades", "Chipa crudo bandeja x30", "u"], ["Especialidades", "Chips p/sandwich", "u"], ["Especialidades", "Conitos", "u"], ["Especialidades", "Cookies chips choco", "u"], ["Especialidades", "Cupcake", "u"], ["Especialidades", "Donas", "u"], ["Especialidades", "Figazzas", "u"], ["Especialidades", "Galletas de agua", "u"], ["Especialidades", "Galletas de agua semillas", "u"], ["Especialidades", "Maicenas chicas", "u"], ["Especialidades", "Maicenas grandes", "u"], ["Especialidades", "Milhojas c/chocolate", "u"], ["Especialidades", "Milhojas c/fondant", "u"], ["Especialidades", "Palmeritas", "u"], ["Especialidades", "Pan saborizado", "u"], ["Especialidades", "Pasta frola de cayote", "u"], ["Especialidades", "Pasta frola membrillo", "u"], ["Especialidades", "Pepitas", "u"], ["Especialidades", "Pizzeta de copetín", "u"], ["Especialidades", "Plancha de hojaldre x kg", "kg"], ["Especialidades", "Scones con fruta", "u"], ["Especialidades", "Scones sin fruta", "u"], ["Especialidades", "Spekell", "kg"], ["Especialidades", "Strudel", "u"], ["Especialidades", "Torta x porción", "u"], ["Facturería", "Churros rellenos x unidad", "u"], ["Facturería", "Churros x unidad", "u"], ["Facturería", "Croissant", "u"], ["Facturería", "Facturas c/crema", "u"], ["Facturería", "Facturas c/crema y DDL", "u"], ["Facturería", "Facturas c/crema y membr.", "u"], ["Facturería", "Libritos", "u"], ["Facturería", "Medialunas", "u"], ["Facturería", "Medialunas crudas x16", "u"], ["Facturería", "Medialunas saladas", "u"], ["Facturería", "Minifacturas", "kg"], ["Facturería", "Pan dulce", "u"], ["Facturería", "Roll de canela", "u"], ["Facturería", "Sacramento jamón y queso", "u"], ["Facturería", "Sacramentos", "u"], ["Facturería", "Vigilantes", "u"], ["Sandwiches", "Ciabatta de Lomito ahumado, muzzarella y rúcula con oliva", "u"], ["Sandwiches", "Ciabatta de Muzzarella, provolone, albahaca y cherrys confitados", "u"], ["Sandwiches", "Baguette de jamón cocido, queso, lechuga y tomate", "u"], ["Sandwiches", "Baguette de salame y queso", "u"], ["Sandwiches", "Miga de jamón cocido y queso", "u"], ["Sandwiches", "Miga de Ternera y tomate", "u"], ["Sandwiches", "Miga de ternera y huevo", "u"], ["Sandwiches", "Miga de crudo y queso", "u"], ["Sandwiches", "Miga de cantimpalo y queso", "u"], ["Barra SLA 5.0", "Espresso", "u"], ["Barra San Luis", "Espresso", "u"], ["Barra SLA 5.0", "Doppio", "u"], ["Barra San Luis", "Doppio", "u"], ["Barra SLA 5.0", "Cortadito", "u"], ["Barra San Luis", "Cortadito", "u"], ["Barra SLA 5.0", "Americano", "u"], ["Barra San Luis", "Americano", "u"], ["Barra SLA 5.0", "Flat white", "u"], ["Barra San Luis", "Flat white", "u"], ["Barra SLA 5.0", "Capuccino", "u"], ["Barra San Luis", "Capuccino", "u"], ["Barra SLA 5.0", "Latte", "u"], ["Barra San Luis", "Latte", "u"], ["Barra SLA 5.0", "Latte saborizado", "u"], ["Barra San Luis", "Latte saborizado", "u"], ["Barra SLA 5.0", "Mocaccino", "u"], ["Barra San Luis", "Mocaccino", "u"], ["Barra SLA 5.0", "Lágrima", "u"], ["Barra San Luis", "Lágrima", "u"], ["Barra SLA 5.0", "Filtrado", "u"], ["Barra San Luis", "Filtrado", "u"], ["Barra SLA 5.0", "Cold brew", "u"], ["Barra San Luis", "Cold brew", "u"], ["Barra SLA 5.0", "Café tónico", "u"], ["Barra San Luis", "Café tónico", "u"], ["Barra SLA 5.0", "Americano frío", "u"], ["Barra San Luis", "Americano frío", "u"], ["Barra SLA 5.0", "Latte frío", "u"], ["Barra San Luis", "Latte frío", "u"], ["Barra SLA 5.0", "Latte dulce frío", "u"], ["Barra San Luis", "Latte dulce frío", "u"], ["Barra SLA 5.0", "Chocolatada", "u"], ["Barra San Luis", "Chocolatada", "u"], ["Barra SLA 5.0", "Submarino", "u"], ["Barra San Luis", "Submarino", "u"], ["Barra SLA 5.0", "Té e infusiones", "u"], ["Barra San Luis", "Té e infusiones", "u"], ["Cocina San Luis", "Frappuccino", "u"], ["Cocina San Luis", "Licuado", "u"], ["Cocina San Luis", "Smoothie", "u"], ["Cocina San Luis", "Jugo natural exprimido (vaso)", "u"], ["Cocina San Luis", "Jugo natural exprimido (1 L)", "u"], ["Cocina San Luis", "Limonada", "u"], ["Cocina San Luis", "Limonada rosa", "u"], ["Cocina San Luis", "Pomelada", "u"]];
const MOTIVOS  = ["Quemado / mal cocido", "Mal armado / defectuoso", "Vencido / pasado", "Caido / roto", "Sobrante no vendido", "Prueba / degustacion", "Consumo del personal", "Devolucion de local", "Otro"];
const UNIDADES = ["kg", "u", "L", "caja", "docena", "bandeja"];
const TIPOS    = ["Consumo del personal", "Cortesia", "Prueba / degustacion", "Merma", "Otro"];
const AMBITOS  = ["Deposito central", "Panadería", "Pastelería", "Especialidades", "Facturería", "Sandwiches", "Barra SLA 5.0", "Barra San Luis", "Cocina San Luis"];
const PROD_SHEET = {"panaderia": "3 Prod Panaderia", "pasteleria": "3 Prod Pasteleria", "especialidades": "3 Prod Especialidades", "factureria": "3 Prod Factureria", "sandwiches": "3 Prod Sandwiches"};   // area cuadra -> nombre de pestana

// Fechas por defecto; se pueden cambiar en la pestana Config.
const S1_INICIO = new Date(2026, 8, 1);   // martes 01/09/2026
const S2_INICIO = new Date(2026, 8, 22);  // martes 22/09/2026
const DIAS = ['MAR','MIE','JUE','VIE','SAB','DOM','LUN'];

// ====================== PALETA (la de la app) ======================
const C_TIT='#4E2A1E', C_SUB='#6B3A2A', C_ACC='#F0C97A', C_ACC2='#E3F0FF';
const C_BANDA='#FFF8F0', C_INPUT='#FFF3CD', C_BORDE='#E8D5C0', C_CALC='#E8D5C0';
const FUENTE='Arial';

const HOJAS = ['Instrucciones','Config','Insumos','Productos','1 Stock','2 Compras',
  '3 Prod Panaderia','3 Prod Pasteleria','3 Prod Especialidades','3 Prod Factureria',
  '3 Prod Sandwiches','3 Prod Barra SLA','3 Prod Barra SL','3 Prod Cocina SL',
  '4 Descartes','5 Ventas Fudo','6 Fudo Stock Insumos','7 Fudo Stock Productos',
  '8 Consumos internos','Listas'];

// ====================== PUNTO DE ENTRADA ======================
function construirTodo() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert('Reconstruir la hoja de calculo',
    'Esto BORRA TODAS las pestanas actuales de esta hoja de calculo y las ' +
    'reemplaza por las 20 del control de stock.\n\n' +
    'El link de la hoja no cambia. Continuar?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) { return; }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const previas = ss.getSheets();
  // Nombre unico (con timestamp): si una corrida anterior se corto a mitad de
  // camino y dejo un "__temp__" sin borrar, no choca con este, y ademas queda
  // adentro de "previas" -> se borra solo junto con el resto de las hojas viejas.
  const temp = ss.insertSheet('__temp__' + new Date().getTime());
  previas.forEach(function(h){ ss.deleteSheet(h); });

  crearListas_(ss);
  crearInstrucciones_(ss);
  crearConfig_(ss);
  crearInsumos_(ss);
  crearProductos_(ss);
  crearStock_(ss);
  crearCompras_(ss);
  AREAS.forEach(function(a){
    if (PROD_SHEET[a[0]]) { crearProduccion_(ss, PROD_SHEET[a[0]], a[1], PRODUCTOS.filter(function(p){return p[0]===a[1];}), 6); }
  });
  crearProduccion_(ss, '3 Prod Barra SLA', 'Barra SLA 5.0', PRODUCTOS.filter(function(p){return p[0]==='Barra SLA 5.0';}), 6);
  crearProduccion_(ss, '3 Prod Barra SL', 'Barra San Luis', PRODUCTOS.filter(function(p){return p[0]==='Barra San Luis';}), 6);
  crearProduccion_(ss, '3 Prod Cocina SL', 'Cocina San Luis', PRODUCTOS.filter(function(p){return p[0]==='Cocina San Luis';}), 10);
  crearDescartes_(ss);
  crearVentasFudo_(ss);
  crearFudoStock_(ss, '6 Fudo Stock Insumos', 'CARGA 6 · STOCK DE INSUMOS SEGUN FUDO',
    'Snapshot del stock que Fudo tiene cargado para cada insumo, en los mismos 4 momentos que el conteo fisico.', INSUMOS, true);
  crearFudoStock_(ss, '7 Fudo Stock Productos', 'CARGA 7 · STOCK DE PRODUCTOS SEGUN FUDO',
    'Idem, para productos terminados. Sirve para el circuito elaborado -> vendido -> sobrante.', PRODUCTOS, false);
  crearConsumosInternos_(ss);

  ss.deleteSheet(temp);
  ss.setActiveSheet(ss.getSheetByName('Instrucciones'));
  ui.alert('Listo. ' + HOJAS.length + ' pestanas creadas.\n\n' +
    'Siguiente paso: en la pestana Insumos, revisar la columna AMBITO ' +
    '(sobre todo los de Barra y Cocina San Luis) y CONTENIDO POR BULTO.');
}

// ====================== HELPERS ======================
// Filas que de verdad se usan en la hoja mas larga (Compras/Consumos internos
// llegan a la fila 265; Ventas Fudo a ~305) mas margen. Formatear las 1000
// filas por defecto de una hoja nueva -20 veces, con formulas y validaciones
// de por medio- es trabajo innecesario sobre celdas vacias y es la causa mas
// probable de "Service Spreadsheets failed while accessing document": una
// sola ejecucion terminaba tocando ~550.000 celdas solo para el font.
const FILAS_FMT = 320;
function hoja_(ss, nombre, ncols) {
  const h = ss.insertSheet(nombre);
  if (ncols && ncols > h.getMaxColumns()) { h.insertColumnsAfter(h.getMaxColumns(), ncols - h.getMaxColumns()); }
  h.getRange(1, 1, Math.min(FILAS_FMT, h.getMaxRows()), h.getMaxColumns()).setFontFamily(FUENTE).setFontSize(10);
  return h;
}
function titulo_(h, ncols, texto, sub, sub2, corte) {
  // Si la hoja va a congelar columnas (parametro "corte"), el titulo NO puede
  // combinarse en una sola celda de punta a punta: esa combinada cruzaria la
  // linea de congelado y Sheets lo rechaza ("No puedes inmovilizar columnas
  // que solo contengan parte de una celda combinada"). Se arma en 2 tramos
  // -1..corte y corte+1..ncols- con el mismo fondo: se ve igual, una sola
  // franja de color, pero ninguno de los dos cruza el limite.
  function fila(r, texto, fill, color, bold, size) {
    if (corte && corte < ncols) {
      h.getRange(r,1,1,corte).merge().setValue(texto).setBackground(fill).setFontColor(color)
       .setFontWeight(bold).setFontSize(size).setVerticalAlignment('middle').setWrap(true);
      h.getRange(r,corte+1,1,ncols-corte).merge().setBackground(fill);
    } else {
      h.getRange(r,1,1,ncols).merge().setValue(texto).setBackground(fill).setFontColor(color)
       .setFontWeight(bold).setFontSize(size).setVerticalAlignment('middle').setWrap(true);
    }
  }
  fila(1, texto, C_TIT, '#FFFFFF', true, 13);
  h.setRowHeight(1, 28);
  let r = 2;
  [[sub, C_SUB, '#FFFFFF', false], [sub2, C_ACC, C_TIT, true]].forEach(function(t){
    if (t[0] == null) { return; }
    fila(r, t[0], t[1], t[2], t[3], 9);
    h.setRowHeight(r, 26);
    r++;
  });
  return r;
}
function cabecera_(h, fila, enc, height) {
  h.getRange(fila,1,1,enc.length).setValues([enc]).setBackground(C_SUB).setFontColor('#FFFFFF')
   .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center')
   .setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(fila, height || 30);
}
function anchos_(h, ws) { ws.forEach(function(w,i){ h.setColumnWidth(i+1, w); }); }
function input_(h, f, c, nf, nc) {
  h.getRange(f,c,nf,nc).setBackground(C_INPUT).setFontColor('#0000FF')
   .setBorder(true,true,true,true,true,true,C_BORDE,SpreadsheetApp.BorderStyle.SOLID);
}
function calc_(h, f, c, nf, nc) { h.getRange(f,c,nf,nc).setBackground(C_CALC).setFontWeight('bold'); }
function lista_(h, f, c, nf, rango) {
  h.getRange(f,c,nf,1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(rango, true).setAllowInvalid(true).build());
}
function bandas_(h, f, nf, nc) {
  for (var r = f; r < f + nf; r++) { if ((r-f) % 2 === 1) { h.getRange(r,1,1,nc).setBackground(C_BANDA); } }
}
function unicos_(arr, idx) {
  const v = {}, o = [];
  arr.forEach(function(r){ if (!v[r[idx]]) { v[r[idx]] = 1; o.push(r[idx]); } });
  return o;
}
function criticosUnicos_() { return unicos_(INSUMOS.filter(function(r){ return r[4]==='SI'; }), 1); }
function rgAmbitos_(ss){ return ss.getSheetByName('Listas').getRange(2,1,AMBITOS.length,1); }
function rgInsumos_(ss){ return ss.getSheetByName('Listas').getRange(2,2,unicos_(INSUMOS,1).length,1); }
function rgMotivos_(ss){ return ss.getSheetByName('Listas').getRange(2,3,MOTIVOS.length,1); }
function rgUnidades_(ss){ return ss.getSheetByName('Listas').getRange(2,4,UNIDADES.length,1); }
function rgProductos_(ss){ return ss.getSheetByName('Listas').getRange(2,5,unicos_(PRODUCTOS,1).length,1); }
function rgTipos_(ss){ return ss.getSheetByName('Listas').getRange(2,6,TIPOS.length,1); }
function rgCriticos_(ss){ return ss.getSheetByName('Listas').getRange(2,7,criticosUnicos_().length,1); }

/** Cabecera de 3 filas para grillas de 14 dias (2 semanas x 7 dias). Devuelve {r0, nf, ns}. */
function cabecera14_(h, fijas, subs) {
  const nf = fijas.length, ns = subs.length;
  // Las columnas fijas: filas 1-2 combinadas y pintadas; la etiqueta va en la fila 3,
  // SIN combinar, para que un createFilter() que arranque en la fila 3 no choque
  // con una celda combinada (Sheets lo rechaza).
  for (var i = 0; i < nf; i++) {
    h.getRange(1,i+1,2,1).merge().setBackground(C_SUB);
    h.getRange(3,i+1).setValue(fijas[i]).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center')
     .setVerticalAlignment('middle').setWrap(true);
  }
  for (var s = 0; s < 2; s++) {
    const base = s === 0 ? 'Config!$B$5' : 'Config!$B$6';
    const fill = s === 0 ? C_ACC : C_ACC2;
    const c0s = nf + 1 + s * 7 * ns;
    h.getRange(1, c0s, 1, 7*ns).merge()
     .setFormula('=IF(' + base + '="","SEMANA ' + (s+1) + '","SEMANA ' + (s+1) + '   "&TEXT(' +
                 base + ',"dd/mm")&" al "&TEXT(' + base + '+6,"dd/mm"))')
     .setBackground(fill).setFontColor(C_TIT).setFontWeight('bold').setFontSize(10)
     .setHorizontalAlignment('center').setVerticalAlignment('middle');
    for (var d = 0; d < 7; d++) {
      const c0 = c0s + d * ns;
      h.getRange(2, c0, 1, ns).merge()
       .setFormula('=IF(' + base + '="","' + DIAS[d] + '","' + DIAS[d] + ' "&TEXT(' + base + '+' + d + ',"dd/mm"))')
       .setBackground(fill).setFontColor(C_TIT).setFontWeight('bold').setFontSize(9)
       .setHorizontalAlignment('center').setVerticalAlignment('middle');
      h.getRange(3, c0, 1, ns).setValues([subs]).setBackground(C_SUB).setFontColor('#FFFFFF')
       .setFontWeight('bold').setFontSize(8).setHorizontalAlignment('center')
       .setVerticalAlignment('middle').setWrap(true);
    }
  }
  h.setRowHeight(1,20); h.setRowHeight(2,18); h.setRowHeight(3,24);
  h.setFrozenRows(3); h.setFrozenColumns(nf);
  return {r0: 4, nf: nf, ns: ns};
}

// ====================== LISTAS (oculta) ======================
function crearListas_(ss) {
  const h = hoja_(ss, 'Listas');
  const col = function(a){ return a.map(function(v){ return [v]; }); };
  h.getRange(1,1,1,7).setValues([['AMBITOS','INSUMOS','MOTIVOS','UNIDADES','PRODUCTOS','TIPOS','CRITICOS']])
   .setFontWeight('bold');
  const iu = unicos_(INSUMOS,1), pu = unicos_(PRODUCTOS,1), cu = criticosUnicos_();
  h.getRange(2,1,AMBITOS.length,1).setValues(col(AMBITOS));
  h.getRange(2,2,iu.length,1).setValues(col(iu));
  h.getRange(2,3,MOTIVOS.length,1).setValues(col(MOTIVOS));
  h.getRange(2,4,UNIDADES.length,1).setValues(col(UNIDADES));
  h.getRange(2,5,pu.length,1).setValues(col(pu));
  h.getRange(2,6,TIPOS.length,1).setValues(col(TIPOS));
  h.getRange(2,7,cu.length,1).setValues(col(cu));
  h.hideSheet();
}

// ====================== INSTRUCCIONES ======================
function crearInstrucciones_(ss) {
  const h = hoja_(ss, 'Instrucciones');
  anchos_(h, [30, 900]);
  titulo_(h, 2, 'CONTROL DE STOCK — CANDELA CAFE & PATISSERIE',
    'Dos semanas, de MARTES a LUNES: 01/09 al 07/09 y 22/09 al 28/09. Se mide en los 3 locales (Cuadra, SLA 5.0, San Luis) los mismos dias.', null);
  const G = [
   ['h','QUE SE VA A OBTENER'],
   ['p','Que insumos se usan de forma deficiente, si hay desperdicio en las jornadas, si hay mercaderia que se lleva el personal, y si hay faltantes o sobrantes de stock. El analisis se hace aparte, sobre estos datos.'],
   ['h','LOS 3 LOCALES'],
   ['li','CUADRA DE PRODUCCION — 5 areas (Panaderia, Pasteleria, Especialidades, Facturería, Sandwiches), cada una con su maestro de area.'],
   ['li','SLA 5.0 — local de venta. Tiene BARRA (bebidas con cafe, chocolatada, submarino, te). No elabora productos de panaderia/pasteleria.'],
   ['li','SAN LUIS — local de venta. Tiene BARRA igual que SLA 5.0, y ademas COCINA SAN LUIS (jefe de cocina + ayudante), que prepara Frappuccino, licuados, smoothies, jugos exprimidos y limonadas.'],
   ['h','ANTES DE ARRANCAR (antes del martes 01/09)'],
   ['li','Pestana CONFIG: confirmar las fechas de las dos semanas.'],
   ['li','Pestana INSUMOS: revisar la columna AMBITO. Los de barra y Cocina San Luis se asignaron por palabra clave desde el catalogo de costeo: HAY QUE CONFIRMARLOS, es lo menos seguro de este libro.'],
   ['li','Pestana INSUMOS: revisar CONTENIDO POR BULTO, inferido del nombre. Si esta mal, el analisis sale mal.'],
   ['li','Pestana INSUMOS, columna CRITICO: ' + criticosUnicos_().length + ' insumos marcados SI. Son los unicos con seguimiento de compras (por factura).'],
   ['h','QUE SE CARGA CADA SEMANA'],
   ['li','1 STOCK — conteo fisico de TODOS los insumos, martes temprano y lunes al cierre, en cada semana (4 conteos en total).'],
   ['li','2 COMPRAS — SOLO insumos criticos, cargados DESPUES de la semana desde las facturas de compra. No hay conteo fisico diario de insumos: el unico movimiento que se registra durante la semana es la compra.'],
   ['li','3 PRODUCCION (una pestana por ambito: 5 areas de cuadra + Barra SLA 5.0 + Barra San Luis + Cocina San Luis) — lo ELABORADO y lo DESCARTADO de cada producto, dia por dia.'],
   ['li','4 DESCARTES — una linea por cada cosa que se tira, CON EL MOTIVO. En cualquiera de los 3 locales.'],
   ['h','AL TERMINAR CADA SEMANA (desde los reportes de Fudo)'],
   ['li','5 VENTAS FUDO — cuanto se vendio de cada producto, dia por dia.'],
   ['li','6 y 7 FUDO STOCK (insumos y productos) — el stock que Fudo tiene cargado, en los mismos 4 momentos que el conteo fisico.'],
   ['li','8 CONSUMOS INTERNOS — consumos del personal y cortesias, tal como Fudo los tiene registrados.'],
   ['h','COMO CONTAR EL STOCK'],
   ['p','Bultos cerrados + lo que hay suelto del envase abierto. Ejemplo: 3 bolsas de 25 kg + 8,5 kg sueltos -> BULTOS=3, PARCIAL=8,5. El TOTAL (83,5 kg) lo calcula la planilla.'],
   ['warn','Los 4 conteos de stock los tiene que hacer, si es posible, la misma persona y con el mismo criterio.'],
   ['h','REGLA DE ORO'],
   ['p','Solo se escribe en las celdas AMARILLAS. Lo demas es formula o dato del catalogo.'],
   ['warn','Conviene proteger antes de compartir (Datos -> Proteger hojas y rangos), y usar Archivo -> Historial de versiones si algo se rompe.'],
  ];
  var r = 4;
  G.forEach(function(x){
    if (x[0] === 'h') {
      const c = h.getRange(r,2).setValue(x[1]).setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
      h.setRowHeight(r, 24);
    } else {
      const c = h.getRange(r,2).setValue(x[0]==='li' ? '   -  '+x[1] : x[1]).setWrap(true).setVerticalAlignment('top');
      if (x[0]==='warn') { c.setBackground('#FDECEA').setFontColor('#C0392B').setFontWeight('bold'); }
      h.setRowHeight(r, Math.max(18, 14*Math.ceil(x[1].length/120)));
    }
    r++;
  });
  h.setFrozenRows(3);
}

// ====================== CONFIG ======================
function crearConfig_(ss) {
  const h = hoja_(ss, 'Config');
  anchos_(h, [30, 22, 26, 26]);
  titulo_(h, 4, 'CONFIGURACION DE LAS DOS SEMANAS',
    'Candela Cafe & Patisserie · Complete solo las celdas amarillas.',
    'Dos semanas de MARTES a LUNES: 01/09-07/09 y 22/09-28/09. Se miden los 3 locales los mismos dias.');
  function seccion(r, txt) {
    h.getRange(r,1,1,4).merge().setValue(txt).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setVerticalAlignment('middle');
    h.setRowHeight(r, 22);
  }
  seccion(4, '1 · FECHAS DE LAS DOS SEMANAS');
  h.getRange(5,1).setValue('Semana 1 - inicio (martes)').setFontWeight('bold');
  input_(h,5,2,1,1); h.getRange(5,2).setValue(S1_INICIO).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(5,3).setValue('Semana 1 - cierre (lunes)').setFontWeight('bold');
  h.getRange(5,4).setFormula('=IF($B$5="","",$B$5+6)').setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(6,1).setValue('Semana 2 - inicio (martes)').setFontWeight('bold');
  input_(h,6,2,1,1); h.getRange(6,2).setValue(S2_INICIO).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(6,3).setValue('Semana 2 - cierre (lunes)').setFontWeight('bold');
  h.getRange(6,4).setFormula('=IF($B$6="","",$B$6+6)').setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');

  seccion(8, '2 · RESPONSABLES POR AMBITO');
  cabecera_(h, 9, ['AMBITO','RESPONSABLE','QUIEN CUENTA INSUMOS','QUIEN CUENTA PRODUCTO'], 24);
  const RESP = [
    ['Deposito central','Compras / encargado','Compras','—'],
    ['Panadería','Maestro de area','Maestro de area','Maestro de area'],
    ['Pastelería','Maestro de area','Maestro de area','Maestro de area'],
    ['Especialidades','Maestro de area','Maestro de area','Maestro de area'],
    ['Facturería','Maestro de area','Maestro de area','Maestro de area'],
    ['Sandwiches','Maestro de area','Maestro de area','Maestro de area'],
    ['Barra SLA 5.0','Barista','Barista','Vendedor (registra en Fudo)'],
    ['Barra San Luis','Barista','Barista','Vendedor (registra en Fudo)'],
    ['Cocina San Luis','Jefe / ayudante de cocina','Jefe / ayudante de cocina','Jefe / ayudante de cocina'],
  ];
  h.getRange(10,1,RESP.length,4).setValues(RESP);
  h.getRange(10,1,RESP.length,1).setFontWeight('bold');
  bandas_(h, 10, RESP.length, 4);

  const r2 = 10 + RESP.length + 1;
  seccion(r2, '3 · LIMITES DE TOLERANCIA (para tu analisis posterior)');
  h.getRange(r2+1,1).setValue('Desvio maximo tolerado en insumos criticos (%)').setFontWeight('bold');
  input_(h,r2+1,2,1,1); h.getRange(r2+1,2).setValue(0.05).setNumberFormat('0.0%').setHorizontalAlignment('center');
  h.getRange(r2+2,1).setValue('Descarte maximo tolerado en productos (%)').setFontWeight('bold');
  input_(h,r2+2,2,1,1); h.getRange(r2+2,2).setValue(0.03).setNumberFormat('0.0%').setHorizontalAlignment('center');
  h.setFrozenRows(2);
}

// ====================== INSUMOS (maestro) ======================
function crearInsumos_(ss) {
  const h = hoja_(ss, 'Insumos');
  anchos_(h, [140, 260, 65, 100, 95, 110, 300]);
  titulo_(h, 7, 'MAESTRO DE INSUMOS (' + INSUMOS.length + ' filas · ' + criticosUnicos_().length + ' criticos)',
    'Insumos reales del sistema de costeo, ya depurados de duplicados. Cubre los 3 locales: deposito central + cuadra + barra + Cocina San Luis.',
    'REVISAR: AMBITO (donde se cuenta) y CONTENIDO POR BULTO. Los de barra/Cocina San Luis se asignaron por palabra clave: confirmar contra lo real.', 2);
  cabecera_(h, 4, ['AMBITO\n(donde se cuenta)','INSUMO','UNIDAD','CONTENIDO\nPOR BULTO','CRITICO\n(solo por factura)','COSTO\nUNIT. $','CLAVE (no tocar)'], 32);
  const n = INSUMOS.length;
  h.getRange(5,1,n,7).setValues(INSUMOS.map(function(r){
    return [r[0], r[1], r[2], r[3], r[4], r[5], r[0]+' | '+r[1]];
  }));
  h.getRange(5,2,n,1).setFontWeight('bold');
  h.getRange(5,3,n,4).setHorizontalAlignment('center');
  h.getRange(5,6,n,1).setNumberFormat('$#,##0.00');
  bandas_(h, 5, n, 7);
  input_(h, 5, 1, n, 1); input_(h, 5, 3, n, 3);
  lista_(h, 5, 1, n, rgAmbitos_(ss));
  lista_(h, 5, 3, n, rgUnidades_(ss));
  h.getRange(5,5,n,1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['SI','NO'], true).setAllowInvalid(true).build());
  h.getRange(5,7,n,1).setFontColor('#7A5C4A').setFontSize(8);
  h.hideColumns(7);
  h.setFrozenRows(4); h.setFrozenColumns(2);
  h.getRange(4,1,n+1,6).createFilter();
}

// ====================== PRODUCTOS (maestro) ======================
function crearProductos_(ss) {
  const h = hoja_(ss, 'Productos');
  anchos_(h, [140, 340, 70]);
  titulo_(h, 3, 'MAESTRO DE PRODUCTOS (' + PRODUCTOS.length + ')',
    '141 de la cuadra de produccion (catalogo real de la app) + cartas de Barra y Cocina San Luis (de los manuales de procedimientos).', null, 1);
  cabecera_(h, 3, ['AREA / AMBITO','PRODUCTO','UNIDAD'], 22);
  const n = PRODUCTOS.length;
  h.getRange(4,1,n,3).setValues(PRODUCTOS);
  h.getRange(4,3,n,1).setHorizontalAlignment('center');
  bandas_(h, 4, n, 3);
  h.setFrozenRows(3); h.setFrozenColumns(1);
  h.getRange(3,1,n+1,3).createFilter();
}

// ====================== 1 STOCK (4 conteos: S1 ini/fin, S2 ini/fin) ======================
function crearStock_(ss) {
  const h = hoja_(ss, '1 Stock', 17);
  anchos_(h, [140, 260, 65, 90, 65,65,80, 65,65,80, 65,65,80, 65,65,80, 200]);
  titulo_(h, 17, 'PLANILLA 1 · STOCK DE INSUMOS (4 conteos)',
    'Martes temprano y lunes al cierre, en cada semana. Bultos cerrados + suelto: el TOTAL lo calcula la planilla.',
    'Contar TODOS los insumos, no solo los criticos.', 2);
  const FIJAS = ['AMBITO','INSUMO','UNID.','CONT/\nBULTO'];
  const r1 = 4, r2 = 5;
  for (var i = 0; i < FIJAS.length; i++) {
    h.getRange(r1,i+1).setBackground(C_SUB);
    h.getRange(r2,i+1).setValue(FIJAS[i]).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
  }
  const BLOQUES = [['STOCK INICIAL S1','Config!$B$5',C_ACC], ['STOCK FINAL S1','Config!$B$5+6',C_ACC],
                    ['STOCK INICIAL S2','Config!$B$6',C_ACC2], ['STOCK FINAL S2','Config!$B$6+6',C_ACC2]];
  BLOQUES.forEach(function(b, i){
    const c0 = FIJAS.length + 1 + i*3;
    h.getRange(r1,c0,1,3).merge()
     .setFormula('=IF(' + b[1].replace('+6','') + '="","' + b[0] + '","' + b[0] + '   "&TEXT(' + b[1] + ',"dd/mm"))')
     .setBackground(b[2]).setFontColor(C_TIT).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center');
    h.getRange(r2,c0,1,3).setValues([['Bultos','Parcial','TOTAL']]).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(8).setHorizontalAlignment('center');
  });
  h.getRange(r1,17).setBackground(C_SUB);
  h.getRange(r2,17).setValue('OBSERVACIONES').setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center');
  h.setRowHeight(r1,20); h.setRowHeight(r2,22);

  const st0 = r2+1, n = INSUMOS.length;
  h.getRange(st0,1,n,4).setValues(INSUMOS.map(function(r){ return [r[0], r[1], r[2], r[3]]; }));
  h.getRange(st0,2,n,1).setFontWeight('bold');
  h.getRange(st0,3,n,2).setHorizontalAlignment('center');
  bandas_(h, st0, n, 4);
  for (var b = 0; b < 4; b++) {
    const c0 = FIJAS.length + 1 + b*3;
    const cb = String.fromCharCode(64+c0), cp = String.fromCharCode(64+c0+1);
    const fs = [];
    for (var i2 = 0; i2 < n; i2++) {
      const r = st0 + i2;
      fs.push(['=IF(AND(' + cb + r + '="",' + cp + r + '=""),"",IFERROR(' + cb + r + '*$D' + r + ',0)+IFERROR(' + cp + r + ',0))']);
    }
    input_(h, st0, c0, n, 2);
    h.getRange(st0,c0,n,2).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
    h.getRange(st0,c0+2,n,1).setFormulas(fs).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
    calc_(h, st0, c0+2, n, 1);
  }
  input_(h, st0, 17, n, 1);
  h.setFrozenRows(r2); h.setFrozenColumns(2);
  h.getRange(r2,1,n+1,17).createFilter();
}

// ====================== 2 COMPRAS (solo criticos) ======================
function crearCompras_(ss) {
  const h = hoja_(ss, '2 Compras', 10);
  anchos_(h, [95, 65, 140, 140, 220, 130, 90, 65, 110, 220]);
  titulo_(h, 10, 'PLANILLA 2 · COMPRAS DE INSUMOS CRITICOS (desde facturas)',
    'Solo se cargan aca los insumos marcados CRITICO=SI. Se completa DESPUES de la semana, con las facturas en la mano.',
    'La CANTIDAD va en la unidad base (kg, u, L), no en bultos. La SEMANA la calcula la fecha sola.');
  cabecera_(h, 4, ['FECHA','SEMANA','PROVEEDOR','N° FACTURA','INSUMO (critico)','AMBITO','CANTIDAD','UNIDAD','IMPORTE $','CONTROL'], 32);
  const cp0 = 6, cp1 = 265;
  input_(h, cp0, 1, cp1-cp0+1, 1);
  h.getRange(cp0,1,cp1-cp0+1,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  input_(h, cp0, 3, cp1-cp0+1, 2);
  input_(h, cp0, 5, cp1-cp0+1, 1);
  input_(h, cp0, 6, cp1-cp0+1, 1); h.getRange(cp0,6,cp1-cp0+1,1).setHorizontalAlignment('center');
  input_(h, cp0, 7, cp1-cp0+1, 1); h.getRange(cp0,7,cp1-cp0+1,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  input_(h, cp0, 9, cp1-cp0+1, 1); h.getRange(cp0,9,cp1-cp0+1,1).setNumberFormat('$#,##0.00');
  const semFs = [], ctlFs = [], uniFs = [];
  for (var r = cp0; r <= cp1; r++) {
    semFs.push(['=IF($A'+r+'="","",IF(AND($A'+r+'>=Config!$B$5,$A'+r+'<=Config!$B$5+6),1,IF(AND($A'+r+'>=Config!$B$6,$A'+r+'<=Config!$B$6+6),2,"?")))']);
    ctlFs.push(['=IF($E'+r+'="","",IF(COUNTIF(Listas!$G$2:$G$'+(1+criticosUnicos_().length)+',$E'+r+')=0,"REVISAR: no es critico","OK"))']);
    uniFs.push(['=IFERROR(INDEX(Insumos!$C$5:$C$'+(4+INSUMOS.length)+',MATCH($E'+r+',Insumos!$B$5:$B$'+(4+INSUMOS.length)+',0)),"")']);
  }
  h.getRange(cp0,2,cp1-cp0+1,1).setFormulas(semFs).setHorizontalAlignment('center');
  h.getRange(cp0,8,cp1-cp0+1,1).setFormulas(uniFs).setHorizontalAlignment('center');
  h.getRange(cp0,10,cp1-cp0+1,1).setFormulas(ctlFs);
  lista_(h, cp0, 5, cp1-cp0+1, rgCriticos_(ss));
  lista_(h, cp0, 6, cp1-cp0+1, rgAmbitos_(ss));
  h.getRange(cp0,10,cp1-cp0+1,1).setFontColor('#7A5C4A').setFontSize(9);
  h.setFrozenRows(4);
  h.getRange(4,1,cp1-cp0+2,10).createFilter();
}

// ====================== 3 PRODUCCION (14 dias) ======================
function crearProduccion_(ss, nombreHoja, etiqueta, productos, extraBlank) {
  const h = hoja_(ss, nombreHoja, 30);
  anchos_(h, [420, 65].concat(Array(28).fill(60)));
  const info = cabecera14_(h, ['PRODUCTO — ' + etiqueta.toUpperCase(), 'UNID.'], ['Elab.', 'Desc.']);
  const total = productos.length + extraBlank;
  bandas_(h, info.r0, total, 2);
  if (productos.length > 0) {
    h.getRange(info.r0,1,productos.length,2).setValues(productos.map(function(p){ return [p[1], p[2]]; }));
  }
  if (extraBlank > 0) { input_(h, info.r0 + productos.length, 1, extraBlank, 2); }
  h.getRange(info.r0,2,total,1).setHorizontalAlignment('center');
  input_(h, info.r0, 3, total, 28);
  h.getRange(info.r0,3,total,28).setNumberFormat('#,##0').setHorizontalAlignment('center');
}

// ====================== 4 DESCARTES ======================
function crearDescartes_(ss) {
  const h = hoja_(ss, '4 Descartes', 8);
  anchos_(h, [95, 140, 320, 90, 65, 190, 130, 220]);
  titulo_(h, 8, 'PLANILLA 4 · DESCARTES, QUEMADO Y TIRADO',
    'Una linea por cada cosa que se descarta, CON EL MOTIVO. En los 3 locales: cuadra, barra y Cocina San Luis.', null);
  cabecera_(h, 4, ['FECHA','AMBITO','PRODUCTO O INSUMO','CANTIDAD','UNIDAD','MOTIVO','RESPONSABLE','OBSERVACIONES'], 30);
  const d0 = 6, d1 = 265;
  input_(h, d0, 1, d1-d0+1, 1); h.getRange(d0,1,d1-d0+1,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  input_(h, d0, 2, d1-d0+1, 1); h.getRange(d0,2,d1-d0+1,1).setHorizontalAlignment('center');
  input_(h, d0, 3, d1-d0+1, 1);
  input_(h, d0, 4, d1-d0+1, 1); h.getRange(d0,4,d1-d0+1,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  input_(h, d0, 5, d1-d0+1, 1); h.getRange(d0,5,d1-d0+1,1).setHorizontalAlignment('center');
  input_(h, d0, 6, d1-d0+1, 1);
  input_(h, d0, 7, d1-d0+1, 1); h.getRange(d0,7,d1-d0+1,1).setHorizontalAlignment('center');
  input_(h, d0, 8, d1-d0+1, 1);
  lista_(h, d0, 2, d1-d0+1, rgAmbitos_(ss));
  lista_(h, d0, 5, d1-d0+1, rgUnidades_(ss));
  lista_(h, d0, 6, d1-d0+1, rgMotivos_(ss));
  h.setFrozenRows(4);
  h.getRange(4,1,d1-d0+2,8).createFilter();
}

// ====================== 5 VENTAS FUDO (14 dias por producto) ======================
function crearVentasFudo_(ss) {
  const h = hoja_(ss, '5 Ventas Fudo', 17);
  anchos_(h, [300, 130, 260].concat(Array(14).fill(60)));
  const info = cabecera14_(h, ['PRODUCTO SEGUN FUDO', 'AREA', 'PRODUCTO DE CANDELA'], ['Vend.']);
  const fv0 = info.r0, fv1 = fv0 + 300;
  input_(h, fv0, 1, fv1-fv0+1, 1);
  input_(h, fv0, 2, fv1-fv0+1, 1); h.getRange(fv0,2,fv1-fv0+1,1).setHorizontalAlignment('center');
  input_(h, fv0, 3, fv1-fv0+1, 1);
  input_(h, fv0, 4, fv1-fv0+1, 14);
  h.getRange(fv0,4,fv1-fv0+1,14).setNumberFormat('#,##0').setHorizontalAlignment('center');
  lista_(h, fv0, 2, fv1-fv0+1, rgAmbitos_(ss));
  lista_(h, fv0, 3, fv1-fv0+1, rgProductos_(ss));
  h.getRange(3,1,fv1-fv0+2,17).createFilter();
}

// ====================== 6/7 FUDO STOCK (4 snapshots) ======================
function crearFudoStock_(ss, nombre, tituloTxt, sub, listado, conAmbito) {
  const h = hoja_(ss, nombre, 7);
  anchos_(h, conAmbito ? [140,260,90,90,90,90,220] : [340,70,90,90,90,90,220]);
  titulo_(h, 7, tituloTxt, sub, null, 2);
  const r1 = 4;
  const heads = conAmbito ? ['AMBITO','INSUMO'] : ['PRODUCTO','UNID.'];
  cabecera_(h, r1, heads.concat(['STOCK\nS1 INICIAL','STOCK\nS1 FINAL','STOCK\nS2 INICIAL','STOCK\nS2 FINAL','OBSERVACIONES']), 30);
  const d0 = r1+1, n = listado.length;
  if (conAmbito) {
    h.getRange(d0,1,n,2).setValues(listado.map(function(r){ return [r[0], r[1]]; }));
    h.getRange(d0,2,n,1).setFontWeight('bold');
  } else {
    h.getRange(d0,1,n,2).setValues(listado.map(function(r){ return [r[1], r[2]]; }));
    h.getRange(d0,2,n,1).setHorizontalAlignment('center');
  }
  input_(h, d0, 3, n, 4); h.getRange(d0,3,n,4).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  input_(h, d0, 7, n, 1);
  bandas_(h, d0, n, 2);
  h.setFrozenRows(d0-1); h.setFrozenColumns(2);
  h.getRange(r1,1,n+1,7).createFilter();
}

// ====================== 8 CONSUMOS INTERNOS / CORTESIAS ======================
function crearConsumosInternos_(ss) {
  const h = hoja_(ss, '8 Consumos internos', 7);
  anchos_(h, [95, 320, 140, 90, 65, 190, 190]);
  titulo_(h, 7, 'CARGA 8 · CONSUMOS INTERNOS Y CORTESIAS (reporte de Fudo)',
    'Lo que el personal consume y las cortesias, tal como las tiene registradas Fudo.', null);
  cabecera_(h, 4, ['FECHA','PRODUCTO DE CANDELA','AMBITO','CANTIDAD','UNIDAD','TIPO','RESPONSABLE / SECTOR'], 30);
  const c0 = 6, c1 = 265;
  input_(h, c0, 1, c1-c0+1, 1); h.getRange(c0,1,c1-c0+1,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  input_(h, c0, 2, c1-c0+1, 1);
  input_(h, c0, 3, c1-c0+1, 1); h.getRange(c0,3,c1-c0+1,1).setHorizontalAlignment('center');
  input_(h, c0, 4, c1-c0+1, 1); h.getRange(c0,4,c1-c0+1,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  input_(h, c0, 5, c1-c0+1, 1); h.getRange(c0,5,c1-c0+1,1).setHorizontalAlignment('center');
  input_(h, c0, 6, c1-c0+1, 1);
  input_(h, c0, 7, c1-c0+1, 1);
  lista_(h, c0, 2, c1-c0+1, rgProductos_(ss));
  lista_(h, c0, 3, c1-c0+1, rgAmbitos_(ss));
  lista_(h, c0, 5, c1-c0+1, rgUnidades_(ss));
  lista_(h, c0, 6, c1-c0+1, rgTipos_(ss));
  h.setFrozenRows(4);
  h.getRange(4,1,c1-c0+2,7).createFilter();
}
