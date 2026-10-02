# Plantas vivas — elenco original v6

Cilantro, Limón y Jengibrón son los tres conceptos nuevos. Aurélia y Velaria quedan archivadas: sus archivos se conservan y el visor las muestra en `index.html?archivo=1`.

| Planta | Silueta y personalidad | Acción |
| --- | --- | --- |
| Cilantro | Alto y ligero, hojas lobuladas y cachetes inflables | Ráfaga aromática que interrumpe mordiscos |
| Limón | Cítrico bajo, ancho y amarillo; mirada pícara de costado | Jugo que disuelve armaduras |
| Jengibrón | Raíz de jengibre asimétrica; puños de hojas plegadas | Jab frontal y cruzado trasero |

Arte original creado con **ImageGen integrado** y animado con rigs de piezas separadas. Cada acción incluye anticipación, expresión, salida o golpe y recuperación.

## Entregables

- `cilantro-limon-jengibron-assets-v6.zip`: las tres nuevas plantas, fuentes, 15 animaciones, piezas, prompts, visor portátil y zombis de práctica.
- `plantas-vivas-pack-v6.zip`: elenco completo con 11 plantas activas y dos conceptos archivados.
- `preview/lineup-cilantro-limon-jengibron.png`: siluetas transparentes.
- `preview/movimientos-cilantro-limon-jengibron.gif` y `.webp`: demostración animada.
- `preview/action-poses-cilantro-limon-jengibron.png`: las cinco acciones de cada planta.
- `preview/combo-jengibron.png`: anticipación, jab, carga del cruzado, cruzado y recuperación.
- `characters/<id>/sprites/<clip>.png` y `.json`: atlas con cuadros, duración y eventos.
- `characters/<id>/animated/<clip>.webp` y `.gif`: revisión animada individual.
- `characters/<id>/parts/`, `rig.json`, `portrait.png` y `manifest.json`: piezas y rig.
- `source/<id>-parts.png` y `prompts/<id>.txt`: fuente original y prompt exacto.
- `fresh-validation.json` y `browser-validation.json`: resultados de verificación.
- `README-v5.md`: guía anterior de las otras plantas y del archivo.

## Formato

Las tres plantas nuevas suman **15 clips y 648 cuadros**, cinco clips y 216 cuadros por planta. PNG RGBA transparente; **256 × 256**, **8 columnas**, **30 FPS**, mirando a la derecha. Pivote `(0.46875, 0.9)`; suelo aproximadamente en y = 230.

| Clip | Cuadros | Duración | Uso |
| --- | ---: | ---: | --- |
| idle | 72 | 2,4 s | Bucle y parpadeo |
| attack | 36 | 1,2 s | Una ejecución; vuelve a idle |
| hit | 24 | 0,8 s | Daño; vuelve a idle |
| spawn | 36 | 1,2 s | Brotar; vuelve a idle |
| celebrate | 48 | 1,6 s | Festejar; vuelve a idle |

El elenco activo completo tiene **57 clips y 2520 cuadros**. El archivo añade 13 clips y 588 cuadros. Las celdas vacías al final del atlas no pertenecen a la animación: usar el conteo del JSON. Los GIF/WebP repiten cada acción para revisarla; el juego debe respetar `loop` y `after`. WebP puede consolidar poses idénticas conservando los tiempos; los atlas PNG incluyen todos los cuadros declarados.

## Eventos y mecánicas propuestas

Estos valores son una propuesta de balance editable. Se implementan en el visor de assets; no modifican el combate del juego principal.

| Planta | Instante de emisión | Efecto |
| --- | --- | --- |
| Cilantro | 0,50 s; cuadro 15 | `aroma`: interrumpe el mordisco 1,1 s; daño 0; conserva movimiento |
| Limón | 0,50 s; cuadro 15 | `acid`: 16 de daño normal + 44 de corrosión exclusiva de armadura |
| Jengibrón | 0,40 y 0,80 s; cuadros 12 y 24 | `punch`: 22 y 34 de daño; rango 152 desde la base |

Posiciones, velocidades y rango del runtime usan el lienzo lógico **320 × 320**. Convertirlos a las unidades del juego junto con el origen del personaje; para escala 256/320 multiplicar distancias y velocidades por 0,8. El runtime no mueve entidades del juego.

**Cilantro:** el proyectil sale una vez; el aroma se aplica al colisionar. `applyAroma` cancela el mordisco actual y `updateAroma` indica cuándo puede volver a morder. Durante el bloqueo el enemigo puede caminar. Conserva vida, armadura, velocidad y frío.

**Limón:** `applyAcid` elimina hasta 44 de armadura y después aplica 16 de daño normal mediante `ZombieAnimator.applyDamage`. La corrosión sobrante nunca pasa a la vida. Contra un zombi sin armadura causa 16 de daño. La rotura reproduce `armor-break`; la muerte tiene prioridad y reproduce `fall`.

**Jengibrón:** no usa proyectil. `animationEvents(character, 'attack')` devuelve dos eventos y `PlantAnimator` emite cada uno exactamente una vez. `applyPunch` comprueba vida, fila, dirección y distancia en el momento de **cada golpe**. Si el objetivo se aleja, el segundo falla. Recibir daño o cambiar de estado cancela los eventos pendientes. Los destellos del atlas muestran el movimiento; el juego añade un impacto sobre el enemigo únicamente cuando hay contacto.

## Visor y catálogo

Servir `public` por HTTP y abrir `/plantas-vivas/index.html`. Carga primero Cilantro. Incluye acciones, pausa, repetición, velocidad, espejo, transparencia y descargas. La preferencia de movimiento reducido inicia la vista en pausa.

La prueba de combate usa los rigs reales de **Conero y Despistado**. Permite comparar armadura y vida, alejar al objetivo y reiniciar. Su posición es fija durante la práctica; locomoción y selección de objetivos pertenecen al juego.

El repositorio usa `/zombis-vivos/` para esta prueba. Los ZIP v6 incluyen `practice/` con sus runtimes y piezas, y rutas adaptadas. El visor del ZIP se abre servido por HTTP sin instalar dependencias. Su catálogo se carga desde `manifest.json`, por lo que el ZIP de tres plantas muestra solamente esas tres.

Catálogo activo: Nabú, Cardón, Mordiseta, Zarzina, Solmiel, Granadín, Cortezón, Frígora, Cilantro, Limón y Jengibrón. Archivo: Aurélia y Velaria. Las fuentes y animaciones anteriores se conservan.

## Integración y regeneración

`runtime/plant-rig.mjs` expone `ACTIVE_CHARACTERS`, `ARCHIVED_CHARACTERS`, `loadPlant`, `PlantAnimator`, `renderPlant`, `animationEvents` y `clipsFor`. `CHARACTERS` contiene ambos catálogos; el manifiesto los separa en `characters` y `archivedCharacters`.

`runtime/fresh-mechanics.mjs` contiene adaptadores opcionales de aroma, ácido y cuerpo a cuerpo. El arte y los eventos se pueden integrar sin usar estos adaptadores ni el visor.

Los scripts de exportación están en `landing-page/scripts/` y dentro del ZIP en `tooling/`. Requieren Node, sharp y @napi-rs/canvas. La verificación de navegador usa Playwright y Edge.

## Verificación

Se comprobaron los 648 cuadros nuevos: alpha real, márgenes sin recortes, ocho columnas y duración exacta. Se probaron eventos únicos con pasos de tiempo irregulares, cancelación del segundo golpe, alcance por golpe, dirección, cambio de fila, corrosión sin desbordar a vida y prioridad de muerte.

En navegador: zombis reales, combate con y sin armadura, pausa, reinicio, objetivo lejano, combo interrumpido, descargas y anchuras 1280, 768, 390 y 320 px. El elenco anterior mantiene sus verificaciones de defensa pura, frío, soles, explosión y eco archivado.
