# Wiromancer

Wiromancer is a funky ASCII wireframe editor for sketching interface ideas on a character grid and exporting them as Markdown-friendly text.

## Current Shape

- Static browser app: open `app/index.html` directly.
- No install step required for the editor.
- Core ASCII rendering is isolated in `app/src/ascii.js`.
- Component definitions live in `app/src/components.js`.
- Tool UI metadata is generated through `app/src/tools.js`.
- Browser interaction lives in `app/src/main.js`.
- Renderer tests live in `tests/ascii.test.js`.
- Component registry tests live in `tests/components.test.js`.
- User-facing controls are documented in `docs/options.md`.
- Component registry notes are documented in `docs/components.md`.
- Project direction and longer-term ideas are documented in `docs/project-direction.md`.

## Local Checks

```sh
npm run check
npm test
```

## Product Spine

Fast ASCII wireframes that export clean Markdown.

That means the editor should prioritize:

- Precise grid interactions.
- Reliable selection, movement, resize, undo, and redo.
- Clear component presets.
- Editable text and component properties.
- Clean export that can be pasted into issues, specs, docs, and chats.

## Near-Term Roadmap

1. Direct text editing on the canvas.
2. Save/load with local autosave.
3. Keyboard nudging and duplicate.
4. Marquee select and multi-select.
5. Component registry and editable component props.
6. Markdown import/export polish.
