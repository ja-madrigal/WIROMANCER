const assert = require("node:assert/strict");
const { drawObject, exportAscii } = require("../app/src/ascii.js");

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("draws a box at the requested dimensions", () => {
  assert.deepEqual(drawObject({ kind: "box", w: 4, h: 3, text: "" }), [
    "┌──┐",
    "│  │",
    "└──┘"
  ]);
});

test("draws a modal with title and actions", () => {
  const rows = drawObject({ kind: "modal", w: 24, h: 6, text: "Dialog" });
  assert.equal(rows[0], "┌──────────────────────┐");
  assert.equal(rows[1], "│ Dialog            x │");
  assert.equal(rows[2], "├──────────────────────┤");
  assert.match(rows[4], /\[ Cancel \] \[ OK \]/);
});

test("exports positioned objects into one ASCII canvas", () => {
  const output = exportAscii([
    { kind: "text", x: 2, y: 1, w: 4, h: 1, text: "Logo" },
    { kind: "button", x: 2, y: 3, w: 8, h: 1, text: "Go" }
  ], 16, 6);

  assert.equal(output, [
    " Logo",
    "",
    " [ Go ]"
  ].join("\n"));
});
