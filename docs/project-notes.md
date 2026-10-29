# Project Notes

## Principles

- Keep the canvas model character-grid native.
- Keep export deterministic and testable.
- Avoid framework weight until interaction complexity makes it pay for itself.
- Prefer small modules with obvious ownership over a single growing script.

## File Map

- `app/index.html`: app shell and panel markup.
- `app/styles.css`: visual system and editor layout.
- `app/src/config.js`: grid and editor constants.
- `app/src/tools.js`: tool palette metadata and object templates.
- `app/src/ascii.js`: pure ASCII drawing and export.
- `app/src/sample.js`: starter document generation.
- `app/src/main.js`: DOM rendering, pointer events, history, clipboard, inspector.
- `tests/ascii.test.js`: renderer/export regression tests.

## Next Engineering Move

The next serious improvement should be direct text editing. It touches selection, keyboard handling, inspector sync, history, and export, so it will quickly reveal whether the current state model needs a small dedicated editor-state module.
