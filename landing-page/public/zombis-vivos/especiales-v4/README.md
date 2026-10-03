# Brutón y Ráfago — animación por piezas, v4

Esta versión vuelve al personaje articulado. Reemplaza las poses completas de v3 y el rig que estiraba extremidades de v2.

Cada personaje tiene **18 piezas pintadas**, repartidas en **tres hojas transparentes**: cuerpo, brazos y piernas. Se entregan seis hojas en total, los PNG individuales, los pivotes y un visor. Las manos y los zapatos son piezas independientes. Las hombreras de Ráfago están pintadas dentro de su torso: **sólo se desprende el casco**.

## Archivos

- `source/`: las seis hojas originales de ImageGen, con alfa auténtico.
- `characters/<id>/parts/`: las 18 piezas en resolución original.
- `characters/<id>/sheets/`: hojas ordenadas en celdas de 512 px y sus datos de empaquetado. La escala de empaquetado no cambia el rig.
- `characters/<id>/rig.json`: pivotes en píxeles de las piezas originales, escala uniforme fija, articulaciones, longitudes, orden de capas y referencias de origen.
- `runtime/zombie-rig.mjs`: esqueleto, curvas de movimiento, renderizador y estados de combate, sin dependencias de v2 o v3.
- `characters/<id>/sprites/`: atlas PNG transparentes de 256 px y versiones `@2x` de 512 px, con JSON por clip.
- `characters/<id>/animated/`: GIF y WebP de cada acción.
- `characters/rafago/helmetless/`: seis clips sin casco, con las mismas hombreras, ropa y extremidades.
- `preview/`: muestra animada y hojas para revisar las poses.

## Formato del juego

Los atlas tienen **8 columnas**, cuadros sin recortar y reproducción a **30 fps**. Se calculan 30 cuadros por segundo a partir de piezas rígidas; el visor también evalúa las articulaciones entre esos cuadros. No interpola ni deforma dibujos completos. Cada pieza conserva una escala uniforme fija; la longitud del hueso no estira sus píxeles.

Coordenadas lógicas: 320 × 320. Suelo: y = 288. Pivote: `(0.5, 0.9)`. En el atlas de 256 px, el suelo queda en y = 230.4; en el de 512, en y = 460.8. Ambos miran a la izquierda; se puede invertir el personaje completo para mirar a la derecha. Los JSON de atlas llevan el mismo pivote normalizado.

| Clip | Brutón | Ráfago | Comportamiento |
| --- | ---: | ---: | --- |
| `idle` | 72 | 72 | Bucle de respiración y parpadeo |
| `walk` | 72 | — | Marcha pesada; velocidad lógica 11.111 px/s |
| `run` | — | 30 | Carrera; velocidad lógica 77.778 px/s |
| `smash` | 42 | — | Preparación, golpe y recuperación; una vez |
| `bite` | — | 30 | Bucle de ataque detenido ante una planta |
| `hit` | 12 | 12 | Reacción breve; una vez |
| `spawn` | 18 | 18 | Entrada; una vez |
| `fall` | 36 | 36 | Caída articulada; retener el último cuadro |
| `armor-break` | — | 18 | Sale únicamente el casco; una vez |

Se exportan **13 clips principales, 468 cuadros**, y **6 variantes sin casco, 198 cuadros**: 666 cuadros en total por resolución. La variante sin casco de `spawn` es una opción gráfica; el estado de reaparición del visor restaura vida y casco.

Los pies de apoyo compensan la velocidad de avance; las rodillas se resuelven con dos huesos de longitud fija. Los clips de locomoción deben reproducirse con la velocidad recomendada para mantener el apoyo. `recommendedScale` aumenta a Brutón a 1.4 y deja a Ráfago a 1; aplicar la misma escala al desplazamiento. Las entradas y salidas de acciones mezclan posiciones y ángulos durante 0.12 s, incluyendo los pies.

## Mecánica y eventos

Valores conservados: Brutón tiene 800 de vida y ninguna armadura. Ráfago tiene 140 de vida y 300 de protección, representada por su casco. Sus hombreras son parte del diseño y permanecen después de agotar la protección.

- `smash`: contacto a 0.7 s, cuadro **21**; daño 80, exige contacto con una planta.
- `bite`: contacto a 0.5 s, cuadro **15**; daño 16 por ciclo, exige una planta al alcance.
- `armor-break`: señal `helmet-drop` a 0.16 s, cuadro **5**, sólo la pieza `helmet`; señal visual sin daño.
- `fall`: señal de impacto a 0.86 s, cuadro **26**, sin daño adicional.

Los índices de cuadro son **base cero**. El juego debe comprobar el alcance real y aplicar el daño al evento, no en todos los cuadros. Las posiciones de contacto de los JSON están en coordenadas lógicas de 320 px; escalarlas junto con el personaje.

`applyDamage()` consume primero el casco, traspasa el exceso a la vida, da prioridad a la muerte y cancela un golpe interrumpido. La salida del casco vuelve a `run`; la caída termina en `dead`. `spawn` restaura vida y protección. `setSpeedMultiplier()` modifica juntos el avance y el tiempo de locomoción; cero detiene la locomoción. Los ataques y las reacciones conservan su duración propia.

## Uso del rig

```js
import { loadZombie, ZombieAnimator } from './runtime/zombie-rig.mjs';
const { character, parts } = await loadZombie('rafago');
const actor = new ZombieAnimator(character, parts, {
  onEvent(event) { /* comprobar objetivo y aplicar el evento */ }
});
// ctx usa las coordenadas lógicas de 320 px.
const displacement = actor.update(deltaSeconds);
actor.draw(ctx);
// Mostrar articulaciones durante la revisión: actor.draw(ctx, { showRig: true }).
```

Para motores que sólo consumen sprites, usar los atlas y sus metadatos de duración, bucle, estado posterior y eventos. Para editar los movimientos, usar el rig, no las hojas de piezas empaquetadas. El servidor del visor debe servir módulos ES y PNG; abrir `index.html` como `file://` no carga los módulos.

## Regeneración en este repositorio

```text
node scripts/build-articulated-zombies.mjs --canvas-module <ruta-a-@napi-rs/canvas>
node scripts/render-articulated-zombie-review.mjs --canvas-module <ruta-a-@napi-rs/canvas>
node scripts/verify-articulated-zombies.mjs --canvas-module <ruta-a-@napi-rs/canvas> --playwright-module <ruta-a-playwright>
python scripts/package-articulated-zombies.py
node scripts/verify-special-zombie-pack.mjs --version 4 --playwright-module <ruta-a-playwright> --python <ruta-a-python>
```

El builder usa Node, Sharp y `@napi-rs/canvas`. `--parts-only` extrae y ensambla las piezas sin regenerar los clips; `--reuse-parts` reutiliza los PNG y el rig ya extraídos. El ZIP incluye el arte original, los clips, el visor independiente y herramientas de exportación; no incluye las dependencias de Node. La generación del arte se hizo con **ImageGen integrado**, sin API/CLI de imágenes. Los prompts exactos están en [PROMPTS.md](./PROMPTS.md).

La revisión automática comprueba alfa, bordes, proporciones, apoyo de los pies, eventos, variantes, controles y errores del visor. Las hojas `*-revision.png` y la muestra animada sirven para juzgar visualmente el resultado; esos controles no certifican por sí solos la calidad artística.
