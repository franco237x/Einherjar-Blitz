# Arte original — ImageGen integrado

Modo: edición con referencia, usando la herramienta integrada de generación de imágenes. Dos kits raster transparentes de 4 × 4 celdas; cada uno tiene 16 piezas. La referencia de continuidad visual fue el elenco propio de zombis básicos en `public/zombis-vivos/preview/lineup.png`.

Instrucciones exactas utilizadas, sin abreviar:

- [Prompt de Brutón](./prompts/bruton.txt) → `source/bruton-parts.png`.
- [Prompt de Ráfago](./prompts/rafago.txt) → `source/rafago-parts.png`.

Se buscó el lenguaje visual de un juego caricaturesco de defensa por carriles, con personajes originales: Brutón tiene resistencia por tamaño y carne, sin equipo protector; Ráfago tiene una silueta de velocista y protecciones separadas que pueden desprenderse.

La animación se construyó después con un rig de recortes. Los scripts extraen componentes, alinean expresiones, articulan piezas y exportan cuadros; no sustituyen el arte por dibujo procedimental. Las fuentes permanecen incluidas para editar o regenerar el resultado.
