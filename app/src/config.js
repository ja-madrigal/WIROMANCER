(function exposeConfig(root) {
  const config = {
    columns: 400,
    rows: 300,
    cellWidth: 8,
    cellHeight: 8,
    maxHistory: 80
  };

  root.WiromancerConfig = config;

  if (typeof module !== "undefined") {
    module.exports = config;
  }
})(typeof window !== "undefined" ? window : globalThis);
