/**
 * ============================================================================
 *  CANDELA CAFE & PATISSERIE  ·  CONTROL DE STOCK
 *  Crea la planilla de carga en Google Sheets.
 * ============================================================================
 *
 *  QUE MIDE
 *    Dos semanas, de MARTES a LUNES:
 *        Semana 1   martes 01/09  ->  lunes 07/09
 *        Semana 2   martes 22/09  ->  lunes 28/09
 *
 *    Con lo que se carga aca se calculan despues, por fuera de la planilla:
 *        CONSUMO REAL POR INSUMO = stock inicial + compras - stock final
 *        DIFERENCIA POR PRODUCTO = elaborado - vendido - consumo interno - descarte
 *
 *  COMO USARLO
 *    1. Crear una hoja de calculo NUEVA Y VACIA en Google Sheets.
 *    2. Extensiones -> Apps Script.
 *    3. Borrar lo que haya y pegar TODO este archivo.
 *    4. Guardar, elegir la funcion "crearPlanilla" y Ejecutar.
 *       La primera vez pide autorizacion: Revisar permisos -> elegir la cuenta ->
 *       Configuracion avanzada -> Ir a (nombre del proyecto) -> Permitir.
 *    5. Volver a la hoja: quedan las 17 pestanas listas.
 *
 *    Si hubiera que rehacerla mas adelante conservando el mismo link, se ejecuta
 *    "recrearPlanilla". Pide confirmacion, porque borra lo ya cargado.
 *
 *  LOS INSUMOS
 *    Salen del export real del modulo de costeo (213 registros), ya depurado:
 *      - se fusionaron 9 productos que estaban cargados dos o tres veces con
 *        distinta presentacion o marca (Azucar, Manteca, Mayonesa, Miel de abeja,
 *        Galletas chocolinas, Queso tybo, Queso muzzarella, Lentejas chocolate,
 *        Cerezas en lata);
 *      - se descartaron 8 precios imposibles, para no arrastrar el error al
 *        valorizar el consumo. Esas celdas quedan vacias a proposito;
 *      - quedan 146 insumos de produccion, que son los que se cuentan, y 57 de
 *        referencia (semielaborados propios y reventa/cafeteria) que aparecen en
 *        gris en el maestro y NO se cuentan;
 *      - 37 estan marcados como criticos: se cuentan todos los dias.
 *
 *  REGLA DE ORO
 *    Solo se escribe en las celdas AMARILLAS.
 * ============================================================================
 */

// ====================== DATOS ======================
const AREAS = [["panaderia", "Panadería"], ["pasteleria", "Pastelería"], ["especialidades", "Especialidades"], ["factureria", "Facturería"], ["sandwiches", "Sandwiches"], ["cocina_sl", "Cocina San Luis"]];

// [ambito, insumo, unidad, contenidoPorBulto, critico, alcance, grupo, precio, proveedor]
const INSUMOS = [["Deposito central", "Aceite de girasol", "L", 5.0, "NO", "Central", "Produccion", 3241.861, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Aceite de oliva", "L", 1.0, "SI", "Central", "Produccion", 28116.0204, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Aditivo", "kg", 1.0, "NO", "Central", "Produccion", 6068.9994, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Almendras", "kg", 1.0, "SI", "Central", "Produccion", 34720, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Almidon de maiz", "kg", 1.0, "NO", "Central", "Produccion", 2453.4359, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Anana en lata", "kg", 1.0, "NO", "Central", "Produccion", 3567.8148, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Avena", "kg", 1.0, "NO", "Central", "Produccion", 2649.7064, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Azucar", "kg", 1.0, "SI", "Central", "Produccion", 1000, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Azucar impalpable", "kg", 1.0, "SI", "Central", "Produccion", 3027.2784, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Azucar mascabo", "kg", 1.0, "SI", "Central", "Produccion", 1542.7984, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Banana", "docena", 1.0, "NO", "Por area", "Produccion", 166.6667, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Baño moldeo c/leche", "kg", 1.0, "NO", "Central", "Produccion", 9713.5896, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Berlina", "kg", 1.0, "NO", "Central", "Produccion", 6525.1669, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Bicarbonato de amonio", "kg", 1.0, "NO", "Central", "Produccion", 9279.88, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Bicarbonato de sodio", "kg", 1.0, "NO", "Central", "Produccion", 12000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Bondiola", "kg", 1.0, "SI", "Por area", "Produccion", 27759.4691, ""], ["Deposito central", "Brownie express", "kg", 1.0, "NO", "Central", "Produccion", 10791.6853, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Cacao", "kg", 1.0, "SI", "Central", "Produccion", 45065.6514, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Canela en polvo", "kg", 1.0, "SI", "Central", "Produccion", 30000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Cantimpalo", "kg", 1.0, "SI", "Por area", "Produccion", 28023.6, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Cerezas en lata", "kg", 1.0, "NO", "Central", "Produccion", 16912.2111, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Chocolate baño semiamargo", "kg", 1.0, "NO", "Central", "Produccion", 13132.0009, "-Oy3x5HICG7dqWSc5Hqw::lodiser"], ["Deposito central", "Chocolate chip", "kg", 1.0, "NO", "Central", "Produccion", 18891.8994, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Chocolate moldeo", "kg", 1.0, "NO", "Central", "Produccion", 9610.0031, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Chocolate para submarino", "kg", 1.0, "SI", "Central", "Produccion", 25000, "-Oy3x5CU1wbvKIrHD_Ap"], ["Deposito central", "Chocolino", "kg", 1.0, "NO", "Central", "Produccion", 11145.8696, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Ciruelas", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Claras", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Coco rallado", "kg", 1.0, "NO", "Central", "Produccion", 6859.06, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Colorante en pasta", "u", 1.0, "NO", "Central", "Produccion", 736.032, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Confites mini", "kg", 1.0, "NO", "Central", "Produccion", 14880, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Crema de leche", "kg", 1.0, "SI", "Por area", "Produccion", 26012.19, "-Oy5lEAvhTTuFPOgLwJI"], ["Deposito central", "Crema Vegetal", "L", 1.0, "SI", "Por area", "Produccion", 8159.22, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Crocante de mani", "kg", 1.0, "NO", "Central", "Produccion", 11052.9991, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Culatello", "kg", 1.0, "NO", "Por area", "Produccion", 15000, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Dulce de cayote", "kg", 1.0, "NO", "Central", "Produccion", 4000, "-OyZ4ZPPwu1kisPflQT4"], ["Deposito central", "Dulce de leche repostero", "kg", 25.0, "SI", "Central", "Produccion", 4416, "-Oy3x5M5XcdKeUTevCcM::campo quijano"], ["Deposito central", "Dulce de membrillo", "kg", 1.0, "NO", "Central", "Produccion", 3940.6022, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Dulcerio tres leches", "kg", 1.0, "NO", "Central", "Produccion", 868.5269, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Durazno", "kg", 1.0, "NO", "Por area", "Produccion", 1361, ""], ["Deposito central", "Durazno al natural", "kg", 1.0, "NO", "Central", "Produccion", 2944.1513, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Emulsionante en pasta", "kg", 1.0, "SI", "Central", "Produccion", 25158.1909, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Esencia de vainilla", "kg", 1.0, "NO", "Central", "Produccion", 2683.2331, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Fecula", "kg", 1.0, "NO", "Central", "Produccion", 2049.596, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Fondant", "kg", 1.0, "NO", "Central", "Produccion", 2766.936, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Fruta abrillantada", "kg", 1.0, "NO", "Central", "Produccion", "", ""], ["Deposito central", "Frutas", "kg", 1.0, "NO", "Por area", "Produccion", 11040, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Frutillas congeladas", "kg", 1.0, "NO", "Por area", "Produccion", 6100, "-Oy3x6_YT0XO-LGdauVw"], ["Deposito central", "Galletas chocolinas", "kg", 1.0, "NO", "Central", "Produccion", 9200, "-Oy3x5U5rkDaNIAPsni2"], ["Deposito central", "Galletas lincoln", "kg", 1.0, "NO", "Central", "Produccion", "", ""], ["Deposito central", "Galletas oreo", "kg", 1.0, "NO", "Central", "Produccion", 1400, "-Oy9iFzRrmC155dtg5_V"], ["Deposito central", "Galletas vainillas", "kg", 1.0, "NO", "Central", "Produccion", 7500, "-Oy9iFzRrmC155dtg5_V"], ["Deposito central", "Gelatina S/Sabor", "kg", 1.0, "SI", "Central", "Produccion", 47619.0476, "_manual"], ["Deposito central", "Granas", "kg", 1.0, "NO", "Central", "Produccion", 4816.4055, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Granola", "kg", 1.0, "NO", "Central", "Produccion", 13800, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Grasa", "kg", 1.0, "SI", "Central", "Produccion", 5079.6, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Harina 000 x25kg", "kg", 25.0, "SI", "Central", "Produccion", 840, "-Oy3x6BB2k7o0gjXohnv"], ["Deposito central", "Harina 0000 x25kg", "kg", 25.0, "SI", "Central", "Produccion", 840, "-Oy3x6BB2k7o0gjXohnv"], ["Deposito central", "Huevos", "kg", 1.0, "SI", "Por area", "Produccion", 4000, "-Oy9iHFKHzQfOCWS2yMx::lila"], ["Deposito central", "Jalea fruta", "kg", 1.0, "NO", "Central", "Produccion", 1479.265, "-Oy3x5HICG7dqWSc5Hqw::calsa"], ["Deposito central", "Jamon crudo", "kg", 1.0, "SI", "Por area", "Produccion", 47650.01, "-Oy3x6FgGm8bAAjccrbI::la francisca"], ["Deposito central", "Leche entera", "kg", 1.0, "SI", "Por area", "Produccion", 1462.164, "-Oy3x5hUUrbMdfLny41w"], ["Deposito central", "Lechuga", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Lentejas chocolate", "kg", 1.0, "NO", "Central", "Produccion", 14903.7152, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Levadura", "kg", 1.0, "SI", "Central", "Produccion", 6742.1999, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Limon", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Lomito ahumado", "kg", 1.0, "SI", "Por area", "Produccion", 37606.3039, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Mani filetiado", "kg", 1.0, "NO", "Central", "Produccion", 7890.8677, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Manteca", "kg", 1.0, "SI", "Por area", "Produccion", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Manzana verde", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Margarina hojaldre", "kg", 1.0, "SI", "Central", "Produccion", 5630.401, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Margarina masa", "kg", 1.0, "SI", "Central", "Produccion", 5630.402, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Mayonesa", "kg", 2900.0, "NO", "Central", "Produccion", 3973.6567, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Mermelada ciruela", "kg", 1.0, "NO", "Central", "Produccion", 3112.2907, "_manual"], ["Deposito central", "Mermelada de membrillo", "kg", 1.0, "NO", "Central", "Produccion", 2254.5065, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Mermelada durazno", "kg", 1.0, "NO", "Central", "Produccion", 4078.8626, "-Oy3x6PIXYLxiYAtPhXd::oriel"], ["Deposito central", "Mermelada frutilla", "kg", 1.0, "NO", "Central", "Produccion", 5490.375, "-Oy3x6PIXYLxiYAtPhXd::orieta"], ["Deposito central", "Miel de abeja", "kg", 1.0, "SI", "Central", "Produccion", 29495.5824, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Miel de caña", "kg", 1.0, "NO", "Central", "Produccion", 12754.2816, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Mix de semillas", "kg", 1.0, "NO", "Central", "Produccion", 5208, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Mortadela", "kg", 1.0, "NO", "Por area", "Produccion", 13290, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Mortadela con pistachos", "kg", 1.0, "NO", "Por area", "Produccion", 10320.01, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Naranja", "kg", 1.0, "NO", "Por area", "Produccion", 4500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Naranja — paquete lt", "L", 1.0, "NO", "Por area", "Produccion", 1200, ""], ["Deposito central", "Nueces", "kg", 1.0, "NO", "Central", "Produccion", 15000, "_manual"], ["Deposito central", "Nutella", "kg", 1.0, "SI", "Central", "Produccion", 29001.6501, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Otentic", "kg", 1.0, "SI", "Central", "Produccion", 57233.3025, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Palta", "kg", 1.0, "NO", "Por area", "Produccion", 6500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Panes blandos", "kg", 1.0, "NO", "Por area", "Produccion", 6987.7559, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Pasas de uva", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Deposito central", "Pasta de pistachos", "kg", 1.0, "SI", "Central", "Produccion", 55851.2368, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Peceto", "kg", 1.0, "SI", "Por area", "Produccion", 20000, "-Oy3x5sggwuQBtMEb2uy"], ["Deposito central", "Pernil", "kg", 1.0, "NO", "Por area", "Produccion", 8667.8108, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Pistachos", "kg", 1.0, "SI", "Central", "Produccion", 39000, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Polvo para hornear", "kg", 1.0, "NO", "Central", "Produccion", 15358.8506, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla brownie x3kg", "kg", 3.0, "NO", "Central", "Produccion", 11593.9982, ""], ["Deposito central", "Premezcla budin chocolate", "kg", 1.0, "NO", "Central", "Produccion", 7718.0011, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla budin vainilla", "kg", 1.0, "NO", "Central", "Produccion", 5422.9982, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla Easy Pannettone", "kg", 1.0, "NO", "Central", "Produccion", "", ""], ["Deposito central", "Premezcla muffin", "kg", 1.0, "NO", "Central", "Produccion", 9043.9998, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Premezcla pan de papa", "kg", 1.0, "NO", "Central", "Produccion", 19039.4238, ""], ["Deposito central", "Propionato de calcio", "kg", 1.0, "NO", "Central", "Produccion", 19911.6632, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Pulpalist neutro", "kg", 1.0, "NO", "Central", "Produccion", 9426.8002, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Queso azul", "kg", 1.0, "SI", "Por area", "Produccion", 25054.8324, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Queso crema x pouch", "kg", 1.0, "SI", "Por area", "Produccion", 40387.6, "-OyYs0PCr53ZOD2Famxb::casancrem"], ["Deposito central", "Queso de cabra", "kg", 1.0, "NO", "Por area", "Produccion", 13900, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Queso muzzarella", "kg", 1.0, "SI", "Por area", "Produccion", 22473.33, "-Oy3x6PIXYLxiYAtPhXd::aurora"], ["Deposito central", "Rucula", "kg", 1.0, "NO", "Por area", "Produccion", 500, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Sal", "kg", 1.0, "NO", "Central", "Produccion", "", "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Salame — Milan", "kg", 1.0, "NO", "Por area", "Produccion", 17879.01, "-Oy3x6FgGm8bAAjccrbI"], ["Deposito central", "Salamin — paquete unidad", "u", 1.0, "NO", "Por area", "Produccion", 29580.0956, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Salsa de chocolate x900gr", "kg", 1.0, "NO", "Central", "Produccion", 6611.5667, "-Oy3x5CU1wbvKIrHD_Ap"], ["Deposito central", "Salsa Inglesa", "kg", 1.0, "NO", "Central", "Produccion", 1319.0528, "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Salsa para pizza", "kg", 1.0, "NO", "Central", "Produccion", 856.8, "-Oy3x5HICG7dqWSc5Hqw"], ["Deposito central", "Salvado de trigo", "kg", 20.0, "NO", "Central", "Produccion", 948.0876, "-Oy3x5HICG7dqWSc5Hqw::jupiter"], ["Deposito central", "Satin carrot", "kg", 1.0, "NO", "Central", "Produccion", 8855.8518, ""], ["Deposito central", "Semillas de amapola", "kg", 1.0, "NO", "Central", "Produccion", 18600, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Semillas de sesamo", "kg", 1.0, "NO", "Central", "Produccion", 12400, "-Oy3x4zIVCAfQD8ZLMle"], ["Deposito central", "Sirope", "kg", 1.0, "NO", "Central", "Produccion", "", ""], ["Deposito central", "Tegral brownie", "kg", 1.0, "NO", "Central", "Produccion", 11056.9824, ""], ["Deposito central", "Tegral torta", "kg", 1.0, "NO", "Central", "Produccion", 7457.8272, "-Oy3x5PQG-Q_8gCTDCC4"], ["Deposito central", "Tomates", "kg", 1.0, "NO", "Por area", "Produccion", 3000, "-Oy9i7sX4WQLLHbd5dNR"], ["Deposito central", "Variegato Frutos del bosque", "kg", 1.0, "NO", "Por area", "Produccion", 11764.624, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Variegato Maracuya", "kg", 1.0, "NO", "Central", "Produccion", 10821.8183, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Yemas", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Cocina San Luis", "queso roquefort", "kg", 1.0, "NO", "Por area", "Produccion", 14027.53, ""], ["Especialidades", "Jamon cocido", "kg", 1.0, "NO", "Por area", "Produccion", 14983.0936, "-Oy3x6PIXYLxiYAtPhXd"], ["Especialidades", "Queso cremoso", "kg", 1.0, "NO", "Por area", "Produccion", 7293.9, "-Oy5lEAvhTTuFPOgLwJI"], ["Especialidades", "Queso sardo", "kg", 1.0, "NO", "Por area", "Produccion", 13294.7056, "-Oy3x6PIXYLxiYAtPhXd"], ["Especialidades", "Queso tybo", "kg", 1.0, "SI", "Por area", "Produccion", 33403.02, "-Oy3x6PIXYLxiYAtPhXd::la paulina"], ["Especialidades", "Tomates cherrys", "kg", 1.0, "NO", "Por area", "Produccion", 2000, "-Oy9i7sX4WQLLHbd5dNR"], ["Panadería", "Albahaca", "kg", 1.0, "NO", "Por area", "Produccion", 5000, "-Oy9i7sX4WQLLHbd5dNR"], ["Panadería", "Oregano", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Panadería", "Panes granos andinos", "kg", 1.0, "NO", "Por area", "Produccion", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4::puratos"], ["Panadería", "Panes multicereal", "kg", 1.0, "NO", "Por area", "Produccion", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4::puratos"], ["Panadería", "Panes salvado", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Panadería", "Premezcla pan de queso", "kg", 1.0, "NO", "Por area", "Produccion", 6885.0028, "-Oy3x5HICG7dqWSc5Hqw"], ["Panadería", "Romero", "kg", 1.0, "NO", "Por area", "Produccion", "", "-Oy3x4zIVCAfQD8ZLMle"], ["Panadería", "Spekkel", "kg", 1.0, "NO", "Por area", "Produccion", 9191.8819, "-Oy3x5PQG-Q_8gCTDCC4"], ["Pastelería", "Anana", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Pastelería", "Arandanos", "kg", 1.0, "NO", "Por area", "Produccion", "", ""], ["Pastelería", "Arandanos congelados", "kg", 1.0, "NO", "Por area", "Produccion", 6561.1, "-Oy3x6_YT0XO-LGdauVw"], ["Pastelería", "Frutillas", "kg", 1.0, "NO", "Por area", "Produccion", 12857.1429, "-Oy9i7sX4WQLLHbd5dNR"], ["Pastelería", "Frutos del bosque", "kg", 1.0, "SI", "Por area", "Produccion", 33057.85, "-Oy3x5CU1wbvKIrHD_Ap"], ["Pastelería", "Kiwi", "kg", 1.0, "NO", "Por area", "Produccion", 4500, "-Oy9i7sX4WQLLHbd5dNR"], ["Pastelería", "Mix de frutos rojos", "kg", 1.0, "NO", "Por area", "Produccion", 8700.0076, "-Oy3x6_YT0XO-LGdauVw"]];

// Referencia: NO se cuentan. Semielaborados propios y reventa/cafeteria.
const INSUMOS_FUERA = [["Deposito central", "Agua", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 2500, ""], ["Deposito central", "Agua saboriz", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 3200, ""], ["Deposito central", "Azucar en Sobre", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Bengala Gibre", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 826.45, "-OyYsCLjF8XwEJhXle4Q"], ["Deposito central", "Café en grano x kg", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 49610, "-Oy3x5kjWPRVdMK1uF8i::cherry’s season"], ["Deposito central", "café instantaneo", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 6252.0942, ""], ["Deposito central", "Café — paquete 1/4", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 13960.7, ""], ["Deposito central", "Edulcorante hileret forte x 400 sobres", "u", 400.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Gaseosa", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 3200, ""], ["Deposito central", "Hielo", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 1000, ""], ["Deposito central", "Higienol", "u", 30.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Horma", "u", 1.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Leche de almendras", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 2310.82, "-Oy3x79ILHmcrJFf2cFU"], ["Deposito central", "Leche de coco", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 3946.06, "-Oy3x79ILHmcrJFf2cFU"], ["Deposito central", "Leche Descremada", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 1052.22, ""], ["Deposito central", "Leche deslactosada", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 1435.26, "-Oy5lEAvhTTuFPOgLwJI"], ["Deposito central", "licor", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 8550.6667, "-Oy3x5U5rkDaNIAPsni2"], ["Deposito central", "Powerade Mountain Blast", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 11040, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Saquito de Te La Virginia", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Smoothie mix amarillo", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 5792.86, "-Oy3x6_YT0XO-LGdauVw::alif"], ["Deposito central", "Smoothie mix violeta", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 5792.86, "-Oy3x6_YT0XO-LGdauVw::alif"], ["Deposito central", "Soda", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 500, ""], ["Deposito central", "Sprite 1.5L", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 19999.88, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Sprite 2.25L", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 24999.87, "-Oy3x5cgg3zdamPydBR_"], ["Deposito central", "Stevia hileret x 400 sobres", "u", 400.0, "NO", "Central", "Reventa / cafeteria", "", "-Oy3x6PIXYLxiYAtPhXd"], ["Deposito central", "Syrope avellanas", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 13900, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Syrope caramelo", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 13899.996, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Syrope coco", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 13900, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Syrope vainilla", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 13900, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Syrup Pistacho", "L", 1.0, "NO", "Central", "Reventa / cafeteria", 17099.9983, "-Oy3x5zQJsff2tXic0En"], ["Deposito central", "Vela corta", "u", 1.0, "NO", "Central", "Reventa / cafeteria", 1652.89, "-OyYsCLjF8XwEJhXle4Q"], ["Deposito central", "Yogurt griego", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 6110, "-Oy9iSi3RKNpfwUiMVPE::mykra"], ["Deposito central", "Yogurt natural", "kg", 1.0, "NO", "Central", "Reventa / cafeteria", 5320, "-Oy9iSi3RKNpfwUiMVPE"], ["Deposito central", "Almibar P/Facturas", "kg", 1.0, "NO", "Central", "Semielaborado propio", 2155.3277617146, "_manual"], ["Deposito central", "Almibar Para Tortas", "kg", 1.0, "NO", "Central", "Semielaborado propio", 3565.2709519107993, "_manual"], ["Deposito central", "Bagel", "kg", 1.0, "NO", "Central", "Semielaborado propio", 800, ""], ["Deposito central", "Bizcochuelo de Vainilla", "kg", 1.0, "NO", "Central", "Semielaborado propio", 3158.9565846875003, "_manual"], ["Deposito central", "Churro", "u", 1.0, "NO", "Central", "Semielaborado propio", 600, ""], ["Deposito central", "Cookies", "u", 1.0, "NO", "Central", "Semielaborado propio", "", ""], ["Deposito central", "Crema Chantilly", "kg", 1.0, "NO", "Central", "Semielaborado propio", 5385.901122, "_manual"], ["Deposito central", "Crema Pastelera", "kg", 1.0, "NO", "Central", "Semielaborado propio", 1634.8938451722, "_manual"], ["Deposito central", "Croissant", "kg", 1.0, "NO", "Central", "Semielaborado propio", 1000, ""], ["Deposito central", "Donas", "kg", 1.0, "NO", "Central", "Semielaborado propio", 1400, ""], ["Deposito central", "Focaccia", "kg", 1.0, "NO", "Central", "Semielaborado propio", 1000, ""], ["Deposito central", "Ganache", "kg", 1.0, "NO", "Central", "Semielaborado propio", "", ""], ["Deposito central", "Helado", "kg", 1.0, "NO", "Central", "Semielaborado propio", 2400, ""], ["Deposito central", "Masa Frola", "kg", 1.0, "NO", "Central", "Semielaborado propio", 1374.5139795999999, "_manual"], ["Deposito central", "Miga de jamon cocido", "kg", 1.0, "NO", "Por area", "Semielaborado propio", "", ""], ["Deposito central", "Miga de jamon crudo", "kg", 1.0, "NO", "Por area", "Semielaborado propio", "", ""], ["Deposito central", "MiniBaguette", "kg", 1.0, "NO", "Central", "Semielaborado propio", "", ""], ["Deposito central", "Pan de miga", "kg", 1.0, "NO", "Central", "Semielaborado propio", 12500, "-Oy3x6pWOEfg-38KOqwf"], ["Deposito central", "Tortillas", "u", 1.0, "NO", "Central", "Semielaborado propio", "", ""], ["Deposito central", "Tostadas Blancas", "kg", 1.0, "NO", "Central", "Semielaborado propio", 3500, ""], ["Deposito central", "Tostadas Granos Andinos", "kg", 1.0, "NO", "Central", "Semielaborado propio", 4200, ""], ["Deposito central", "Tostadas Multicereal", "kg", 1.0, "NO", "Central", "Semielaborado propio", 4200, ""], ["Deposito central", "Tostadas Salvados", "kg", 1.0, "NO", "Central", "Semielaborado propio", 3800, ""], ["Deposito central", "Tulipas", "kg", 1.0, "NO", "Central", "Semielaborado propio", "", "_manual"]];

const PRODUCTOS = [["Panadería", "Bagel", "u"], ["Panadería", "Bizcochos", "kg"], ["Panadería", "Bizcochos de margarina", "kg"], ["Panadería", "Bizcochos redondos", "kg"], ["Panadería", "Bollitos B/N", "u"], ["Panadería", "Bollos grandes", "u"], ["Panadería", "Caseras", "u"], ["Panadería", "Caseritas", "u"], ["Panadería", "Chatas", "kg"], ["Panadería", "Cremona", "u"], ["Panadería", "Focaccia", "u"], ["Panadería", "Libritos", "u"], ["Panadería", "Mini Baguette", "u"], ["Panadería", "Miñon", "kg"], ["Panadería", "Pan de hamburguesa x6", "u"], ["Panadería", "Pan de leche", "u"], ["Panadería", "Pan de papa grande", "u"], ["Panadería", "Pan de papa x4", "u"], ["Panadería", "Pan de Viena", "u"], ["Panadería", "Pan lactal blanco", "u"], ["Panadería", "Pan lactal granos andinos", "u"], ["Panadería", "Pan lactal multicereal", "u"], ["Panadería", "Pan lactal salvado", "u"], ["Panadería", "Pan tostadas blanco", "u"], ["Panadería", "Pan tostadas granos andinos", "u"], ["Panadería", "Pan tostadas multicereal", "u"], ["Panadería", "Pan tostadas salvado", "u"], ["Panadería", "Pizzetas x4", "u"], ["Panadería", "Pre-pizzas", "u"], ["Panadería", "Salvado", "u"], ["Panadería", "Tortillas", "u"], ["Panadería", "Tortillon", "u"], ["Panadería", "TT Bizcochos", "kg"], ["Panadería", "TT Bollitos blancos", "u"], ["Panadería", "TT Bollitos negros", "u"], ["Panadería", "TT Caseras", "u"], ["Panadería", "TT Caseritas", "u"], ["Panadería", "TT Chatas", "kg"], ["Panadería", "TT Facturas", "u"], ["Panadería", "TT Miñon", "kg"], ["Panadería", "TT Salvado", "u"], ["Panadería", "TT Tortillas", "u"], ["Pastelería", "Alemana", "u"], ["Pastelería", "Bariloche", "u"], ["Pastelería", "Cabsha", "u"], ["Pastelería", "Cheesecake frutos rojos", "u"], ["Pastelería", "Cheesecake maracuyá", "u"], ["Pastelería", "Cheesecake NY cocido", "u"], ["Pastelería", "Chocotorta", "u"], ["Pastelería", "Delicia con chocolates", "u"], ["Pastelería", "Delicia con frutas", "u"], ["Pastelería", "Lemon Pie", "u"], ["Pastelería", "Marquise", "u"], ["Pastelería", "Mini Cabsha", "u"], ["Pastelería", "Mini Lemon Pie", "u"], ["Pastelería", "Mini Turrón Salteño", "u"], ["Pastelería", "Minitarta frutal", "u"], ["Pastelería", "Nutella", "u"], ["Pastelería", "Oreo", "u"], ["Pastelería", "Porción Alemana", "u"], ["Pastelería", "Porción Bariloche", "u"], ["Pastelería", "Porción Brownie c/fruta", "u"], ["Pastelería", "Porción Brownie c/chocolates", "u"], ["Pastelería", "Porción Carrot Cake", "u"], ["Pastelería", "Porción Cheesecake frutos rojos", "u"], ["Pastelería", "Porción Cheesecake maracuyá", "u"], ["Pastelería", "Porción Oreo", "u"], ["Pastelería", "Porción Pistachos", "u"], ["Pastelería", "Porción Red Velvet", "u"], ["Pastelería", "Porción Selva Negra", "u"], ["Pastelería", "Porción Tiramisú", "u"], ["Pastelería", "Porción Tres Leches", "u"], ["Pastelería", "Rogel", "u"], ["Pastelería", "Selva Negra", "u"], ["Pastelería", "Tarta frutal", "u"], ["Pastelería", "Tiramisú", "u"], ["Pastelería", "Torta de duraznos", "u"], ["Pastelería", "Torta de hojaldre", "u"], ["Pastelería", "Tres Leches", "u"], ["Pastelería", "Turrón Salteño", "u"], ["Especialidades", "Alfajores choco blanco", "u"], ["Especialidades", "Alfajores choco negro", "u"], ["Especialidades", "Alfajores choco negro grande", "u"], ["Especialidades", "Alfajores impalpable", "u"], ["Especialidades", "Boulévant", "u"], ["Especialidades", "Budín x kg naranja y amapola", "kg"], ["Especialidades", "Budín x kg nuez y dulce", "kg"], ["Especialidades", "Budín x unidad chico", "u"], ["Especialidades", "Cañoncitos", "u"], ["Especialidades", "Carasucias", "u"], ["Especialidades", "Chipa", "u"], ["Especialidades", "Chipa crudo bandeja x30", "u"], ["Especialidades", "Chips p/sandwich", "u"], ["Especialidades", "Conitos", "u"], ["Especialidades", "Cookies chips choco", "u"], ["Especialidades", "Cupcake", "u"], ["Especialidades", "Donas", "u"], ["Especialidades", "Figazzas", "u"], ["Especialidades", "Galletas de agua", "u"], ["Especialidades", "Galletas de agua semillas", "u"], ["Especialidades", "Maicenas chicas", "u"], ["Especialidades", "Maicenas grandes", "u"], ["Especialidades", "Milhojas c/chocolate", "u"], ["Especialidades", "Milhojas c/fondant", "u"], ["Especialidades", "Palmeritas", "u"], ["Especialidades", "Pan saborizado", "u"], ["Especialidades", "Pasta frola de cayote", "u"], ["Especialidades", "Pasta frola membrillo", "u"], ["Especialidades", "Pepitas", "u"], ["Especialidades", "Pizzeta de copetín", "u"], ["Especialidades", "Plancha de hojaldre x kg", "kg"], ["Especialidades", "Scones con fruta", "u"], ["Especialidades", "Scones sin fruta", "u"], ["Especialidades", "Spekell", "kg"], ["Especialidades", "Strudel", "u"], ["Especialidades", "Torta x porción", "u"], ["Facturería", "Churros rellenos x unidad", "u"], ["Facturería", "Churros x unidad", "u"], ["Facturería", "Croissant", "u"], ["Facturería", "Facturas c/crema", "u"], ["Facturería", "Facturas c/crema y DDL", "u"], ["Facturería", "Facturas c/crema y membr.", "u"], ["Facturería", "Libritos", "u"], ["Facturería", "Medialunas", "u"], ["Facturería", "Medialunas crudas x16", "u"], ["Facturería", "Medialunas saladas", "u"], ["Facturería", "Minifacturas", "kg"], ["Facturería", "Pan dulce", "u"], ["Facturería", "Roll de canela", "u"], ["Facturería", "Sacramento jamón y queso", "u"], ["Facturería", "Sacramentos", "u"], ["Facturería", "Vigilantes", "u"], ["Sandwiches", "Ciabatta de Lomito ahumado, muzzarella y rúcula con oliva", "u"], ["Sandwiches", "Ciabatta de Muzzarella, provolone, albahaca y cherrys confitados", "u"], ["Sandwiches", "Baguette de jamón cocido, queso, lechuga y tomate", "u"], ["Sandwiches", "Baguette de salame y queso", "u"], ["Sandwiches", "Miga de jamón cocido y queso", "u"], ["Sandwiches", "Miga de Ternera y tomate", "u"], ["Sandwiches", "Miga de ternera y huevo", "u"], ["Sandwiches", "Miga de crudo y queso", "u"], ["Sandwiches", "Miga de cantimpalo y queso", "u"]];
const MOTIVOS   = ["Quemado / mal cocido", "Mal armado / defectuoso", "Vencido / pasado", "Caido / roto", "Sobrante no vendido", "Prueba / degustacion", "Consumo del personal", "Devolucion de local", "Otro"];
const UNIDADES  = ["kg", "u", "L", "caja", "docena", "bandeja"];
const TIPOS     = ["Consumo del personal", "Cortesia", "Prueba / degustacion", "Merma", "Otro"];
const AMBITOS   = ["Deposito central", "Panadería", "Pastelería", "Especialidades", "Facturería", "Sandwiches", "Cocina San Luis"];
const PROD_SHEETS = {"panaderia": "4 Prod Panaderia", "pasteleria": "4 Prod Pasteleria", "especialidades": "4 Prod Especialidades", "factureria": "4 Prod Factureria", "sandwiches": "4 Prod Sandwiches", "cocina_sl": "4 Prod Cocina SL"};
const EXTRA_FILAS = {"panaderia": 8, "pasteleria": 8, "especialidades": 8, "factureria": 8, "sandwiches": 8, "cocina_sl": 40};

// Fechas por defecto; se pueden cambiar en la pestana Config.
const S1_INICIO = new Date(2026, 8, 1);   // martes 01/09/2026
const S2_INICIO = new Date(2026, 8, 22);  // martes 22/09/2026

const DIAS = ['MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO','LUNES'];

// ====================== PALETA (la de la app) ======================
const C_TIT='#4E2A1E', C_SUB='#6B3A2A', C_ACC='#F0C97A', C_ACC2='#E3F0FF';
const C_BANDA='#FFF8F0', C_INPUT='#FFF3CD', C_BORDE='#E8D5C0', C_CALC='#E8D5C0';
const FUENTE='Arial';

const HOJAS = ['Instrucciones','Config','Insumos','Productos','1 Stock','2 Compras','3 Conteo diario']
  .concat(AREAS.map(function(a){ return PROD_SHEETS[a[0]]; }))
  .concat(['5 Descartes','6 Ventas Fudo','7 Consumos internos','Listas']);

// ====================== PUNTOS DE ENTRADA ======================
function crearPlanilla() { construir_(false); }

function recrearPlanilla() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.alert('Rehacer la planilla',
    'Esto BORRA las pestanas de la planilla y las vuelve a crear vacias.\n\n' +
    'Se pierden todos los datos ya cargados. El link de la hoja de calculo no cambia.\n\n' +
    'Continuar?', ui.ButtonSet.YES_NO);
  if (r !== ui.Button.YES) { return; }
  construir_(true);
}

function construir_(borrarExistentes) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const existentes = ss.getSheets().filter(function(h){ return HOJAS.indexOf(h.getName()) >= 0; });

  if (existentes.length > 0) {
    if (!borrarExistentes) {
      throw new Error('Esta hoja de calculo ya tiene pestanas de la planilla (' +
        existentes.map(function(h){return h.getName();}).join(', ') + ').\n\n' +
        'Para rehacerla conservando el link, ejecute "recrearPlanilla".\n' +
        'Para empezar de cero, use una hoja de calculo nueva y vacia.');
    }
    // Hace falta al menos una hoja viva mientras se borra el resto.
    const temp = ss.insertSheet('__temp__');
    existentes.forEach(function(h){ ss.deleteSheet(h); });
    construirHojas_(ss);
    ss.deleteSheet(temp);
  } else {
    const previas = ss.getSheets();
    construirHojas_(ss);
    previas.forEach(function(h){
      if (h.getLastRow() === 0 && h.getLastColumn() === 0) { ss.deleteSheet(h); }
    });
  }

  ss.setActiveSheet(ss.getSheetByName('Instrucciones'));
  try {
    SpreadsheetApp.getUi().alert('Listo. ' + HOJAS.length + ' pestanas creadas.\n\n' +
      'Siguiente paso: en la pestana "Insumos" revisar CONTENIDO POR BULTO y la ' +
      'columna ALCANCE (que se cuenta en el deposito y que se cuenta por area).');
  } catch (e) { /* sin interfaz disponible */ }
}

function construirHojas_(ss) {
  crearListas_(ss);
  crearInstrucciones_(ss);
  crearConfig_(ss);
  crearInsumos_(ss);
  crearProductos_(ss);
  crearStock_(ss);
  crearCompras_(ss);
  crearConteoDiario_(ss);
  AREAS.forEach(function(a){ crearProduccion_(ss, a[0], a[1]); });
  crearDescartes_(ss);
  crearVentasFudo_(ss);
  crearConsumosInternos_(ss);
}

// ====================== HELPERS ======================
function hoja_(ss, nombre, ncols) {
  const h = ss.insertSheet(nombre);
  // Una hoja nueva trae 26 columnas: las grillas de 14 dias necesitan mas.
  if (ncols && ncols > h.getMaxColumns()) {
    h.insertColumnsAfter(h.getMaxColumns(), ncols - h.getMaxColumns());
  }
  h.getRange(1, 1, h.getMaxRows(), h.getMaxColumns()).setFontFamily(FUENTE).setFontSize(10);
  return h;
}
function titulo_(h, ncols, texto, sub) {
  h.getRange(1,1,1,ncols).merge().setValue(texto).setBackground(C_TIT).setFontColor('#FFFFFF')
   .setFontWeight('bold').setFontSize(13).setVerticalAlignment('middle');
  h.setRowHeight(1, 30);
  h.getRange(2,1,1,ncols).merge().setValue(sub).setBackground(C_SUB).setFontColor('#FFFFFF')
   .setFontSize(9).setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(2, 26);
}
function cabecera_(h, fila, enc) {
  h.getRange(fila,1,1,enc.length).setValues([enc]).setBackground(C_SUB).setFontColor('#FFFFFF')
   .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center')
   .setVerticalAlignment('middle').setWrap(true);
  h.setRowHeight(fila, 34);
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
  for (var r = f; r < f + nf; r++) {
    if ((r - f) % 2 === 1) { h.getRange(r,1,1,nc).setBackground(C_BANDA); }
  }
}
function unicos_(arr, idx) {
  const v = {}, o = [];
  arr.forEach(function(r){ if (!v[r[idx]]) { v[r[idx]] = 1; o.push(r[idx]); } });
  return o;
}
function criticos_() { return INSUMOS.filter(function(r){ return r[4] === 'SI'; }); }
function rgAmbitos_(ss){ return ss.getSheetByName('Listas').getRange(2,1,AMBITOS.length,1); }
function rgInsumos_(ss){ return ss.getSheetByName('Listas').getRange(2,2,unicos_(INSUMOS,1).length,1); }
function rgMotivos_(ss){ return ss.getSheetByName('Listas').getRange(2,3,MOTIVOS.length,1); }
function rgUnidades_(ss){ return ss.getSheetByName('Listas').getRange(2,4,UNIDADES.length,1); }
function rgProductos_(ss){ return ss.getSheetByName('Listas').getRange(2,5,unicos_(PRODUCTOS,1).length,1); }
function rgTipos_(ss){ return ss.getSheetByName('Listas').getRange(2,6,TIPOS.length,1); }
function rgAreas_(ss){ return ss.getSheetByName('Listas').getRange(2,7,AREAS.length,1); }

/**
 * Cabecera de 3 filas para las grillas de 14 dias:
 *   fila 1  SEMANA 1 / SEMANA 2 (una banda por semana)
 *   fila 2  el dia y su fecha (una celda cada 'subs.length' columnas)
 *   fila 3  las sub-columnas (Bultos/Parcial, Elaborado/Descarte)
 * Los datos arrancan en la fila 4.
 */
function cabeceraDias_(h, fijas, subs) {
  const nf = fijas.length, ns = subs.length;
  // Las columnas fijas: filas 1-2 solo pintadas y la etiqueta en la fila 3.
  // La fila 3 queda SIN combinar en todo su ancho para que el filtro funcione.
  for (var i = 0; i < nf; i++) {
    h.getRange(1,i+1,2,1).setBackground(C_SUB);
    h.getRange(3,i+1).setValue(fijas[i]).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center')
     .setVerticalAlignment('middle').setWrap(true);
  }
  for (var s = 0; s < 2; s++) {
    const base = s === 0 ? 'Config!$B$3' : 'Config!$B$5';
    const c0s  = nf + 1 + s * 7 * ns;
    h.getRange(1, c0s, 1, 7*ns).merge()
     .setFormula('=IF(' + base + '="","SEMANA ' + (s+1) + '","SEMANA ' + (s+1) + '   ·   "&TEXT(' +
                 base + ',"dd/mm")&"  al  "&TEXT(' + base + '+6,"dd/mm"))')
     .setBackground(s === 0 ? C_ACC : C_ACC2).setFontColor(C_TIT).setFontWeight('bold')
     .setFontSize(10).setHorizontalAlignment('center').setVerticalAlignment('middle');
    for (var d = 0; d < 7; d++) {
      const c0 = c0s + d * ns;
      h.getRange(2, c0, 1, ns).merge()
       .setFormula('=IF(' + base + '="","' + DIAS[d].substring(0,3) + '","' +
                   DIAS[d].substring(0,3) + ' "&TEXT(' + base + '+' + d + ',"dd/mm"))')
       .setBackground(s === 0 ? C_ACC : C_ACC2).setFontColor(C_TIT).setFontWeight('bold')
       .setFontSize(9).setHorizontalAlignment('center').setVerticalAlignment('middle');
      h.getRange(3, c0, 1, ns).setValues([subs]).setBackground(C_SUB).setFontColor('#FFFFFF')
       .setFontWeight('bold').setFontSize(8).setHorizontalAlignment('center')
       .setVerticalAlignment('middle').setWrap(true);
    }
  }
  h.setRowHeight(1,22); h.setRowHeight(2,20); h.setRowHeight(3,24);
  h.setFrozenRows(3); h.setFrozenColumns(nf);
}

// ====================== LISTAS (oculta) ======================
function crearListas_(ss) {
  const h = hoja_(ss, 'Listas');
  const col = function(a){ return a.map(function(v){ return [v]; }); };
  h.getRange(1,1,1,7).setValues([['AMBITOS','INSUMOS','MOTIVOS','UNIDADES','PRODUCTOS','TIPOS','AREAS']])
   .setFontWeight('bold');
  const iu = unicos_(INSUMOS,1), pu = unicos_(PRODUCTOS,1);
  h.getRange(2,1,AMBITOS.length,1).setValues(col(AMBITOS));
  h.getRange(2,2,iu.length,1).setValues(col(iu));
  h.getRange(2,3,MOTIVOS.length,1).setValues(col(MOTIVOS));
  h.getRange(2,4,UNIDADES.length,1).setValues(col(UNIDADES));
  h.getRange(2,5,pu.length,1).setValues(col(pu));
  h.getRange(2,6,TIPOS.length,1).setValues(col(TIPOS));
  h.getRange(2,7,AREAS.length,1).setValues(AREAS.map(function(a){ return [a[1]]; }));
  h.hideSheet();
}

// ====================== INSTRUCCIONES ======================
function crearInstrucciones_(ss) {
  const h = hoja_(ss, 'Instrucciones');
  anchos_(h, [30, 900]);
  titulo_(h, 2, 'CONTROL DE STOCK - CANDELA CAFE & PATISSERIE',
    'Dos semanas de medicion, de MARTES a LUNES: del 01/09 al 07/09 y del 22/09 al 28/09. Planilla de CARGA: el analisis se hace aparte.');
  const G = [
   ['h','QUE SE VA A OBTENER'],
   ['li','CONSUMO REAL POR INSUMO = stock inicial + compras - stock final. Cuanto se uso de verdad de cada insumo en la semana.'],
   ['li','DIFERENCIA POR PRODUCTO = elaborado - vendido - consumo interno - descarte. Lo que salio sin explicacion.'],
   ['h','ANTES DE ARRANCAR (antes del martes 01/09)'],
   ['li','Pestana CONFIG: confirmar las fechas de las dos semanas y poner el jefe de cada area.'],
   ['li','Pestana INSUMOS, columna CONTENIDO POR BULTO: viene inferida del nombre. Confirmar contra el envase real. Si esto esta mal, el analisis sale mal.'],
   ['li','Pestana INSUMOS, columna ALCANCE: "Deposito central" = se cuenta UNA sola vez. "Por area" = cada area cuenta lo suyo. Revisar que coincida con donde esta guardado de verdad cada insumo.'],
   ['li','Pestana INSUMOS, columna CRITICO: los marcados con SI son los unicos que se cuentan todos los dias. Vienen ' + criticos_().length + ' marcados.'],
   ['h','QUE SE CARGA CADA SEMANA'],
   ['li','1 STOCK - cuatro conteos: el martes temprano y el lunes al cierre, de cada una de las dos semanas. Cada conteo tiene sus propias columnas.'],
   ['li','2 COMPRAS - cada vez que entra mercaderia, EN EL MOMENTO. Un ingreso sin anotar aparece despues como un faltante que no existe.'],
   ['li','3 CONTEO DIARIO - al cierre de cada jornada, solo los insumos criticos.'],
   ['li','4 PRODUCCION (una pestana por area) - lo ELABORADO y lo DESCARTADO de cada producto, dia por dia.'],
   ['li','5 DESCARTES - una linea por cada cosa que se tira, CON EL MOTIVO. Es lo que justifica los faltantes.'],
   ['h','AL TERMINAR CADA SEMANA'],
   ['li','6 VENTAS FUDO - pegar el export de ventas por producto y mapear cada linea al producto de Candela.'],
   ['li','7 CONSUMOS INTERNOS - consumos del personal y cortesias de Fudo. Sin esto, el consumo legitimo se confunde con faltante.'],
   ['h','COMO CONTAR EL STOCK'],
   ['p','Bultos cerrados + lo que hay suelto del envase abierto. Ejemplo: 3 bolsas de 25 kg mas 8,5 kg sueltos -> BULTOS = 3, PARCIAL = 8,5. El TOTAL (83,5 kg) lo calcula la planilla.'],
   ['warn','Los dos conteos de la misma semana los tiene que hacer la misma persona y con el mismo criterio. Si el inicial se hace prolijo y el final "a ojo", el resultado es un numero limpio y falso.'],
   ['h','REGLA DE ORO'],
   ['p','Solo se escribe en las celdas AMARILLAS. Lo demas es formula o dato del catalogo.'],
   ['warn','Conviene proteger antes de compartir: Datos -> Proteger hojas y rangos. Si algo se rompe, Archivo -> Historial de versiones permite volver atras.'],
  ];
  var r = 4;
  G.forEach(function(x){
    const cel = h.getRange(r, 2);
    if (x[0] === 'h') {
      cel.setValue(x[1]).setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(11);
      h.setRowHeight(r, 24);
    } else {
      cel.setValue(x[0] === 'li' ? '   -  ' + x[1] : x[1]).setWrap(true).setVerticalAlignment('top');
      if (x[0] === 'warn') { cel.setBackground('#FDECEA').setFontColor('#C0392B').setFontWeight('bold'); }
      h.setRowHeight(r, Math.max(20, 15 * Math.ceil(x[1].length / 105)));
    }
    r++;
  });
  h.setFrozenRows(3);
}

// ====================== CONFIG ======================
function crearConfig_(ss) {
  const h = hoja_(ss, 'Config');
  anchos_(h, [240, 140, 140, 240]);
  titulo_(h, 4, 'CONFIGURACION DE LAS DOS SEMANAS',
    'Completar solo las celdas amarillas. Las fechas de todas las grillas salen de aca.');
  const filasFecha = [
    ['Semana 1 - inicio (martes)', S1_INICIO],
    ['Semana 1 - cierre (lunes)',  null],
    ['Semana 2 - inicio (martes)', S2_INICIO],
    ['Semana 2 - cierre (lunes)',  null]
  ];
  for (var i = 0; i < 4; i++) {
    const r = 3 + i;
    h.getRange(r,1).setValue(filasFecha[i][0]).setFontWeight('bold');
    if (filasFecha[i][1]) {
      input_(h, r, 2, 1, 1);
      h.getRange(r,2).setValue(filasFecha[i][1]);
    } else {
      h.getRange(r,2).setFormula('=IF($B$' + (r-1) + '="","",$B$' + (r-1) + '+6)');
    }
    h.getRange(r,2).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  }
  h.getRange(3,3,1,2).merge().setValue('Las dos semanas van de martes a lunes.')
   .setFontStyle('italic').setFontColor('#7A5C4A');

  cabecera_(h, 8, ['DIA','SEMANA 1','SEMANA 2','OBSERVACIONES']);
  bandas_(h, 9, 7, 4);
  for (var d = 0; d < 7; d++) {
    const r = 9 + d;
    h.getRange(r,1).setValue(DIAS[d].charAt(0) + DIAS[d].substring(1).toLowerCase()).setFontWeight('bold');
    h.getRange(r,2).setFormula('=IF($B$3="","",$B$3+' + d + ')');
    h.getRange(r,3).setFormula('=IF($B$5="","",$B$5+' + d + ')');
    h.getRange(r,2,1,2).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
    input_(h, r, 4, 1, 1);
  }

  h.getRange(18,1,1,4).merge().setValue('RESPONSABLES POR AREA')
   .setBackground(C_SUB).setFontColor('#FFFFFF').setFontWeight('bold');
  cabecera_(h, 19, ['AREA','DONDE SE ELABORA','JEFE DE AREA','FIRMA / ACLARACION']);
  const fa = AREAS.map(function(a){
    return [a[1], a[0] === 'cocina_sl' ? 'Local San Luis' : 'Central', '', ''];
  });
  h.getRange(20,1,fa.length,4).setValues(fa);
  h.getRange(20,1,fa.length,1).setFontWeight('bold');
  bandas_(h, 20, fa.length, 4);
  input_(h, 20, 2, fa.length, 3);
  h.setFrozenRows(2);
}

// ====================== INSUMOS (maestro) ======================
function crearInsumos_(ss) {
  const h = hoja_(ss, 'Insumos');
  anchos_(h, [140, 280, 65, 95, 85, 95, 150, 110, 150]);
  const todos = INSUMOS.concat(INSUMOS_FUERA);
  titulo_(h, 9, 'MAESTRO DE INSUMOS (' + INSUMOS.length + ' en control, ' + INSUMOS_FUERA.length + ' fuera)',
    'Lista real exportada del modulo de costeo. REVISAR: CONTENIDO POR BULTO (inferido del nombre) y AMBITO (donde se cuenta). ' +
    'Las filas grises son semielaborados propios y reventa: quedan de referencia pero no se cuentan.');
  cabecera_(h, 3, ['AMBITO\n(donde se cuenta)','INSUMO','UNIDAD','CONTENIDO\nPOR BULTO','CRITICO\n(conteo diario)',
                   'ALCANCE','GRUPO','PRECIO\nACTUAL $','PROVEEDOR (id)']);
  const n = todos.length;
  h.getRange(4,1,n,9).setValues(todos);
  h.getRange(4,2,n,1).setFontWeight('bold');
  h.getRange(4,3,n,4).setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.##');
  h.getRange(4,8,n,1).setNumberFormat('$#,##0.00');
  bandas_(h, 4, n, 9);
  input_(h, 4, 3, INSUMOS.length, 4);
  // los que no se cuentan van en gris, para que se distingan de un vistazo
  if (INSUMOS_FUERA.length > 0) {
    h.getRange(4 + INSUMOS.length, 1, INSUMOS_FUERA.length, 9)
     .setBackground('#F1F1F1').setFontColor('#8A8A8A').setFontStyle('italic');
  }
  lista_(h, 4, 1, INSUMOS.length, rgAmbitos_(ss));
  lista_(h, 4, 3, INSUMOS.length, rgUnidades_(ss));
  h.getRange(4,5,INSUMOS.length,1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['SI','NO'], true).setAllowInvalid(true).build());
  h.getRange(4,6,INSUMOS.length,1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Central','Por area'], true).setAllowInvalid(true).build());
  h.setFrozenRows(3); h.setFrozenColumns(2);
  h.getRange(3,1,n+1,9).createFilter();
}

// ====================== PRODUCTOS (maestro) ======================
function crearProductos_(ss) {
  const h = hoja_(ss, 'Productos');
  anchos_(h, [140, 420, 70, 130]);
  titulo_(h, 4, 'MAESTRO DE PRODUCTOS ELABORADOS (' + PRODUCTOS.length + ')',
    'Cocina San Luis no tiene productos en el catalogo de la app: se cargan a mano en su pestana de produccion.');
  cabecera_(h, 3, ['AREA','PRODUCTO','UNIDAD','DONDE SE ELABORA']);
  const n = PRODUCTOS.length;
  h.getRange(4,1,n,4).setValues(PRODUCTOS.map(function(r){
    return [r[0], r[1], r[2], r[0] === 'Cocina San Luis' ? 'Local San Luis' : 'Central'];
  }));
  h.getRange(4,3,n,2).setHorizontalAlignment('center');
  bandas_(h, 4, n, 4);
  h.setFrozenRows(3); h.setFrozenColumns(2);
  h.getRange(3,1,n+1,4).createFilter();
}

// ====================== 1 STOCK (los 4 conteos) ======================
function crearStock_(ss) {
  const h = hoja_(ss, '1 Stock');
  anchos_(h, [140, 250, 65, 95, 75,75,85, 75,75,85, 75,75,85, 75,75,85, 90, 200]);
  titulo_(h, 18, 'PLANILLA 1 - STOCK DE INSUMOS (4 conteos)',
    'Martes temprano y lunes al cierre, en cada una de las dos semanas. Bultos cerrados + lo que hay suelto del envase abierto: el TOTAL lo calcula la planilla.');
  const BLOQUES = [
    ['STOCK INICIAL S1', 'Config!$B$3', C_ACC],
    ['STOCK FINAL S1',   'Config!$B$4', C_ACC],
    ['STOCK INICIAL S2', 'Config!$B$5', C_ACC2],
    ['STOCK FINAL S2',   'Config!$B$6', C_ACC2]
  ];
  const FIJAS = ['AMBITO','INSUMO','UNID.','CONT/\nBULTO'];
  for (var i = 0; i < FIJAS.length; i++) {
    h.getRange(3,i+1).setBackground(C_SUB);
    h.getRange(4,i+1).setValue(FIJAS[i]).setBackground(C_SUB).setFontColor('#FFFFFF')
     .setFontWeight('bold').setFontSize(9).setHorizontalAlignment('center')
     .setVerticalAlignment('middle').setWrap(true);
  }
  for (var b = 0; b < 4; b++) {
    const c0 = 5 + b * 3;
    h.getRange(3,c0,1,3).merge()
     .setFormula('=IF(' + BLOQUES[b][1] + '="","' + BLOQUES[b][0] + '","' + BLOQUES[b][0] +
                 '   "&TEXT(' + BLOQUES[b][1] + ',"dd/mm"))')
     .setBackground(BLOQUES[b][2]).setFontColor(C_TIT).setFontWeight('bold').setFontSize(9)
     .setHorizontalAlignment('center').setVerticalAlignment('middle');
    h.getRange(4,c0,1,3).setValues([['Bultos','Parcial','TOTAL']]).setBackground(C_SUB)
     .setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(8)
     .setHorizontalAlignment('center').setVerticalAlignment('middle');
  }
  h.getRange(3,17,1,2).setBackground(C_SUB);
  h.getRange(4,17,1,2).setValues([['CONTO','OBSERVACIONES']]).setBackground(C_SUB)
   .setFontColor('#FFFFFF').setFontWeight('bold').setFontSize(9)
   .setHorizontalAlignment('center').setVerticalAlignment('middle');
  h.setRowHeight(3,22); h.setRowHeight(4,20);

  const n = INSUMOS.length;
  h.getRange(5,1,n,4).setValues(INSUMOS.map(function(r){ return [r[0], r[1], r[2], r[3]]; }));
  h.getRange(5,2,n,1).setFontWeight('bold');
  h.getRange(5,3,n,2).setHorizontalAlignment('center');
  bandas_(h, 5, n, 4);
  for (var b2 = 0; b2 < 4; b2++) {
    const c0 = 5 + b2 * 3;
    const cb = String.fromCharCode(64 + c0), cp = String.fromCharCode(64 + c0 + 1);
    const fs = [];
    for (var i2 = 0; i2 < n; i2++) {
      const r = 5 + i2;
      fs.push(['=IF(AND(' + cb + r + '="",' + cp + r + '=""),"",IFERROR(' + cb + r + '*$D' + r +
               ',0)+IFERROR(' + cp + r + ',0))']);
    }
    input_(h, 5, c0, n, 2);
    h.getRange(5,c0,n,2).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
    h.getRange(5,c0+2,n,1).setFormulas(fs).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
    calc_(h, 5, c0+2, n, 1);
  }
  input_(h, 5, 17, n, 2);
  h.setFrozenRows(4); h.setFrozenColumns(2);
  h.getRange(4,1,n+1,18).createFilter();
}

// ====================== 2 COMPRAS ======================
function crearCompras_(ss) {
  const h = hoja_(ss, '2 Compras');
  anchos_(h, [95, 160, 140, 140, 250, 110, 65, 120]);
  titulo_(h, 8, 'PLANILLA 2 - COMPRAS E INGRESOS DE MERCADERIA',
    'Una linea cada vez que entra mercaderia, EN EL MOMENTO. La CANTIDAD va en la unidad base del insumo (kg, u, L), no en bultos. La fecha define a que semana pertenece.');
  cabecera_(h, 3, ['FECHA','PROVEEDOR','N° REMITO / FACTURA','AMBITO QUE LO RECIBE','INSUMO',
                   'CANTIDAD\n(unidad base)','UNIDAD','IMPORTE TOTAL $']);
  const n = 250;
  input_(h, 4, 1, n, 8);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,6,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,7,n,1).setHorizontalAlignment('center');
  h.getRange(4,8,n,1).setNumberFormat('$#,##0.00');
  lista_(h, 4, 4, n, rgAmbitos_(ss));
  lista_(h, 4, 5, n, rgInsumos_(ss));
  lista_(h, 4, 7, n, rgUnidades_(ss));
  h.setFrozenRows(3);
  h.getRange(3,1,n+1,8).createFilter();
}

// ====================== 3 CONTEO DIARIO DE CRITICOS ======================
function crearConteoDiario_(ss) {
  const h = hoja_(ss, '3 Conteo diario', 32);
  const crit = criticos_();
  const ws = [140, 230, 60, 85];
  for (var i = 0; i < 28; i++) { ws.push(66); }
  anchos_(h, ws);
  cabeceraDias_(h, ['AMBITO','INSUMO','UNID.','CONT/\nBULTO'], ['Bultos','Parcial']);
  h.getRange(4,1,crit.length,4).setValues(crit.map(function(r){ return [r[0], r[1], r[2], r[3]]; }));
  h.getRange(4,2,crit.length,1).setFontWeight('bold');
  h.getRange(4,3,crit.length,2).setHorizontalAlignment('center');
  bandas_(h, 4, crit.length, 4);
  input_(h, 4, 5, crit.length, 28);
  h.getRange(4,5,crit.length,28).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(3,1,crit.length+1,32).createFilter();
}

// ====================== 4 PRODUCCION DIARIA POR AREA ======================
function crearProduccion_(ss, clave, etiqueta) {
  const h = hoja_(ss, PROD_SHEETS[clave], 30);
  const ws = [400, 60];
  for (var i = 0; i < 28; i++) { ws.push(i % 2 === 0 ? 76 : 68); }
  anchos_(h, ws);
  cabeceraDias_(h, ['PRODUCTO - ' + etiqueta.toUpperCase(), 'UNID.'], ['Elab.','Desc.']);
  const props = PRODUCTOS.filter(function(r){ return r[0] === etiqueta; });
  const extra = EXTRA_FILAS[clave] || 8;
  const total = props.length + extra;
  bandas_(h, 4, total, 2);
  if (props.length > 0) {
    h.getRange(4,1,props.length,2).setValues(props.map(function(r){ return [r[1], r[2]]; }));
  }
  if (extra > 0) { input_(h, 4 + props.length, 1, extra, 2); }
  h.getRange(4,2,total,1).setHorizontalAlignment('center');
  input_(h, 4, 3, total, 28);
  h.getRange(4,3,total,28).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
}

// ====================== 5 DESCARTES ======================
function crearDescartes_(ss) {
  const h = hoja_(ss, '5 Descartes');
  anchos_(h, [95, 140, 330, 90, 65, 190, 130, 220]);
  titulo_(h, 8, 'PLANILLA 5 - DESCARTES, QUEMADO Y TIRADO',
    'Una linea por cada cosa que se descarta, CON EL MOTIVO. Lo que no se anota aca se lee despues como perdida sin explicacion.');
  cabecera_(h, 3, ['FECHA','AREA','PRODUCTO O INSUMO','CANTIDAD','UNIDAD','MOTIVO','RESPONSABLE','OBSERVACIONES']);
  const n = 250;
  input_(h, 4, 1, n, 8);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,5,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 2, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgUnidades_(ss));
  lista_(h, 4, 6, n, rgMotivos_(ss));
  h.setFrozenRows(3);
  h.getRange(3,1,n+1,8).createFilter();
}

// ====================== 6 VENTAS SEGUN FUDO ======================
function crearVentasFudo_(ss) {
  const h = hoja_(ss, '6 Ventas Fudo');
  anchos_(h, [300, 110, 110, 140, 340]);
  titulo_(h, 5, 'CARGA 6 - VENTAS POR PRODUCTO SEGUN FUDO',
    'Pegar el export en A y B, indicar a que SEMANA corresponde, y mapear cada linea al area y al producto de Candela. Lo que no se mapea no entra en la comparacion.');
  cabecera_(h, 3, ['PRODUCTO SEGUN FUDO\n(pegar del export)','UNIDADES\nVENDIDAS','SEMANA\n(1 o 2)',
                   'AREA DE CANDELA','PRODUCTO DE CANDELA']);
  const n = 400;
  input_(h, 4, 1, n, 5);
  h.getRange(4,2,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,3,n,2).setHorizontalAlignment('center');
  h.getRange(4,3,n,1).setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['1','2'], true).setAllowInvalid(true).build());
  lista_(h, 4, 4, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgProductos_(ss));
  h.setFrozenRows(3);
  h.getRange(3,1,n+1,5).createFilter();
}

// ====================== 7 CONSUMOS INTERNOS ======================
function crearConsumosInternos_(ss) {
  const h = hoja_(ss, '7 Consumos internos');
  anchos_(h, [95, 330, 140, 90, 65, 180, 150]);
  titulo_(h, 7, 'CARGA 7 - CONSUMOS INTERNOS Y CORTESIAS',
    'Todo lo que se consumio sin venderse: personal, cortesias, pruebas. Es lo que separa el consumo legitimo del faltante real.');
  cabecera_(h, 3, ['FECHA','PRODUCTO DE CANDELA','AREA','CANTIDAD','UNIDAD','TIPO','RESPONSABLE / SECTOR']);
  const n = 250;
  input_(h, 4, 1, n, 7);
  h.getRange(4,1,n,1).setNumberFormat('dd/mm/yyyy').setHorizontalAlignment('center');
  h.getRange(4,4,n,1).setNumberFormat('#,##0.##').setHorizontalAlignment('center');
  h.getRange(4,5,n,1).setHorizontalAlignment('center');
  lista_(h, 4, 2, n, rgProductos_(ss));
  lista_(h, 4, 3, n, rgAreas_(ss));
  lista_(h, 4, 5, n, rgUnidades_(ss));
  lista_(h, 4, 6, n, rgTipos_(ss));
  h.setFrozenRows(3);
  h.getRange(3,1,n+1,7).createFilter();
}
