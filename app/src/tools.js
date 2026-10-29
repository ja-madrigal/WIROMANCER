(function exposeTools(root) {
  const components = root.WiromancerComponents || require("./components.js");
  const toolGroups = components.toolGroups();
  const templates = Object.fromEntries(components.definitions.map((definition) => [
    definition.id,
    () => ({
      name: definition.name,
      kind: definition.id,
      w: definition.defaults.w,
      h: definition.defaults.h,
      text: definition.defaults.text
    })
  ]));

  function createObject(kind, x, y, id, overrides = {}) {
    return components.createInstance(kind, x, y, id, overrides);
  }

  function layerIcon(kind) {
    return components.getComponent(kind).icon;
  }

  const api = { toolGroups, templates, createObject, layerIcon, components };
  root.WiromancerTools = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
