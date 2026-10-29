(function exposeSample(root) {
  function starterDocument(createObject, idFactory) {
    return [
      createObject("box", 6, 4, idFactory(), { w: 42, h: 16, name: "App Frame" }),
      createObject("navbar", 6, 4, idFactory(), { w: 42, h: 2 }),
      createObject("input", 9, 9, idFactory(), { w: 14 }),
      createObject("input", 9, 12, idFactory(), { w: 14 }),
      createObject("input", 9, 15, idFactory(), { w: 14 }),
      createObject("button", 9, 18, idFactory(), { text: "SEND", w: 10 }),
      createObject("arrow", 28, 14, idFactory(), { h: 10 }),
      createObject("modal", 18, 26, idFactory(), { w: 30, h: 9 })
    ];
  }

  const api = { starterDocument };
  root.WiromancerSample = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
