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
- `app/src/components.js`: component registry, groups, defaults, and prop metadata.
- `app/src/tools.js`: compatibility adapter for component-backed tool metadata.
- `app/src/ascii.js`: pure ASCII drawing and export.
- `app/src/sample.js`: starter document generation.
- `app/src/main.js`: DOM rendering, pointer events, history, clipboard, inspector.
- `tests/ascii.test.js`: renderer/export regression tests.
- `tests/components.test.js`: component registry regression tests.

## Current Engineering Move

The next serious improvement is custom component-library support. The registry should accept data-only library definitions, merge them with the core library, and preserve stable component IDs in saved documents and exports.

For the broader product direction, see [project-direction.md](project-direction.md).
