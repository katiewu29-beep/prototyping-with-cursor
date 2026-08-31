import calm from "./calm.module.css";
import { fraunces } from "./fonts";

const WAVE_VIEWBOX = "0 0 1440 320";

const WAVE_PATHS = {
  /* One broad swell — crest left, dip center-right */
  mid: "M0,115 C300,45 580,175 860,95 C1080,35 1260,145 1440,80 L1440,320 L0,320 Z",
  /* Opposite rhythm — peak center-left, shallower troughs */
  front: "M0,45 C220,125 520,25 760,100 C1000,175 1220,55 1440,70 L1440,320 L0,320 Z",
} as const;

function WaveSvg({
  layerClass,
  trackClass,
  gradientId,
  path,
  stops,
}: {
  layerClass: string;
  trackClass: string;
  gradientId: string;
  path: string;
  stops: { offset: string; color: string; opacity?: number }[];
}) {
  return (
    <div className={`${calm.waveLayer} ${layerClass}`}>
      <div className={`${calm.waveTrack} ${trackClass}`}>
        <svg
          className={calm.waveSvg}
          viewBox={WAVE_VIEWBOX}
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            {/* objectBoundingBox maps crest→bottom of the path on every screen size */}
            <linearGradient
              id={gradientId}
              gradientUnits="objectBoundingBox"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              {stops.map((stop) => (
                <stop
                  key={stop.offset}
                  offset={stop.offset}
                  stopColor={stop.color}
                  stopOpacity={stop.opacity ?? 1}
                />
              ))}
            </linearGradient>
          </defs>
          <path d={path} fill={`url(#${gradientId})`} />
        </svg>
      </div>
    </div>
  );
}

export function CalmBackground() {
  return (
    <div className={calm.calmBg} aria-hidden="true">
      <div className={calm.shiftingGradient} />
      <div className={calm.waves}>
        <WaveSvg
          layerClass={calm.waveMid}
          trackClass={calm.waveTrackMid}
          gradientId="calm-wave-mid"
          path={WAVE_PATHS.mid}
          stops={[
            { offset: "0%", color: "#8eb8d8" },
            { offset: "35%", color: "#9ec4e0" },
            { offset: "65%", color: "#aed0e8" },
            { offset: "85%", color: "#c5dceb" },
            { offset: "100%", color: "#e8ebe4" },
          ]}
        />
        <WaveSvg
          layerClass={calm.waveFront}
          trackClass={calm.waveTrackFront}
          gradientId="calm-wave-front"
          path={WAVE_PATHS.front}
          stops={[
            { offset: "0%", color: "#1e3a5f" },
            { offset: "25%", color: "#2a4a6a" },
            { offset: "45%", color: "#3a6080" },
            { offset: "65%", color: "#4a7a9e" },
            { offset: "80%", color: "#6a9ab8" },
            { offset: "92%", color: "#a8c8d8" },
            { offset: "100%", color: "#e8ebe4" },
          ]}
        />
      </div>
      <div className={calm.grain} />
    </div>
  );
}

export function CalmDisplay({ text }: { text: string }) {
  if (!text) {
    return <p className={`${calm.hint} ${fraunces.className}`}>Start typing below…</p>;
  }

  return (
    <p className={`${calm.text} ${fraunces.className}`}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className={char === " " ? calm.space : calm.char}
          style={{ animationDelay: `${index * 0.08}s` }}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </p>
  );
}
