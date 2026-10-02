# Dirección de arte · v7

Herramienta: **ImageGen integrado**. La imagen de PvZ adjunta por el usuario se usó como referencia de dirección artística para las tres generaciones iniciales: variedad de anatomías, proporciones exageradas, caras asimétricas y lectura a tamaño pequeño. Se solicitaron personajes originales. Esa imagen no forma parte de los assets ni del ZIP.

Cada generación pidió un kit transparente de nueve piezas: concepto completo, tres expresiones coherentes y piezas para su anatomía, proyectil o arco e impacto. Se animó el material generado mediante un rig de recortes; las capas se transforman sin volver a generar el arte cuadro a cuadro.

| Resultado | Prompt exacto | Concepto |
| --- | --- | --- |
| `source/cilantro-parts.png` | [cilantro.txt](./prompts/cilantro.txt) | Un coro de tres hojas con tamaños, caras y voces distintos. |
| `source/limon-parts.png` | [limon.txt](./prompts/limon.txt) | Una cáscara plegada que funciona como acordeón. |
| `source/jengibron-parts.png` | [jengibron.txt](./prompts/jengibron.txt) | Una raíz grande que golpea con su propio cuerpo. |

El kit de Cilantro recibió dos ediciones puntuales con ImageGen, usando la generación anterior como entrada:

1. [cilantro-air-edit.txt](./prompts/cilantro-air-edit.txt): quitar el soplido incrustado en la expresión de ataque, para emitir el efecto por separado.
2. [cilantro-stem-edit.txt](./prompts/cilantro-stem-edit.txt): alargar el pecíolo de la voz aguda, para que su cara se distinga al ensamblar las tres hojas.

Los kits originales seleccionados permanecen guardados en `source/`. La extracción automática conserva los píxeles RGBA, separa los elementos por componentes de alfa y normaliza el tamaño de las variantes de expresión. El rig ajusta la superposición de tallos y raíz, comprime el fuelle y coordina los dos contactos de Rizomazo. Las láminas de revisión utilizan los personajes ensamblados y los atlas exportados.
