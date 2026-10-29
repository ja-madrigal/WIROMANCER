(function bootWiromancer() {
  const config = window.WiromancerConfig;
  const tools = window.WiromancerTools;
  const ascii = window.WiromancerAscii;
  const sample = window.WiromancerSample;

  const canvas = document.querySelector("#canvas");
  const canvasScaler = document.querySelector("#canvasScaler");
  const viewport = document.querySelector("#viewport");
  const layersEl = document.querySelector("#layers");
  const layerCount = document.querySelector("#layerCount");
  const statusTool = document.querySelector("#statusTool");
  const cursorStatus = document.querySelector("#cursorStatus");
  const copyStatus = document.querySelector("#copyStatus");
  const zoomResetBtn = document.querySelector("#zoomResetBtn");
  const emptyInspector = document.querySelector("#emptyInspector");
  const inspector = document.querySelector("#inspector");
  const documentName = document.querySelector("#documentName");
  const saveState = document.querySelector("#saveState");
  const documentSelect = document.querySelector("#documentSelect");
  const importJsonInput = document.querySelector("#importJsonInput");
  const fields = {
    name: document.querySelector("#fieldName"),
    text: document.querySelector("#fieldText"),
    x: document.querySelector("#fieldX"),
    y: document.querySelector("#fieldY"),
    w: document.querySelector("#fieldW"),
    h: document.querySelector("#fieldH")
  };

  let activeTool = "select";
  let selectedIds = [];
  let objects = [];
  let history = [];
  let future = [];
  let drag = null;
  let layerDrag = null;
  let resize = null;
  let marquee = null;
  let inlineEdit = null;
  let inspectorEditSnapshot = false;
  let zoom = 1.25;
  let saveTimer = null;
  let currentDocumentName = "Untitled";

  const storageKeys = {
    autosave: "wiromancer.autosave.v1",
    documents: "wiromancer.documents.v1"
  };

  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function snapPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(Math.floor((event.clientX - rect.left) / (config.cellWidth * zoom)) + 1, 1, config.columns),
      y: clamp(Math.floor((event.clientY - rect.top) / (config.cellHeight * zoom)) + 1, 1, config.rows)
    };
  }

  function saveHistory() {
    history.push(JSON.stringify(objects));
    if (history.length > config.maxHistory) history.shift();
    future = [];
  }

  function setSelection(ids) {
    const knownIds = new Set(objects.map((object) => object.id));
    selectedIds = [...new Set(ids)].filter((id) => knownIds.has(id));
  }

  function selectOnly(id) {
    setSelection(id ? [id] : []);
  }

  function clearSelection() {
    selectedIds = [];
  }

  function toggleSelection(id) {
    selectedIds = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
  }

  function isSelected(id) {
    return selectedIds.includes(id);
  }

  function selectedObjects() {
    return objects.filter((object) => isSelected(object.id));
  }

  function primarySelectedObject() {
    const primaryId = selectedIds.at(-1);
    return objects.find((object) => object.id === primaryId) || null;
  }

  function groupMembers(groupId) {
    return groupId ? objects.filter((object) => object.groupId === groupId) : [];
  }

  function selectionTargetIds(object) {
    return object?.groupId ? groupMembers(object.groupId).map((item) => item.id) : [object.id];
  }

  function selectObjectTarget(object) {
    setSelection(selectionTargetIds(object));
  }

  function toggleObjectTarget(object) {
    const targetIds = selectionTargetIds(object);
    const selected = targetIds.every((id) => selectedIds.includes(id));
    setSelection(selected
      ? selectedIds.filter((id) => !targetIds.includes(id))
      : [...selectedIds, ...targetIds]);
  }

  function setSaveState(state, label) {
    saveState.textContent = label;
    saveState.classList.toggle("dirty", state === "dirty");
    saveState.classList.toggle("saving", state === "saving");
    saveState.classList.toggle("error", state === "error");
  }

  function documentSnapshot(name = currentDocumentName) {
    return {
      version: 1,
      name: name || "Untitled",
      savedAt: new Date().toISOString(),
      canvas: {
        columns: config.columns,
        rows: config.rows,
        cellWidth: config.cellWidth,
        cellHeight: config.cellHeight
      },
      objects: objects.map((object) => ({ ...object }))
    };
  }

  function normalizeImportedObjects(sourceObjects) {
    if (!Array.isArray(sourceObjects)) throw new Error("Document does not contain an objects array.");
    return sourceObjects.map((object, index) => {
      const kind = typeof object.kind === "string" ? object.kind : "text";
      const base = tools.createObject(kind, 1, 1, object.id || uid());
      const w = clamp(Number(object.w) || base.w, 1, config.columns);
      const h = clamp(Number(object.h) || base.h, 1, config.rows);
      return {
        ...base,
        ...object,
        id: typeof object.id === "string" && object.id ? object.id : uid(),
        name: typeof object.name === "string" && object.name ? object.name : `${base.name} ${index + 1}`,
        kind,
        componentId: typeof object.componentId === "string" && object.componentId ? object.componentId : kind,
        text: typeof object.text === "string" ? object.text : "",
        x: clamp(Number(object.x) || 1, 1, config.columns - w + 1),
        y: clamp(Number(object.y) || 1, 1, config.rows - h + 1),
        w,
        h,
        visible: object.visible !== false,
        groupId: typeof object.groupId === "string" && object.groupId ? object.groupId : null
      };
    });
  }

  function applyDocumentSnapshot(snapshot, options = {}) {
    objects = normalizeImportedObjects(snapshot.objects);
    currentDocumentName = snapshot.name || options.fallbackName || "Untitled";
    documentName.value = currentDocumentName;
    selectOnly(objects.at(-1)?.id || null);
    history = [];
    future = [];
    setTool("select");
    if (options.autosave !== false) saveAutosave();
  }

  function readSavedDocuments() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKeys.documents) || "{}");
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeSavedDocuments(documents) {
    localStorage.setItem(storageKeys.documents, JSON.stringify(documents));
    renderDocumentSelect();
  }

  function renderDocumentSelect() {
    const documents = readSavedDocuments();
    const selectedName = documentSelect.value;
    documentSelect.innerHTML = `<option value="">Saved documents</option>`;
    Object.keys(documents).sort((a, b) => a.localeCompare(b)).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      documentSelect.append(option);
    });
    if (selectedName && documents[selectedName]) documentSelect.value = selectedName;
  }

  function saveAutosave() {
    try {
      currentDocumentName = documentName.value.trim() || "Untitled";
      documentName.value = currentDocumentName;
      localStorage.setItem(storageKeys.autosave, JSON.stringify(documentSnapshot(currentDocumentName)));
      setSaveState("saved", "Saved");
    } catch {
      setSaveState("error", "Error");
    }
  }

  function scheduleAutosave() {
    clearTimeout(saveTimer);
    setSaveState("dirty", "Unsaved");
    saveTimer = setTimeout(() => {
      setSaveState("saving", "Saving");
      saveAutosave();
    }, 250);
  }

  function markDocumentChanged() {
    scheduleAutosave();
  }

  function loadAutosave() {
    try {
      const raw = localStorage.getItem(storageKeys.autosave);
      if (!raw) return false;
      applyDocumentSnapshot(JSON.parse(raw), { autosave: false });
      setSaveState("saved", "Saved");
      return true;
    } catch {
      localStorage.removeItem(storageKeys.autosave);
      setSaveState("error", "Error");
      return false;
    }
  }

  function saveNamedDocument() {
    currentDocumentName = documentName.value.trim() || "Untitled";
    documentName.value = currentDocumentName;
    const documents = readSavedDocuments();
    documents[currentDocumentName] = documentSnapshot(currentDocumentName);
    writeSavedDocuments(documents);
    saveAutosave();
    documentSelect.value = currentDocumentName;
  }

  function loadNamedDocument() {
    const name = documentSelect.value;
    if (!name) return;
    const documents = readSavedDocuments();
    if (!documents[name]) return;
    saveHistory();
    applyDocumentSnapshot(documents[name]);
  }

  function resetToStarter() {
    saveHistory();
    localStorage.removeItem(storageKeys.autosave);
    objects = sample.starterDocument(tools.createObject, uid);
    selectOnly(objects.at(-1)?.id || null);
    currentDocumentName = "Untitled";
    documentName.value = currentDocumentName;
    setTool("select");
    saveAutosave();
  }

  function exportJsonDocument() {
    const snapshot = documentSnapshot(documentName.value.trim() || "Untitled");
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const filename = snapshot.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wiromancer";
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.wiromancer.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function importJsonDocument(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const snapshot = JSON.parse(text);
      saveHistory();
      const fallbackName = file.name.replace(/\.wiromancer\.json$/i, "").replace(/\.json$/i, "") || "Imported";
      applyDocumentSnapshot(snapshot, { fallbackName });
      saveNamedDocument();
    } catch {
      setSaveState("error", "Import error");
    } finally {
      importJsonInput.value = "";
    }
  }

  function isTextEditable(object) {
    return object && !["box", "line", "arrow", "input", "table", "progress", "split"].includes(object.kind);
  }

  function updateToolUi() {
    statusTool.textContent = activeTool.toUpperCase();
    document.querySelectorAll(".tool").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === activeTool);
    });
  }

  function updateZoomUi() {
    canvasScaler.style.setProperty("--zoom", zoom);
    canvasScaler.style.setProperty("--inverse-zoom", 1 / zoom);
    canvasScaler.style.width = `${config.columns * config.cellWidth * zoom}px`;
    canvasScaler.style.height = `${config.rows * config.cellHeight * zoom}px`;
    zoomResetBtn.textContent = `${Math.round(zoom * 100)}%`;
  }

  function setZoom(nextZoom, focalPoint = null) {
    const previousZoom = zoom;
    const next = clamp(nextZoom, 0.5, 4);
    if (next === previousZoom) return;

    const focal = focalPoint || {
      x: viewport.clientWidth / 2,
      y: viewport.clientHeight / 2
    };
    const worldX = (viewport.scrollLeft + focal.x) / previousZoom;
    const worldY = (viewport.scrollTop + focal.y) / previousZoom;

    zoom = next;
    updateZoomUi();

    viewport.scrollLeft = worldX * zoom - focal.x;
    viewport.scrollTop = worldY * zoom - focal.y;
  }

  function setTool(tool) {
    activeTool = tool;
    if (tool !== "select") clearSelection();
    updateToolUi();
    render();
  }

  function createToolButtons() {
    Object.entries(tools.toolGroups).forEach(([targetId, group]) => {
      const target = document.querySelector(`#${targetId}`);
      if (!target) return;
      group.forEach(([id, icon, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tool";
        button.dataset.tool = id;
        button.innerHTML = `<span class="tool-icon">${icon}</span><span>${label}</span>`;
        button.addEventListener("click", () => setTool(id));
        target.append(button);
      });
    });
  }

  function addObject(kind, x, y, overrides = {}) {
    const object = tools.createObject(kind, x, y, uid(), overrides);
    objects.push(object);
    selectOnly(object.id);
    render();
    markDocumentChanged();
  }

  function selectedObject() {
    return primarySelectedObject();
  }

  function objectFootprint(object) {
    const lines = ascii.drawObject(object);
    return {
      lines,
      width: Math.max(1, ...lines.map((line) => [...line].length)),
      height: Math.max(1, lines.length)
    };
  }

  function objectBounds(object) {
    const footprint = objectFootprint(object);
    return {
      left: object.x,
      right: object.x + footprint.width - 1,
      top: object.y,
      bottom: object.y + footprint.height - 1,
      width: footprint.width,
      height: footprint.height
    };
  }

  function renderedFootprintSize(footprint) {
    const measurer = renderedFootprintSize.node || document.createElement("div");
    if (!renderedFootprintSize.node) {
      measurer.className = "object-measurer";
      document.body.append(measurer);
      renderedFootprintSize.node = measurer;
    }
    measurer.textContent = footprint.lines.join("\n");
    const rect = measurer.getBoundingClientRect();
    return {
      width: Math.max(1, Math.ceil(rect.width)),
      height: Math.max(footprint.height * config.cellHeight, Math.ceil(rect.height))
    };
  }

  function renderCanvasObject(object) {
    const footprint = objectFootprint(object);
    const renderedSize = renderedFootprintSize(footprint);
    const el = document.createElement("div");
    el.className = "object";
    el.dataset.id = object.id;
    el.classList.toggle("selected", isSelected(object.id));
    el.style.left = `${(object.x - 1) * config.cellWidth}px`;
    el.style.top = `${(object.y - 1) * config.cellHeight}px`;
    el.style.width = `${renderedSize.width}px`;
    el.style.minHeight = `${renderedSize.height}px`;
    el.textContent = footprint.lines.join("\n");
    el.addEventListener("pointerdown", startObjectPointer);
    el.addEventListener("dblclick", startInlineEdit);
    if (isSelected(object.id) && selectedIds.length === 1) {
      const tag = document.createElement("span");
      tag.className = "selection-tag";
      tag.textContent = object.name;
      tag.style.top = `${-23 / zoom}px`;
      tag.style.transform = `scale(${1 / zoom})`;
      el.append(tag);

      const handle = document.createElement("span");
      handle.className = "resize-handle";
      handle.addEventListener("pointerdown", startResize);
      el.append(handle);
    }
    return el;
  }

  function renderSelectionBounds() {
    canvas.querySelector(".selection-bounds")?.remove();
    if (selectedIds.length < 2) return;
    const selectedNodes = [...canvas.querySelectorAll(".object.selected")];
    if (selectedNodes.length < 2) return;
    const rects = selectedNodes.map((node) => ({
      left: node.offsetLeft,
      top: node.offsetTop,
      right: node.offsetLeft + node.offsetWidth,
      bottom: node.offsetTop + node.offsetHeight
    }));
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    const bounds = document.createElement("div");
    bounds.className = "selection-bounds";
    bounds.style.left = `${left}px`;
    bounds.style.top = `${top}px`;
    bounds.style.width = `${right - left}px`;
    bounds.style.height = `${bottom - top}px`;
    canvas.append(bounds);
  }

  function renderLayers() {
    layersEl.innerHTML = "";
    layerCount.textContent = String(objects.length);
    [...objects].reverse().forEach((object) => {
      const row = document.createElement("div");
      row.className = "layer";
      row.classList.toggle("active", isSelected(object.id));
      row.classList.toggle("grouped", Boolean(object.groupId));
      row.draggable = true;
      row.dataset.id = object.id;
      row.addEventListener("dragstart", startLayerDrag);
      row.addEventListener("dragover", updateLayerDrag);
      row.addEventListener("dragleave", clearLayerDropMarker);
      row.addEventListener("drop", finishLayerDrop);
      row.addEventListener("dragend", clearLayerDragMarkers);

      const selectButton = document.createElement("button");
      selectButton.type = "button";
      selectButton.className = "layer-select";
      selectButton.innerHTML = `<span>${tools.layerIcon(object.kind)}</span><span>${object.name}</span>`;
      selectButton.addEventListener("click", (event) => {
        activeTool = "select";
        if (event.shiftKey) {
          toggleObjectTarget(object);
          updateToolUi();
        } else {
          selectObjectTarget(object);
          updateToolUi();
        }
        render();
      });

      const controls = document.createElement("span");
      controls.className = "layer-order";
      controls.append(layerOrderButton("front", object.id, "Move layer forward", "↑"));
      controls.append(layerOrderButton("back", object.id, "Move layer backward", "↓"));

      row.append(selectButton, controls);
      layersEl.append(row);
    });
  }

  function layerOrderButton(direction, id, label, text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layer-order-button";
    button.title = label;
    button.setAttribute("aria-label", label);
    button.textContent = text;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectOnly(id);
      moveLayer(id, direction);
    });
    return button;
  }

  function startLayerDrag(event) {
    const object = objects.find((item) => item.id === event.currentTarget.dataset.id);
    if (!object) return;
    activeTool = "select";
    if (!isSelected(object.id)) selectObjectTarget(object);
    updateToolUi();
    const displayIds = [...objects].reverse().map((item) => item.id);
    layerDrag = {
      ids: displayIds.filter((id) => selectedIds.includes(id)),
      dropId: null,
      position: "after"
    };
    event.currentTarget.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", object.id);
  }

  function updateLayerDrag(event) {
    if (!layerDrag) return;
    const targetId = event.currentTarget.dataset.id;
    if (layerDrag.ids.includes(targetId)) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const position = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    layerDrag.dropId = targetId;
    layerDrag.position = position;
    clearLayerDropMarker();
    event.currentTarget.classList.add(position === "before" ? "drop-before" : "drop-after");
  }

  function clearLayerDropMarker() {
    layersEl.querySelectorAll(".drop-before, .drop-after").forEach((row) => {
      row.classList.remove("drop-before", "drop-after");
    });
  }

  function clearLayerDragMarkers() {
    layerDrag = null;
    layersEl.querySelectorAll(".dragging, .drop-before, .drop-after").forEach((row) => {
      row.classList.remove("dragging", "drop-before", "drop-after");
    });
  }

  function finishLayerDrop(event) {
    if (!layerDrag) return;
    event.preventDefault();
    const targetId = layerDrag.dropId || event.currentTarget.dataset.id;
    if (!targetId || layerDrag.ids.includes(targetId)) {
      clearLayerDragMarkers();
      return;
    }

    const byId = new Map(objects.map((object) => [object.id, object]));
    const displayIds = [...objects].reverse().map((object) => object.id);
    const draggedIds = displayIds.filter((id) => layerDrag.ids.includes(id));
    const remainingIds = displayIds.filter((id) => !layerDrag.ids.includes(id));
    const targetIndex = remainingIds.indexOf(targetId);
    if (targetIndex < 0) {
      clearLayerDragMarkers();
      return;
    }

    const insertIndex = targetIndex + (layerDrag.position === "after" ? 1 : 0);
    const nextDisplayIds = [
      ...remainingIds.slice(0, insertIndex),
      ...draggedIds,
      ...remainingIds.slice(insertIndex)
    ];
    const nextObjects = [...nextDisplayIds].reverse().map((id) => byId.get(id)).filter(Boolean);
    if (nextObjects.map((object) => object.id).join("|") === objects.map((object) => object.id).join("|")) {
      clearLayerDragMarkers();
      return;
    }

    saveHistory();
    objects = nextObjects;
    setSelection(draggedIds);
    clearLayerDragMarkers();
    render();
    markDocumentChanged();
  }

  function renderInspector() {
    if (!fields.name) return;
    const object = selectedObject();
    const selectedCount = selectedIds.length;
    inspector.hidden = selectedCount !== 1;
    emptyInspector.hidden = selectedCount === 1;
    if (selectedCount !== 1) {
      emptyInspector.textContent = selectedCount > 1
        ? `${selectedCount} layers selected. Move, duplicate, delete, or nudge them together.`
        : "Select a layer on the canvas or in the list to edit its properties.";
      return;
    }
    fields.name.value = object.name;
    fields.text.value = object.text;
    fields.x.value = object.x;
    fields.y.value = object.y;
    fields.w.value = object.w;
    fields.h.value = object.h;
    fields.text.disabled = !isTextEditable(object);
  }

  function render() {
    canvas.querySelectorAll(".object, .selection-bounds").forEach((node) => node.remove());
    objects.filter((object) => object.visible).forEach((object) => canvas.append(renderCanvasObject(object)));
    renderSelectionBounds();
    renderLayers();
    renderInspector();
    if (inlineEdit) positionInlineEditor();
  }

  function startObjectPointer(event) {
    if (inlineEdit) return;
    const target = event.currentTarget;
    const object = objects.find((item) => item.id === target.dataset.id);
    if (!object) return;
    event.stopPropagation();
    activeTool = "select";
    if (event.shiftKey) {
      toggleObjectTarget(object);
      updateToolUi();
      render();
      return;
    }
    if (!isSelected(object.id)) selectObjectTarget(object);
    updateToolUi();
    renderLayers();
    renderInspector();
    target.classList.add("selected");
    const draggedObjects = selectedObjects();
    drag = {
      ids: draggedObjects.map((item) => item.id),
      startMouse: snapPoint(event),
      startPositions: draggedObjects.map((item) => {
        const bounds = objectBounds(item);
        return { id: item.id, x: item.x, y: item.y, w: bounds.width, h: bounds.height };
      }),
      changed: false
    };
    target.setPointerCapture(event.pointerId);
    target.classList.add("dragging");
  }

  function startResize(event) {
    const object = selectedObject();
    if (!object || inlineEdit || selectedIds.length !== 1) return;
    event.preventDefault();
    event.stopPropagation();
    resize = {
      id: object.id,
      startMouse: snapPoint(event),
      startW: objectBounds(object).width,
      startH: objectBounds(object).height,
      changed: false
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function objectIntersectsRect(object, rect) {
    const bounds = objectBounds(object);
    return bounds.left <= rect.right && bounds.right >= rect.left && bounds.top <= rect.bottom && bounds.bottom >= rect.top;
  }

  function marqueeRect(start, current) {
    return {
      left: Math.min(start.x, current.x),
      right: Math.max(start.x, current.x),
      top: Math.min(start.y, current.y),
      bottom: Math.max(start.y, current.y)
    };
  }

  function updateMarquee(point) {
    const rect = marqueeRect(marquee.start, point);
    const left = (rect.left - 1) * config.cellWidth;
    const top = (rect.top - 1) * config.cellHeight;
    const width = (rect.right - rect.left + 1) * config.cellWidth;
    const height = (rect.bottom - rect.top + 1) * config.cellHeight;

    marquee.node.style.left = `${left}px`;
    marquee.node.style.top = `${top}px`;
    marquee.node.style.width = `${width}px`;
    marquee.node.style.height = `${height}px`;
    marquee.changed = marquee.changed || rect.left !== rect.right || rect.top !== rect.bottom;

    const intersectingIds = objects.filter((object) => object.visible && objectIntersectsRect(object, rect)).map((object) => object.id);
    setSelection(marquee.additive ? [...marquee.baseIds, ...intersectingIds] : intersectingIds);
    renderLayers();
    renderInspector();
    canvas.querySelectorAll(".object").forEach((node) => {
      node.classList.toggle("selected", isSelected(node.dataset.id));
    });
    renderSelectionBounds();
  }

  function handlePointerMove(event) {
    const point = snapPoint(event);
    cursorStatus.textContent = `Ln ${point.y}, Col ${point.x}`;
    if (marquee) {
      updateMarquee(point);
      return;
    }
    if (drag) {
      let changed = false;
      drag.startPositions.forEach((start) => {
        const object = objects.find((item) => item.id === start.id);
        if (!object) return;
        const nextX = clamp(start.x + point.x - drag.startMouse.x, 1, config.columns - start.w + 1);
        const nextY = clamp(start.y + point.y - drag.startMouse.y, 1, config.rows - start.h + 1);
        if (nextX !== object.x || nextY !== object.y) {
          object.x = nextX;
          object.y = nextY;
          changed = true;
        }
      });
      if (changed) {
        if (!drag.changed) saveHistory();
        drag.changed = true;
        render();
      }
    }
    if (resize) {
      const object = objects.find((item) => item.id === resize.id);
      if (!object) return;
      const nextW = clamp(resize.startW + point.x - resize.startMouse.x, 1, config.columns - object.x + 1);
      const nextH = clamp(resize.startH + point.y - resize.startMouse.y, 1, config.rows - object.y + 1);
      if (nextW !== object.w || nextH !== object.h) {
        if (!resize.changed) saveHistory();
        resize.changed = true;
        object.w = nextW;
        object.h = nextH;
        render();
      }
    }
  }

  function handlePointerUp() {
    if (marquee) {
      const wasClick = !marquee.changed;
      if (wasClick && !marquee.additive) clearSelection();
      marquee.node.remove();
      marquee = null;
      render();
      return;
    }
    const hadDragOrResize = Boolean(drag || resize);
    const changed = Boolean(drag?.changed || resize?.changed);
    drag = null;
    resize = null;
    if (hadDragOrResize) render();
    if (changed) markDocumentChanged();
  }

  canvas.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);

  canvas.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".inline-editor")) return;
    if (inlineEdit) finishInlineEdit("commit");
    if (event.target !== canvas) return;
    const point = snapPoint(event);
    if (activeTool === "select") {
      const node = document.createElement("div");
      node.className = "marquee";
      canvas.append(node);
      marquee = {
        start: point,
        baseIds: [...selectedIds],
        additive: event.shiftKey,
        changed: false,
        node
      };
      updateMarquee(point);
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (activeTool === "pencil") {
      saveHistory();
      addObject("text", point.x, point.y, { name: "Pencil", kind: "text", text: "•" });
      setTool("select");
      return;
    }
    if (activeTool === "eraser") return;
    saveHistory();
    addObject(activeTool, point.x, point.y);
    setTool("select");
  });

  function startInlineEdit(event) {
    const object = objects.find((item) => item.id === event.currentTarget.dataset.id);
    if (!isTextEditable(object)) return;
    event.preventDefault();
    event.stopPropagation();
    finishInlineEdit("commit");
    selectOnly(object.id);
    setTool("select");

    const textarea = document.createElement("textarea");
    textarea.className = "inline-editor";
    textarea.value = object.text || "";
    textarea.setAttribute("aria-label", `Edit ${object.name} text`);
    canvas.append(textarea);
    inlineEdit = {
      id: object.id,
      originalText: object.text || "",
      textarea
    };
    positionInlineEditor();
    textarea.focus();
    textarea.select();

    textarea.addEventListener("input", () => {
      const current = objects.find((item) => item.id === inlineEdit?.id);
      if (!current) return;
      current.text = textarea.value;
      renderInspector();
    });
    textarea.addEventListener("keydown", (keyEvent) => {
      if (keyEvent.key === "Enter" && !keyEvent.shiftKey) {
        keyEvent.preventDefault();
        finishInlineEdit("commit");
      }
      if (keyEvent.key === "Escape") {
        keyEvent.preventDefault();
        finishInlineEdit("cancel");
      }
    });
    textarea.addEventListener("blur", () => finishInlineEdit("commit"));
  }

  function positionInlineEditor() {
    if (!inlineEdit) return;
    const object = objects.find((item) => item.id === inlineEdit.id);
    if (!object) {
      inlineEdit.textarea.remove();
      inlineEdit = null;
      return;
    }
    inlineEdit.textarea.style.left = `${(object.x - 1) * config.cellWidth}px`;
    inlineEdit.textarea.style.top = `${(object.y - 1) * config.cellHeight}px`;
    inlineEdit.textarea.style.width = `${Math.max(object.w, 8) * config.cellWidth}px`;
    inlineEdit.textarea.style.minHeight = `${Math.max(object.h, 1) * config.cellHeight}px`;
  }

  function finishInlineEdit(mode) {
    if (!inlineEdit) return;
    const edit = inlineEdit;
    const object = objects.find((item) => item.id === edit.id);
    inlineEdit = null;
    edit.textarea.remove();
    if (object) {
      const nextText = mode === "cancel" ? edit.originalText : edit.textarea.value;
      if (object.text !== edit.originalText) {
        object.text = edit.originalText;
      }
      if (nextText !== edit.originalText) {
        saveHistory();
        object.text = nextText;
        markDocumentChanged();
      }
    }
    render();
  }

  Object.values(fields).filter(Boolean).forEach((field) => {
    field.addEventListener("focus", () => {
      if (!inspectorEditSnapshot) {
        saveHistory();
        inspectorEditSnapshot = true;
      }
    });
    field.addEventListener("input", () => {
      const object = selectedObject();
      if (!object) return;
      object.name = fields.name.value || object.name;
      object.text = fields.text.value;
      object.x = clamp(Number(fields.x.value) || 1, 1, config.columns);
      object.y = clamp(Number(fields.y.value) || 1, 1, config.rows);
      object.w = clamp(Number(fields.w.value) || 1, 1, config.columns - object.x + 1);
      object.h = clamp(Number(fields.h.value) || 1, 1, config.rows - object.y + 1);
      render();
      markDocumentChanged();
    });
    field.addEventListener("change", () => {
      inspectorEditSnapshot = false;
    });
  });

  document.querySelector("#copyBtn").addEventListener("click", async () => {
    const markdown = "```text\n" + ascii.exportAscii(objects, config.columns, config.rows) + "\n```";
    try {
      await navigator.clipboard.writeText(markdown);
    } catch {
      const buffer = document.querySelector("#clipboardBuffer");
      buffer.value = markdown;
      buffer.select();
      document.execCommand("copy");
    }
    copyStatus.textContent = "Copied Markdown";
    setTimeout(() => copyStatus.textContent = "", 1800);
  });

  document.querySelector("#duplicateBtn").addEventListener("click", duplicateSelected);
  document.querySelector("#deleteBtn").addEventListener("click", deleteSelected);
  document.querySelector("#clearBtn").addEventListener("click", () => {
    if (!objects.length) return;
    saveHistory();
    objects = [];
    clearSelection();
    render();
    markDocumentChanged();
  });
  document.querySelector("#gridBtn").addEventListener("click", (event) => {
    canvas.classList.toggle("grid-hidden");
    event.currentTarget.classList.toggle("active", !canvas.classList.contains("grid-hidden"));
  });
  document.querySelector("#undoBtn").addEventListener("click", undo);
  document.querySelector("#redoBtn").addEventListener("click", redo);
  document.querySelector("#saveDocumentBtn").addEventListener("click", saveNamedDocument);
  document.querySelector("#loadDocumentBtn").addEventListener("click", loadNamedDocument);
  document.querySelector("#resetDocumentBtn").addEventListener("click", resetToStarter);
  document.querySelector("#exportJsonBtn").addEventListener("click", exportJsonDocument);
  document.querySelector("#importJsonBtn").addEventListener("click", () => importJsonInput.click());
  importJsonInput.addEventListener("change", () => importJsonDocument(importJsonInput.files[0]));
  documentName.addEventListener("input", () => {
    currentDocumentName = documentName.value.trim() || "Untitled";
    scheduleAutosave();
  });
  document.querySelector("#zoomOutBtn").addEventListener("click", () => setZoom(zoom - 0.25));
  document.querySelector("#zoomInBtn").addEventListener("click", () => setZoom(zoom + 0.25));
  zoomResetBtn.addEventListener("click", () => setZoom(1.25));
  document.querySelector("#alignLeftBtn").addEventListener("click", () => alignSelected("left"));
  document.querySelector("#alignTopBtn").addEventListener("click", () => alignSelected("top"));
  document.querySelector("#alignBottomBtn").addEventListener("click", () => alignSelected("bottom"));
  document.querySelector("#alignRightBtn").addEventListener("click", () => alignSelected("right"));
  document.querySelector("#distributeHorizontalBtn").addEventListener("click", () => distributeSelected("horizontal"));
  document.querySelector("#distributeVerticalBtn").addEventListener("click", () => distributeSelected("vertical"));
  viewport.addEventListener("wheel", (event) => {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    const rect = viewport.getBoundingClientRect();
    const step = event.deltaY > 0 ? -0.25 : 0.25;
    setZoom(zoom + step, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
  }, { passive: false });

  document.addEventListener("keydown", (event) => {
    if (inlineEdit) return;
    if ((event.metaKey || event.ctrlKey) && event.key === "]") {
      event.preventDefault();
      moveLayer(selectedIds.at(-1), "front");
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "[") {
      event.preventDefault();
      moveLayer(selectedIds.at(-1), "back");
    }
    if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      alignSelected("left");
    }
    if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      alignSelected("right");
    }
    if (event.altKey && event.key === "ArrowUp") {
      event.preventDefault();
      alignSelected("top");
    }
    if (event.altKey && event.key === "ArrowDown") {
      event.preventDefault();
      alignSelected("bottom");
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      event.preventDefault();
      duplicateSelected();
    }
    if (event.shiftKey && event.key.toLowerCase() === "g") {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      event.preventDefault();
      toggleGroupSelected();
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      deleteSelected();
    }
    if (event.key === "Escape") {
      clearSelection();
      setTool("select");
    }
    if (!event.altKey && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      const amount = event.shiftKey ? 4 : 1;
      const direction = {
        ArrowLeft: [-amount, 0],
        ArrowRight: [amount, 0],
        ArrowUp: [0, -amount],
        ArrowDown: [0, amount]
      }[event.key];
      event.preventDefault();
      moveSelectedBy(direction[0], direction[1]);
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? redo() : undo();
    }
    if ((event.metaKey || event.ctrlKey) && ["+", "="].includes(event.key)) {
      event.preventDefault();
      setZoom(zoom + 0.25);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "-") {
      event.preventDefault();
      setZoom(zoom - 0.25);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "0") {
      event.preventDefault();
      setZoom(1.25);
    }
  });

  function duplicateSelected() {
    const selection = selectedObjects();
    if (!selection.length) return;
    saveHistory();
    const groupIds = [...new Set(selection.map((object) => object.groupId).filter(Boolean))];
    const copiedGroupIds = new Map(groupIds.map((groupId) => [groupId, `group-${uid()}`]));
    const duplicates = selection.map((object) => {
      const maxX = config.columns - object.w + 1;
      const maxY = config.rows - object.h + 1;
      const canOffsetRight = object.x + 2 <= maxX;
      const canOffsetDown = object.y + 2 <= maxY;
      return {
        ...object,
        id: uid(),
        name: `${object.name} copy`,
        x: clamp(object.x + (canOffsetRight ? 2 : -2), 1, maxX),
        y: clamp(object.y + (canOffsetDown ? 2 : -2), 1, maxY),
        groupId: object.groupId ? copiedGroupIds.get(object.groupId) : null
      };
    });
    objects.push(...duplicates);
    setSelection(duplicates.map((object) => object.id));
    setTool("select");
    markDocumentChanged();
  }

  function deleteSelected() {
    if (!selectedIds.length) return;
    finishInlineEdit("cancel");
    saveHistory();
    const ids = new Set(selectedIds);
    objects = objects.filter((object) => !ids.has(object.id));
    clearSelection();
    render();
    markDocumentChanged();
  }

  function toggleGroupSelected() {
    const selection = selectedObjects();
    if (!selection.length) return;
    const selectedIdSet = new Set(selection.map((object) => object.id));
    const selectedGroupIds = [...new Set(selection.map((object) => object.groupId).filter(Boolean))];
    const selectedGroupMemberIds = selectedGroupIds.flatMap((groupId) => groupMembers(groupId).map((object) => object.id));
    const selectionIsOnlyCompleteGroups = selectedGroupIds.length > 0
      && selection.every((object) => object.groupId && selectedGroupIds.includes(object.groupId))
      && selectedGroupMemberIds.every((id) => selectedIdSet.has(id));

    if (selectionIsOnlyCompleteGroups) {
      saveHistory();
      const affectedIds = new Set(selectedGroupMemberIds);
      objects.forEach((object) => {
        if (object.groupId && selectedGroupIds.includes(object.groupId)) object.groupId = null;
      });
      setSelection([...affectedIds]);
      render();
      markDocumentChanged();
      return;
    }

    if (selection.length < 2) return;
    saveHistory();
    const groupId = `group-${uid()}`;
    selection.forEach((object) => {
      object.groupId = groupId;
    });
    setSelection(selection.map((object) => object.id));
    render();
    markDocumentChanged();
  }

  function moveSelectedBy(deltaX, deltaY) {
    const selection = selectedObjects();
    if (!selection.length) return;
    const moves = selection.map((object) => ({
      object,
      x: clamp(object.x + deltaX, 1, config.columns - objectBounds(object).width + 1),
      y: clamp(object.y + deltaY, 1, config.rows - objectBounds(object).height + 1)
    }));
    if (!moves.some((move) => move.x !== move.object.x || move.y !== move.object.y)) return;
    saveHistory();
    moves.forEach((move) => {
      move.object.x = move.x;
      move.object.y = move.y;
    });
    render();
    markDocumentChanged();
  }

  function selectedObjectBounds() {
    return selectedObjects().map((object) => ({
      object,
      ...objectBounds(object)
    }));
  }

  function alignSelected(direction) {
    const bounds = selectedObjectBounds();
    if (bounds.length < 2) return;
    const targets = {
      left: Math.min(...bounds.map((item) => item.left)),
      right: Math.max(...bounds.map((item) => item.right)),
      top: Math.min(...bounds.map((item) => item.top)),
      bottom: Math.max(...bounds.map((item) => item.bottom))
    };
    const moves = bounds.map((item) => {
      if (direction === "left") return { object: item.object, x: targets.left, y: item.object.y };
      if (direction === "right") return { object: item.object, x: targets.right - item.width + 1, y: item.object.y };
      if (direction === "top") return { object: item.object, x: item.object.x, y: targets.top };
      return { object: item.object, x: item.object.x, y: targets.bottom - item.height + 1 };
    });
    applyObjectMoves(moves);
  }

  function distributeSelected(axis) {
    const bounds = selectedObjectBounds();
    if (bounds.length < 3) return;
    const sorted = [...bounds].sort((a, b) => axis === "horizontal" ? a.left - b.left : a.top - b.top);
    const first = sorted[0];
    const last = sorted.at(-1);
    const span = axis === "horizontal" ? last.right - first.left + 1 : last.bottom - first.top + 1;
    const totalSize = sorted.reduce((sum, item) => sum + (axis === "horizontal" ? item.width : item.height), 0);
    const gap = (span - totalSize) / (sorted.length - 1);
    let cursor = axis === "horizontal" ? first.left : first.top;
    const moves = sorted.map((item, index) => {
      const size = axis === "horizontal" ? item.width : item.height;
      const position = index === sorted.length - 1
        ? (axis === "horizontal" ? last.left : last.top)
        : Math.round(cursor);
      cursor += size + gap;
      return axis === "horizontal"
        ? { object: item.object, x: position, y: item.object.y }
        : { object: item.object, x: item.object.x, y: position };
    });
    applyObjectMoves(moves);
  }

  function applyObjectMoves(moves) {
    const normalized = moves.map((move) => ({
      object: move.object,
      x: clamp(move.x, 1, config.columns - objectBounds(move.object).width + 1),
      y: clamp(move.y, 1, config.rows - objectBounds(move.object).height + 1)
    }));
    if (!normalized.some((move) => move.x !== move.object.x || move.y !== move.object.y)) return;
    saveHistory();
    normalized.forEach((move) => {
      move.object.x = move.x;
      move.object.y = move.y;
    });
    render();
    markDocumentChanged();
  }

  function moveLayer(id, direction) {
    const index = objects.findIndex((object) => object.id === id);
    if (index < 0) return;
    const targetIndex = direction === "front" ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= objects.length) return;
    saveHistory();
    const [object] = objects.splice(index, 1);
    objects.splice(targetIndex, 0, object);
    selectOnly(object.id);
    render();
    markDocumentChanged();
  }

  function undo() {
    finishInlineEdit("cancel");
    if (!history.length) return;
    future.push(JSON.stringify(objects));
    objects = JSON.parse(history.pop());
    clearSelection();
    render();
    markDocumentChanged();
  }

  function redo() {
    finishInlineEdit("cancel");
    if (!future.length) return;
    history.push(JSON.stringify(objects));
    objects = JSON.parse(future.pop());
    clearSelection();
    render();
    markDocumentChanged();
  }

  createToolButtons();
  updateZoomUi();
  renderDocumentSelect();
  if (!loadAutosave()) {
    objects = sample.starterDocument(tools.createObject, uid);
    selectOnly(objects.at(-1).id);
    documentName.value = currentDocumentName;
    setTool("select");
    saveAutosave();
  }
})();
