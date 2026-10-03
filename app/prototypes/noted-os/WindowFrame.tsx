"use client";

/**
 * WindowFrame is the rounded note card around each text note or sketch.
 * Dragging updates the element's position directly (not through React state)
 * so the page follows the pointer with no lag, then we save the spot
 * when you let go. We listen on the whole page so movement still tracks
 * even if the pointer slips off the top edge.
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  applyCornerResize,
  clampWindowPosition,
  visibleWindowSize,
  type ResizeCorner,
  type WindowRecord,
} from "./types";
import styles from "./styles.module.css";

/** Two corner arrows pointing out — spread the sheet across the desk. */
function ExpandArrows() {
  return (
    <svg className={styles.winBtnIcon} viewBox="0 0 12 12" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.55 2.05H9.95V5.45M9.95 2.05L6.4 5.6"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.45 9.95H2.05V6.55M2.05 9.95L5.6 6.4"
      />
    </svg>
  );
}

/** The same two arrows, reversed — pull the sheet back in. No extra frame. */
function CollapseArrows() {
  return (
    <svg className={styles.winBtnIcon} viewBox="0 0 12 12" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.95 2.05L6.45 5.55M6.45 5.55H9.2M6.45 5.55V2.8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.05 9.95L5.55 6.45M5.55 6.45H2.8M5.55 6.45V9.2"
      />
    </svg>
  );
}

type WindowFrameProps = {
  win: WindowRecord;
  snapToGrid: boolean;
  children: ReactNode;
  onFocus: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, next: { x: number; y: number; width: number; height: number }) => void;
  onMinimize: (id: string) => void;
  onMaximize: (id: string) => void;
  onClose: (id: string) => void;
  /** Empty string means “clear the custom name and use the default again.” */
  onRename: (id: string, customTitle: string) => void;
};

export default function WindowFrame({
  win,
  snapToGrid,
  children,
  onFocus,
  onMove,
  onResize,
  onMinimize,
  onMaximize,
  onClose,
  onRename,
}: WindowFrameProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const titleBarRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragArmed = useRef(false);
  const resizing = useRef<null | {
    corner: ResizeCorner;
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>(null);
  const origin = useRef({ pointerX: 0, pointerY: 0, x: 0, y: 0 });
  const live = useRef({ x: win.x, y: win.y, width: win.width, height: win.height });
  const winRef = useRef(win);
  const snapRef = useRef(snapToGrid);
  const onMoveRef = useRef(onMove);
  const onResizeRef = useRef(onResize);
  const onFocusRef = useRef(onFocus);
  const onRenameRef = useRef(onRename);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const renamingRef = useRef(false);
  const draftRef = useRef("");
  const pointerId = useRef<number | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState("");

  winRef.current = win;
  snapRef.current = snapToGrid;
  onMoveRef.current = onMove;
  onResizeRef.current = onResize;
  onFocusRef.current = onFocus;
  onRenameRef.current = onRename;
  draftRef.current = draft;

  const applyPosition = (clientX: number, clientY: number) => {
    const el = elRef.current;
    const current = winRef.current;
    if (!el) return;
    if (dragArmed.current && !dragging.current) {
      const dx = clientX - origin.current.pointerX;
      const dy = clientY - origin.current.pointerY;
      if (dx * dx + dy * dy < 25) return;
      dragging.current = true;
      if (pointerId.current != null) {
        try {
          titleBarRef.current?.setPointerCapture(pointerId.current);
        } catch {
          /* capture needs a real pointer */
        }
      }
    }
    if (!dragging.current) return;
    const deskW = el.parentElement?.clientWidth ?? 800;
    const deskH = el.parentElement?.clientHeight ?? 600;
    const vis = visibleWindowSize(current, deskW, deskH);
    const { x: nextX, y: nextY } = clampWindowPosition(
      origin.current.x + (clientX - origin.current.pointerX),
      origin.current.y + (clientY - origin.current.pointerY),
      vis.width,
      vis.height,
      deskW,
      deskH,
      snapRef.current
    );
    live.current = { ...live.current, x: nextX, y: nextY };
    el.style.left = `${nextX}px`;
    el.style.top = `${nextY}px`;
  };

  const applySize = (clientX: number, clientY: number) => {
    const el = elRef.current;
    const session = resizing.current;
    if (!el || !session) return;
    const deskW = el.parentElement?.clientWidth ?? 800;
    const deskH = el.parentElement?.clientHeight ?? 600;
    const next = applyCornerResize(
      session.corner,
      session,
      clientX - session.pointerX,
      clientY - session.pointerY,
      deskW,
      deskH,
      snapRef.current
    );
    live.current = next;
    el.style.left = `${next.x}px`;
    el.style.top = `${next.y}px`;
    el.style.width = `${next.width}px`;
    el.style.height = `${next.height}px`;
  };

  const endDrag = () => {
    dragArmed.current = false;
    if (!dragging.current || !elRef.current) return;
    dragging.current = false;
    const nextX = parseInt(elRef.current.style.left, 10) || 0;
    const nextY = parseInt(elRef.current.style.top, 10) || 0;
    onMoveRef.current(winRef.current.id, nextX, nextY);
  };

  const endResize = () => {
    if (!resizing.current || !elRef.current) return;
    resizing.current = null;
    const nextX = parseInt(elRef.current.style.left, 10) || 0;
    const nextY = parseInt(elRef.current.style.top, 10) || 0;
    const nextW = parseInt(elRef.current.style.width, 10) || live.current.width;
    const nextH = parseInt(elRef.current.style.height, 10) || live.current.height;
    onResizeRef.current(winRef.current.id, {
      x: nextX,
      y: nextY,
      width: nextW,
      height: nextH,
    });
  };

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (resizing.current) applySize(event.clientX, event.clientY);
      else if (dragging.current || dragArmed.current) applyPosition(event.clientX, event.clientY);
    };
    const onMouseMove = (event: MouseEvent) => {
      if (resizing.current) applySize(event.clientX, event.clientY);
      else if (dragging.current || dragArmed.current) applyPosition(event.clientX, event.clientY);
    };
    const stop = () => {
      pointerId.current = null;
      endDrag();
      endResize();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("pointerup", stop);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("mouseup", stop);
    };
  }, []);

  // Apply saved position whenever React re-renders — but never while dragging
  // or resizing, so a re-render from auto-save cannot yank the window back.
  useLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (dragging.current || dragArmed.current || resizing.current) {
      el.style.left = `${live.current.x}px`;
      el.style.top = `${live.current.y}px`;
      if (resizing.current) {
        el.style.width = `${live.current.width}px`;
        el.style.height = `${live.current.height}px`;
      }
      return;
    }
    if (win.maximized) {
      el.style.left = "0px";
      el.style.top = "0px";
      return;
    }
    el.style.left = `${win.x}px`;
    el.style.top = `${win.y}px`;
  });

  // Select the whole name as soon as the rename field appears,
  // like renaming a file on the desktop.
  useLayoutEffect(() => {
    if (!renaming) return;
    const input = titleInputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [renaming]);

  const beginRename = () => {
    dragging.current = false;
    renamingRef.current = true;
    setDraft(winRef.current.title);
    setRenaming(true);
  };

  /** save: true writes the name; false leaves the previous title alone. */
  const finishRename = (save: boolean) => {
    if (!renamingRef.current) return;
    renamingRef.current = false;
    setRenaming(false);
    if (save) {
      onRenameRef.current(winRef.current.id, draftRef.current.trim());
    }
  };

  const beginDrag = (clientX: number, clientY: number, target: EventTarget | null) => {
    if (winRef.current.maximized) return false;
    if (renamingRef.current) return false;
    const el = target as HTMLElement | null;
    // Buttons and the rename field keep their own clicks.
    // The title words still drag if you move, and rename if you only click.
    if (el?.closest?.("button, input, [data-resize-corner]")) return false;
    dragArmed.current = true;
    dragging.current = false;
    origin.current = {
      pointerX: clientX,
      pointerY: clientY,
      x: winRef.current.x,
      y: winRef.current.y,
    };
    live.current = {
      ...live.current,
      x: winRef.current.x,
      y: winRef.current.y,
    };
    onFocusRef.current(winRef.current.id);
    return true;
  };

  const beginResize = (corner: ResizeCorner, clientX: number, clientY: number) => {
    const current = winRef.current;
    if (current.maximized || current.minimized) return;
    dragging.current = false;
    resizing.current = {
      corner,
      pointerX: clientX,
      pointerY: clientY,
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
    };
    live.current = {
      x: current.x,
      y: current.y,
      width: current.width,
      height: current.height,
    };
    onFocusRef.current(current.id);
  };

  const showResize = !win.maximized && !win.minimized;

  return (
    <section
      ref={elRef}
      className={`${styles.window} ${
        win.kind === "folio" && !win.minimized && !win.maximized ? styles.windowStar : ""
      } ${win.maximized ? styles.windowMax : ""} ${win.minimized ? styles.windowMin : ""}`}
      style={{
        left: win.maximized ? 0 : win.x,
        top: win.maximized ? 0 : win.y,
        width: win.maximized ? "100%" : win.width,
        height: win.maximized ? "100%" : win.minimized ? undefined : win.height,
        zIndex: win.z,
      }}
      onPointerDown={() => onFocus(win.id)}
      aria-label={`${win.kind === "folio" ? "Text" : "Sketch"}: ${win.title}`}
    >
      {win.kind === "folio" && !win.minimized && !win.maximized && (
        <div className={styles.starSticker} aria-hidden="true">
          <span className={styles.star}>★</span>
        </div>
      )}
      <div
        ref={titleBarRef}
        className={styles.titleBar}
        data-drag-handle="true"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          if (beginDrag(event.clientX, event.clientY, event.target)) {
            pointerId.current = event.pointerId;
            event.preventDefault();
            try {
              titleBarRef.current?.setPointerCapture(event.pointerId);
            } catch {
              /* capture needs a real pointer; mouse fallback still works */
            }
          }
        }}
        onMouseDown={(event) => {
          if (event.button !== 0) return;
          if (dragArmed.current || dragging.current) return;
          if (beginDrag(event.clientX, event.clientY, event.target)) {
            event.preventDefault();
          }
        }}
        onDoubleClick={(event) => {
          const target = event.target as HTMLElement;
          // Close / min / max should not maximize; the title words rename instead.
          if (target.closest("button")) return;
          if (target.closest("[data-window-title]")) return;
          if (renamingRef.current) return;
          onMaximize(win.id);
        }}
      >
        {renaming ? (
          <input
            ref={titleInputRef}
            className={styles.titleRename}
            value={draft}
            aria-label="Window name"
            onChange={(event) => setDraft(event.target.value)}
            onPointerDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                finishRename(true);
              }
              if (event.key === "Escape") {
                event.preventDefault();
                finishRename(false);
              }
            }}
            onBlur={() => {
              // Clicking away saves a typed name; an empty field just cancels.
              finishRename(draftRef.current.trim().length > 0);
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.windowTitle}
            data-window-title="true"
            title="Click to rename"
            onClick={(event) => {
              event.stopPropagation();
              beginRename();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.stopPropagation();
              event.preventDefault();
              beginRename();
            }}
          >
            {win.title}
          </button>
        )}
        <div className={styles.windowControls}>
          <button
            type="button"
            className={`${styles.winBtn} ${styles.winBtnClose}`}
            aria-label="Close window"
            onClick={() => onClose(win.id)}
          >
            <svg className={styles.winBtnIcon} viewBox="0 0 12 12" aria-hidden="true">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                d="M3 3l6 6M9 3L3 9"
              />
            </svg>
          </button>
          {!win.maximized && (
            <button
              type="button"
              className={`${styles.winBtn} ${styles.winBtnMin}`}
              aria-label={win.minimized ? "Restore window" : "Minimize window"}
              onClick={() => onMinimize(win.id)}
            >
              <svg className={styles.winBtnIcon} viewBox="0 0 12 12" aria-hidden="true">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  d="M2.5 6h7"
                />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={`${styles.winBtn} ${styles.winBtnMax}`}
            aria-label={win.maximized ? "Restore window size" : "Expand window"}
            title={win.maximized ? "Restore" : "Expand"}
            onClick={() => onMaximize(win.id)}
          >
            {win.maximized ? <CollapseArrows /> : <ExpandArrows />}
          </button>
        </div>
      </div>

      {!win.minimized && <div className={styles.windowBody}>{children}</div>}

      {showResize &&
        (
          [
            ["sw", "Resize from bottom left"],
            ["se", "Resize from bottom right"],
          ] as const
        ).map(([corner, label]) => (
          <button
            key={corner}
            type="button"
            className={styles.resizeHandle}
            data-resize-corner={corner}
            aria-label={label}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              beginResize(corner, event.clientX, event.clientY);
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              beginResize(corner, event.clientX, event.clientY);
            }}
          />
        ))}
    </section>
  );
}
