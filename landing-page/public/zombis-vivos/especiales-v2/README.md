# Brutón y Ráfago — zombis especiales v2

Dos personajes originales para Einherjar Blitz. Arte raster creado con ImageGen integrado; animaciones articuladas a partir de piezas pintadas transparentes. El pack conserva las fuentes, los recortes, el rig, los atlas y las animaciones de revisión.

## Personajes

| Personaje | Diseño y mecánica | Vida | Protección | Velocidad lógica |
| --- | --- | ---: | ---: | ---: |
| Brutón | Gigante de pecho desnudo, hombros enormes, puños de carne y overol roto. Su resistencia depende de la vida. Puñetazo pesado con anticipación y recuperación. | 800 | 0 | 11,111 unidades/s |
| Ráfago | Corredor de fútbol americano, casco verde petróleo, hombreras marfil y camiseta coral. Carrera inclinada, rodillas altas y brazos bombeando. | 140 | 300 | 77,778 unidades/s |

Son valores iniciales de balance editables en `runtime/zombie-rig.mjs`. Ráfago corre a 3,5 veces la velocidad lógica del zombi básico Despistado. Brutón camina a la mitad. Usar `recommendedScale: 1.25` para que Brutón tenga mayor tamaño en el mundo; Ráfago usa `1`. Aplicar la misma escala a la figura y al desplazamiento conserva el apoyo de los pies.

## Formato e integración

- PNG RGBA, cuadros de **256 × 256**, **8 columnas**, **30 fps**, sin recorte variable entre cuadros.
- Miran a la **izquierda**. Voltear horizontalmente para mirar a la derecha.
- Pivote `(0.5, 0.9)`; suelo en `y = 230.4` del cuadro. Rig lógico de `320 × 320`, suelo en `y = 288`.
- **13 clips principales / 528 cuadros**, más **5 clips de Ráfago sin protección / 192 cuadros**: **18 clips y 720 cuadros** en total.
- JSON por atlas con coordenadas, duración de cada cuadro, bucle, estado posterior y eventos. Las duraciones alternan 33/34 ms para sumar exactamente el tiempo del clip.
- WebP y GIF por clip. WebP mantiene alfa y tiempos; GIF es una vista de revisión con transparencia limitada por el formato.

| Personaje | Clip | Cuadros | Duración | Repetición |
| --- | --- | ---: | ---: | --- |
| Brutón | `idle`, `walk` | 72 cada uno | 2,4 s | Bucle |
| Brutón | `smash` | 48 | 1,6 s | Una vez → `walk` |
| Brutón | `hit` | 18 | 0,6 s | Una vez → `walk` |
| Brutón | `spawn` | 30 | 1 s | Una vez → `walk` |
| Brutón | `fall` | 42 | 1,4 s | Una vez → permanece caído |
| Ráfago | `idle` | 72 | 2,4 s | Bucle |
| Ráfago | `run` | 24 | 0,8 s | Bucle |
| Ráfago | `bite` | 36 | 1,2 s | Bucle |
| Ráfago | `hit` | 18 | 0,6 s | Una vez → `run` |
| Ráfago | `spawn` | 30 | 1 s | Una vez → `run` |
| Ráfago | `fall` | 42 | 1,4 s | Una vez → permanece caído |
| Ráfago | `armor-break` | 24 | 0,8 s | Una vez → `run` |

`walk` de Brutón se reproduce a `gaitTempo = 0.8`: un ciclo en el mundo dura 3 segundos. Ráfago usa su propio ciclo de carrera a ritmo 1. El juego desplaza la entidad; los atlas animan el personaje dentro del cuadro.

### Contacto, protección y muerte

Brutón emite un evento `smash` a **0,86 s / cuadro 26**, con daño inicial 80 y contacto lógico `[60, 191]`. `requiresContact` y `plantTarget` indican que el juego debe comprobar una planta al alcance antes de aplicar daño. El efecto de polvo no produce daño adicional. Interrumpir la preparación con `hit` o `fall` cancela el golpe pendiente.

Ráfago emite un `bite` a **0,46 s / cuadro 14**, daño inicial 16, una vez por ciclo. Al agotarse la protección emite `armor-drop` a **0,16 s / cuadro 5**: se desprenden **casco y hombreras**. El resto de los golpes alcanzan la vida. Usar `characters/rafago/unarmored/` para `idle`, `run`, `bite`, `hit` y `fall` después de esa transición. Una muerte inmediata tiene prioridad sobre perder armadura.

`fall` detiene el avance y permanece en su pose final. `spawn` restaura vida y protección. Los eventos visuales de caída y armadura tienen `gameplay: false`. Los tiempos admiten actualizaciones irregulares sin duplicar contactos ni perder el sobrante al cambiar de animación.

Para usar el rig en Canvas:

```js
import { loadZombie, ZombieAnimator } from './runtime/zombie-rig.mjs';
const { character, parts } = await loadZombie('rafago');
const actor = new ZombieAnimator(character, parts, {
  onEvent(event) {
    // El juego resuelve el objetivo y el daño de los contactos.
  },
});
const dx = actor.update(deltaSeconds); // Desplazamiento hacia la izquierda.
actor.draw(context);                 // Dibuja sobre coordenadas lógicas 320 × 320.
actor.applyDamage(25);               // Primero protección, después vida.
actor.setSpeedMultiplier(0.5);       // Ralentiza avance y paso por igual; 0 congela ambos.
```

`runtime/base-rig.mjs` es una copia incluida del núcleo común. El visor puede funcionar por separado sin cargar la colección anterior. Los tres zombis básicos conservan sus archivos originales.

## Revisar el resultado

Servir esta carpeta mediante HTTP y abrir `index.html`. No usar `file://`, porque el visor carga módulos JavaScript. Incluye pausa, velocidad, giro, avance, fondos y prueba de daño. Con movimiento reducido comienza pausado.

- `preview/conceptos.png`: comparación de diseños y tamaños.
- `preview/movimientos.webp` y `.gif`: demostración de 9,8 segundos con ambos personajes.
- `preview/poses.png`: poses, pérdida de protección y caída.
- `preview/visor-desktop.png` y `visor-mobile.png`: capturas verificadas.
- `manifest.json`: índice de todas las exportaciones.
- `validation.json`: alfa, bordes, movimiento y duración verificados durante la exportación.
- `browser-validation.json`: controles, eventos, estados y visor verificados en Microsoft Edge.
- `pack-validation.json`: integridad del ZIP y visor del paquete independiente.

Los assets están listos para integrar. Esta entrega no agrega los personajes a las oleadas del juego.

## Reproducir las exportaciones en el repositorio

Desde `landing-page`, con Node, Sharp, `@napi-rs/canvas`, Playwright y Python disponibles:

```powershell
node scripts/build-zombie-assets.mjs --rig-module public/zombis-vivos/especiales-v2/runtime/zombie-rig.mjs --assets-root public/zombis-vivos/especiales-v2
node scripts/render-special-zombie-review.mjs
node scripts/verify-special-zombies.mjs
python scripts/package-special-zombies.py
node scripts/verify-special-zombie-pack.mjs
python scripts/package-special-zombies.py
```

Los scripts aceptan `--canvas-module` o `--playwright-module` para localizar esos módulos en otro runtime; la prueba del ZIP también acepta `--python`. La prueba del visor espera el servidor en `http://127.0.0.1:8765/`, con `public` como raíz. La prueba del ZIP levanta y cierra su propio servidor, y deja la copia extraída en `asset-drafts/`. El segundo empaquetado incorpora ese informe. El ZIP se genera en `public/zombis-vivos/zombis-especiales-v2.zip`.

Cada fuente tiene 16 celdas. Los recortes conservan los píxeles y el alfa originales; las expresiones se alinean antes del rig. La separación de pantorrilla y zapato se hace mecánicamente para mantener la suela sobre el suelo. Los brazos, piernas, cabeza, casco y hombreras se articulan de forma independiente.

Ver [PROMPTS.md](./PROMPTS.md) para las instrucciones exactas de arte y las referencias usadas.
