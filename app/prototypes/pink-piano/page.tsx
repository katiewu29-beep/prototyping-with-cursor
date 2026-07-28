"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import styles from "./styles.module.css";

type Waveform = "sine" | "square" | "sawtooth" | "triangle";

const C4_FREQ = 261.63;
const WHITE_OFFSETS = [0, 2, 4, 5, 7, 9, 11, 12] as const;
const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"] as const;
const WHITE_KEYS = ["a", "s", "d", "f", "g", "h", "j", "k"] as const;
const BLACK_KEYS = ["w", "e", "t", "y", "u"] as const;

const BLACK_LAYOUT = [
  { note: "C#", semi: 1, afterWhite: 0, keyIndex: 0 },
  { note: "D#", semi: 3, afterWhite: 1, keyIndex: 1 },
  { note: "F#", semi: 6, afterWhite: 3, keyIndex: 2 },
  { note: "G#", semi: 8, afterWhite: 4, keyIndex: 3 },
  { note: "A#", semi: 10, afterWhite: 5, keyIndex: 4 },
] as const;

function semiToFreq(semiFromC4: number) {
  return C4_FREQ * Math.pow(2, semiFromC4 / 12);
}

function buildKeyboard() {
  const whites: { note: string; freq: number; key: string }[] = [];
  const blacks: { note: string; freq: number; key: string; whiteIndex: number }[] =
    [];

  for (let i = 0; i < 8; i++) {
    const semi = WHITE_OFFSETS[i];
    const note = i === 7 ? "C" : NOTE_NAMES[i];
    whites.push({
      note,
      freq: semiToFreq(semi),
      key: WHITE_KEYS[i],
    });
  }
  for (const b of BLACK_LAYOUT) {
    blacks.push({
      note: b.note,
      freq: semiToFreq(b.semi),
      key: BLACK_KEYS[b.keyIndex],
      whiteIndex: b.afterWhite,
    });
  }

  return { whites, blacks };
}

const { whites: WHITE_NOTES, blacks: BLACK_NOTES } = buildKeyboard();

const ALL_KEYS = [...WHITE_NOTES, ...BLACK_NOTES];

/** Resolve a keyboard key by note name (C4 vs C5 via which). */
function keyByNote(note: string, which: "low" | "high" = "low") {
  if (note === "C") {
    return which === "high" ? WHITE_NOTES[7] : WHITE_NOTES[0];
  }
  const found = ALL_KEYS.find((k) => k.note === note);
  if (!found) {
    throw new Error(`Missing key: ${note}`);
  }
  return found;
}

type TuneStep = {
  note: string;
  keyFreq: number;
  /** Concert pitch to play (may be above the 1-octave keyboard). */
  playFreq: number;
  durationMs: number;
};

type Tune = {
  id: string;
  title: string;
  notes: TuneStep[];
};

function step(
  note: string,
  durationMs: number,
  which: "low" | "high" = "low",
  playSemiFromC4?: number
): TuneStep {
  const key = keyByNote(note, which);
  const playFreq =
    playSemiFromC4 !== undefined ? semiToFreq(playSemiFromC4) : key.freq;
  return { note: key.note, keyFreq: key.freq, playFreq, durationMs };
}

/**
 * Für Elise (Beethoven) — opening, ~8s.
 * Iconic motif is E5–D♯5…; we highlight the matching keys on our C4–C5
 * keyboard while sounding the concert pitches (E5 etc.).
 * Sources: standard A-minor opening (E–D♯–E–D♯–E–B–D–C–A …).
 */
const FUR_ELISE_NOTES: TuneStep[] = [
  // Motif (sixteenth-feel)
  step("E", 160, "low", 16), // E5
  step("D#", 160, "low", 15), // D#5
  step("E", 160, "low", 16),
  step("D#", 160, "low", 15),
  step("E", 160, "low", 16),
  step("B", 160, "low", 11), // B4
  step("D", 160, "low", 14), // D5 → light D key
  step("C", 160, "high", 12), // C5
  step("A", 420, "low", 9), // A4
  // Answer phrase
  step("C", 160, "low", 0),
  step("E", 160, "low", 4),
  step("A", 160, "low", 9),
  step("B", 420, "low", 11),
  step("E", 160, "low", 4),
  step("G#", 160, "low", 8),
  step("B", 160, "low", 11),
  step("C", 420, "high", 12),
  // Return to motif
  step("E", 160, "low", 4),
  step("E", 160, "low", 16),
  step("D#", 160, "low", 15),
  step("E", 160, "low", 16),
  step("D#", 160, "low", 15),
  step("E", 160, "low", 16),
  step("B", 160, "low", 11),
  step("D", 160, "low", 14),
  step("C", 160, "high", 12),
  step("A", 500, "low", 9),
];

/**
 * Twinkle Twinkle Little Star — C major, first four phrases (~9s).
 * C C G G A A G | F F E E D D C | G G F F E E D | G G F F E E D
 * (quarter + held phrase endings)
 */
const Q = 280;
const H = 560;

const TWINKLE_NOTES: TuneStep[] = [
  // Twinkle twinkle little star
  step("C", Q),
  step("C", Q),
  step("G", Q),
  step("G", Q),
  step("A", Q),
  step("A", Q),
  step("G", H),
  // How I wonder what you are
  step("F", Q),
  step("F", Q),
  step("E", Q),
  step("E", Q),
  step("D", Q),
  step("D", Q),
  step("C", H),
  // Up above the world so high
  step("G", Q),
  step("G", Q),
  step("F", Q),
  step("F", Q),
  step("E", Q),
  step("E", Q),
  step("D", H),
  // Like a diamond in the sky
  step("G", Q),
  step("G", Q),
  step("F", Q),
  step("F", Q),
  step("E", Q),
  step("E", Q),
  step("D", H),
];

/**
 * Ode to Joy (Beethoven) — C major opening, two phrases (~8s).
 * E E F G G F E D C C D E E D D |
 * E E F G G F E D C C D E D C C
 */
const OQ = 300;
const OH = 520;

const ODE_TO_JOY_NOTES: TuneStep[] = [
  step("E", OQ),
  step("E", OQ),
  step("F", OQ),
  step("G", OQ),
  step("G", OQ),
  step("F", OQ),
  step("E", OQ),
  step("D", OQ),
  step("C", OQ),
  step("C", OQ),
  step("D", OQ),
  step("E", OQ),
  step("E", OQ),
  step("D", OQ),
  step("D", OH),
  // Second phrase
  step("E", OQ),
  step("E", OQ),
  step("F", OQ),
  step("G", OQ),
  step("G", OQ),
  step("F", OQ),
  step("E", OQ),
  step("D", OQ),
  step("C", OQ),
  step("C", OQ),
  step("D", OQ),
  step("E", OQ),
  step("D", OQ),
  step("C", OQ),
  step("C", OH),
];

const TUNES: Tune[] = [
  { id: "fur-elise", title: "Für Elise", notes: FUR_ELISE_NOTES },
  { id: "twinkle", title: "Twinkle Twinkle", notes: TWINKLE_NOTES },
  { id: "ode-to-joy", title: "Ode to Joy", notes: ODE_TO_JOY_NOTES },
];

const WAVEFORMS: Waveform[] = ["sine", "square", "sawtooth", "triangle"];

function parseNoteId(id: string): number | null {
  const dash = id.lastIndexOf("-");
  if (dash === -1) return null;
  const baseFreq = parseFloat(id.slice(dash + 1));
  return Number.isFinite(baseFreq) ? baseFreq : null;
}

function sampleWaveform(type: Waveform, phase: number): number {
  switch (type) {
    case "sine":
      return Math.sin(phase);
    case "square":
      return Math.sin(phase) >= 0 ? 0.92 : -0.92;
    case "sawtooth": {
      const t = (phase / (2 * Math.PI)) % 1;
      return 2 * (t < 0 ? t + 1 : t) - 1;
    }
    case "triangle":
      return (2 / Math.PI) * Math.asin(Math.sin(phase));
    default:
      return Math.sin(phase);
  }
}

function DisplayWave({
  frequencies,
  waveform,
}: {
  frequencies: number[];
  waveform: Waveform;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const ampRef = useRef(0);
  const freqRef = useRef(0);
  const waveformRef = useRef(waveform);
  const frequenciesRef = useRef(frequencies);

  useEffect(() => {
    waveformRef.current = waveform;
  }, [waveform]);

  useEffect(() => {
    frequenciesRef.current = frequencies;
  }, [frequencies]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const freqs = frequenciesRef.current;
      const playing = freqs.length > 0;
      const targetFreq = playing
        ? freqs.reduce((sum, f) => sum + f, 0) / freqs.length
        : 0;

      if (playing) {
        freqRef.current += (targetFreq - freqRef.current) * 0.12;
        ampRef.current += (1 - ampRef.current) * 0.1;
        if (freqRef.current > 0) {
          phaseRef.current += 2 * Math.PI * freqRef.current * dt;
        }
      } else {
        freqRef.current = 0;
        const idleAmp = 0.35;
        if (Math.abs(ampRef.current - idleAmp) > 0.002) {
          ampRef.current += (idleAmp - ampRef.current) * 0.1;
        } else {
          ampRef.current = idleAmp;
        }
      }

      const freq = freqRef.current;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const midY = h * 0.5;
      const ampPx = h * 0.32 * ampRef.current;
      const idleCycles = 3;
      const cycles = playing
        ? Math.min(10, Math.max(2, freq / 70))
        : idleCycles;

      ctx.clearRect(0, 0, w, h);

      const wave = waveformRef.current;
      const glow = "rgba(224, 122, 171, 0.9)";
      const glowSoft = "rgba(255, 230, 243, 0.28)";

      const plotWave = (alpha: number, blur: number, width: number) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = glow;
        ctx.shadowColor = glow;
        ctx.shadowBlur = blur;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const norm = x / w;
          let sample = 0;
          if (freqs.length > 0) {
            for (const f of freqs) {
              const localCycles = Math.min(10, Math.max(2, f / 70));
              const phase =
                phaseRef.current + norm * localCycles * 2 * Math.PI;
              sample += sampleWaveform(wave, phase);
            }
            sample /= freqs.length;
          } else {
            sample = sampleWaveform(
              wave,
              phaseRef.current + norm * cycles * 2 * Math.PI
            );
          }
          const y = midY - sample * ampPx;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      };

      plotWave(playing ? 0.28 : 0.12, playing ? 12 : 8, playing ? 2 : 1.25);
      plotWave(playing ? 0.16 : 0.06, playing ? 5 : 3, 1);

      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = glowSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(w, midY);
      ctx.stroke();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.displayWave}
      aria-hidden="true"
    />
  );
}

export default function PinkPianoPrototype() {
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [waveform, setWaveform] = useState<Waveform>("sine");
  const [octave, setOctave] = useState(0);
  const [volume, setVolume] = useState(0.4);
  const [selectedTuneId, setSelectedTuneId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(
    new Map()
  );
  const waveformRef = useRef(waveform);
  const octaveRef = useRef(octave);
  const volumeRef = useRef(volume);
  const tuneTimerRef = useRef<number | null>(null);
  const tuneIndexRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    waveformRef.current = waveform;
  }, [waveform]);

  useEffect(() => {
    octaveRef.current = octave;
  }, [octave]);

  useEffect(() => {
    volumeRef.current = volume;
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const ensureAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = volumeRef.current;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
    }
    if (audioCtxRef.current.state === "suspended") {
      void audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const noteId = useCallback((note: string, freq: number) => `${note}-${freq}`, []);

  const startNote = useCallback(
    (note: string, baseFreq: number, playFreq?: number) => {
      const id = noteId(note, baseFreq);
      if (oscillatorsRef.current.has(id)) return;

      const ctx = ensureAudio();
      const master = masterGainRef.current;
      if (!master) return;

      const freq =
        playFreq ?? baseFreq * Math.pow(2, octaveRef.current);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = waveformRef.current;
      osc.frequency.value = freq;

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.7, now + 0.02);

      osc.connect(gain);
      gain.connect(master);
      osc.start(now);

      oscillatorsRef.current.set(id, { osc, gain });
      setActiveNotes((prev) => new Set(prev).add(id));
    },
    [ensureAudio, noteId]
  );

  const stopNote = useCallback(
    (note: string, baseFreq: number) => {
      const id = noteId(note, baseFreq);
      const entry = oscillatorsRef.current.get(id);
      if (!entry) return;

      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const release = 0.12;
      const now = ctx.currentTime;
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
      entry.gain.gain.linearRampToValueAtTime(0, now + release);

      entry.osc.stop(now + release + 0.02);
      oscillatorsRef.current.delete(id);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [noteId]
  );

  const stopAllNotes = useCallback(() => {
    const ctx = audioCtxRef.current;
    oscillatorsRef.current.forEach(({ osc, gain }, id) => {
      try {
        if (ctx) {
          const now = ctx.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(gain.gain.value, now);
          gain.gain.linearRampToValueAtTime(0, now + 0.05);
          osc.stop(now + 0.07);
        } else {
          osc.stop();
        }
        osc.disconnect();
        gain.disconnect();
      } catch {
        /* already stopped */
      }
      void id;
    });
    oscillatorsRef.current.clear();
    setActiveNotes(new Set());
  }, []);

  const clearTuneTimer = useCallback(() => {
    if (tuneTimerRef.current !== null) {
      window.clearTimeout(tuneTimerRef.current);
      tuneTimerRef.current = null;
    }
  }, []);

  const pauseTune = useCallback(() => {
    clearTuneTimer();
    stopAllNotes();
    setIsPlaying(false);
  }, [clearTuneTimer, stopAllNotes]);

  const playTuneFrom = useCallback(
    (tune: Tune, index: number) => {
      if (!tune.notes.length) return;
      if (index >= tune.notes.length) {
        setIsPlaying(false);
        tuneIndexRef.current = 0;
        return;
      }
      if (!isPlayingRef.current && index > 0) {
        // paused before this tick
        return;
      }

      const stepNote = tune.notes[index];
      startNote(stepNote.note, stepNote.keyFreq, stepNote.playFreq);

      tuneTimerRef.current = window.setTimeout(() => {
        stopNote(stepNote.note, stepNote.keyFreq);
        const next = index + 1;
        tuneIndexRef.current = next;
        if (next >= tune.notes.length) {
          setIsPlaying(false);
          tuneIndexRef.current = 0;
          return;
        }
        tuneTimerRef.current = window.setTimeout(() => {
          if (isPlayingRef.current) {
            playTuneFrom(tune, next);
          }
        }, 30);
      }, stepNote.durationMs);
    },
    [startNote, stopNote]
  );

  const togglePlay = useCallback(() => {
    if (!selectedTuneId) return;
    const tune = TUNES.find((t) => t.id === selectedTuneId);
    if (!tune || !tune.notes.length) return;

    if (isPlaying) {
      pauseTune();
      return;
    }

    ensureAudio();
    setIsPlaying(true);
    isPlayingRef.current = true;
    playTuneFrom(tune, tuneIndexRef.current);
  }, [
    selectedTuneId,
    isPlaying,
    pauseTune,
    ensureAudio,
    playTuneFrom,
  ]);

  const selectTune = useCallback(
    (id: string) => {
      pauseTune();
      tuneIndexRef.current = 0;
      setSelectedTuneId(id);
    },
    [pauseTune]
  );

  useEffect(() => {
    const keyToNote = new Map<string, { note: string; freq: number }>();
    WHITE_NOTES.forEach((n) => keyToNote.set(n.key, { note: n.note, freq: n.freq }));
    BLACK_NOTES.forEach((n) => keyToNote.set(n.key, { note: n.note, freq: n.freq }));

    const held = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const mapping = keyToNote.get(e.key.toLowerCase());
      if (!mapping) return;
      e.preventDefault();
      const id = `${mapping.note}-${mapping.freq}`;
      if (held.has(id)) return;
      held.add(id);
      startNote(mapping.note, mapping.freq);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const mapping = keyToNote.get(e.key.toLowerCase());
      if (!mapping) return;
      e.preventDefault();
      const id = `${mapping.note}-${mapping.freq}`;
      held.delete(id);
      stopNote(mapping.note, mapping.freq);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [startNote, stopNote]);

  useEffect(() => {
    return () => {
      if (tuneTimerRef.current !== null) {
        window.clearTimeout(tuneTimerRef.current);
      }
      oscillatorsRef.current.forEach(({ osc, gain }) => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch {
          /* already stopped */
        }
      });
      oscillatorsRef.current.clear();
      void audioCtxRef.current?.close();
    };
  }, []);

  const isActive = (note: string, freq: number) =>
    activeNotes.has(noteId(note, freq));

  const activeFrequencies = Array.from(activeNotes)
    .map((id) => parseNoteId(id))
    .filter((f): f is number => f !== null)
    .map((base) => base * Math.pow(2, octave));

  const [controlsPos, setControlsPos] = useState({ x: 220, y: -40 });
  const [isDraggingControls, setIsDraggingControls] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowStart = useRef({ x: 0, y: 0 });

  const onControlsBarDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDraggingControls(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    windowStart.current = controlsPos;
  };

  const onDesktopMouseMove = (e: MouseEvent) => {
    if (!isDraggingControls) return;
    setControlsPos({
      x: windowStart.current.x + (e.clientX - dragStart.current.x),
      y: windowStart.current.y + (e.clientY - dragStart.current.y),
    });
  };

  const onDesktopMouseUp = () => {
    setIsDraggingControls(false);
  };

  return (
    <div
      className={styles.container}
      onMouseMove={onDesktopMouseMove}
      onMouseUp={onDesktopMouseUp}
      onMouseLeave={onDesktopMouseUp}
    >
      <div className={styles.buttonContainer}>
        <Link href="/" className={styles.backButton} aria-label="Back to home">
          <svg
            className={styles.backArrow}
            viewBox="0 0 12 12"
            width="12"
            height="12"
            aria-hidden="true"
          >
            {/* Classic Mac-style chunky left arrow */}
            <path
              fill="currentColor"
              d="M9 2v1H5V1L1 6l4 5V9h4v1h1V2H9z"
            />
          </svg>
        </Link>
      </div>

      <div className={styles.menubar}>
        <span className={styles.apple}></span>
        <span className={styles.menuItem}>File</span>
        <span className={styles.menuItem}>Edit</span>
        <span className={styles.menuItem}>Sound</span>
        <span className={styles.menuItem}>Special</span>
      </div>

      <div className={styles.desktop}>
        {/* Main synth window — width hugs 8 thin keys (same key width as 16-key / 2-octave) */}
        <div className={styles.window}>
          <div className={styles.windowBar}>
            <div className={styles.closeBox} aria-hidden="true" />
            <div className={styles.titleStripes} aria-hidden="true" />
            <div className={styles.windowTitle}>PinkSynth™</div>
            <div className={styles.titleStripes} aria-hidden="true" />
          </div>

          <div className={styles.windowContent}>
            <div className={styles.display}>
              <div className={styles.displayContent}>
                <div className={styles.displayLabel}>WAVEFORM</div>
                <div className={styles.displayMeta}>
                  OCT {octave >= 0 ? `+${octave}` : octave} · VOL{" "}
                  {Math.round(volume * 100)}%
                </div>
                <div className={styles.displayValue}>{waveform.toUpperCase()}</div>
              </div>
              <div className={styles.displayScope}>
                <DisplayWave frequencies={activeFrequencies} waveform={waveform} />
              </div>
            </div>

            <fieldset className={`${styles.controlGroup} ${styles.controlWave}`}>
              <legend>Wave</legend>
              <div className={styles.waveButtons} role="group" aria-label="Waveform">
                {WAVEFORMS.map((wave) => (
                  <button
                    key={wave}
                    type="button"
                    className={`${styles.macButton} ${
                      waveform === wave ? styles.macButtonActive : ""
                    }`}
                    onClick={() => setWaveform(wave)}
                    title={wave}
                  >
                    {wave === "sine" && "∿"}
                    {wave === "square" && "⊓"}
                    {wave === "sawtooth" && "⋀"}
                    {wave === "triangle" && "△"}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className={styles.controlsRow}>
              <fieldset className={`${styles.controlGroup} ${styles.wellOctave}`}>
                <legend>Octave</legend>
                <div className={styles.octaveRow}>
                  <button
                    type="button"
                    className={styles.macButton}
                    onClick={() => setOctave((o) => Math.max(-2, o - 1))}
                    aria-label="Lower octave"
                  >
                    −
                  </button>
                  <span className={styles.octaveValue}>
                    {octave >= 0 ? `+${octave}` : octave}
                  </span>
                  <button
                    type="button"
                    className={styles.macButton}
                    onClick={() => setOctave((o) => Math.min(2, o + 1))}
                    aria-label="Raise octave"
                  >
                    +
                  </button>
                </div>
              </fieldset>

              <fieldset className={`${styles.controlGroup} ${styles.wellVolume}`}>
                <legend>Volume</legend>
                <div className={styles.volumeRow}>
                  <span className={styles.volAffordance} aria-hidden="true" title="Quiet">
                    <svg
                      className={styles.volIconSvg}
                      viewBox="0 0 12 12"
                      width="12"
                      height="12"
                    >
                      {/* Quiet speaker — cone only */}
                      <path
                        fill="currentColor"
                        d="M1 4h2l3-2v8L3 8H1V4z"
                      />
                    </svg>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className={styles.slider}
                    style={{ ["--volume-pct" as string]: `${volume * 100}%` }}
                    aria-label="Volume"
                  />
                  <span className={styles.volAffordance} aria-hidden="true" title="Loud">
                    <svg
                      className={styles.volIconSvg}
                      viewBox="0 0 16 12"
                      width="16"
                      height="12"
                    >
                      {/* Loud speaker — cone + sound arcs */}
                      <path
                        fill="currentColor"
                        d="M1 4h2l3-2v8L3 8H1V4z"
                      />
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        d="M8 4.2c.9.7.9 2.9 0 3.6"
                      />
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.25"
                        d="M10.2 2.6c1.7 1.3 1.7 5.5 0 6.8"
                      />
                    </svg>
                  </span>
                </div>
              </fieldset>
            </div>

            <div
              className={styles.keyboard}
              role="group"
              aria-label="Piano keyboard"
            >
              <div className={styles.whiteKeys}>
                {WHITE_NOTES.map((n, i) => {
                  const id = noteId(n.note, n.freq);
                  return (
                    <button
                      key={`${id}-w-${i}`}
                      type="button"
                      className={`${styles.whiteKey} ${
                        isActive(n.note, n.freq) ? styles.keyActive : ""
                      }`}
                      onMouseDown={() => startNote(n.note, n.freq)}
                      onMouseUp={() => stopNote(n.note, n.freq)}
                      onMouseLeave={() => stopNote(n.note, n.freq)}
                      onTouchStart={(e) => {
                        e.preventDefault();
                        startNote(n.note, n.freq);
                      }}
                      onTouchEnd={() => stopNote(n.note, n.freq)}
                      aria-label={`${n.note} key`}
                    >
                      <span className={styles.keyCapText}>
                        <span className={styles.keyNote}>{n.note}</span>
                        <span className={styles.keyBinding}>{n.key}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className={styles.blackKeys}>
                {BLACK_NOTES.map((n) => (
                  <button
                    key={`${n.note}-${n.freq}`}
                    type="button"
                    className={`${styles.blackKey} ${
                      isActive(n.note, n.freq) ? styles.blackKeyActive : ""
                    }`}
                    style={{
                      left: `calc((100% / 8) * ${n.whiteIndex + 0.65})`,
                    }}
                    onMouseDown={() => startNote(n.note, n.freq)}
                    onMouseUp={() => stopNote(n.note, n.freq)}
                    onMouseLeave={() => stopNote(n.note, n.freq)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startNote(n.note, n.freq);
                    }}
                    onTouchEnd={() => stopNote(n.note, n.freq)}
                    aria-label={`${n.note} key`}
                  >
                    <span className={styles.keyCapText}>
                      <span className={styles.keyNote}>{n.note}</span>
                      <span className={styles.keyBinding}>{n.key}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className={styles.hint}>
              Press keys or use keyboard: A S D F G H J K (white) · W E T Y U
              (black)
            </p>
          </div>
        </div>

        {/* Play a Tune — drag by title bar */}
        <div
          className={`${styles.window} ${styles.tuneWindow}`}
          style={{
            transform: `translate(${controlsPos.x}px, ${controlsPos.y}px)`,
            cursor: isDraggingControls ? "grabbing" : undefined,
          }}
        >
          <div
            className={styles.windowBar}
            onMouseDown={onControlsBarDown}
            style={{ cursor: isDraggingControls ? "grabbing" : "grab" }}
          >
            <div className={styles.closeBox} aria-hidden="true" />
            <div className={styles.titleStripes} aria-hidden="true" />
            <div className={styles.windowTitle}>Play a Tune</div>
            <div className={styles.titleStripes} aria-hidden="true" />
          </div>

          <div className={`${styles.windowContent} ${styles.tunePanel}`}>
            <div className={styles.songWell}>
              <div className={styles.songLabel}>Song</div>
              <div className={styles.songList} role="radiogroup" aria-label="Song">
                {TUNES.map((tune) => {
                  const selected = selectedTuneId === tune.id;
                  const ready = tune.notes.length > 0;
                  return (
                    <label
                      key={tune.id}
                      className={`${styles.songOption} ${
                        selected ? styles.songOptionSelected : ""
                      } ${!ready ? styles.songOptionMuted : ""}`}
                    >
                      <input
                        type="radio"
                        name="tune"
                        className={styles.songRadioInput}
                        checked={selected}
                        onChange={() => selectTune(tune.id)}
                      />
                      <span
                        className={`${styles.songMark} ${
                          selected ? styles.songMarkOn : ""
                        }`}
                        aria-hidden="true"
                      />
                      <span className={styles.songTitle}>{tune.title}</span>
                      {!ready ? (
                        <span className={styles.songSoon}>soon</span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className={styles.playWell}>
              <button
                type="button"
                className={`${styles.ipodPlay} ${
                  isPlaying ? styles.ipodPlayActive : ""
                }`}
                disabled={
                  !selectedTuneId ||
                  !TUNES.find((t) => t.id === selectedTuneId)?.notes.length
                }
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <svg
                    className={styles.transportIcon}
                    viewBox="0 0 12 12"
                    width="11"
                    height="11"
                    aria-hidden="true"
                  >
                    <rect x="2" y="1" width="3" height="10" fill="currentColor" />
                    <rect x="7" y="1" width="3" height="10" fill="currentColor" />
                  </svg>
                ) : (
                  <svg
                    className={styles.transportIcon}
                    viewBox="0 0 12 12"
                    width="11"
                    height="11"
                    aria-hidden="true"
                  >
                    <path fill="currentColor" d="M3 1v10l8-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
