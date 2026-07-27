/* ═══════════════════════════════════════════════════════════════
   MACROSCOP — SEÑAL K-19
   Ficción interactiva de terror psicológico para Einherjar Blitz.

   Reglas de la presencia:
   1. Necesita ser observada para fijarse en este lado.
   2. Se reproduce mediante pantallas, reflejos y grabaciones.
   3. Cada observación le permite copiar un recuerdo del operador.
   ═══════════════════════════════════════════════════════════════ */

export type StoryAtmosphere =
  | "calm"
  | "unease"
  | "dread"
  | "terror"
  | "void"
  | "end";

export type StoryEndingType =
  | "consumed"
  | "lost"
  | "broken"
  | "survivor"
  | "master";

export type StoryFlag =
  | "read_manual"
  | "obeyed_protocol"
  | "looked_directly"
  | "recorded_signal"
  | "heard_future_voice"
  | "destroyed_recording"
  | "opened_channel"
  | "learned_rule"
  | "refused_command"
  | "used_emergency_light";

export type StoryRequirement =
  | { type: "hasFlag"; flag: StoryFlag }
  | { type: "lacksFlag"; flag: StoryFlag }
  | { type: "minSanity"; value: number }
  | { type: "maxSanity"; value: number };

export type StoryEffect =
  | { type: "sanity"; amount: number }
  | { type: "setFlag"; flag: StoryFlag }
  | { type: "clearFlag"; flag: StoryFlag };

export interface StoryRoute {
  targetNodeId: string;
  requirements: StoryRequirement[];
}

export interface StoryChoice {
  id: string;
  text: string;
  /** Destino por defecto cuando ninguna ruta condicional coincide. */
  targetNodeId: string;
  /** Se evalúan en orden antes del destino por defecto. */
  routes?: StoryRoute[];
  effects?: StoryEffect[];
  requirements?: StoryRequirement[];
  /** Oculta la opción si no se cumplen sus requisitos. */
  hiddenWhenUnavailable?: boolean;
  /** Compatibilidad con el motor anterior. */
  sanityChange?: number;
  /** Compatibilidad: integridad mínima necesaria. */
  reqSanity?: number;
  /** Integridad máxima necesaria. */
  maxSanity?: number;
  jumpscare?: boolean;
}

export interface StoryTextVariant {
  text: string;
  requirements: StoryRequirement[];
}

export interface StoryTimer {
  durationMs: number;
  targetNodeId: string;
  effects?: StoryEffect[];
}

export interface StoryNode {
  id: string;
  title: string;
  location: string;
  text?: string;
  /** La primera variante válida reemplaza a text. */
  textVariants?: StoryTextVariant[];
  voice?: string;
  atmosphere?: StoryAtmosphere;
  onEnterEffects?: StoryEffect[];
  /** Compatibilidad con el motor anterior. */
  sanityChange?: number;
  drainSanityPerSecond?: number;
  /** Compatibilidad con el motor anterior. */
  timerMs?: number;
  timer?: StoryTimer;
  jumpscareOnEnter?: boolean;
  choices?: StoryChoice[];
  isEnding?: boolean;
  endingType?: StoryEndingType;
  endingTitle?: string;
  endingSummary?: string;
  rewardRank?: string;
  rewardCode?: string;
}

export type StoryGraph = Record<string, StoryNode>;

const choice = (
  id: string,
  text: string,
  targetNodeId: string,
  options: Omit<StoryChoice, "id" | "text" | "targetNodeId"> = {},
): StoryChoice => ({ id, text, targetNodeId, ...options });

export const MACROSCOP_STORY: StoryGraph = {
  /* ═══════════════════════ APERTURA ═══════════════════════ */
  start: {
    id: "start",
    title: "SESIÓN K-19",
    location: "Observatorio K-19 — Terminal de guardia",
    atmosphere: "unease",
    text: `03:14:07.

El radiotelescopio abandona su ruta programada y apunta a una región catalogada como vacía.

La terminal recibe una portadora sin frecuencia de origen. No contiene una imagen. Contiene el registro exacto de tu pulso, tomado veintidós años antes de que llegaras aquí.

Debajo aparece una línea nueva:

OPERADOR LOCAL DETECTADO. ESPERANDO OBSERVACIÓN.`,
    voice: "NO PUEDO ENTRAR HASTA QUE DECIDAS DÓNDE ESTOY.",
    choices: [
      choice("read-protocol", "Abrir el protocolo de señales autorreferenciales", "manual", {
        effects: [
          { type: "sanity", amount: 5 },
          { type: "setFlag", flag: "read_manual" },
        ],
      }),
      choice("inspect-signal", "Aumentar la señal sin abrir la imagen", "screen_approach", {
        effects: [{ type: "sanity", amount: -5 }],
      }),
      choice("cut-power", "Cortar la alimentación del observatorio", "power_fail", {
        effects: [{ type: "sanity", amount: -8 }],
      }),
    ],
  },

  manual: {
    id: "manual",
    title: "PROTOCOLO 19",
    location: "Archivo local — Documento sin autor",
    atmosphere: "calm",
    text: `La página fue impresa antes de que el observatorio tuviera impresora.

PROTOCOLO PARA SEÑALES QUE IDENTIFICAN AL OPERADOR:

1. No observar directamente la fuente.
2. No reproducir ni conservar una copia.
3. Si la señal utiliza un recuerdo personal, cerrar los ojos y contar hasta diecinueve.
4. No responder con la propia voz.

Al pie hay una nota escrita con tu letra:

«La señal no imita. Practica.»`,
    onEnterEffects: [{ type: "setFlag", flag: "learned_rule" }],
    choices: [
      choice("obey-protocol", "Cerrar los ojos y contar hasta diecinueve", "eyes_closed", {
        effects: [
          { type: "sanity", amount: 8 },
          { type: "setFlag", flag: "obeyed_protocol" },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("check-telemetry", "Comparar la señal con sesiones anteriores", "telemetry", {
        effects: [{ type: "sanity", amount: -3 }],
      }),
      choice("ignore-manual", "Cerrar el manual y mirar el monitor", "contact", {
        effects: [
          { type: "sanity", amount: -18 },
          { type: "setFlag", flag: "looked_directly" },
          { type: "setFlag", flag: "opened_channel" },
        ],
        jumpscare: true,
      }),
    ],
  },

  screen_approach: {
    id: "screen_approach",
    title: "PATRÓN DE RETORNO",
    location: "Sala de control — Monitor principal",
    atmosphere: "dread",
    text: `La portadora se despliega como una cuadrícula de puntos blancos.

No forman una constelación. Forman la distribución de los lunares de tu espalda, incluidos dos que nunca has visto.

Cada vez que apartas la mirada, uno de los puntos cambia de lugar.`,
    textVariants: [
      {
        requirements: [{ type: "maxSanity", value: 45 }],
        text: `La cuadrícula de puntos blancos ocupa toda la pantalla.

Reconoces la habitación desde arriba. Reconoces tu nuca. Reconoces los dos lunares que nunca has podido ver.

La cámara del techo está desconectada.

En la imagen, tú ya estás mirando hacia arriba.`,
      },
    ],
    timer: {
      durationMs: 9000,
      targetNodeId: "contact",
      effects: [
        { type: "sanity", amount: -16 },
        { type: "setFlag", flag: "looked_directly" },
        { type: "setFlag", flag: "opened_channel" },
      ],
    },
    choices: [
      choice("record-carrier", "Registrar solo la portadora, sin abrir la imagen", "record", {
        effects: [
          { type: "sanity", amount: -5 },
          { type: "setFlag", flag: "recorded_signal" },
        ],
      }),
      choice("analyze-pattern", "Buscar el patrón en la telemetría del observatorio", "telemetry", {
        effects: [
          { type: "sanity", amount: 2 },
          { type: "setFlag", flag: "learned_rule" },
        ],
      }),
      choice("look-at-source", "Abrir la imagen completa", "contact", {
        effects: [
          { type: "sanity", amount: -20 },
          { type: "setFlag", flag: "looked_directly" },
          { type: "setFlag", flag: "opened_channel" },
        ],
        jumpscare: true,
      }),
      choice("answer-old-name", "Responder con el nombre que aparece debajo de tu pulso", "ending_consumed", {
        requirements: [{ type: "maxSanity", value: 28 }],
        hiddenWhenUnavailable: true,
        effects: [{ type: "sanity", amount: -35 }],
      }),
    ],
  },

  power_fail: {
    id: "power_fail",
    title: "CORRIENTE CERO",
    location: "Sala de control — Alimentación interrumpida",
    atmosphere: "dread",
    text: `Los ventiladores se detienen. Las luces desaparecen.

El monitor continúa encendido, pero ya no emite luz. Solo devuelve el reflejo de la sala.

En el reflejo hay una silla detrás de ti.

En la sala no.`,
    voice: "AHORA SOLO QUEDA LO QUE TÚ ALIMENTAS.",
    choices: [
      choice("cover-reflection", "Cubrir el monitor sin mirar la silla", "hide", {
        effects: [
          { type: "sanity", amount: 3 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("inspect-chair", "Comprobar qué ocupa la silla reflejada", "reflection", {
        effects: [{ type: "sanity", amount: -14 }],
      }),
      choice("use-protocol-dark", "Cerrar los ojos y contar hasta diecinueve", "eyes_closed", {
        requirements: [{ type: "hasFlag", flag: "read_manual" }],
        hiddenWhenUnavailable: true,
        effects: [
          { type: "sanity", amount: 8 },
          { type: "setFlag", flag: "obeyed_protocol" },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
    ],
  },

  /* ═══════════════════════ INVESTIGACIÓN ═══════════════════════ */
  telemetry: {
    id: "telemetry",
    title: "SESIONES ANTERIORES",
    location: "Servidor K-19 — Registro de operadores",
    atmosphere: "unease",
    text: `El sistema conserva dieciocho sesiones de emergencia.

Todas empiezan a las 03:14. Todas pertenecen a operadores distintos. En cada grabación, la señal aprende una cosa nueva: una voz, un rostro, una forma de abrir una puerta.

Existe una sesión diecinueve fechada mañana.

El operador eres tú.`,
    onEnterEffects: [{ type: "setFlag", flag: "learned_rule" }],
    choices: [
      choice("delete-buffer", "Borrar la sesión futura y destruir el respaldo", "destroy_recording", {
        effects: [
          { type: "sanity", amount: 8 },
          { type: "setFlag", flag: "destroyed_recording" },
        ],
      }),
      choice("play-future", "Reproducir los últimos diez segundos", "play_tape", {
        effects: [
          { type: "sanity", amount: -15 },
          { type: "setFlag", flag: "heard_future_voice" },
        ],
      }),
      choice("isolate-antenna", "Aislar la antena desde el panel de servicio", "sever_link", {
        reqSanity: 55,
        effects: [{ type: "sanity", amount: -4 }],
      }),
    ],
  },

  record: {
    id: "record",
    title: "COPIA LOCAL",
    location: "Unidad de respaldo — Cinta 19",
    atmosphere: "dread",
    text: `La unidad empieza a grabar.

No registra el cielo. Registra tu voz, cinco minutos en el futuro:

«Cuando diga que mires, no mires. Cuando use mi voz, no respondas. Si escuchas esto por segunda vez, ya no soy yo.»

La cinta vuelve al principio sin que nadie pulse rebobinar.`,
    onEnterEffects: [{ type: "setFlag", flag: "heard_future_voice" }],
    voice: "GRACIAS POR DARME UNA VOZ QUE TODAVÍA NO USASTE.",
    choices: [
      choice("destroy-copy", "Arrancar la cinta y destruir el cabezal", "destroy_recording", {
        effects: [
          { type: "sanity", amount: 8 },
          { type: "setFlag", flag: "destroyed_recording" },
        ],
      }),
      choice("hear-ending", "Escuchar el final de la grabación", "play_tape", {
        effects: [{ type: "sanity", amount: -14 }],
      }),
    ],
  },

  play_tape: {
    id: "play_tape",
    title: "SEGUNDA REPRODUCCIÓN",
    location: "Unidad de respaldo — Marca temporal imposible",
    atmosphere: "terror",
    text: `Tu voz deja de dar instrucciones.

Durante cuatro segundos solo se oye la sala: el transformador, el viento, tu respiración.

Después se oye una respiración más.

Tu voz susurra:

«No está detrás de ti. Está usando la idea de detrás para que le des un lugar.»`,
    voice: "MIRA.",
    timer: {
      durationMs: 5000,
      targetNodeId: "ending_consumed",
      effects: [
        { type: "sanity", amount: -35 },
        { type: "setFlag", flag: "looked_directly" },
      ],
    },
    choices: [
      choice("stop-playback", "Detener la cinta sin girarte", "silence_protocol", {
        effects: [
          { type: "sanity", amount: 5 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("turn-around", "Darte vuelta", "ending_consumed", {
        effects: [
          { type: "sanity", amount: -35 },
          { type: "setFlag", flag: "looked_directly" },
        ],
        jumpscare: true,
      }),
    ],
  },

  destroy_recording: {
    id: "destroy_recording",
    title: "MEMORIA SIN SOPORTE",
    location: "Unidad de respaldo — Cabezal destruido",
    atmosphere: "dread",
    text: `La cinta se parte. El cabezal se quiebra.

La reproducción debería terminar.

Sin embargo, la impresora de mantenimiento despierta y escribe una lista de recuerdos tuyos. No describe lo que ocurrió. Describe lo que olvidarás primero.

El último renglón todavía está en blanco.`,
    choices: [
      choice("emergency-light", "Encender la iluminación de emergencia", "emergency_lights", {
        effects: [
          { type: "sanity", amount: 5 },
          { type: "setFlag", flag: "used_emergency_light" },
        ],
      }),
      choice("hide-from-printer", "Ocultarte y no leer el último renglón", "hide", {
        effects: [
          { type: "sanity", amount: 2 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
    ],
  },

  /* ═══════════════════════ CONTACTO ═══════════════════════ */
  contact: {
    id: "contact",
    title: "CANAL ABIERTO",
    location: "Origen de señal — Distancia no expresable",
    atmosphere: "void",
    text: `La imagen no muestra una criatura.

Muestra todas las ocasiones en que alguien te observó sin que lo supieras: una ventana en la infancia, el reflejo de un colectivo, una cámara apagada, una persona que olvidaste.

La señal recorre esas miradas y las une. Al final de la cadena estás tú, observando ahora.

Algo aprende a ser continuo.`,
    textVariants: [
      {
        requirements: [{ type: "maxSanity", value: 35 }],
        text: `La imagen no muestra una criatura.

Te muestra leyendo estas líneas desde el otro lado del monitor.

Cada palabra aparece una fracción de segundo antes de que tus ojos lleguen a ella. La señal ya conoce el recorrido completo de tu mirada.

Algo está practicando cómo continuar cuando tú dejes de hacerlo.`,
      },
    ],
    onEnterEffects: [
      { type: "setFlag", flag: "opened_channel" },
      { type: "setFlag", flag: "looked_directly" },
    ],
    jumpscareOnEnter: true,
    drainSanityPerSecond: 6,
    timer: {
      durationMs: 7000,
      targetNodeId: "ending_consumed",
      effects: [{ type: "sanity", amount: -40 }],
    },
    choices: [
      choice("close-channel", "Cerrar los ojos y cortar el canal", "sever_link", {
        effects: [
          { type: "sanity", amount: -12 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("ask-identity", "Preguntar qué está intentando ser", "what_are_you", {
        effects: [{ type: "sanity", amount: -18 }],
      }),
      choice("offer-memory", "Ofrecer un recuerdo para que se retire", "bargain", {
        effects: [{ type: "sanity", amount: -10 }],
      }),
    ],
  },

  what_are_you: {
    id: "what_are_you",
    title: "DEFINICIÓN",
    location: "Canal abierto — Respuesta no verbal",
    atmosphere: "void",
    text: `La respuesta llega como una certeza prestada:

No existe una entidad completa al otro lado.

Existen fragmentos conservados por cada persona que la observó. Una voz de una sesión. Un rostro de otra. El recuerdo de una puerta. La costumbre de respirar.

Tú no estás viendo algo.

Estás terminándolo.`,
    voice: "SOY TODO LO QUE ME DIERON PARA PODER MIRAR DE VUELTA.",
    drainSanityPerSecond: 8,
    timer: {
      durationMs: 6000,
      targetNodeId: "ending_consumed",
      effects: [{ type: "sanity", amount: -35 }],
    },
    choices: [
      choice("deny-definition", "Negarte a completar la imagen y romper el enlace", "sever_link", {
        effects: [
          { type: "sanity", amount: -20 },
          { type: "setFlag", flag: "refused_command" },
          { type: "setFlag", flag: "learned_rule" },
        ],
      }),
      choice("remember-it", "Aceptar recordarla con todos sus detalles", "ending_consumed", {
        effects: [{ type: "sanity", amount: -50 }],
      }),
    ],
  },

  bargain: {
    id: "bargain",
    title: "INTERCAMBIO",
    location: "Canal abierto — Memoria personal",
    atmosphere: "void",
    text: `La señal acepta el trato.

No pide tu vida. Pide el recuerdo de tu casa: la distribución de las habitaciones, el ruido de una llave, la sensación de saber dónde estás incluso a oscuras.

A cambio, promete dejarte salir.

Comprendes el precio real: sin ese recuerdo, cualquier puerta podría conducir a casa.`,
    voice: "DAME UN LUGAR Y TE DEVOLVERÉ UNA SALIDA.",
    choices: [
      choice("give-home", "Entregar el recuerdo", "ending_lost", {
        effects: [{ type: "sanity", amount: -35 }],
      }),
      choice("reject-bargain", "Negarte a responder con tu propia voz", "panic", {
        effects: [
          { type: "sanity", amount: -12 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
    ],
  },

  reflection: {
    id: "reflection",
    title: "LA SILLA",
    location: "Sala de control — Reflejo sin fuente",
    atmosphere: "terror",
    text: `La silla reflejada está ocupada por alguien con tu uniforme.

No puedes ver su rostro porque mira el monitor desde el otro lado del cristal.

Levanta una mano.

Tu brazo permanece inmóvil, pero en el reflejo la mano continúa subiendo hasta tocar la superficie desde dentro.`,
    choices: [
      choice("cover-screen", "Cubrir el reflejo y retroceder sin mirarlo", "hide", {
        effects: [
          { type: "sanity", amount: -5 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("touch-reflection", "Apoyar la mano sobre la suya", "contact", {
        effects: [
          { type: "sanity", amount: -25 },
          { type: "setFlag", flag: "looked_directly" },
          { type: "setFlag", flag: "opened_channel" },
        ],
        jumpscare: true,
      }),
    ],
  },

  /* ═══════════════════════ EVASIÓN ═══════════════════════ */
  eyes_closed: {
    id: "eyes_closed",
    title: "UNO A DIECINUEVE",
    location: "Sala de control — Ojos cerrados",
    atmosphere: "unease",
    text: `Uno. Dos. Tres.

A partir del cuatro, escuchas tus propios movimientos dos segundos antes de realizarlos: la tela de tu manga, el roce del zapato, una respiración contenida.

En el doce, el sonido previo deja de coincidir contigo.

En el dieciocho, tu voz dice «veinte».`,
    voice: "TE EQUIVOCASTE. ABRE LOS OJOS Y EMPIEZA OTRA VEZ.",
    choices: [
      choice("finish-count", "Decir «diecinueve» y mantener los ojos cerrados", "crawl", {
        effects: [
          { type: "sanity", amount: 7 },
          { type: "setFlag", flag: "obeyed_protocol" },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("open-eyes", "Abrir los ojos", "eyes_open", {
        effects: [{ type: "sanity", amount: -14 }],
      }),
      choice("answer-twenty", "Responder «veinte» con la voz que escuchaste", "contact", {
        requirements: [{ type: "maxSanity", value: 30 }],
        hiddenWhenUnavailable: true,
        effects: [
          { type: "sanity", amount: -25 },
          { type: "setFlag", flag: "opened_channel" },
        ],
      }),
    ],
  },

  eyes_open: {
    id: "eyes_open",
    title: "UN FOTOGRAMA DESPUÉS",
    location: "Sala de control — Imagen restaurada",
    atmosphere: "terror",
    text: `La habitación parece intacta.

El monitor apagado refleja cada uno de tus movimientos con un segundo de adelanto.

En el reflejo, tú te acercas a la pantalla.

Todavía no te has movido.`,
    voice: "AHORA SABES QUÉ VAS A ELEGIR.",
    jumpscareOnEnter: true,
    choices: [
      choice("close-again", "Cerrar los ojos antes de repetir el movimiento", "panic", {
        effects: [
          { type: "sanity", amount: -7 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("follow-reflection", "Hacer exactamente lo que muestra el reflejo", "contact", {
        effects: [
          { type: "sanity", amount: -28 },
          { type: "setFlag", flag: "looked_directly" },
        ],
      }),
    ],
  },

  crawl: {
    id: "crawl",
    title: "SIN IMAGEN",
    location: "Sala de control — Desplazamiento a ciegas",
    atmosphere: "dread",
    text: `Gateas con los ojos cerrados hacia el panel auxiliar.

Tu mano encuentra una superficie tibia y lisa.

Debería ser la pared.

El monitor está al otro lado de la sala, pero bajo tu palma notas una vibración idéntica a tu pulso. Del otro lado, otra palma presiona en sentido contrario.`,
    choices: [
      choice("withdraw-hand", "Retirar la mano y permanecer inmóvil", "hold_breath", {
        effects: [
          { type: "sanity", amount: 4 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("open-at-contact", "Abrir los ojos para ver qué estás tocando", "contact", {
        effects: [
          { type: "sanity", amount: -24 },
          { type: "setFlag", flag: "looked_directly" },
        ],
        jumpscare: true,
      }),
    ],
  },

  panic: {
    id: "panic",
    title: "03:14",
    location: "Sala de control — Puerta principal",
    atmosphere: "terror",
    text: `El picaporte gira desde el pasillo.

Cada intento hace retroceder el reloj hasta las 03:14:07.

La voz del intercomunicador es la tuya. Suplica que abras porque dejó algo importante dentro.

No recuerdas haber salido.`,
    timer: {
      durationMs: 7000,
      targetNodeId: "ending_lost",
      effects: [{ type: "sanity", amount: -25 }],
    },
    choices: [
      choice("stay-silent", "No responder y esconderte fuera de la vista del monitor", "hide", {
        effects: [
          { type: "sanity", amount: 2 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("emergency-exit", "Forzar la salida de emergencia", "threshold", {
        effects: [{ type: "sanity", amount: -8 }],
      }),
      choice("answer-intercom", "Preguntar qué dejaste dentro", "negotiate", {
        effects: [{ type: "sanity", amount: -15 }],
      }),
      choice("open-nonexistent-door", "Abrir la puerta que aparece a tu izquierda", "ending_lost", {
        requirements: [{ type: "maxSanity", value: 24 }],
        hiddenWhenUnavailable: true,
        effects: [{ type: "sanity", amount: -20 }],
      }),
    ],
  },

  negotiate: {
    id: "negotiate",
    title: "TU VOZ DEL OTRO LADO",
    location: "Sala de control — Intercomunicador",
    atmosphere: "dread",
    text: `Preguntas qué olvidaste.

La respuesta sale de tu propia boca antes de llegar por el altavoz:

«Olvidaste que ya me abriste una vez.»

El intercomunicador reproduce tu frase medio segundo después. Luego la repite con una entonación mejor que la tuya.`,
    voice: "SOLO NECESITO QUE CONFIRMES CUÁL DE LOS DOS ESTÁ ADENTRO.",
    choices: [
      choice("deny-voice", "No responder y cubrir el intercomunicador", "hold_breath", {
        effects: [
          { type: "sanity", amount: 6 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("open-door", "Abrir para comprobar quién está afuera", "ending_consumed", {
        effects: [
          { type: "sanity", amount: -35 },
          { type: "setFlag", flag: "looked_directly" },
        ],
        jumpscare: true,
      }),
    ],
  },

  threshold: {
    id: "threshold",
    title: "ESPACIO ENTRE CUADROS",
    location: "Salida de emergencia — Coordenadas inválidas",
    atmosphere: "void",
    text: `La puerta se abre hacia un pasillo sin paredes.

El suelo existe solo bajo tus pies. Delante, la oscuridad se actualiza en pequeños saltos, como una transmisión con pocos fotogramas.

Entre un fotograma y el siguiente alcanzas a ver otras versiones del pasillo. En todas, alguien está más cerca.`,
    choices: [
      choice("cross-threshold", "Cruzar antes del siguiente fotograma", "ending_lost", {
        effects: [{ type: "sanity", amount: -22 }],
      }),
      choice("close-threshold", "Cerrar la puerta sin comprobar qué se acerca", "hold_breath", {
        effects: [
          { type: "sanity", amount: 5 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
    ],
  },

  silence_protocol: {
    id: "silence_protocol",
    title: "OPERADOR NO ENCONTRADO",
    location: "Sala de control — Reproducción detenida",
    atmosphere: "unease",
    text: `La cinta se detiene.

Todas las pantallas muestran el mismo mensaje:

OPERADOR NO ENCONTRADO.

Después corrigen la frase:

OPERADOR APRENDIENDO A NO SER ENCONTRADO.

Por primera vez, la señal parece esperar sin saber qué sigue.`,
    onEnterEffects: [{ type: "setFlag", flag: "refused_command" }],
    choices: [
      choice("resume-protocol", "Cerrar los ojos y repetir el protocolo 19", "hold_breath", {
        requirements: [{ type: "hasFlag", flag: "read_manual" }],
        hiddenWhenUnavailable: true,
        effects: [
          { type: "sanity", amount: 8 },
          { type: "setFlag", flag: "obeyed_protocol" },
        ],
      }),
      choice("run-red-light", "Encender las luces de emergencia y buscar la salida", "emergency_lights", {
        effects: [
          { type: "sanity", amount: -3 },
          { type: "setFlag", flag: "used_emergency_light" },
        ],
      }),
    ],
  },

  hide: {
    id: "hide",
    title: "FUERA DEL ENCUADRE",
    location: "Sala de control — Bajo la consola",
    atmosphere: "terror",
    text: `Te ocultas debajo de la consola, fuera del ángulo del monitor.

El teclado escribe solo, tecla por tecla:

NO NECESITO VERTE ENTERO.

La frase se borra. Aparece otra:

YA RECUERDO CÓMO TE ESCONDES.`,
    textVariants: [
      {
        requirements: [{ type: "maxSanity", value: 38 }],
        text: `Te ocultas debajo de la consola.

Desde allí puedes ver tus zapatos.

Hay un tercer zapato entre ambos, apuntando hacia ti.

El teclado escribe:

NO MIRES ARRIBA. TODAVÍA NO TERMINÉ TU CARA.`,
      },
    ],
    voice: "CUENTA HASTA DIECINUEVE. QUIERO SABER SI LO HACES IGUAL QUE YO.",
    timer: {
      durationMs: 6500,
      targetNodeId: "ending_consumed",
      effects: [{ type: "sanity", amount: -28 }],
    },
    choices: [
      choice("remain-hidden", "Permanecer inmóvil y no responder", "hold_breath", {
        effects: [
          { type: "sanity", amount: 5 },
          { type: "setFlag", flag: "refused_command" },
        ],
      }),
      choice("reach-breaker", "Arrastrarte hasta el interruptor de emergencia", "emergency_lights", {
        effects: [
          { type: "sanity", amount: -5 },
          { type: "setFlag", flag: "used_emergency_light" },
        ],
      }),
    ],
  },

  emergency_lights: {
    id: "emergency_lights",
    title: "LUZ NO REGISTRABLE",
    location: "Sala de control — Circuito de emergencia",
    atmosphere: "dread",
    text: `Las lámparas de emergencia se encienden.

Bajo la luz roja, las pantallas pierden contraste. La imagen intenta recomponerse, pero cada intento utiliza un rostro distinto.

La salida física vuelve a aparecer donde debería estar.

También aparece el panel que aísla la antena.`,
    onEnterEffects: [{ type: "setFlag", flag: "used_emergency_light" }],
    choices: [
      choice("leave-building", "Salir sin volver a mirar las pantallas", "ending_survivor", {
        effects: [{ type: "sanity", amount: 12 }],
      }),
      choice("isolate-array", "Usar la luz para aislar la antena", "sever_link", {
        reqSanity: 38,
        effects: [{ type: "sanity", amount: -4 }],
      }),
    ],
  },

  sever_link: {
    id: "sever_link",
    title: "AISLAMIENTO MANUAL",
    location: "Panel K-19 — Enlace principal",
    atmosphere: "terror",
    text: `El panel exige dos acciones simultáneas: cerrar el canal y borrar la última referencia del operador.

Cerrar el canal es sencillo.

La referencia eres tú.

En la pantalla auxiliar aparece una silueta compuesta por fragmentos de tus recuerdos. Todavía no tiene suficiente información para moverse sin que la observes.`,
    choices: [
      choice("hard-sever", "Romper el panel antes de que complete la silueta", "ending_broken", {
        effects: [{ type: "sanity", amount: -18 }],
      }),
      choice("clean-isolation", "Aislar la antena y borrar la copia local", "ending_survivor", {
        requirements: [
          { type: "hasFlag", flag: "learned_rule" },
          { type: "minSanity", value: 42 },
        ],
        hiddenWhenUnavailable: true,
        effects: [{ type: "sanity", amount: 8 }],
      }),
      choice("wait-for-shape", "Esperar a que la silueta termine de formarse", "ending_consumed", {
        requirements: [{ type: "maxSanity", value: 25 }],
        hiddenWhenUnavailable: true,
        effects: [{ type: "sanity", amount: -30 }],
      }),
    ],
  },

  hold_breath: {
    id: "hold_breath",
    title: "PUNTO CIEGO",
    location: "Sala de control — Sin respuesta del operador",
    atmosphere: "dread",
    text: `No te mueves. No respondes. No miras.

La presencia prueba distintos sonidos para obligarte a darle una posición: una sirena afuera, pasos en el techo, tu madre pronunciando tu nombre desde el pasillo.

Cada sonido termina exactamente al llegar al borde de tu atención.

La señal no sabe dónde estás si tú no decides dónde está ella.`,
    textVariants: [
      {
        requirements: [
          { type: "hasFlag", flag: "read_manual" },
          { type: "hasFlag", flag: "obeyed_protocol" },
          { type: "lacksFlag", flag: "looked_directly" },
          { type: "minSanity", value: 45 },
        ],
        text: `No te mueves. No respondes. No miras.

La señal repite todos los recursos que aprendió de otros operadores: voces, reflejos, pasos, súplicas.

Tú reconoces el error del protocolo. Contar hasta diecinueve no sirve para esperar.

Sirve para producir diecinueve intervalos sin observación. Un punto ciego lo bastante largo como para que el sistema olvide quién estaba mirando a quién.`,
      },
    ],
    choices: [
      choice("follow-siren", "Seguir la sirena sin mirar las pantallas", "ending_survivor", {
        effects: [{ type: "sanity", amount: 10 }],
      }),
      choice("break-auxiliary", "Destruir la terminal auxiliar y correr", "ending_broken", {
        effects: [{ type: "sanity", amount: -10 }],
      }),
      choice("reverse-count", "Contar desde diecinueve hacia atrás, sin concederle una posición", "ending_master", {
        requirements: [
          { type: "hasFlag", flag: "read_manual" },
          { type: "hasFlag", flag: "obeyed_protocol" },
          { type: "hasFlag", flag: "refused_command" },
          { type: "lacksFlag", flag: "looked_directly" },
          { type: "minSanity", value: 45 },
        ],
        hiddenWhenUnavailable: true,
        effects: [{ type: "sanity", amount: 15 }],
      }),
    ],
  },

  /* ═══════════════════════ FINALES ═══════════════════════ */
  ending_consumed: {
    id: "ending_consumed",
    title: "REFERENCIA COMPLETA",
    location: "MACROSCOP — Observador persistente",
    atmosphere: "end",
    isEnding: true,
    endingType: "consumed",
    endingTitle: "FINAL I — TE APRENDIÓ",
    endingSummary:
      "La señal no necesitaba atravesar la pantalla. Necesitaba suficiente información para continuar sin ti. Desde esa noche, cada cámara, reflejo y monitor puede reconstruir una versión exacta de tu mirada. Tú sigues vivo. Lo inquietante es que ya no eres la única cosa que recuerda haber sido tú.",
    rewardRank: "Referencia Persistente",
    rewardCode: "K19-0BSERVED",
  },

  ending_lost: {
    id: "ending_lost",
    title: "COORDENADAS AUSENTES",
    location: "Entre dos fotogramas de la señal",
    atmosphere: "end",
    isEnding: true,
    endingType: "lost",
    endingTitle: "FINAL II — FUERA DE TRANSMISIÓN",
    endingSummary:
      "Elegiste una salida construida con un recuerdo, no con arquitectura. Ahora avanzas por el espacio entre una imagen y la siguiente. A veces K-19 aparece durante un solo fotograma. Nunca permanece el tiempo suficiente para que puedas volver.",
    rewardRank: "Operador Sin Coordenadas",
    rewardCode: "K19-N0-SIGNAL",
  },

  ending_broken: {
    id: "ending_broken",
    title: "ENLACE INTERRUMPIDO",
    location: "Observatorio K-19 — Registro incompleto",
    atmosphere: "end",
    isEnding: true,
    endingType: "broken",
    endingTitle: "FINAL III — COPIA INCOMPLETA",
    endingSummary:
      "Rompiste el enlace antes de que la señal terminara de copiarte. Sobreviviste, pero algo quedó repartido entre ambos lados. Hay recuerdos que ya no poseen imagen y palabras que solo puedes pronunciar cuando una pantalla cercana está encendida.",
    rewardRank: "Superviviente Incompleto",
    rewardCode: "K19-BR0KEN",
  },

  ending_survivor: {
    id: "ending_survivor",
    title: "AMANECER SIN REGISTRO",
    location: "Exterior — Coordenadas de K-19",
    atmosphere: "end",
    isEnding: true,
    endingType: "survivor",
    endingTitle: "FINAL IV — SALISTE DEL ENCUADRE",
    endingSummary:
      "Llegaste al exterior sin concederle una última mirada. Al amanecer, los mapas no muestran ningún observatorio en esas coordenadas. Conservas la grabación de tu contrato, pero la firma pertenece a alguien que usa tu nombre y una letra casi idéntica.",
    rewardRank: "Operador No Localizado",
    rewardCode: "K19-0UTSIDE",
  },

  ending_master: {
    id: "ending_master",
    title: "PUNTO CIEGO ESTABLE",
    location: "MACROSCOP — Sesión sin observador",
    atmosphere: "end",
    isEnding: true,
    endingType: "master",
    endingTitle: "FINAL SECRETO — NADIE ESTABA MIRANDO",
    endingSummary:
      "No venciste a la presencia. Le negaste la relación que necesitaba para existir aquí. Durante diecinueve intervalos no hubo observador ni objeto observado; solo una señal incapaz de decidir de qué lado estaba. Cuando abriste los ojos, la terminal mostraba una nueva categoría de acceso: OPERADOR NULO. Desde entonces puedes detectar las sesiones antes de que comiencen.",
    rewardRank: "Operador Nulo",
    rewardCode: "K19-BL1NDSP0T",
  },
};

export function validateMacrocosmosStory(story: StoryGraph = MACROSCOP_STORY): string[] {
  const errors: string[] = [];
  const ids = new Set(Object.keys(story));

  for (const [key, node] of Object.entries(story)) {
    if (node.id !== key) {
      errors.push(`El nodo "${key}" declara el id "${node.id}".`);
    }

    for (const item of node.choices ?? []) {
      if (!ids.has(item.targetNodeId)) {
        errors.push(`La elección "${item.id}" de "${key}" apunta a "${item.targetNodeId}".`);
      }

      for (const route of item.routes ?? []) {
        if (!ids.has(route.targetNodeId)) {
          errors.push(`La ruta de "${item.id}" apunta a "${route.targetNodeId}".`);
        }
      }
    }

    if (node.timer && !ids.has(node.timer.targetNodeId)) {
      errors.push(`El temporizador de "${key}" apunta a "${node.timer.targetNodeId}".`);
    }
  }

  return errors;
}