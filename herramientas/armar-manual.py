# -*- coding: utf-8 -*-
"""Arma el documento unificado de manuales en un solo HTML, listo para pegar en Drive.

Uso, desde la raíz del repo:
    python3 herramientas/armar-manual.py salida/manual-unificado.html

Después se abre el HTML en el navegador, Ctrl+A, Ctrl+C y se pega en un documento de
Google Docs nuevo (o en el vigente, reemplazando todo).
"""
import importlib.util, os, re, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('md', os.path.join(AQUI, 'md-a-googledocs.py'))
md = importlib.util.module_from_spec(spec); spec.loader.exec_module(md)

RAIZ = os.path.join(AQUI, '..', 'manuales')

PARTES = [
    ('Parte 1 — Documentos comunes', 'Valen para todo el equipo, en todos los puestos y en los tres locales.', [
        'comunes/organigrama.md',
        'comunes/codigo-de-etica.md',
        'comunes/induccion-personal-nuevo.md',
        'comunes/jornada-y-presentismo.md',
        'comunes/higiene-y-presentacion.md',
        'comunes/emergencias-y-seguridad.md',
        'comunes/atencion-y-reclamos.md',
        'comunes/herramientas-digitales.md',
        'comunes/vajilla.md',
        'comunes/mercaderia-para-cambio.md',
        'comunes/pedidos-y-pagos-a-proveedores.md',
        'comunes/inventario-y-recuento.md',
        'comunes/vehiculo-de-transporte.md',
    ]),
    ('Parte 2 — Locales de venta', 'San Luis y SLA 5.0: caja, mostrador, salón y barra.', [
        'venta/experto-del-turno.md',
        'venta/cajeros.md',
        'venta/vendedores-y-mozos.md',
        'venta/baristas.md',
    ]),
    ('Parte 3 — Cocina de los locales', 'Las cocinas de San Luis y SLA 5.0.', [
        'venta/cocina.md',
        'venta/jefe-de-cocina.md',
        'produccion/ayudante-de-cocina.md',
    ]),
    ('Parte 4 — Cuadra de producción', 'Las cinco áreas de producción y sus bases.', [
        'produccion/maestro-de-area.md',
        'produccion/panaderia.md',
        'produccion/pasteleria.md',
        'produccion/factureria.md',
        'produccion/especialidades.md',
        'produccion/sandwiches.md',
        'produccion/bases.md',
    ]),
    ('Parte 5 — Apoyo', 'Los puestos que sostienen a los locales y a la cuadra.', [
        'produccion/compras.md',
        'limpieza.md',
    ]),
    ('Parte 6 — Guías internas', 'Para quien escribe y mantiene los manuales. No se reparten al equipo.', [
        '_guia-de-estilo.md',
        'produccion/_cuestionario-areas-produccion.md',
        '_plantilla.md',
    ]),
]

SALTO = '<p style="page-break-before:always;margin:0"></p>'
P = md.STY['p']


def leer(ruta):
    return open(os.path.join(RAIZ, ruta), encoding='utf-8').read()


def limpiar_enlaces(t):
    # Los enlaces a otros .md y a marcadores del documento viejo se convierten en cursiva
    t = re.sub(r'\[([^\]]+)\]\((?:\.\./|\./)?[\w/.-]+\.md(?:#[^)]*)?\)', r'*\1*', t)
    t = re.sub(r'\[([^\]]+)\]\(https://docs\.google\.com[^)]*bookmark[^)]*\)', r'*\1*', t)
    return t


def armar(salida):
    html = []
    # Portada
    html.append(f'<h1 style="{md.STY["h1"]};font-size:28pt;padding-top:120pt">Manuales de Procedimientos</h1>')
    html.append(f'<p style="{P};font-size:16pt">Candela Café &amp; Patisserie</p>')
    html.append(f'<p style="{P}">Versión unificada · Septiembre 2026</p>')
    html.append(f'<p style="{P}">San Luis · SLA 5.0 · Cuadra de producción</p>')
    html.append(SALTO)
    html.append(md.convert(limpiar_enlaces(leer('_portada.md'))))
    for titulo, bajada, archivos in PARTES:
        html.append(SALTO)
        html.append(f'<h1 style="{md.STY["h1"]};padding-top:160pt">{md.esc(titulo)}</h1>')
        html.append(f'<p style="{P}">{md.esc(bajada)}</p>')
        for a in archivos:
            nombre = re.match(r'#\s+(.+)', leer(a)).group(1)
            html.append(f'<p style="{md.STY["li"]}">{md.esc(nombre)}</p>')
        for a in archivos:
            html.append(SALTO)
            html.append(md.convert(limpiar_enlaces(leer(a))))
    doc = ('<!DOCTYPE html><html><head><meta charset="utf-8"/>'
           '<title>Manuales de Procedimientos — Candela Café &amp; Patisserie</title></head>'
           f'<body style="background-color:#ffffff;max-width:468pt;padding:72pt;'
           f'font-family:{md.FF};font-size:11pt;color:#000000;line-height:1.45">'
           + ''.join(html) + '</body></html>')
    os.makedirs(os.path.dirname(os.path.abspath(salida)), exist_ok=True)
    open(salida, 'w', encoding='utf-8').write(doc)
    return salida


if __name__ == '__main__':
    print(armar(sys.argv[1] if len(sys.argv) > 1 else 'salida/manual-unificado.html'))
