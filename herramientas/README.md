# Herramientas

## `armar-manual.py`

Arma **el documento completo de manuales** en un solo HTML, en el orden de las seis
partes, con portada, carátulas de cada parte y un salto de página por manual.

```
python3 herramientas/armar-manual.py salida/manual-unificado.html
```

Después se abre el HTML en el navegador, `Ctrl+A`, `Ctrl+C` y se pega en un documento
de Google Docs. Para tener un `.docx` que se pueda subir a Drive:

```
soffice --headless --convert-to docx --outdir salida salida/manual-unificado.html
```

El orden de los manuales está en la lista `PARTES` del propio script.

## `md-a-googledocs.py`

Convierte Markdown a HTML **con la estética del documento de Drive**. Los estilos se
extrajeron exportando el propio documento como HTML y midiendo lo que usa.

| | |
|---|---|
| **Tipografía** | Calibri en todo |
| **Cuerpo** | 11 pt, negro, interlineado 1.45 |
| **Encabezados** | H1 20 pt · H2 14 pt · H3 12 pt · H4 11 pt, en negrita y en negro |
| **Tablas** | Encabezado con fondo `#e5e1cc`, bordes 1 pt `#dedad8` |
| **Cuadros destacados** | Solo fondo de color, sin barra lateral |
| **Checklists** | Párrafos con ☐, sin recuadro |
| **Emojis** | Se eliminan todos |

### Los cuadros

El color se elige con una marca en la primera línea del cuadro:

| Marca | Fondo |
|---|---|
| `> [!regla]` | `#f9ddd8` |
| `> [!prohibido]` | `#fdecea` |
| `> [!atencion]` | `#fffbe6` |
| `> [!pendiente]` | `#f0eee2` |
| `> [!nota]` | `#f7f5ea` |

Sin marca, el color se adivina por palabras clave, como en la versión anterior.

### Uso suelto

```python
import importlib.util
spec = importlib.util.spec_from_file_location('md', 'herramientas/md-a-googledocs.py')
md = importlib.util.module_from_spec(spec); spec.loader.exec_module(md)
html = md.documento('Título', [('Nombre del manual', open('manuales/comunes/vajilla.md').read())])
```
