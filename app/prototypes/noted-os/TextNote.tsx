"use client";

/**
 * A text note uses a contentEditable surface so typing,
 * selecting, copy, and paste behave like a familiar word processor.
 * document.execCommand is an older browser API, but it is still the simplest
 * way to apply bold/italic/lists/headings without adding a heavy editor library.
 */

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import styles from "./styles.module.css";

type TextNoteProps = {
  html: string;
  onChange: (html: string) => void;
  onTitle: (title: string) => void;
};

type Format = "bold" | "italic" | "ul" | "ol" | "h2" | "p";

function BulletListGlyph() {
  return (
    <svg className={styles.listIcon} viewBox="0 0 20 18" aria-hidden="true">
      <circle cx="2.6" cy="3" r="1.7" fill="currentColor" />
      <rect x="6.2" y="2.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
      <circle cx="2.6" cy="9" r="1.7" fill="currentColor" />
      <rect x="6.2" y="8.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
      <circle cx="2.6" cy="15" r="1.7" fill="currentColor" />
      <rect x="6.2" y="14.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
    </svg>
  );
}

function NumberListGlyph() {
  return (
    <svg className={styles.listIcon} viewBox="0 0 20 18" aria-hidden="true">
      <text
        x="0"
        y="4.6"
        fill="currentColor"
        fontSize="6.2"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        1
      </text>
      <text
        x="0"
        y="10.6"
        fill="currentColor"
        fontSize="6.2"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        2
      </text>
      <text
        x="0"
        y="16.6"
        fill="currentColor"
        fontSize="6.2"
        fontWeight="700"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        3
      </text>
      <rect x="6.2" y="2.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
      <rect x="6.2" y="8.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
      <rect x="6.2" y="14.1" width="13" height="1.9" rx="0.6" fill="currentColor" />
    </svg>
  );
}

/** First few words of a note — used as the title until the user renames it. */
export function firstLineTitle(text: string) {
  const line = text.replace(/\u00a0/g, " ").trim().split("\n")[0] ?? "";
  return line.slice(0, 42) || "Untitled text";
}

/** Same idea, but starting from saved HTML (when a custom name is cleared). */
export function firstLineTitleFromHtml(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return firstLineTitle(tmp.innerText || "");
}

/** True when the caret/highlight is inside this note — not another window. */
function selectionIsIn(el: HTMLElement | null) {
  if (!el) return false;
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const node = sel.anchorNode;
  if (!node) return false;
  return el.contains(node);
}

/**
 * Heading vs body for the current caret. Headings are h1–h6;
 * everything else (paragraphs, lists, empty lines) counts as a paragraph
 * so one of the two toolbar buttons is always on.
 */
function blockIsHeading(editor: HTMLElement): boolean {
  const sel = document.getSelection();
  let node: Node | null = sel?.anchorNode ?? null;
  if (!node || !editor.contains(node)) return false;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  while (node && node !== editor) {
    const tag = (node as HTMLElement).tagName?.toLowerCase();
    if (tag && /^h[1-6]$/.test(tag)) return true;
    if (tag === "p" || tag === "blockquote" || tag === "pre") return false;
    node = (node as HTMLElement).parentElement;
  }
  return false;
}

/** Remember the caret so toolbar clicks can format the same words. */
function saveSelection(editor: HTMLElement | null, stored: { current: Range | null }) {
  if (!editor || !selectionIsIn(editor)) return;
  const sel = document.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  stored.current = sel.getRangeAt(0).cloneRange();
}

function restoreSelection(editor: HTMLElement | null, stored: { current: Range | null }) {
  const range = stored.current;
  if (!editor || !range) return false;
  try {
    if (!editor.contains(range.commonAncestorContainer)) return false;
    const sel = document.getSelection();
    if (!sel) return false;
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  } catch {
    return false;
  }
}

export default function TextNote({ html, onChange, onTitle }: TextNoteProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);
  const savedRange = useRef<Range | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({ p: true });

  useEffect(() => {
    const el = editorRef.current;
    if (!el || seeded.current) return;
    el.innerHTML = html || "<p></p>";
    seeded.current = true;
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* not supported in every browser */
    }
    const startsWithHeading = /^h[1-6]$/i.test(el.firstElementChild?.tagName ?? "");
    setActive({ p: !startsWithHeading, h2: startsWithHeading });
  }, [html]);

  // queryCommandState is page-wide, so every note would light up the same
  // Bold/Italic buttons unless we ignore selections that live in other windows.
  const syncToolbar = () => {
    const el = editorRef.current;
    if (!el || !selectionIsIn(el)) {
      // Leave Heading/Paragraph as they were; clear marks that leak across windows.
      setActive((prev) => {
        const heading = !!prev.h2;
        const next = {
          h2: heading,
          p: !heading,
          bold: false,
          italic: false,
          ul: false,
          ol: false,
        };
        const same =
          !!prev.h2 === next.h2 &&
          !!prev.p === next.p &&
          !prev.bold &&
          !prev.italic &&
          !prev.ul &&
          !prev.ol;
        return same ? prev : next;
      });
      return;
    }
    try {
      const heading = blockIsHeading(el);
      saveSelection(el, savedRange);
      setActive({
        h2: heading,
        p: !heading,
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    } catch {
      /* queryCommandState can throw in some browsers */
    }
  };

  useEffect(() => {
    const onSelectionChange = () => syncToolbar();
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  });

  const emit = () => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerHTML);
    onTitle(firstLineTitle(el.innerText || ""));
  };

  const apply = (format: Format) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    // Put the caret back where it was before the toolbar click.
    if (!restoreSelection(el, savedRange) && !selectionIsIn(el)) {
      // Last resort: caret at the end, so the next letters pick up the style.
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = document.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    try {
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* older browsers */
    }
    if (format === "bold") document.execCommand("bold");
    if (format === "italic") document.execCommand("italic");
    if (format === "ul") document.execCommand("insertUnorderedList");
    if (format === "ol") document.execCommand("insertOrderedList");
    if (format === "h2") document.execCommand("formatBlock", false, "h2");
    if (format === "p") document.execCommand("formatBlock", false, "p");
    saveSelection(el, savedRange);
    emit();
    syncToolbar();
  };

  const keepCaret = (event: PointerEvent | MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <div className={styles.toolbar} role="toolbar" aria-label="Text formatting">
        <button
          type="button"
          className={`${styles.toolBtn} ${active.bold ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.bold}
          aria-label="Bold"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("bold")}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${active.italic ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.italic}
          aria-label="Italic"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("italic")}
        >
          <em>I</em>
        </button>
        <span className={styles.toolRule} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.toolBtn} ${active.h2 ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.h2}
          aria-label="Heading"
          title="Heading"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("h2")}
        >
          <span className={styles.headingMark}>
            H<span className={styles.headingLevel}>1</span>
          </span>
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${active.p ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.p}
          aria-label="Body paragraph"
          title="Paragraph"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("p")}
        >
          <span className={styles.paragraphMark}>p</span>
        </button>
        <span className={styles.toolRule} aria-hidden="true" />
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.listBtn} ${active.ul ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.ul}
          aria-label="Bullet list"
          title="Bullet list"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("ul")}
        >
          <BulletListGlyph />
        </button>
        <button
          type="button"
          className={`${styles.toolBtn} ${styles.listBtn} ${active.ol ? styles.toolBtnOn : ""}`}
          aria-pressed={!!active.ol}
          aria-label="Numbered list"
          title="Numbered list"
          onMouseDown={keepCaret}
          onPointerDown={keepCaret}
          onClick={() => apply("ol")}
        >
          <NumberListGlyph />
        </button>
      </div>
      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Text note"
        suppressContentEditableWarning
        onMouseUp={() => saveSelection(editorRef.current, savedRange)}
        onKeyUp={() => saveSelection(editorRef.current, savedRange)}
        onInput={() => {
          emit();
          saveSelection(editorRef.current, savedRange);
          syncToolbar();
        }}
        onBlur={() => {
          emit();
          window.setTimeout(syncToolbar, 0);
        }}
        onPaste={() => {
          // Native paste keeps copy/paste working (including rich text).
          window.setTimeout(emit, 0);
        }}
      />
    </>
  );
}
