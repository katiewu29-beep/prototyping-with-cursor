/**
 * Shared data shapes for Noted OS.
 * Think of these as the "labels on the drawers" — they describe
 * what a window, a text note, and a sketch look like in data.
 */

export const GRID_SIZE = 24;
/** Smallest a floating note or sketch can be dragged down to. */
export const MIN_WINDOW_WIDTH = 280;
export const MIN_WINDOW_HEIGHT = 200;

/** Smallest a note may shrink to when the desk itself is narrower than 280px. */
export const WINDOW_HANDLE_MIN = 80;
/** Inset from the desk edge so rounded notes don’t sit flush on the rim. */
export const WINDOW_EDGE_PAD = 8;
/** Title bar height — keep this strip on the desktop so you can still drag. */
export const TITLE_BAR_HEIGHT = 40;

/**
 * Keep a floating note fully on the desk.
 * Used while dragging and after the browser window changes size,
 * so a note cannot hide off the edge.
 */
export function clampWindowPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  deskW: number,
  deskH: number,
  snapToGrid = false
): { x: number; y: number } {
  const pad = WINDOW_EDGE_PAD;
  const minX = pad;
  const maxX = Math.max(pad, deskW - width - pad);
  const minY = pad;
  const maxY = Math.max(pad, deskH - height - pad);

  let nextX = Math.min(Math.max(x, minX), maxX);
  let nextY = Math.min(Math.max(y, minY), maxY);

  if (snapToGrid) {
    nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
    nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;
    nextX = Math.min(Math.max(nextX, minX), maxX);
    nextY = Math.min(Math.max(nextY, minY), maxY);
  }

  return { x: nextX, y: nextY };
}

/**
 * How big the note actually appears on this desk.
 * CSS also caps the card so it cannot be wider/taller than the cream,
 * but we still save the user’s chosen size — stretching the browser
 * later lets the note grow back.
 */
export function visibleWindowSize(
  win: { width: number; height: number; minimized?: boolean },
  deskW: number,
  deskH: number
): { width: number; height: number } {
  const pad = WINDOW_EDGE_PAD;
  const availW = Math.max(WINDOW_HANDLE_MIN, deskW - 2 * pad);
  const availH = Math.max(TITLE_BAR_HEIGHT, deskH - 2 * pad);
  return {
    width: Math.min(win.width, availW),
    height: win.minimized ? TITLE_BAR_HEIGHT : Math.min(win.height, availH),
  };
}

/**
 * After the desk shrinks, slide a note so the whole visible card stays
 * on the cream. Saved width/height stay as the user left them.
 */
export function fitWindowToDesk(
  win: { x: number; y: number; width: number; height: number; minimized?: boolean },
  deskW: number,
  deskH: number,
  snapToGrid = false
): { x: number; y: number; width: number; height: number } {
  const vis = visibleWindowSize(win, deskW, deskH);
  const pos = clampWindowPosition(
    win.x,
    win.y,
    vis.width,
    vis.height,
    deskW,
    deskH,
    snapToGrid
  );
  return { x: pos.x, y: pos.y, width: win.width, height: win.height };
}

export type ResizeCorner = "nw" | "ne" | "sw" | "se";

/**
 * Grow or shrink a window from one corner. The opposite edges stay planted,
 * size never drops below the minimum, and the title bar stays on the desktop.
 */
export function applyCornerResize(
  corner: ResizeCorner,
  start: { x: number; y: number; width: number; height: number },
  dx: number,
  dy: number,
  deskW: number,
  deskH: number,
  snapToGrid = false
): { x: number; y: number; width: number; height: number } {
  let width = start.width;
  let height = start.height;

  if (corner === "se" || corner === "ne") width = start.width + dx;
  if (corner === "sw" || corner === "nw") width = start.width - dx;
  if (corner === "se" || corner === "sw") height = start.height + dy;
  if (corner === "ne" || corner === "nw") height = start.height - dy;

  width = Math.max(MIN_WINDOW_WIDTH, width);
  height = Math.max(MIN_WINDOW_HEIGHT, height);

  const pad = WINDOW_EDGE_PAD;
  const availW = Math.max(WINDOW_HANDLE_MIN, deskW - 2 * pad);
  const availH = Math.max(TITLE_BAR_HEIGHT, deskH - 2 * pad);
  width = Math.min(width, availW);
  height = Math.min(height, availH);

  if (snapToGrid) {
    width = Math.max(MIN_WINDOW_WIDTH, Math.round(width / GRID_SIZE) * GRID_SIZE);
    height = Math.max(MIN_WINDOW_HEIGHT, Math.round(height / GRID_SIZE) * GRID_SIZE);
    width = Math.min(width, availW);
    height = Math.min(height, availH);
  }

  // West/north corners move x/y so the opposite edge stays where it was.
  let x = corner === "sw" || corner === "nw" ? start.x + start.width - width : start.x;
  let y = corner === "ne" || corner === "nw" ? start.y + start.height - height : start.y;

  const pos = clampWindowPosition(x, y, width, height, deskW, deskH, false);
  return { x: pos.x, y: pos.y, width, height };
}

/**
 * First-visit (and original saved) layout: notes wait at the edges
 * so the planetary circle stays open. Desk size is measured live.
 */
export function isFactoryArrangement(windows: WindowRecord[]): boolean {
  if (windows.length !== 2) return false;
  const folio = windows.find((win) => win.kind === "folio");
  const plate = windows.find((win) => win.kind === "plate");
  if (!folio || !plate) return false;
  if (folio.maximized || plate.maximized) return false;
  const folioHome =
    (Math.abs(folio.x - 48) < 24 && Math.abs(folio.y - 56) < 24) ||
    (Math.abs(folio.x - 20) < 24 && Math.abs(folio.y - 28) < 24);
  const plateHome =
    (plate.x > 450 && plate.x < 560 && Math.abs(plate.y - 88) < 24) ||
    (Math.abs(plate.x - 760) < 24 && Math.abs(plate.y - 240) < 24);
  return folioHome && plateHome;
}

export function placeSheetsAtChartEdges(
  windows: WindowRecord[],
  deskW: number,
  deskH: number
): WindowRecord[] {
  const pad = 28;
  return windows.map((win) => {
    if (win.maximized || win.minimized) return win;
    if (win.kind === "folio") {
      return { ...win, x: pad, y: pad };
    }
    if (win.kind === "plate") {
      return {
        ...win,
        x: Math.max(pad, deskW - win.width - pad),
        y: Math.max(pad, deskH - win.height - pad),
      };
    }
    return win;
  });
}

export type WindowKind = "folio" | "plate";

export type WindowRecord = {
  id: string;
  kind: WindowKind;
  title: string;
  /**
   * A name the user typed in the title bar.
   * When this is set, the title stays put (text notes no longer follow
   * the first few words of the body). Clear it to go back to the default.
   */
  customTitle?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Position/size to restore after leaving maximized mode */
  restore?: { x: number; y: number; width: number; height: number };
};

export type Point = { x: number; y: number };

export type StrokeTool = "pen" | "eraser";

export type Stroke = {
  tool: StrokeTool;
  color: string;
  width: number;
  points: Point[];
};

export type AppState = {
  windows: WindowRecord[];
  /** Rich-text HTML keyed by folio window id */
  folios: Record<string, string>;
  /** Drawing strokes keyed by plate window id */
  plates: Record<string, Stroke[]>;
  snapToGrid: boolean;
  zTop: number;
};
