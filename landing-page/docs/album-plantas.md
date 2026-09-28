# Herbario de Yggdrasil — diseño del álbum de plantas

## Propósito

El álbum convierte cada semilla en un objetivo reconocible. La tirada descubre una especie, el cultivo completa su ficha y las copias ayudan a avanzar por un linaje. Las **15 especies de los tres linajes** ya participan en el huerto, las invocaciones, las fusiones y las recompensas. La [guía del grupo](../public/evento-agro/guia-del-grupo.txt) describe las reglas activas y el [manual de operación](evento-agro-operacion.md) explica el guardado y el canje.

El álbum es permanente. No caduca una página ni se pierde el progreso de una familia al empezar otra. El PDF de canje y las monedas cosechadas pertenecen al sistema de juego; los premios del álbum son semillas, marcos y elementos visuales, nunca moneda canjeable.

## Dirección visual

Un herbario nórdico abierto sobre madera oscura: lomo vertical, papel con tintas botánicas y la planta a gran escala como protagonista. El rasgo distintivo es una **lámina de espécimen** a la derecha, con anotaciones de crecimiento y una línea de ascendencia. El color indica el linaje; el texto y la forma siempre indican la rareza.

| Token | Color | Uso |
| --- | --- | --- |
| Pino nocturno | `#07110D` | Fondo, marco y navegación |
| Pergamino | `#E7D9B7` | Hoja del herbario |
| Tinta verde | `#24362B` | Texto sobre pergamino |
| Oro viejo | `#C6A665` | Contornos y progreso |
| Hielo | `#9ECED4` | Linaje de Escarcha |
| Cobre | `#D9986E` | Linaje de Brasas |

Tipografía: **Cinzel** para títulos y nombres de especie; **Barlow** para lectura y botones; números y claves botánicas en una monoespaciada del sistema. Al descubrir una especie, su silueta da paso a la ilustración. Las transiciones respetan `prefers-reduced-motion`.

```text
Escritorio
┌──────────────────────── cabecera / volver al huerto ───────────────────────┐
│ HERBARIO DE YGGDRASIL                 15 especies · 3 linajes            │
├───────────────┬──────────────────────────────┬───────────────────────────┤
│ Linajes       │ Cinco láminas por rareza     │ Ficha del espécimen       │
│ Alba          │ Común → Rara → Épica         │ Arte grande · historia    │
│ Escarcha      │ → Legendaria → Mítica        │ Cultivo · rasgo · fusión  │
│ Brasas        │                              │                           │
├───────────────┴──────────────────────────────┴───────────────────────────┤
│ Hitos del herbario: 3 / 6 / 9 / 12 / 15 plantas cultivadas               │
└───────────────────────────────────────────────────────────────────────────┘

Móvil: cabecera → selector de linaje → láminas en dos columnas → ficha → hitos.
```

## Catálogo completo

La rareza ordena cada linaje. El servidor aplica la producción de 1, 2, 5, 12 o 28 monedas por ciclo según rareza. Alba tiene ciclos de 60 segundos y reserva de 120 ciclos; Escarcha y Brasas, ciclos de 75 segundos con reservas de 480 y 120 ciclos. Brasas duplica el bono de riego. No hay límite diario de monedas configurado.

| Linaje | Rareza | Planta | Idea para el arte | Rasgo |
| --- | --- | --- | --- | --- |
| Ciclo del Alba | Común | Brote de Bruma | Tallo tierno, rocío y niebla verde | Producción regular |
| Ciclo del Alba | Rara | Espiga Ámbar | Cereal dorado con granos de luz | Producción regular |
| Ciclo del Alba | Épica | Lirio Astral | Pétalos azules y polen estelar | Producción regular |
| Ciclo del Alba | Legendaria | Orquídea del Eclipse | Pétalos oscuros y halo crepuscular | Producción regular |
| Ciclo del Alba | Mítica | Árbol del Alba | Copa luminosa, raíces y sol naciente | Producción regular |
| Valle de Escarcha | Común | Musgo de Rocío | Cojín de musgo con cristales pequeños | Reserva más cosechas sin recoger |
| Valle de Escarcha | Rara | Centeno Boreal | Espigas plateadas cubiertas de escarcha | Reserva más cosechas sin recoger |
| Valle de Escarcha | Épica | Campánula de Hielo | Campanas de vidrio azulado y estambres blancos | Reserva más cosechas sin recoger |
| Valle de Escarcha | Legendaria | Loto de Niflheim | Loto translúcido sobre agua helada | Reserva más cosechas sin recoger |
| Valle de Escarcha | Mítica | Sauce de Aurora | Sauce con hojas de aurora y raíces de hielo | Reserva más cosechas sin recoger |
| Huerta de Brasas | Común | Semilla de Ceniza | Brote negro con corazón naranja | Bono moderado al regar |
| Huerta de Brasas | Rara | Pimiento de Brasa | Vainas rojas encendidas y hojas cobrizas | Bono moderado al regar |
| Huerta de Brasas | Épica | Dalia Volcánica | Pétalos de obsidiana con vetas cálidas | Bono moderado al regar |
| Huerta de Brasas | Legendaria | Vid de Fénix | Racimos luminosos, zarcillos y plumas de fuego | Bono moderado al regar |
| Huerta de Brasas | Mítica | Roble de Muspel | Tronco de cobre, brasas entre las hojas | Bono moderado al regar |

Las ilustraciones actuales del Alba se conservan. Las diez nuevas ya se generaron como PNG transparentes, con una planta aislada, raíces y forma legible en una tarjeta pequeña. Los [prompts de arte](album-plantas-prompts.md) quedan guardados para futuras variantes. Una planta común debe parecer valiosa; la rareza aumenta detalle y aura, no solo saturación.

## Estados de cada ficha

1. **Por descubrir.** Silueta, familia, rareza y pista concreta de adquisición. Se puede ver la probabilidad de la rareza antes de tirar.
2. **Semilla encontrada.** Se revela nombre, ilustración y origen. La ficha todavía invita a plantarla.
3. **Cultivada.** Al madurar con tres riegos se completa la ficha, se desbloquea su relato y cuenta para los hitos del álbum.
4. **Dominada.** Tras tres cosechas de esa especie, se añade un sello a la lámina. Es una meta de dedicación visual, sin multiplicador de moneda.

La ficha muestra las semillas disponibles, el progreso de cosechas para la maestría, la producción y la combinación para alcanzar el siguiente nivel. Los riegos de cada ejemplar se muestran en el huerto. No se exige mantener la planta en una parcela para conservar su descubrimiento.

## Bucle de colección y duplicados

```text
Elegir linaje → conseguir semilla → descubrir ficha → plantar y regar
       ↑                                                    ↓
Recompensa de hito ← cultivar nueva especie ← fusionar dos maduras iguales
```

- La invocación permite **elegir un linaje** antes de tirar. La distribución de rareza se publica; dentro de cada linaje hay una especie por rareza. Así el jugador puede perseguir una familia concreta.
- La fusión toma **dos plantas maduras de la misma especie** y entrega la siguiente del mismo linaje. Muestra el resultado antes de confirmar y nunca selecciona una planta de otra familia automáticamente.
- Las semillas repetidas sirven para plantar o fusionar. Dos míticas maduras idénticas permiten obtener un **sello de linaje** decorativo y conservar una planta mítica madura. Se puede recoger un sello por linaje.
- Los contadores de garantía de las tiradas deben ser visibles, persistentes y ajustados junto con la economía. El álbum debe ofrecer tanto suerte como un camino determinista por fusión; ningún hito depende exclusivamente de una tirada mítica.
- La selección de linaje y los hitos no modifican el saldo canjeable. La moneda del PDF requiere un registro verificable en servidor antes de atribuir valor real a estas progresiones.

### Invocación activa

La persona elige **Alba, Escarcha o Brasas** antes de abrir un sobre. La rareza se determina con las probabilidades actuales del prototipo y el linaje seleccionado decide cuál de sus cinco plantas corresponde al resultado.

| Rareza | Probabilidad base | Garantía, como máximo |
| --- | ---: | ---: |
| Común | 56 % | — |
| Rara o superior | 29 % para Rara | 10 tiradas |
| Épica o superior | 11 % para Épica | 30 tiradas |
| Legendaria o superior | 3,5 % para Legendaria | 45 tiradas |
| Mítica | 0,5 % | 120 tiradas |

Los contadores son **globales entre linajes, visibles y permanentes**. Obtener una rareza reinicia su garantía y las inferiores. Una tirada adicional cuesta 1 polen; diez cuestan 10 polen. Hay una tirada gratis cada minuto, 5 polen de regalo diario y hasta 1 polen por parcela cada minuto al recoger una cosecha. Las monedas cosechadas se reservan para el canje.

## Hitos activos

Se cuentan **especies distintas cultivadas**, no semillas obtenidas ni copias. Cada hito se cobra una sola vez.

| Especies | Premio de colección |
| ---: | --- |
| 3 | Marco de bronce para las fichas |
| 6 | Tres polen para invocar en cualquier linaje |
| 9 | Fondos botánicos de Alba, Escarcha y Brasas |
| 12 | Una semilla épica a elección de cualquier linaje |
| 15 | Portada especial del herbario y título «Guardián de Yggdrasil» |

El polen y la semilla del álbum no acreditan directamente monedas. Las plantas obtenidas sí producen cuando se cultivan. La administración define qué usos tienen las monedas dentro del grupo.

## Relación con el juego actual

El álbum navegable en `/evento/agro/album` está conectado a la partida. Las ilustraciones desconocidas aparecen como siluetas; una opción permite ver todo el arte sin desbloquear el progreso. La siembra, los riegos, la maestría y los premios se guardan en el servidor.

La versión 2 utiliza identificadores estables de especie y registra descubrimientos, cultivo, cosechas y premios. El prototipo v1 se conserva en el navegador como respaldo y no se importa a los saldos verificados, porque su inventario y saldo eran editables desde el cliente. La partida nueva empieza con una común de cada linaje y 5 polen. Para producción todavía deben configurarse la base privada y las credenciales descritas en el manual de operación.
