(function exposeComponents(root) {
  const groups = [
    {
      id: "basicTools",
      name: "Basics",
      components: ["select", "text", "box", "line", "arrow"]
    },
    {
      id: "uiTools",
      name: "UI Elements",
      components: [
        "button",
        "input",
        "card",
        "table",
        "modal",
        "checkbox",
        "radio",
        "dropdown",
        "toggle",
        "tabs",
        "search",
        "progress",
        "breadcrumb",
        "pagination",
        "navbar",
        "list",
        "placeholder",
        "split",
        "image"
      ]
    },
    {
      id: "drawTools",
      name: "Draw",
      components: ["pencil", "eraser"]
    }
  ];

  const definitions = [
    component("select", "Select", "⌁", "select", { w: 1, h: 1, text: "" }),
    component("text", "Text", "T", "text", { w: 8, h: 1, text: "LOGO" }),
    component("box", "Box", "□", "box", { w: 40, h: 16, text: "" }),
    component("line", "Line", "─", "line", { w: 24, h: 1, text: "" }),
    component("arrow", "Arrow", "→", "arrow", { w: 1, h: 10, text: "" }),
    component("button", "Button", "▭", "button", { w: 10, h: 1, text: "OK" }),
    component("input", "Input", "⇔", "input", { w: 14, h: 1, text: "" }),
    component("card", "Card", "▤", "card", { w: 30, h: 10, text: "Card title" }),
    component("table", "Table", "▦", "table", { w: 36, h: 9, text: "" }),
    component("modal", "Modal", "▣", "modal", { w: 28, h: 9, text: "Dialog" }),
    component("checkbox", "Checkbox", "☑", "checkbox", { w: 14, h: 1, text: "Option" }),
    component("radio", "Radio", "◉", "radio", { w: 14, h: 1, text: "Choice" }),
    component("dropdown", "Dropdown", "⌄", "dropdown", { w: 18, h: 1, text: "Select" }),
    component("toggle", "Toggle", "⊙", "toggle", { w: 12, h: 1, text: "On" }),
    component("tabs", "Tabs", "⌁", "tabs", { w: 26, h: 1, text: "" }),
    component("search", "Search", "⌕", "search", { w: 22, h: 1, text: "Search" }),
    component("progress", "Progress", "✺", "progress", { w: 24, h: 1, text: "" }),
    component("breadcrumb", "Breadcrumb", "›", "breadcrumb", { w: 28, h: 1, text: "" }),
    component("pagination", "Pagination", "…", "pagination", { w: 22, h: 1, text: "" }),
    component("navbar", "Nav Bar", "▭", "navbar", { w: 46, h: 2, text: "Logo" }),
    component("list", "List", "☷", "list", { w: 22, h: 5, text: "" }),
    component("placeholder", "Placeholder", "#", "placeholder", { w: 24, h: 8, text: "" }),
    component("split", "HSplit", "▥", "split", { w: 34, h: 9, text: "" }),
    component("image", "Image", "▧", "image", { w: 22, h: 8, text: "Image" }),
    component("pencil", "Pencil", "✎", "text", { w: 8, h: 1, text: "Draw" }),
    component("eraser", "Eraser", "⌫", "box", { w: 8, h: 4, text: "" })
  ];

  function component(id, name, icon, renderer, defaults) {
    return {
      id,
      name,
      icon,
      renderer,
      defaults,
      props: [
        { id: "name", label: "Name", type: "text" },
        { id: "text", label: "Text", type: "text" },
        { id: "x", label: "X", type: "number", min: 1 },
        { id: "y", label: "Y", type: "number", min: 1 },
        { id: "w", label: "Width", type: "number", min: 1 },
        { id: "h", label: "Height", type: "number", min: 1 }
      ]
    };
  }

  const byId = Object.fromEntries(definitions.map((definition) => [definition.id, definition]));

  function getComponent(id) {
    return byId[id] || byId.text;
  }

  function createInstance(kind, x, y, id, overrides = {}) {
    const definition = getComponent(kind);
    return {
      id,
      x,
      y,
      w: definition.defaults.w,
      h: definition.defaults.h,
      text: definition.defaults.text,
      name: definition.name,
      kind: definition.id,
      componentId: definition.id,
      visible: true,
      groupId: null,
      ...overrides
    };
  }

  function toolGroups() {
    return Object.fromEntries(groups.map((group) => [
      group.id,
      group.components.map((id) => {
        const definition = getComponent(id);
        return [definition.id, definition.icon, definition.name];
      })
    ]));
  }

  const api = {
    definitions,
    groups,
    byId,
    getComponent,
    createInstance,
    toolGroups
  };
  root.WiromancerComponents = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
