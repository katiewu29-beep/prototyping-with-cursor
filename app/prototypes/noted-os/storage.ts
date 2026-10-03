/**
 * Remember the notebook between visits.
 * The browser's localStorage is like a notebook in a desk drawer:
 * it stays on this computer, in this browser, until the user clears it.
 */

import type { AppState } from "./types";

export const STORAGE_KEY = "noted-os-v2";

/** First-visit (and restored) sticky that explains what you can do here. */
export const WELCOME_HTML = `
<h2>Noted OS</h2>
<p>Rounded notes on a doodle desk. Write, type, or sketch on them, then drag them around.</p>
<p>Try the following:</p>
<ul>
<li>Drag a note by its top strip — click the title to rename</li>
<li>Use the text tools for bold, italic, headings, and lists</li>
<li>Click Text or Sketch at the top to add a new note</li>
<li>Turn on Snap so notes line up to a grid</li>
<li>Open a sketch: pen, eraser, colors, and Export</li>
</ul>
<p>Your arrangement and writing stay in this browser.</p>
`.trim();

function welcomeLooksStale(html: string) {
  const text = html.replace(/\s+/g, " ").trim();
  if (!text || text === "<p></p>") return true;
  return (
    html.includes("observatory") ||
    html.includes("Keep it simple") ||
    html.includes("brass title") ||
    html.includes("chart room")
  );
}

/**
 * Make sure the “Noted OS” how-to sticky is on the desk.
 * Saved notes you wrote yourself are left alone; we only restore
 * the explainer if it was closed, emptied, or still has old copy.
 */
export function ensureWelcomeNote(state: AppState): AppState {
  const named = state.windows.find(
    (win) =>
      win.kind === "folio" && (win.title === "Noted OS" || win.customTitle === "Noted OS")
  );

  if (named) {
    const html = state.folios[named.id] ?? "";
    const needsCopy = welcomeLooksStale(html);
    const tooShort = named.height < 480;
    if (!needsCopy && !named.minimized && !tooShort) return state;
    const zTop = state.zTop + 1;
    return {
      ...state,
      zTop,
      windows: state.windows.map((win) =>
        win.id === named.id
          ? {
              ...win,
              title: "Noted OS",
              minimized: false,
              z: zTop,
              width: Math.max(win.width, 420),
              height: Math.max(win.height, 480),
            }
          : win
      ),
      folios: needsCopy ? { ...state.folios, [named.id]: WELCOME_HTML } : state.folios,
    };
  }

  const id = uid("folio");
  const zTop = state.zTop + 1;
  return {
    ...state,
    zTop,
    windows: [
      ...state.windows,
      {
        id,
        kind: "folio",
        title: "Noted OS",
        x: 20,
        y: 28,
        width: 420,
        height: 480,
        z: zTop,
        minimized: false,
        maximized: false,
      },
    ],
    folios: { ...state.folios, [id]: WELCOME_HTML },
  };
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

/** First-visit layout: one welcome text note and one empty sketch. */
export function createDefaultState(): AppState {
  const folioId = uid("folio");
  const plateId = uid("plate");
  return {
    windows: [
      {
        id: folioId,
        kind: "folio",
        title: "Noted OS",
        x: 20,
        y: 28,
        width: 420,
        height: 480,
        z: 2,
        minimized: false,
        maximized: false,
      },
      {
        id: plateId,
        kind: "plate",
        title: "Untitled sketch",
        x: 760,
        y: 240,
        width: 400,
        height: 360,
        z: 3,
        minimized: false,
        maximized: false,
      },
    ],
    folios: { [folioId]: WELCOME_HTML },
    plates: { [plateId]: [] },
    snapToGrid: false,
    zTop: 3,
  };
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (!Array.isArray(parsed.windows)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be full or blocked in private mode — fail quietly.
  }
}

export { uid };
