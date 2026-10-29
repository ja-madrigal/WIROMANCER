# Wiromancer Plan

## Product Thesis

Wiromancer is a fast, weird, useful ASCII wireframe editor.

The core promise is simple: sketch UI ideas on a character grid, then export clean Markdown that can be pasted into issues, specs, docs, chats, and READMEs.

## Product Principles

- Make the grid feel precise.
- Keep output clean, deterministic, and readable.
- Make common wireframe objects quick to create.
- Let users stay in flow with keyboard-first editing.
- Keep the app lightweight until complexity justifies heavier tooling.
- Treat fun visual identity as seasoning, not a substitute for editor quality.

## Current State

The prototype is now organized as a small static project.

- `app/index.html`: app shell.
- `app/styles.css`: layout and visual system.
- `app/src/config.js`: editor constants.
- `app/src/components.js`: component registry, tool groups, defaults, and prop metadata.
- `app/src/tools.js`: compatibility adapter from component registry to tool UI.
- `app/src/ascii.js`: pure ASCII rendering/export.
- `app/src/sample.js`: starter document.
- `app/src/main.js`: browser UI, events, inspector, layers, history, clipboard.
- `tests/ascii.test.js`: renderer/export tests.
- `tests/components.test.js`: component registry tests.
- `README.md`: project summary and roadmap.
- `docs/project-notes.md`: engineering notes.
- `docs/project-direction.md`: durable product direction, decisions, hosting thoughts, and ideas.
- `docs/options.md`: user-facing options and controls reference.
- `docs/components.md`: component registry reference.

Recent editor updates:

- Fixed app shell with dedicated scrolling zones for tools, canvas, layers, and details.
- ASCII Wiromancer header mark.
- 8px square canvas grid with a large scrollable work surface.
- Canvas zoom controls and keyboard/wheel zoom shortcuts.
- Single-placement tool flow: choose a component, place once, return to Select.
- Right panel split between scrollable Layers and editable Details.
- Layer ordering controls for moving selected objects forward/backward in render/export order.
- Local autosave, restore-on-reload, named browser-local documents, and `.wiromancer.json` import/export.
- Marquee selection, shift-click multi-select, and multi-object move/delete/duplicate/nudge.
- Multi-object align and distribute controls.
- Shared multi-selection bounds, group/ungroup, and drag/drop layer reordering.
- Component registry groundwork with stable current renderer output.

Checks currently pass:

```sh
npm run check
npm test
```

## Milestone 1: Editor Feel

Goal: make the basic editor feel credible.

Status: complete in the current working folder.

Features:

- Direct text editing on the canvas.
- Keyboard nudging with arrow keys.
- Shift-arrow larger movement.
- Duplicate selected object.
- Escape to cancel/select.
- Better undo snapshots for text and movement.
- Clear selected object affordances.
- More reliable drag and resize behavior.

Acceptance:

- A user can create, label, move, resize, duplicate, and delete a simple form mockup without using the inspector for every edit.
- Markdown export still matches the canvas.
- Renderer tests still pass.

## Milestone 2: Persistence

Goal: make work survive reloads.

Status: complete in the current working folder.

Features:

- Local autosave.
- Save/load named local documents.
- Export/import `.wiromancer.json`.
- Reset to starter document.
- Dirty state indicator.

Acceptance:

- Reloading the app restores the last document.
- Exported JSON can be imported and produces the same canvas/export.
- No data leaves the browser.

## Milestone 3: Selection Power

Goal: make layout work less tedious.

Status: complete in the current working folder.

Features:

- Marquee selection. Done.
- Multi-select movement. Done.
- Group/ungroup. Done.
- Bring forward/send backward. Done for single selected layers.
- Drag/drop layer reordering for one or more selected layers. Done.
- Align left/right/top/bottom. Done.
- Distribute horizontally/vertically. Done.

Acceptance:

- Users can manipulate several objects without rebuilding layouts manually.
- Layer order and export order are predictable.

## Milestone 4: Component System

Goal: move from hardcoded objects to editable components.

Status: started.

Features:

- Component definitions with props. Started with `app/src/components.js`.
- Editable component parts.
- Better presets for forms, nav, dialogs, tables, cards, lists, tabs, and flows.
- Component-specific inspector controls.
- Component preview metadata.

Acceptance:

- Adding a new component does not require editing renderer/UI logic in several unrelated places.
- Component output remains deterministic and testable.

## Milestone 5: Import/Export Polish

Goal: make Wiromancer useful in real workflows.

Status: partially complete.

Features:

- Copy Markdown.
- Copy raw ASCII. Done.
- Export `.txt`. Done.
- Export `.md`. Done.
- Import ASCII as editable-ish text blocks.
- Trim export to content bounds. Done.
- Optional fixed canvas export. Done.

Acceptance:

- Export can be pasted into GitHub issues, Slack, docs, and Markdown files without cleanup.
- Import gives a useful starting point even if full object recovery is imperfect.

## Milestone 6: Product Identity

Goal: make it feel like Wiromancer, not a generic clone.

Status: partially started.

Features:

- Logo/mark exploration. Started with ASCII header mark.
- Refined color system.
- Small playful details in empty states and generated examples.
- App metadata and favicon.
- Project homepage if we decide to publish.

Acceptance:

- The app feels distinct while staying focused and usable.

## Technical Direction

Stay static for now.

Reasons:

- The app runs directly from `index.html`.
- No build step means fewer blockers.
- Pure renderer modules are already testable in Node.
- We can still introduce a bundler later if state/UI complexity justifies it.

Near-term code structure to add:

- `app/src/state.js`: document state, selection, history.
- `app/src/interaction.js`: keyboard and pointer commands.
- `app/src/storage.js`: local persistence.
- `app/src/commands.js`: editor actions such as move, duplicate, delete, align.

## Immediate Next Slice

Continue Milestone 4 component-system work.

Scope:

- Add support for optional custom component libraries loaded beside the core registry.
- Keep custom libraries data-only at first by reusing known renderer primitives.
- Surface component-specific prop metadata in the Details panel.
- Preserve deterministic Markdown export.

Why this slice:

The core component registry now exists. The next constraint is loading external library data and making the inspector understand component props.

## Working Notes For Codex

Primary working folder:

```text
/Users/jam/Projects/WIROMANCER
```

Previous working location, now retired:

```text
/Users/jam/Documents/Codex/2026-05-22/can-you-see-https-www-mockdown
```

If path permissions get weird, work in the primary working folder first, then mirror to the clean named copy when needed.

Useful commands:

```sh
npm run check
npm test
```

Browser note:

Direct `file://` browser automation may be blocked. For browser smoke tests, use a temporary loopback server:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8765/
```
