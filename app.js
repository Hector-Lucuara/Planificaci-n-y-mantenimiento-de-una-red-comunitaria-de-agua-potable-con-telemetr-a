"use strict";

const NODES = ["T", "A", "B", "C", "D", "E", "F"];
const NODE_LABELS = {
  T: "Tanque",
  A: "Caserío A",
  B: "Caserío B",
  C: "Caserío C",
  D: "Caserío D",
  E: "Estación E",
  F: "Caserío F"
};
const POSITIONS = {
  T: [100, 220],
  A: [275, 105],
  B: [290, 300],
  C: [465, 190],
  D: [560, 330],
  E: [480, 405],
  F: [675, 185]
};
const EDGES = [
  { u: "T", v: "A", weight: 4, label: [185, 150] },
  { u: "T", v: "B", weight: 6, label: [190, 265] },
  { u: "T", v: "E", weight: 5, label: [295, 335] },
  { u: "A", v: "B", weight: 2, label: [265, 205] },
  { u: "A", v: "C", weight: 7, label: [365, 135] },
  { u: "B", v: "C", weight: 3, label: [380, 250] },
  { u: "B", v: "E", weight: 4, label: [390, 370] },
  { u: "B", v: "D", weight: 8, label: [435, 330] },
  { u: "C", v: "D", weight: 5, label: [530, 250] },
  { u: "C", v: "F", weight: 6, label: [575, 175] },
  { u: "D", v: "F", weight: 2, label: [625, 260] },
  { u: "D", v: "E", weight: 7, label: [515, 375] },
  { u: "E", v: "F", weight: 9, label: [585, 300] }
];
const METERS = [
  { code: 105, location: "A" },
  { code: 102, location: "B" },
  { code: 110, location: "C" },
  { code: 98, location: "D" },
  { code: 115, location: "F" },
  { code: 107, location: "E" }
];
const REPAIRS = [
  { id: "R1", description: "Fuga en A", urgency: 4, duration: 2 },
  { id: "R2", description: "Bomba dañada en E", urgency: 5, duration: 3 },
  { id: "R3", description: "Medidor en C", urgency: 2, duration: 1 },
  { id: "R4", description: "Tubería en D", urgency: 3, duration: 2 },
  { id: "R5", description: "Presión baja en F", urgency: 1, duration: 1 }
];
const SVG_NS = "http://www.w3.org/2000/svg";

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function edgeKey(edge) {
  return [edge.u, edge.v].sort().join("-");
}

function buildAdjacency() {
  const adjacency = Object.fromEntries(NODES.map((node) => [node, []]));
  for (const edge of EDGES) {
    adjacency[edge.u].push({ node: edge.v, edge });
    adjacency[edge.v].push({ node: edge.u, edge });
  }
  return adjacency;
}

function runKruskal() {
  const parent = Object.fromEntries(NODES.map((node) => [node, node]));
  const rank = Object.fromEntries(NODES.map((node) => [node, 0]));
  const find = (node) => {
    if (parent[node] !== node) parent[node] = find(parent[node]);
    return parent[node];
  };
  const union = (left, right) => {
    let rootLeft = find(left);
    let rootRight = find(right);
    if (rootLeft === rootRight) return false;
    if (rank[rootLeft] < rank[rootRight]) [rootLeft, rootRight] = [rootRight, rootLeft];
    parent[rootRight] = rootLeft;
    if (rank[rootLeft] === rank[rootRight]) rank[rootLeft] += 1;
    return true;
  };
  const steps = [];
  let rejected = 0;
  for (const edge of EDGES.map((edge, index) => ({ ...edge, index }))
    .sort((left, right) => left.weight - right.weight || left.index - right.index)) {
    if (union(edge.u, edge.v)) {
      steps.push({
        edge,
        message: `Se agrega ${edge.u}—${edge.v}: costo ${edge.weight}; conecta dos componentes sin cerrar un ciclo.`
      });
    } else {
      rejected += 1;
    }
  }
  return { kind: "edges", steps, rejected };
}

function runPrim(start) {
  const adjacency = buildAdjacency();
  const visited = new Set([start]);
  const queue = adjacency[start].map(({ node, edge }) => ({ ...edge, from: start, to: node }));
  const steps = [];
  let tieOrder = 0;
  while (queue.length && visited.size < NODES.length) {
    queue.sort((left, right) =>
      left.weight - right.weight ||
      left.from.localeCompare(right.from) ||
      left.to.localeCompare(right.to) ||
      left.index - right.index
    );
    const edge = queue.shift();
    if (visited.has(edge.to)) continue;
    visited.add(edge.to);
    steps.push({
      edge,
      message: `Desde ${edge.from}, se incorpora ${edge.to} por el tramo de costo ${edge.weight}.`
    });
    for (const neighbor of adjacency[edge.to]) {
      if (!visited.has(neighbor.node)) {
        queue.push({ ...neighbor.edge, from: edge.to, to: neighbor.node, index: tieOrder++ });
      }
    }
  }
  return { kind: "edges", steps, rejected: 0 };
}

function runTraversal(start, mode) {
  const adjacency = buildAdjacency();
  const visited = new Set([start]);
  const steps = [{ node: start, parent: null, distance: 0 }];
  const cycles = new Set();
  if (mode === "bfs") {
    const queue = [start];
    while (queue.length) {
      const current = queue.shift();
      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node);
          queue.push(neighbor.node);
          steps.push({
            node: neighbor.node,
            parent: current,
            distance: steps.find((step) => step.node === current).distance + 1
          });
        }
      }
    }
  } else {
    const visit = (current, parent) => {
      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor.node)) {
          visited.add(neighbor.node);
          const currentStep = steps.find((step) => step.node === current);
          steps.push({
            node: neighbor.node,
            parent: current,
            distance: currentStep.distance + 1
          });
          visit(neighbor.node, current);
        } else if (neighbor.node !== parent) {
          cycles.add(edgeKey(neighbor.edge));
        }
      }
    };
    visit(start, null);
  }
  return { kind: "nodes", steps, cycles: [...cycles] };
}

const NETWORK_MODES = {
  kruskal: {
    title: "Kruskal",
    description: "Ordena los tramos por costo y agrega los que no forman un ciclo."
  },
  prim: {
    title: "Prim",
    description: "Crece un árbol desde el punto elegido, incorporando el tramo más barato disponible."
  },
  bfs: {
    title: "BFS · búsqueda en anchura",
    description: "Explora primero los vecinos cercanos y muestra cuántos saltos separan cada punto del origen."
  },
  dfs: {
    title: "DFS · búsqueda en profundidad",
    description: "Avanza por una rama hasta el fondo antes de retroceder; las conexiones alternativas revelan ciclos."
  }
};

let networkMode = "kruskal";
let networkStep = 0;
let networkResult = runKruskal();

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function calculateNetworkResult() {
  const origin = byId("originSelect").value;
  if (networkMode === "kruskal") return runKruskal();
  if (networkMode === "prim") return runPrim(origin);
  return runTraversal(origin, networkMode);
}

function renderNetwork() {
  const graph = byId("networkGraph");
  graph.replaceChildren();
  const stepCount = networkResult.steps.length;
  const currentStep = Math.min(networkStep, Math.max(0, stepCount - 1));
  const activeEdges = new Set();
  const activeNodes = new Set();

  if (networkResult.kind === "edges") {
    for (const step of networkResult.steps.slice(0, currentStep + 1)) {
      activeEdges.add(edgeKey(step.edge));
      activeNodes.add(step.edge.u);
      activeNodes.add(step.edge.v);
    }
  } else {
    for (const step of networkResult.steps.slice(0, currentStep + 1)) {
      activeNodes.add(step.node);
      if (step.parent) activeEdges.add(edgeKey({ u: step.node, v: step.parent }));
    }
  }

  for (const edge of EDGES) {
    const [x1, y1] = POSITIONS[edge.u];
    const [x2, y2] = POSITIONS[edge.v];
    const active = activeEdges.has(edgeKey(edge));
    const line = svgElement("line", {
      x1, y1, x2, y2,
      class: `graph-edge${active ? " is-active" : ""}`
    });
    graph.append(line);
    const [labelX, labelY] = edge.label;
    const label = svgElement("text", {
      x: labelX, y: labelY, class: "graph-edge-label", "text-anchor": "middle"
    });
    label.textContent = String(edge.weight);
    graph.append(label);
  }

  for (const node of NODES) {
    const [x, y] = POSITIONS[node];
    const group = svgElement("g", {
      class: `graph-node${activeNodes.has(node) ? " is-active" : ""}`,
      "aria-label": `${NODE_LABELS[node]} (${node})`
    });
    group.append(svgElement("circle", { cx: x, cy: y, r: 19 }));
    const name = svgElement("text", { x, y: y - 1 });
    name.textContent = node;
    group.append(name);
    const label = svgElement("text", { x, y: y + 34, class: "node-label" });
    label.textContent = NODE_LABELS[node];
    group.append(label);
    graph.append(group);
  }

  byId("networkTitle").textContent = NETWORK_MODES[networkMode].title;
  byId("networkDescription").textContent = NETWORK_MODES[networkMode].description;
  byId("stepRange").max = String(Math.max(0, stepCount - 1));
  byId("stepRange").value = String(currentStep);
  byId("stepRange").disabled = stepCount < 2;
  byId("stepPrevious").disabled = currentStep === 0;
  byId("stepNext").disabled = currentStep >= stepCount - 1;
  byId("networkStepLabel").textContent = `Paso ${stepCount ? currentStep + 1 : 0} de ${stepCount}`;
  byId("networkStepText").textContent = networkResult.steps[currentStep]?.message || "No hay pasos que mostrar.";

  if (networkResult.kind === "edges") {
    const selected = networkResult.steps.slice(0, currentStep + 1);
    const cost = selected.reduce((total, step) => total + step.edge.weight, 0);
    const connected = new Set(selected.flatMap((step) => [step.edge.u, step.edge.v]));
    const complete = selected.length === NODES.length - 1;
    byId("networkSummary").innerHTML =
      `<strong>${cost} <small>M</small></strong><span>Costo acumulado · ${connected.size} de ${NODES.length} puntos conectados</span>` +
      (complete && networkMode === "kruskal"
        ? `<span>${networkResult.rejected} tramo(s) omitido(s) para evitar ciclos.</span>`
        : complete ? "<span>Árbol de expansión mínimo completo.</span>" : "");
  } else {
    const currentNodes = networkResult.steps.slice(0, currentStep + 1);
    const order = currentNodes.map((step) => step.node).join(" → ");
    const extra = networkMode === "bfs"
      ? `<span>Saltos desde el origen: ${currentNodes.map((step) => `${step.node} ${step.distance}`).join(" · ")}</span>`
      : `<span>${networkResult.cycles.length} conexión(es) alternativa(s) detectada(s) como ciclo en esta red.</span>`;
    byId("networkSummary").innerHTML =
      `<strong>${currentNodes.length} <small>puntos</small></strong><span>Orden: ${escapeHtml(order)}</span>${extra}`;
  }
}

function selectNetworkMode(mode) {
  networkMode = mode;
  networkStep = 0;
  networkResult = calculateNetworkResult();
  for (const button of document.querySelectorAll(".mode-button")) {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-pressed", String(selected));
  }
  renderNetwork();
}

function makeMeterTree() {
  let root = null;
  for (const meter of METERS) {
    if (!root) {
      root = { ...meter, left: null, right: null };
      continue;
    }
    let current = root;
    while (true) {
      const side = meter.code < current.code ? "left" : "right";
      if (!current[side]) {
        current[side] = { ...meter, left: null, right: null };
        break;
      }
      current = current[side];
    }
  }
  return root;
}

const METER_ROOT = makeMeterTree();
let meterPath = [];

function meterTreeMarkup(node) {
  if (!node) return "";
  const active = meterPath.includes(node.code);
  return `<div class="tree-node">
    <span class="tree-value${active ? " is-visited" : ""}">${node.code}</span>
    <span class="tree-caption">${NODE_LABELS[node.location]}</span>
    ${(node.left || node.right) ? `<div class="tree-children">
      ${node.left ? `<div class="tree-branch">${meterTreeMarkup(node.left)}</div>` : ""}
      ${node.right ? `<div class="tree-branch">${meterTreeMarkup(node.right)}</div>` : ""}
    </div>` : ""}
  </div>`;
}

function searchMeter() {
  const code = Number(byId("meterCode").value);
  const result = byId("meterResult");
  if (!Number.isInteger(code)) {
    result.textContent = "Escribe un código entero para buscar.";
    meterPath = [];
    byId("bstTree").innerHTML = meterTreeMarkup(METER_ROOT);
    return;
  }
  meterPath = [];
  let current = METER_ROOT;
  while (current) {
    meterPath.push(current.code);
    if (current.code === code) break;
    current = code < current.code ? current.left : current.right;
  }
  byId("bstTree").innerHTML = meterTreeMarkup(METER_ROOT);
  if (current) {
    result.innerHTML = `<strong>${code}</strong> está en ${escapeHtml(NODE_LABELS[current.location])}; ${meterPath.length} comparación(es).`;
  } else {
    result.innerHTML = `<strong>${code}</strong> no está registrado; se realizaron ${meterPath.length} comparación(es).`;
  }
}

function bubbleSortSnapshots(items) {
  const values = items.slice();
  const snapshots = [values.slice()];
  for (let i = 0; i < values.length; i += 1) {
    let swapped = false;
    for (let j = 0; j < values.length - i - 1; j += 1) {
      if (values[j].urgency < values[j + 1].urgency) {
        [values[j], values[j + 1]] = [values[j + 1], values[j]];
        swapped = true;
      }
    }
    if (swapped) snapshots.push(values.slice());
    if (!swapped) break;
  }
  return snapshots;
}

let repairSnapshots = bubbleSortSnapshots(REPAIRS);
let repairPass = repairSnapshots.length - 1;

function renderRepairList() {
  const values = repairSnapshots[repairPass] || REPAIRS;
  byId("repairList").innerHTML = values.map((repair, index) =>
    `<li class="${index === 0 ? "is-priority" : ""}">
      <span class="repair-id">${repair.id}</span>
      <span>${escapeHtml(repair.description)}</span>
      <span class="repair-urgency">U${repair.urgency}</span>
    </li>`
  ).join("");
  byId("repairStepLabel").textContent = repairPass === 0
    ? "Lista inicial"
    : `Pasada ${repairPass} de ${repairSnapshots.length - 1}`;
  byId("repairPrevious").disabled = repairPass <= 0;
  byId("repairNext").disabled = repairPass >= repairSnapshots.length - 1;
}

function assignTechnicians(sortedRepairs, numberOfTechnicians = 2) {
  const technicians = Array.from({ length: numberOfTechnicians }, (_, index) => ({
    id: index + 1,
    freeAt: 0,
    tasks: []
  }));
  for (const repair of sortedRepairs) {
    const technician = technicians.reduce((earliest, current) =>
      current.freeAt < earliest.freeAt ? current : earliest
    );
    const start = technician.freeAt;
    const end = start + repair.duration;
    technician.tasks.push({ ...repair, start, end });
    technician.freeAt = end;
  }
  return technicians;
}

function renderSchedule() {
  const sorted = repairSnapshots[repairSnapshots.length - 1];
  const technicians = assignTechnicians(sorted);
  const totalTime = Math.max(...technicians.map((technician) => technician.freeAt), 1);
  byId("scheduleEnd").textContent = `${totalTime} h`;
  byId("technicianSchedule").innerHTML = technicians.map((technician) => {
    let previousEnd = 0;
    const tasks = technician.tasks.map((task) => {
      const gap = task.start - previousEnd;
      previousEnd = task.end;
      const left = (gap / totalTime) * 100;
      const width = (task.duration / totalTime) * 100;
      return `<span class="timeline-task" style="margin-left:${left}%;width:${width}%" title="${task.id}: ${task.start}–${task.end} h">${task.id} · ${task.start}–${task.end}h</span>`;
    }).join("");
    return `<div class="technician-row">
      <span class="technician-name">Técnico ${technician.id}</span>
      <div class="timeline">${tasks || '<span class="timeline-empty">Sin tareas</span>'}</div>
    </div>`;
  }).join("");
}

function parseSequence(value) {
  const parts = value.split(",").map((part) => part.trim());
  if (!parts.length || parts.some((part) => !/^-?\d+$/.test(part))) {
    throw new Error("Escribe enteros separados por comas.");
  }
  if (parts.length > 14) throw new Error("Usa hasta 14 lecturas por histórico para mostrar la tabla.");
  return parts.map(Number);
}

function calculateLcs(left, right) {
  const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0));
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      dp[i][j] = left[i - 1] === right[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  let i = left.length;
  let j = right.length;
  const sequence = [];
  const path = new Set([`${i},${j}`]);
  while (i > 0 && j > 0) {
    if (left[i - 1] === right[j - 1]) {
      sequence.push(left[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
    path.add(`${i},${j}`);
  }
  return { length: dp[left.length][right.length], sequence: sequence.reverse(), dp, path };
}

function renderLcsTable(left, right, result) {
  const header = `<thead><tr><th scope="col">i/j</th><th scope="col">—</th>${right.map((value) => `<th scope="col">${value}</th>`).join("")}</tr></thead>`;
  const rows = result.dp.map((row, i) => {
    const label = i === 0 ? "—" : left[i - 1];
    const cells = row.map((value, j) => {
      const highlighted = result.path.has(`${i},${j}`);
      return `<td class="${highlighted ? "is-path" : ""}">${value}</td>`;
    }).join("");
    return `<tr><th scope="row" class="${i > 0 ? "is-symbol" : ""}">${label}</th>${cells}</tr>`;
  }).join("");
  byId("lcsTableWrap").innerHTML = `<table class="lcs-table" aria-label="Matriz de programación dinámica LCS">${header}<tbody>${rows}</tbody></table>`;
}

function compareSequences() {
  const resultElement = byId("lcsResult");
  try {
    const left = parseSequence(byId("sequenceA").value);
    const right = parseSequence(byId("sequenceB").value);
    const result = calculateLcs(left, right);
    const changed = Math.max(left.length, right.length);
    resultElement.innerHTML =
      `<strong>Longitud ${result.length}</strong> · subsecuencia: ` +
      `${result.sequence.map((value) => `<span class="sequence-badge">${value}</span>`).join("") || "ningún valor común"}` +
      `<br>La matriz tiene ${(left.length + 1) * (right.length + 1)} celdas; se comparan ${changed} posiciones máximas.`;
    renderLcsTable(left, right, result);
  } catch (error) {
    resultElement.textContent = error.message;
    byId("lcsTableWrap").replaceChildren();
  }
}

function buildHuffmanTree(text) {
  const frequencies = new Map();
  for (const symbol of Array.from(text)) {
    frequencies.set(symbol, (frequencies.get(symbol) || 0) + 1);
  }
  if (frequencies.size === 0) return { root: null, codes: new Map(), frequencies };

  let order = 0;
  let queue = Array.from(frequencies, ([symbol, frequency]) => ({
    symbol, frequency, left: null, right: null, order: order++
  }));
  const sortQueue = () => queue.sort((left, right) =>
    left.frequency - right.frequency || left.order - right.order
  );
  while (queue.length > 1) {
    sortQueue();
    const left = queue.shift();
    const right = queue.shift();
    queue.push({
      symbol: null,
      frequency: left.frequency + right.frequency,
      left,
      right,
      order: order++
    });
  }

  const root = queue[0];
  const codes = new Map();
  const collectCodes = (node, prefix) => {
    if (node.symbol !== null) {
      codes.set(node.symbol, prefix || "0");
      return;
    }
    collectCodes(node.left, `${prefix}0`);
    collectCodes(node.right, `${prefix}1`);
  };
  collectCodes(root, "");
  return { root, codes, frequencies };
}

function encodeHuffman(text, codes) {
  return Array.from(text, (symbol) => {
    const code = codes.get(symbol);
    if (code === undefined) throw new Error(`No hay código para el símbolo ${symbol}.`);
    return code;
  }).join("");
}

function decodeHuffman(bits, root) {
  if (!/^[01]*$/.test(bits)) throw new Error("El código solo puede contener 0 y 1.");
  if (!root) {
    if (bits) throw new Error("No hay árbol para decodificar este mensaje.");
    return "";
  }
  if (root.symbol !== null) {
    if (bits.includes("1")) throw new Error("El árbol de un solo símbolo solo admite 0.");
    return root.symbol.repeat(bits.length);
  }
  let current = root;
  let text = "";
  for (const bit of bits) {
    current = bit === "0" ? current.left : current.right;
    if (!current) throw new Error("El mensaje sigue una ruta que no existe en el árbol.");
    if (current.symbol !== null) {
      text += current.symbol;
      current = root;
    }
  }
  if (current !== root) throw new Error("El mensaje termina a mitad de un código.");
  return text;
}

function displaySymbol(symbol) {
  if (symbol === " ") return "␠";
  if (symbol === "\n") return "↵";
  if (symbol === "\t") return "⇥";
  return symbol;
}

function createHuffmanTreeElement(node, code = "") {
  const wrapper = document.createElement("div");
  wrapper.className = "huffman-tree-node";
  const label = document.createElement("span");
  label.className = "huffman-node-label";
  if (node.symbol !== null) {
    label.textContent = displaySymbol(node.symbol);
    label.title = `Símbolo ${JSON.stringify(node.symbol)} · código ${code}`;
  } else {
    label.textContent = `Σ ${node.frequency}`;
    label.title = `Frecuencia acumulada ${node.frequency}`;
  }
  wrapper.append(label);
  if (node.symbol === null) {
    const branches = document.createElement("div");
    branches.className = "huffman-branches";
    for (const [bit, child] of [["0", node.left], ["1", node.right]]) {
      const branch = document.createElement("div");
      branch.className = "huffman-child";
      const bitLabel = document.createElement("span");
      bitLabel.className = "huffman-bit";
      bitLabel.textContent = bit;
      branch.append(bitLabel, createHuffmanTreeElement(child, `${code}${bit}`));
      branches.append(branch);
    }
    wrapper.append(branches);
  }
  return wrapper;
}

function encodeMessage() {
  const result = byId("huffmanResult");
  const text = byId("huffmanMessage").value;
  try {
    const { root, codes, frequencies } = buildHuffmanTree(text);
    const bits = encodeHuffman(text, codes);
    const decoded = decodeHuffman(bits, root);
    const rawBits = new Blob([text]).size * 8;
    const savedBits = rawBits - bits.length;
    const savedPercent = rawBits ? (savedBits / rawBits) * 100 : 0;
    result.innerHTML = text
      ? `Mensaje reconstruido correctamente: <strong>${escapeHtml(decoded)}</strong><br>Flujo codificado: <code>${escapeHtml(bits || "—")}</code>`
      : "Escribe un mensaje para construir el árbol de Huffman.";
    byId("huffmanMetrics").innerHTML = [
      [rawBits, "bits UTF-8 originales"],
      [bits.length, "bits codificados"],
      [`${savedPercent.toFixed(1)}%`, savedBits >= 0 ? "ahorro estimado" : "aumento estimado"]
    ].map(([value, label]) => `<div class="metric-box"><strong>${value}</strong><span>${label}</span></div>`).join("");
    byId("huffmanCodes").innerHTML = [...codes.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([symbol, code]) => `<tr><td>${escapeHtml(displaySymbol(symbol))}</td><td>${frequencies.get(symbol)}</td><td><code>${code}</code></td><td>${code.length}</td></tr>`)
      .join("");
    const tree = byId("huffmanTree");
    tree.replaceChildren();
    if (root) {
      const treeElement = document.createElement("div");
      treeElement.className = "huffman-tree";
      treeElement.append(createHuffmanTreeElement(root));
      tree.append(treeElement);
    } else {
      tree.textContent = "El mensaje vacío no necesita árbol ni bits.";
    }
  } catch (error) {
    result.textContent = error.message;
  }
}

function initializePage() {
  for (const button of document.querySelectorAll(".mode-button")) {
    button.addEventListener("click", () => selectNetworkMode(button.dataset.mode));
  }
  byId("originSelect").addEventListener("change", () => {
    networkStep = 0;
    networkResult = calculateNetworkResult();
    renderNetwork();
  });
  byId("stepRange").addEventListener("input", (event) => {
    networkStep = Number(event.target.value);
    renderNetwork();
  });
  byId("stepPrevious").addEventListener("click", () => {
    networkStep = Math.max(0, networkStep - 1);
    renderNetwork();
  });
  byId("stepNext").addEventListener("click", () => {
    networkStep = Math.min(networkResult.steps.length - 1, networkStep + 1);
    renderNetwork();
  });
  byId("searchMeter").addEventListener("click", searchMeter);
  byId("meterCode").addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchMeter();
  });
  byId("sortRepairs").addEventListener("click", () => {
    repairSnapshots = bubbleSortSnapshots(REPAIRS);
    repairPass = repairSnapshots.length - 1;
    renderRepairList();
  });
  byId("repairPrevious").addEventListener("click", () => {
    repairPass = Math.max(0, repairPass - 1);
    renderRepairList();
  });
  byId("repairNext").addEventListener("click", () => {
    repairPass = Math.min(repairSnapshots.length - 1, repairPass + 1);
    renderRepairList();
  });
  byId("compareSequences").addEventListener("click", compareSequences);
  byId("encodeMessage").addEventListener("click", encodeMessage);
  byId("huffmanMessage").addEventListener("input", encodeMessage);
  byId("bstTree").innerHTML = meterTreeMarkup(METER_ROOT);
  searchMeter();
  renderRepairList();
  renderSchedule();
  renderNetwork();
  compareSequences();
  encodeMessage();
}

if (typeof document !== "undefined") initializePage();

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildHuffmanTree,
    calculateLcs,
    decodeHuffman,
    encodeHuffman,
    runKruskal,
    runPrim,
    runTraversal
  };
}
