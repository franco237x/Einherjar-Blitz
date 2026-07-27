"use client";

import "./macrocosmos.css";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { MACROSCOP_STORY } from "@/data/macrocosmosStory";
import type { StoryChoice, StoryNode } from "@/data/macrocosmosStory";

/* ═══════════════════════════════════════════════════════════════
   MACROSCOP — MOTOR DE FICCIÓN INTERACTIVA
   Compatible con el esquema narrativo actual.
   ═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = "macroscop_endings";
const START_NODE_ID = "start";
const TOTAL_ENDINGS = 5;

const ATMOSPHERE_CLASS: Record<NonNullable<StoryNode["atmosphere"]>, string> = {
  calm: "atm-calm",
  unease: "atm-unease",
  dread: "atm-dread",
  terror: "atm-terror",
  void: "atm-void",
  end: "atm-end",
};

/**
 * Compatibilidad temporal para errores de destino presentes en la historia
 * original. Debe eliminarse cuando macrocosmosStory.ts quede validado.
 */
const LEGACY_NODE_ALIASES: Record<string, string> = {
  broken: "ending_broken",
};

type GamePhase =
  | "title"
  | "typing"
  | "voice"
  | "choosing"
  | "ending";

type EndingType = NonNullable<StoryNode["endingType"]>;

type SoundCue =
  | "click"
  | "impact"
  | "heartbeat"
  | "glitch"
  | "whisper"
  | "relief"
  | "void";

interface GameState {
  phase: GamePhase;
  currentNodeId: string;
  sanity: number;
  displayedText: string;
  voiceText: string;
  discoveredEndings: EndingType[];
  endingsLoaded: boolean;
  audioEnabled: boolean;
  copiedCode: boolean;
  glitchActive: boolean;
  jumpscareActive: boolean;
  shakeActive: boolean;
  timerLeft: number | null;
}

type GameAction =
  | { type: "START_GAME" }
  | { type: "RESTART_GAME" }
  | { type: "SET_NODE"; nodeId: string }
  | { type: "SET_PHASE"; phase: GamePhase }
  | { type: "SET_TEXT"; text: string }
  | { type: "SET_VOICE"; text: string }
  | { type: "CHANGE_SANITY"; amount: number }
  | { type: "SET_SANITY"; value: number }
  | { type: "SET_TIMER"; value: number | null }
  | { type: "SET_AUDIO"; enabled: boolean }
  | { type: "SET_GLITCH"; active: boolean }
  | { type: "SET_JUMPSCARE"; active: boolean }
  | { type: "SET_SHAKE"; active: boolean }
  | { type: "SET_COPIED"; copied: boolean }
  | { type: "LOAD_ENDINGS"; endings: EndingType[] }
  | { type: "DISCOVER_ENDING"; ending: EndingType };

const initialState: GameState = {
  phase: "title",
  currentNodeId: START_NODE_ID,
  sanity: 100,
  displayedText: "",
  voiceText: "",
  discoveredEndings: [],
  endingsLoaded: false,
  audioEnabled: false,
  copiedCode: false,
  glitchActive: false,
  jumpscareActive: false,
  shakeActive: false,
  timerLeft: null,
};

function clampSanity(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...state,
        phase: "typing",
        currentNodeId: START_NODE_ID,
        sanity: 100,
        displayedText: "",
        voiceText: "",
        copiedCode: false,
        timerLeft: null,
      };

    case "RESTART_GAME":
      return {
        ...state,
        phase: "typing",
        currentNodeId: START_NODE_ID,
        sanity: 100,
        displayedText: "",
        voiceText: "",
        copiedCode: false,
        glitchActive: false,
        jumpscareActive: false,
        shakeActive: false,
        timerLeft: null,
      };

    case "SET_NODE":
      return { ...state, currentNodeId: action.nodeId };

    case "SET_PHASE":
      return { ...state, phase: action.phase };

    case "SET_TEXT":
      return { ...state, displayedText: action.text };

    case "SET_VOICE":
      return { ...state, voiceText: action.text };

    case "CHANGE_SANITY":
      return { ...state, sanity: clampSanity(state.sanity + action.amount) };

    case "SET_SANITY":
      return { ...state, sanity: clampSanity(action.value) };

    case "SET_TIMER":
      return { ...state, timerLeft: action.value };

    case "SET_AUDIO":
      return { ...state, audioEnabled: action.enabled };

    case "SET_GLITCH":
      return { ...state, glitchActive: action.active };

    case "SET_JUMPSCARE":
      return { ...state, jumpscareActive: action.active };

    case "SET_SHAKE":
      return { ...state, shakeActive: action.active };

    case "SET_COPIED":
      return { ...state, copiedCode: action.copied };

    case "LOAD_ENDINGS":
      return {
        ...state,
        discoveredEndings: action.endings,
        endingsLoaded: true,
      };

    case "DISCOVER_ENDING":
      if (state.discoveredEndings.includes(action.ending)) return state;
      return {
        ...state,
        discoveredEndings: [...state.discoveredEndings, action.ending],
      };

    default:
      return state;
  }
}

function resolveNodeId(nodeId: string): string {
  if (MACROSCOP_STORY[nodeId]) return nodeId;

  const alias = LEGACY_NODE_ALIASES[nodeId];
  if (alias && MACROSCOP_STORY[alias]) {
    console.warn(
      `[MACROSCOP] El destino "${nodeId}" no existe. Se usó temporalmente "${alias}".`,
    );
    return alias;
  }

  console.error(
    `[MACROSCOP] El destino "${nodeId}" no existe. Se regresó al inicio para evitar bloquear la partida.`,
  );
  return START_NODE_ID;
}

function getNode(nodeId: string): StoryNode {
  return MACROSCOP_STORY[resolveNodeId(nodeId)] ?? MACROSCOP_STORY[START_NODE_ID];
}

function validateStoryGraph(): void {
  if (process.env.NODE_ENV === "production") return;

  for (const [nodeId, node] of Object.entries(MACROSCOP_STORY)) {
    for (const choice of node.choices ?? []) {
      const directTargetExists = Boolean(MACROSCOP_STORY[choice.targetNodeId]);
      const alias = LEGACY_NODE_ALIASES[choice.targetNodeId];
      const aliasTargetExists = Boolean(alias && MACROSCOP_STORY[alias]);

      if (!directTargetExists && !aliasTargetExists) {
        console.error(
          `[MACROSCOP] El nodo "${nodeId}" apunta a "${choice.targetNodeId}", que no existe.`,
        );
      } else if (!directTargetExists && aliasTargetExists) {
        console.warn(
          `[MACROSCOP] El nodo "${nodeId}" usa el alias temporal "${choice.targetNodeId}" → "${alias}".`,
        );
      }
    }
  }
}

function useHorrorAudio(enabled: boolean) {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;

    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextClass) return null;
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === "suspended") {
      void audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (
      frequencyStart: number,
      frequencyEnd: number,
      duration: number,
      oscillatorType: OscillatorType,
      volume: number,
    ) => {
      if (!enabled) return;

      const context = getAudioContext();
      if (!context) return;

      try {
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        oscillator.type = oscillatorType;
        oscillator.frequency.setValueAtTime(frequencyStart, now);
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(20, frequencyEnd),
          now + duration,
        );

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(1800, now);
        filter.frequency.exponentialRampToValueAtTime(220, now + duration);

        gain.gain.setValueAtTime(Math.max(0.001, volume), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        oscillator.start(now);
        oscillator.stop(now + duration);
      } catch {
        // El audio es atmosférico; nunca debe bloquear la partida.
      }
    },
    [enabled, getAudioContext],
  );

  const playNoise = useCallback(
    (duration: number, volume: number) => {
      if (!enabled) return;

      const context = getAudioContext();
      if (!context) return;

      try {
        const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
        const buffer = context.createBuffer(1, frameCount, context.sampleRate);
        const channel = buffer.getChannelData(0);

        for (let index = 0; index < frameCount; index += 1) {
          channel[index] = (Math.random() * 2 - 1) * (1 - index / frameCount);
        }

        const source = context.createBufferSource();
        const gain = context.createGain();
        const filter = context.createBiquadFilter();

        source.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.value = 420;
        filter.Q.value = 0.7;
        gain.gain.setValueAtTime(volume, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + duration,
        );

        source.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);
        source.start();
      } catch {
        // Ignorar fallos de Web Audio.
      }
    },
    [enabled, getAudioContext],
  );

  const playSound = useCallback(
    (cue: SoundCue) => {
      switch (cue) {
        case "click":
          playTone(170, 90, 0.06, "sine", 0.08);
          break;
        case "impact":
          playTone(82, 24, 0.65, "sawtooth", 0.16);
          break;
        case "heartbeat":
          playTone(62, 34, 0.13, "triangle", 0.15);
          break;
        case "glitch":
          playTone(1250, 70, 0.09, "square", 0.07);
          break;
        case "whisper":
          playNoise(0.55, 0.035);
          break;
        case "relief":
          playTone(360, 520, 0.75, "sine", 0.09);
          break;
        case "void":
          playTone(48, 22, 1.2, "sine", 0.12);
          break;
      }
    },
    [playNoise, playTone],
  );

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return { getAudioContext, playSound };
}

interface HorrorEffectsProps {
  glitchActive: boolean;
  jumpscareActive: boolean;
}

function HorrorEffects({
  glitchActive,
  jumpscareActive,
}: HorrorEffectsProps) {
  return (
    <>
      {glitchActive ? <div className="glitch-overlay" aria-hidden="true" /> : null}
      {jumpscareActive ? (
        <div className="jumpscare-overlay" aria-hidden="true">
          <div className="jumpscare-face" />
        </div>
      ) : null}
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="scan-line-moving" aria-hidden="true" />
    </>
  );
}

interface TitleScreenProps {
  audioEnabled: boolean;
  clock: string;
  discoveredEndings: number;
  onAudioToggle: () => void;
  onStart: () => void;
}

function TitleScreen({
  audioEnabled,
  clock,
  discoveredEndings,
  onAudioToggle,
  onStart,
}: TitleScreenProps) {
  return (
    <div className="macrocosmos-body atm-unease">
      <HorrorEffects glitchActive={false} jumpscareActive={false} />

      <div className="game-container">
        <header className="terminal-header">
          <span className="terminal-red-text">MACROSCOP // SEÑAL K-19</span>
          <span className="terminal-amber">{clock}</span>
        </header>

        <section className="game-screen title-screen">
          <div className="title-art" aria-hidden="true">
            <pre className="ascii-art">{`
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
    ▓                           ▓
    ▓    M  A  C  R  O  S  C  O  P   ▓
    ▓                           ▓
    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
            `}</pre>
          </div>

          <p className="subtitle-flicker">
            Una señal imposible conoce el ritmo con el que naciste.
          </p>

          <div className="title-warning">
            <p className="terminal-red-dim">
              &gt; Contiene luz intermitente, sonidos graves y tensión psicológica.
            </p>
            <p className="terminal-dim">&gt; Duración estimada: 3–5 minutos.</p>
            <p className="terminal-dim">
              &gt; Expedientes recuperados: {discoveredEndings}/{TOTAL_ENDINGS}
            </p>
          </div>

          <div className="audio-toggle-title">
            <button
              type="button"
              onClick={onAudioToggle}
              className={`audio-btn ${audioEnabled ? "audio-on" : ""}`}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? "[ AUDIO ACTIVADO ]" : "[ ACTIVAR AUDIO ]"}
            </button>
          </div>

          <button type="button" onClick={onStart} className="start-button">
            [ INICIAR PROTOCOLO ]
          </button>

          <Link href="/" className="back-link">
            &lt; VOLVER A LA LANDING
          </Link>
        </section>
      </div>
    </div>
  );
}

interface GameHeaderProps {
  audioEnabled: boolean;
  clock: string;
  sanity: number;
  onAudioToggle: () => void;
}

function GameHeader({
  audioEnabled,
  clock,
  sanity,
  onAudioToggle,
}: GameHeaderProps) {
  return (
    <header className="terminal-header">
      <span className="terminal-red-text">
        MACROSCOP — INTEGRIDAD {Math.round(sanity)}%
      </span>

      <div className="header-right">
        <button
          type="button"
          onClick={onAudioToggle}
          className={`audio-btn-sm ${audioEnabled ? "audio-on" : ""}`}
          title={audioEnabled ? "Silenciar" : "Activar audio"}
          aria-label={audioEnabled ? "Silenciar audio" : "Activar audio"}
          aria-pressed={audioEnabled}
        >
          {audioEnabled ? "♪" : "×"}
        </button>
        <span className="terminal-amber">{clock}</span>
      </div>
    </header>
  );
}

interface SanityMeterProps {
  sanity: number;
  draining: boolean;
}

function SanityMeter({ sanity, draining }: SanityMeterProps) {
  const roundedSanity = Math.round(sanity);

  return (
    <div className="status-bar">
      <div className="status-item">
        <span>INTEGRIDAD DE SEÑAL</span>
        <div
          className="bar-container"
          role="progressbar"
          aria-label="Integridad mental"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedSanity}
        >
          <div
            className="bar sanity-bar"
            style={{
              width: `${roundedSanity}%`,
              backgroundColor:
                sanity < 25 ? "#a43131" : sanity < 55 ? "#9b7a46" : "#a99b7b",
              boxShadow:
                sanity < 25
                  ? "0 0 14px rgba(164,49,49,0.65)"
                  : "0 0 8px rgba(169,155,123,0.35)",
            }}
          />
        </div>
      </div>

      {draining ? (
        <div className="status-item status-warning" aria-live="polite">
          <span>SEÑAL INVASIVA</span>
        </div>
      ) : null}
    </div>
  );
}

interface ChoiceListProps {
  choices: StoryChoice[];
  sanity: number;
  disabled: boolean;
  onChoose: (choice: StoryChoice) => void;
}

function ChoiceList({
  choices,
  sanity,
  disabled,
  onChoose,
}: ChoiceListProps) {
  return (
    <div className="choices-container">
      {choices.map((choice, index) => {
        const lacksSanity =
          typeof choice.reqSanity === "number" && sanity < choice.reqSanity;
        const isDisabled = disabled || lacksSanity;
        const choiceKey = `${choice.targetNodeId}:${choice.text}`;

        return (
          <button
            type="button"
            key={choiceKey}
            disabled={isDisabled}
            onClick={() => onChoose(choice)}
            className={`choice-button ${lacksSanity ? "choice-disabled" : ""}`}
            style={{ animationDelay: `${index * 0.09}s` }}
          >
            <span className="choice-letter">
              {String.fromCharCode(65 + index)})
            </span>
            {choice.text}
            {lacksSanity ? (
              <span className="req-tag">
                [REQ. INTEGRIDAD {choice.reqSanity}%]
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface EndingScreenProps {
  node: StoryNode;
  sanity: number;
  score: number;
  copiedCode: boolean;
  discoveredEndings: number;
  onRestart: () => void;
  onCopy: () => void;
}

function EndingScreen({
  node,
  sanity,
  score,
  copiedCode,
  discoveredEndings,
  onRestart,
  onCopy,
}: EndingScreenProps) {
  const endingClass =
    node.endingType === "master"
      ? "ending-victory"
      : node.endingType === "survivor"
        ? "ending-survive"
        : "ending-death";

  return (
    <div className="ending-screen">
      <div className={`ending-badge ${endingClass}`}>{node.endingTitle}</div>

      <div className="ending-summary">{node.endingSummary}</div>

      <div className="score-card">
        <div className="score-card-header">╔══ EXPEDIENTE K-19 ══╗</div>
        <div className="score-card-rank">
          RANGO: <span className="rank-value">{node.rewardRank}</span>
        </div>

        <div className="score-card-stats">
          <div className="stat-box">
            <span className="stat-label">INTEGRIDAD</span>
            <span
              className="stat-value"
              style={{ color: sanity < 25 ? "#a43131" : "#a99b7b" }}
            >
              {Math.round(sanity)}%
            </span>
          </div>

          <div className="stat-box">
            <span className="stat-label">PUNTOS</span>
            <span className="stat-value stat-score">{score}</span>
          </div>
        </div>

        <div className="reward-code-box">
          <span className="reward-label">CÓDIGO DE ARCHIVO:</span>
          <code className="reward-code">{node.rewardCode ?? "SIN-CODIGO"}</code>
        </div>

        <div className="score-card-footer">
          ╚══ EINHERJAR BLITZ • MACROSCOP ══╝
        </div>
      </div>

      <p className="screenshot-hint">
        La sesión terminó. La conexión quizá no.
      </p>

      <div className="ending-actions">
        <button
          type="button"
          onClick={onRestart}
          className="choice-button restart-button"
        >
          REINICIAR PROTOCOLO
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="choice-button copy-button"
        >
          {copiedCode ? "✓ EXPEDIENTE COPIADO" : "COPIAR EXPEDIENTE"}
        </button>

        <Link href="/" className="choice-button back-button">
          VOLVER A LA LANDING
        </Link>
      </div>

      <p className="terminal-dim" style={{ textAlign: "center", marginTop: 12 }}>
        Expedientes recuperados: {discoveredEndings}/{TOTAL_ENDINGS}
      </p>
    </div>
  );
}

export default function MacrocosmosPage() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const stateRef = useRef(state);
  const [clock, setClock] = useState("");

  const narrativeRef = useRef<HTMLDivElement | null>(null);
  const typingAbortRef = useRef(false);
  const sequenceRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drainRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const zeroSanityTriggeredRef = useRef(false);

  const currentNode = useMemo(
    () => getNode(state.currentNodeId),
    [state.currentNodeId],
  );

  const atmosphereClass =
    ATMOSPHERE_CLASS[currentNode.atmosphere ?? "unease"] ?? "atm-unease";

  const { getAudioContext, playSound } = useHorrorAudio(state.audioEnabled);

  const registerTimeout = useCallback(
    (callback: () => void, delay: number): ReturnType<typeof setTimeout> => {
      const timeout = setTimeout(() => {
        effectTimeoutsRef.current.delete(timeout);
        callback();
      }, delay);
      effectTimeoutsRef.current.add(timeout);
      return timeout;
    },
    [],
  );

  const clearChoiceTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (timerTimeoutRef.current) {
      clearTimeout(timerTimeoutRef.current);
      timerTimeoutRef.current = null;
    }
    dispatch({ type: "SET_TIMER", value: null });
  }, []);

  const clearSanityDrain = useCallback(() => {
    if (drainRef.current) {
      clearInterval(drainRef.current);
      drainRef.current = null;
    }
  }, []);

  const triggerGlitch = useCallback(
    (duration = 120) => {
      dispatch({ type: "SET_GLITCH", active: true });
      registerTimeout(
        () => dispatch({ type: "SET_GLITCH", active: false }),
        duration,
      );
    },
    [registerTimeout],
  );

  const triggerShake = useCallback(
    (duration = 360) => {
      dispatch({ type: "SET_SHAKE", active: true });
      registerTimeout(
        () => dispatch({ type: "SET_SHAKE", active: false }),
        duration,
      );
    },
    [registerTimeout],
  );

  const triggerJumpscare = useCallback(() => {
    dispatch({ type: "SET_JUMPSCARE", active: true });
    playSound("impact");
    triggerGlitch(170);
    triggerShake(420);
    registerTimeout(
      () => dispatch({ type: "SET_JUMPSCARE", active: false }),
      320,
    );
  }, [playSound, registerTimeout, triggerGlitch, triggerShake]);

  const typewrite = useCallback(
    async (text: string, sequence: number): Promise<boolean> => {
      typingAbortRef.current = false;
      dispatch({ type: "SET_PHASE", phase: "typing" });
      dispatch({ type: "SET_TEXT", text: "" });
      dispatch({ type: "SET_VOICE", text: "" });

      const baseDelay = 18;

      for (let index = 0; index <= text.length; index += 1) {
        if (sequence !== sequenceRef.current) return false;

        if (typingAbortRef.current) {
          dispatch({ type: "SET_TEXT", text });
          return true;
        }

        dispatch({ type: "SET_TEXT", text: text.slice(0, index) });

        if (narrativeRef.current) {
          narrativeRef.current.scrollTop = narrativeRef.current.scrollHeight;
        }

        const punctuation = text[index - 1];
        const punctuationDelay = /[.!?]/.test(punctuation ?? "") ? 80 : 0;
        const anomalyDelay = Math.random() < 0.045 ? 45 : 0;

        await new Promise<void>((resolve) => {
          registerTimeout(resolve, baseDelay + punctuationDelay + anomalyDelay);
        });

        if (Math.random() < 0.006) {
          triggerGlitch(70 + Math.random() * 70);
        }
      }

      return true;
    },
    [registerTimeout, triggerGlitch],
  );

  const playEndingCue = useCallback(
    (endingType?: StoryNode["endingType"]) => {
      switch (endingType) {
        case "master":
        case "survivor":
          playSound("relief");
          break;
        case "consumed":
        case "lost":
          playSound("void");
          break;
        case "broken":
          playSound("impact");
          break;
        default:
          break;
      }
    },
    [playSound],
  );

  const loadSceneRef = useRef<
    (
      nodeId: string,
      options?: { entryShockAlreadyPlayed?: boolean },
    ) => Promise<void>
  >(async () => undefined);

  const handleTimerExpired = useCallback(
    (nodeId: string) => {
      const node = getNode(nodeId);
      const currentState = stateRef.current;
      if (currentState.phase !== "choosing" || node.isEnding) return;

      const availableChoices = (node.choices ?? []).filter(
        (choice) =>
          typeof choice.reqSanity !== "number" ||
          currentState.sanity >= choice.reqSanity,
      );
      const fallback = availableChoices[0];

      dispatch({ type: "CHANGE_SANITY", amount: -12 });
      dispatch({ type: "SET_TIMER", value: null });
      triggerShake(420);
      triggerGlitch(180);
      playSound("impact");

      if (fallback) {
        void loadSceneRef.current(fallback.targetNodeId, {
          entryShockAlreadyPlayed: false,
        });
      }
    },
    [playSound, triggerGlitch, triggerShake],
  );

  const startChoiceTimer = useCallback(
    (nodeId: string, durationMs: number) => {
      clearChoiceTimer();

      const endAt = Date.now() + durationMs;
      dispatch({ type: "SET_TIMER", value: durationMs });

      timerIntervalRef.current = setInterval(() => {
        dispatch({
          type: "SET_TIMER",
          value: Math.max(0, endAt - Date.now()),
        });
      }, 100);

      timerTimeoutRef.current = setTimeout(() => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        timerTimeoutRef.current = null;
        handleTimerExpired(nodeId);
      }, durationMs);
    },
    [clearChoiceTimer, handleTimerExpired],
  );

  const startSanityDrain = useCallback(
    (amountPerSecond?: number) => {
      clearSanityDrain();
      if (!amountPerSecond || amountPerSecond <= 0) return;

      drainRef.current = setInterval(() => {
        dispatch({ type: "CHANGE_SANITY", amount: -amountPerSecond / 10 });
      }, 100);
    },
    [clearSanityDrain],
  );

  const loadScene = useCallback(
    async (
      requestedNodeId: string,
      options: { entryShockAlreadyPlayed?: boolean } = {},
    ) => {
      clearChoiceTimer();
      clearSanityDrain();
      typingAbortRef.current = true;

      const sequence = sequenceRef.current + 1;
      sequenceRef.current = sequence;

      const nodeId = resolveNodeId(requestedNodeId);
      const node = getNode(nodeId);

      dispatch({ type: "SET_NODE", nodeId });
      dispatch({ type: "SET_TIMER", value: null });
      dispatch({ type: "SET_VOICE", text: "" });

      if (node.sanityChange) {
        dispatch({ type: "CHANGE_SANITY", amount: node.sanityChange });
      }

      if (node.jumpscareOnEnter && !options.entryShockAlreadyPlayed) {
        triggerJumpscare();
      }

      const completed = await typewrite(node.text ?? "", sequence);
      if (!completed || sequence !== sequenceRef.current) return;

      if (node.voice) {
        dispatch({ type: "SET_VOICE", text: node.voice });
        dispatch({ type: "SET_PHASE", phase: "voice" });
        triggerShake(280);
        playSound("void");

        await new Promise<void>((resolve) => registerTimeout(resolve, 680));
        if (sequence !== sequenceRef.current) return;
      }

      if (node.isEnding) {
        dispatch({ type: "SET_PHASE", phase: "ending" });
        playEndingCue(node.endingType);

        if (node.endingType) {
          dispatch({ type: "DISCOVER_ENDING", ending: node.endingType });
        }
        return;
      }

      dispatch({ type: "SET_PHASE", phase: "choosing" });
      startSanityDrain(node.drainSanityPerSecond);

      if (node.timerMs) {
        startChoiceTimer(nodeId, node.timerMs);
      }
    },
    [
      clearChoiceTimer,
      clearSanityDrain,
      playEndingCue,
      playSound,
      registerTimeout,
      startChoiceTimer,
      startSanityDrain,
      triggerJumpscare,
      triggerShake,
      typewrite,
    ],
  );

  useEffect(() => {
    loadSceneRef.current = loadScene;
  }, [loadScene]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      if (state.phase !== "choosing") return;

      clearChoiceTimer();
      clearSanityDrain();
      dispatch({ type: "SET_PHASE", phase: "typing" });

      if (choice.sanityChange) {
        dispatch({ type: "CHANGE_SANITY", amount: choice.sanityChange });
      }

      const targetNode = getNode(choice.targetNodeId);
      const shouldShock = Boolean(choice.jumpscare || targetNode.jumpscareOnEnter);

      if (shouldShock) {
        triggerJumpscare();
      } else if ((choice.sanityChange ?? 0) < 0) {
        playSound("impact");
        triggerShake(260);
      } else {
        playSound("click");
      }

      void loadScene(choice.targetNodeId, {
        entryShockAlreadyPlayed: shouldShock,
      });
    },
    [
      clearChoiceTimer,
      clearSanityDrain,
      loadScene,
      playSound,
      state.phase,
      triggerJumpscare,
      triggerShake,
    ],
  );

  const toggleAudio = useCallback(() => {
    const nextValue = !state.audioEnabled;
    dispatch({ type: "SET_AUDIO", enabled: nextValue });

    if (nextValue) {
      getAudioContext();
    }
  }, [getAudioContext, state.audioEnabled]);

  const startGame = useCallback(() => {
    dispatch({ type: "START_GAME" });
    zeroSanityTriggeredRef.current = false;

    if (state.audioEnabled) {
      getAudioContext();
    }

    void loadScene(START_NODE_ID);
  }, [getAudioContext, loadScene, state.audioEnabled]);

  const restartGame = useCallback(() => {
    clearChoiceTimer();
    clearSanityDrain();
    dispatch({ type: "RESTART_GAME" });
    zeroSanityTriggeredRef.current = false;
    playSound("click");
    void loadScene(START_NODE_ID);
  }, [clearChoiceTimer, clearSanityDrain, loadScene, playSound]);

  const copyResults = useCallback(async () => {
    const roundedSanity = Math.round(state.sanity);
    const endingScore = Math.round(
      state.sanity * 20 +
        (currentNode.endingType === "master"
          ? 1500
          : currentNode.endingType === "survivor"
            ? 1000
            : currentNode.endingType === "broken"
              ? 600
              : currentNode.endingType === "lost"
                ? 300
                : 0),
    );

    const result = [
      "🎮 EINHERJAR BLITZ — MACROSCOP",
      `🏆 ${currentNode.rewardRank ?? "Sin rango"}`,
      `📊 Puntos: ${endingScore}`,
      `🧠 Integridad: ${roundedSanity}%`,
      `🔑 Código: ${currentNode.rewardCode ?? "SIN-CODIGO"}`,
      currentNode.endingTitle ?? "Sesión terminada",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(result);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    dispatch({ type: "SET_COPIED", copied: true });
    registerTimeout(
      () => dispatch({ type: "SET_COPIED", copied: false }),
      2200,
    );
  }, [currentNode, registerTimeout, state.sanity]);

  const score = useMemo(() => {
    if (!currentNode.isEnding) return 0;

    const endingBonus =
      currentNode.endingType === "master"
        ? 1500
        : currentNode.endingType === "survivor"
          ? 1000
          : currentNode.endingType === "broken"
            ? 600
            : currentNode.endingType === "lost"
              ? 300
              : 0;

    return Math.round(state.sanity * 20 + endingBonus);
  }, [currentNode, state.sanity]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    validateStoryGraph();
  }, []);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString("es-AR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        dispatch({ type: "LOAD_ENDINGS", endings: [] });
        return;
      }

      const parsed: unknown = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        dispatch({ type: "LOAD_ENDINGS", endings: [] });
        return;
      }

      const validEndings = parsed.filter(
        (value): value is EndingType =>
          value === "consumed" ||
          value === "lost" ||
          value === "broken" ||
          value === "survivor" ||
          value === "master",
      );

      dispatch({ type: "LOAD_ENDINGS", endings: [...new Set(validEndings)] });
    } catch {
      // Un guardado corrupto no debe bloquear el juego.
      dispatch({ type: "LOAD_ENDINGS", endings: [] });
    }
  }, []);

  useEffect(() => {
    if (!state.endingsLoaded) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state.discoveredEndings),
      );
    } catch {
      // La persistencia es opcional.
    }
  }, [state.discoveredEndings, state.endingsLoaded]);

  useEffect(() => {
    if (
      !state.audioEnabled ||
      state.phase === "title" ||
      state.phase === "ending" ||
      state.sanity > 55
    ) {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    const interval = Math.max(380, 450 + state.sanity * 10);
    heartbeatRef.current = setInterval(() => playSound("heartbeat"), interval);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [playSound, state.audioEnabled, state.phase, state.sanity]);

  useEffect(() => {
    if (state.phase === "title" || state.phase === "ending") return;

    const interval = setInterval(() => {
      const tension = 1 - state.sanity / 100;
      const roll = Math.random();

      if (roll < 0.015 + tension * 0.035) {
        triggerGlitch(70 + Math.random() * 100);
        playSound("glitch");
      } else if (roll < 0.025 + tension * 0.04 && state.audioEnabled) {
        playSound("whisper");
      }
    }, 3200);

    return () => clearInterval(interval);
  }, [
    playSound,
    state.audioEnabled,
    state.phase,
    state.sanity,
    triggerGlitch,
  ]);

  useEffect(() => {
    if (
      state.sanity <= 0 &&
      state.phase !== "title" &&
      state.phase !== "ending" &&
      !zeroSanityTriggeredRef.current
    ) {
      zeroSanityTriggeredRef.current = true;
      clearSanityDrain();
      triggerGlitch(700);
      triggerShake(650);
      playSound("void");
    }

    if (state.sanity > 0) {
      zeroSanityTriggeredRef.current = false;
    }
  }, [
    clearSanityDrain,
    playSound,
    state.phase,
    state.sanity,
    triggerGlitch,
    triggerShake,
  ]);

  useEffect(() => {
    return () => {
      sequenceRef.current += 1;
      typingAbortRef.current = true;
      clearChoiceTimer();
      clearSanityDrain();

      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      for (const timeout of effectTimeoutsRef.current) clearTimeout(timeout);
      effectTimeoutsRef.current.clear();
    };
  }, [clearChoiceTimer, clearSanityDrain]);

  if (state.phase === "title") {
    return (
      <TitleScreen
        audioEnabled={state.audioEnabled}
        clock={clock}
        discoveredEndings={state.discoveredEndings.length}
        onAudioToggle={toggleAudio}
        onStart={startGame}
      />
    );
  }

  const isTyping = state.phase === "typing";
  const showVoice = state.phase === "voice" || state.phase === "choosing";
  const showChoices = state.phase === "choosing";
  const isEnding = state.phase === "ending";

  return (
    <main className={`macrocosmos-body ${atmosphereClass}`}>
      <HorrorEffects
        glitchActive={state.glitchActive}
        jumpscareActive={state.jumpscareActive}
      />

      <div className={`game-container ${state.shakeActive ? "shake" : ""}`}>
        <GameHeader
          audioEnabled={state.audioEnabled}
          clock={clock}
          sanity={state.sanity}
          onAudioToggle={toggleAudio}
        />

        {!isEnding ? (
          <SanityMeter
            sanity={state.sanity}
            draining={Boolean(currentNode.drainSanityPerSecond)}
          />
        ) : null}

        <section className="game-screen" ref={narrativeRef}>
          <div className={`chapter-title ${isEnding ? "ending-title" : ""}`}>
            {currentNode.title}
          </div>

          <div className="location-tag">&gt; {currentNode.location}</div>

          <div className="narrative-text">
            {state.displayedText}
            {isTyping ? <span className="cursor-blink">█</span> : null}
          </div>

          {isTyping ? (
            <button
              type="button"
              className="skip-btn"
              onClick={() => {
                typingAbortRef.current = true;
              }}
            >
              [MOSTRAR TEXTO]
            </button>
          ) : null}

          {showVoice && state.voiceText ? (
            <div className="am-voice">
              <span className="am-text">{state.voiceText}</span>
            </div>
          ) : null}

          {showChoices &&
          currentNode.timerMs &&
          state.timerLeft !== null &&
          state.timerLeft > 0 ? (
            <div className="timer-bar" aria-label="Tiempo para decidir">
              <div
                className="timer-fill"
                style={{
                  width: `${Math.max(
                    0,
                    (state.timerLeft / currentNode.timerMs) * 100,
                  )}%`,
                }}
              />
              <span className="timer-label">LA SEÑAL ESTÁ ESPERANDO</span>
            </div>
          ) : null}

          {showChoices && currentNode.choices ? (
            <ChoiceList
              choices={currentNode.choices}
              sanity={state.sanity}
              disabled={state.jumpscareActive}
              onChoose={handleChoice}
            />
          ) : null}

          {isEnding ? (
            <EndingScreen
              node={currentNode}
              sanity={state.sanity}
              score={score}
              copiedCode={state.copiedCode}
              discoveredEndings={state.discoveredEndings.length}
              onRestart={restartGame}
              onCopy={() => void copyResults()}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}