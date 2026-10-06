"use client";

/**
 * Noted OS — rounded notes on a doodle desk.
 * This page is the desk: a top strip of tools, crayon decorations, and the notes.
 */

import BackLink from "@/app/components/BackLink";
import localFont from "next/font/local";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import DeskDoodles from "./DeskDoodles";
import SketchPad from "./SketchPad";
import TextNote, { firstLineTitleFromHtml } from "./TextNote";
import WindowFrame from "./WindowFrame";
import { createDefaultState, ensureWelcomeNote, saveState, loadState, uid } from "./storage";
import {
  clampWindowPosition,
  fitWindowToDesk,
  isFactoryArrangement,
  placeSheetsAtChartEdges,
  visibleWindowSize,
  type AppState,
  type WindowKind,
  type WindowRecord,
} from "./types";
import styles from "./styles.module.css";

/** Rounded, friendly UI type for menus, titles, and body text. */
const nunito = localFont({
  src: "../../font-files/nunito.woff2",
  weight: "400 800",
  variable: "--font-ui",
});

/** Hand-lettered look for in-note headings only. */
const doodle = localFont({
  src: "../../font-files/patrick-hand.woff2",
  weight: "400",
  variable: "--font-doodle",
});

function cascadeOrigin(count: number) {
  const step = 28;
  return {
    x: 20 + (count % 8) * step,
    y: 28 + (count % 8) * step,
  };
}

/**
 * Pull every floating note fully onto the desk after a shrink.
 * Maximized notes already fill the desk with CSS; we only nudge
 * their saved “restore” spot so they still fit when you collapse them.
 * Returns the same array if nothing moved (avoids extra saves).
 */
function clampAllWindows(
  windows: WindowRecord[],
  deskW: number,
  deskH: number,
  snapToGrid: boolean
): { windows: WindowRecord[]; changed: boolean } {
  let changed = false;
  const next = windows.map((win) => {
    if (win.maximized) {
      if (!win.restore) return win;
      const fitted = fitWindowToDesk(win.restore, deskW, deskH, snapToGrid);
      if (
        fitted.x === win.restore.x &&
        fitted.y === win.restore.y &&
        fitted.width === win.restore.width &&
        fitted.height === win.restore.height
      ) {
        return win;
      }
      changed = true;
      return { ...win, restore: fitted };
    }
    const fitted = fitWindowToDesk(win, deskW, deskH, snapToGrid);
    if (
      fitted.x === win.x &&
      fitted.y === win.y &&
      fitted.width === win.width &&
      fitted.height === win.height
    ) {
      return win;
    }
    changed = true;
    return { ...win, ...fitted };
  });
  return { windows: next, changed };
}

export default function NotedOSPrototype() {
  const [state, setState] = useState<AppState | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const desktopRef = useRef<HTMLDivElement>(null);
  const desktopReady = Boolean(state);

  useEffect(() => {
    setState(ensureWelcomeNote(loadState() ?? createDefaultState()));
  }, []);

  useEffect(() => {
    if (!state) return;
    const timer = window.setTimeout(() => {
      saveState(state);
      setSavedFlash(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = window.setTimeout(() => setSavedFlash(false), 900);
    return () => window.clearTimeout(timer);
  }, [savedFlash]);

  const update = useCallback((patch: (prev: AppState) => AppState) => {
    setState((prev) => (prev ? patch(prev) : prev));
  }, []);

  /**
   * When the browser window changes size, keep every note fully on the desk.
   * We measure the desktop div (the area under the menubar), not the
   * whole page, then write new x/y into saved state so they persist.
   */
  const fitWindowsToDesktop = useCallback(() => {
    const desk = desktopRef.current;
    if (!desk) return;
    const deskW = desk.clientWidth;
    const deskH = desk.clientHeight;
    if (deskW < 1 || deskH < 1) return;

    update((prev) => {
      let nextWindows = prev.windows;
      if (isFactoryArrangement(nextWindows)) {
        nextWindows = placeSheetsAtChartEdges(nextWindows, deskW, deskH);
      }
      const { windows, changed } = clampAllWindows(
        nextWindows,
        deskW,
        deskH,
        prev.snapToGrid
      );
      const moved =
        changed || nextWindows.some((win, i) => win !== prev.windows[i]);
      return moved ? { ...prev, windows } : prev;
    });
  }, [update]);

  useLayoutEffect(() => {
    if (!desktopReady) return;
    const desk = desktopRef.current;
    if (!desk) return;

    fitWindowsToDesktop();

    const observer = new ResizeObserver(() => {
      fitWindowsToDesktop();
    });
    observer.observe(desk);
    window.addEventListener("resize", fitWindowsToDesktop);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fitWindowsToDesktop);
    };
  }, [desktopReady, fitWindowsToDesktop]);

  const focusWindow = (id: string) => {
    update((prev) => {
      const current = prev.windows.find((win) => win.id === id);
      // Already in front — skip a re-render that would drop a text selection.
      if (current && current.z === prev.zTop) return prev;
      const zTop = prev.zTop + 1;
      return {
        ...prev,
        zTop,
        windows: prev.windows.map((win) =>
          win.id === id ? { ...win, z: zTop } : win
        ),
      };
    });
  };

  const moveWindow = (id: string, x: number, y: number) => {
    update((prev) => {
      const desk = desktopRef.current;
      const current = prev.windows.find((win) => win.id === id);
      const vis = current
        ? visibleWindowSize(
            current,
            desk?.clientWidth ?? current.width,
            desk?.clientHeight ?? current.height
          )
        : null;
      const pos =
        desk && current && vis
          ? clampWindowPosition(
              x,
              y,
              vis.width,
              vis.height,
              desk.clientWidth,
              desk.clientHeight,
              prev.snapToGrid
            )
          : { x, y };
      return {
        ...prev,
        windows: prev.windows.map((win) =>
          win.id === id ? { ...win, x: pos.x, y: pos.y } : win
        ),
      };
    });
  };

  const resizeWindow = (
    id: string,
    next: { x: number; y: number; width: number; height: number }
  ) => {
    update((prev) => ({
      ...prev,
      windows: prev.windows.map((win) => (win.id === id ? { ...win, ...next } : win)),
    }));
  };

  const minimizeWindow = (id: string) => {
    update((prev) => ({
      ...prev,
      windows: prev.windows.map((win) =>
        win.id === id ? { ...win, minimized: !win.minimized } : win
      ),
    }));
  };

  const maximizeWindow = (id: string) => {
    update((prev) => ({
      ...prev,
      windows: prev.windows.map((win) => {
        if (win.id !== id) return win;
        if (win.maximized) {
          const restore = win.restore ?? {
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
          };
          const desk = desktopRef.current;
          const fitted = desk
            ? fitWindowToDesk(restore, desk.clientWidth, desk.clientHeight, prev.snapToGrid)
            : restore;
          return {
            ...win,
            maximized: false,
            x: fitted.x,
            y: fitted.y,
            width: fitted.width,
            height: fitted.height,
            restore: undefined,
          };
        }
        return {
          ...win,
          maximized: true,
          minimized: false,
          restore: { x: win.x, y: win.y, width: win.width, height: win.height },
        };
      }),
    }));
  };

  const closeWindow = (id: string) => {
    update((prev) => {
      const windows = prev.windows.filter((win) => win.id !== id);
      const folios = { ...prev.folios };
      const plates = { ...prev.plates };
      delete folios[id];
      delete plates[id];
      return { ...prev, windows, folios, plates };
    });
  };

  /**
   * Double-click rename. A non-empty name is locked in as customTitle.
   * An empty name unlocks it: sketches go back to “Untitled sketch”,
   * text notes go back to following the first few words of the body.
   */
  const renameWindow = (id: string, customTitle: string) => {
    update((prev) => ({
      ...prev,
      windows: prev.windows.map((win) => {
        if (win.id !== id) return win;
        if (customTitle) {
          return { ...win, customTitle, title: customTitle };
        }
        const fallback =
          win.kind === "plate"
            ? "Untitled sketch"
            : firstLineTitleFromHtml(prev.folios[win.id] ?? "");
        return { ...win, customTitle: undefined, title: fallback };
      }),
    }));
  };

  const spawn = (kind: WindowKind) => {
    update((prev) => {
      const id = uid(kind);
      const origin = cascadeOrigin(prev.windows.length);
      const desk = desktopRef.current;
      const width = kind === "folio" ? 420 : 480;
      const height = kind === "folio" ? 380 : 420;
      const pos = desk
        ? clampWindowPosition(
            origin.x,
            origin.y,
            width,
            height,
            desk.clientWidth,
            desk.clientHeight,
            prev.snapToGrid
          )
        : origin;
      const zTop = prev.zTop + 1;
      const win: WindowRecord = {
        id,
        kind,
        title: kind === "folio" ? "Untitled text" : "Untitled sketch",
        x: pos.x,
        y: pos.y,
        width,
        height,
        z: zTop,
        minimized: false,
        maximized: false,
      };
      return {
        ...prev,
        zTop,
        windows: [...prev.windows, win],
        folios:
          kind === "folio"
            ? { ...prev.folios, [id]: "<p></p>" }
            : prev.folios,
        plates: kind === "plate" ? { ...prev.plates, [id]: [] } : prev.plates,
      };
    });
  };

  if (!state) {
    return (
      <div className={`${styles.os} ${nunito.variable} ${doodle.variable}`}>
        <div className={styles.boot}>
          <h1>Noted OS</h1>
          <p>Opening the notebook…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.os} ${nunito.variable} ${doodle.variable}`}>
      <header className={styles.menubar}>
        <BackLink className={styles.atlasLink}>
          ← Prototypes
        </BackLink>

        <div className={styles.barActions} aria-label="Notebook actions">
          <button type="button" className={styles.barBtn} onClick={() => spawn("folio")}>
            <span className={styles.barIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M6 3h9l5 5v13H6V3zm8 1.5V9h4.5L14 4.5zM8 12h8v1.5H8V12zm0 3h8v1.5H8V15z"
                />
              </svg>
            </span>
            Text
          </button>
          <button type="button" className={styles.barBtn} onClick={() => spawn("plate")}>
            <span className={styles.barIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <rect
                  x="3.5"
                  y="3.5"
                  width="13"
                  height="17"
                  rx="1.2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M6.5 9.5c2.4-2 4.4 2 6.5 0"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  d="M6.5 13.5h5"
                />
                <path
                  fill="currentColor"
                  d="M14.2 14.8l6.2-6.2 1.6 1.6-6.2 6.2-2.2.6z"
                />
              </svg>
            </span>
            Sketch
          </button>
          <button
            type="button"
            className={`${styles.barBtn} ${state.snapToGrid ? styles.barBtnOn : ""}`}
            aria-pressed={state.snapToGrid}
            aria-label="Snap to grid"
            onClick={() =>
              update((prev) => ({ ...prev, snapToGrid: !prev.snapToGrid }))
            }
          >
            <span className={styles.barIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  d="M5 5h14v14H5zM12 5v14M5 12h14"
                />
              </svg>
            </span>
            Snap
          </button>
        </div>

        <div className={styles.menuStatus}>
          <span className={savedFlash ? styles.savedOn : undefined}>
            {savedFlash ? "saved" : "saves itself"}
          </span>
        </div>
      </header>

      <div className={styles.desktop} ref={desktopRef}>
        <div className={styles.deskArtClip}>
          <DeskDoodles />
          {state.snapToGrid && <div className={styles.grid} aria-hidden="true" />}
        </div>
        {state.windows.map((win) => (
          <WindowFrame
            key={win.id}
            win={win}
            snapToGrid={state.snapToGrid}
            onFocus={focusWindow}
            onMove={moveWindow}
            onResize={resizeWindow}
            onMinimize={minimizeWindow}
            onMaximize={maximizeWindow}
            onClose={closeWindow}
            onRename={renameWindow}
          >
            {win.kind === "folio" ? (
              <TextNote
                html={state.folios[win.id] ?? ""}
                onChange={(html) =>
                  update((prev) => ({
                    ...prev,
                    folios: { ...prev.folios, [win.id]: html },
                  }))
                }
                onTitle={(title) =>
                  update((prev) => ({
                    ...prev,
                    windows: prev.windows.map((item) => {
                      if (item.id !== win.id) return item;
                      // Once renamed, keep that name even as the note keeps changing.
                      if (item.customTitle) return item;
                      return { ...item, title };
                    }),
                  }))
                }
              />
            ) : (
              <SketchPad
                title={win.title}
                strokes={state.plates[win.id] ?? []}
                onChange={(strokes) =>
                  update((prev) => ({
                    ...prev,
                    plates: { ...prev.plates, [win.id]: strokes },
                  }))
                }
              />
            )}
          </WindowFrame>
        ))}
      </div>
    </div>
  );
}
