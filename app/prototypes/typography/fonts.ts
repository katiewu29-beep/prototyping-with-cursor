import {
  Bebas_Neue,
  Fraunces,
  Great_Vibes,
  JetBrains_Mono,
  Libre_Baskerville,
  Permanent_Marker,
  Special_Elite,
  UnifrakturMaguntia,
} from "next/font/google";

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

export const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const unifrakturMaguntia = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const specialElite = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/** One voice per category — 7 distinct type personalities */
export const chaoticWordProfiles: readonly {
  className: string;
  lineHeight: number;
  sizeScale?: number;
}[] = [
  { className: greatVibes.className, lineHeight: 1.2, sizeScale: 1.35 }, // script
  { className: bebasNeue.className, lineHeight: 0.88 }, // condensed display
  { className: jetbrainsMono.className, lineHeight: 1 }, // monospace
  { className: permanentMarker.className, lineHeight: 1.1 }, // hand-drawn
  { className: libreBaskerville.className, lineHeight: 1.15 }, // serif
  { className: unifrakturMaguntia.className, lineHeight: 1.05 }, // blackletter
  { className: specialElite.className, lineHeight: 1.05 }, // typewriter
];
