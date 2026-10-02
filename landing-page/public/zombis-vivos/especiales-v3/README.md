# Brutón y Ráfago — poses completas v3

La versión anterior deformaba los recortes al montar brazos, rodillas y zapatos. Esta entrega utiliza **108 poses de cuerpo completo dibujadas**: 12 por hoja, con cabeza, torso, extremidades y ropa conectados en el propio dibujo. La caída se redibuja por etapas; mantiene el tamaño del cuerpo y termina apoyada en el suelo.

## Archivos para integrar

- **13 clips principales** (390 cuadros de atlas), más **5 variantes sin protección** de Ráfago (156 cuadros).
- Atlas PNG RGBA de **256 × 256**, 8 columnas, 30 fps; JSON con cuadros, pivote, tiempos y contactos.
- Atlas **512 × 512** `@2x.png` y `@2x.json` para los 18 clips. Recomendados al ampliar a Brutón. Son renders desde las poses originales en alta resolución, no ampliaciones del atlas de 256 px.
- WebP transparente y GIF por clip; un vistazo conjunto de 7,8 s en `preview/movimientos.webp` o `.gif`.
- `manifest.json` reúne los caminos `atlas`, `data`, `hdAtlas`, `hdData`, `webp` y `gif`.
- Las hojas del runtime en `characters/*/poses/` tienen cuadros de 512 px y contienen las poses de cuerpo completo.

**30 fps describe la cadencia de reproducción y exportación.** Caminar y golpear usan 12 dibujos en 1,2 s (10 poses/s); correr y morder usan 12 dibujos en 0,8 s (15 poses/s). Los dibujos se mantienen dos o tres cuadros, sin interpolaciones que estiren el cuerpo ni fundidos entre poses. Reposo y entrada agregan movimiento leve o aparición sobre una pose completa.

## Personajes y movimiento

| Personaje | Vida | Protección | Velocidad lógica | Escala recomendada |
| --- | ---: | ---: | ---: | ---: |
| Brutón | 800 | 0 | 11,111 unidades/s | 1,75 |
| Ráfago | 140 | 300 | 77,778 unidades/s | 1 |

Valores iniciales editables en `runtime/zombie-rig.mjs`. Ráfago tiene 3,5 veces la velocidad lógica de Despistado. Brutón recibe el daño directamente en la vida. Casco y hombreras protegen a Ráfago y se desprenden al agotarse los 300 puntos de protección.

La escala de Brutón permite mantener todas sus poses, incluida la caída horizontal, dentro de cuadros cuadrados sin encoger al personaje durante una acción. Aplicarla al dibujar el personaje. El visor la aplica también al avance para mantener la misma relación entre figura y recorrido.

Pivote `(0.5, 0.9)`, orientación **izquierda**. Suelo a `y = 230.4` en 256 px, `460.8` en 512 px o `288` en el canvas lógico de 320 px. Voltear horizontalmente para mirar a la derecha. El motor desplaza a la entidad en el mundo.

| Clip | Duración | Cuadros | Comportamiento |
| --- | ---: | ---: | --- |
| `idle` | 2,4 s | 72 | Bucle |
| `walk` — Brutón | 1,2 s | 36 | Bucle |
| `smash` — Brutón | 1,2 s | 36 | Una vez, vuelve a caminar |
| `run` — Ráfago | 0,8 s | 24 | Bucle |
| `bite` — Ráfago | 0,8 s | 24 | Bucle |
| `hit` | 0,4 s | 12 | Una vez, vuelve a avanzar |
| `spawn` | 0,6 s | 18 | Restaura vida/protección y vuelve a avanzar |
| `fall` | 0,8 s | 24 | Una vez, conserva la pose final |
| `armor-break` — Ráfago | 0,6 s | 18 | Desprende casco/hombreras y vuelve a correr |

## Contactos y estados

Brutón impacta a **0,7 s / cuadro 21**, con daño inicial 80. `requiresContact` y `plantTarget` requieren que el juego compruebe una planta al alcance. Recibir daño durante la preparación interrumpe ese golpe.

Ráfago muerde a **0,4 s / cuadro 12**, con daño inicial 16, una vez por ciclo. Al perder protección emite `armor-drop` a **0,16 s / cuadro 5** y el runtime combina una pose completa sin protección con las dos piezas pintadas que salen despedidas. Después usa las variantes `unarmored` para `idle`, `run`, `bite`, `hit` y `fall`. Los zapatos y las muñequeras se conservan.

Los eventos de caída y protección son señales visuales, con `gameplay: false`. El daño sobrante de la protección alcanza la vida. Una muerte inmediata prevalece sobre perder armadura. `fall` bloquea ataques y desplazamiento hasta `spawn`.

Los índices de cuadro de los eventos empiezan en 0; el contador visible del visor empieza en 1. Los tiempos de los eventos están expresados en segundos y sus posiciones en coordenadas lógicas de 320 px.

```js
import { loadZombie, ZombieAnimator } from './runtime/zombie-rig.mjs';
const { character, parts } = await loadZombie('bruton');
const actor = new ZombieAnimator(character, parts, {
  onEvent(event) {
    // El juego comprueba el objetivo al alcance y aplica el daño del contacto.
  },
});
const dx = actor.update(deltaSeconds);
actor.draw(context); // Canvas lógico de 320 × 320.
actor.applyDamage(25);
actor.setSpeedMultiplier(0.5); // Ralentiza avance y ciclo de locomoción; 0 congela ambos.
```

Los assets están preparados para integrar; esta entrega no agrega enemigos a las oleadas.

## Revisar y reproducir

Servir la carpeta con HTTP y abrir `index.html`. El visor incluye **Avanzar cuadro**, pausa, velocidad, giro, avance, fondos y prueba de daño. Con movimiento reducido empieza pausado. `preview/poses.png` reúne las acciones y las caídas.

`pose-registration.json` documenta la extracción y posición de cada dibujo. Se conserva una sola escala uniforme por hoja, con la variante sin protección a la escala de su hoja protegida. Las poses mantienen la proporción del original; no se estira ninguna extremidad. El alfa y los bordes de todos los cuadros se verifican al exportar.

Desde `landing-page`, con Node, Sharp, `@napi-rs/canvas`, Playwright y Python:

```powershell
node scripts/build-drawn-zombies.mjs
node scripts/render-drawn-zombie-review.mjs
node scripts/verify-drawn-zombies.mjs
python scripts/package-drawn-zombies.py
node scripts/verify-special-zombie-pack.mjs --version 3
python scripts/package-drawn-zombies.py
```

Los scripts aceptan `--canvas-module` o `--playwright-module` para resolver bibliotecas de otro runtime; la prueba del ZIP también acepta `--python`. La prueba del visor espera `public` servido en `http://127.0.0.1:8765/`. La del ZIP crea y cierra un servidor propio sobre una copia extraída en `asset-drafts/`. El segundo empaquetado incorpora su informe.

`validation.json`, `browser-validation.json` y `pack-validation.json` documentan las comprobaciones. El ZIP se genera en `public/zombis-vivos/zombis-especiales-v3.zip`.

Arte mediante ImageGen integrado, generación con referencia y ediciones para quitar protección y separar poses. Ver [PROMPTS.md](./PROMPTS.md). La revisión anterior permanece como referencia en `especiales-v2/legacy.html`.
