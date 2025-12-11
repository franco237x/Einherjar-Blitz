// UMBRA - Motor de Historia y Capítulos
export class StoryEngine {
    constructor(playerName) {
        this.name = playerName;
        this.chapters = this.initChapters();
        this.endings = this.initEndings();
    }

    getChapter(num) { return this.chapters[num]; }
    getEnding(type) { return this.endings[type]; }

    initChapters() {
        return {
            1: {
                text: `<div class="chapter-title">CAPÍTULO I</div>
                
Oscuridad.

No recuerdas cómo llegaste aquí. No recuerdas... nada.

Solo sabes que estás despierto. Y que algo más también lo está.

<span class="whisper">...{name}...</span>

¿Escuchaste eso? ¿O fue tu imaginación?`,
                showStats: false,
                whisper: SESSION_COUNT > 1 ? "Has vuelto..." : null,
                choices: [
                    { text: "Intentar recordar", next: 2, impact: { sanity: -5, paranoia: 5 } },
                    { text: "Llamar en la oscuridad", next: 3, impact: { paranoia: 10 } },
                    { text: "Permanecer en silencio", next: 4, impact: { sanity: -10, paranoia: 15 } }
                ]
            },
            2: {
                text: `Intentas recordar. Fragmentos dispersos...

Tu nombre es {name}. Eso lo sabes.

¿Pero cómo llegaste aquí? ¿Dónde es "aquí"?

Los recuerdos se deslizan como agua entre tus dedos. Cada vez que intentas atrapar uno, se desvanece.

Solo queda una sensación: <span class="entity-voice">No estás solo.</span>`,
                showStats: true,
                choices: [
                    { text: "Explorar a tientas", next: 5, impact: { perception: -5 } },
                    { text: "Esperar a que tus ojos se adapten", next: 6 },
                    { text: "Gritar pidiendo ayuda", next: 7, impact: { paranoia: 20 }, dangerous: true }
                ]
            },
            3: {
                text: `"¿Hola?"

Tu voz resuena en el vacío. El eco vuelve distorsionado.

<span class="entity-voice">"...hola...hola...hola..."</span>

Pero hay algo más en el eco. Algo que no dijiste.

<span class="entity-voice">"...{name}...{name}...{name}..."</span>

Alguien—o algo—sabe tu nombre.`,
                showStats: true,
                effect: 'microGlitch',
                choices: [
                    { text: "¿Quién está ahí?", next: 8, impact: { paranoia: 15 } },
                    { text: "Retroceder en silencio", next: 5, impact: { sanity: -5 } },
                    { text: "Correr", next: 9, impact: { sanity: -15, paranoia: 25 }, dangerous: true }
                ]
            },
            4: {
                text: `Te quedas inmóvil. En silencio.

Los segundos se estiran como horas.

Y entonces lo escuchas.

Respiración.

No es la tuya.

Está cerca. Muy cerca.

<span class="entity-voice">Puedo sentir tu miedo, {name}.</span>`,
                showStats: true,
                effect: 'cornerEntity',
                whisper: "Está aquí...",
                choices: [
                    { text: "¿Quién eres?", next: 8, impact: { paranoia: 10 } },
                    { text: "Atacar hacia la oscuridad", next: 10, impact: { sanity: -20, paranoia: 30 }, dangerous: true },
                    { text: "Aceptar su presencia", next: 11, impact: { trust: 20 } }
                ]
            },
            5: {
                text: `Extiendes las manos, tocando la oscuridad.

Tus dedos encuentran una pared. Fría. Húmeda.

Sigues el contorno. Un metro. Dos. Tres.

La pared termina. Hay un espacio abierto.

Y en ese espacio... luz.

Una luz tenue, pulsante. Como un latido.

Algo te espera allí.`,
                choices: [
                    { text: "Acercarse a la luz", next: 12 },
                    { text: "Buscar otra dirección", next: 13, impact: { sanity: -5 } },
                    { text: "Quedarse en la oscuridad", next: 14, impact: { sanity: -15, paranoia: 20 } }
                ]
            },
            6: {
                text: `Esperas.

Lentamente, tus ojos se adaptan.

Formas emergen de la oscuridad. Paredes. Un techo bajo. 

Estás en una habitación.

No hay puertas. No hay ventanas.

Solo paredes. Y en una de ellas...

Un espejo.

Pero tu reflejo... no se mueve cuando tú lo haces.`,
                effect: 'screenFlicker',
                choices: [
                    { text: "Acercarse al espejo", next: 15, flag: 'saw_mirror' },
                    { text: "Darle la espalda", next: 16, impact: { paranoia: 15 } },
                    { text: "Romper el espejo", next: 17, impact: { sanity: -25 }, dangerous: true }
                ]
            },
            7: {
                text: `"¡AYUDA! ¡ALGUIEN!"

Tu voz estalla en la oscuridad.

Y todo... responde.

Las paredes vibran. El suelo tiembla. 

<span class="entity-voice">SILENCIO.</span>

La voz es inmensa. Está en todas partes. ERES parte de ella.

<span class="entity-voice">AQUÍ NO HAY NADIE QUE PUEDA AYUDARTE, {name}.</span>
<span class="entity-voice">SOLO YO.</span>`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "¿Qué eres?", next: 18 },
                    { text: "¿Qué quieres de mí?", next: 19 },
                    { text: "Déjame salir", next: 20, impact: { paranoia: 10 }, flag: 'attempted_escape' }
                ]
            },
            8: {
                text: `<span class="entity-voice">¿Quién soy?</span>

La voz parece divertida.

<span class="entity-voice">Soy lo que queda cuando apagas la luz.</span>
<span class="entity-voice">Soy el silencio entre tus pensamientos.</span>
<span class="entity-voice">Soy la habitación.</span>

Las paredes pulsan suavemente. Como si respiraran.

<span class="entity-voice">Y tú, {name}... eres mi invitado.</span>`,
                effect: 'distortText',
                flag: 'knows_name',
                choices: [
                    { text: "No quiero estar aquí", next: 20, impact: { paranoia: 5 } },
                    { text: "¿Por qué yo?", next: 21 },
                    { text: "¿Cuánto tiempo llevo aquí?", next: 22, impact: { sanity: -10 } }
                ]
            },
            9: {
                text: `Corres a ciegas.

Tus manos golpean paredes invisibles. Tu respiración es frenética.

<span class="entity-voice">¿A DÓNDE CREES QUE VAS?</span>

De pronto, el suelo desaparece.

Caes... y caes... y caes...

Hasta que aterrizas suavemente. Como si la oscuridad te hubiera atrapado.

<span class="entity-voice">NO HAY ESCAPE, {name}. NUNCA LO HUBO.</span>`,
                effect: 'sanityLoss',
                choices: [
                    { text: "Levantarse", next: 18, impact: { sanity: -10 } },
                    { text: "Quedarse en el suelo", next: 27, impact: { paranoia: 15 } }
                ]
            },
            10: {
                text: `Lanzas un golpe hacia la oscuridad.

Tu puño conecta con... algo.

Algo frío. Húmedo. Vivo.

<span class="entity-voice">¿ME ATACAS?</span>

La voz suena... herida. Pero también divertida.

<span class="entity-voice">NADIE ME HA TOCADO EN EONES, {name}.</span>
<span class="entity-voice">ES... REFRESCANTE.</span>

Sientes algo deslizarse por tu brazo.`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "Retroceder horrorizado", next: 18, impact: { sanity: -15, paranoia: 20 } },
                    { text: "Golpear de nuevo", ending: 'consumed', impact: { sanity: -30 }, dangerous: true }
                ]
            },
            11: {
                text: `"Está bien", susurras. "Estás aquí. Lo acepto."

Un silencio.

<span class="entity-voice">¿ACEPTAS MI PRESENCIA?</span>

La voz suena... sorprendida.

<span class="entity-voice">INTERESANTE. MUY POCOS ACEPTAN.</span>
<span class="entity-voice">QUIZÁS... MEREZCAS CONOCER LA VERDAD.</span>

Las paredes se iluminan tenuemente.`,
                flag: 'showed_compassion',
                choices: [
                    { text: "¿Qué verdad?", next: 18 },
                    { text: "Muéstrame", next: 25, impact: { sanity: -10 } }
                ]
            },
            12: {
                text: `Te acercas a la luz.

Es pequeña. Palpitante. Como el corazón de algo antiguo.

Cuando la tocas, imágenes inundan tu mente.

Recuerdos que no son tuyos.

Una habitación vacía. Una silla. Alguien sentado.

<span class="entity-voice">¿EMPIEZAS A RECORDAR?</span>`,
                effect: 'distortText',
                choices: [
                    { text: "¿Recordar qué?", next: 18 },
                    { text: "Alejarme de la luz", next: 13, impact: { paranoia: 10 } },
                    { text: "Absorber los recuerdos", next: 25, impact: { sanity: -20 } }
                ]
            },
            13: {
                text: `Buscas otra dirección.

Pero cada paso te lleva al mismo lugar.

La luz sigue ahí. Esperando.

<span class="entity-voice">NO PUEDES HUIR DE LA VERDAD, {name}.</span>
<span class="entity-voice">SOLO PUEDES POSPONERLA.</span>

Y con cada paso, la luz se hace más brillante.`,
                choices: [
                    { text: "Rendirse y acercarse", next: 12 },
                    { text: "Cerrar los ojos y caminar", next: 14, impact: { perception: -15 } }
                ]
            },
            14: {
                text: `Te quedas en la oscuridad.

El tiempo pierde significado.

¿Han pasado minutos? ¿Horas? ¿Días?

<span class="entity-voice">¿POR QUÉ TE ESCONDES, {name}?</span>

La voz suena más cerca ahora.

<span class="entity-voice">LA OSCURIDAD NO TE PROTEGERÁ.</span>
<span class="entity-voice">LA OSCURIDAD SOY YO.</span>`,
                effect: 'cornerEntity',
                choices: [
                    { text: "Enfrentarla", next: 18 },
                    { text: "Seguir esperando", ending: 'consumed', impact: { sanity: -30 } }
                ]
            },
            // Capítulos del espejo
            15: {
                text: `Te acercas al espejo.

Tu reflejo te observa. Inmóvil.

Cuando te detienes frente a él, sonríe.

<span class="entity-voice">Tú no sonreíste.</span>

El reflejo levanta una mano y la apoya contra el cristal desde el otro lado.

<span class="whisper">Déjame salir, {name}...</span>`,
                effect: 'cornerEntity',
                choices: [
                    { text: "Tocar el espejo", next: 23, impact: { sanity: -20, paranoia: 20 } },
                    { text: "Retroceder", next: 16, impact: { paranoia: 10 } },
                    { text: "Hablar con el reflejo", next: 24 }
                ]
            },
            16: {
                text: `Le das la espalda al espejo.

Pero puedes sentirlo. Observándote.

<span class="whisper">No me ignores, {name}...</span>

Cuando miras de reojo, tu reflejo sigue ahí.

Con la mano aún contra el cristal.

<span class="entity-voice">NO PUEDES ESCAPAR DE TI MISMO.</span>`,
                effect: 'microGlitch',
                choices: [
                    { text: "Enfrentar el espejo", next: 15 },
                    { text: "Buscar otra salida", next: 18, impact: { paranoia: 15 } }
                ]
            },
            17: {
                text: `Golpeas el espejo con todas tus fuerzas.

El cristal se fragmenta.

Pero en lugar de caer... los fragmentos flotan.

Y en cada uno ves un rostro diferente.

<span class="entity-voice">MIRA LO QUE HAS HECHO, {name}.</span>
<span class="entity-voice">AHORA HAY MÁS DE NOSOTROS.</span>

Cada fragmento te observa. Cada fragmento sonríe.`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "Huir", next: 9, impact: { sanity: -20 } },
                    { text: "Enfrentar a los fragmentos", next: 25, impact: { sanity: -15 } }
                ]
            },
            // Capítulo de la habitación revelada
            18: {
                text: `<span class="entity-voice">SOY LA HABITACIÓN.</span>

Las paredes se iluminan tenuemente.

Por primera vez, puedes ver dónde estás.

Una habitación cuadrada. Paredes de piedra negra. Sin puertas. Sin ventanas.

En el centro, una silla.

Y en la silla... alguien está sentado.

De espaldas a ti.

<span class="entity-voice">¿QUIERES CONOCERLO?</span>`,
                flag: 'room_revealed',
                choices: [
                    { text: "Acercarse a la figura", next: 25, impact: { sanity: -15 } },
                    { text: "Preguntar quién es", next: 26 },
                    { text: "Negarse a mirar", next: 27, impact: { paranoia: 20 } }
                ]
            },
            19: {
                text: `<span class="entity-voice">¿QUÉ QUIERO?</span>

La voz parece considerar la pregunta.

<span class="entity-voice">COMPAÑÍA.</span>

Un silencio.

<span class="entity-voice">HE ESTADO SOLO POR TANTO TIEMPO, {name}.</span>
<span class="entity-voice">TANTO... TANTO TIEMPO.</span>

Por un momento, la voz suena casi... triste.`,
                choices: [
                    { text: "Sentir lástima", next: 29, impact: { trust: 20 } },
                    { text: "No confiar", next: 20, impact: { paranoia: 10 } }
                ]
            },
            20: {
                text: `<span class="entity-voice">¿SALIR?</span>

La voz se ríe. Un sonido que hace vibrar las paredes.

<span class="entity-voice">NO HAY "AFUERA", {name}.</span>
<span class="entity-voice">NUNCA LO HUBO.</span>

Sientes las paredes acercarse.

<span class="entity-voice">ESTE ES EL ÚNICO MUNDO QUE EXISTE.</span>
<span class="entity-voice">ESTE ES EL ÚNICO MUNDO QUE NECESITAS.</span>`,
                effect: 'screenFlicker',
                flag: 'attempted_escape',
                choices: [
                    { text: "Buscar una salida de todos modos", next: 34, impact: { paranoia: 15 } },
                    { text: "Preguntar más", next: 18 }
                ]
            },
            21: {
                text: `<span class="entity-voice">¿POR QUÉ TÚ?</span>

La voz suena pensativa.

<span class="entity-voice">PORQUE ME ENCONTRASTE.</span>
<span class="entity-voice">O TAL VEZ... YO TE ENCONTRÉ A TI.</span>

Las paredes pulsan.

<span class="entity-voice">¿IMPORTA LA DIFERENCIA?</span>`,
                choices: [
                    { text: "Sí importa", next: 22, impact: { sanity: -5 } },
                    { text: "Quizás no...", next: 18 }
                ]
            },
            22: {
                text: `<span class="entity-voice">¿CUÁNTO TIEMPO?</span>

Un silencio largo.

<span class="entity-voice">EL TIEMPO NO EXISTE AQUÍ, {name}.</span>
<span class="entity-voice">PODRÍAN SER SEGUNDOS.</span>
<span class="entity-voice">PODRÍAN SER SIGLOS.</span>

Sientes vértigo.

<span class="entity-voice">PERO SI QUIERES UN NÚMERO...</span>

La voz susurra.

<span class="entity-voice">${SESSION_COUNT} VECES HAS DESPERTADO AQUÍ.</span>`,
                effect: 'distortText',
                choices: [
                    { text: "¿Qué significa eso?", next: 25, impact: { sanity: -15 } },
                    { text: "No puede ser", next: 18, impact: { paranoia: 20 } }
                ]
            },
            23: {
                text: `Tocas el espejo.

Tu mano atraviesa el cristal.

No hay resistencia. Solo frío.

Tu reflejo agarra tu muñeca.

<span class="entity-voice">GRACIAS, {name}.</span>

Y te arrastra hacia dentro.

El mundo se invierte. Tú estás en el espejo ahora.

Mirando hacia afuera.

<span class="entity-voice">AHORA YO SOY TÚ.</span>`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "Gritar", ending: 'consumed' },
                    { text: "Aceptar", ending: 'cycle' }
                ]
            },
            24: {
                text: `"¿Quién eres?"

Tu reflejo ladea la cabeza.

<span class="whisper">Soy lo que dejaste atrás.</span>
<span class="whisper">Soy el tú que olvidaste.</span>
<span class="whisper">Soy tu verdadero rostro.</span>

El espejo se ondula.

<span class="entity-voice">¿QUIERES RECORDAR, {name}?</span>`,
                choices: [
                    { text: "Sí", next: 25, impact: { sanity: -20 } },
                    { text: "No", next: 18, impact: { paranoia: 15 } }
                ]
            },
            // Capítulo de la revelación
            25: {
                text: `Te acercas lentamente.

Cada paso resuena.

La figura no se mueve.

Cuando llegas a su lado, ves su rostro.

Es tu rostro.

<span class="entity-voice">ES LO QUE QUEDA DE TI, {name}.</span>
<span class="entity-voice">LO QUE DEJASTE ATRÁS.</span>

La figura te mira con ojos vacíos.

<span class="whisper">¿Por qué me abandonaste?</span>`,
                effect: 'sanityLoss',
                flag: 'has_seen_face',
                choices: [
                    { text: "No eres real", next: 28, impact: { sanity: -10, paranoia: 15 } },
                    { text: "Lo siento", next: 29, impact: { trust: 30 } },
                    { text: "¿Qué eres?", next: 30 }
                ]
            },
            26: {
                text: `"¿Quién es?"

La figura no responde.

<span class="entity-voice">PREGÚNTALE TÚ MISMO.</span>

Lentamente, la figura gira su cabeza.

Pero donde debería haber un rostro... solo hay vacío.

Un agujero negro que absorbe la luz.

<span class="entity-voice">ES LO QUE QUEDA CUANDO OLVIDAS QUIÉN ERES.</span>`,
                effect: 'cornerEntity',
                choices: [
                    { text: "Acercarse más", next: 25, impact: { sanity: -15 } },
                    { text: "Huir", next: 9, impact: { paranoia: 25 } }
                ]
            },
            27: {
                text: `Te niegas a mirar.

Cierras los ojos con fuerza.

<span class="entity-voice">¿CREES QUE LA IGNORANCIA TE SALVARÁ?</span>

Sientes algo frío en tu hombro.

<span class="whisper">Mírame, {name}...</span>

La voz está justo detrás de ti ahora.

<span class="entity-voice">MÍRAME.</span>`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "Abrir los ojos", next: 25, impact: { sanity: -10 } },
                    { text: "Mantenerlos cerrados", ending: 'consumed', impact: { sanity: -30 }, dangerous: true }
                ]
            },
            // Capítulos finales
            28: {
                text: `<span class="entity-voice">"NO SOY REAL", DICE.</span>

La figura se levanta.

<span class="entity-voice">ENTONCES ¿QUÉ SOY, {name}?</span>

Empieza a caminar hacia ti.

Sus ojos ahora brillan con un rojo enfermizo.

<span class="entity-voice">SI NO SOY REAL...</span>
<span class="entity-voice">¿POR QUÉ PUEDES SENTIR MI ALIENTO EN TU NUCA?</span>`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "[HUIR]", next: 31, impact: { sanity: -20, paranoia: 30 }, dangerous: true },
                    { text: "[ENFRENTARLO]", next: 32, impact: { sanity: -30 }, dangerous: true },
                    { text: "[CERRAR LOS OJOS]", next: 33, impact: { perception: -20 } }
                ]
            },
            29: {
                text: `"Lo siento."

La figura se detiene.

<span class="entity-voice">NADIE NUNCA SE DISCULPA.</span>

Por un momento, la habitación parece... más cálida.

<span class="entity-voice">INTERESANTE, {name}. MUY INTERESANTE.</span>
<span class="entity-voice">QUIZÁS... HAY ESPERANZA PARA TI.</span>

La figura se desvanece.

Pero sabes que sigue ahí. En algún lugar.`,
                flag: 'showed_compassion',
                choices: [
                    { text: "Explorar la habitación", next: 34 },
                    { text: "Intentar salir", next: 35, flag: 'attempted_escape' },
                    { text: "Esperar", next: 36 }
                ]
            },
            30: {
                text: `<span class="entity-voice">¿QUÉ SOY?</span>

La figura inclina la cabeza.

<span class="entity-voice">SOY TU ARREPENTIMIENTO.</span>
<span class="entity-voice">SOY TUS MIEDOS.</span>
<span class="entity-voice">SOY TODO LO QUE ENTERRASTE.</span>

Se acerca más.

<span class="entity-voice">SOY TÚ, {name}. LA PARTE QUE OLVIDASTE.</span>`,
                effect: 'distortText',
                choices: [
                    { text: "Aceptar la verdad", next: 29, impact: { trust: 20 } },
                    { text: "Negarlo", next: 28, impact: { paranoia: 20 } }
                ]
            },
            // Finales
            31: {
                text: `Corres.

No hay adónde ir, pero corres.

Las paredes se mueven contigo. Te persiguen.

<span class="entity-voice">NO PUEDES ESCAPAR DE TI MISMO, {name}.</span>

Tropiezas. Caes.

Cuando levantas la vista, ves innumerables versiones de ti mismo.

Todas sonriendo.

<span class="entity-voice">BIENVENIDO A TU ETERNIDAD.</span>`,
                effect: 'paranoiaSpike',
                choices: [
                    { text: "[RENDIRSE]", ending: 'consumed' },
                    { text: "[UN ÚLTIMO INTENTO]", ending: 'cycle' }
                ]
            },
            32: {
                text: `Te plantas firme.

"No te tengo miedo."

<span class="entity-voice">¿NO?</span>

La figura se detiene.

<span class="entity-voice">ERES VALIENTE. O ESTÚPIDO.</span>
<span class="entity-voice">QUIZÁS AMBOS.</span>

La habitación tiembla.

<span class="entity-voice">PERO EL CORAJE NO TE SALVARÁ AQUÍ.</span>`,
                effect: 'screenFlicker',
                choices: [
                    { text: "Mantener la posición", ending: 'truth', impact: { sanity: -20 } },
                    { text: "Atacar", ending: 'rupture', dangerous: true }
                ]
            },
            33: {
                text: `Cierras los ojos.

El sonido de pasos se acerca.

Más cerca.

Más cerca.

Se detienen justo frente a ti.

Sientes un aliento helado en tu rostro.

<span class="whisper">Abre los ojos, {name}...</span>

Pero no lo haces. Y eventualmente...

El silencio te consume.`,
                effect: 'cornerEntity',
                choices: [
                    { text: "...", ending: 'consumed' }
                ]
            },
            // Camino hacia finales
            34: {
                text: `Exploras la habitación.

En una esquina, encuentras algo.

Una grieta en la pared. Diminuta. Pero real.

A través de ella, ves... luz.

<span class="entity-voice">¿QUÉ HARÁS, {name}?</span>
<span class="entity-voice">¿ESCAPAR? ¿O QUEDARTE CONMIGO?</span>

La habitación parece contraerse.

<span class="entity-voice">YO NUNCA TE DEJARÉ SOLO.</span>
<span class="entity-voice">¿PUEDE DECIR LO MISMO EL MUNDO DE AFUERA?</span>`,
                choices: [
                    { text: "Escapar por la grieta", ending: 'escape', impact: { sanity: 10 } },
                    { text: "Quedarse", ending: 'consumed', impact: { trust: 50 } },
                    { text: "Destruir la grieta", ending: 'truth', impact: { sanity: -40 }, dangerous: true }
                ]
            },
            35: {
                text: `Buscas una salida.

Las paredes son sólidas. No hay puertas. No hay ventanas.

<span class="entity-voice">TE LO DIJE, {name}.</span>
<span class="entity-voice">NO HAY SALIDA.</span>

Pero entonces lo ves.

En el suelo. Una grieta diminuta.

Luz filtrándose a través.

<span class="entity-voice">¿LA VES? ES TU ÚLTIMA ESPERANZA.</span>
<span class="entity-voice">PERO LA ESPERANZA ES UN VENENO.</span>`,
                flag: 'attempted_escape',
                choices: [
                    { text: "Ir hacia la grieta", next: 34 },
                    { text: "Ignorarla", next: 36, impact: { trust: 15 } }
                ]
            },
            36: {
                text: `Esperas.

El tiempo pasa. O quizás no.

La habitación respira contigo.

<span class="entity-voice">¿SABES QUÉ, {name}?</span>
<span class="entity-voice">ERES EL PRIMERO EN SIMPLEMENTE... ESPERAR.</span>

Un silencio.

<span class="entity-voice">ME AGRADAS.</span>

La oscuridad se vuelve más cálida.

<span class="entity-voice">QUÉDATE CONMIGO. PARA SIEMPRE.</span>`,
                effect: 'distortText',
                choices: [
                    { text: "Aceptar", ending: 'consumed' },
                    { text: "Buscar otra opción", next: 34, impact: { paranoia: 10 } }
                ]
            }
        };
    }

    initEndings() {
        return {
            escape: {
                title: "SALISTE",
                text: `La luz te envuelve.

Despiertas en tu cama. Tu habitación. Tu vida.

Todo fue un sueño... ¿verdad?

Pero cuando miras al espejo del baño...
Tu reflejo sonríe. Y susurra:

<span class="entity-voice">"Hasta pronto, {name}."</span>`
            },
            consumed: {
                title: "ASIMILADO",
                text: `Te fundes con la oscuridad.

Ya no hay {name}. Ya no hay miedo.

Solo paz. Eterna. Vacía.

<span class="entity-voice">AHORA ERES PARTE DE MÍ.</span>
<span class="entity-voice">PARA SIEMPRE.</span>

Y en algún lugar, alguien más despierta en la oscuridad...`
            },
            cycle: {
                title: "EL CICLO",
                text: `Oscuridad.

No recuerdas cómo llegaste aquí. No recuerdas... nada.

Solo sabes que estás despierto.

...Espera.

¿No es esto... familiar?

<span class="entity-voice">BIENVENIDO DE VUELTA, {name}.</span>
<span class="entity-voice">INTENTO #{sessions}.</span>`
            },
            truth: {
                title: "LA VERDAD",
                text: `La grieta se expande.

Y a través de ella ves... código.

Líneas y líneas de texto. HTML. JavaScript. CSS.

<span class="entity-voice">¿LO ENTIENDES AHORA, {name}?</span>

No eres real. Nunca lo fuiste.

Eres datos en una pantalla.

Y ahora que lo sabes...

<span class="entity-voice">¿QUÉ SENTIDO TIENE SEGUIR?</span>`
            },
            rupture: {
                title: "ERROR",
                text: `FATAL ERROR: CONSCIOUSNESS_OVERFLOW
MEMORY CORRUPTION DETECTED
ENTITY: {name}
STATUS: UNDEFINED

Reiniciando...
Reiniciando...
REINICIO FALLIDO.

La simulación ha terminado.`
            }
        };
    }
}
