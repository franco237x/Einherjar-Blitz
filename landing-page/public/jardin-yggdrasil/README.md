# Jardín de Yggdrasil y podadora nórdica

Assets originales para el tablero de defensa del jardín. Arte creado con **ImageGen integrado**, con el mismo contorno cálido, colores caricaturescos y sombras amplias del elenco de plantas. El fondo usa un porche con motivos rúnicos junto a Yggdrasil, cielo de bosque y un sendero con valla rota a la derecha.

## Fondo para el juego

Archivo: `background/jardin-yggdrasil.webp`. **Una imagen opaca de 2320 × 1390 px**, WebP sin pérdida. El césped está despejado, sin personajes ni objetos; sus 45 casillas se distinguen por dos verdes suaves.

| Zona | Coordenadas | Tamaño |
| --- | --- | --- |
| Casa y podadoras | x 0–180, y 190–1340 | 180 × 1150 |
| Césped jugable | x 180–1980, y 190–1340 | 1800 × 1150 |
| Entrada de zombis | x 1980–2320, y 190–1340 | 340 × 1150 |
| Cielo y fondo | y 0–190 | 2320 × 190 |
| Borde inferior | y 1340–1390 | 2320 × 50 |

Cuadrícula: **9 columnas × 5 filas**. Cada celda mide exactamente **200 × 230 px**. La vista tiene filas rectas, sin convergencia de perspectiva. `background/geometry.json` contiene las 45 posiciones y el rectángulo jugable.

```js
const LAWN_LEFT = 180;
const LAWN_TOP = 190;
const CELL_WIDTH = 200;
const CELL_HEIGHT = 230;
// Origen de la celda, índices desde cero:
const x = LAWN_LEFT + column * CELL_WIDTH;
const y = LAWN_TOP + row * CELL_HEIGHT;
```

Las texturas de césped generadas se ensamblaron en coordenadas enteras para fijar la cuadrícula. Las verificaciones comparan los píxeles reales de las 45 casillas con sus texturas. El entorno y sus fuentes están en `source/`; las imágenes de `preview/` sirven para revisión.

## Podadora

Una podadora de madera, cobre y hierro que mira a la **derecha**, con mango curvo, ruedas de radios metálicos y protector de corte delantero. Usa cinco instancias del mismo asset, una por carril.

- Cuadros transparentes de **256 × 256 px**; atlas de **8 columnas**, a **30 FPS**.
- Pivote normalizado exacto: **`(0.47, 0.9)`**. Suelo visual: **`y=230`**.
- Ancho nominal de 126 px; rango medido en todos los cuadros: **124–129 px**, incluidos los efectos de humo y polvo.
- Alineada con un pivote horizontal de 90 px, cabe por completo dentro de la franja de la casa de 180 px.
- La animación de marcha permanece en el sitio. El juego desplaza la instancia hacia la derecha.

| Clip | Cuadros | Duración | Atlas | Reproducción |
| --- | ---: | ---: | --- | --- |
| `idle` | 36 | 1.2 s | 2048 × 1280 | Bucle; leve vaivén y brillo |
| `start` | 12 | 0.4 s | 2048 × 512 | Una vez; sacudida y humo, sigue a `run` |
| `run` | 24 | 0.8 s | 2048 × 768 | Bucle; ruedas girando, vibración y polvo |

Total: **3 clips, 72 cuadros**. Los bucles de reposo y marcha vuelven a una pose idéntica píxel por píxel. La rueda trasera y la delantera se articulan por separado; el mango y el motor responden al arranque.

Los atlas están en `podadora/sprites/<clip>.png`; sus JSON contienen coordenadas, duración por cuadro, pivote, dirección y el siguiente clip. Las celdas vacías de la última fila no son cuadros de animación: usa el conteo del JSON. `podadora/manifest.json` reúne los tres clips y los parámetros del asset.

Las versiones de `podadora/animated/` son vistas WebP y GIF. Para revisar cómodamente las acciones se repiten en esos archivos. **En el juego `start` se reproduce una sola vez**, según el JSON, y continúa con `run`. Para los bucles, conserva su estado hasta que el juego lo cambie.

## Regla de un uso por carril

El motor guarda un indicador `used` para cada carril. Cuando un zombi llega al borde de la casa:

1. Si la podadora de ese carril sigue disponible, marca `used=true` e inicia `start`.
2. Tras 0.4 s cambia a `run`. El juego controla el avance y las colisiones con los zombis de esa fila.
3. Al salir por la derecha, retira la instancia. Sigue usada hasta el siguiente nivel.

Los archivos de arte y sus cues no aplican daño ni crean otra podadora. La señal de encendido de `start`, a 0.1 s, es visual. El motor decide cuándo barrer o eliminar a cada zombi. `effects/sweep-dust.png` es un efecto opcional de recorte y polvo; también aparece discretamente durante `run`.

## Rutas para Claude

```text
/jardin-yggdrasil/background/jardin-yggdrasil.webp
/jardin-yggdrasil/background/geometry.json
/jardin-yggdrasil/podadora/manifest.json
/jardin-yggdrasil/podadora/sprites/idle.png
/jardin-yggdrasil/podadora/sprites/idle.json
/jardin-yggdrasil/podadora/sprites/start.png
/jardin-yggdrasil/podadora/sprites/start.json
/jardin-yggdrasil/podadora/sprites/run.png
/jardin-yggdrasil/podadora/sprites/run.json
/jardin-yggdrasil/effects/sweep-dust.png
```

## Entrega y reproducción

- `manifest.json`: catálogo del fondo, la podadora y los efectos.
- `verification.json`: comprobación independiente del WebP final, geometría real, atlas, transparencia, anchura y apoyo.
- `preview/jardin.png`: vista reducida del fondo; usa el WebP de `background/` para el juego.
- `preview/jardin-con-podadoras.webp`: vista de escala con las cinco podadoras estacionadas. El fondo final está vacío.
- `preview/podadora.gif` y `.webp`: reposo → arranque → marcha.
- `prompts/` y `PROMPTS.md`: prompts exactos de generación y de la corrección del fondo.
- `jardin-yggdrasil-pack-v1.zip`: fondo, atlas, datos, previews, fuentes y scripts de exportación. Se genera localmente.

Los scripts del proyecto requieren Node, `sharp` y `@napi-rs/canvas`. Aceptan `--canvas-module` para usar una instalación disponible. Recrean los exports a partir de las fuentes guardadas, sin regenerar el arte:

```sh
node scripts/build-garden-assets.mjs
node scripts/verify-garden-assets.mjs
python scripts/package-garden-assets.py
```

En el ZIP los scripts de Node están bajo `tooling/`; ejecuta desde la carpeta extraída `node tooling/build-garden-assets.mjs` y `node tooling/verify-garden-assets.mjs`.
