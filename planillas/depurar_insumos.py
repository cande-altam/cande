# -*- coding: utf-8 -*-
"""Deja la lista real de insumos lista para usar: fusiona duplicados, arregla
unidades, descarta precios imposibles y clasifica cada insumo."""
import json, io, unicodedata, re, collections

def nz(s): return ''.join(c for c in unicodedata.normalize('NFD', s or '') if unicodedata.category(c)!='Mn').lower().strip()

rows = json.load(io.open('_insumos_reales.json', encoding='utf-8'))

# 1) DUPLICADOS: mismo producto cargado con distinta presentacion o marca.
#    Se conserva el nombre canonico de la izquierda.
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
# 2) PRECIOS IMPOSIBLES: se descartan para no arrastrar el error al valorizar.
#    (unidad mal cargada o decimal corrido en el origen)
PRECIO_DUDOSO = {'manteca en pilon': 'el mas alto del catalogo, el doble que el segundo',
                 'romero': 'demasiado bajo para un kg', 'sal': 'demasiado bajo para un kg',
                 'tulipas': 'demasiado bajo para un kg', 'minibaguette': 'demasiado bajo para un kg',
                 'ganache': 'demasiado bajo para un kg', 'saquito de te la virginia': 'demasiado bajo para un kg',
                 'azucar en sobre': 'demasiado bajo para un kg'}

SEMIELAB = ['almibar','bizcochuelo','crema chantilly','crema pastelera','masa frola','ganache',
  'tulipas','miga de jamon','pan de miga','bagel','croissant','donas','focaccia','minibaguette',
  'churro','cookies','tortillas','tostadas ','helado']
REVENTA = ['agua','gaseosa','soda','sprite','powerade','hielo','cafe','café','saquito de te',
  'syrope','syrup','leche de almendras','leche de coco','leche descremada','leche deslactosada',
  'yogurt','smoothie','licor','edulcorante','stevia','azucar en sobre','bengala','vela corta',
  'higienol','horma']
def grupo(n):
    x = nz(n)
    for k in SEMIELAB:
        if nz(k) in x: return 'Semielaborado propio'
    for k in REVENTA:
        if x.startswith(nz(k)): return 'Reventa / cafeteria'
    return 'Produccion'

UNI = {'kg':'kg','litros':'L','l':'L','unidad':'u','docena':'docena','500 cc':'u','1/4':'u','bolsa':'u'}
def unidad(u, n):
    v = UNI.get((u or '').strip().lower())
    if v: return v
    x = nz(n)
    if any(k in x for k in ('leche','crema vegetal','aceite','syrop','licor','soda')): return 'L'
    if any(k in x for k in ('sobre','paquete','vela','horma','higienol','sprite','powerade')): return 'u'
    return 'kg'

PEREC = ['manteca','crema de leche','crema vegetal','leche entera','queso','muzzarella','tybo',
  'sardo','roquefort','azul','de cabra','jamon','crudo','cantimpalo','salame','salamin','mortadela',
  'bondiola','culatello','pernil','peceto','lomito','claras','yemas','huevos','tomate','lechuga',
  'rucula','palta','frutilla','arandano','limon','naranja','kiwi','anana','ciruela','banana',
  'manzana','durazno','albahaca','oregano','romero','frutas','frutos del bosque','mix de frutos rojos',
  'congelad','panes ','spekkel','pasas de uva']
CENTRAL_FORZ = ['al natural','en lata','mermelada','dulce de','jalea','fruta abrillantada','salsa']
def alcance(n):
    x = nz(n)
    if any(k in x for k in CENTRAL_FORZ): return 'Central'
    return 'Por area' if any(k in x for k in PEREC) else 'Central'

STAPLES = ['harina 000','harina 0000','azucar','manteca','margarina hojaldre','margarina masa',
  'grasa','levadura','huevos','crema de leche','crema vegetal','leche entera','dulce de leche repostero']
NUNCA = ['sal','romero','oregano','colorante']
UMBRAL = 20000.0
def critico(n, precio, g):
    if g != 'Produccion': return 'NO'
    x = nz(n)
    if any(x.startswith(nz(k)) for k in NUNCA): return 'NO'
    if any(nz(k) in x for k in STAPLES): return 'SI'
    return 'SI' if (precio or 0) >= UMBRAL else 'NO'

viejo = json.load(io.open('gs_data.json', encoding='utf-8'))['INS']
mapa = collections.defaultdict(set)
for a, n, u, b, c, p in viejo: mapa[nz(n)].add(a)
def area_de(n):
    x = nz(n)
    if x in mapa and len(mapa[x]) == 1: return sorted(mapa[x])[0]
    return ''

def bulto(n, cont):
    m = re.search(r'x\s*(\d+)\s*kg', nz(n))
    if m: return float(m.group(1))
    try:
        if cont and float(cont) > 0: return float(cont)
    except Exception: pass
    return 1.0

# --- fusionar ---
grupos = collections.defaultdict(list)
for r in rows:
    canon = FUSIONES.get(nz(r['nombre']), r['nombre'])
    grupos[canon].append(r)

fusionados, precios_descartados = [], []
salida = []
for canon, v in grupos.items():
    if len(v) > 1:
        fusionados.append((canon, [x['nombre'] for x in v]))
    # precio: el del registro que tenga proveedor (el que se matchea en facturas),
    # descartando los imposibles
    cands = []
    for x in v:
        if nz(x['nombre']) in PRECIO_DUDOSO:
            precios_descartados.append((x['nombre'], x['precio'], PRECIO_DUDOSO[nz(x['nombre'])]))
            continue
        if x['precio']: cands.append((1 if x['prov'] else 0, x['precio']))
    precio = max(cands)[1] if cands else ''
    base = max(v, key=lambda x: (bool(x['prov']), bool(x['precio'])))
    g = grupo(canon); u = unidad(base['unidad'], canon)
    salida.append({'nombre': canon, 'unidad': u, 'grupo': g, 'alcance': alcance(canon),
                   'area': area_de(canon), 'critico': critico(canon, precio if precio else 0, g),
                   'precio': precio, 'prov': base['prov'] or '',
                   'bulto': bulto(canon, base['cont'])})

json.dump(salida, io.open('insumos_final.json','w',encoding='utf-8'), ensure_ascii=False)
prod = [x for x in salida if x['grupo'] == 'Produccion']
print('registros originales :', len(rows))
print('despues de fusionar  :', len(salida), '(-%d)' % (len(rows)-len(salida)))
print('  en control         :', len(prod))
print('  fuera de control   :', len(salida)-len(prod))
print('  criticos           :', sum(1 for x in prod if x['critico']=='SI'))
print('  con precio         :', sum(1 for x in prod if x['precio']))
print()
print('FUSIONADOS:')
for c, o in sorted(fusionados): print('   %-24s <- %s' % (c, ' + '.join(o)))
print()
print('PRECIOS DESCARTADOS POR IMPOSIBLES:')
for n, p, m in sorted(set(precios_descartados)): print('   %-32s $%-12.2f %s' % (n, p or 0, m))
