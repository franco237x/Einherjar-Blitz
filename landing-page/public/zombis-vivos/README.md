# Zombis vivos · pack 1.0

Tres personajes originales para el juego de defensa del jardín. Arte caricaturesco generado con **ImageGen integrado** y animación de recortes articulados: cabeza, torso, casco, brazos con codos y piernas con rodillas. El diseño conserva el humor y las proporciones exageradas de la referencia del usuario.

## El elenco

| Personaje | Papel | Personalidad del movimiento | Vida | Protección |
| --- | --- | --- | --- | --- |
| Despistado | Zombi común | Delgado, paso arrastrado, manos flojas y cabeza con retraso | 100 | 0 |
| Conero | Zombi con cono | Bajo y compacto, pasos cortos y cono torcido | 100 | 100 |
| Balderón | Zombi con balde | Ancho y pesado, pisadas lentas y torso con inercia | 100 | 240 |

Los valores son una propuesta inicial de balance editable en `runtime/zombie-rig.mjs`. Cada mordida produce un evento de 10 de daño; el juego debe aplicarlo a la planta que corresponda.

## Animaciones

| Secuencia | Segundos | Cuadros | Repetición |
| --- | ---: | ---: | --- |
| Reposo · `idle` | 2.4 | 72 | Sí |
| Caminar · `walk` | 2.4 | 72 | Sí |
| Morder · `bite` | 1.2 | 36 | Sí |
| Recibir golpe · `hit` | 0.6 | 18 | Vuelve a caminar |
| Entrar · `spawn` | 1.0 | 30 | Vuelve a caminar |
| Caer · `fall` | 1.4 | 42 | Conserva la pose final |
| Perder protección · `armor-break` | 0.8 | 24 | Vuelve a caminar sin casco |

Despistado tiene seis secuencias; Conero y Balderón tienen siete. Total principal: **20 secuencias, 858 cuadros de atlas a 30 FPS**. Se añaden **10 variantes sin casco, 480 cuadros extra** para los dos personajes con protección. El visor articula las piezas a la frecuencia de la pantalla. Los bucles de reposo, caminar y morder cierran en la misma pose.

## Archivos

- `characters/<id>/parts/`: 15 PNG con transparencia, incluida una referencia de cuerpo completo.
- `characters/<id>/portrait.png`: personaje armado, 512 × 512, transparente.
- `characters/<id>/rig.json`: distribución de las piezas y parámetros del personaje.
- `characters/<id>/sprites/<clip>.png`: atlas RGBA, ocho columnas, cuadros de 256 × 256.
- `characters/<id>/sprites/<clip>.json`: coordenadas, duración por cuadro, pivote y eventos.
- `characters/<id>/animated/`: cada secuencia en WebP y GIF.
- `source/`: las tres ilustraciones seleccionadas con su alfa generado.
- `prompts/`: prompts exactos del arte y de la extracción transparente de Conero.
- `runtime/zombie-rig.mjs`: renderizador Canvas 2D y controlador de animación y daño.
- `preview/movimientos.gif` y `.webp`: los tres personajes recorriendo las acciones.
- `preview/poses.png`: revisión de poses clave.
- `validation.json` y `browser-validation.json`: verificaciones de exportación y del visor.

WebP conserva transparencia suave y puede comprimir varios cuadros idénticos en una sola pose de mayor duración. Los atlas conservan todos los cuadros. GIF funciona como vista rápida con tiempos cuantizados; para el juego usa los PNG o el rig.

Todos miran hacia la izquierda. Pivote de los atlas: `(0.5, 0.9)`. Coordenadas del rig: 320 × 320, suelo en `y=288`. Invierte el render horizontalmente para que miren a la derecha.

## Movimiento y combate

La caminata se exporta en el sitio. El juego desplaza al personaje; `ZombieAnimator.update(dt)` devuelve el avance horizontal negativo correspondiente. Con el ritmo por defecto, la planta del pie permanece fija durante el apoyo. `moveSpeed(character)` ofrece la velocidad recomendada en unidades del rig por segundo. Aplica la misma escala al dibujo y al desplazamiento. Al reproducir la caminata mediante atlas, usa `30 × gaitTempo × speedMultiplier` cuadros por segundo y multiplica la velocidad recomendada por `speedMultiplier`; así coinciden los pies y el avance.

La mordida se libera a **0.52 segundos** de cada ciclo, después de preparar el cuerpo y abrir la boca. La señal se emite una sola vez por ciclo, incluso cuando el intervalo entre actualizaciones es irregular. La planta objetivo, el alcance y la colisión pertenecen al juego.

`applyDamage(amount)` resta primero protección y después vida. Cuando se agota la protección, cae el casco. Cuando se agota la vida, el personaje cae, deja de atacar y permanece en el suelo. `play('spawn')` restaura vida y protección para una nueva aparición. `play('hit')` solo muestra la reacción; para infligir daño, usa `applyDamage`.

`setSpeedMultiplier(0.5)` reduce a la mitad la caminata y el avance. `setSpeedMultiplier(0)` detiene ambos. Este parámetro afecta la caminata; el juego decide cómo debe interrumpir una mordida o una caída por un efecto externo.

```js
import { loadZombie, ZombieAnimator } from './runtime/zombie-rig.mjs';

const { character, parts } = await loadZombie('conero');
const zombie = new ZombieAnimator(character, parts, {
  onEvent(event) {
    if (event.type === 'bite' && targetIsInRange()) {
      currentPlant.takeDamage(event.damage);
    }
  },
});
let x = 400;

function update(dt) {
  x += zombie.update(dt); // dt en segundos
}
function draw(ctx) {
  ctx.save();
  ctx.translate(x - 160, 0);
  zombie.draw(ctx);
  ctx.restore();
}
// zombie.play('bite');
// zombie.applyDamage(25);
```

El atlas incluye el evento de mordida en el cuadro 16, la salida del casco en el cuadro 5 y el impacto contra el suelo en el cuadro 30. Los últimos dos son señales visuales y no aplican daño. Para un reproductor de atlas, reproduce `fall` una vez y conserva su último cuadro. Reproduce `armor-break` una vez y continúa con el rig sin protección. Para un motor que solo admita sprites, cambia al terminar la rotura a `characters/<id>/unarmored/`: contiene reposo, caminar, morder, recibir golpe y caer sin casco. Los atlas principales de esas acciones muestran el casco completo. Entrar restaura la protección y usa siempre el atlas principal.

## Visor

En el proyecto está disponible en `/zombis-vivos/index.html`, junto al visor de plantas. Se pueden cambiar las acciones y el fondo, aplicar daño, invertir la orientación, mostrar el avance, pausar y variar la velocidad. Con preferencia de movimiento reducido comienza en pausa.

Al extraer el ZIP, sirve la carpeta con un servidor HTTP para cargar los módulos y PNG. Por ejemplo, desde esa carpeta:

```sh
python -m http.server 8765 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8765/index.html`. El enlace «Ver plantas» requiere la colección de plantas instalada en una carpeta hermana.

## Recrear los exports

Los scripts de `tooling/` requieren Node, `sharp`, `@napi-rs/canvas` y, para comprobar el visor, Playwright con Edge. Aceptan `--canvas-module` o `--playwright-module` para usar una instalación disponible. No necesitan volver a generar el arte.

```sh
node tooling/build-zombie-assets.mjs
node tooling/render-zombie-preview.mjs
node tooling/verify-zombie-assets.mjs
```

El verificador del navegador usa la URL del proyecto `/zombis-vivos/index.html`; adapta esa URL si extraes la carpeta como raíz del servidor.

Estos son assets, animaciones y una prueba de comportamiento reutilizable. La integración de oleadas, selección de objetivos, colisiones y balance final se realiza en el juego.
