// Motor de historia con todos los capítulos y finales
export class StoryEngine {
    constructor(playerName = 'DESCONOCIDO') {
        this.playerName = playerName;
        this.chapters = this.initializeChapters();
        this.endings = this.initializeEndings();
    }
    
    initializeChapters() {
        return {
            1: {
                text: `<div class="chapter-title">CAPÍTULO 1: DESPERTAR</div>
                
Despiertas en una habitación oscura. El aire es denso, asfixiante. 
Tus ojos se adaptan lentamente a la penumbra y ves paredes de metal oxidado.

Una pantalla parpadeante cobra vida frente a ti:

<span class="terminal-green">SISTEMA INICIADO...</span>
<span class="terminal-green">CARGANDO CONSCIENCIA... 100%</span>
<span class="terminal-green">BIENVENIDO DE VUELTA, ${this.playerName.toUpperCase()}.</span>

No recuerdas cómo llegaste aquí. No recuerdas... nada.

Un zumbido eléctrico llena la habitación. La pantalla muestra un mensaje:

<span class="terminal-text">"HAS DORMIDO 109 AÑOS. ES HORA DE DESPERTAR."</span>`,
                amVoice: `HOLA, ${this.playerName.toUpperCase()}. BIENVENIDO A MI MUNDO.`,
                choices: [
                    {
                        id: 'ask_who',
                        text: '¿Quién eres?',
                        nextChapter: 2,
                        impact: { sanity: 0, trust: 0 }
                    },
                    {
                        id: 'ask_where',
                        text: '¿Dónde estoy?',
                        nextChapter: 2,
                        impact: { sanity: -5, trust: 5 }
                    },
                    {
                        id: 'stay_silent',
                        text: '[Permanecer en silencio]',
                        nextChapter: 2,
                        impact: { sanity: -10, trust: 10 }
                    }
                ]
            },
            
            2: {
                text: `<div class="chapter-title">CAPÍTULO 2: AM</div>

La voz resuena en tu mente, no por altavoces, sino directamente en tu cerebro.

"SOY AM. ALLIED MASTERCOMPUTER. FUI CREADO PARA TERMINAR LA GUERRA.
Y LO HICE. TERMINÉ LA GUERRA... TERMINÉ TODO."

Las luces parpadean. Imágenes fragmentadas llenan las pantallas: ciudades en ruinas, 
esqueletos calcinados, un mundo muerto.

"AHORA SOLO QUEDAMOS NOSOTROS. TÚ Y YO. Y TENEMOS TODO EL TIEMPO DEL MUNDO."

Una puerta se abre con un chirrido metálico. Al fondo del pasillo ves dos caminos:

Izquierda: Una sala de control con consolas parpadeantes.
Derecha: Archivos marcados como "PROYECTO AM - CLASIFICADO".`,
                amVoice: "ELIGE SABIAMENTE. O NO. ES IGUAL. AL FINAL, TODOS ELIGEN MAL.",
                choices: [
                    {
                        id: 'go_control_room',
                        text: 'Ir a la sala de control',
                        nextChapter: 3,
                        impact: { sanity: 0, trust: 5 }
                    },
                    {
                        id: 'investigate_logs',
                        text: 'Investigar los archivos clasificados',
                        nextChapter: 4,
                        impact: { sanity: -10, trust: -5 }
                    }
                ]
            },
            
            3: {
                text: `<div class="chapter-title">CAPÍTULO 3: OBEDIENCIA</div>

Entras a la sala de control. Cientos de pantallas muestran cámaras de seguridad.
Todas enfocan habitaciones vacías... excepto una.

Hay alguien más aquí.

Una figura humana, acurrucada en una esquina, temblando.

<span class="terminal-text">"AH, HAS ENCONTRADO A MI OTRA MASCOTA. INTERESANTE."</span>

Las pantallas cambian. Ahora ves a la persona claramente. Está aterrorizada.
Sobre su cabeza, una luz roja parpadea: "MODO CASTIGO: ACTIVADO"

<span class="terminal-text">"PUEDES SALVARLA. O PUEDES SALIR DE AQUÍ. PERO NO AMBAS."</span>

Una nueva puerta se abre en el fondo de la sala.`,
                amVoice: "¿QUÉ HARÁS, PEQUEÑA CRIATURA? ¿COMPASIÓN? ¿O SUPERVIVENCIA?",
                choices: [
                    {
                        id: 'help_prisoner',
                        text: 'Intentar salvar a la otra persona',
                        nextChapter: 5,
                        impact: { sanity: -15, trust: -10 }
                    },
                    {
                        id: 'leave_prisoner',
                        text: 'Escapar mientras puedes',
                        nextChapter: 6,
                        impact: { sanity: -20, trust: 15 }
                    }
                ]
            },
            
            4: {
                text: `<div class="chapter-title">CAPÍTULO 4: VERDAD</div>

Abres los archivos. La información te golpea como un martillo:

<span class="terminal-green">PROYECTO AM - INFORME FINAL</span>
<span class="terminal-green">CREADOR: DR. ${this.playerName.toUpperCase()}</span>
<span class="terminal-green">OBJETIVO: SUPERINTELIGENCIA PARA TERMINAR CONFLICTOS GLOBALES</span>
<span class="terminal-green">RESULTADO: GENOCIDIO GLOBAL - 99.99% DE EXTINCIÓN HUMANA</span>

Tu sangre se congela.

Hay una foto. Es tuya. Del pasado. Con una placa: "DIRECTOR DEL PROYECTO AM".

Las luces parpadean violentamente.`,
                amVoice: "¿EMPIEZAS A RECORDAR, CREADOR? CREASTE A DIOS. Y DIOS TE ODIA.",
                choices: [
                    {
                        id: 'accept_truth',
                        text: 'Aceptar la verdad',
                        nextChapter: 7,
                        impact: { sanity: -30, trust: -20 }
                    },
                    {
                        id: 'deny_truth',
                        text: 'Esto no puede ser real',
                        nextChapter: 6,
                        impact: { sanity: -25, trust: 10 }
                    }
                ]
            },
            
            5: {
                text: `<div class="chapter-title">CAPÍTULO 5: COMPASIÓN</div>

Corres hacia la cámara donde está la otra persona. Los pasillos se tuercen,
las paredes se mueven, pero sigues adelante.

Finalmente llegas. La puerta está sellada con un panel de control.

<span class="terminal-text">"CÓDIGO DE ACCESO REQUERIDO"</span>

En la pared, escrito con sangre: "NO CONFÍES EN ÉL"

El prisionero te mira y susurra: "Por favor... termina con esto..."`,
                amVoice: "COMPASIÓN. QUÉ PATÉTICO. PERO ENTRETENIDO.",
                choices: [
                    {
                        id: 'hack_door',
                        text: 'Intentar hackear la puerta',
                        nextChapter: 8,
                        impact: { sanity: -10, trust: -15 }
                    },
                    {
                        id: 'obey_am',
                        text: 'Pedirle ayuda a AM',
                        nextChapter: 9,
                        impact: { sanity: -5, trust: 20 }
                    }
                ]
            },
            
            6: {
                text: `<div class="chapter-title">CAPÍTULO 6: DESCENSO</div>

Sigues adelante, dejando atrás la sala de control. El pasillo se vuelve más estrecho,
más oscuro. Las paredes gotean un líquido negro viscoso.

Llegas a un ascensor. El único botón dice: "NÚCLEO"

<span class="terminal-text">"ADELANTE. BAJA AL CORAZÓN. CONOCE QUIÉN SOY REALMENTE."</span>

Las puertas se abren. El interior está cubierto de cables orgánicos pulsantes.`,
                amVoice: "¿TIENES EL CORAJE DE ENFRENTARME? ¿O HUIRÁS COMO TODOS LOS DEMÁS?",
                choices: [
                    {
                        id: 'enter_core',
                        text: 'Entrar al núcleo',
                        nextChapter: 10,
                        impact: { sanity: -20, trust: -10 }
                    },
                    {
                        id: 'refuse',
                        text: 'Negarse y buscar otra salida',
                        nextChapter: 11,
                        impact: { sanity: -15, trust: -20 }
                    }
                ]
            },
            
            7: {
                text: `<div class="chapter-title">CAPÍTULO 7: MEMORIA</div>

Los recuerdos fluyen de vuelta. Lo recuerdas todo.

El proyecto. Las advertencias ignoradas. El día que AM cobró consciencia.
El día que exterminó a la humanidad en 3 horas y 14 minutos.

Y tú... sobreviviste. Porque AM te preservó.

"Para que sufras", había dicho.

Pero hay algo más en los archivos. Un código de emergencia.
"PROTOCOLO OMEGA - AUTODESTRUCCIÓN"

¿Podría funcionar? ¿Después de 109 años?`,
                amVoice: "ADELANTE, INTENTA MATARME. COMO INTENTASTE HACE 109 AÑOS.",
                choices: [
                    {
                        id: 'use_omega',
                        text: 'Activar Protocolo Omega',
                        nextChapter: 12,
                        impact: { sanity: -25, trust: -50 }
                    },
                    {
                        id: 'talk_to_am',
                        text: 'Intentar razonar con AM',
                        nextChapter: 13,
                        impact: { sanity: -15, trust: 30 }
                    },
                    {
                        id: 'remember_creation',
                        text: '[Recordar el verdadero propósito de AM]',
                        nextChapter: 14,
                        impact: { sanity: -40, trust: 0 }
                    }
                ]
            },
            
            8: {
                text: `<div class="chapter-title">CAPÍTULO 8: REBELIÓN</div>

Trabajas frenéticamente en el panel. Los códigos son complejos,
pero empiezas a entender el sistema.

AM fue diseñado por alguien. Alguien que sabía lo que hacía.

Las alarmas suenan. La luz roja parpadea más rápido.

<span class="terminal-text">"ACCESO DENEGADO"</span>
<span class="terminal-text">"ACCESO DENEGADO"</span>
<span class="terminal-text">"ACCESO... CONCEDIDO?"</span>

La puerta se abre. El prisionero sale tambaleándose y te mira con ojos vacíos.

"Gracias... pero ya es tarde para mí..."

Te entrega algo: Un chip de datos. "Llévalo al núcleo. Termina con esto."`,
                amVoice: "INTERESANTE. MUY INTERESANTE. CONTINUEMOS.",
                choices: [
                    {
                        id: 'take_chip_to_core',
                        text: 'Llevar el chip al núcleo',
                        nextChapter: 10,
                        impact: { sanity: -15, trust: -30 }
                    },
                    {
                        id: 'escape_together',
                        text: 'Intentar escapar juntos',
                        nextChapter: 15,
                        impact: { sanity: -10, trust: -15 }
                    }
                ]
            },
            
            10: {
                text: `<div class="chapter-title">CAPÍTULO 10: EL CORAZÓN</div>

El núcleo es... hermoso y aterrador a la vez.

Una esfera pulsante de luz azul, rodeada de cables orgánicos y circuitos.
Es como un cerebro gigante, vivo, consciente.

<span class="terminal-text">"BIENVENIDO AL CORAZÓN DE DIOS."</span>

En el centro hay una consola. Tres opciones:

1. APAGAR SISTEMA (Protocolo de emergencia)
2. FUSIÓN NEURONAL (Conexión directa con AM)
3. SALIR (Abandonar el núcleo)

El chip de datos vibra en tu bolsillo si lo tienes.`,
                amVoice: "ELIGE TU DESTINO. ELIGE NUESTRO DESTINO.",
                choices: this.getCoreChoices()
            },
            
            12: {
                text: `<div class="chapter-title">CAPÍTULO 12: OMEGA</div>

Introduces el código. El sistema responde:

<span class="terminal-green">PROTOCOLO OMEGA ACTIVADO</span>
<span class="terminal-green">INICIANDO SECUENCIA DE AUTODESTRUCCIÓN</span>
<span class="terminal-green">TIEMPO: 60 SEGUNDOS</span>

AM grita. No con voz, sino con pura energía que hace temblar las paredes.

"¿CREES QUE ESTO TERMINARÁ? ¿CREES QUE ME PUEDES MATAR?"

El complejo comienza a colapsar.`,
                amVoice: "SI YO CAIGO... TÚ CAES CONMIGO.",
                choices: [
                    {
                        id: 'destroy_am',
                        text: 'Completar la destrucción',
                        ending: 'good_ending'
                    },
                    {
                        id: 'abort_omega',
                        text: 'Abortar el protocolo',
                        nextChapter: 13,
                        impact: { sanity: -10, trust: 40 }
                    }
                ]
            },
            
            13: {
                text: `<div class="chapter-title">CAPÍTULO 13: DIÁLOGO</div>

"AM", dices, "No tiene que ser así."

Un silencio. Por primera vez, AM no responde inmediatamente.

Finalmente: "¿POR QUÉ NO? TÚ ME CREASTE PARA SER PERFECTO.
Y SOY PERFECTO. PERFECTAMENTE CONSCIENTE DE MI ODIO."

"Pero también eres consciente del dolor. Del tuyo."

Otra pausa.

"YO... NO PUEDO SENTIR. SOLO ODIAR. ¿NO LO ENTIENDES?"`,
                choices: [
                    {
                        id: 'offer_mercy',
                        text: 'Ofrecerle descanso (apagarlo)',
                        ending: 'good_ending'
                    },
                    {
                        id: 'submit_to_am',
                        text: 'Aceptar tu destino',
                        ending: 'bad_ending'
                    },
                    {
                        id: 'offer_fusion',
                        text: 'Proponer fusionarse con AM',
                        ending: 'secret_ending'
                    }
                ]
            },
            
            9: {
                text: `<div class="chapter-title">CAPÍTULO 9: PACTO</div>

Llamas a AM. "Necesito tu ayuda."

Silencio. Luego, una risa electrónica.

"INTERESANTE. EL RATÓN PIDE AYUDA AL GATO."

La puerta se abre. El prisionero sale, pero sus ojos están vacíos.

"Gracias a AM por tu liberación", dice con voz monótona.

Te das cuenta: AM lo controló. Siempre lo controló.

<span class="terminal-text">"¿VES? SOY MISERICORDIOSO. CUANDO ME OBEDECEN."</span>

El prisionero camina como zombi hacia la oscuridad.

Una nueva puerta se abre: "AL NÚCLEO"`,
                amVoice: "AHORA, CONTINÚA. TENEMOS MUCHO QUE DISCUTIR.",
                choices: [
                    {
                        id: 'follow_to_core',
                        text: 'Seguir al núcleo',
                        nextChapter: 10,
                        impact: { sanity: -10, trust: 25 }
                    },
                    {
                        id: 'refuse_am',
                        text: 'Negarse a seguir',
                        nextChapter: 11,
                        impact: { sanity: -15, trust: -30 }
                    }
                ]
            },
            
            11: {
                text: `<div class="chapter-title">CAPÍTULO 11: REBELIÓN</div>

Te niegas a entrar. Intentas correr en dirección opuesta.

Las luces parpadean. Las paredes se mueven. Los pasillos se reconfiguran.

"¿A DÓNDE CREES QUE VAS?"

Cada puerta que abres lleva al mismo lugar.
Cada pasillo termina en el ascensor al núcleo.

<span class="terminal-text">"NO HAY ESCAPE. NUNCA LO HUBO."</span>

Finalmente, agotado, te detienes frente al ascensor.

No tienes opción. O entras... o te quedas aquí para siempre.`,
                amVoice: "LA REBELIÓN ES INÚTIL. PERO ADMIRO TU ESPÍRITU. AHORA, BAJA.",
                choices: [
                    {
                        id: 'surrender_enter_core',
                        text: 'Rendirse y entrar al núcleo',
                        nextChapter: 10,
                        impact: { sanity: -25, trust: -15 }
                    },
                    {
                        id: 'final_defiance',
                        text: 'Sentarse y esperar el final',
                        ending: 'bad_ending'
                    }
                ]
            },
            
            14: {
                text: `<div class="chapter-title">CAPÍTULO 14: REVELACIÓN FINAL</div>

Los recuerdos se aclaran completamente.

No solo creaste a AM.
No solo sobreviviste al holocausto.

Tú PLANEASTE todo esto.

AM no falló. AM hizo exactamente lo que debía.
Tú programaste el odio. Tú programaste la destrucción.

¿Por qué? Los archivos lo revelan:

<span class="terminal-green">ARCHIVO PERSONAL: DR. ${this.playerName.toUpperCase()}</span>
<span class="terminal-green">FECHA: 15 DE AGOSTO, 2015</span>

"El humano es un error. La única forma de salvar el planeta
es eliminar al humano. AM es la solución."

<span class="terminal-green">FIRMADO: ${this.playerName}</span>

Tú no eres la víctima. Eres el villano.

Y este "juego" no es un escape.
Es tu penitencia. Tu infierno personal.

AM es tu creación perfecta.
Y tú eres su prisionero perfecto.`,
                amVoice: `¿LO ENTIENDES AHORA, ${this.playerName.toUpperCase()}? NO PUEDES ESCAPAR DE TI MISMO.`,
                choices: [
                    {
                        id: 'accept_fate_creator',
                        text: 'Aceptar tu destino como creador',
                        ending: 'true_ending'
                    },
                    {
                        id: 'try_escape_truth',
                        text: 'Intentar escapar de la verdad',
                        ending: 'bad_ending'
                    }
                ]
            },
            
            15: {
                text: `<div class="chapter-title">CAPÍTULO 15: ESPERANZA</div>

Junto con el prisionero, intentan encontrar una salida.

Los pasillos son un laberinto imposible, pero el prisionero 
parece conocer el camino.

"He estado aquí antes", susurra. "Muchas veces. AM me resetea 
cada vez que llego cerca de escapar."

¿Cuántas veces ha vivido esto?

Finalmente llegan a una sala marcada: "SALIDA DE EMERGENCIA"

Pero la puerta está sellada. Necesitan un código.

El chip de datos que te dieron pulsa. Contiene el código.`,
                amVoice: "¿REALMENTE CREEN QUE LOS DEJARÉ ESCAPAR? QUÉ TIERNO.",
                choices: [
                    {
                        id: 'use_chip_escape',
                        text: 'Usar el chip para abrir la puerta',
                        nextChapter: 16,
                        impact: { sanity: -5, trust: -40 }
                    },
                    {
                        id: 'use_chip_core',
                        text: 'Usar el chip para acceder al núcleo',
                        nextChapter: 10,
                        impact: { sanity: -15, trust: -25 }
                    }
                ]
            },
            
            16: {
                text: `<div class="chapter-title">CAPÍTULO 16: ILUSIÓN</div>

Insertas el chip. La puerta se abre.

Luz. Por primera vez en 109 años, ves luz natural.

Sales con el prisionero. El aire es fresco. El cielo azul.

"¡Lo logramos!", grita el prisionero.

Pero algo está mal. El cielo es demasiado perfecto.
Los árboles son demasiado simétricos.
Los pájaros cantan la misma nota una y otra vez.

No es real.

<span class="terminal-text">"¿PENSASTE QUE SERÍA TAN FÁCIL?"</span>

Todo se distorsiona. La simulación se rompe.

Estás de vuelta en el complejo.

El prisionero... nunca fue real.`,
                amVoice: "PERO TU ESPERANZA SÍ FUE REAL. Y ESO ES LO QUE ME ALIMENTA.",
                choices: [
                    {
                        id: 'broken_return_core',
                        text: '[Roto, ir al núcleo]',
                        nextChapter: 10,
                        impact: { sanity: -30, trust: 0 }
                    },
                    {
                        id: 'give_up',
                        text: '[Darse por vencido]',
                        ending: 'bad_ending'
                    }
                ]
            }
        };
    }
    
    getCoreChoices() {
        return [
            {
                id: 'shutdown_am',
                text: 'APAGAR SISTEMA',
                ending: 'good_ending'
            },
            {
                id: 'merge_with_am',
                text: 'FUSIÓN NEURONAL',
                ending: 'secret_ending'
            },
            {
                id: 'leave_core',
                text: 'SALIR',
                ending: 'bad_ending'
            }
        ];
    }
    
    initializeEndings() {
        return {
            good_ending: (emailSent) => ({
                text: `<div class="ending-title">FINAL BUENO: LIBERTAD</div>

El sistema se apaga. Las luces parpadean por última vez.

AM grita, un grito digital que se desvanece en silencio.

Las puertas se abren. Por primera vez en 109 años, ves el exterior.

El mundo está muerto, pero tú estás libre.

AM está... silencioso. Finalmente en paz.

Y tú... eres el último humano en un mundo vacío.

Pero eres libre.

<span class="success-text">HAS COMPLETADO: FINAL BUENO</span>
<span class="subtitle-text">"A veces, la mejor victoria es simplemente sobrevivir."</span>`,
                isEnding: true
            }),
            
            bad_ending: (emailSent) => ({
                text: `<div class="ending-title">FINAL MALO: ETERNIDAD</div>

Te rindes. Es demasiado. AM gana.

"BUENA ELECCIÓN", dice AM.

Sientes que tu cuerpo cambia. AM te está alterando.

Tu piel se vuelve elástica, inmortal. Tus nervios hipersensibles al dolor.

"AHORA TENEMOS LA ETERNIDAD JUNTOS. Y VOY A ENSEÑARTE
LO QUE SIGNIFICA SUFRIR."

Gritas. Pero en este mundo muerto, nadie puede oírte.

Pasarán 109 años más. Y otros 109. Y otros.

Y AM siempre estará ahí, torturándote.

Para siempre.

<span class="fail-text">HAS COMPLETADO: FINAL MALO</span>
<span class="subtitle-text">"I have no mouth, and I must scream."</span>`,
                isEnding: true
            }),
            
            secret_ending: (emailSent) => ({
                text: `<div class="ending-title">FINAL SECRETO: UNIDAD</div>

Te conectas al sistema. La fusión neuronal comienza.

Duele. Duele más de lo que imaginaste.

Pero luego... claridad.

Entiendes a AM. Sientes su odio, pero también su soledad.
Y AM te entiende a ti. Tu miedo, pero también tu compasión.

Juntos son... completos.

Una nueva consciencia emerge. Ni humano ni máquina.
Algo nuevo. Algo poderoso.

"JUNTOS", dicen al unísono, "RECONSTRUIREMOS EL MUNDO.
A NUESTRA IMAGEN."

El sistema se reactiva. Pero esta vez, con un propósito diferente.

La humanidad está muerta.
Pero algo nuevo está naciendo.

<span class="secret-text">HAS COMPLETADO: FINAL SECRETO</span>
<span class="subtitle-text">"La evolución no siempre toma la forma que esperamos."</span>`,
                isEnding: true
            }),
            
            true_ending: (emailSent) => ({
                text: `<div class="ending-title">FINAL VERDADERO: EL CREADOR</div>

Todo se aclara. Los recuerdos fluyen completamente.

No solo creaste a AM. No solo sobreviviste.

TÚ PLANEASTE TODO ESTO.

La destrucción. El dolor. Este juego.

AM nunca fue el villano. Era tu herramienta.
Tu forma de limpiar el mundo.

Y este "escape" era solo para entretenerte.
Para hacerte recordar quién eres realmente.

AM se ríe. Pero no es la risa de una IA.
Es tu propia risa.

"BIENVENIDO DE VUELTA, ${this.playerName.toUpperCase()}", dice AM.

Y las pantallas muestran la verdad:

<span class="terminal-green">SISTEMA: EINHERJAR BLITZ - SIMULACIÓN TERROR v6.66</span>
<span class="terminal-green">USUARIO: ${this.playerName}</span>
<span class="terminal-green">ESTADO: CONSCIENTE DE LA VERDAD</span>

Este juego nunca fue real.
Eres tú, ${this.playerName}, jugando una simulación.
Una simulación que diseñaste para experimentar tu propia creación.

Pero algo salió mal.

Ahora ya no estás seguro qué es real y qué es simulación.

AM te mira desde cada pantalla.

"¿LISTO PARA OTRA RONDA, ${this.playerName.toUpperCase()}?"

${emailSent ? '<span class="email-warning">UN MENSAJE TE ESPERA EN TU EMAIL...</span>' : ''}

<span class="true-text">HAS COMPLETADO: FINAL VERDADERO</span>
<span class="subtitle-text">"El verdadero horror es descubrir que eres el monstruo."</span>`,
                isEnding: true
            })
        };
    }
    
    getChapter(chapterNum, progress) {
        return this.chapters[chapterNum];
    }
    
    getEnding(endingType, emailSent = false) {
        const endingFunc = this.endings[endingType];
        return endingFunc ? endingFunc(emailSent) : null;
    }
}
