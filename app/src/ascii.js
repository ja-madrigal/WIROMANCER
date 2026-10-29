(function exposeAscii(root) {
  function drawObject(object) {
    const w = Math.max(1, object.w);
    const h = Math.max(1, object.h);
    const label = object.text || "";
    const component = root.WiromancerComponents?.getComponent(object.componentId || object.kind);
    const kind = component?.renderer || object.kind;
    const line = (char = " ") => char.repeat(w);
    const fit = (text, width) => text.slice(0, width).padEnd(width, " ");
    const center = (text, width) => {
      const trimmed = text.slice(0, width);
      const left = Math.floor((width - trimmed.length) / 2);
      return " ".repeat(Math.max(0, left)) + trimmed + " ".repeat(Math.max(0, width - trimmed.length - left));
    };

    if (kind === "text") return [label || "Text"];
    if (kind === "line") return ["─".repeat(w)];
    if (kind === "arrow") return Array.from({ length: h }, (_, index) => index === h - 1 ? "↓" : "│");
    if (kind === "button") return [`[ ${center(label || "OK", Math.max(1, w - 4)).trim()} ]`];
    if (kind === "input") return [`[${" ".repeat(Math.max(0, w - 2))}]`];
    if (kind === "checkbox") return [`[x] ${label || "Option"}`];
    if (kind === "radio") return [`(•) ${label || "Choice"}`];
    if (kind === "dropdown") return [`[ ${fit(label || "Select", Math.max(1, w - 5)).trimEnd()}⌄ ]`];
    if (kind === "toggle") return [`[ ${label || "On"} ] ○`];
    if (kind === "tabs") return ["[ Tab ] [ Tab ] [ Tab ]"];
    if (kind === "search") return [`[⌕ ${fit(label || "Search", Math.max(1, w - 5)).trimEnd()} ]`];
    if (kind === "progress") {
      const filled = Math.max(0, Math.floor((w - 2) * 0.6));
      return [`[${"=".repeat(filled)}${" ".repeat(Math.max(0, w - 2 - filled))}]`];
    }
    if (kind === "breadcrumb") return ["Home › Section › Page"];
    if (kind === "pagination") return ["‹  1  2  3  ...  8  ›"];
    if (kind === "navbar") return [fit(label || "Logo", 6) + "──Link──Link──Link──[ Action ]".slice(0, Math.max(0, w - 6)), line("─")];
    if (kind === "list") return Array.from({ length: h }, (_, index) => `• Item ${index + 1}`.padEnd(w, " "));
    if (kind === "placeholder") return boxLines(w, h, "////");
    if (kind === "split") {
      const lines = boxLines(w, h, "");
      const mid = Math.floor(w / 2);
      return lines.map((row, index) => index === 0 || index === h - 1 ? row : row.slice(0, mid) + "│" + row.slice(mid + 1));
    }
    if (kind === "image") return boxLines(w, h, label || "Image");
    if (kind === "card") {
      const lines = boxLines(w, h, "");
      if (h > 2) lines[1] = "│ " + fit(label || "Card title", w - 4) + " │";
      if (h > 3) lines[2] = "├" + "─".repeat(w - 2) + "┤";
      return lines;
    }
    if (kind === "table") {
      const lines = boxLines(w, h, "");
      const third = Math.floor(w / 3);
      return lines.map((row, index) => {
        if (index === 2 || index === 5) return "├" + "─".repeat(w - 2) + "┤";
        if (index > 0 && index < h - 1) return row.slice(0, third) + "│" + row.slice(third + 1, third * 2) + "│" + row.slice(third * 2 + 1);
        return row;
      });
    }
    if (kind === "modal") {
      const lines = boxLines(w, h, "");
      lines[1] = "│ " + fit(label || "Dialog", w - 6) + "x │";
      if (h > 2) lines[2] = "├" + "─".repeat(w - 2) + "┤";
      if (h > 3) lines[h - 2] = "│" + center("[ Cancel ] [ OK ]", w - 2) + "│";
      return lines;
    }
    return boxLines(w, h, label);
  }

  function boxLines(w, h, label) {
    if (h <= 1) return ["─".repeat(w)];
    const rows = ["┌" + "─".repeat(Math.max(0, w - 2)) + "┐"];
    for (let i = 1; i < h - 1; i += 1) {
      let content = " ".repeat(Math.max(0, w - 2));
      if (label && i === Math.floor(h / 2)) {
        const text = label.slice(0, Math.max(0, w - 2));
        const left = Math.floor((w - 2 - text.length) / 2);
        content = " ".repeat(Math.max(0, left)) + text + " ".repeat(Math.max(0, w - 2 - text.length - left));
      }
      rows.push("│" + content + "│");
    }
    rows.push("└" + "─".repeat(Math.max(0, w - 2)) + "┘");
    return rows;
  }

  function exportAscii(objects, columns, rows) {
    const grid = Array.from({ length: rows }, () => Array.from({ length: columns }, () => " "));
    objects.forEach((object) => {
      drawObject(object).forEach((row, rowIndex) => {
        [...row].forEach((char, colIndex) => {
          const y = object.y - 1 + rowIndex;
          const x = object.x - 1 + colIndex;
          if (y >= 0 && y < rows && x >= 0 && x < columns && char !== " ") {
            grid[y][x] = char;
          }
        });
      });
    });
    return grid.map((row) => row.join("").trimEnd()).join("\n").replace(/\s+$/g, "");
  }

  const api = { drawObject, boxLines, exportAscii };
  root.WiromancerAscii = api;

  if (typeof module !== "undefined") {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
