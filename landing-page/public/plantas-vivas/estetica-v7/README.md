# Plantas vivas · rediseño estético v7

Tres plantas originales con anatomías más exageradas, caras integradas en la materia vegetal y acciones que aprovechan su forma. Esta carpeta es una nueva exploración completa; el catálogo v6 conserva sus assets anteriores.

| Personaje | Forma y personalidad | Acción |
| --- | --- | --- |
| Cilantro Coro | Tres hojas con caras desparejas, una raíz común y movimientos independientes. | Agrupa las voces y sopla una ráfaga aromática. |
| Limón Acordeón | Cuerpo bajo hecho de pliegues de cáscara, punta agria y cola de piel. | Comprime el fuelle y expulsa jugo. |
| Rizomazo | Una raíz de jengibre enorme sobre un tallo pequeño; el cuerpo entero es la masa del golpe. | Tantea, carga hacia atrás y da un mazazo. |

Arte pintado con **ImageGen integrado**. Las piezas generadas se extraen mecánicamente conservando su alfa; el rig anima sus transformaciones, expresiones, anticipación y recuperación. No son fotogramas regenerados por separado. Los prompts exactos y las correcciones se encuentran en [PROMPTS.md](./PROMPTS.md).

## Vista y archivos

- [Visor interactivo](./index.html): tres plantas, cinco acciones, pausa, velocidad, giro y combate de práctica.
- [Lámina de conceptos](./preview/conceptos-v7.png), [comparación v6/v7](./preview/antes-despues-v7.png) y [poses de las cinco animaciones](./preview/poses-v7.png).
- [Vista animada GIF](./preview/movimientos-cilantro-limon-jengibron.gif) y [WebP](./preview/movimientos-cilantro-limon-jengibron.webp).
- [Secuencia del mazazo](./preview/mazazo-v7.png).
- [Catálogo](./manifest.json): rutas de atlas, metadatos, piezas, efectos y clips.
- `characters/<id>/sprites/`: atlas PNG RGBA y JSON por clip.
- `characters/<id>/animated/`: WebP y GIF para revisar cada clip. Estas vistas repiten la animación; el juego debe respetar `loop` y `after` del JSON.
- `characters/<id>/parts/`, `rig.json` y `portrait.png`: piezas, descripción del rig y retrato del personaje ensamblado.
- `source/`: los tres kits originales transparentes generados; no contiene la referencia de PvZ proporcionada por el usuario.

## Formato para el juego

15 clips y **648 cuadros**. Miran a la derecha. Cada cuadro mide **256 × 256 px**, a **30 fps**, con **8 columnas** por atlas. Alfa real, sin sombra de suelo pintada. El pivote es `(0.46875, 0.9)`; el suelo está en `y = 230.4` del cuadro. Todos los atlas conservan el cuadro completo y se pueden invertir horizontalmente.

| Clip | Duración | Cuadros | Bucle |
| --- | --- | --- | --- |
| `idle` | 2.4 s | 72 | Sí |
| `attack` | 1.2 s | 36 | No |
| `hit` | 0.8 s | 24 | No |
| `spawn` | 1.2 s | 36 | No |
| `celebrate` | 1.6 s | 48 | No |

El espacio lógico del rig mide `320 × 320`, con suelo en `(150, 288)`. Para dibujar directamente un rig a tamaño de atlas, se escala por `0.8`. El runtime usa una sola llamada `update(deltaSeconds)` seguida de `draw(ctx)` por planta. Los estados de una sola ejecución vuelven a `idle`.

## Eventos y compatibilidad

Los proyectiles se entregan por separado y los mueve el juego. Las señales están en `sprites/attack.json` y `animationEvents(character, 'attack')`:

- Cilantro: `aroma` en **0.5 s / cuadro 15**. Interrumpe el mordisco durante 1.1 s; conserva movimiento, vida y armadura.
- Limón: `acid` en **0.5 s / cuadro 15**. Conserva el balance anterior: 16 de daño normal y 44 adicionales solo contra armadura. La corrosión sobrante no pasa a la vida.
- Rizomazo: dos eventos `punch`, **Tanteo en 0.4 s / cuadro 12** y **Mazazo en 0.8 s / cuadro 24**, con 22 y 34 de daño. Se comprueba carril, dirección y alcance de 152 en cada contacto. Interrumpir el ataque cancela el segundo contacto pendiente.

Rizomazo mantiene el id `jengibron` y los campos históricos `hand: front/back` para compatibilidad con los adaptadores del pack v6. Su anatomía usa cabeza, tallo y raíz; la etiqueta visible de cada contacto está en `event.label`.

`runtime/fresh-mechanics.mjs` contiene adaptadores opcionales y `fresh-scene.mjs` el combate de práctica. En el repositorio, el visor comparte los assets de `zombis-vivos`; el ZIP incluye sus dos objetivos y cambia únicamente esa ruta. El balance es una base para probar los rediseños, no una integración en el juego principal.

## Reproducir y revisar

En el repositorio, desde `landing-page`, con `@napi-rs/canvas`, `sharp` y `playwright` disponibles:

```sh
node scripts/build-plant-assets.mjs cilantro limon jengibron --rig-module public/plantas-vivas/estetica-v7/runtime/plant-rig.mjs --assets-root public/plantas-vivas/estetica-v7
node scripts/render-plant-preview.mjs --fresh --rig-module public/plantas-vivas/estetica-v7/runtime/plant-rig.mjs --assets-root public/plantas-vivas/estetica-v7
node scripts/render-redesign-review.mjs
node scripts/verify-fresh-plants.mjs --rig-module public/plantas-vivas/estetica-v7/runtime/plant-rig.mjs --assets-root public/plantas-vivas/estetica-v7 --viewer-url http://127.0.0.1:8765/plantas-vivas/estetica-v7/index.html
python scripts/package-redesign-assets.py
```

Los scripts aceptan `--canvas-module` y `--playwright-module` para indicar una instalación existente de esas dependencias. La validación comprueba dimensiones, alfa, ausencia de recortes en los 648 cuadros, duración, señales de contacto e interacción con los zombis. Los informes están en `validation.json` y `fresh-validation.json`. [portable-validation.json](./portable-validation.json) registra la prueba del ZIP extraído: tres plantas, objetivos incluidos, ataques y descargas sin rutas faltantes.

Para revisar el ZIP, extraerlo y servir su carpeta por HTTP, por ejemplo `python -m http.server 8765 --bind 127.0.0.1`. Abrir `http://127.0.0.1:8765/index.html`. Los módulos requieren HTTP para cargar imágenes y ejecutar el visor.
