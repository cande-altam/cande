# -*- coding: utf-8 -*-
"""Unifica variantes de nombre y clasifica cada insumo como Central o Por area."""
import json, io, unicodedata, re, collections

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').lower().strip()

# --- 1) variantes de escritura del MISMO insumo -> nombre canonico ---
MERGES = {
    'frutillas': 'Frutilla', 'frutilla x kg': 'Frutilla',
    'arandanos x caja': 'Arandanos frescos', 'arandanos': 'Arandanos frescos',
    'kiwi x kg': 'Kiwi',
    'tomates cherrys': 'Tomate cherry', 'tomates cherry': 'Tomate cherry',
    'tomate cherry x kg': 'Tomate cherry',
    'tomate x kg': 'Tomate', 'tomates': 'Tomate',
    'palta x kg': 'Palta', 'palta/aguacate': 'Palta',
    'ciruela x kg': 'Ciruela', 'banana x unidad': 'Banana', 'jengibre x unidad': 'Jengibre',
    'rucula hidroponica': 'Rucula', 'rucula': 'Rucula',
    'harina 000 x25kg': 'Harina 000', 'harina 0000 x25kg': 'Harina 0000',
}
# Pares que NO hay que fusionar aunque se parezcan (quedan como estan):
#   Harina 000 / Harina 0000      -> harinas distintas
#   Durazno / Durazno al natural  -> fruta fresca vs lata
#   Albahaca / Albahaca hidroponica -> seca vs fresca
#   Lechuga crespa / hidroponica / mantecosa -> variedades distintas
#   Mermelada membrillo / Dulce de membrillo -> productos distintos

# --- 2) alcance: Central (deposito, se cuenta una vez) o Por area (heladera del area) ---
PERECEDERO = ['manteca','crema de leche','crema vegetal','leche entera','queso','jamon','salame',
  'lomo ahumado','panceta','salchicha','ricota','mozzarella','burrata','brie','tomate','lechuga',
  'rucula','palta','aguacate','frutilla','arandano','limon','naranja','kiwi','anana','ciruela',
  'banana','menta','jengibre','cebolla','espinaca','manzana','pomelo','frutas de estacion',
  'frutos del bosque','mix de frutos rojos','albahaca hidroponica','salmon','pollo','carne',
  'arandanos congelados',
  'pechuga','maracuya','pistachos frescos','panes blandos','panes granos','panes multicereal',
  'panes salvado']
CENTRAL_FORZADO = ['durazno al natural','huevos','margarina']

def alcance(nombre):
    n = norm(nombre)
    for k in CENTRAL_FORZADO:
        if k in n: return 'Central'
    for k in PERECEDERO:
        if k in n: return 'Por area'
    return 'Central'

CRIT_NOMBRES = {norm(x) for x in ['Harina 000','Harina 0000','Margarina hojaldre','Margarina masa',
  'Grasa','Manteca','Azucar','Huevos','Levadura','Chocolate moldeo','Chocolate gotas','Chocolate chip',
  'Bano lodiser semiamargo','Bano alpino','Dulce de leche repostero','Crema de leche','Crema Vegetal',
  'Nutella','Pistachos','Nueces','Almendras','Leche entera','Queso crema','Queso cremoso','Queso sardo',
  'Queso tybo','Jamon cocido','Queso de maquina barra','Queso cheddar fetas','Queso parmesano rallo',
  'Queso roquefort','Jamon cocido paladini','Salame milan','Lomo ahumado feteado',
  'Panceta ahumada feteada','Palta','Frutilla','Arandanos frescos','Mix de frutos rojos',
  'Frutos del bosque','Arandanos congelados']}

def unidad_bulto(n):
    x = norm(n)
    if 'harina' in x: return 'kg', 25
    if x.startswith('huevos'): return 'u', 30
    if 'aceite' in x: return 'L', 5
    if 'lavandina' in x or 'detergente' in x: return 'L', 5
    if any(k in x for k in ('leche entera','crema de leche','crema vegetal','esencia','variegato')): return 'L', 1
    if 'miel' in x: return 'kg', 5
    if x in ('banana','jengibre','burrata','gelatina sin sabor','polvo de hornear','fondant'): return 'u', 1
    return 'kg', 1

D = json.load(io.open('gs_data.json', encoding='utf-8'))
canon = {}
PROV = {}
for area, nombre, u, b, c, prov in D['INS']:
    cn = MERGES.get(norm(nombre), nombre)
    canon.setdefault(cn, set()).add(area)
    if prov: PROV[cn] = prov

filas, centrales, porarea = [], 0, 0
for cn in sorted(canon, key=lambda s: norm(s)):
    areas = sorted(canon[cn])
    alc = alcance(cn)
    u, b = unidad_bulto(cn)
    cr = 'SI' if norm(cn) in CRIT_NOMBRES else 'NO'
    if alc == 'Central':
        filas.append(['Deposito central', cn, u, b, cr, 'Central', ' / '.join(areas), PROV.get(cn,'')]); centrales += 1
    else:
        for a in areas:
            filas.append([a, cn, u, b, cr, 'Por area', '', PROV.get(cn,'')]); porarea += 1

json.dump(filas, io.open('insumos_dedup.json','w',encoding='utf-8'), ensure_ascii=False)
print('insumos canonicos:', len(canon), '(antes 159 filas / %d nombres)' % len({r[1] for r in D['INS']}))
print('filas del maestro :', len(filas), ' -> centrales', centrales, '| por area', porarea)
print('criticos          :', sum(1 for r in filas if r[4]=='SI'))
print()
print('=== FUSIONADOS ===')
inv = collections.defaultdict(list)
for a,n,u,b,c,p in D['INS']:
    cn = MERGES.get(norm(n), n)
    if cn != n: inv[cn].append(n)
for cn, orig in sorted(inv.items()):
    print('  %-22s <- %s' % (cn, ', '.join(sorted(set(orig)))))
print()
print('=== CRITICOS RESULTANTES (%d) ===' % sum(1 for r in filas if r[4]=='SI'))
for r in filas:
    if r[4]=='SI': print('  %-11s %-28s %s' % (r[5], r[1], r[0] if r[5]=='Por area' else ''))
