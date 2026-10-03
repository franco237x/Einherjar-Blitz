# Prompts del kit articulado v4

Modo utilizado: **ImageGen integrado**, transparencia activada. La referencia de identidad y estilo fue la hoja original de partes de cada personaje, creada previamente con ImageGen. El arte seleccionado está copiado dentro del proyecto.

| Fuente final | Prompt exacto |
| --- | --- |
| `source/bruton-core.png` | [bruton-core.txt](./prompts/bruton-core.txt) |
| `source/bruton-arms.png` | [bruton-arms.txt](./prompts/bruton-arms.txt) |
| `source/bruton-legs.png` | [bruton-legs.txt](./prompts/bruton-legs.txt) |
| `source/rafago-core.png` | [rafago-core.txt](./prompts/rafago-core.txt) |
| `source/rafago-arms.png` | [rafago-arms.txt](./prompts/rafago-arms.txt) |
| `source/rafago-legs.png` | [rafago-legs-clothed.txt](./prompts/rafago-legs-clothed.txt) |

Referencias: `../especiales-v2/source/bruton-parts.png` y `../especiales-v2/source/rafago-parts.png`. Las seis fuentes finales ya contienen todas las piezas, por lo que el builder no necesita acceder a las referencias anteriores.

Tras generar se extrajeron los componentes conservando sus píxeles RGBA, se registraron sus articulaciones y se empaquetaron las hojas. El movimiento utiliza transformaciones rígidas de escala uniforme, rotación y traslado, con pies y manos separados. No se generaron poses completas para esta versión ni se deformaron las extremidades entre cuadros.
