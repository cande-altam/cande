# -*- coding: utf-8 -*-
"""Clasifica los 213 insumos reales: grupo, unidad, alcance, area y criticidad."""
import json, io, unicodedata, re, collections

def nz(s): return ''.join(c for c in unicodedata.normalize('NFD', s or '') if unicodedata.category(c) != 'Mn').lower().strip()

rows = json.load(io.open('insumos_reales.json', encoding='utf-8'))

# --- grupo: solo "Produccion" entra al conteo de stock por defecto ---
SEMIELAB = ['almibar','bizcochuelo','crema chantilly','crema pastelera','masa frola','ganache',
  'tulipas','miga de jamon','pan de miga','bagel','croissant','donas','focaccia','minibaguette',
  'churro','cookies','tortillas','tostadas ','helado']
REVENTA = ['agua','agua saboriz','gaseosa','soda','sprite','powerade','hielo','cafe','café',
  'saquito de te','syrope','syrup','leche de almendras','leche de coco','leche descremada',
  'leche deslactosada','yogurt','smoothie','licor','edulcorante','stevia','azucar en sobre',
  'bengala','vela corta','higienol','horma']
def grupo(n):
    x = nz(n)
    for k in SEMIELAB:
        if x.startswith(nz(k)) or nz(k) in x: return 'Semielaborado propio'
    for k in REVENTA:
        if x.startswith(nz(k)): return 'Reventa / cafeteria'
    return 'Produccion'

# --- unidad normalizada ---
UNI = {'kg':'kg','litros':'L','l':'L','unidad':'u','docena':'docena','500 cc':'u','1/4':'u','bolsa':'u','':''}
def unidad(u, n):
    v = UNI.get(u.strip().lower(), '')
    if v: return v
    x = nz(n)
    if any(k in x for k in ('leche','crema vegetal','aceite','syrop','licor','soda')): return 'L'
    if any(k in x for k in ('sobre','paquete','unidad','vela','horma','higienol','sprite','powerade')): return 'u'
    return 'kg'

# --- perecedero -> se cuenta por area; el resto en deposito ---
PEREC = ['manteca','crema de leche','crema vegetal','leche entera','queso','mozzarella','muzzarella',
  'tybo','sardo','roquefort','azul','de cabra','jamon','crudo','cantimpalo','salame','salamin',
  'mortadela','bondiola','culatello','pernil','peceto','lomito','claras','yemas','huevos',
  'tomate','lechuga','rucula','palta','frutilla','arandano','limon','naranja','kiwi','anana',
  'ciruela','banana','manzana','durazno','albahaca','oregano','romero','frutas','frutos del bosque',
  'mix de frutos rojos','congelad','panes ','spekkel','pasas de uva']
CENTRAL_FORZ = ['durazno al natural','anana en lata','cerezas en lata','mermelada','dulce de',
                'jalea','fruta abrillantada','salsa']
def alcance(n):
    x = nz(n)
    for k in CENTRAL_FORZ:
        if k in x: return 'Central'
    for k in PEREC:
        if k in x: return 'Por area'
    return 'Central'

# --- criticos: caros por kg, o de alto consumo / riesgo conocido ---
# Staples de alto consumo: entran aunque el precio por kg sea bajo.
SIEMPRE_CRIT = ['harina 000','harina 0000','azucar x 1 kg','azúcar x 50 kg','manteca',
  'margarina hojaldre','margarina masa','grasa','levadura','huevos','crema de leche',
  'crema vegetal','leche entera','dulce de leche repostero']
NUNCA_CRIT = ['sal','romero','oregano','saquito','azucar en sobre','agua','soda','hielo','vela',
              'higienol','horma','bengala','colorante']
UMBRAL = 20000.0
def critico(n, precio, g):
    if g != 'Produccion': return 'NO'
    x = nz(n)
    for k in NUNCA_CRIT:
        if x.startswith(nz(k)): return 'NO'
    for k in SIEMPRE_CRIT:
        if nz(k) in x: return 'SI'
    return 'SI' if (precio or 0) >= UMBRAL else 'NO'

# --- area sugerida: del catalogo viejo por nombre, si coincide ---
viejo = json.load(io.open('gs_data.json', encoding='utf-8'))['INS']
mapa_area = collections.defaultdict(set)
for a, n, u, b, c, p in viejo: mapa_area[nz(n)].add(a)
def areas_de(n):
    x = nz(n)
    if x in mapa_area: return sorted(mapa_area[x])
    for k, v in mapa_area.items():
        if k and (k in x or x in k) and abs(len(k) - len(x)) <= 6: return sorted(v)
    return []

out = []
for r in rows:
    g = grupo(r['nombre']); u = unidad(r['unidad'], r['nombre'])
    al = alcance(r['nombre']); ar = areas_de(r['nombre'])
    cr = critico(r['nombre'], r['precio'], g)
    out.append({'nombre': r['nombre'], 'unidad': u, 'grupo': g, 'alcance': al,
                'areas': ar, 'critico': cr, 'precio': r['precio'], 'prov': r['prov'],
                'alias': r['alias'], 'cont': r['cont']})
json.dump(out, io.open('insumos_mapeados.json', 'w', encoding='utf-8'), ensure_ascii=False)

print('TOTAL:', len(out))
for g, n in collections.Counter(o['grupo'] for o in out).most_common():
    print('  %-24s %3d' % (g, n))
prod = [o for o in out if o['grupo'] == 'Produccion']
print()
print('De los de PRODUCCION (%d):' % len(prod))
print('  central       :', sum(1 for o in prod if o['alcance'] == 'Central'))
print('  por area      :', sum(1 for o in prod if o['alcance'] == 'Por area'))
print('  criticos      :', sum(1 for o in prod if o['critico'] == 'SI'))
print('  con area conocida del catalogo viejo:', sum(1 for o in prod if o['areas']))
print('  sin unidad en el origen (inferida)  :', sum(1 for o, r in zip(out, rows) if not r['unidad']))
