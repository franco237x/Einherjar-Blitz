# Instrucciones exactas de arte

Modo utilizado: **ImageGen integrado**, con referencia del personaje y ediciones puntuales. No se utilizó el fallback CLI.

Las referencias de identidad fueron los dibujos completos originales de Brutón y Ráfago en `especiales-v2/characters/*/parts/reference.png`. Las variantes sin protección usan también la cabeza original de Ráfago.

| Resultado | Prompt exacto | Fuente final |
| --- | --- | --- |
| Caminar de Brutón | [bruton-walk.txt](./prompts/bruton-walk.txt) | `source/bruton-walk.png` |
| Golpe de Brutón | [bruton-smash.txt](./prompts/bruton-smash.txt), después [corrección de separación](./prompts/bruton-smash-spacing.txt) | `source/bruton-smash.png` |
| Reposo, impacto y caída de Brutón | [bruton-states.txt](./prompts/bruton-states.txt) | `source/bruton-states.png` |
| Carrera de Ráfago | [rafago-run.txt](./prompts/rafago-run.txt) | `source/rafago-run.png` |
| Mordida de Ráfago | [rafago-bite.txt](./prompts/rafago-bite.txt) | `source/rafago-bite.png` |
| Reposo, impacto y caída de Ráfago | [rafago-states.txt](./prompts/rafago-states.txt) | `source/rafago-states.png` |
| Carrera sin protección | [rafago-run-unarmored.txt](./prompts/rafago-run-unarmored.txt) | `source/rafago-run-unarmored.png` |
| Mordida sin protección | [rafago-bite-unarmored.txt](./prompts/rafago-bite-unarmored.txt) | `source/rafago-bite-unarmored.png` |
| Estados sin protección | [rafago-states-unarmored.txt](./prompts/rafago-states-unarmored.txt) | `source/rafago-states-unarmored.png` |

Cada fuente final contiene doce dibujos completos. `bruton-smash-initial.png` conserva la entrada de la edición que separó los puños de las suelas de la fila anterior. Es una fuente intermedia, no una hoja para reproducir.

El casco y las hombreras que salen despedidos se reutilizan del [kit original de Ráfago](./prompts/rafago-armor-original.txt). `source/rafago-armor-kit.png` conserva ese resultado completo; `source/rafago-gear.png` y `source/rafago-pads.png` son sus recortes transparentes. El exportador lee estas copias locales y no necesita cargar la colección v2.

Los scripts registran los cuerpos sobre un suelo común, conservan su proporción y alfa, y componen atlas. La animación intercambia esos dibujos completos; no reemplaza el arte con figuras dibujadas por código.
