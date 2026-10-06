import Link from "next/link";
import styles from './styles/home.module.css';
import { instrumentSans, outfit } from './fonts';

const TITLE_TEXT = "Katie's prototypes";

/** Soft sky photo behind the cards (public/playground/clouds.jpeg). */
const SHOW_CLOUD_WASH = true;

function GlassHeart() {
  return (
    <div className={`${styles.glassShape} ${styles.shapeHeart} ${styles.glassSphere}`}>
      <span className={styles.shapeHighlight} />
    </div>
  );
}

function GlassStar() {
  return (
    <div className={`${styles.glassShape} ${styles.shapeStar} ${styles.glassSphere}`}>
      <span className={styles.shapeHighlight} />
    </div>
  );
}

function GlassSphere() {
  return (
    <div className={`${styles.glassShape} ${styles.shapeCircle} ${styles.glassSphere}`}>
      <span className={styles.shapeHighlight} />
    </div>
  );
}

export default function Home() {
  const prototypes = [
    {
      title: 'PinkSynth',
      description: 'A digital piano in classic Mac OS style, monochromatic pink',
      path: '/prototypes/pink-piano'
    },
    {
      title: 'Typography',
      description: 'Type live text in two CSS-only styles: calm and chaotic',
      path: '/prototypes/typography'
    },
    {
      title: 'Noted OS',
      description: 'Doodle notebook: rounded notes, stickers, text and sketches',
      path: '/prototypes/noted-os'
    },
  ];

  return (
    <div className={`${styles.page} ${SHOW_CLOUD_WASH ? styles.pageSky : ""}`}>
      {SHOW_CLOUD_WASH && (
        <div className={styles.cloudWash} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/playground/clouds.jpeg"
            alt=""
            className={styles.cloudWashImg}
          />
        </div>
      )}
      <div
        className={`${styles.pageBg} ${SHOW_CLOUD_WASH ? styles.pageBgWithClouds : ''}`}
        aria-hidden="true"
      />
      <div className={styles.grain} aria-hidden="true" />

      <div className={styles.orbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.orb} ${styles.orb4}`} />
        <div className={`${styles.orb} ${styles.orb5}`} />
        <div className={`${styles.orb} ${styles.orb6}`} />
      </div>

      <div className={styles.deco} aria-hidden="true">
        {/* Pair: large sphere (back) + smaller heart (front) — top left */}
        <div className={`${styles.decoItem} ${styles.deco1} ${styles.layerBack}`}>
          <div className={styles.glassShadow} />
          <GlassSphere />
        </div>
        <div className={`${styles.decoItem} ${styles.deco3} ${styles.layerFront}`}>
          <div className={styles.glassShadow} />
          <GlassHeart />
        </div>

        {/* Pair: large star (back) + smaller sphere (front) — top right */}
        <div className={`${styles.decoItem} ${styles.deco2} ${styles.layerBack}`}>
          <div className={styles.glassShadow} />
          <GlassStar />
        </div>
        <div className={`${styles.decoItem} ${styles.deco6} ${styles.layerFront}`}>
          <div className={styles.glassShadow} />
          <GlassSphere />
        </div>

        {/* Pair: large sphere (back) + medium heart (front) — bottom right */}
        <div className={`${styles.decoItem} ${styles.deco4} ${styles.layerBack}`}>
          <div className={styles.glassShadow} />
          <GlassSphere />
        </div>
        <div className={`${styles.decoItem} ${styles.deco7} ${styles.layerFront}`}>
          <div className={styles.glassShadow} />
          <GlassHeart />
        </div>

        {/* Pair: large star (back) + smaller sphere (front) — bottom left */}
        <div className={`${styles.decoItem} ${styles.deco5} ${styles.layerBack}`}>
          <div className={styles.glassShadow} />
          <GlassStar />
        </div>
        <div className={`${styles.decoItem} ${styles.deco8} ${styles.layerFront}`}>
          <div className={styles.glassShadow} />
          <GlassSphere />
        </div>
      </div>

      <div className={`${styles.container} ${instrumentSans.className}`}>
        <header className={`${styles.header} ${outfit.className}`}>
          <h1 className={styles.title}>
            {TITLE_TEXT.split('').map((char, index) => (
              <span
                key={`${char}-${index}`}
                className={char === ' ' ? styles.titleSpace : styles.titleLetter}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {char}
              </span>
            ))}
          </h1>
        </header>

        <main>
          <section className={styles.grid}>
            {prototypes.map((prototype, index) => (
              <Link
                key={index}
                href={prototype.path}
                className={styles.card}
              >
                <h3>{prototype.title}</h3>
                <p>{prototype.description}</p>
              </Link>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
