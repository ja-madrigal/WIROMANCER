# Wiromancer Project Direction

This document captures product direction and ideas that should survive beyond a single planning session. `PLAN.md` tracks executable milestones; this document records the reasons and longer-term shape behind them.

## Product Shape

Wiromancer is a fast, weird, useful ASCII wireframe editor. The character grid is the product's identity, not merely an implementation detail. The editor should feel precise enough for layout work while staying lightweight and approachable.

The core loop is:

1. Choose a component.
2. Place it on the infinite-feeling grid.
3. Adjust its content, size, position, and layer order.
4. Combine components into layouts.
5. Export clean ASCII or Markdown.

## Component Library Direction

Components should be separate, reusable instances rather than behavior scattered through the editor. The registry groundwork now lives in `app/src/components.js`.

The intended evolution is:

- Core components ship with Wiromancer.
- Users can add or replace component-library definitions.
- Library definitions should be data-first and reuse known renderer primitives.
- Component instances should retain a stable `componentId` so saved documents remain understandable.
- Component props should drive the Details panel instead of requiring one hardcoded inspector for every component.
- Export must remain deterministic regardless of library ordering.

The first custom-library format should be JSON or another data-only format. Arbitrary JavaScript renderers can be considered later as an explicit developer mode, but they should not be required for normal customization or hosting.

## Interaction Principles

- Keep the canvas infinite-feeling, with fixed app chrome and scrolling inside work zones.
- Keep the grid precise: 8px cells, tiny dots, and zoom that enlarges objects without enlarging labels disproportionately.
- Make selection composable: marquee selection, shift-select, grouping, shared bounds, movement, alignment, distribution, and predictable layer ordering.
- Keep one-step placement: choosing a component places one instance and returns to Select.
- Prefer keyboard shortcuts for repeated editor actions while keeping visible controls discoverable.

## Visual Direction

The header and floating toolbar are intentionally open for traditional hand-crafted design. The ASCII title mark is a starting point, not a final brand system. Future visual work should preserve the tool's compact, utilitarian feel and avoid letting decoration compete with the canvas.

## Hosting Direction

The app is currently static and should remain deployable as plain files. No server is required for the editor's current local-storage workflow.

Reasonable hosting options include:

- GitHub Pages for the simplest repository-native public demo.
- Vercel for convenient previews and a path toward future server features.
- Cloudflare Pages or Netlify for static deployment with simple CI integration.

The source should remain platform-neutral until there is a concrete need for backend storage, collaboration, accounts, or server-side rendering.

## Ideas To Revisit

- User-importable component libraries.
- A library manager for enabling, disabling, exporting, and replacing component sets.
- Component-specific prop controls and editable internal parts.
- Copy raw ASCII plus `.txt` and `.md` export.
- Import ASCII into editable-ish text blocks.
- A small in-app help/reference view generated from `docs/options.md` and `docs/components.md`.
- Refined hand-crafted header and floating-toolbar treatment.
- A public hosted demo once the component-library workflow feels stable.
