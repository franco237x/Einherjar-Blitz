# Plantas vivas — elenco original v5

Pack de personajes para Einherjar Blitz. Arte original creado con la herramienta integrada **ImageGen**, con dirección caricaturesca basada en la referencia del usuario: anatomías distintas, contornos claros, ojos expresivos y sombras sencillas. Animación continua por piezas; exportaciones deterministas a **30 cuadros por segundo**. Fecha: 1 de octubre de 2026.

## Personajes

| Personaje | Anatomía y carácter | Acción principal |
| --- | --- | --- |
| Nabú | Nabo bajo, cuerpo entero con cara, cresta de hojas y patas de raíz | Comprime el cuerpo y escupe una semilla |
| Cardón | Cactus alto, columna delgada y brazos asimétricos, expresión seria | Se arquea y lanza una espina |
| Mordiseta | Hongo ancho, sombrero pesado, cara dormilona en el tallo | Infla el sombrero y libera esporas |
| Zarzina | Flor carnívora con ojos laterales, cuello curvo y dos mandíbulas | Abre la boca y da un mordisco |
| Solmiel | Farol de physalis, fruto dorado colgante, cáliz y una hoja grande | Comprime el farol y produce un sol de 25 de energía |
| Granadín | Granada baja y asimétrica, ojos nerviosos, tallito y raíces cortas | Tiembla, se infla y explota; queda consumida hasta replantarla |
| Aurélia | Orquídea rara con abanicos de pétalos nacarados y tallo curvo | Pliega y despliega los pétalos con rocío y destellos |
| Cortezón | Tronco ancho de corcho, corona con brote y raíces gruesas | Bloquea y absorbe impactos; defensa pura, sin ataque ni proyectil |
| Frígora | Helecho de hielo con brote enrollado y dos frondas rizadas | Lanza escarcha que ralentiza y puede acumularse para congelar |
| Velaria | Cala oscura asimétrica, capullo como un manto, gesto solemne y garganta luminosa | Ancla una sombra y devuelve al enemigo sobre sus pasos después de 2 s |

Cada uno usa piezas, proporciones y movimientos propios. La primera propuesta se conserva fuera de los assets activos, en `asset-drafts/plantas-vivas-v1/` del proyecto.

## Entrega

Abre `/plantas-vivas/index.html` desde el servidor del proyecto, o sirve la carpeta `public/` con un servidor HTTP local. El visor permite elegir personaje, acción, fondo, velocidad y dirección, pausar y descargar archivos. Con movimiento reducido activado comienza en pausa; las acciones se reproducen al solicitarlas.

- `plantas-vivas-pack-v5.zip`: paquete completo de los diez personajes, visor, runtime, fuentes originales y prompts.
- `velaria-assets-v5.zip`: entrega individual de Velaria, con sus ocho animaciones, piezas, fuente, runtime, mecánica, previews y guía.
- `README-velaria.md`: tiempos, reglas e integración del Eco umbrío.
- `preview/lineup-v5.png`: elenco de diez plantas sobre fondo transparente.
- `preview/lineup-velaria.png`: Velaria sobre fondo transparente.
- `preview/movimientos-velaria.gif` y `.webp`: las ocho animaciones de Velaria.
- `preview/eco-umbrio.gif` y `.webp`: habilidad completa sobre un objetivo en movimiento, retorno y recarga real.
- `preview/eco-umbrio-pasos.png`: seis momentos de la habilidad para revisión.
- `preview/lineup-defensa-hielo.png`: Cortezón y Frígora sobre fondo transparente.
- `preview/movimientos-defensa-hielo.gif` y `.webp`: bloqueo, escarcha, daño, desgaste de la corteza, aparición y celebración de las nuevas plantas.
- `preview/lineup-nuevas.png`: Solmiel, Granadín y Aurélia sobre fondo transparente.
- `preview/movimientos-nuevas.gif` y `.webp`: vista de las tres incorporaciones en reposo, acción, aparición y celebración.
- `preview/movimientos-v5.gif` y `.webp`: vista del elenco completo.
- `characters/<id>/portrait.png`: retrato PNG transparente a 512 × 512.
- `characters/<id>/parts/`: piezas PNG con transparencia y expresiones normalizadas.
- `characters/<id>/sprites/<acción>.png`: atlas de cuadros PNG con transparencia.
- `characters/<id>/sprites/<acción>.json`: rectángulos, duración de cada cuadro, pivote y evento de acción.
- `characters/<id>/animated/<acción>.webp`: animación transparente con alfa suave.
- `characters/<id>/animated/<acción>.gif`: vista animada para revisión; GIF tiene transparencia binaria.
- `characters/<id>/rig.json`: anatomía, piezas y regiones de extracción del original.
- `manifest.json`: catálogo de archivos y datos de reproducción.
- `validation.json`: verificación de movimiento, transparencia, bordes y salida del evento una vez por ataque.
- `browser-validation.json`: comprobación de las 55 animaciones en el visor, las mecánicas anteriores y el Eco umbrío: avance durante la marca, ancla fija, retorno único, recarga, interrupción, pérdida del objetivo y repetición.
- `prompts/`: textos exactos enviados a ImageGen, incluidas las correcciones.
- `source/`: originales de las diez plantas y referencias de dirección artística. Las referencias de terceros se excluyen del ZIP; no forman parte de los sprites del juego.

## Animaciones

| Identificador | Acción | Cuadros | Duración | Reproducción |
| --- | --- | ---: | ---: | --- |
| `idle` | Reposo y parpadeo | 72 | 2,4 s | Bucle |
| `attack` | Ataque, producción solar, explosión o floración | 36 | 1,2 s | Una vez |
| `hit` | Reacción al daño | 24 | 0,8 s | Una vez |
| `spawn` | Aparición con rebote | 36 | 1,2 s | Una vez |
| `celebrate` | Celebración | 48 | 1,6 s | Una vez |
| `guard` | Bloqueo de Cortezón | 36 | 1,2 s | Una vez |
| `damaged` | Cortezón con corteza agrietada | 72 | 2,4 s | Bucle |
| `critical` | Cortezón con daño crítico | 72 | 2,4 s | Bucle |
| `seal` | Velaria prepara y fija el sello | 42 | 1,4 s | Una vez, sigue a `channel` |
| `channel` | Velaria sostiene el vínculo | 72 | 2,4 s | Bucle hasta retorno o interrupción |
| `recall` | Velaria reclama la sombra | 36 | 1,2 s | Una vez, sigue a `recover` |
| `recover` | Velaria recupera el aliento | 42 | 1,4 s | Una vez, sigue a `idle` |

Son **55 clips y 2460 cuadros** en total. Velaria añade **ocho clips y 372 cuadros**, con una secuencia propia para su habilidad. Cortezón y Frígora suman **12 clips y 576 cuadros**: siete estados para la defensora y cinco para el helecho. Cortezón usa `guard` en lugar de `attack`; su catálogo no contiene un ataque ofensivo ni un proyectil. `clipsFor(character)` devuelve únicamente los estados disponibles para cada planta. Cada cuadro mide **256 × 256**; los atlas tienen 8 columnas y filas suficientes para la acción. El atlas mayor mide 2048 × 2304. Las celdas vacías de la última fila no son cuadros de animación: usa el conteo del JSON.

El pivote del lienzo es `(150, 288)` en coordenadas lógicas de 320 × 320, o `(0,46875; 0,9)` normalizado. Las plantas miran a la derecha. Para mirar a la izquierda, refleja horizontalmente alrededor del pivote. Los proyectiles son archivos separados: su salida y velocidad están en el evento `attack` del JSON. Zarzina emite `bite`, para aplicar el efecto o daño de contacto.

Las nuevas acciones usan eventos distintos:

| Planta | Evento y momento | Datos |
| --- | --- | --- |
| Solmiel | `sun` a los 0,58 s | `value: 25`, icono del sol y velocidad inicial; el juego decide el intervalo de producción y la recolección |
| Granadín | `explosion` a los 0,70 s | `consumePlant: true`, radio visual lógico de 124; el juego decide daño y alcance en su tablero |
| Aurélia | `bloom` a los 0,56 s | `rarity: rare`; animación de floración y destellos, sin estadísticas de combate impuestas |
| Cortezón | `block` a los 0,42 s de `guard` | `passive: true`, `damage: 0`; sin ataque, proyectil ni daño reflejado |
| Frígora | `chill` a los 0,53 s de `attack` | Velocidad al 50% durante 3 s; tres impactos antes de que expire la escarcha congelan durante 1,2 s |
| Velaria | `shadow-mark` a los 0,72 s de `seal` | Un ancla fija; retorno horizontal a los 2 s; recarga de 7 s desde la marca; daño directo cero |

El campo `frame` del evento indica el primer cuadro a los 30 FPS que alcanza su tiempo continuo; se calcula con `ceil(time * fps)`. Los bucles declaran su propio identificador en `after`; los estados de una sola ejecución declaran su siguiente estado. El `animation-cue` del retorno de Velaria es visual y tiene `gameplay: false`: la lógica aplica el retorno una sola vez.

Los atlas y WebP de Solmiel incluyen el nacimiento y ascenso del sol para que la acción se reconozca sola. El rig vivo lo emite como objeto separado mediante `onEvent`; `plant.draw(context)` dibuja la planta, y el juego dibuja el recurso. Se puede usar `renderPlant(..., { includeEmittedObjects: true })` para una vista autónoma. Granadín incluye el estallido, las semillas y la cáscara residual en su clip.

## Defensa y frío

Cortezón declara `combat.blocks: true`, daño ofensivo y reflejado en cero. Su vida sugerida, 1600, es un dato de balance editable. El motor del juego decide la colisión y cuánto daño recibe. El rig rechaza `play('attack')`; usa `play('guard')` para afianzarse y `play('hit')` para recibir un golpe.

`setHealthRatio(vidaActual / vidaMáxima)` añade las grietas al rig: sano por encima del 55%, agrietado hasta el 55% y crítico hasta el 25%. Los bucles `damaged` y `critical` exportan esos dos aspectos; las capas `cracks.png` y `cracks-critical.png` permiten combinarlos con otras acciones. En el visor se pueden comparar los estados o mover el control de integridad. `spawn` vuelve a la integridad completa.

Frígora usa los valores editables de `character.cold`; el disparo de control tiene daño directo cero. `createColdStatus`, `applyChill` y `updateColdStatus` implementan el efecto sin depender del visor. Aplica el evento al **impactar** el copo, no al salir de la planta. Cada impacto refresca los 3 s de ralentización y suma una carga; el tercero congela y consume las cargas. Tras descongelarse sigue ralentizado mientras quede tiempo. Si la escarcha expira, las cargas se borran. El visor incluye un objetivo que se mueve, se ralentiza y se congela; activa «Repetir acción» para ver la secuencia.

```js
import { createColdStatus, applyChill, updateColdStatus } from '/plantas-vivas/runtime/plant-rig.mjs';
const enemyCold = createColdStatus();
// Guarda el evento chill en el proyectil; al colisionar con este enemigo:
applyChill(enemyCold, projectile.event);
// En cada actualización, deltaSeconds en segundos:
const speedFactor = updateColdStatus(enemyCold, deltaSeconds);
enemy.x += enemy.baseSpeed * speedFactor * deltaSeconds;
```

## Uso del rig en un juego web

Este ejemplo va en un módulo de navegador. Integra `update` y `draw` en el bucle existente del juego; una instancia no crea temporizadores adicionales.

```js
import { loadPlant, PlantAnimator } from '/plantas-vivas/runtime/plant-rig.mjs';

const { character, parts } = await loadPlant('zarzina');
const plant = new PlantAnimator(character, parts, {
  onEvent(event) {
    // event.type: 'bite', 'projectile', 'sun', 'explosion', 'bloom', 'block', 'chill' o 'shadow-mark'
    // event.position y velocity usan coordenadas locales de la planta.
    // Aplica aquí las reglas del juego y transforma la posición a tu escena.
  },
});

plant.play('attack');
// En cada actualización del juego, con delta en segundos:
plant.update(deltaSeconds);
// Sobre un contexto Canvas 2D posicionado y escalado para esta planta:
plant.draw(context);
```

`PlantAnimator` vuelve a `idle` al terminar una acción, excepto Granadín y la secuencia ritual de Velaria. Granadín mantiene `spent: true` y su cáscara residual; `play('spawn')` lo replanta y las demás acciones se rechazan mientras esté consumido. Velaria pasa de `seal` a `channel`, y de `recall` a `recover` y después `idle`; la lógica de su marca decide cuándo iniciar el retorno o cancelar el vínculo. El evento se dispara una sola vez, incluso si la actualización cruza el instante de salida. El visor muestra los proyectiles y soles por separado. Su opción de repetir replanta automáticamente a Granadín y respeta la recarga de Velaria. Los WebP/GIF de cada acción se repiten para facilitar la revisión; en el juego, respeta `loop` y `after` del JSON.

## Eco umbrío

La mecánica de Velaria está implementada con `createShadowRecall`, `canMarkShadow`, `markShadow`, `updateShadowRecall` e `interruptShadowRecall`. Conserva la posición horizontal del objetivo; este sigue moviéndose y, al terminar los 2 s, vuelve a su ancla en la misma fila. Conserva vida, velocidad y otros estados. Admite una única marca y una recarga de 7 s que comienza al emitir el sello. Si Velaria recibe un golpe, el objetivo desaparece, cambia de fila o sale del alcance, se cancela el retorno y continúa la recarga.

El reloj del visor entrega el mismo delta acotado a la animación, al movimiento y a la mecánica. Aplica la velocidad de reproducción antes de limitar el delta a 0,1 s, como hace `PlantAnimator.update`, para mantener el tirón y el retorno sincronizados también con cuadros espaciados.

La anticipación del retorno empieza 0,36 s antes del desplazamiento, sincronizada con `recall`. `updateShadowRecall` modifica `target.x` y devuelve eventos para los efectos; evita aplicar de nuevo el desplazamiento al recibir el aviso `shadow-rewind`. La animación independiente `animation-cue` no produce efectos de combate. Hay una guía completa en `README-velaria.md` y un ejemplo funcional en `viewer.mjs`; `runtime/shadow-scene.mjs` dibuja únicamente el objetivo de práctica y el vínculo.

En el visor pulsa «Eco umbrío» para ejecutar la habilidad completa. Las otras acciones permiten revisar los clips aislados; elegirlas interrumpe una marca activa. «Recibir golpe» y «Retirar objetivo» comprueban las cancelaciones. «Reiniciar prueba» borra explícitamente el estado de la demostración.

## Reconstrucción

Los scripts están en `landing-page/scripts/`. Necesitan Node.js, `sharp` y `@napi-rs/canvas`. `sharp` ya está en las dependencias del proyecto; Canvas está disponible en el runtime de artefactos de Codex. También se puede usar una instalación local de `@napi-rs/canvas`.

Dentro del ZIP hay una copia de los exportadores en `tooling/`, ajustada para reconstruir el pack desde su propia carpeta. Usa `node tooling/build-plant-assets.mjs` y `node tooling/render-plant-preview.mjs` con las mismas dependencias y el argumento `--canvas-module` cuando corresponda.

```powershell
node scripts/build-plant-assets.mjs --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-plant-preview.mjs --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-plant-preview.mjs --new-only --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-plant-preview.mjs --defense-ice --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-plant-preview.mjs --nocturne --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-shadow-demo.mjs --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/verify-shadow-mechanic.mjs
```

Las fuentes permanecen intactas. El exportador separa componentes con alfa, recorta el margen transparente y mantiene los bordes suaves; normaliza las expresiones al tamaño de la pieza neutral y genera los cuadros usando el mismo rig del visor. Para regenerar solo un personaje, agrega su identificador: `nabu`, `cardon`, `mordiseta`, `zarzina`, `solmiel`, `granadin`, `aurelia`, `cortezon`, `frigora` o `velaria`. `--metadata-only` sincroniza los eventos y transiciones del catálogo sin regenerar imágenes.

Referencias técnicas consultadas: [Canvas y animación](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) y [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame).
