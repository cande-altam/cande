# -*- coding: utf-8 -*-
"""Markdown -> HTML para Google Docs, con la estética exacta del documento de Candela.

Extraída del export del propio documento:
  · Calibri en todo · cuerpo 11pt · line-height 1.45 · texto siempre #000000
  · H1 20pt / H2 14pt / H3 12pt / H4 11pt — todos bold, todos negros
  · Encabezado de tabla con fondo #e5e1cc · bordes 1pt #dedad8
  · Cuadros destacados: solo fondo, SIN barra lateral
  · Checklists: párrafos con ☐, sin recuadro
  · Sin emojis
"""
import re, html as H

FF   = "Calibri,sans-serif"
BASE = f'margin:0;color:#000000;font-family:{FF};line-height:1.45;text-align:left'
STY = {
    'h1': f'{BASE};font-size:20pt;font-weight:700;padding-top:24pt;padding-bottom:6pt',
    'h2': f'{BASE};font-size:14pt;font-weight:700;padding-top:18pt;padding-bottom:4pt',
    'h3': f'{BASE};font-size:12pt;font-weight:700;padding-top:12pt;padding-bottom:4pt',
    'h4': f'{BASE};font-size:11pt;font-weight:700;padding-top:12pt;padding-bottom:2pt',
    'h5': f'{BASE};font-size:11pt;font-weight:700;padding-top:10pt;padding-bottom:2pt',
    'h6': f'{BASE};font-size:11pt;font-weight:700;padding-top:10pt;padding-bottom:2pt',
    'p':  f'{BASE};font-size:11pt;padding-bottom:8pt',
    'pt': f'{BASE};font-size:11pt',            # párrafo apretado (dentro de cuadros y celdas)
    'li': f'{BASE};font-size:11pt;padding-top:3pt;padding-bottom:3pt',
    'cell': f'{BASE};font-size:11pt',
}
TBL  = 'border-spacing:0;border-collapse:collapse;margin-right:auto'
CELL = 'border:1pt solid #dedad8;vertical-align:top;padding:5pt 7pt'
HEAD = CELL + ';background-color:#e5e1cc'
BOX  = 'border-spacing:0;border-collapse:collapse;margin-right:auto;width:100%'
BOXC = 'padding:9pt 11pt;vertical-align:top'
MONO = "Consolas,'Courier New',monospace"

# Fondos, tomados de los que ya existen en el documento
FONDOS = [
    (r'⛔|🔴|Prohibid|PROHIBID|Nunca se|no se negocia', '#fdecea'),   # prohibición
    (r'⚠️|⚠|Atención|Ojo|Importante',                    '#fffbe6'),   # advertencia
    (r'🔑|📌|La regla|Regla de oro',                      '#f9ddd8'),   # regla clave
    (r'✅|Resuelto|vigente y en uso',                     '#f7f5ea'),   # confirmación
    (r'🚧|A definir|falta|Pendiente|Borrador',            '#f0eee2'),   # pendiente
]
def fondo(t):
    for pat, bg in FONDOS:
        if re.search(pat, t):
            return bg
    return '#f7f5ea'

EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\U00002190-\U000021FF\U00002300-\U000023FF"
    "\U00002460-\U000024FF\U000025A0-\U000027BF\U00002B00-\U00002BFF"
    "\U0000FE00-\U0000FE0F\U0001F1E6-\U0001F1FF]")
def sin_emoji(s):
    s = EMOJI.sub('', s)
    s = s.replace('☐', '\x01').replace('☑', '\x02')   # preservar casillas
    s = EMOJI.sub('', s)
    s = s.replace('\x01', '☐').replace('\x02', '☑')
    return re.sub(r'\s{2,}', ' ', s).strip()

def esc(s): return H.escape(s, quote=False)

def inline(s):
    s = sin_emoji(s)
    holes = []
    def stash(t):
        holes.append(t); return f"\x00{len(holes)-1}\x00"
    s = re.sub(r'`([^`]+)`', lambda m: stash(
        f'<span style="font-family:{MONO};font-size:10pt">{esc(m.group(1))}</span>'), s)
    s = esc(s)
    def link(m):
        txt, url = m.group(1), m.group(2)
        if re.search(r'\.md(#.*)?$', url):
            return f'<span style="font-style:italic">{txt}</span>'
        if url.startswith('http'):
            return f'<a href="{url}" style="color:#000000">{txt}</a>'
        return f'<span style="font-style:italic">{txt}</span>'
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, s)
    s = re.sub(r'~~([^~]+)~~', r'<s>\1</s>', s)
    s = re.sub(r'\*\*([^*]+)\*\*', r'<span style="font-weight:700">\1</span>', s)
    s = re.sub(r'(^|[^*])\*([^*\n]+)\*', r'\1<span style="font-style:italic">\2</span>', s)
    s = re.sub(r'\x00(\d+)\x00', lambda m: holes[int(m.group(1))], s)
    return s.strip()

def convert(md, tight=False, hshift=0):
    P = 'pt' if tight else 'p'
    L = md.replace('\r', '').split('\n'); out, i = [], 0
    def is_table(n):
        return (n < len(L) and re.match(r'^\s*\|', L[n] or '')
                and n + 1 < len(L) and re.match(r'^\s*\|[\s:|-]+\|\s*$', L[n+1] or ''))
    while i < len(L):
        ln = L[i]
        if re.match(r'^```', ln):                                   # bloque de código
            buf = []; i += 1
            while i < len(L) and not re.match(r'^```', L[i]): buf.append(L[i]); i += 1
            i += 1
            body = esc('\n'.join(buf)).replace('\n', '<br/>').replace(' ', '&nbsp;')
            out.append(f'<table style="{BOX}"><tr><td style="{BOXC};background-color:#f0eee2">'
                       f'<span style="font-family:{MONO};font-size:9pt">{body}</span></td></tr></table>')
            continue
        if is_table(i):                                             # tabla
            head = [c.strip() for c in L[i].split('|')[1:-1]]; i += 2
            t = [f'<table style="{TBL}">']
            if any(h for h in head):        # sin encabezado real, no se dibuja la banda
                t.append('<tr>')
                for h in head:
                    c = inline(h)
                    t.append(f'<td style="{HEAD}"><p style="{STY["cell"]};font-weight:700">{c or "&nbsp;"}</p></td>')
                t.append('</tr>')
            while i < len(L) and re.match(r'^\s*\|', L[i]):
                cells = [c.strip() for c in L[i].split('|')[1:-1]]
                t.append('<tr>' + ''.join(
                    f'<td style="{CELL}"><p style="{STY["cell"]}">{inline(c) or "&nbsp;"}</p></td>'
                    for c in cells) + '</tr>'); i += 1
            out.append(''.join(t) + '</table>'); continue
        if re.match(r'^>\s?', ln):                                  # cuadro destacado
            buf = []
            while i < len(L) and re.match(r'^>\s?', L[i]):
                buf.append(re.sub(r'^>\s?', '', L[i])); i += 1
            inner = '\n'.join(buf)
            out.append(f'<table style="{BOX}"><tr><td style="{BOXC};background-color:{fondo(inner)}">'
                       f'{convert(inner, tight=True, hshift=hshift+1)}</td></tr></table>')
            continue
        if re.match(r'^\s*[-*]\s+\[[ xX]\]', ln) or re.match(r'^\s*[-*]\s*☐', ln):   # checklist
            while i < len(L) and (re.match(r'^\s*[-*]\s+\[[ xX]\]', L[i]) or re.match(r'^\s*[-*]\s*☐', L[i])):
                raw = re.sub(r'^\s*[-*]\s+', '', L[i]); done = False
                if re.match(r'^\[[xX]\]', raw):  done, body = True, re.sub(r'^\[[xX]\]\s*', '', raw)
                elif re.match(r'^\[ \]', raw):   body = re.sub(r'^\[ \]\s*', '', raw)
                else:                            body = re.sub(r'^☐\s*', '', raw)
                i += 1
                while i < len(L) and re.match(r'^\s{4,}\S', L[i]) and not re.match(r'^\s*[-*]\s', L[i]):
                    body += ' ' + L[i].strip(); i += 1
                out.append(f'<p style="{STY["li"]}">{"☑" if done else "☐"} {inline(body)}</p>')
            continue
        if re.match(r'^\s*[-*]\s+', ln):                            # viñetas
            t = ['<ul style="margin-top:0;margin-bottom:8pt;padding-left:24pt">']
            while i < len(L) and re.match(r'^\s*[-*]\s+', L[i]):
                body = re.sub(r'^\s*[-*]\s+', '', L[i]); i += 1
                while i < len(L) and re.match(r'^\s{2,}\S', L[i]) and not re.match(r'^\s*([-*]|\d+\.)\s', L[i]):
                    body += ' ' + L[i].strip(); i += 1
                t.append(f'<li style="{STY["li"]}">{inline(body)}</li>')
            out.append(''.join(t) + '</ul>'); continue
        if re.match(r'^\s*\d+\.\s+', ln):                           # numerada
            t = ['<ol style="margin-top:0;margin-bottom:8pt;padding-left:24pt">']
            while i < len(L) and re.match(r'^\s*\d+\.\s+', L[i]):
                body = re.sub(r'^\s*\d+\.\s+', '', L[i]); i += 1
                while i < len(L) and re.match(r'^\s{3,}\S', L[i]) and not re.match(r'^\s*([-*]|\d+\.)\s', L[i]):
                    body += ' ' + L[i].strip(); i += 1
                t.append(f'<li style="{STY["li"]}">{inline(body)}</li>')
            out.append(''.join(t) + '</ol>'); continue
        if re.match(r'^(-{3,}|\*{3,}|_{3,})\s*$', ln):              # separador
            out.append(f'<p style="{BASE};font-size:11pt;color:#cccccc;padding-top:6pt;'
                       f'padding-bottom:6pt">_______________________________________________</p>')
            i += 1; continue
        m = re.match(r'^(#{1,6})\s+(.*)$', ln)                      # encabezado
        if m:
            n = min(len(m.group(1)) + hshift, 6)
            txt = inline(m.group(2))
            if txt:
                out.append(f'<h{n} style="{STY[f"h{n}"]}">{txt}</h{n}>')
            i += 1; continue
        if not ln.strip(): i += 1; continue
        p = []                                                      # párrafo
        while (i < len(L) and L[i].strip()
               and not re.match(r'^(#{1,6}\s|>|\s*[-*]\s|\s*\d+\.\s|```|-{3,}\s*$)', L[i])
               and not is_table(i)):
            p.append(L[i]); i += 1
        if p:
            txt = inline(' '.join(p))
            if txt: out.append(f'<p style="{STY[P]}">{txt}</p>')
        else: i += 1
    return ''.join(out)

def documento(titulo, bloques):
    """bloques: lista de (nivel_h1_titulo | None, markdown)"""
    P = []
    for tit, md in bloques:
        if tit:
            P.append('<p style="page-break-before:always;margin:0"></p>')
            P.append(f'<h1 style="{STY["h1"]}">{sin_emoji(tit)}</h1>')
        P.append(convert(md))
    return ('<!DOCTYPE html><html><head><meta charset="utf-8"/>'
            f'<title>{H.escape(titulo)}</title></head>'
            f'<body style="background-color:#ffffff;max-width:468pt;padding:72pt;'
            f'font-family:{FF};font-size:11pt;color:#000000;line-height:1.45">'
            + ''.join(P) + '</body></html>')
