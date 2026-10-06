"use client";

import BackLink from "@/app/components/BackLink";
import { useEffect, useRef, useState } from "react";
import { CalmBackground, CalmDisplay } from "./CalmDisplay";
import { ChaoticBackground, ChaoticDisplay } from "./ChaoticDisplay";
import calm from "./calm.module.css";
import chaotic from "./chaotic.module.css";
import styles from "./styles.module.css";

type TypographyStyle = "calm" | "chaotic";

const STYLES: { id: TypographyStyle; label: string }[] = [
  { id: "calm", label: "Calm" },
  { id: "chaotic", label: "Chaotic" },
];

export default function TypographyPrototype() {
  const [text, setText] = useState("");
  const [activeStyle, setActiveStyle] = useState<TypographyStyle>("calm");
  const inputRef = useRef<HTMLInputElement>(null);

  const isCalm = activeStyle === "calm";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const backButtonClass = isCalm ? calm.backButton : chaotic.backButton;
  const controlsClass = isCalm ? calm.controls : chaotic.controls;
  const inputClass = isCalm ? calm.input : chaotic.input;

  return (
    <div className={styles.page}>
      {isCalm && <CalmBackground />}
      {!isCalm && <ChaoticBackground />}

      <BackLink className={backButtonClass} aria-label="Back to home">
        ←
      </BackLink>

      <div className={styles.displayArea}>
        <div className={styles.displayContent}>
          {isCalm ? (
            <CalmDisplay text={text} />
          ) : (
            <ChaoticDisplay text={text} />
          )}
        </div>
      </div>

      <div className={controlsClass}>
        <div className={styles.tabs} role="tablist" aria-label="Typography style">
          {STYLES.map(({ id, label }) => {
            const isActive = activeStyle === id;
            const tabClass = isCalm
              ? `${calm.tab}${isActive ? ` ${calm.tabActive}` : ""}`
              : `${chaotic.tab}${isActive ? ` ${chaotic.tabActive}` : ""}`;

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={tabClass}
                onClick={() => setActiveStyle(id)}
              >
                {label}
              </button>
            );
          })}
        </div>

        <label className={styles.inputLabel} htmlFor="typography-input">
          Type your message
        </label>
        <input
          ref={inputRef}
          id="typography-input"
          type="text"
          className={inputClass}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something…"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
