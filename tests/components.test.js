const assert = require("node:assert/strict");
const components = require("../app/src/components.js");
const tools = require("../app/src/tools.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("builds tool groups from component definitions", () => {
  assert.deepEqual(tools.toolGroups.basicTools[0], ["select", "⌁", "Select"]);
  assert.deepEqual(tools.toolGroups.uiTools.find(([id]) => id === "button"), ["button", "▭", "Button"]);
});

test("creates component-backed instances with stable defaults", () => {
  const button = components.createInstance("button", 4, 8, "button-1");
  assert.equal(button.componentId, "button");
  assert.equal(button.kind, "button");
  assert.equal(button.name, "Button");
  assert.equal(button.w, 10);
  assert.equal(button.h, 1);
  assert.equal(button.text, "OK");
});

test("falls back to text for unknown components", () => {
  const unknown = components.createInstance("missing", 1, 1, "unknown-1");
  assert.equal(unknown.componentId, "text");
  assert.equal(unknown.kind, "text");
});
