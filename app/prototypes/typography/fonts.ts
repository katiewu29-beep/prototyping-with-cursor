import localFont from "next/font/local";

// Self-hosted (see app/font-files) so builds never fetch from Google Fonts.
export const fraunces = localFont({
  src: "../../font-files/fraunces.woff2",
  weight: "300 400",
  display: "swap",
});

export const greatVibes = localFont({
  src: "../../font-files/great-vibes.woff2",
  weight: "400",
  display: "swap",
});

export const permanentMarker = localFont({
  src: "../../font-files/permanent-marker.woff2",
  weight: "400",
  display: "swap",
});

export const jetbrainsMono = localFont({
  src: "../../font-files/jetbrains-mono.woff2",
  weight: "500 700",
  display: "swap",
});

export const bebasNeue = localFont({
  src: "../../font-files/bebas-neue.woff2",
  weight: "400",
  display: "swap",
});

export const libreBaskerville = localFont({
  src: "../../font-files/libre-baskerville.woff2",
  weight: "400",
  display: "swap",
});

export const unifrakturMaguntia = localFont({
  src: "../../font-files/unifraktur-maguntia.woff2",
  weight: "400",
  display: "swap",
});

export const specialElite = localFont({
  src: "../../font-files/special-elite.woff2",
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
