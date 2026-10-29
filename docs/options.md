# Wiromancer Options And Controls

This document lists the user-facing options currently available in Wiromancer. It is written so the content can later be adapted into in-app help.

## Document Controls

- Document name: names the current working document for autosave and export. Use Save to store or update it as a named local document.
- Saved status: shows whether the current document is saved, unsaved, saving, or has a storage/import error.
- Save: stores the current document as a named browser-local document.
- Saved documents: lists named documents stored in this browser.
- Load: replaces the current canvas with the selected named document.
- Reset: discards the current working canvas and restores the starter Wiromancer sample document.
- Export JSON: downloads the editable document as a `.wiromancer.json` file.
- Import JSON: loads a `.wiromancer.json` file and saves it as a named browser-local document.

All persistence is local to the browser. Wiromancer does not send document data to a server.

## Canvas Controls

- Select: selects, moves, resizes, and edits existing objects.
- Grid toggle: shows or hides the 8px square canvas grid.
- Zoom out: decreases canvas zoom.
- Zoom readout/reset: shows current zoom and resets to 125%.
- Zoom in: increases canvas zoom.
- Align left/top/bottom/right: aligns selected objects to the shared selection edge.
- Distribute horizontally/vertically: spaces three or more selected objects evenly between the outermost objects.
- Copy Markdown: copies the current ASCII canvas inside a Markdown text code block.
- Copy ASCII: copies the current ASCII output without a Markdown fence.
- Export TXT: downloads the current ASCII output as `wiromancer.txt`.
- Export MD: downloads the current ASCII output inside a Markdown code block as `wiromancer.md`.
- Export size: uses content bounds by default, or the full fixed 400×300 canvas when selected.

## Object Placement

- Choose a tool from the UI Elements rail.
- Click the canvas to place the object.
- After placement, Wiromancer automatically returns to Select with the new object selected.

## Object Editing

- Drag a selected object to move it.
- Drag one selected object to move all selected objects together.
- Drag on empty canvas to marquee select objects.
- Marquee and multi-select show one shared selection bounds box around the selected objects.
- Shift-click an object or layer to add or remove it from the current selection.
- Shift-drag on empty canvas to add marquee-selected objects to the current selection.
- Press Shift + G to group selected objects, or to ungroup the selected group.
- Clicking a grouped object selects the group so it can move like a multi-selection.
- Use the resize handle to resize it.
- Double-click text-capable objects to edit text directly on the canvas.
- Press Enter to commit inline text edits.
- Press Escape to cancel inline text edits or return to Select.
- Use the Details panel to edit name, text, X, Y, width, and height for a single selected object.

## Layer Controls

- Layers are rendered and exported in stack order.
- In the Layers panel, `up` moves a layer forward.
- In the Layers panel, `down` moves a layer backward.
- Drag a layer row to reorder it.
- Shift-select multiple layers, then drag one selected layer row to reorder the selected block.
- Moving a layer backward can prevent it from blocking objects above it.
- Shift-click layers to build a multi-selection.

## Keyboard Shortcuts

- Arrow keys: move the selected object by 1 cell.
- Shift + Arrow keys: move the selected object or selected objects by 4 cells.
- Shift + G: group selected objects, or ungroup the selected group.
- Cmd/Ctrl + D: duplicate selected object or selected objects.
- Delete or Backspace: delete selected object or selected objects.
- Cmd/Ctrl + Z: undo.
- Cmd/Ctrl + Shift + Z: redo.
- Cmd/Ctrl + [: move selected layer backward.
- Cmd/Ctrl + ]: move selected layer forward.
- Alt + Arrow keys: align selected objects left, right, top, or bottom.
- Cmd/Ctrl + Plus: zoom in.
- Cmd/Ctrl + Minus: zoom out.
- Cmd/Ctrl + 0: reset zoom to 125%.
- Cmd/Ctrl + mouse wheel: zoom around the pointer.
