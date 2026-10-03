"use client";

/**
 * Desk decorations for the doodle skin.
 * They are pictures only: they never capture clicks, so you can still
 * drag notes around on top of them.
 */

import styles from "./styles.module.css";

function CrayonFlower() {
  const bloom =
    "M100 132C58 118 42 78 62 42C72 26 88 32 100 58C112 32 128 26 138 42C158 78 142 118 100 132Z";
  return (
    <svg className={styles.doodleFlower} viewBox="0 0 200 240" aria-hidden="true">
      <path d={bloom} fill="#f2d048" />
      <g fill="none" stroke="#e4bc2e" strokeWidth="4.5" strokeLinecap="round" opacity="0.75">
        <path d="M78 70c12 8 20-2 32 8" />
        <path d="M74 88c14 6 22 0 36 8" />
        <path d="M82 106c10 4 18 2 28 4" />
      </g>
      <path d={bloom} fill="none" stroke="#3b6fd4" strokeWidth="8" strokeLinejoin="round" />
      <path d="M100 130v78" fill="none" stroke="#3b6fd4" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M100 168c-38 2-46 22-18 34 12 5 20-2 18-12Z"
        fill="#7ec45a"
        stroke="#3b6fd4"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path
        d="M100 156c36-4 46 16 20 30-12 6-18 0-20-12Z"
        fill="#7ec45a"
        stroke="#3b6fd4"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoundBloom() {
  return (
    <svg className={styles.doodleBloom} viewBox="0 0 180 180" aria-hidden="true">
      <circle cx="90" cy="46" r="40" fill="#f7b3c8" />
      <circle cx="134" cy="90" r="40" fill="#f7b3c8" />
      <circle cx="90" cy="134" r="40" fill="#f7b3c8" />
      <circle cx="46" cy="90" r="40" fill="#f7b3c8" />
      <circle cx="90" cy="46" r="40" fill="none" stroke="#3b6fd4" strokeWidth="7" />
      <circle cx="134" cy="90" r="40" fill="none" stroke="#3b6fd4" strokeWidth="7" />
      <circle cx="90" cy="134" r="40" fill="none" stroke="#3b6fd4" strokeWidth="7" />
      <circle cx="46" cy="90" r="40" fill="none" stroke="#3b6fd4" strokeWidth="7" />
      <circle cx="90" cy="90" r="28" fill="#f2d048" />
      <circle cx="90" cy="90" r="28" fill="none" stroke="#3b6fd4" strokeWidth="7" />
      <g fill="none" stroke="#e4bc2e" strokeWidth="4" strokeLinecap="round" opacity="0.8">
        <path d="M78 82c8 6 16 4 24 8" />
        <path d="M80 96c10 4 14 2 22 4" />
      </g>
    </svg>
  );
}

function Pencil() {
  return (
    <svg className={styles.doodlePencil} viewBox="0 0 90 28" aria-hidden="true">
      <path fill="#f4d27a" d="M8 8h58l12 6-12 6H8z" />
      <path fill="#3b3b3b" d="M66 8l16 6-16 6v-4l8-2-8-2z" />
      <path fill="#e8a0b8" d="M8 8h10v12H8z" />
      <path fill="#c9c3b8" d="M18 8h8v12h-8z" />
    </svg>
  );
}

function PaperPlane() {
  return (
    <svg className={styles.doodlePlane} viewBox="0 0 72 52" aria-hidden="true">
      <path d="M6 28L66 8 32 30 28 46 36 32 58 16 32 30Z" fill="#ffe4ee" />
      <path
        d="M6 28L66 8 32 30 28 46 36 32 58 16 32 30Z"
        fill="none"
        stroke="#f47aa8"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LetterSticker({
  letter,
  className,
  tone,
}: {
  letter: string;
  className: string;
  tone: "green" | "pink" | "blue";
}) {
  return (
    <div className={`${styles.letter} ${styles[tone]} ${className}`} aria-hidden="true">
      {letter}
    </div>
  );
}

export default function DeskDoodles() {
  return (
    <div className={styles.deskDoodles} aria-hidden="true">
      <svg className={styles.waves} viewBox="0 0 800 400" preserveAspectRatio="none">
        <path
          d="M-20 70c120 30 180-40 320 0s200 40 360-10 220-20 360 20"
          fill="none"
          stroke="#e4d7f2"
          strokeWidth="10"
        />
        <path
          d="M-20 140c140 20 200-30 340 8s220 28 340-16 200 10 320 24"
          fill="none"
          stroke="#eadff6"
          strokeWidth="8"
        />
        <path
          d="M-20 300c160-24 240 30 380 4s240-20 400 16"
          fill="none"
          stroke="#efe8f8"
          strokeWidth="9"
        />
      </svg>

      <div className={styles.deskStickers}>
        <CrayonFlower />
        <RoundBloom />
        <PaperPlane />
        <Pencil />
        <LetterSticker letter="N" className={styles.letterN} tone="green" />
        <LetterSticker letter="O" className={styles.letterO} tone="pink" />
        <LetterSticker letter="S" className={styles.letterS} tone="blue" />

        <div className={styles.planetSticker}>
          <svg viewBox="0 0 64 64">
            <circle cx="30" cy="30" r="16" fill="#f2d048" stroke="#2b2b2b" strokeWidth="2.4" />
            <ellipse
              cx="30"
              cy="30"
              rx="26"
              ry="8"
              fill="none"
              stroke="#3b6fd4"
              strokeWidth="2.6"
              transform="rotate(-18 30 30)"
            />
          </svg>
        </div>

        <div className={styles.buddySticker}>
          <svg className={styles.buddy} viewBox="0 0 80 64">
            <circle cx="18" cy="18" r="14" fill="#c8c0ee" />
            <circle cx="62" cy="18" r="14" fill="#c8c0ee" />
            <ellipse cx="40" cy="36" rx="28" ry="24" fill="#d9d4f5" />
            <circle cx="30" cy="34" r="4.2" fill="#3d3568" />
            <circle cx="50" cy="34" r="4.2" fill="#3d3568" />
            <path
              d="M32 46c5 6 11 6 16 0"
              fill="none"
              stroke="#3d3568"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className={styles.midStar} aria-hidden="true">
          <span>★</span>
        </div>

        <svg className={styles.midSquiggle} viewBox="0 0 90 54" aria-hidden="true">
          <path
            d="M8 32c10-18 18 8 28-8 10 16 16-10 26 2 8 8 14 14 22-4"
            fill="none"
            stroke="#3b6fd4"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M18 40c8-6 14 4 22-2"
            fill="none"
            stroke="#f47aa8"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
