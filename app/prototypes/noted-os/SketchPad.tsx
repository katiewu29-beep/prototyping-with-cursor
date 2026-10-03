"use client";

/**
 * A sketch is a drawing canvas. Strokes are stored as lists of points so
 * undo/redo can simply add or remove a stroke, then redraw the parchment.
 */

import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Point, Stroke, StrokeTool } from "./types";
import styles from "./styles.module.css";

const INK_COLORS = [
  { name: "Ink", value: "#1c1c1c" },
  { name: "Blue", value: "#3b6fd4" },
  { name: "Pink", value: "#f47aa8" },
  { name: "Gold", value: "#f2d048" },
  { name: "Green", value: "#7ec45a" },
  { name: "Lilac", value: "#8f84b0" },
] as const;

const WIDTHS = [2, 5, 10] as const;

/**
 * Sketch tools are solid silhouettes on brass buttons.
 * Hover a button to see its name.
 */
function ToolGlyph({ children }: { children: ReactNode }) {
  return (
    <svg className={styles.toolIcon} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function PenGlyph() {
  return (
    <ToolGlyph>
      {/* Pencil at a writing angle, with a short stroke from the tip */}
      <g transform="rotate(-45 11 13)">
        <rect x="9.1" y="1" width="5.8" height="2.6" rx="0.7" fill="currentColor" />
        <rect x="9.6" y="3.5" width="4.8" height="11.2" rx="0.35" fill="currentColor" />
        <path fill="currentColor" d="M9.6 14.7h4.8L12 22.2Z" />
      </g>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M14.8 18.4c1.6.7 3.2.4 5.2-.8"
      />
    </ToolGlyph>
  );
}

function EraseGlyph() {
  return (
    <ToolGlyph>
      {/* Classic drawing-app eraser: a thick rubber block on the diagonal */}
      <rect
        x="1.6"
        y="6"
        width="20.8"
        height="12"
        rx="2.4"
        fill="currentColor"
        transform="rotate(-38 12 12)"
      />
    </ToolGlyph>
  );
}

function UndoGlyph() {
  return (
    <ToolGlyph>
      {/* Go-back: arrow left, then a U-turn like a written correction */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.2 6.5 3.4 12.2 9.2 18M3.4 12.2H15a5 5 0 0 1 0 10"
      />
    </ToolGlyph>
  );
}

function RedoGlyph() {
  return (
    <ToolGlyph>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.8 6.5 20.6 12.2 14.8 18M20.6 12.2H9a5 5 0 0 0 0 10"
      />
    </ToolGlyph>
  );
}

function ExportGlyph() {
  return (
    <ToolGlyph>
      {/* Arrow into a tray: take a print / save the plate */}
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        d="M12 3.2v11.2"
      />
      <path fill="currentColor" d="M6.8 11.4 12 17.4 17.2 11.4Z" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        d="M4.2 20.6h15.6"
      />
    </ToolGlyph>
  );
}

type SketchPadProps = {
  title: string;
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
};

function mapPoint(canvas: HTMLCanvasElement, event: PointerEvent<HTMLCanvasElement>): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function paintStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const pts = stroke.points;
  if (pts.length === 0) return;

  ctx.save();
  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
  }
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fillStyle = stroke.tool === "eraser" ? "rgba(0,0,0,1)" : stroke.color;
    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
    }
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2;
    const midY = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
  ctx.stroke();
  ctx.restore();
}

function redraw(canvas: HTMLCanvasElement, strokes: Stroke[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  for (const stroke of strokes) {
    paintStroke(ctx, stroke);
  }
}

export default function SketchPad({ title, strokes, onChange }: SketchPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokesRef = useRef(strokes);
  const currentRef = useRef<Stroke | null>(null);
  const redoRef = useRef<Stroke[]>([]);

  const [tool, setTool] = useState<StrokeTool>("pen");
  const [color, setColor] = useState<string>(INK_COLORS[0].value);
  const [width, setWidth] = useState<number>(5);
  const [canUndo, setCanUndo] = useState(strokes.length > 0);
  const [canRedo, setCanRedo] = useState(false);
  const [drawing, setDrawing] = useState(false);

  useEffect(() => {
    strokesRef.current = strokes;
    setCanUndo(strokes.length > 0);
    const canvas = canvasRef.current;
    if (canvas) redraw(canvas, strokes);
  }, [strokes]);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: w, height: h } = wrap.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw(canvas, strokesRef.current);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    fitCanvas();
    const observer = new ResizeObserver(() => fitCanvas());
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [fitCanvas]);

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const point = mapPoint(canvas, event);
    const stroke: Stroke = {
      tool,
      color,
      width,
      points: [point],
    };
    currentRef.current = stroke;
    setDrawing(true);
    const ctx = canvas.getContext("2d");
    if (ctx) paintStroke(ctx, stroke);
  };

  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const stroke = currentRef.current;
    if (!canvas || !stroke) return;
    const point = mapPoint(canvas, event);
    stroke.points.push(point);
    const ctx = canvas.getContext("2d");
    if (!ctx || stroke.points.length < 2) return;
    const a = stroke.points[stroke.points.length - 2];
    const b = stroke.points[stroke.points.length - 1];
    ctx.save();
    if (stroke.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = stroke.color;
    }
    ctx.lineWidth = stroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  };

  const finishStroke = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const stroke = currentRef.current;
    if (!canvas || !stroke) return;
    currentRef.current = null;
    setDrawing(false);
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
    const next = [...strokesRef.current, stroke];
    redoRef.current = [];
    setCanRedo(false);
    onChange(next);
  };

  const undo = () => {
    if (strokesRef.current.length === 0) return;
    const next = [...strokesRef.current];
    const popped = next.pop();
    if (popped) redoRef.current.push(popped);
    setCanRedo(true);
    onChange(next);
  };

  const redo = () => {
    const restored = redoRef.current.pop();
    if (!restored) return;
    setCanRedo(redoRef.current.length > 0);
    onChange([...strokesRef.current, restored]);
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fbf8f3";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    const safe = title.replace(/[^\w]+/g, "-").replace(/^-|-$/g, "") || "sketch";
    link.download = `noted-os-${safe}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="Drawing tools">
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.glyphBtn} ${tool === "pen" ? styles.toolBtnOn : ""}`}
          aria-label="Pen"
          title="Pen"
          aria-pressed={tool === "pen"}
          onClick={() => setTool("pen")}
        >
          <PenGlyph />
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.glyphBtn} ${tool === "eraser" ? styles.toolBtnOn : ""}`}
          aria-label="Erase"
          title="Erase"
          aria-pressed={tool === "eraser"}
          onClick={() => setTool("eraser")}
        >
          <EraseGlyph />
        </button>
        <span className={styles.toolRule} aria-hidden="true" />
        <div className={styles.swatches} role="group" aria-label="Ink color">
          {INK_COLORS.map((ink) => (
            <button
              key={ink.value}
              type="button"
              className={`${styles.swatch} ${color === ink.value ? styles.swatchOn : ""}`}
              style={{ backgroundColor: ink.value }}
              aria-label={ink.name}
              aria-pressed={color === ink.value}
              onClick={() => {
                setColor(ink.value);
                setTool("pen");
              }}
            />
          ))}
        </div>
        <span className={styles.toolRule} aria-hidden="true" />
        <div className={styles.widths} role="group" aria-label="Stroke width">
          {WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              className={`${styles.toolBtn} ${width === w ? styles.toolBtnOn : ""}`}
              aria-pressed={width === w}
              aria-label={`Stroke ${w}`}
              onClick={() => setWidth(w)}
            >
              <span
                className={styles.widthDot}
                style={{ width: w + 4, height: w + 4 }}
              />
            </button>
          ))}
        </div>
        <span className={styles.toolRule} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.glyphBtn}`}
          aria-label="Undo"
          title="Undo"
          disabled={!canUndo}
          onClick={undo}
        >
          <UndoGlyph />
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.glyphBtn}`}
          aria-label="Redo"
          title="Redo"
          disabled={!canRedo}
          onClick={redo}
        >
          <RedoGlyph />
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.glyphBtn}`}
          aria-label="Export"
          title="Export"
          onClick={exportPng}
        >
          <ExportGlyph />
        </button>
      </div>
      <div ref={wrapRef} className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={finishStroke}
        />
        {strokes.length === 0 && !drawing && (
          <p className={styles.canvasHint}>scribble a comet…</p>
        )}
      </div>
    </>
  );
}
