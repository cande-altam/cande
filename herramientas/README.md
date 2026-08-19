# Herramientas

## `md-a-googledocs.py`

Convierte los manuales en Markdown a HTML listo para pegar en el documento de Google
Drive, **respetando la estética del documento**.

Los estilos no son inventados: se extrajeron exportando el propio documento de Drive
como HTML y midiendo lo que usa.

| | |
|---|---|
| **Tipografía** | Calibri en todo |
| **Cuerpo** | 11 pt, negro, interlineado 1.45 |
| **Encabezados** | H1 20 pt · H2 14 pt · H3 12 pt · H4 11 pt — todos en negrita y en negro |
| **Tablas** | Encabezado con fondo `#e5e1cc`, bordes 1 pt `#dedad8` |
| **Cuadros destacados** | Solo fondo de color, **sin barra lateral** |
| **Checklists** | Párrafos con ☐, sin recuadro |
| **Emojis** | **Se eliminan todos** |

Los fondos de los cuadros salen del contenido: prohibición `#fdecea`, advertencia
`#fffbe6`, regla clave `#f9ddd8`, confirmación `#f7f5ea`, pendiente `#f0eee2`.

### Uso

```python
import sys; sys.path.insert(0, 'herramientas')
from md_a_googledocs import documento

html = documento('Título', [
    (None, 'markdown de portada'),
    ('Nombre del manual', open('manuales/comunes/vajilla.md').read()),
])
```

Después se abre el HTML en el navegador, `Ctrl+A`, `Ctrl+C` y se pega en el documento
de Drive.
