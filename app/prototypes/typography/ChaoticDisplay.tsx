import chaotic from "./chaotic.module.css";
import { chaoticWordProfiles } from "./fonts";

/** 17 bright hues — unique per word until text exceeds 15 words */
const WORD_COLORS = [
  "#ff3366",
  "#00ffcc",
  "#ffe600",
  "#ff66ff",
  "#66ff66",
  "#ff9933",
  "#9966ff",
  "#00ccff",
  "#ffcc00",
  "#ff0044",
  "#39ff14",
  "#ff6ec7",
  "#00ff88",
  "#ffaa00",
  "#7b68ff",
  "#ff3d00",
  "#00e5ff",
] as const;

const LETTER_SPACINGS = [
  "-0.05em",
  "-0.02em",
  "0.04em",
  "0.1em",
  "0.18em",
] as const;

const SIZE_SCALES = [0.72, 0.86, 0.96, 1.04, 1.18, 1.32] as const;

/** Tiny per-word nudge — keeps words close without even rhythm */
const MARGIN_LEFT = ["0", "0", "0.01em", "0", "-0.01em", "0.005em"] as const;
const MARGIN_RIGHT = ["0.02em", "0.04em", "0.01em", "0.03em", "0.02em", "0.035em"] as const;

/** Static tilt — personality without motion */
const ROTATIONS = ["-4deg", "-2deg", "0deg", "2deg", "4deg", "-3deg"] as const;

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickFromPool<T>(pool: readonly T[], seed: number): T {
  return pool[seed % pool.length];
}

function getWordColor(wordOrdinal: number): string {
  if (wordOrdinal < 15) {
    return WORD_COLORS[wordOrdinal];
  }
  return pickFromPool(WORD_COLORS, stableHash(`color-${wordOrdinal}`));
}

function getWordStyle(wordOrdinal: number) {
  const seed = stableHash(`word-${wordOrdinal}`);
  const profile = pickFromPool(chaoticWordProfiles, seed + 1);
  const sizeScale = profile.sizeScale ?? 1;
  const baseScale = pickFromPool(SIZE_SCALES, seed + 11);

  return {
    color: getWordColor(wordOrdinal),
    fontClass: profile.className,
    letterSpacing: pickFromPool(LETTER_SPACINGS, seed + 5),
    fontSize: `calc(1em * ${baseScale * sizeScale})`,
    lineHeight: profile.lineHeight,
    marginLeft: pickFromPool(MARGIN_LEFT, seed + 13),
    marginRight: pickFromPool(MARGIN_RIGHT, seed + 17),
    rotate: pickFromPool(ROTATIONS, seed + 21),
  };
}

export function ChaoticBackground() {
  return (
    <div className={chaotic.chaoticBg} aria-hidden="true">
      <div className={chaotic.grain} />
    </div>
  );
}

export function ChaoticDisplay({ text }: { text: string }) {
  if (!text) {
    return <p className={chaotic.hint}>Start typing below…</p>;
  }

  const tokens = text.split(/(\s+)/);
  let wordOrdinal = 0;

  return (
    <p className={chaotic.text}>
      {tokens.map((token, index) => {
        if (/^\s+$/.test(token)) {
          return (
            <span key={index} className={chaotic.space}>
              {token}
            </span>
          );
        }

        const {
          color,
          fontClass,
          letterSpacing,
          fontSize,
          lineHeight,
          marginLeft,
          marginRight,
          rotate,
        } = getWordStyle(wordOrdinal);

        wordOrdinal += 1;

        return (
          <span
            key={index}
            className={`${chaotic.word} ${fontClass}`}
            style={{
              color,
              letterSpacing,
              fontSize,
              lineHeight,
              marginLeft,
              marginRight,
              transform: `rotate(${rotate})`,
            }}
          >
            {token}
          </span>
        );
      })}
    </p>
  );
}
