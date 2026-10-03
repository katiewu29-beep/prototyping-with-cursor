# Noted OS

A doodle notebook: cream desk, crayon decorations, and **rounded** notes you can write, type, or sketch on, then drag around.

## How to open it

From the project root:

```bash
npm run dev
```

Then open [http://localhost:3000/prototypes/noted-os](http://localhost:3000/prototypes/noted-os), or click **Noted OS** on the homepage.

## What you can try

1. **Move or resize a note** — drag anywhere on the top strip (including the name) to move it. Hover a bottom corner and drag to resize.
2. **New note or sketch** — use **Text** or **Sketch** at the top (next to ← Prototypes).
3. **Snap to grid** — click **Snap** so notes line up to a faint 24px grid.
4. **Note controls** — × close, a dash to tuck the note away, arrows to spread it across the desk. In full view the dash hides and the arrows reverse to restore. Double-click the empty part of the top strip also spreads it out. **Click the title** to rename.
5. **Write a text note** — Bold, Italic, Heading, lists, and ordinary copy/paste. Headings look hand-lettered; body text is rounded sans-serif. Text notes get a yellow star sticker (decoration only).
6. **Make a sketch** — pen, eraser, crayon colors, stroke size, undo/redo, and **Export** to download a PNG.
7. **Resize the browser** — notes stay fully on the cream desk. They slide, and look smaller if the desk is narrower than the note.
8. **Come back later** — layout, writing, and drawings are auto-saved in this browser.

The flower, letter magnets, planet, and schedule buddy on the desk are pictures only — they do not block dragging.

## Files in this folder

| File | Role |
| --- | --- |
| `page.tsx` | The desk: top tools, decorations, notes |
| `DeskDoodles.tsx` | Crayon drawings and stickers (look only) |
| `WindowFrame.tsx` | Draggable rounded note |
| `TextNote.tsx` | Typed note |
| `SketchPad.tsx` | Drawing on the same card |
| `storage.ts` | Saving to the browser (localStorage) |
| `types.ts` | Shared data shapes |
| `styles.module.css` | Doodle skin |

A snapshot of the earlier planetary-chart look is saved as `styles.chart.saved.css` (not used by the app — a restore copy).

## Stack

- Next.js (App Router) and React
- CSS Modules
- No extra libraries — text editing uses the browser’s built-in `contentEditable`, drawing uses a `<canvas>`
