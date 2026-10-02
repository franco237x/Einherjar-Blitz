# Velaria · Cala del eco umbrío

Planta original, oscura y solemne: capullo asimétrico de cala, pétalos como un manto, raíces entrelazadas y una gota de luz en la garganta. Arte raster creado con **ImageGen integrado**; fuente intacta en `source/velaria-parts.png`, prompt exacto en `prompts/velaria.txt`. Rig continuo de piezas con exportaciones a **30 FPS**.

## Habilidad

**Eco umbrío** ancla la sombra de un enemigo. Este continúa avanzando durante **2 segundos** y entonces regresa a la posición horizontal que ocupaba al recibir la marca, en la misma fila. Tiene una marca activa como máximo y **7 segundos de recarga**, contados desde la emisión del sello. No modifica vida, velocidad ni otros estados del enemigo; daño directo cero. Puede combinarse con otras plantas.

Un golpe a Velaria rompe un vínculo activo. También se cancela si el objetivo muere, se reemplaza, cambia de fila o sale del alcance. La cancelación conserva la recarga restante. Un golpe durante la preparación, antes de emitir la marca, impide que esta nazca.

## Animaciones y entrega

**8 clips · 372 cuadros**. Retrato de 512 × 512, piezas transparentes, cuadros de 256 × 256 y atlas de ocho columnas. PNG y WebP conservan alfa suave; GIF sirve para revisar. Los GIF/WebP repiten el clip para facilitar su inspección; el juego respeta los campos `loop` y `after`.

| Clip | Cuadros | Duración | Movimiento y salida |
| --- | ---: | ---: | --- |
| `idle` | 72 | 2,4 s | Respiración contenida, pétalos con retraso y parpadeo; bucle |
| `seal` | 42 | 1,4 s | Recoge los pétalos, abre el manto y emite el sello; sigue a `channel` |
| `channel` | 72 | 2,4 s | Mantiene el sigilo flotante y el pulso de luz; bucle |
| `recall` | 36 | 1,2 s | Anticipa, cierra los pétalos y tira del vínculo; sigue a `recover` |
| `recover` | 42 | 1,4 s | Baja el capullo, cierra los ojos y recupera el aliento; sigue a `idle` |
| `hit` | 24 | 0,8 s | Amortigua el golpe y sacude los pétalos |
| `spawn` | 36 | 1,2 s | Brota desde sus raíces y abre el capullo |
| `celebrate` | 48 | 1,6 s | Inclina el capullo con un gesto discreto |

El pivote es `(150, 288)` en un lienzo lógico de 320 × 320; normalizado `(0,46875; 0,9)`. El mayor atlas, `idle`/`channel`, mide 2048 × 2304. Los rectángulos y duraciones de cada cuadro están en los JSON de `characters/velaria/sprites/`; cada archivo declara sus eventos y transición.

- `characters/velaria/`: piezas, retrato, rig, manifiesto y ocho animaciones en PNG/WebP/GIF.
- `runtime/plant-rig.mjs`: rig y funciones de combate independientes del visor.
- `runtime/shadow-scene.mjs`: escena opcional del objetivo de práctica y vínculo.
- `preview/eco-umbrio.gif` y `.webp`: una habilidad completa, incluyendo retorno, recuperación y recarga; 264 cuadros, 8,8 s.
- `preview/movimientos-velaria.gif` y `.webp`: las ocho acciones aisladas; 324 cuadros, 10,8 s.
- `preview/eco-umbrio-pasos.png`: seis momentos de la mecánica.
- `preview/lineup-velaria.png`: personaje transparente.
- `source/velaria-parts.png` y `prompts/velaria.txt`: fuente y prompt de creación.

`velaria-assets-v5.zip` contiene la planta individual y su runtime. El visor con los diez personajes está en `plantas-vivas-pack-v5.zip`. Ambos se guardan en `landing-page/public/plantas-vivas/` del proyecto. Las versiones anteriores del pack siguen disponibles.

## Sincronización

| Tiempo desde iniciar `seal` | Momento |
| ---: | --- |
| 0,00 s | Anticipación y recogida de pétalos |
| 0,72 s | Evento `shadow-mark`: guarda el ancla y empieza la recarga |
| 1,40 s | Entra en `channel` |
| 2,36 s | Comienza `recall`, anticipando el retorno |
| 2,72 s | El objetivo vuelve al ancla; impulso visual a los 0,36 s de `recall` |
| 3,56 s | Entra en `recover` |
| 4,96 s | Regresa a `idle` |
| 7,72 s | Termina la recarga y puede crear una nueva marca |

Los tiempos son continuos. En atlas de 30 FPS el campo `frame` usa el primer cuadro que alcanza el instante (`ceil(time * fps)`): cuadro 22 para el sello y 11 para el impulso de retorno. El evento del clip `recall` es `animation-cue`, con `gameplay: false`; sirve para sonido/efectos, sin volver a aplicar la mecánica.

## Integración

El enemigo necesita `{ id, alive, lane, x, y }`; `health`, velocidad y otros estados permanecen bajo control del juego. Las coordenadas del enemigo, la posición del evento y `maxRange` deben usar las mismas unidades. El valor base del alcance es 260 unidades lógicas; transforma la posición local del rig y el alcance a la escena de tu juego.

1. Crea un estado por Velaria con `createShadowRecall()`.
2. Antes de iniciar `seal`, comprueba `canMarkShadow(state, worldEvent, enemy)` y evita reiniciar un `seal` en curso.
3. Al recibir `shadow-mark` del animator, llama a `markShadow(state, worldEvent, enemy)`. Selecciona un enemigo de su fila.
4. El juego mueve al enemigo de forma normal. Actualiza la marca con `updateShadowRecall(state, deltaSeconds, currentEnemy)`.
5. Ante `shadow-recall-start`, inicia `recall` y asigna `plant.seconds = event.elapsed` para conservar la sincronía si el paso cruzó el instante de anticipación.
6. `shadow-rewind` indica que el helper **ya cambió `enemy.x`**. Dibuja su estela y efectos; aplica el retorno una sola vez.
7. Ante un golpe llama a `interruptShadowRecall(state, 'caster-hit')` y reproduce `hit`. Si devuelve un evento de cancelación, conserva la recarga.

El helper invalida automáticamente objetivos ausentes, muertos, de otra identidad, de otra fila o fuera del alcance. Pasa el estado actual del enemigo, o `null` si ya no existe. Sus avisos `shadow-cancel` y `shadow-ready` permiten terminar el vínculo y habilitar la habilidad.

El visor `index.html` es un ejemplo funcional. Allí el animator se actualiza primero; si acaba de emitir una marca, el helper recibe delta cero en ese paso para evitar contar de nuevo tiempo anterior a su creación. El objetivo de práctica es un auxiliar procedural de la demostración. En el juego se usa el enemigo real.

## Verificación

Se comprobaron transparencia, movimiento, límites de todos los cuadros, duración exacta, bucles sin salto y eventos únicos. La lógica verifica retorno a un ancla independiente, vida/velocidad conservadas, recarga, rechazo de marcas simultáneas, interrupción, pérdida/cambio de objetivo, fila, alcance y pasos grandes. La prueba en navegador comprueba el desplazamiento real, pausa, repeticiones con recarga, cancelaciones y vista a 1280, 390 y 320 píxeles. Una prueba adicional con intervalos simulados de 120 ms entre cuadros y reproducción a 1,5× comprueba que el retorno físico y el tirón animado coinciden a los 0,36 s de `recall`.

Reconstrucción dentro del proyecto:

```powershell
node scripts/build-plant-assets.mjs velaria --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-plant-preview.mjs --nocturne --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/render-shadow-demo.mjs --canvas-module 'RUTA/AL/MODULO/@napi-rs/canvas'
node scripts/verify-shadow-mechanic.mjs
```

En el complemento individual los exportadores están en `tooling/`: sustituye `scripts/` por `tooling/` en esos comandos. La entrega incluye el arte animado, la mecánica reutilizable y una demostración comprobada para integrarlos en el motor y balance del juego.
