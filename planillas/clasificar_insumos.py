# -*- coding: utf-8 -*-
"""
Genera insumos_procesados.json a partir de insumos_export_firebase.json
(export real de Firebase costeo/insumos, 213 registros).

Aplica:
  - Fusion de 9 productos cargados 2-3 veces con distinta presentacion/marca.
  - Descarte de 8 precios imposibles (para no arrastrar el error al valorizar).
  - Clasificacion en 9 AMBITOS: Deposito central, las 5 areas de la cuadra
    de produccion, Barra SLA 5.0, Barra San Luis y Cocina San Luis.
  - Marca de insumos CRITICOS (unicos con seguimiento de compras por factura).

LIMITE CONOCIDO: el export no trae area de la cuadra. Se intento matchear
contra el catalogo viejo de la app y NINGUN insumo emparejo de forma unica
por area (los nombres no coinciden exactamente) -> todos los perecederos
de la cuadra terminan en 'Deposito central' por default. Hay que revisar
y reasignar a mano en la columna AMBITO de la pestana Insumos.
"""
import json, io, unicodedata, re, collections

def nz(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s or '') if unicodedata.category(c) != 'Mn').lower().strip()

FUSIONES = {
    'azucar x 1 kg': 'Azucar', 'azucar x 50 kg': 'Azucar', 'azucar dona bertina x 1 kg': 'Azucar',
    'manteca en pilon': 'Manteca', 'manteca teodoro x 5 kg': 'Manteca',
    'mayonesa': 'Mayonesa', 'mayonesa — paquete 1 kg': 'Mayonesa',
    'miel de abeja': 'Miel de abeja', 'miel de abeja — squezze aleluya': 'Miel de abeja',
    'galletas chocolinas': 'Galletas chocolinas', 'chocolinas': 'Galletas chocolinas',
    'queso tybo': 'Queso tybo', 'tybo sandwich la paulina': 'Queso tybo',
    'queso muzzarella': 'Queso muzzarella', 'mozzarella cilindro aurora / pianu': 'Queso muzzarella',
    'lentejas chocolate': 'Lentejas chocolate', 'rocklets - lentejas de chocolate': 'Lentejas chocolate',
    'cerezas en lata': 'Cerezas en lata', 'cerezas — cofrutos': 'Cerezas en lata',
}
PRECIO_DUDOSO = {'manteca en pilon', 'romero', 'sal', 'tulipas', 'minibaguette', 'ganache',
                 'saquito de te la virginia', 'azucar en sobre'}

UNI = {'kg': 'kg', 'litros': 'L', 'l': 'L', 'unidad': 'u', 'docena': 'docena', '500 cc': 'u', '1/4': 'u', 'bolsa': 'u'}

def unidad(u, n):
    v = UNI.get((u or '').strip().lower())
    if v: return v
    x = nz(n)
    if any(k in x for k in ('leche', 'crema vegetal', 'aceite', 'syrop', 'licor', 'soda')): return 'L'
    if any(k in x for k in ('sobre', 'paquete', 'vela', 'horma', 'higienol', 'sprite', 'powerade')): return 'u'
    return 'kg'

def bulto(n, cont):
    m = re.search(r'x\s*(\d+)\s*kg', nz(n))
    if m: return float(m.group(1))
    try:
        if cont and float(cont) > 0: return float(cont)
    except Exception:
        pass
    return 1.0

# Insumos claramente de BARRA (cafeteria: se cuentan por local de venta).
BARRA_KW = ['cafe', 'café', 'leche', 'syrope', 'syrup', 'licor', 'chocolate para submarino',
            'te la virginia', 'saquito', 'crema chantilly', 'crema pastelera', 'azucar en sobre',
            'edulcorante', 'stevia']
# Ingredientes de Cocina San Luis (frappuccino/licuado/smoothie/jugo/limonada).
COCINA_SL_KW = ['helado', 'smoothie mix', 'frutilla', 'arandano', 'kiwi', 'banana', 'naranja',
                'limon', 'ananá', 'anana', 'durazno', 'miel de ca']
# Bebidas embotelladas de reventa directa: no son insumo de preparacion de nadie.
RESVENTA_KW = ['sprite', 'powerade', 'gaseosa', ' soda', 'agua saboriz']
PEREC = ['manteca', 'crema de leche', 'crema vegetal', 'leche entera', 'queso', 'muzzarella', 'tybo',
         'sardo', 'roquefort', 'azul', 'de cabra', 'jamon', 'crudo', 'cantimpalo', 'salame', 'salamin',
         'mortadela', 'bondiola', 'culatello', 'pernil', 'peceto', 'lomito', 'claras', 'yemas', 'huevos',
         'tomate', 'lechuga', 'rucula', 'palta', 'durazno', 'albahaca', 'oregano', 'frutas',
         'frutos del bosque', 'mix de frutos rojos', 'congelad', 'panes ', 'spekkel', 'pasas de uva']
CENTRAL_FORZ = ['al natural', 'en lata', 'mermelada', 'dulce de', 'jalea', 'fruta abrillantada', 'salsa']

def alcance_ambito(n):
    x = ' ' + nz(n) + ' '
    if any(k in x for k in RESVENTA_KW): return 'Central', 'Deposito central'
    if any(k in x for k in CENTRAL_FORZ): return 'Central', 'Deposito central'
    if any(nz(k) in x for k in BARRA_KW): return 'Barra', 'Barra SLA 5.0 / San Luis'
    if any(nz(k) in x for k in COCINA_SL_KW): return 'Cocina San Luis', 'Cocina San Luis'
    if any(k in x for k in PEREC): return 'Por area (cuadra)', ''
    return 'Central', 'Deposito central'

STAPLES = ['harina 000', 'harina 0000', 'manteca', 'margarina hojaldre', 'margarina masa',
           'grasa', 'levadura', 'huevos', 'crema de leche', 'crema vegetal', 'leche entera',
           'dulce de leche', 'cafe en grano', 'café en grano', 'cafe instantaneo']
NUNCA = ['sal', 'romero', 'oregano', 'colorante', 'azucar en sobre']
UMBRAL = 18000.0

def critico(n, precio):
    x = nz(n)
    if any(x.startswith(nz(k)) for k in NUNCA): return 'NO'
    if x == 'azucar': return 'SI'
    if any(nz(k) in x for k in STAPLES): return 'SI'
    return 'SI' if (precio or 0) >= UMBRAL else 'NO'

def area_cuadra(n, mapa_area_viejo):
    x = nz(n)
    if x in mapa_area_viejo and len(mapa_area_viejo[x]) == 1:
        return sorted(mapa_area_viejo[x])[0]
    return ''

AREA_ID_A_LABEL = {'panaderia': 'Panadería', 'pasteleria': 'Pastelería', 'especialidades': 'Especialidades',
                   'factureria': 'Facturería', 'sandwiches': 'Sandwiches', 'cocina_sl': 'Cocina San Luis'}

def procesar(rows, mapa_area_viejo=None):
    mapa_area_viejo = mapa_area_viejo or {}
    grupos = collections.defaultdict(list)
    for r in rows:
        canon = FUSIONES.get(nz(r['nombre']), r['nombre'])
        grupos[canon].append(r)

    filas = []
    for canon, v in grupos.items():
        cands = [x for x in v if nz(x['nombre']) not in PRECIO_DUDOSO and x['precio']]
        precio = max((1 if x['prov'] else 0, x['precio']) for x in cands)[1] if cands else ''
        base = max(v, key=lambda x: (bool(x['prov']), bool(x['precio'])))
        u = unidad(base['unidad'], canon)
        alc, amb_generico = alcance_ambito(canon)
        if alc == 'Por area (cuadra)':
            area_id = area_cuadra(canon, mapa_area_viejo)
            ambito = AREA_ID_A_LABEL.get(area_id, 'Deposito central')
        elif alc == 'Barra':
            ambito = 'Barra SLA 5.0'
        else:
            ambito = amb_generico
        filas.append({'nombre': canon, 'unidad': u, 'bulto': bulto(canon, base['cont']),
                      'alcance': alc, 'ambito': ambito, 'critico': critico(canon, precio),
                      'precio': precio, 'prov': base['prov'] or ''})

    # Los insumos de barra se cuentan en LOS DOS locales de venta (2 stocks fisicos).
    finales = []
    for f in filas:
        if f['alcance'] == 'Barra':
            for amb in ['Barra SLA 5.0', 'Barra San Luis']:
                f2 = dict(f); f2['ambito'] = amb
                finales.append(f2)
        else:
            finales.append(f)
    return finales


if __name__ == '__main__':
    import os
    aqui = os.path.dirname(os.path.abspath(__file__))
    rows_raw = json.load(io.open(os.path.join(aqui, 'insumos_export_firebase.json'), encoding='utf-8'))
    rows = []
    for k, v in rows_raw.items():
        if not isinstance(v, dict) or not (v.get('nombre') or '').strip():
            continue
        rows.append({'nombre': v['nombre'].strip(), 'unidad': (v.get('unidad') or '').strip(),
                     'precio': v.get('precioActual'), 'prov': v.get('proveedorPreferido') or '',
                     'cont': v.get('contenidoPorUnidad')})

    finales = procesar(rows)
    json.dump(finales, io.open(os.path.join(aqui, 'insumos_procesados.json'), 'w', encoding='utf-8'),
               ensure_ascii=False, indent=1)

    print('insumos originales:', len(rows), '| tras fusionar y expandir barra:', len(finales))
    print('criticos (filas):', sum(1 for f in finales if f['critico'] == 'SI'),
          '| criticos (unicos):', len({f['nombre'] for f in finales if f['critico'] == 'SI'}))
    by_amb = collections.Counter(f['ambito'] for f in finales)
    for a, n in by_amb.most_common():
        print('  %-22s %d' % (a, n))
