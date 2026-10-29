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

1. Load optional custom component libraries.
2. Generate Details-panel controls from component props.
3. Import ASCII into editable-ish text blocks.
4. Add a library manager for enabling, exporting, and replacing component sets.
5. Refine the hand-crafted header and floating toolbar.
