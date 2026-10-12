/**
 * Visual Graph Engine and Mode Controller
 * "Inside an AI's Mind: When Knowledge Becomes a Graph"
 * Pure JS, Three.js 3D Engine + SVG Fallback, Zero External CDN Dependencies.
 */

import { ThreeGraphEngine } from "./three-scene.js";

(function () {
  "use strict";

  let threeEngine = null;

  // Fixed deterministic node layout in 1600x1000 coordinate space
  const NODE_POSITIONS = {
    ai: { x: 800, y: 500 },
    knowledge: { x: 800, y: 320 },
    reasoning: { x: 730, y: 160 },
    decision: { x: 590, y: 190 },
    ml: { x: 590, y: 490 },
    dl: { x: 560, y: 350 },
    nn: { x: 420, y: 330 },
    training: { x: 370, y: 450 },
    model: { x: 480, y: 450 },
    prediction: { x: 430, y: 200 },
    feedback: { x: 270, y: 340 },
    data: { x: 380, y: 600 },
    dataset: { x: 490, y: 740 },
    features: { x: 250, y: 720 },
    patterns: { x: 170, y: 530 },
    cv: { x: 1040, y: 650 },
    image: { x: 1180, y: 760 },
    objdet: { x: 1360, y: 780 },
    recognition: { x: 1320, y: 610 },
    nlp: { x: 1040, y: 350 },
    language: { x: 1200, y: 260 },
    words: { x: 1360, y: 330 },
    text: { x: 1160, y: 430 },
    meaning: { x: 1440, y: 200 },
    context: { x: 1180, y: 140 },
    chessrules: { x: 1260, y: 925 },
    gametree: { x: 1380, y: 925 },
    strategy: { x: 1500, y: 925 }
  };

  // State Management
  const STATE = {
    mode: "normal", // normal | path | cycle | subgraph | degree | component | lab
    currentView: "3d", // 3d | 2d
    currentDomainFilter: "all",
    selectedElement: null, // { type: 'vertex'|'edge', id: string }
    selectedPathId: "P1",
    pathCustomPair: [], // [fromId, toId] for connectivity explorer
    selectedCycleId: "C1",
    selectedSubgraphs: new Set(["S2"]),
    removedVertices: [],
    removedEdges: []
  };

  // AI MIND LAB - Interactive Graph Theory Experience State
  const LAB_STATE = {
    score: 0,
    isCollapsed: false,
    completedMissions: new Set(),
    activeTab: "m1", // m1 | m2 | m3 | m4 | glitch | scanner | diary | examiner
    m1: {
      start: "data",
      target: "prediction",
      path: ["data"],
      status: "idle", // idle | in_progress | success
      lastError: ""
    },
    m2: {
      selectedVertex: null,
      status: "idle" // idle | correct | wrong
    },
    m3: {
      selectedSequence: [],
      status: "idle", // idle | in_progress | correct
      lastError: ""
    },
    m4: {
      selectedNodes: new Set(),
      status: "idle" // idle | in_progress | correct | wrong
    },
    glitch: {
      active: false
    },
    scanner: {
      isScanning: false,
      hasScanned: false
    },
    examiner: {
      activeDemo: null,
      caption: ""
    }
  };

  // DOM Elements
  const svg = document.getElementById("graph-svg");
  const layerFrames = document.getElementById("layer-frames");
  const layerEdges = document.getElementById("layer-edges");
  const layerSubgraphs = document.getElementById("layer-subgraphs");
  const layerNodes = document.getElementById("layer-nodes");
  const layerOverlays = document.getElementById("layer-overlays");

  const subLeft = document.getElementById("sub-controls-left");
  const subRight = document.getElementById("sub-controls-right");
  const tooltip = document.getElementById("graph-tooltip");
  const infoPanel = document.getElementById("info-panel");
  const rankedPanel = document.getElementById("ranked-panel");

  // DOM elements map for quick updates
  const edgeDOMElements = new Map();
  const nodeDOMElements = new Map();

  /**
   * Helper to create SVG elements
   */
  function createSVG(tag, attrs = {}) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v);
    }
    return el;
  }

  /**
   * Initialize Graph DOM Elements
   */
  function initGraphDOM() {
    layerEdges.innerHTML = "";
    layerNodes.innerHTML = "";
    edgeDOMElements.clear();
    nodeDOMElements.clear();

    // Render Edges
    GRAPH.edges.forEach((edge) => {
      const p1 = NODE_POSITIONS[edge.a];
      const p2 = NODE_POSITIONS[edge.b];
      if (!p1 || !p2) return;

      const group = createSVG("g", { class: "edge-group", "data-edge-id": edge.id });

      const line = createSVG("line", {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        class: "edge-line",
        id: `edge-line-${edge.id}`
      });

      const hit = createSVG("line", {
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        class: "edge-hit"
      });

      hit.addEventListener("click", (e) => {
        e.stopPropagation();
        selectElement("edge", edge.id);
      });

      hit.addEventListener("mouseenter", (e) => {
        showTooltip(e, `Edge ${edge.id}: ${edge.a} ━ ${edge.b}`);
        line.style.stroke = "#F8FAFC";
        line.style.strokeWidth = "2.8px";
      });

      hit.addEventListener("mouseleave", () => {
        hideTooltip();
        line.style.stroke = "";
        line.style.strokeWidth = "";
      });

      group.appendChild(line);
      group.appendChild(hit);
      layerEdges.appendChild(group);

      edgeDOMElements.set(edge.id, { group, line, hit, data: edge });
    });

    // Render Nodes as 3D Tactile Glazed Ceramic Spheres
    GRAPH.vertices.forEach((v) => {
      const pos = NODE_POSITIONS[v.id];
      if (!pos) return;

      const domain = GRAPH.domains[v.domain];
      const baseRadius = v.id === "ai" ? 28 : 16;

      const group = createSVG("g", {
        class: "node-group",
        id: `node-${v.id}`,
        "data-vertex-id": v.id,
        transform: `translate(${pos.x}, ${pos.y})`
      });

      // 1. Soft Elliptical Contact Shadow beneath the sphere
      const shadow = createSVG("ellipse", {
        cx: 0,
        cy: (baseRadius * 0.88).toFixed(1),
        rx: (baseRadius * 0.95).toFixed(1),
        ry: (baseRadius * 0.35).toFixed(1),
        class: "node-contact-shadow",
        fill: "rgba(55, 40, 25, 0.24)",
        filter: "url(#node-contact-blur)"
      });

      // 2. Halo for selection / pulse
      const halo = createSVG("circle", {
        r: v.id === "ai" ? 38 : 25,
        class: "node-halo",
        stroke: domain.color
      });

      // 3. 3D Glazed Ceramic Marble / Sphere
      const circle = createSVG("circle", {
        r: baseRadius,
        class: "node-circle",
        fill: `url(#sphere-${v.domain})`,
        filter: `url(#glow-${getGlowFilterName(v.domain)})`
      });

      // 4. Ambient Studio Bounce Light (floor reflection crescent)
      const bounce = createSVG("ellipse", {
        cx: 0,
        cy: (baseRadius * 0.62).toFixed(1),
        rx: (baseRadius * 0.55).toFixed(1),
        ry: (baseRadius * 0.22).toFixed(1),
        class: "node-bounce",
        fill: "url(#sphere-bounce-light)"
      });

      // 5. Specular 3D Gloss Highlight Arc
      const gx = -baseRadius * 0.28;
      const gy = -baseRadius * 0.32;
      const gloss = createSVG("ellipse", {
        cx: gx.toFixed(1),
        cy: gy.toFixed(1),
        rx: (baseRadius * 0.42).toFixed(1),
        ry: (baseRadius * 0.22).toFixed(1),
        class: "node-gloss",
        fill: "url(#sphere-gloss-sheen)",
        transform: `rotate(-25, ${gx.toFixed(1)}, ${gy.toFixed(1)})`
      });

      // 6. Degree Badge (used in DEGREE mode)
      const degreeBadge = createSVG("text", {
        y: 1,
        class: "node-degree-badge",
        display: "none"
      });
      degreeBadge.textContent = `#${GRAPH.degree(v.id)}`;

      // 7. Text Label
      const label = createSVG("text", {
        y: v.id === "ai" ? 44 : 32,
        class: "node-label"
      });
      label.textContent = v.label;

      group.appendChild(shadow);
      group.appendChild(halo);
      group.appendChild(circle);
      group.appendChild(bounce);
      group.appendChild(gloss);
      group.appendChild(degreeBadge);
      group.appendChild(label);

      group.addEventListener("click", (e) => {
        e.stopPropagation();
        handleVertexClick(v.id);
      });

      group.addEventListener("mouseenter", (e) => {
        const deg = GRAPH.degree(v.id);
        showTooltip(e, `${v.label} (Degree: ${deg})`);
      });

      group.addEventListener("mouseleave", () => {
        hideTooltip();
      });

      layerNodes.appendChild(group);
      nodeDOMElements.set(v.id, { group, shadow, halo, circle, bounce, gloss, degreeBadge, label, data: v });
    });

    // Clicking SVG background clears selection
    svg.addEventListener("click", (e) => {
      if (e.target.tagName === "svg" || e.target.id === "graph-svg" || e.target.id.startsWith("layer-")) {
        clearSelection();
      }
    });
  }

  function getGlowFilterName(domainId) {
    switch (domainId) {
      case "core": return "gold";
      case "learning": return "cyan";
      case "vision": return "pink";
      case "nlp": return "green";
      case "reasoning": return "orange";
      case "special": return "violet";
      default: return "cyan";
    }
  }

  /**
   * Tooltip handlers
   */
  function showTooltip(e, text) {
    tooltip.textContent = text;
    tooltip.style.display = "block";
    const bounds = svg.getBoundingClientRect();
    const x = e.clientX + 14;
    const y = e.clientY + 14;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  /**
   * Selection Handling
   */
  function selectElement(type, id) {
    STATE.selectedElement = { type, id };

    // Trigger dynamic synaptic pulse ripple along connected edges when a vertex is clicked
    if (type === "vertex") {
      const incidentEdges = GRAPH.edges.filter((e) => e.a === id || e.b === id);
      incidentEdges.forEach((e) => {
        const edgeDOM = edgeDOMElements.get(e.id);
        if (edgeDOM && edgeDOM.line) {
          edgeDOM.line.classList.remove("synapse-pulse");
          void edgeDOM.line.offsetWidth; // Force DOM reflow to re-trigger CSS keyframe
          edgeDOM.line.classList.add("synapse-pulse");
        }
      });
    }

    renderRightPanel();
    highlightGraphElements();

    if (threeEngine) {
      threeEngine.highlightElement(type, id);
      if (type === "vertex") {
        threeEngine.focusNode(id, 800);
      }
    }
  }

  function clearSelection() {
    STATE.selectedElement = null;
    infoPanel.classList.remove("visible");
    highlightGraphElements();

    if (threeEngine) {
      threeEngine.clearHighlight();
    }
  }

  function handleVertexClick(vId) {
    if (STATE.mode === "lab") {
      handleLabVertexClick(vId);
      return;
    }

    if (STATE.mode === "path") {
      // Handle connectivity explorer clicking
      if (STATE.pathCustomPair.length === 0 || STATE.pathCustomPair.length === 2) {
        STATE.pathCustomPair = [vId];
        renderSubBar();
        selectElement("vertex", vId);
      } else if (STATE.pathCustomPair.length === 1) {
        STATE.pathCustomPair.push(vId);
        renderSubBar();
        selectElement("vertex", vId);
      }
    } else {
      selectElement("vertex", vId);
    }
  }

  /**
   * Render Right Information Panel
   */
  function renderRightPanel() {
    if (!STATE.selectedElement) {
      infoPanel.classList.remove("visible");
      return;
    }

    const { type, id } = STATE.selectedElement;
    const typeTag = document.getElementById("panel-type-tag");
    const title = document.getElementById("panel-title");
    const domainVal = document.getElementById("panel-domain-val");
    const meaningVal = document.getElementById("panel-meaning-val");
    const degreeSec = document.getElementById("panel-degree-section");
    const degreeNum = document.getElementById("panel-degree-num");
    const nbrsSec = document.getElementById("panel-neighbors-section");
    const nbrsList = document.getElementById("panel-neighbors-list");
    const mathVal = document.getElementById("panel-math-val");

    if (type === "vertex") {
      const v = GRAPH.vertices.find((item) => item.id === id);
      if (!v) return;

      const domain = GRAPH.domains[v.domain];
      const deg = GRAPH.degree(v.id);
      const nbrIds = GRAPH.neighbors(v.id);

      typeTag.textContent = "VERTEX (CONCEPT)";
      title.textContent = v.label;
      domainVal.innerHTML = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${domain.color}; margin-right:6px;"></span>${domain.name}`;
      meaningVal.textContent = v.meaning;

      degreeSec.style.display = "flex";
      degreeNum.textContent = deg;

      nbrsSec.style.display = "flex";
      nbrsList.innerHTML = "";
      nbrIds.forEach((nid) => {
        const nv = GRAPH.vertices.find((x) => x.id === nid);
        const chip = document.createElement("button");
        chip.className = "panel-chip";
        chip.textContent = nv ? nv.label : nid;
        chip.addEventListener("click", () => {
          selectElement("vertex", nid);
        });
        nbrsList.appendChild(chip);
      });

      // Math Insight Sentence
      let insight = `Degree ${deg} means exactly ${deg} knowledge relationship${deg === 1 ? "" : "s"} meet at this vertex.`;
      if (GRAPH.isCutVertex(v.id)) {
        insight += ` ★ CUT VERTEX: Removing "${v.label}" increases the graph's components, disconnecting parts of the network.`;
      } else if (deg === 1) {
        insight += ` Pendant / Leaf vertex: hangs on a single edge and has minimal degree.`;
      } else if (v.id === "ai") {
        insight += ` AI is visually the central hub with degree 5, but Data has higher degree (7).`;
      } else if (v.id === "data") {
        insight += ` Highest-degree vertex in the entire network (degree 7).`;
      }
      mathVal.textContent = insight;

      infoPanel.classList.add("visible");
    } else if (type === "edge") {
      const edge = GRAPH.edges.find((e) => e.id === id);
      if (!edge) return;

      const va = GRAPH.vertices.find((x) => x.id === edge.a);
      const vb = GRAPH.vertices.find((x) => x.id === edge.b);

      typeTag.textContent = "EDGE (RELATIONSHIP)";
      title.textContent = `${edge.id}: ${va ? va.label : edge.a} ━ ${vb ? vb.label : edge.b}`;
      domainVal.textContent = "Simple, undirected edge: relationship is bidirectional.";
      meaningVal.textContent = edge.meaning;

      degreeSec.style.display = "none";

      nbrsSec.style.display = "flex";
      nbrsList.innerHTML = "";
      [va, vb].forEach((vNode) => {
        if (!vNode) return;
        const chip = document.createElement("button");
        chip.className = "panel-chip";
        chip.textContent = `Node: ${vNode.label}`;
        chip.addEventListener("click", () => {
          selectElement("vertex", vNode.id);
        });
        nbrsList.appendChild(chip);
      });

      let edgeMath = "Undirected: an edge e = (u, v) can be traversed in either direction.";
      if (GRAPH.isBridge(edge.id)) {
        edgeMath += ` ★ BRIDGE: Removing this edge disconnects the graph into more components.`;
      }
      mathVal.textContent = edgeMath;

      infoPanel.classList.add("visible");
    }
  }

  /**
   * Main Render Controller across the 6 Modes
   */
  function applyMode() {
    clearSelection();
    STATE.pathCustomPair = [];
    layerOverlays.innerHTML = "";
    layerSubgraphs.innerHTML = "";
    layerFrames.innerHTML = "";
    rankedPanel.style.display = "none";

    renderSubBar();

    const labHud = document.getElementById("lab-hud");
    const labExpandPill = document.getElementById("lab-expand-pill");
    if (labHud) {
      if (STATE.mode === "lab") {
        labHud.classList.add("visible");
        if (LAB_STATE.isCollapsed) {
          labHud.classList.add("collapsed");
          if (labExpandPill) labExpandPill.style.display = "inline-flex";
        } else {
          labHud.classList.remove("collapsed");
          if (labExpandPill) labExpandPill.style.display = "none";
        }
      } else {
        labHud.classList.remove("visible", "collapsed");
        if (labExpandPill) labExpandPill.style.display = "none";
        LAB_STATE.isCollapsed = false;
      }
    }
    if (STATE.mode !== "lab") {
      LAB_STATE.glitch.active = false;
    }

    // Reset base styles
    nodeDOMElements.forEach(({ circle, shadow, gloss, bounce, halo, degreeBadge, group, data }) => {
      group.classList.remove(
        "dimmed", "node-pulse",
        "lab-start", "lab-target", "lab-correct", "lab-incorrect", "lab-selected"
      );
      halo.style.opacity = "0";
      degreeBadge.setAttribute("display", "none");

      if (STATE.mode !== "component") {
        circle.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
        circle.setAttribute("stroke-width", "2.2");
      }

      if (STATE.mode === "degree") {
        const deg = GRAPH.degree(data.id);
        const scaledR = 10 + deg * 3.4;
        circle.setAttribute("r", scaledR);
        if (shadow) {
          shadow.setAttribute("cy", (scaledR * 0.88).toFixed(1));
          shadow.setAttribute("rx", (scaledR * 0.95).toFixed(1));
          shadow.setAttribute("ry", (scaledR * 0.35).toFixed(1));
        }
        if (gloss) {
          const gx = -scaledR * 0.28;
          const gy = -scaledR * 0.32;
          gloss.setAttribute("cx", gx.toFixed(1));
          gloss.setAttribute("cy", gy.toFixed(1));
          gloss.setAttribute("rx", (scaledR * 0.42).toFixed(1));
          gloss.setAttribute("ry", (scaledR * 0.22).toFixed(1));
          gloss.setAttribute("transform", `rotate(-25, ${gx.toFixed(1)}, ${gy.toFixed(1)})`);
        }
        if (bounce) {
          bounce.setAttribute("cy", (scaledR * 0.62).toFixed(1));
          bounce.setAttribute("rx", (scaledR * 0.55).toFixed(1));
          bounce.setAttribute("ry", (scaledR * 0.22).toFixed(1));
        }
        degreeBadge.setAttribute("display", "block");
        if (data.id === "data") {
          group.classList.add("node-pulse");
        }
      } else {
        const r = data.id === "ai" ? 28 : 16;
        circle.setAttribute("r", r);
        if (shadow) {
          shadow.setAttribute("cy", (r * 0.88).toFixed(1));
          shadow.setAttribute("rx", (r * 0.95).toFixed(1));
          shadow.setAttribute("ry", (r * 0.35).toFixed(1));
        }
        if (gloss) {
          const gx = -r * 0.28;
          const gy = -r * 0.32;
          gloss.setAttribute("cx", gx.toFixed(1));
          gloss.setAttribute("cy", gy.toFixed(1));
          gloss.setAttribute("rx", (r * 0.42).toFixed(1));
          gloss.setAttribute("ry", (r * 0.22).toFixed(1));
          gloss.setAttribute("transform", `rotate(-25, ${gx.toFixed(1)}, ${gy.toFixed(1)})`);
        }
        if (bounce) {
          bounce.setAttribute("cy", (r * 0.62).toFixed(1));
          bounce.setAttribute("rx", (r * 0.55).toFixed(1));
          bounce.setAttribute("ry", (r * 0.22).toFixed(1));
        }
      }
    });

    edgeDOMElements.forEach(({ line, group }) => {
      group.classList.remove("dimmed");
      line.className.baseVal = "edge-line";
      line.classList.remove("lab-active", "lab-glitch");
      line.style.strokeDasharray = "";
      line.style.display = "block";
    });

    // Mode-specific drawing
    switch (STATE.mode) {
      case "normal":
        renderNormalMode();
        break;
      case "path":
        renderPathMode();
        break;
      case "cycle":
        renderCycleMode();
        break;
      case "subgraph":
        renderSubgraphMode();
        break;
      case "degree":
        renderDegreeMode();
        break;
      case "component":
        renderComponentMode();
        break;
      case "lab":
        renderLabMode();
        break;
    }

    highlightGraphElements();
    syncThreeEngineVisuals();
  }

  function syncThreeEngineVisuals() {
    if (!threeEngine) return;

    switch (STATE.mode) {
      case "normal":
        threeEngine.setModeVisuals("normal");
        break;

      case "path": {
        let pathVertices = null;
        if (STATE.pathCustomPair.length === 2) {
          pathVertices = GRAPH.shortestPath(STATE.pathCustomPair[0], STATE.pathCustomPair[1], STATE.removedVertices);
        } else if (GRAPH.featured.paths[STATE.selectedPathId]) {
          pathVertices = GRAPH.featured.paths[STATE.selectedPathId].vertices;
        }
        let pathEdges = [];
        if (pathVertices) {
          for (let i = 0; i < pathVertices.length - 1; i++) {
            const u = pathVertices[i];
            const v = pathVertices[i + 1];
            const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
            if (edge) pathEdges.push(edge.id);
          }
        }
        threeEngine.setModeVisuals("path", { pathVertices, pathEdges });
        break;
      }

      case "cycle": {
        let cycleVertices = null;
        let cycleEdges = [];
        if (GRAPH.featured.cycles[STATE.selectedCycleId]) {
          cycleVertices = GRAPH.featured.cycles[STATE.selectedCycleId].vertices;
          for (let i = 0; i < cycleVertices.length - 1; i++) {
            const u = cycleVertices[i];
            const v = cycleVertices[i + 1];
            const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
            if (edge) cycleEdges.push(edge.id);
          }
        }
        threeEngine.setModeVisuals("cycle", { cycleVertices, cycleEdges });
        break;
      }

      case "subgraph": {
        const allSubNodes = new Set();
        const allSubEdges = new Set();
        STATE.selectedSubgraphs.forEach((subId) => {
          const sub = GRAPH.featured.subgraphs[subId];
          if (sub) {
            sub.vertices.forEach((v) => allSubNodes.add(v));
            sub.edges.forEach((e) => allSubEdges.add(e));
          }
        });
        threeEngine.setModeVisuals("subgraph", {
          subgraphNodes: Array.from(allSubNodes),
          subgraphEdges: Array.from(allSubEdges)
        });
        break;
      }

      case "degree":
        threeEngine.setModeVisuals("degree");
        break;

      case "component": {
        const comps = GRAPH.components(STATE.removedVertices, STATE.removedEdges);
        threeEngine.setModeVisuals("component", {
          removedVertices: STATE.removedVertices,
          removedEdges: STATE.removedEdges,
          components: comps
        });
        break;
      }

      case "lab":
        threeEngine.setModeVisuals("lab", {
          tab: LAB_STATE.activeTab,
          m1: LAB_STATE.m1,
          m2: LAB_STATE.m2,
          m3: LAB_STATE.m3,
          m4: LAB_STATE.m4,
          glitch: LAB_STATE.glitch
        });
        break;
    }
  }

  // ---------------- MODE 1: NORMAL ----------------
  function renderNormalMode() {
    drawSpecializedFrame();
  }

  function drawSpecializedFrame() {
    layerFrames.innerHTML = "";
    const rect = createSVG("rect", {
      x: 1210,
      y: 875,
      width: 345,
      height: 95,
      class: "specialized-frame"
    });
    const label = createSVG("text", {
      x: 1225,
      y: 896,
      class: "specialized-label"
    });
    label.textContent = "SPECIALIZED KNOWLEDGE (COMPONENT K2)";
    layerFrames.appendChild(rect);
    layerFrames.appendChild(label);
  }

  // ---------------- MODE 2: PATH ----------------
  function renderPathMode() {
    drawSpecializedFrame();

    let pathVertices = null;
    let pathLabel = "";

    if (STATE.pathCustomPair.length === 2) {
      const [from, to] = STATE.pathCustomPair;
      pathVertices = GRAPH.shortestPath(from, to, STATE.removedVertices);
      const vFrom = GRAPH.vertices.find((x) => x.id === from);
      const vTo = GRAPH.vertices.find((x) => x.id === to);
      pathLabel = `${vFrom.label} ↝ ${vTo.label}`;
    } else if (GRAPH.featured.paths[STATE.selectedPathId]) {
      const pObj = GRAPH.featured.paths[STATE.selectedPathId];
      pathVertices = pObj.vertices;
      pathLabel = `${pObj.id}: ${pObj.name}`;
    }

    if (!pathVertices) {
      // Disconnected or incomplete
      dimAllExcept([]);
      return;
    }

    const pathSet = new Set(pathVertices);
    dimAllExcept(Array.from(pathSet));

    // Highlight edges in path with animated glowing dash
    const pathEdges = [];
    for (let i = 0; i < pathVertices.length - 1; i++) {
      const u = pathVertices[i];
      const v = pathVertices[i + 1];
      const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
      if (edge) {
        pathEdges.push(edge.id);
        const el = edgeDOMElements.get(edge.id);
        if (el) {
          el.line.className.baseVal = "edge-line path-flow";
          el.group.classList.remove("dimmed");
        }
      }
    }

    // Number vertices in order
    layerOverlays.innerHTML = "";
    pathVertices.forEach((vid, index) => {
      const pos = NODE_POSITIONS[vid];
      if (!pos) return;

      const badgeGroup = createSVG("g", {
        transform: `translate(${pos.x + 14}, ${pos.y - 14})`,
        "data-badge-vid": vid
      });
      const badgeCircle = createSVG("circle", {
        r: 11,
        class: "order-badge",
        fill: "#FFFFFF",
        stroke: "#047857",
        "stroke-width": "2"
      });
      const badgeText = createSVG("text", {
        class: "order-text",
        y: 1,
        fill: "#064E3B"
      });
      badgeText.textContent = String(index + 1);

      badgeGroup.appendChild(badgeCircle);
      badgeGroup.appendChild(badgeText);
      layerOverlays.appendChild(badgeGroup);
    });
  }

  // ---------------- MODE 3: CYCLE ----------------
  function renderCycleMode() {
    drawSpecializedFrame();

    const cObj = GRAPH.featured.cycles[STATE.selectedCycleId];
    if (!cObj) return;

    const cycleVertices = cObj.vertices;
    const uniqueVertices = cycleVertices.slice(0, cycleVertices.length - 1);
    dimAllExcept(uniqueVertices);

    // Calculate centroid for loop symbol
    let sumX = 0;
    let sumY = 0;
    uniqueVertices.forEach((vid) => {
      const pos = NODE_POSITIONS[vid];
      sumX += pos.x;
      sumY += pos.y;
    });
    const centroidX = sumX / uniqueVertices.length;
    const centroidY = sumY / uniqueVertices.length;

    // Highlight cycle edges
    layerOverlays.innerHTML = "";
    for (let i = 0; i < cycleVertices.length - 1; i++) {
      const u = cycleVertices[i];
      const v = cycleVertices[i + 1];
      const isClosing = (i === cycleVertices.length - 2);
      const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
      if (edge) {
        const el = edgeDOMElements.get(edge.id);
        if (el) {
          el.line.className.baseVal = isClosing ? "edge-line cycle-closing" : "edge-line cycle-edge";
          el.group.classList.remove("dimmed");
        }
      }
    }

    // Centroid Symbol ⟳
    const loopSym = createSVG("text", {
      x: centroidX,
      y: centroidY,
      class: "cycle-center-symbol"
    });
    loopSym.textContent = "⟳";
    layerOverlays.appendChild(loopSym);

    // Number the vertices around cycle
    uniqueVertices.forEach((vid, index) => {
      const pos = NODE_POSITIONS[vid];
      if (!pos) return;
      const badgeGroup = createSVG("g", {
        transform: `translate(${pos.x + 14}, ${pos.y - 14})`,
        "data-badge-vid": vid
      });
      const badgeCircle = createSVG("circle", {
        r: 11,
        class: "order-badge",
        fill: "#FFFFFF",
        stroke: "#E11D48",
        "stroke-width": "2"
      });
      const badgeText = createSVG("text", {
        class: "order-text",
        y: 1,
        fill: "#9F1239"
      });
      badgeText.textContent = String(index + 1);

      badgeGroup.appendChild(badgeCircle);
      badgeGroup.appendChild(badgeText);
      layerOverlays.appendChild(badgeGroup);
    });
  }

  // ---------------- MODE 4: SUBGRAPH ----------------
  function renderSubgraphMode() {
    drawSpecializedFrame();
    layerSubgraphs.innerHTML = "";

    const allSubVertices = new Set();
    const internalEdgeIds = new Set();
    const boundaryEdgeIds = new Set();

    STATE.selectedSubgraphs.forEach((subId) => {
      const sObj = GRAPH.featured.subgraphs[subId];
      if (!sObj) return;

      const subInfo = GRAPH.inducedSubgraph(sObj.vertices);
      sObj.vertices.forEach((v) => allSubVertices.add(v));
      subInfo.edges.forEach((e) => internalEdgeIds.add(e.id));
      subInfo.boundaryEdges.forEach((e) => boundaryEdgeIds.add(e.id));

      // Draw soft halo around subgraph vertices
      let minX = 9999, minY = 9999, maxX = -9999, maxY = -9999;
      sObj.vertices.forEach((vid) => {
        const pos = NODE_POSITIONS[vid];
        if (pos.x < minX) minX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y > maxY) maxY = pos.y;
      });

      const pad = 42;
      const domainColor = GRAPH.domains[sObj.domain].color;
      const hull = createSVG("rect", {
        x: minX - pad,
        y: minY - pad,
        width: (maxX - minX) + pad * 2,
        height: (maxY - minY) + pad * 2,
        rx: 24,
        ry: 24,
        class: "subgraph-hull",
        fill: domainColor,
        stroke: domainColor
      });
      layerSubgraphs.appendChild(hull);
    });

    // Dim non-members
    nodeDOMElements.forEach(({ group, data }) => {
      if (allSubVertices.has(data.id)) {
        group.classList.remove("dimmed");
      } else {
        group.classList.add("dimmed");
      }
    });

    edgeDOMElements.forEach(({ line, group, data }) => {
      if (internalEdgeIds.has(data.id)) {
        line.className.baseVal = "edge-line subgraph-internal";
        group.classList.remove("dimmed");
      } else if (boundaryEdgeIds.has(data.id)) {
        line.className.baseVal = "edge-line subgraph-boundary";
        group.classList.remove("dimmed");
      } else {
        line.className.baseVal = "edge-line";
        group.classList.add("dimmed");
      }
    });
  }

  // ---------------- MODE 5: DEGREE ----------------
  function renderDegreeMode() {
    drawSpecializedFrame();
    rankedPanel.style.display = "flex";

    // Populate Ranked List panel
    const listContainer = document.getElementById("ranked-degree-list");
    listContainer.innerHTML = "";

    const sortedVertices = [...GRAPH.vertices].sort((a, b) => {
      const da = GRAPH.degree(a.id);
      const db = GRAPH.degree(b.id);
      return db - da;
    });

    sortedVertices.forEach((v, idx) => {
      const deg = GRAPH.degree(v.id);
      const row = document.createElement("div");
      row.className = `ranked-row ${idx === 0 ? "top-rank" : ""}`;
      row.innerHTML = `
        <span><strong>#${idx + 1}</strong> ${v.label}</span>
        <span class="highlight-chip" style="color:${GRAPH.domains[v.domain].color};">deg ${deg}</span>
      `;
      row.addEventListener("click", () => {
        selectElement("vertex", v.id);
      });
      listContainer.appendChild(row);
    });
  }

  // ---------------- MODE 6: COMPONENT ----------------
  function renderComponentMode() {
    layerFrames.innerHTML = "";

    // Compute live components with removed items
    const comps = GRAPH.components(STATE.removedVertices, STATE.removedEdges);

    // Hide removed vertices and edges
    const remVSet = new Set(STATE.removedVertices);
    const remESet = new Set(STATE.removedEdges);

    nodeDOMElements.forEach(({ group, circle, data }) => {
      if (remVSet.has(data.id)) {
        group.style.display = "none";
      } else {
        group.style.display = "block";
      }
    });

    edgeDOMElements.forEach(({ group, line, data }) => {
      if (remESet.has(data.id) || remVSet.has(data.a) || remVSet.has(data.b)) {
        group.style.display = "none";
      } else {
        group.style.display = "block";
      }
    });

    // Component color palette
    const compColors = [
      { stroke: "#0284C7", bg: "rgba(2, 132, 199, 0.04)", label: "#0284C7" },
      { stroke: "#7C3AED", bg: "rgba(124, 58, 237, 0.04)", label: "#7C3AED" },
      { stroke: "#E11D48", bg: "rgba(225, 29, 72, 0.04)", label: "#E11D48" },
      { stroke: "#059669", bg: "rgba(5, 150, 105, 0.04)", label: "#059669" }
    ];

    comps.forEach((comp, idx) => {
      const style = compColors[idx % compColors.length];

      // Find bounding box
      let minX = 9999, minY = 9999, maxX = -9999, maxY = -9999;
      comp.vertices.forEach((vid) => {
        const pos = NODE_POSITIONS[vid];
        if (pos.x < minX) minX = pos.x;
        if (pos.y < minY) minY = pos.y;
        if (pos.x > maxX) maxX = pos.x;
        if (pos.y > maxY) maxY = pos.y;
      });

      const pad = 40;
      const rect = createSVG("rect", {
        x: minX - pad,
        y: minY - pad,
        width: Math.max(90, (maxX - minX) + pad * 2),
        height: Math.max(70, (maxY - minY) + pad * 2),
        rx: 16,
        ry: 16,
        fill: style.bg,
        stroke: style.stroke,
        "stroke-dasharray": "8 5",
        "stroke-width": 1.5
      });

      const compTag = createSVG("text", {
        x: minX - pad + 14,
        y: minY - pad + 20,
        fill: style.label,
        "font-size": 11,
        "font-weight": 700,
        "letter-spacing": 1.1
      });
      compTag.textContent = `COMPONENT ${idx + 1}: ${comp.vertices.length} vertices, ${comp.edgeCount} edges`;

      layerFrames.appendChild(rect);
      layerFrames.appendChild(compTag);

      // Tint nodes
      comp.vertices.forEach((vid) => {
        const el = nodeDOMElements.get(vid);
        if (el) {
          el.circle.setAttribute("stroke", style.stroke);
          el.circle.setAttribute("stroke-width", "2.5");
        }
      });
    });
  }

  // =========================================================================
  // MODE 7: AI MIND LAB — INTERACTIVE GRAPH THEORY EXPERIENCE
  // =========================================================================

  function renderLabMode() {
    drawSpecializedFrame();
    renderLabHUD();
    applyLabGraphVisuals();
  }

  function updateScore() {
    LAB_STATE.score = LAB_STATE.completedMissions.size;
    const badge = document.getElementById("lab-score-badge");
    if (badge) {
      badge.textContent = `AI MIND SCORE: ${LAB_STATE.score}/4`;
    }
    const pillBadge = document.getElementById("pill-score");
    if (pillBadge) {
      pillBadge.textContent = `${LAB_STATE.score}/4`;
    }
    const banner = document.getElementById("lab-master-banner");
    if (banner) {
      banner.style.display = LAB_STATE.score === 4 ? "flex" : "none";
    }
  }

  function setLabTab(tab) {
    LAB_STATE.activeTab = tab;
    renderLabHUD();
    applyLabGraphVisuals();
  }

  function handleLabVertexClick(vId) {
    switch (LAB_STATE.activeTab) {
      case "m1": {
        const m1 = LAB_STATE.m1;
        if (m1.status === "success") return;
        if (vId === "data" && m1.path.length === 1) return;

        const currentEnd = m1.path[m1.path.length - 1];
        const isNeighbor = GRAPH.neighbors(currentEnd).includes(vId);

        if (!isNeighbor) {
          const vObj = GRAPH.vertices.find((x) => x.id === vId);
          const endObj = GRAPH.vertices.find((x) => x.id === currentEnd);
          m1.lastError = `"${vObj ? vObj.label : vId}" is not connected to "${endObj ? endObj.label : currentEnd}". Select an adjacent concept!`;
        } else if (m1.path.includes(vId)) {
          const vObj = GRAPH.vertices.find((x) => x.id === vId);
          m1.lastError = `"${vObj ? vObj.label : vId}" is already visited. Simple paths cannot repeat vertices!`;
        } else {
          m1.path.push(vId);
          m1.lastError = "";
          if (vId === "prediction") {
            m1.status = "success";
            if (!LAB_STATE.completedMissions.has("m1")) {
              LAB_STATE.completedMissions.add("m1");
              updateScore();
            }
          }
        }
        renderLabHUD();
        applyLabGraphVisuals();
        break;
      }

      case "m2": {
        LAB_STATE.m2.selectedVertex = vId;
        if (vId === "data") {
          LAB_STATE.m2.status = "correct";
          if (!LAB_STATE.completedMissions.has("m2")) {
            LAB_STATE.completedMissions.add("m2");
            updateScore();
          }
        } else {
          LAB_STATE.m2.status = "wrong";
        }
        renderLabHUD();
        applyLabGraphVisuals();
        break;
      }

      case "m3": {
        const m3 = LAB_STATE.m3;
        if (m3.status === "correct") return;

        if (m3.selectedSequence.length === 0) {
          m3.selectedSequence.push(vId);
          m3.lastError = "";
        } else {
          const currentEnd = m3.selectedSequence[m3.selectedSequence.length - 1];
          if (vId === currentEnd) return;

          const isNeighbor = GRAPH.neighbors(currentEnd).includes(vId);
          if (!isNeighbor) {
            const vObj = GRAPH.vertices.find((x) => x.id === vId);
            const endObj = GRAPH.vertices.find((x) => x.id === currentEnd);
            m3.lastError = `"${vObj ? vObj.label : vId}" is not connected to "${endObj ? endObj.label : currentEnd}". Select an adjacent concept!`;
          } else if (vId === m3.selectedSequence[0] && m3.selectedSequence.length >= 3) {
            m3.selectedSequence.push(vId);
            m3.status = "correct";
            m3.lastError = "";
            if (!LAB_STATE.completedMissions.has("m3")) {
              LAB_STATE.completedMissions.add("m3");
              updateScore();
            }
          } else if (m3.selectedSequence.includes(vId)) {
            const vObj = GRAPH.vertices.find((x) => x.id === vId);
            m3.lastError = `Cannot repeat vertex "${vObj ? vObj.label : vId}" before closing the loop back at the start!`;
          } else {
            m3.selectedSequence.push(vId);
            m3.lastError = "";
          }
        }
        renderLabHUD();
        applyLabGraphVisuals();
        break;
      }

      case "m4": {
        const m4 = LAB_STATE.m4;
        if (m4.selectedNodes.has(vId)) {
          m4.selectedNodes.delete(vId);
        } else {
          m4.selectedNodes.add(vId);
        }

        const target = ["cv", "image", "objdet", "recognition"];
        const isMatch = target.length === m4.selectedNodes.size && target.every((id) => m4.selectedNodes.has(id));
        if (isMatch) {
          m4.status = "correct";
          if (!LAB_STATE.completedMissions.has("m4")) {
            LAB_STATE.completedMissions.add("m4");
            updateScore();
          }
        } else {
          const hasWrong = Array.from(m4.selectedNodes).some((id) => !target.includes(id));
          m4.status = hasWrong ? "wrong" : "in_progress";
        }
        renderLabHUD();
        applyLabGraphVisuals();
        break;
      }

      default:
        selectElement("vertex", vId);
        break;
    }
  }

  function applyLabGraphVisuals() {
    if (STATE.mode !== "lab") return;

    nodeDOMElements.forEach(({ circle, group }) => {
      group.classList.remove(
        "dimmed", "node-pulse",
        "lab-start", "lab-target", "lab-correct", "lab-incorrect", "lab-selected"
      );
      circle.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
      circle.setAttribute("stroke-width", "2.2");
    });

    edgeDOMElements.forEach(({ line, group }) => {
      group.classList.remove("dimmed");
      line.className.baseVal = "edge-line";
      line.classList.remove("lab-active", "lab-glitch");
      line.style.strokeDasharray = "";
      line.style.display = "block";
    });

    layerOverlays.innerHTML = "";

    switch (LAB_STATE.activeTab) {
      case "m1": {
        const pathNodes = LAB_STATE.m1.path;
        const isDone = LAB_STATE.m1.status === "success";

        const startEl = nodeDOMElements.get("data");
        const targetEl = nodeDOMElements.get("prediction");
        if (startEl) startEl.group.classList.add("lab-start");
        if (targetEl) targetEl.group.classList.add("lab-target");

        const allowed = new Set([...pathNodes, "data", "prediction"]);
        const currentEnd = pathNodes[pathNodes.length - 1];
        if (!isDone && currentEnd) {
          GRAPH.neighbors(currentEnd).forEach((nid) => allowed.add(nid));
        }

        nodeDOMElements.forEach(({ group, data }) => {
          if (!allowed.has(data.id)) {
            group.classList.add("dimmed");
          }
        });

        pathNodes.forEach((vid) => {
          const el = nodeDOMElements.get(vid);
          if (el) {
            el.group.classList.remove("dimmed");
            el.group.classList.add(isDone ? "lab-correct" : "lab-selected");
          }
        });

        for (let i = 0; i < pathNodes.length - 1; i++) {
          const u = pathNodes[i];
          const v = pathNodes[i + 1];
          const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
          if (edge) {
            const eEl = edgeDOMElements.get(edge.id);
            if (eEl) {
              eEl.group.classList.remove("dimmed");
              eEl.line.className.baseVal = isDone ? "edge-line lab-active" : "edge-line path-flow";
            }
          }
        }

        pathNodes.forEach((vid, index) => {
          const pos = NODE_POSITIONS[vid];
          if (!pos) return;
          const badgeGroup = createSVG("g", {
            transform: `translate(${pos.x + 14}, ${pos.y - 14})`
          });
          const badgeCircle = createSVG("circle", {
            r: 10,
            class: "order-badge",
            fill: isDone ? "#ECFDF5" : "#FFFFFF",
            stroke: isDone ? "#059669" : "#0284C7",
            "stroke-width": "2"
          });
          const badgeText = createSVG("text", {
            class: "order-text",
            y: 1,
            fill: isDone ? "#047857" : "#0369A1"
          });
          badgeText.textContent = String(index + 1);
          badgeGroup.appendChild(badgeCircle);
          badgeGroup.appendChild(badgeText);
          layerOverlays.appendChild(badgeGroup);
        });
        break;
      }

      case "m2": {
        if (LAB_STATE.m2.selectedVertex) {
          const selId = LAB_STATE.m2.selectedVertex;
          const isCorrect = LAB_STATE.m2.status === "correct";

          nodeDOMElements.forEach(({ group, data }) => {
            if (data.id === selId) {
              group.classList.add(isCorrect ? "lab-correct" : "lab-incorrect");
              if (isCorrect) group.classList.add("node-pulse");
            } else if (isCorrect) {
              if (GRAPH.neighbors("data").includes(data.id)) {
                group.classList.remove("dimmed");
              } else {
                group.classList.add("dimmed");
              }
            }
          });

          if (isCorrect) {
            GRAPH.edges.forEach((edge) => {
              const eEl = edgeDOMElements.get(edge.id);
              if (!eEl) return;
              if (edge.a === "data" || edge.b === "data") {
                eEl.group.classList.remove("dimmed");
                eEl.line.className.baseVal = "edge-line lab-active";
              } else {
                eEl.group.classList.add("dimmed");
              }
            });
          }
        }
        break;
      }

      case "m3": {
        const seq = LAB_STATE.m3.selectedSequence;
        const isCorrect = LAB_STATE.m3.status === "correct";

        if (seq.length > 0) {
          const seqSet = new Set(seq);
          nodeDOMElements.forEach(({ group, data }) => {
            if (seqSet.has(data.id)) {
              group.classList.remove("dimmed");
              group.classList.add(isCorrect ? "lab-correct" : "lab-selected");
            } else {
              group.classList.add("dimmed");
            }
          });

          for (let i = 0; i < seq.length - 1; i++) {
            const u = seq[i];
            const v = seq[i + 1];
            const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
            if (edge) {
              const eEl = edgeDOMElements.get(edge.id);
              if (eEl) {
                eEl.group.classList.remove("dimmed");
                eEl.line.className.baseVal = isCorrect ? "edge-line cycle-flow" : "edge-line path-flow";
              }
            }
          }
        }
        break;
      }

      case "m4": {
        const selected = LAB_STATE.m4.selectedNodes;
        const isCorrect = LAB_STATE.m4.status === "correct";

        if (selected.size > 0) {
          nodeDOMElements.forEach(({ group, data }) => {
            if (selected.has(data.id)) {
              group.classList.remove("dimmed");
              group.classList.add(isCorrect ? "lab-correct" : "lab-selected");
            } else if (isCorrect) {
              group.classList.add("dimmed");
            }
          });

          edgeDOMElements.forEach(({ line, group, data }) => {
            if (selected.has(data.a) && selected.has(data.b)) {
              group.classList.remove("dimmed");
              line.className.baseVal = isCorrect ? "edge-line subgraph-internal" : "edge-line lab-active";
            } else if (isCorrect && (selected.has(data.a) || selected.has(data.b))) {
              group.classList.remove("dimmed");
              line.className.baseVal = "edge-line subgraph-boundary";
            } else if (isCorrect) {
              group.classList.add("dimmed");
            }
          });
        }
        break;
      }

      case "glitch": {
        if (LAB_STATE.glitch.active) {
          const edgeE18 = edgeDOMElements.get("E18");
          if (edgeE18) {
            edgeE18.line.classList.add("lab-glitch");
          }
          const dsNode = nodeDOMElements.get("dataset");
          if (dsNode) {
            dsNode.group.classList.add("lab-incorrect", "node-pulse");
          }
          const dataNode = nodeDOMElements.get("data");
          if (dataNode) {
            dataNode.group.classList.add("lab-selected");
          }
        }
        break;
      }
    }

    if (threeEngine && STATE.mode === "lab") {
      threeEngine.setModeVisuals("lab", {
        tab: LAB_STATE.activeTab,
        m1: LAB_STATE.m1,
        m2: LAB_STATE.m2,
        m3: LAB_STATE.m3,
        m4: LAB_STATE.m4,
        glitch: LAB_STATE.glitch
      });
    }
  }

  function renderLabHUD() {
    const labBody = document.getElementById("lab-body");
    if (!labBody) return;

    updateScore();

    document.querySelectorAll(".lab-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === LAB_STATE.activeTab);
    });

    switch (LAB_STATE.activeTab) {
      case "m1":
        labBody.innerHTML = renderLabM1();
        break;
      case "m2":
        labBody.innerHTML = renderLabM2();
        break;
      case "m3":
        labBody.innerHTML = renderLabM3();
        break;
      case "m4":
        labBody.innerHTML = renderLabM4();
        break;
      case "glitch":
        labBody.innerHTML = renderLabGlitch();
        break;
      case "scanner":
        labBody.innerHTML = renderLabScanner();
        break;
      case "diary":
        labBody.innerHTML = renderLabDiary();
        break;
      case "examiner":
        labBody.innerHTML = renderLabExaminer();
        break;
    }

    wireLabTabControls();
  }

  function renderLabM1() {
    const m1 = LAB_STATE.m1;
    const isDone = m1.status === "success";

    const crumbsHtml = m1.path.map((vid, idx) => {
      const v = GRAPH.vertices.find((x) => x.id === vid);
      const label = v ? v.label : vid;
      return `<span class="crumb-node">${label}</span>` +
        (idx < m1.path.length - 1 ? `<span class="crumb-arrow">➔</span>` : "");
    }).join("");

    let successCard = "";
    if (isDone) {
      const fullPathStr = m1.path.map((id) => GRAPH.vertices.find((x) => x.id === id)?.label).join(" ➔ ");
      successCard = `
        <div class="lab-success-card">
          <div class="success-header-row">
            <span style="font-size:16px;">✓</span>
            <span>PATH FOUND</span>
          </div>
          <div class="success-details">
            <div><strong>Vertices visited:</strong> ${m1.path.length} vertices</div>
            <div><strong>Edges used:</strong> ${m1.path.length - 1} edges</div>
            <div style="margin-top:4px;"><strong>Path:</strong> <code>${fullPathStr}</code></div>
          </div>
          <div class="success-concept-box">
            ★ <strong>Graph Theory Takeaway:</strong> A simple path is an alternating sequence of vertices and edges with no repeated vertices. Here, ${m1.path.length} vertices and ${m1.path.length - 1} edges connect Data to Prediction!
          </div>
        </div>
      `;
    }

    let errorNotice = "";
    if (m1.lastError) {
      errorNotice = `<div class="lab-error-notice">⚠ ${m1.lastError}</div>`;
    }

    return `
      <div class="lab-mission-card">
        <div class="mission-meta-row">
          <span class="mission-badge">MISSION 01</span>
          <span class="mission-concept-tag">PATH + VERTICES + EDGES</span>
        </div>
        <h3 class="mission-question">Find a valid path from START to TARGET</h3>
        <div class="mission-guidance-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span><strong>START:</strong> <span class="crumb-node" style="background:#ECFDF5; color:#065F46;">Data (Node #1)</span></span>
            <span style="color:var(--text-muted);">➔</span>
            <span><strong>TARGET:</strong> <span class="crumb-node" style="background:#FEF3C7; color:#92400E;">Prediction</span></span>
          </div>
          <div style="font-size:11.5px; opacity:0.9; margin-top:4px;">
            👉 <strong>Next Step:</strong> Start node <code>Data</code> is glowing green! Click an adjacent node connected to Data (e.g. <strong>Features</strong>, <strong>Training</strong>, or <strong>AI</strong>), then continue until you reach <strong>Prediction</strong>.
          </div>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="panel-chip" id="btn-m1-autopath" style="font-size:11px;">★ Demo Valid Path: Data ➔ Features ➔ Patterns ➔ Prediction</button>
          </div>
        </div>

        <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Current Path:</div>
        <div class="breadcrumbs-container">
          ${crumbsHtml}
        </div>

        ${errorNotice}
        ${successCard}

        <div class="lab-actions-row">
          <div>
            <button class="lab-btn-secondary" id="btn-m1-undo" ${m1.path.length <= 1 ? "disabled style='opacity:0.5; cursor:not-allowed;'" : ""}>Undo Step</button>
            <button class="lab-btn-secondary" id="btn-m1-reset" style="margin-left:6px;">Reset</button>
          </div>
          ${isDone ? `<button class="lab-btn-primary" id="btn-m1-next">Mission 2: Hub ➔</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderLabM2() {
    const m2 = LAB_STATE.m2;
    const isDone = m2.status === "correct";
    const selId = m2.selectedVertex;
    const selNode = selId ? GRAPH.vertices.find((x) => x.id === selId) : null;
    const selDeg = selId ? GRAPH.degree(selId) : 0;

    let feedback = "";
    if (selNode) {
      if (isDone) {
        const nbrLabels = GRAPH.neighbors("data").map((nid) => GRAPH.vertices.find((x) => x.id === nid)?.label).join(", ");
        feedback = `
          <div class="lab-success-card">
            <div class="success-header-row">
              <span style="font-size:16px;">✓</span>
              <span>KNOWLEDGE HUB IDENTIFIED</span>
            </div>
            <div class="success-details">
              <div><strong>Vertex:</strong> ${selNode.label}</div>
              <div><strong>Degree:</strong> ${selDeg} (Uniquely maximal in entire graph)</div>
              <div style="margin-top:4px;"><strong>Connected concepts:</strong> ${nbrLabels}</div>
            </div>
            <div class="success-concept-box">
              ★ <strong>Graph Theory Takeaway:</strong> In Graph Theory, the degree of a vertex deg(v) is the number of incident edges. While AI is visually central with degree 5, Data is the true foundational hub with degree 7!
            </div>
          </div>
        `;
      } else {
        feedback = `
          <div class="lab-error-notice">
            Selected: <strong>${selNode.label}</strong> (Degree: ${selDeg}).
            ${selId === "ai"
              ? "Interesting! AI is visually the center, but has degree 5 — not the highest! Keep looking."
              : "Degree " + selDeg + " is not the highest degree in the AI Mind. Try another node!"}
          </div>
        `;
      }
    }

    return `
      <div class="lab-mission-card">
        <div class="mission-meta-row">
          <span class="mission-badge">MISSION 02</span>
          <span class="mission-concept-tag">VERTEX DEGREE</span>
        </div>
        <h3 class="mission-question">“Which concept is the most connected?”</h3>
        <div class="mission-guidance-box">
          <div>Click any vertex on the graph canvas to inspect its degree.</div>
          <div style="font-size:11.5px; opacity:0.85;">
            Find the true knowledge hub that anchors the most relationships in the network.
          </div>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="panel-chip" id="btn-m2-autohub" style="font-size:11px;">★ Select Data (Degree 7)</button>
          </div>
        </div>

        ${feedback}

        <div class="lab-actions-row">
          <button class="lab-btn-secondary" id="btn-m2-reset">Reset Selection</button>
          ${isDone ? `<button class="lab-btn-primary" id="btn-m2-next">Mission 3: Loop ➔</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderLabM3() {
    const m3 = LAB_STATE.m3;
    const isDone = m3.status === "correct";

    const seqHtml = m3.selectedSequence.length > 0
      ? m3.selectedSequence.map((vid, idx) => {
          const v = GRAPH.vertices.find((x) => x.id === vid);
          const label = v ? v.label : vid;
          return `<span class="crumb-node">${label}</span>` +
            (idx < m3.selectedSequence.length - 1 ? `<span class="crumb-arrow">➔</span>` : "");
        }).join("")
      : `<span style="font-size:11.5px; color:var(--text-muted); font-style:italic;">No vertices selected yet. Click connected nodes to trace a cycle!</span>`;

    let successCard = "";
    if (isDone) {
      const seqStr = m3.selectedSequence.map((id) => GRAPH.vertices.find((x) => x.id === id)?.label).join(" ➔ ");
      const distinctCount = m3.selectedSequence.length - 1;
      successCard = `
        <div class="lab-success-card">
          <div class="success-header-row">
            <span style="font-size:16px;">✓</span>
            <span>CYCLE DETECTED</span>
          </div>
          <div class="success-details">
            <div><strong>Cycle Sequence:</strong> <code>${seqStr}</code></div>
            <div><strong>Vertices:</strong> ${distinctCount} distinct vertices</div>
            <div><strong>Edges:</strong> ${distinctCount} edges</div>
          </div>
          <div class="success-concept-box">
            ★ <strong>Graph Theory Takeaway:</strong> A cycle is a closed walk with at least 3 vertices whose start and end vertices match, with no intermediate vertex or edge repeated. In AI, this represents recursive learning feedback loops!
          </div>
        </div>
      `;
    }

    let errorNotice = "";
    if (m3.lastError) {
      errorNotice = `<div class="lab-error-notice">⚠ ${m3.lastError}</div>`;
    }

    return `
      <div class="lab-mission-card">
        <div class="mission-meta-row">
          <span class="mission-badge">MISSION 03</span>
          <span class="mission-concept-tag">CYCLE & FEEDBACK</span>
        </div>
        <h3 class="mission-question">“There is a hidden cycle inside the AI Mind. Can you find it?”</h3>
        <div class="mission-guidance-box">
          <div>Click connected nodes to trace a path, then click start node to close the loop:</div>
          <div style="display:flex; gap:5px; flex-wrap:wrap; margin-top:3px;">
            <button class="panel-chip" id="btn-m3-hint1" style="font-size:10.5px; padding:2px 7px;">★ Learning Loop (5 nodes)</button>
            <button class="panel-chip" id="btn-m3-hint2" style="font-size:10.5px; padding:2px 7px;">★ Training Triangle (3)</button>
            <button class="panel-chip" id="btn-m3-hint3" style="font-size:10.5px; padding:2px 7px;">★ Language Triangle (3)</button>
          </div>
        </div>

        <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Current Sequence:</div>
        <div class="breadcrumbs-container">
          ${seqHtml}
        </div>

        ${errorNotice}
        ${successCard}

        <div class="lab-actions-row">
          <div>
            <button class="lab-btn-secondary" id="btn-m3-undo" ${m3.selectedSequence.length <= 1 ? "disabled style='opacity:0.5; cursor:not-allowed;'" : ""}>Undo</button>
            <button class="lab-btn-secondary" id="btn-m3-reset" style="margin-left:6px;">Reset</button>
          </div>
          ${isDone ? `<button class="lab-btn-primary" id="btn-m3-next">Mission 4: Subgraph ➔</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderLabM4() {
    const m4 = LAB_STATE.m4;
    const isDone = m4.status === "correct";
    const selectedArr = Array.from(m4.selectedNodes);

    const selectedChips = selectedArr.length > 0
      ? selectedArr.map((vid) => {
          const v = GRAPH.vertices.find((x) => x.id === vid);
          const label = v ? v.label : vid;
          const isVision = ["cv", "image", "objdet", "recognition"].includes(vid);
          return `<span class="crumb-node" style="${isVision ? 'background:#FCE7F3; color:#9D174D; border-color:rgba(157,23,77,0.3);' : 'background:#FEE2E2; color:#991B1B;'}">${label}</span>`;
        }).join(" ")
      : `<span style="font-size:11.5px; color:var(--text-muted); font-style:italic;">Click nodes on the graph canvas to select the Computer Vision cluster (4 vertices total).</span>`;

    let successCard = "";
    if (isDone) {
      const sInfo = GRAPH.inducedSubgraph(["cv", "image", "objdet", "recognition"]);
      successCard = `
        <div class="lab-success-card">
          <div class="success-header-row">
            <span style="font-size:16px;">✓</span>
            <span>SUBGRAPH IDENTIFIED</span>
          </div>
          <div class="success-details">
            <div><strong>Selected Vertices (|V'| = 4):</strong> Computer Vision, Image, Object Detection, Recognition</div>
            <div><strong>Internal Connections (|E'| = 3):</strong> E22 (cv ━ image), E23 (image ━ objdet), E24 (objdet ━ recognition)</div>
            <div style="margin-top:4px;"><strong>Boundary Edges (${sInfo.boundaryEdges.length}):</strong> E2 (ai ━ cv), E25 (recognition ━ knowledge), E26 (image ━ data)</div>
          </div>
          <div class="success-concept-box">
            ★ <strong>Graph Theory Takeaway:</strong> An induced subgraph G[V'] contains subset V' ⊆ V and all edges of G with both endpoints in V'. It is NOT isolated: boundary edges connect it directly to the rest of the AI Mind!
          </div>
        </div>
      `;
    }

    return `
      <div class="lab-mission-card">
        <div class="mission-meta-row">
          <span class="mission-badge">MISSION 04</span>
          <span class="mission-concept-tag">SUBGRAPH + CONNECTIVITY</span>
        </div>
        <h3 class="mission-question">“Identify the Computer Vision subgraph.”</h3>
        <div class="mission-guidance-box">
          <div>Click vertices to toggle them into your subgraph candidate set.</div>
          <div style="font-size:11.5px; opacity:0.85;">
            Select all concepts responsible for visual perception (look for the pink-tinted vision cluster).
          </div>
          <div style="display:flex; gap:6px; margin-top:4px;">
            <button class="panel-chip" id="btn-m4-autoselect" style="font-size:11px;">★ Demo CV Subgraph (4 nodes)</button>
          </div>
        </div>

        <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Selected Vertices (${m4.selectedNodes.size}/4):</div>
        <div class="breadcrumbs-container">
          ${selectedChips}
        </div>

        ${m4.status === "wrong" ? `<div class="lab-error-notice">⚠ Some selected vertices do not belong to Computer Vision. Click to deselect non-vision nodes!</div>` : ""}
        ${successCard}

        <div class="lab-actions-row">
          <button class="lab-btn-secondary" id="btn-m4-clear">Clear Selection</button>
          ${isDone ? `<button class="lab-btn-primary" id="btn-m4-finish">Explore AI Mind Glitch ➔</button>` : ""}
        </div>
      </div>
    `;
  }

  function renderLabGlitch() {
    const isLost = LAB_STATE.glitch.active;

    return `
      <div class="glitch-deck">
        <div class="mission-meta-row">
          <span class="mission-badge" style="background:#FFF1F2; color:#9F1239; border-color:rgba(225,29,72,0.3);">CONNECTIVITY DEMO</span>
          <span class="mission-concept-tag">BRIDGE & CONNECTIVITY</span>
        </div>

        <div class="glitch-status-banner ${isLost ? 'lost' : 'connected'}">
          <span class="glitch-status-text">SYSTEM STATUS: ${isLost ? 'CONNECTION LOST' : 'CONNECTED'}</span>
          ${isLost ? '<span style="font-size:18px;">⚡</span>' : '<span style="font-size:18px;">✓</span>'}
        </div>

        <div style="display:flex; justify-content:center;">
          ${!isLost
            ? `<button class="glitch-trigger-btn" id="btn-glitch-trigger">⚡ REMOVE A CONNECTION</button>`
            : `<button class="glitch-restore-btn" id="btn-glitch-restore">↺ RESTORE CONNECTION</button>`
          }
        </div>

        <div class="glitch-explain-box">
          ${!isLost ? `
            <strong>BEFORE: Connected Knowledge Network</strong>
            <div>Every concept in the main AI Mind (25 vertices) can communicate across continuous paths. Removing an ordinary edge (like inside a cycle) leaves the network connected.</div>
            <div style="font-size:11px; color:var(--text-muted);">Click "Remove a Connection" to test what happens when a critical <strong>bridge edge</strong> is severed.</div>
          ` : `
            <strong style="color:#BE123C; font-size:13px;">“Connection lost.”</strong>
            <div style="font-weight:700; color:#9F1239;">“Removing this edge changes the connectivity of the graph.”</div>
            <div style="margin-top:4px;">
              <strong>AFTER: Broken path / separated section</strong><br>
              Bridge edge <code>E18: Data ━ Dataset</code> was temporarily removed. Because E18 had no alternate cycle path, <strong>Dataset</strong> is now completely disconnected into its own isolated component ($c(G)$ increased from 2 to 3)!
            </div>
            <div class="success-concept-box" style="background:#FFFFFF; border-color:rgba(225,29,72,0.3); color:#9F1239; margin-top:4px;">
              ★ <strong>Graph Theory Takeaway:</strong> An edge e is a <em>bridge</em> if and only if removing it increases the number of connected components. This proves that network robustness depends directly on cycles, not just edge counts!
            </div>
          `}
        </div>
      </div>
    `;
  }

  function renderLabScanner() {
    const isScanning = LAB_STATE.scanner.isScanning;
    const hasScanned = LAB_STATE.scanner.hasScanned;

    const vCount = GRAPH.vertices.length;
    const eCount = GRAPH.edges.length;
    const comps = GRAPH.components();
    const maxDegV = GRAPH.vertices.reduce((max, v) => GRAPH.degree(v.id) > GRAPH.degree(max.id) ? v : max, GRAPH.vertices[0]);
    const pathsCount = Object.keys(GRAPH.featured.paths).length;
    const cyclesCount = Object.keys(GRAPH.featured.cycles).length;
    const subgraphsCount = Object.keys(GRAPH.featured.subgraphs).length;

    return `
      <div class="scanner-deck">
        <div class="mission-meta-row">
          <span class="mission-badge">MATHEMATICAL AUDIT</span>
          <span class="mission-concept-tag">GRAPH THEORY SCANNER</span>
        </div>

        <button class="scanner-btn" id="btn-run-scanner" ${isScanning ? "disabled style='opacity:0.6; cursor:wait;'" : ""}>
          <span>${isScanning ? "SCANNING GRAPH..." : "⚡ SCAN MY AI MIND"}</span>
        </button>

        <div class="scanner-table">
          <div class="scanner-row">
            <span class="scanner-label">VERTICES</span>
            <span class="scanner-val">${vCount} concepts</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">EDGES</span>
            <span class="scanner-val">${eCount} relationships</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">CONNECTED COMPONENTS</span>
            <span class="scanner-val">${comps.length} (${comps[0].vertices.length} in K1, ${comps[1].vertices.length} in K2)</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">HIGHEST DEGREE VERTEX</span>
            <span class="scanner-val">${maxDegV.label} (deg = ${GRAPH.degree(maxDegV.id)})</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">AVAILABLE PATHS</span>
            <span class="scanner-val">${pathsCount} Featured (P1-P3) | 378 node pairs</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">IDENTIFIED CYCLES</span>
            <span class="scanner-val">${cyclesCount} Featured (C1, C2, C3)</span>
          </div>
          <div class="scanner-row">
            <span class="scanner-label">SUBGRAPHS</span>
            <span class="scanner-val">${subgraphsCount} Featured (S1-S4 induced)</span>
          </div>
        </div>

        <div style="font-size:11px; color:var(--text-muted); text-align:center;">
          ${hasScanned ? "✓ Audit complete. All numbers computed directly from <code>graph-data.js</code> via Handshaking & BFS." : "Click 'Scan My AI Mind' to run laser diagnostic."}
        </div>
      </div>
    `;
  }

  function renderLabDiary() {
    return `
      <div class="lab-diary-deck">
        <div class="mission-meta-row">
          <span class="mission-badge" style="background:#FAF5FF; color:#6B21A8; border-color:rgba(107,33,168,0.2);">CREATIVE REFLECTION</span>
          <span class="mission-concept-tag">THE AI MIND SPEAKS</span>
        </div>

        <div class="lab-diary-quote-card">
          <p class="diary-quote-text">“I have many connections, but Data is my heaviest anchor...”</p>
          <div class="diary-quote-action">
            <span style="font-size:11px; color:var(--text-muted);">Concept: Vertex Degree & Hubs</span>
            <button class="diary-demo-btn" data-diary-action="connections">Highlight Hubs</button>
          </div>
        </div>

        <div class="lab-diary-quote-card">
          <p class="diary-quote-text">“I remember paths between ideas: from raw data to predictions...”</p>
          <div class="diary-quote-action">
            <span style="font-size:11px; color:var(--text-muted);">Concept: Traversal Paths</span>
            <button class="diary-demo-btn" data-diary-action="paths">Trace Path (P1)</button>
          </div>
        </div>

        <div class="lab-diary-quote-card">
          <p class="diary-quote-text">“Sometimes one broken connection separates part of me...”</p>
          <div class="diary-quote-action">
            <span style="font-size:11px; color:var(--text-muted);">Concept: Connectivity & Bridges</span>
            <button class="diary-demo-btn" data-diary-action="glitch">Demonstrate Glitch</button>
          </div>
        </div>

        <div class="lab-diary-quote-card">
          <p class="diary-quote-text">“A loop keeps me improving through feedback: my predictions become new experience...”</p>
          <div class="diary-quote-action">
            <span style="font-size:11px; color:var(--text-muted);">Concept: Cycle C1 (Feedback Loop)</span>
            <button class="diary-demo-btn" data-diary-action="loops">Trace Loop (C1)</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderLabExaminer() {
    const activeDemo = LAB_STATE.examiner.activeDemo;
    const caption = LAB_STATE.examiner.caption || "Click any concept button above for an instant oral explanation demonstration during the viva presentation.";

    return `
      <div class="examiner-deck">
        <div class="mission-meta-row">
          <span class="mission-badge" style="background:#FFFBEB; color:#92400E; border-color:rgba(217,119,6,0.3);">EXAMINER QUICK DEMO</span>
          <span class="mission-concept-tag">ORAL PRESENTATION MODE</span>
        </div>

        <div class="examiner-grid">
          <button class="examiner-demo-btn ${activeDemo === 'degree' ? 'active' : ''}" data-examiner-demo="degree">• Show Degree</button>
          <button class="examiner-demo-btn ${activeDemo === 'path' ? 'active' : ''}" data-examiner-demo="path">• Show Path</button>
          <button class="examiner-demo-btn ${activeDemo === 'cycle' ? 'active' : ''}" data-examiner-demo="cycle">• Show Cycle</button>
          <button class="examiner-demo-btn ${activeDemo === 'connectivity' ? 'active' : ''}" data-examiner-demo="connectivity">• Show Connectivity</button>
          <button class="examiner-demo-btn ${activeDemo === 'subgraph' ? 'active' : ''}" data-examiner-demo="subgraph">• Show Subgraph</button>
          <button class="examiner-demo-btn ${activeDemo === 'component' ? 'active' : ''}" data-examiner-demo="component">• Show Component</button>
          <button class="examiner-demo-btn ${activeDemo === 'dijkstra' ? 'active' : ''}" data-examiner-demo="dijkstra">⚡ Dijkstra Shortest Path</button>
          <button class="examiner-demo-btn ${activeDemo === 'floyd' ? 'active' : ''}" data-examiner-demo="floyd">⚡ Floyd All-Pairs (Diam=5)</button>
          <button class="examiner-demo-btn ${activeDemo === 'vertexColoring' ? 'active' : ''}" data-examiner-demo="vertexColoring">⚡ Vertex 3-Coloring (χ=3)</button>
          <button class="examiner-demo-btn ${activeDemo === 'edgeColoring' ? 'active' : ''}" data-examiner-demo="edgeColoring">⚡ Edge 7-Coloring (χ'=7)</button>
          <button class="examiner-demo-btn ${activeDemo === 'eulerian' ? 'active' : ''}" data-examiner-demo="eulerian">⚡ Eulerian Impossibility</button>
          <button class="examiner-demo-btn ${activeDemo === 'hamiltonian' ? 'active' : ''}" data-examiner-demo="hamiltonian">⚡ Hamiltonian Cut-Set</button>
          <button class="examiner-demo-btn ${activeDemo === 'planar' ? 'active' : ''}" data-examiner-demo="planar">⚡ Planar & Euler (V-E+R=2)</button>
          <button class="examiner-demo-btn ${activeDemo === 'walks' ? 'active' : ''}" data-examiner-demo="walks">⚡ Walk vs Trail vs Path</button>
        </div>

        <div class="examiner-caption-box" id="examiner-caption">
          ${caption}
        </div>
      </div>
    `;
  }

  function wireLabTabControls() {
    const btnM1Undo = document.getElementById("btn-m1-undo");
    if (btnM1Undo) {
      btnM1Undo.addEventListener("click", () => {
        if (LAB_STATE.m1.path.length > 1) {
          LAB_STATE.m1.path.pop();
          LAB_STATE.m1.status = "in_progress";
          LAB_STATE.m1.lastError = "";
          renderLabHUD();
          applyLabGraphVisuals();
        }
      });
    }

    const btnM1Reset = document.getElementById("btn-m1-reset");
    if (btnM1Reset) {
      btnM1Reset.addEventListener("click", () => {
        LAB_STATE.m1.path = ["data"];
        LAB_STATE.m1.status = "idle";
        LAB_STATE.m1.lastError = "";
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM1Auto = document.getElementById("btn-m1-autopath");
    if (btnM1Auto) {
      btnM1Auto.addEventListener("click", () => {
        LAB_STATE.m1.path = ["data", "features", "patterns", "prediction"];
        LAB_STATE.m1.status = "success";
        LAB_STATE.m1.lastError = "";
        if (!LAB_STATE.completedMissions.has("m1")) {
          LAB_STATE.completedMissions.add("m1");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM1Next = document.getElementById("btn-m1-next");
    if (btnM1Next) {
      btnM1Next.addEventListener("click", () => setLabTab("m2"));
    }

    const btnM2Auto = document.getElementById("btn-m2-autohub");
    if (btnM2Auto) {
      btnM2Auto.addEventListener("click", () => {
        LAB_STATE.m2.selectedVertex = "data";
        LAB_STATE.m2.status = "correct";
        if (!LAB_STATE.completedMissions.has("m2")) {
          LAB_STATE.completedMissions.add("m2");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM2Reset = document.getElementById("btn-m2-reset");
    if (btnM2Reset) {
      btnM2Reset.addEventListener("click", () => {
        LAB_STATE.m2.selectedVertex = null;
        LAB_STATE.m2.status = "idle";
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM2Next = document.getElementById("btn-m2-next");
    if (btnM2Next) {
      btnM2Next.addEventListener("click", () => setLabTab("m3"));
    }

    const btnM3Undo = document.getElementById("btn-m3-undo");
    if (btnM3Undo) {
      btnM3Undo.addEventListener("click", () => {
        if (LAB_STATE.m3.selectedSequence.length > 0) {
          LAB_STATE.m3.selectedSequence.pop();
          LAB_STATE.m3.status = "in_progress";
          LAB_STATE.m3.lastError = "";
          renderLabHUD();
          applyLabGraphVisuals();
        }
      });
    }

    const btnM3Reset = document.getElementById("btn-m3-reset");
    if (btnM3Reset) {
      btnM3Reset.addEventListener("click", () => {
        LAB_STATE.m3.selectedSequence = [];
        LAB_STATE.m3.status = "idle";
        LAB_STATE.m3.lastError = "";
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM3Hint1 = document.getElementById("btn-m3-hint1");
    if (btnM3Hint1) {
      btnM3Hint1.addEventListener("click", () => {
        LAB_STATE.m3.selectedSequence = ["data", "training", "model", "prediction", "feedback", "data"];
        LAB_STATE.m3.status = "correct";
        LAB_STATE.m3.lastError = "";
        if (!LAB_STATE.completedMissions.has("m3")) {
          LAB_STATE.completedMissions.add("m3");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM3Hint2 = document.getElementById("btn-m3-hint2");
    if (btnM3Hint2) {
      btnM3Hint2.addEventListener("click", () => {
        LAB_STATE.m3.selectedSequence = ["training", "model", "nn", "training"];
        LAB_STATE.m3.status = "correct";
        LAB_STATE.m3.lastError = "";
        if (!LAB_STATE.completedMissions.has("m3")) {
          LAB_STATE.completedMissions.add("m3");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM3Hint3 = document.getElementById("btn-m3-hint3");
    if (btnM3Hint3) {
      btnM3Hint3.addEventListener("click", () => {
        LAB_STATE.m3.selectedSequence = ["language", "words", "text", "language"];
        LAB_STATE.m3.status = "correct";
        LAB_STATE.m3.lastError = "";
        if (!LAB_STATE.completedMissions.has("m3")) {
          LAB_STATE.completedMissions.add("m3");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM3Next = document.getElementById("btn-m3-next");
    if (btnM3Next) {
      btnM3Next.addEventListener("click", () => setLabTab("m4"));
    }

    const btnM4Clear = document.getElementById("btn-m4-clear");
    if (btnM4Clear) {
      btnM4Clear.addEventListener("click", () => {
        LAB_STATE.m4.selectedNodes.clear();
        LAB_STATE.m4.status = "idle";
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM4Auto = document.getElementById("btn-m4-autoselect");
    if (btnM4Auto) {
      btnM4Auto.addEventListener("click", () => {
        LAB_STATE.m4.selectedNodes = new Set(["cv", "image", "objdet", "recognition"]);
        LAB_STATE.m4.status = "correct";
        if (!LAB_STATE.completedMissions.has("m4")) {
          LAB_STATE.completedMissions.add("m4");
          updateScore();
        }
        renderLabHUD();
        applyLabGraphVisuals();
      });
    }

    const btnM4Finish = document.getElementById("btn-m4-finish");
    if (btnM4Finish) {
      btnM4Finish.addEventListener("click", () => setLabTab("glitch"));
    }

    const btnGlitchTrigger = document.getElementById("btn-glitch-trigger");
    if (btnGlitchTrigger) {
      btnGlitchTrigger.addEventListener("click", triggerGlitch);
    }

    const btnGlitchRestore = document.getElementById("btn-glitch-restore");
    if (btnGlitchRestore) {
      btnGlitchRestore.addEventListener("click", restoreGlitch);
    }

    const btnRunScanner = document.getElementById("btn-run-scanner");
    if (btnRunScanner) {
      btnRunScanner.addEventListener("click", runGraphScanner);
    }

    document.querySelectorAll(".diary-demo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-diary-action");
        runDiaryDemo(action);
      });
    });

    document.querySelectorAll(".examiner-demo-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const demoKey = btn.getAttribute("data-examiner-demo");
        runExaminerDemo(demoKey);
      });
    });
  }

  function triggerGlitch() {
    LAB_STATE.glitch.active = true;
    renderLabHUD();
    applyLabGraphVisuals();
    if (threeEngine) {
      threeEngine.triggerGlitch3D(true, "E18");
    }
  }

  function restoreGlitch() {
    LAB_STATE.glitch.active = false;
    renderLabHUD();
    applyLabGraphVisuals();
    if (threeEngine) {
      threeEngine.triggerGlitch3D(false, "E18");
    }
  }

  function runGraphScanner() {
    if (LAB_STATE.scanner.isScanning) return;
    LAB_STATE.scanner.isScanning = true;
    renderLabHUD();

    if (threeEngine) {
      threeEngine.triggerScanner3D();
    }

    const laser = document.getElementById("scanner-laser-line");
    if (laser) {
      laser.style.display = "block";
      laser.setAttribute("y1", "0");
      laser.setAttribute("y2", "0");

      let start = null;
      const duration = 1200;

      function stepLaser(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const y = progress * 1000;
        laser.setAttribute("y1", y.toFixed(0));
        laser.setAttribute("y2", y.toFixed(0));

        if (progress < 1) {
          requestAnimationFrame(stepLaser);
        } else {
          laser.style.display = "none";
          LAB_STATE.scanner.isScanning = false;
          LAB_STATE.scanner.hasScanned = true;
          renderLabHUD();
        }
      }
      requestAnimationFrame(stepLaser);
    } else {
      LAB_STATE.scanner.isScanning = false;
      LAB_STATE.scanner.hasScanned = true;
      renderLabHUD();
    }
  }

  function runDiaryDemo(quoteKey) {
    nodeDOMElements.forEach(({ group }) => {
      group.classList.remove("dimmed", "lab-start", "lab-target", "lab-correct", "lab-incorrect", "lab-selected");
    });
    edgeDOMElements.forEach(({ line, group }) => {
      group.classList.remove("dimmed");
      line.className.baseVal = "edge-line";
    });
    layerOverlays.innerHTML = "";

    switch (quoteKey) {
      case "connections": {
        const hubs = new Set(["data", "ai", "ml", "prediction"]);
        nodeDOMElements.forEach(({ group, data }) => {
          if (hubs.has(data.id)) {
            group.classList.add("lab-correct");
          } else {
            group.classList.add("dimmed");
          }
        });
        break;
      }
      case "paths": {
        const p1 = ["data", "features", "patterns", "prediction"];
        dimAllExcept(p1);
        p1.forEach((vid) => {
          nodeDOMElements.get(vid)?.group.classList.add("lab-correct");
        });
        for (let i = 0; i < p1.length - 1; i++) {
          const edge = GRAPH.edges.find((e) => (e.a === p1[i] && e.b === p1[i + 1]) || (e.a === p1[i + 1] && e.b === p1[i]));
          if (edge) {
            const el = edgeDOMElements.get(edge.id);
            if (el) {
              el.line.className.baseVal = "edge-line path-flow";
              el.group.classList.remove("dimmed");
            }
          }
        }
        break;
      }
      case "glitch": {
        triggerGlitch();
        break;
      }
      case "loops": {
        const c1 = ["data", "training", "model", "prediction", "feedback", "data"];
        const unique = c1.slice(0, -1);
        dimAllExcept(unique);
        unique.forEach((vid) => {
          nodeDOMElements.get(vid)?.group.classList.add("lab-correct");
        });
        for (let i = 0; i < c1.length - 1; i++) {
          const edge = GRAPH.edges.find((e) => (e.a === c1[i] && e.b === c1[i + 1]) || (e.a === c1[i + 1] && e.b === c1[i]));
          if (edge) {
            const el = edgeDOMElements.get(edge.id);
            if (el) {
              el.line.className.baseVal = "edge-line cycle-flow";
              el.group.classList.remove("dimmed");
            }
          }
        }
        break;
      }
    }
  /**
   * Synchronize 2D SVG graph visuals with advanced discrete math modes
   */
  function applyAdvancedVisuals2D(type, data = {}) {
    layerOverlays.innerHTML = "";
    nodeDOMElements.forEach(({ circle, group, degreeBadge, halo, data: v }) => {
      group.classList.remove("dimmed", "lab-correct", "lab-incorrect", "lab-selected", "node-pulse");
      halo.style.opacity = "0";
      degreeBadge.setAttribute("display", "none");
      const baseR = v.id === "ai" ? 28 : 16;
      circle.setAttribute("r", baseR);
      circle.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
      circle.setAttribute("stroke-width", "2.2");
      circle.setAttribute("fill", `url(#sphere-${v.domain})`);
    });

    edgeDOMElements.forEach(({ line, group }) => {
      group.classList.remove("dimmed");
      line.className.baseVal = "edge-line";
      line.style.stroke = "";
      line.style.strokeWidth = "";
      line.style.opacity = "";
    });

    if (type === "dijkstra") {
      const path = data.path || [];
      if (path.length === 0) return;
      const pathSet = new Set(path);

      nodeDOMElements.forEach(({ group, data: v }) => {
        if (!pathSet.has(v.id)) {
          group.classList.add("dimmed");
        } else {
          group.classList.add("lab-correct");
        }
      });

      path.forEach((vid, idx) => {
        const pos = NODE_POSITIONS[vid];
        if (pos) {
          const badgeGroup = createSVG("g", { transform: `translate(${pos.x + 14}, ${pos.y - 14})` });
          const badgeCircle = createSVG("circle", { r: 10, fill: "#ECFDF5", stroke: "#059669", "stroke-width": "2" });
          const badgeText = createSVG("text", { class: "order-text", y: 1, fill: "#047857" });
          badgeText.textContent = String(idx + 1);
          badgeGroup.appendChild(badgeCircle);
          badgeGroup.appendChild(badgeText);
          layerOverlays.appendChild(badgeGroup);
        }
      });

      edgeDOMElements.forEach(({ group }) => group.classList.add("dimmed"));
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
        if (edge) {
          const el = edgeDOMElements.get(edge.id);
          if (el) {
            el.line.className.baseVal = "edge-line path-flow";
            el.group.classList.remove("dimmed");
          }
        }
      }
    } else if (type === "vertexColoring") {
      const colors = data.colors || {};
      const palette = {
        1: "#06B6D4",
        2: "#10B981",
        3: "#F59E0B",
        4: "#EF4444"
      };
      nodeDOMElements.forEach(({ circle, data: v }) => {
        const c = colors[v.id] || 1;
        circle.setAttribute("fill", palette[c] || "#10B981");
        circle.setAttribute("stroke", "#FFFFFF");
        circle.setAttribute("stroke-width", "3");
      });
      edgeDOMElements.forEach(({ line }) => {
        line.style.opacity = "0.35";
      });
      if (data.improper) {
        const n1 = nodeDOMElements.get("ai");
        const n2 = nodeDOMElements.get("data");
        if (n1 && n2) {
          n1.circle.setAttribute("fill", "#EF4444");
          n2.circle.setAttribute("fill", "#EF4444");
          n1.group.classList.add("node-pulse");
          n2.group.classList.add("node-pulse");
        }
      }
    } else if (type === "edgeColoring") {
      const edgeColors = data.edgeColors || {};
      const palette = {
        1: "#06B6D4",
        2: "#10B981",
        3: "#F59E0B",
        4: "#EC4899",
        5: "#8B5CF6",
        6: "#3B82F6",
        7: "#EF4444"
      };
      nodeDOMElements.forEach(({ group }) => {
        group.classList.add("dimmed");
      });
      edgeDOMElements.forEach(({ line, data: e }) => {
        const c = edgeColors[e.id] || 1;
        line.style.stroke = palette[c] || "#10B981";
        line.style.strokeWidth = "3.8px";
        line.style.opacity = "1";
      });
    } else if (type === "eulerian") {
      const oddVertices = data.oddVertices || [];
      const oddSet = new Set(oddVertices.map((v) => (typeof v === "string" ? v : v.id)));
      nodeDOMElements.forEach(({ circle, group, degreeBadge, data: v }) => {
        if (oddSet.has(v.id)) {
          circle.setAttribute("fill", "#FFE4E6");
          circle.setAttribute("stroke", "#E11D48");
          circle.setAttribute("stroke-width", "3.5");
          circle.setAttribute("r", 20);
          degreeBadge.setAttribute("display", "block");
          group.classList.add("node-pulse");
        } else {
          group.classList.add("dimmed");
        }
      });
      edgeDOMElements.forEach(({ line }) => {
        line.style.opacity = "0.25";
      });
    } else if (type === "hamiltonian") {
      nodeDOMElements.forEach(({ circle, group, data: v }) => {
        if (v.id === "data") {
          circle.setAttribute("fill", "#F59E0B");
          circle.setAttribute("stroke", "#B45309");
          circle.setAttribute("stroke-width", "4");
          circle.setAttribute("r", 34);
          group.classList.add("node-pulse");
        } else if (v.id === "dataset") {
          circle.setAttribute("fill", "#FFE4E6");
          circle.setAttribute("stroke", "#E11D48");
          circle.setAttribute("stroke-width", "3.5");
          group.classList.add("lab-incorrect");
        } else {
          group.classList.add("dimmed");
        }
      });
      edgeDOMElements.forEach(({ line, group, data: e }) => {
        if (e.id === "E18") {
          line.className.baseVal = "edge-line lab-glitch";
          line.style.stroke = "#E11D48";
          line.style.strokeWidth = "4px";
        } else {
          group.classList.add("dimmed");
        }
      });
    } else if (type === "planar") {
      nodeDOMElements.forEach(({ circle, group, data: v }) => {
        if (v.domain !== "special") {
          circle.setAttribute("stroke", "#06B6D4");
          circle.setAttribute("stroke-width", "3");
        } else {
          group.classList.add("dimmed");
        }
      });
      edgeDOMElements.forEach(({ line }) => {
        line.style.stroke = "#10B981";
        line.style.strokeWidth = "2.8px";
        line.style.opacity = "0.9";
      });
    } else if (type === "walks") {
      const seq = data.sequence || [];
      if (seq.length === 0) return;
      const seqSet = new Set(seq);
      nodeDOMElements.forEach(({ group, data: v }) => {
        if (!seqSet.has(v.id)) {
          group.classList.add("dimmed");
        } else {
          group.classList.add("lab-correct");
        }
      });
      seq.forEach((vid, idx) => {
        const pos = NODE_POSITIONS[vid];
        if (pos) {
          const badgeGroup = createSVG("g", { transform: `translate(${pos.x + 14}, ${pos.y - 14})` });
          const badgeCircle = createSVG("circle", { r: 10, fill: "#EFF6FF", stroke: "#2563EB", "stroke-width": "2" });
          const badgeText = createSVG("text", { class: "order-text", y: 1, fill: "#1D4ED8" });
          badgeText.textContent = String(idx + 1);
          badgeGroup.appendChild(badgeCircle);
          badgeGroup.appendChild(badgeText);
          layerOverlays.appendChild(badgeGroup);
        }
      });
      edgeDOMElements.forEach(({ group }) => group.classList.add("dimmed"));
      for (let i = 0; i < seq.length - 1; i++) {
        const u = seq[i];
        const v = seq[i + 1];
        const edge = GRAPH.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
        if (edge) {
          const el = edgeDOMElements.get(edge.id);
          if (el) {
            el.line.className.baseVal = "edge-line path-flow";
            el.group.classList.remove("dimmed");
          }
        }
      }
    }
  }

  function runExaminerDemo(demoKey) {
    LAB_STATE.examiner.activeDemo = demoKey;

    nodeDOMElements.forEach(({ circle, shadow, gloss, bounce, halo, degreeBadge, group, data }) => {
      group.classList.remove("dimmed", "node-pulse", "lab-start", "lab-target", "lab-correct", "lab-incorrect", "lab-selected");
      halo.style.opacity = "0";
      degreeBadge.setAttribute("display", "none");
      const r = data.id === "ai" ? 28 : 16;
      circle.setAttribute("r", r);
      circle.setAttribute("stroke", "rgba(255, 255, 255, 0.85)");
      circle.setAttribute("stroke-width", "2.2");
    });

    edgeDOMElements.forEach(({ line, group }) => {
      group.classList.remove("dimmed");
      line.className.baseVal = "edge-line";
      line.style.display = "block";
    });

    layerOverlays.innerHTML = "";
    layerFrames.innerHTML = "";
    layerSubgraphs.innerHTML = "";

    let captionText = "";

    switch (demoKey) {
      case "degree": {
        nodeDOMElements.forEach(({ circle, degreeBadge, group, data }) => {
          const deg = GRAPH.degree(data.id);
          const scaledR = 10 + deg * 3.4;
          circle.setAttribute("r", scaledR);
          degreeBadge.setAttribute("display", "block");
          if (data.id === "data") {
            group.classList.add("lab-correct", "node-pulse");
          }
        });
        captionText = `<strong>• Vertex Degree:</strong> deg(v) = count of incident edges. Handshaking Lemma: Σ deg(v) = 2|E| = 78. <strong>Data</strong> has the highest degree (7) in the AI Mind; AI has degree 5.`;
        break;
      }

      case "path": {
        const p1 = ["data", "features", "patterns", "prediction"];
        dimAllExcept(p1);
        p1.forEach((vid, idx) => {
          nodeDOMElements.get(vid)?.group.classList.add("lab-correct");
          const pos = NODE_POSITIONS[vid];
          if (pos) {
            const badgeGroup = createSVG("g", { transform: `translate(${pos.x + 14}, ${pos.y - 14})` });
            const badgeCircle = createSVG("circle", { r: 10, class: "order-badge", fill: "#ECFDF5", stroke: "#059669", "stroke-width": "2" });
            const badgeText = createSVG("text", { class: "order-text", y: 1, fill: "#047857" });
            badgeText.textContent = String(idx + 1);
            badgeGroup.appendChild(badgeCircle);
            badgeGroup.appendChild(badgeText);
            layerOverlays.appendChild(badgeGroup);
          }
        });
        for (let i = 0; i < p1.length - 1; i++) {
          const edge = GRAPH.edges.find((e) => (e.a === p1[i] && e.b === p1[i + 1]) || (e.a === p1[i + 1] && e.b === p1[i]));
          if (edge) {
            const el = edgeDOMElements.get(edge.id);
            if (el) {
              el.line.className.baseVal = "edge-line path-flow";
              el.group.classList.remove("dimmed");
            }
          }
        }
        captionText = `<strong>• Path:</strong> Alternating sequence of distinct vertices and edges. Path P1 (Learning Path: Data ➔ Prediction) uses 4 vertices and 3 edges.`;
        break;
      }

      case "cycle": {
        const c1 = ["data", "training", "model", "prediction", "feedback", "data"];
        const unique = c1.slice(0, -1);
        dimAllExcept(unique);
        unique.forEach((vid) => {
          nodeDOMElements.get(vid)?.group.classList.add("lab-correct");
        });
        for (let i = 0; i < c1.length - 1; i++) {
          const edge = GRAPH.edges.find((e) => (e.a === c1[i] && e.b === c1[i + 1]) || (e.a === c1[i + 1] && e.b === c1[i]));
          if (edge) {
            const el = edgeDOMElements.get(edge.id);
            if (el) {
              el.line.className.baseVal = "edge-line cycle-flow";
              el.group.classList.remove("dimmed");
            }
          }
        }
        captionText = `<strong>• Cycle:</strong> A closed walk where start equals end and no intermediate vertex repeats. Cycle C1 is a 5-cycle modeling the feedback loop from Prediction back to Data.`;
        break;
      }

      case "connectivity": {
        const cvNode = nodeDOMElements.get("data");
        const brEdge = edgeDOMElements.get("E18");
        const dsNode = nodeDOMElements.get("dataset");
        if (cvNode) cvNode.group.classList.add("lab-correct", "node-pulse");
        if (brEdge) brEdge.line.className.baseVal = "edge-line lab-glitch";
        if (dsNode) dsNode.group.classList.add("lab-incorrect");
        captionText = `<strong>• Connectivity:</strong> Cut Vertex (Data) and Bridge (E18: Data ━ Dataset). Removing either breaks component K1, isolating Dataset and increasing c(G) from 2 to 3.`;
        break;
      }

      case "subgraph": {
        const s2Nodes = new Set(["cv", "image", "objdet", "recognition"]);
        nodeDOMElements.forEach(({ group, data }) => {
          if (s2Nodes.has(data.id)) {
            group.classList.add("lab-correct");
          } else {
            group.classList.add("dimmed");
          }
        });
        edgeDOMElements.forEach(({ line, group, data }) => {
          if (s2Nodes.has(data.a) && s2Nodes.has(data.b)) {
            line.className.baseVal = "edge-line subgraph-internal";
            group.classList.remove("dimmed");
          } else if (s2Nodes.has(data.a) || s2Nodes.has(data.b)) {
            line.className.baseVal = "edge-line subgraph-boundary";
            group.classList.remove("dimmed");
          } else {
            group.classList.add("dimmed");
          }
        });
        captionText = `<strong>• Induced Subgraph:</strong> S2 (Computer Vision) contains 4 vertices, 3 internal edges, and 3 boundary edges. Boundary edges prove a subgraph is not disconnected from the graph.`;
        break;
      }

      case "component": {
        drawSpecializedFrame();
        const comps = GRAPH.components();
        comps.forEach((comp, idx) => {
          const color = idx === 0 ? "#059669" : "#7C3AED";
          comp.vertices.forEach((vid) => {
            const el = nodeDOMElements.get(vid);
            if (el) {
              el.circle.setAttribute("stroke", color);
              el.circle.setAttribute("stroke-width", "3");
            }
          });
        });
        captionText = `<strong>• Connected Components:</strong> c(G) = 2. Component K1 (Main AI Mind) has 25 vertices; Component K2 (Specialized Chess Cluster) has 3 vertices with zero paths between them.`;
        break;
      }

      case "dijkstra": {
        const dijk = GRAPH.dijkstra("data", "objdet");
        applyAdvancedVisuals2D("dijkstra", { path: dijk.path });
        captionText = `<strong>⚡ Dijkstra's Algorithm:</strong> Greedy relaxation finding optimal path from Data to Object Detection: <strong>${dijk.path.join(" ➔ ")}</strong> (Distance = ${dijk.distance}, Edges = ${dijk.path.length - 1}).`;
        break;
      }

      case "floyd": {
        const fw = GRAPH.floydWarshall();
        applyAdvancedVisuals2D("dijkstra", { path: fw.centers });
        captionText = `<strong>⚡ Floyd-Warshall All-Pairs:</strong> Dynamic programming: d_ij^(k) = min(d_ij, d_ik + d_kj). Component K1 Diameter = <strong>${fw.diameter}</strong>, Radius = <strong>${fw.radius}</strong>, Center Vertices = <strong>['${fw.centers.join("', '")}']</strong>.`;
        break;
      }

      case "vertexColoring": {
        const vc = GRAPH.vertexColoring();
        applyAdvancedVisuals2D("vertexColoring", { colors: vc.colors });
        captionText = `<strong>⚡ Vertex Coloring & Welsh-Powell:</strong> Chromatic Number <strong>χ(G) = ${vc.chromaticNumber}</strong> (bounded below by triangles C2, C3). 28 vertices properly colored into 3 independent sets (11 Cyan, 13 Emerald, 4 Amber). Zero adjacent color conflicts.`;
        break;
      }

      case "edgeColoring": {
        const ec = GRAPH.edgeColoring();
        applyAdvancedVisuals2D("edgeColoring", { edgeColors: ec.edgeColors });
        captionText = `<strong>⚡ Edge Coloring & Vizing's Theorem:</strong> Chromatic Index <strong>χ'(G) = Δ(G) = ${ec.chromaticIndex}</strong> (Class 1 Graph). All 39 edges colored in 7 distinct conflict-free classes.`;
        break;
      }

      case "eulerian": {
        const ea = GRAPH.eulerianAnalysis();
        applyAdvancedVisuals2D("eulerian", { oddVertices: ea.oddVertices });
        captionText = `<strong>⚡ Eulerian Impossibility:</strong> Euler's Theorem requires 0 odd-degree vertices for a circuit, 0 or 2 for a trail. AI Mind has exactly <strong>${ea.oddDegreeCount} odd-degree vertices</strong> (highlighted in red) ⟹ Eulerian Circuit & Path are strictly IMPOSSIBLE.`;
        break;
      }

      case "hamiltonian": {
        const ha = GRAPH.hamiltonianAnalysis();
        applyAdvancedVisuals2D("hamiltonian");
        captionText = `<strong>⚡ Hamiltonian Impossibility:</strong> Dirac's condition fails (min degree δ=1 < 14). Cut-set theorem fails: removing S={Data} (|S|=1) splits G into 3 components (c(G-S)=3 > |S|=1), strictly proving no Hamiltonian cycle exists.`;
        break;
      }

      case "planar": {
        const pa = GRAPH.planarAnalysis(NODE_POSITIONS);
        applyAdvancedVisuals2D("planar");
        captionText = `<strong>⚡ Planar Graphs & Euler's Formula:</strong> V - E + R = 1 + c. For connected K1: 25 - 37 + 14 = 2 (<strong>R = ${pa.regions} regions</strong>). Region Degree Sum: Σ deg(R_i) = 2|E| = <strong>${pa.regionDegreeSum}</strong>. Thickness θ(G) ≤ ${pa.thicknessUpperBound}.`;
        break;
      }

      case "walks": {
        const seq = ["data", "features", "patterns", "data", "ml", "data"];
        const cl = GRAPH.classifySequence(seq);
        applyAdvancedVisuals2D("walks", { sequence: seq });
        captionText = `<strong>⚡ Walk vs Trail vs Path:</strong> Walk allows repeated vertices & edges. Trail forbids repeated edges (visits Data multiple times). Path forbids any repeated vertices. Sequence tested is a <strong>${cl.classification}</strong> (Length ${cl.length}).`;
        break;
      }
    }

    if (threeEngine) {
      switch (demoKey) {
        case "degree":
          threeEngine.setModeVisuals("degree");
          break;
        case "path": {
          const p1 = ["data", "features", "patterns", "prediction"];
          const edges = [];
          for (let i = 0; i < p1.length - 1; i++) {
            const e = GRAPH.edges.find((x) => (x.a === p1[i] && x.b === p1[i + 1]) || (x.a === p1[i + 1] && x.b === p1[i]));
            if (e) edges.push(e.id);
          }
          threeEngine.setModeVisuals("path", { pathVertices: p1, pathEdges: edges });
          break;
        }
        case "cycle": {
          const c1 = ["data", "training", "model", "prediction", "feedback", "data"];
          const edges = [];
          for (let i = 0; i < c1.length - 1; i++) {
            const e = GRAPH.edges.find((x) => (x.a === c1[i] && x.b === c1[i + 1]) || (x.a === c1[i + 1] && x.b === c1[i]));
            if (e) edges.push(e.id);
          }
          threeEngine.setModeVisuals("cycle", { cycleVertices: c1, cycleEdges: edges });
          break;
        }
        case "connectivity": {
          const comps = GRAPH.components(["data"], []);
          threeEngine.setModeVisuals("component", { removedVertices: ["data"], removedEdges: [], components: comps });
          break;
        }
        case "subgraph": {
          const s2 = GRAPH.featured.subgraphs["S2"];
          threeEngine.setModeVisuals("subgraph", { subgraphNodes: s2.vertices, subgraphEdges: s2.edges });
          break;
        }
        case "component": {
          const comps = GRAPH.components([], []);
          threeEngine.setModeVisuals("component", { removedVertices: [], removedEdges: [], components: comps });
          break;
        }
        case "dijkstra": {
          const dijk = GRAPH.dijkstra("data", "objdet");
          threeEngine.setModeVisuals("dijkstra", { path: dijk.path });
          break;
        }
        case "floyd": {
          const fw = GRAPH.floydWarshall();
          threeEngine.setModeVisuals("dijkstra", { path: fw.centers });
          break;
        }
        case "vertexColoring": {
          const vc = GRAPH.vertexColoring();
          threeEngine.setModeVisuals("vertexColoring", { colors: vc.colors });
          break;
        }
        case "edgeColoring": {
          const ec = GRAPH.edgeColoring();
          threeEngine.setModeVisuals("edgeColoring", { edgeColors: ec.edgeColors });
          break;
        }
        case "eulerian": {
          const ea = GRAPH.eulerianAnalysis();
          threeEngine.setModeVisuals("eulerian", { oddVertices: ea.oddVertices });
          break;
        }
        case "hamiltonian": {
          threeEngine.setModeVisuals("hamiltonian");
          break;
        }
        case "planar": {
          threeEngine.setModeVisuals("planar");
          break;
        }
        case "walks": {
          const seq = ["data", "features", "patterns", "data", "ml", "data"];
          threeEngine.setModeVisuals("dijkstra", { path: seq });
          break;
        }
      }
    }

    LAB_STATE.examiner.caption = captionText;
    renderLabHUD();
  }

  function dimAllExcept(activeVertexIds) {
    const actSet = new Set(activeVertexIds);
    nodeDOMElements.forEach(({ group, data }) => {
      if (actSet.has(data.id)) {
        group.classList.remove("dimmed");
      } else {
        group.classList.add("dimmed");
      }
    });

    edgeDOMElements.forEach(({ group, data }) => {
      if (actSet.has(data.a) && actSet.has(data.b)) {
        group.classList.remove("dimmed");
      } else {
        group.classList.add("dimmed");
      }
    });
  }

  /**
   * Selection Highlights on graph
   */
  function highlightGraphElements() {
    if (!STATE.selectedElement) {
      if (STATE.mode === "normal") {
        if (STATE.currentDomainFilter && STATE.currentDomainFilter !== "all") {
          nodeDOMElements.forEach(({ group, halo, data }) => {
            if (data.domain === STATE.currentDomainFilter) {
              group.classList.remove("dimmed");
              halo.style.opacity = "0.7";
            } else {
              group.classList.add("dimmed");
              halo.style.opacity = "0";
            }
          });
          edgeDOMElements.forEach(({ line, group, data }) => {
            const vA = GRAPH.vertex(data.a);
            const vB = GRAPH.vertex(data.b);
            if (vA && vB && vA.domain === STATE.currentDomainFilter && vB.domain === STATE.currentDomainFilter) {
              group.classList.remove("dimmed");
              line.className.baseVal = "edge-line highlighted";
            } else {
              group.classList.add("dimmed");
              line.className.baseVal = "edge-line";
            }
          });
          return;
        }

        nodeDOMElements.forEach(({ group, halo }) => {
          group.classList.remove("dimmed");
          halo.style.opacity = "0";
        });
        edgeDOMElements.forEach(({ line, group }) => {
          group.classList.remove("dimmed");
          line.className.baseVal = "edge-line";
        });
      }
      return;
    }

    const { type, id } = STATE.selectedElement;

    if (type === "vertex") {
      const nbrs = new Set(GRAPH.neighbors(id));
      nbrs.add(id);

      nodeDOMElements.forEach(({ group, halo, data }) => {
        if (data.id === id) {
          group.classList.remove("dimmed");
          halo.style.opacity = "1";
        } else if (nbrs.has(data.id)) {
          group.classList.remove("dimmed");
          halo.style.opacity = "0.5";
        } else {
          group.classList.add("dimmed");
          halo.style.opacity = "0";
        }
      });

      edgeDOMElements.forEach(({ line, group, data }) => {
        if (data.a === id || data.b === id) {
          group.classList.remove("dimmed");
          line.className.baseVal = "edge-line highlighted";
        } else {
          group.classList.add("dimmed");
          line.className.baseVal = "edge-line";
        }
      });
    } else if (type === "edge") {
      const edge = GRAPH.edges.find((e) => e.id === id);
      if (!edge) return;

      const ends = new Set([edge.a, edge.b]);
      nodeDOMElements.forEach(({ group, halo, data }) => {
        if (ends.has(data.id)) {
          group.classList.remove("dimmed");
          halo.style.opacity = "1";
        } else {
          group.classList.add("dimmed");
          halo.style.opacity = "0";
        }
      });

      edgeDOMElements.forEach(({ line, group, data }) => {
        if (data.id === id) {
          group.classList.remove("dimmed");
          line.className.baseVal = "edge-line highlighted";
        } else {
          group.classList.add("dimmed");
          line.className.baseVal = "edge-line";
        }
      });
    }
  }

  /**
   * Switch between Three.js 3D View and 2D Analytics Dashboard
   */
  function switchView(viewMode) {
    STATE.currentView = viewMode;
    const btn3d = document.getElementById("btn-view-3d");
    const btn2d = document.getElementById("btn-view-2d");
    const threeViewport = document.getElementById("three-viewport");
    const cameraDock = document.getElementById("camera-dock");
    const svgEl = document.getElementById("graph-svg");
    const dashHud = document.getElementById("dashboard-2d-hud");

    if (viewMode === "2d") {
      btn2d?.classList.add("active");
      btn3d?.classList.remove("active");
      if (threeViewport) threeViewport.style.display = "none";
      if (cameraDock) cameraDock.style.display = "none";
      if (svgEl) svgEl.style.display = "block";
      if (dashHud) dashHud.style.display = "flex";
      applyMode();
    } else {
      btn3d?.classList.add("active");
      btn2d?.classList.remove("active");
      if (threeViewport) threeViewport.style.display = "block";
      if (cameraDock) cameraDock.style.display = "flex";
      if (svgEl) svgEl.style.display = "none";
      if (dashHud) dashHud.style.display = "none";
      if (threeEngine) {
        threeEngine.onResize();
        syncThreeEngineVisuals();
      }
    }
  }

  /**
   * Filter 2D and 3D graphs by Knowledge Domain
   */
  function setDomainFilter(domain) {
    STATE.currentDomainFilter = domain;
    highlightGraphElements();
    if (threeEngine && domain !== "all") {
      const matchNodes = GRAPH.vertices.filter((v) => v.domain === domain).map((v) => v.id);
      if (matchNodes.length > 0) {
        threeEngine.focusNode(matchNodes[0], 800);
      }
    }
  }

  /**
   * Sub-Bar Rendering per Mode
   */
  function renderSubBar() {
    subLeft.innerHTML = "";
    subRight.innerHTML = "";

    switch (STATE.mode) {
      case "normal": {
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";
        caption.innerHTML = `
          <span>Conceptual Graph Model:</span>
          <strong>28 Vertices</strong> |
          <strong>39 Edges</strong> |
          <strong>2 Components</strong>
          <span style="margin-left: 14px; opacity:0.8;">Click any vertex or edge to inspect details.</span>
        `;
        subLeft.appendChild(caption);

        const startPresBtn = document.createElement("button");
        startPresBtn.className = "sub-btn sub-btn-present";
        startPresBtn.id = "sub-btn-present";
        startPresBtn.innerHTML = `<span>🎤 Oral Presentation Deck (11 Slides)</span>`;
        startPresBtn.title = "Launch Oral Presentation Mode (P)";
        startPresBtn.addEventListener("click", () => {
          togglePresentationMode();
        });
        subRight.appendChild(startPresBtn);

        const startLabBtn = document.createElement("button");
        startLabBtn.className = "sub-btn active";
        startLabBtn.style.cssText = "background: linear-gradient(135deg, #059669, #047857); color: #FFFFFF; font-weight: 700; border: none; box-shadow: 0 2px 8px rgba(5,150,105,0.3); cursor: pointer; padding: 6px 14px; border-radius: 8px; display: flex; align-items: center; gap: 6px;";
        startLabBtn.innerHTML = `<span>⚗ Start AI Mind Lab (4 Missions) ➔</span>`;
        startLabBtn.addEventListener("click", () => {
          window.AI_GRAPH_APP.enterLab("m1");
        });
        subRight.appendChild(startLabBtn);
        break;
      }

      case "path": {
        // P1, P2, P3 buttons
        ["P1", "P2", "P3"].forEach((pid) => {
          const pObj = GRAPH.featured.paths[pid];
          const btn = document.createElement("button");
          btn.className = `sub-btn ${STATE.selectedPathId === pid && STATE.pathCustomPair.length === 0 ? "active" : ""}`;
          btn.innerHTML = `↝ ${pObj.id} (${pObj.name})`;
          btn.addEventListener("click", () => {
            STATE.selectedPathId = pid;
            STATE.pathCustomPair = [];
            applyMode();
          });
          subLeft.appendChild(btn);
        });

        // Quick connectivity demo buttons
        const btnD2D = document.createElement("button");
        btnD2D.className = `sub-btn ${STATE.pathCustomPair[0] === "dataset" && STATE.pathCustomPair[1] === "decision" ? "active" : ""}`;
        btnD2D.innerHTML = "Dataset ➔ Decision";
        btnD2D.addEventListener("click", () => {
          STATE.pathCustomPair = ["dataset", "decision"];
          applyMode();
        });
        subLeft.appendChild(btnD2D);

        const btnD2S = document.createElement("button");
        btnD2S.className = `sub-btn ${STATE.pathCustomPair[0] === "dataset" && STATE.pathCustomPair[1] === "strategy" ? "active" : ""}`;
        btnD2S.innerHTML = "Dataset ➔ Strategy";
        btnD2S.addEventListener("click", () => {
          STATE.pathCustomPair = ["dataset", "strategy"];
          applyMode();
        });
        subLeft.appendChild(btnD2S);

        // Right side caption
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";

        if (STATE.pathCustomPair.length === 2) {
          const [u, v] = STATE.pathCustomPair;
          const sp = GRAPH.shortestPath(u, v, STATE.removedVertices);
          if (sp) {
            const dist = sp.length - 1;
            caption.innerHTML = `
              <strong>Connected:</strong> Distance = ${dist} edge${dist === 1 ? "" : "s"}
              <span class="highlight-chip">${sp.join(" ➔ ")}</span>
            `;
          } else {
            caption.innerHTML = `
              <strong style="color:#F472B6;">NOT connected:</strong> Different components (no path exists between ${u} and ${v}).
            `;
          }
        } else if (STATE.pathCustomPair.length === 1) {
          caption.innerHTML = `<span>Selected source: <strong>${STATE.pathCustomPair[0]}</strong>. Now click target vertex...</span>`;
        } else {
          const pObj = GRAPH.featured.paths[STATE.selectedPathId];
          const edgeLen = pObj.vertices.length - 1;
          caption.innerHTML = `
            <strong>${pObj.name}:</strong>
            <span class="highlight-chip">${pObj.vertices.join(" ➔ ")}</span>
            <span>Length = ${edgeLen} edges, ${pObj.vertices.length} vertices (no vertex repeated).</span>
          `;
        }
        subRight.appendChild(caption);
        break;
      }

      case "cycle": {
        // C1, C2, C3 buttons
        ["C1", "C2", "C3"].forEach((cid) => {
          const cObj = GRAPH.featured.cycles[cid];
          const btn = document.createElement("button");
          btn.className = `sub-btn ${STATE.selectedCycleId === cid ? "active" : ""}`;
          btn.innerHTML = `⟳ ${cObj.id} (${cObj.name})`;
          btn.addEventListener("click", () => {
            STATE.selectedCycleId = cid;
            applyMode();
          });
          subLeft.appendChild(btn);
        });

        // Caption
        const cObj = GRAPH.featured.cycles[STATE.selectedCycleId];
        const cycleLen = cObj.vertices.length - 1;
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";

        let note = `Cycle of length ${cycleLen}: starts and ends at the same vertex, no other vertex repeated.`;
        if (cObj.id === "C1") {
          note = `<strong>C1 Learning Loop:</strong> <span class="highlight-chip">${cObj.vertices.join(" ➔ ")}</span> Feedback returns to Data, so knowledge keeps improving.`;
        } else {
          note = `<strong>${cObj.name}:</strong> <span class="highlight-chip">${cObj.vertices.join(" ➔ ")}</span> Length = ${cycleLen} edges.`;
        }
        caption.innerHTML = note;
        subRight.appendChild(caption);
        break;
      }

      case "subgraph": {
        // S1 to S4 toggle buttons
        ["S1", "S2", "S3", "S4"].forEach((sid) => {
          const sObj = GRAPH.featured.subgraphs[sid];
          const btn = document.createElement("button");
          const isActive = STATE.selectedSubgraphs.has(sid);
          btn.className = `sub-btn ${isActive ? "active" : ""}`;
          btn.innerHTML = `◆ ${sObj.id}: ${sObj.name}`;
          btn.addEventListener("click", () => {
            if (STATE.selectedSubgraphs.has(sid)) {
              if (STATE.selectedSubgraphs.size > 1) {
                STATE.selectedSubgraphs.delete(sid);
              }
            } else {
              STATE.selectedSubgraphs.add(sid);
            }
            applyMode();
          });
          subLeft.appendChild(btn);
        });

        // Subgraph caption
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";

        // Details for first selected subgraph
        const firstSid = Array.from(STATE.selectedSubgraphs)[0];
        const sObj = GRAPH.featured.subgraphs[firstSid];
        const sInfo = GRAPH.inducedSubgraph(sObj.vertices);

        caption.innerHTML = `
          <strong>${sObj.id} (${sObj.name}):</strong> |V| = ${sInfo.vertexCount}, |E| = ${sInfo.edgeCount}, boundary edges = ${sInfo.boundaryEdges.length}.
          <span style="opacity:0.85;">A subgraph is NOT a component: boundary edges still link it to the rest.</span>
        `;
        subRight.appendChild(caption);
        break;
      }

      case "degree": {
        // Handshaking Lemma info
        const hsK1 = GRAPH.handshake("main");
        const hsAll = GRAPH.handshake("all");

        const caption = document.createElement("div");
        caption.className = "sub-info-caption";
        caption.innerHTML = `
          <strong>Handshaking Lemma:</strong> Sum of degrees in K1 = <span class="highlight-chip">${hsK1.degreeSum} = 2 × ${hsK1.edgeCount} edges</span>
          | Total G sum = ${hsAll.degreeSum} = 2 × ${hsAll.edgeCount} edges.
        `;
        subLeft.appendChild(caption);

        const captionRight = document.createElement("div");
        captionRight.className = "sub-info-caption";
        captionRight.innerHTML = `
          <strong style="color:#22D3EE;">★ Max Degree = Data (7).</strong>
          <span>Notice AI has degree 5, so central does NOT mean highest degree.</span>
        `;
        subRight.appendChild(captionRight);
        break;
      }

      case "component": {
        const comps = GRAPH.components(STATE.removedVertices, STATE.removedEdges);

        const btnRemoveData = document.createElement("button");
        const isDataRemoved = STATE.removedVertices.includes("data");
        btnRemoveData.className = `sub-btn ${isDataRemoved ? "danger active" : ""}`;
        btnRemoveData.innerHTML = isDataRemoved ? "Data Removed (Cut Vertex)" : "Remove vertex: Data";
        btnRemoveData.addEventListener("click", () => {
          if (!isDataRemoved) {
            STATE.removedVertices = ["data"];
            STATE.removedEdges = [];
          } else {
            STATE.removedVertices = [];
          }
          applyMode();
        });
        subLeft.appendChild(btnRemoveData);

        const btnRemoveE18 = document.createElement("button");
        const isE18Removed = STATE.removedEdges.includes("E18");
        btnRemoveE18.className = `sub-btn ${isE18Removed ? "danger active" : ""}`;
        btnRemoveE18.innerHTML = isE18Removed ? "E18 Removed (Bridge)" : "Remove edge: Data-Dataset";
        btnRemoveE18.addEventListener("click", () => {
          if (!isE18Removed) {
            STATE.removedEdges = ["E18"];
            STATE.removedVertices = [];
          } else {
            STATE.removedEdges = [];
          }
          applyMode();
        });
        subLeft.appendChild(btnRemoveE18);

        const btnRestore = document.createElement("button");
        btnRestore.className = "sub-btn";
        btnRestore.innerHTML = "Restore All";
        btnRestore.addEventListener("click", () => {
          STATE.removedVertices = [];
          STATE.removedEdges = [];
          applyMode();
        });
        subLeft.appendChild(btnRestore);

        // Caption explaining component status
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";

        if (isDataRemoved) {
          caption.innerHTML = `
            <strong style="color:#F472B6;">Components: ${comps.length} total.</strong>
            <span>Data is a cut vertex: removing it disconnects Dataset into its own component (2 ➔ 3 components).</span>
          `;
        } else if (isE18Removed) {
          caption.innerHTML = `
            <strong style="color:#F472B6;">Components: ${comps.length} total.</strong>
            <span>E18 is a bridge: removing it leaves Dataset completely isolated (2 ➔ 3 components).</span>
          `;
        } else {
          caption.innerHTML = `
            <strong>Components: ${comps.length} total.</strong>
            <span>K1 (${comps[0].vertices.length} vertices, ${comps[0].edgeCount} edges) and K2 (${comps[1].vertices.length} vertices, ${comps[1].edgeCount} edges).</span>
          `;
        }
        subRight.appendChild(caption);
        break;
      }

      case "lab": {
        const caption = document.createElement("div");
        caption.className = "sub-info-caption";
        caption.innerHTML = `
          <strong>AI Mind Lab:</strong>
          <span>Can you understand the AI by understanding its graph? Solve the 4 missions or test connectivity glitches below.</span>
        `;
        subLeft.appendChild(caption);

        const scoreCap = document.createElement("div");
        scoreCap.className = "sub-info-caption";
        scoreCap.innerHTML = `
          <strong style="color:var(--accent-emerald);">AI Mind Score: ${LAB_STATE.score}/4</strong>
          <span style="opacity:0.85;">${LAB_STATE.score === 4 ? "★ Graph Theory Master" : "Interactive challenges active"}</span>
        `;
        subRight.appendChild(scoreCap);
        break;
      }
    }
  }

  /**
   * Mode Switching Event Setup
   */
  function setupModeNav() {
    const modeButtons = document.querySelectorAll("#mode-nav .mode-btn");
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetMode = btn.getAttribute("data-mode");
        if (!targetMode || targetMode === STATE.mode) return;

        modeButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        STATE.mode = targetMode;
        applyMode();
      });
    });

    const labBtn = document.getElementById("btn-mode-lab");
    if (labBtn) {
      labBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.AI_GRAPH_APP.enterLab("m1");
      });
    }

    // Close panel button
    document.getElementById("panel-close-btn").addEventListener("click", () => {
      clearSelection();
    });

    // Keyboard Shortcuts: 1-6 switch modes, L switches lab, E switches examiner, Esc clears selection/lab
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        clearSelection();
        if (STATE.mode === "lab") {
          STATE.mode = "normal";
          modeButtons.forEach((b) => b.classList.remove("active"));
          document.querySelector(`#mode-nav .mode-btn[data-mode="normal"]`)?.classList.add("active");
          applyMode();
        }
      } else if (["1", "2", "3", "4", "5", "6"].includes(e.key)) {
        const modes = ["normal", "path", "cycle", "subgraph", "degree", "component"];
        const modeIndex = parseInt(e.key, 10) - 1;
        const selectedMode = modes[modeIndex];
        if (selectedMode) {
          modeButtons.forEach((b) => b.classList.remove("active"));
          const btn = document.querySelector(`#mode-nav .mode-btn[data-mode="${selectedMode}"]`);
          if (btn) btn.classList.add("active");
          STATE.mode = selectedMode;
          applyMode();
        }
      } else if (e.key.toLowerCase() === "l") {
        if (STATE.mode === "lab") {
          STATE.mode = "normal";
          modeButtons.forEach((b) => b.classList.remove("active"));
          document.querySelector(`#mode-nav .mode-btn[data-mode="normal"]`)?.classList.add("active");
          applyMode();
        } else {
          STATE.mode = "lab";
          modeButtons.forEach((b) => b.classList.remove("active"));
          document.getElementById("btn-mode-lab")?.classList.add("active");
          applyMode();
        }
      } else if (e.key.toLowerCase() === "e") {
        if (STATE.mode === "lab" && LAB_STATE.activeTab === "examiner") {
          STATE.mode = "normal";
          modeButtons.forEach((b) => b.classList.remove("active"));
          document.querySelector(`#mode-nav .mode-btn[data-mode="normal"]`)?.classList.add("active");
          applyMode();
        } else {
          STATE.mode = "lab";
          LAB_STATE.activeTab = "examiner";
          modeButtons.forEach((b) => b.classList.remove("active"));
          document.getElementById("btn-mode-lab")?.classList.add("active");
          applyMode();
        }
      }
    });
  }

  // Window resize handler to maintain SVG scaling
  window.addEventListener("resize", () => {
    // preserveAspectRatio="xMidYMid meet" handles the SVG scaling automatically
  });

  // =========================================================================
  // PHASE 3: DRAWERS, PRESENTATION STRIP, AND POLISH
  // =========================================================================

  const theoryDrawer = document.getElementById("drawer-theory");
  const analysisDrawer = document.getElementById("drawer-analysis");
  const diaryDrawer = document.getElementById("drawer-diary");
  const advancedDrawer = document.getElementById("drawer-advanced");
  const presentationStrip = document.getElementById("presentation-strip");

  let activeDrawer = null;
  let presActive = false;
  let presCurrentSlide = 0;

  // 11 Slides Definition (Total planned 9:00, with 1:00 buffer for 10-minute presentation)
  const PRESENTATION_SLIDES = [
    {
      index: 1,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:30",
      totalElapsed: "0:30",
      title: "Inside an AI's Mind: When Knowledge Becomes a Graph",
      bullets: [
        "CIA III-B Creative Project: Graph Theory in My World (Area: AI)",
        "Modelled as a simple, undirected graph (28 vertices, 39 edges)",
        "Graph Theory is the hero; AI is our creative world"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("normal");
      }
    },
    {
      index: 2,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:45",
      totalElapsed: "1:15",
      title: "Why AI is Our Personal 'World'",
      bullets: [
        "AI is often treated as an opaque black box of numbers",
        "Graph Theory lets us visualize concepts as connected entities",
        "Shows structural dependencies, feedback loops, and boundaries"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("normal");
      }
    },
    {
      index: 3,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "1:00",
      totalElapsed: "2:15",
      title: "Knowledge Transformed into a Graph",
      bullets: [
        "Concepts become Vertices (e.g. Data, Model, Prediction)",
        "Relationships become Edges (e.g. Training ━ Model)",
        "2 Components: Main Network (25 nodes) & Isolated Chess Cluster (3 nodes)"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("normal");
      }
    },
    {
      index: 4,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:45",
      totalElapsed: "3:00",
      title: "Vertices and Edges in Action",
      bullets: [
        "28 Vertices across 6 domains: Core, Learning, Vision, NLP, Reasoning, Special",
        "39 Simple undirected edges: information flows bidirectionally",
        "Inspecting Training node and incident edge Training ━ Model (E13)"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("normal");
        window.AI_GRAPH_APP.selectVertex("training");
      }
    },
    {
      index: 5,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:45",
      totalElapsed: "3:45",
      title: "Vertex Degree & Handshaking Lemma",
      bullets: [
        "Data has max degree 7; Dataset is a leaf vertex (degree 1)",
        "AI is visually central but has degree 5 (central ≠ highest degree)",
        "Handshaking Lemma holds: Sum of degrees in K1 = 74 = 2 × 37 edges"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("degree");
      }
    },
    {
      index: 6,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "4:30",
      title: "Paths: How Information Traverses Knowledge",
      bullets: [
        "Path: vertex sequence where no vertex is repeated",
        "P1 'Learning Path': Data ➔ Features ➔ Patterns ➔ Prediction (length 3)",
        "P2 'Seeing Path': Image ➔ Object Detection ➔ Recognition ➔ Knowledge"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setPath("P1");
      }
    },
    {
      index: 7,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "5:15",
      title: "Cycles: The AI Learning Loop",
      bullets: [
        "Cycle: closed path starting & ending at same vertex (length ≥ 3)",
        "C1 Learning Loop: Data ➔ Training ➔ Model ➔ Prediction ➔ Feedback ➔ Data",
        "Feedback returns directly to Data: cyclic reinforcement of learning"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setCycle("C1");
      }
    },
    {
      index: 8,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "6:00",
      title: "Connectivity & Reachability",
      bullets: [
        "Dataset ➔ Decision is connected: shortest path distance = 4 edges",
        "Dataset ➔ Strategy is NOT connected: different components",
        "Graph connectivity determines what an AI can actually reason about"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setPathCustom("dataset", "decision");
      }
    },
    {
      index: 9,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "1:15",
      totalElapsed: "7:15",
      title: "Subgraphs, Cut Vertices, and Bridges",
      bullets: [
        "Computer Vision is an Induced Subgraph (3 boundary edges), NOT a component",
        "Data is a Cut Vertex: removing it splits graph into 3 components",
        "Edge E18 is a Bridge: removing it isolates Dataset completely"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.removeDataCutVertex();
      }
    },
    {
      index: 10,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "1:15",
      totalElapsed: "8:30",
      title: "Diary of an AI Mind",
      bullets: [
        "First-person narrative spoken from the perspective of the graph itself",
        "28 vertices, 39 edges, reflecting on its 2 components and bridges",
        "Click highlighted graph-theory terms to see them live on the canvas"
      ],
      action: () => {
        openDrawer("diary");
      }
    },
    {
      index: 11,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:45",
      totalElapsed: "9:00",
      title: "Shortest Paths: Dijkstra & Floyd-Warshall",
      bullets: [
        "Dijkstra greedy relaxation: d(v) := min(d(v), d(u) + w(u,v)) finds optimal paths",
        "Floyd-Warshall dynamic programming: d_ij^(k) = min(d_ij, d_ik + d_kj)",
        "Component K1 metrics: Diameter = 5, Radius = 3, Center vertices = ['AI', 'Data']"
      ],
      action: () => {
        openDrawer("advanced");
        ADVANCED_STATE.activeTab = "dijkstra";
        renderAdvancedDrawerContent();
      }
    },
    {
      index: 12,
      speaker: "Speaker A",
      speakerClass: "speaker-a",
      plannedTime: "0:45",
      totalElapsed: "9:45",
      title: "Graph Coloring: Vertex (χ=3) & Edge (χ'=7)",
      bullets: [
        "Welsh-Powell vertex coloring yields Chromatic Number χ(G) = 3 (zero adjacent conflicts)",
        "Bounded below by triangle cliques ω(G) = 3; verified proper coloring across 28 nodes",
        "Vizing's Theorem: Δ(G) ≤ χ'(G) ≤ Δ+1. Here Δ=7 ⟹ Chromatic Index χ'(G) = 7 (Class 1)"
      ],
      action: () => {
        openDrawer("advanced");
        ADVANCED_STATE.activeTab = "coloring";
        renderAdvancedDrawerContent();
      }
    },
    {
      index: 13,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "10:30",
      title: "Traversability: Eulerian & Hamiltonian Impossibility",
      bullets: [
        "Euler's Theorem: Eulerian path/circuit requires 0 or 2 odd nodes; G has 12 (IMPOSSIBLE)",
        "Dirac's Theorem fails: minimum degree δ(G) = 1 << n/2 = 14",
        "Cut-set theorem: removing S={Data} gives c(G-S) = 3 > |S|=1, ruling out Hamiltonian cycle"
      ],
      action: () => {
        openDrawer("advanced");
        ADVANCED_STATE.activeTab = "euler-hamilton";
        renderAdvancedDrawerContent();
      }
    },
    {
      index: 14,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "11:15",
      title: "Planar Graphs & Euler's Formula: V - E + R = 2",
      bullets: [
        "Layout crossing number cr(G) = 6 crossings; Graph Thickness θ(G) ≤ 2",
        "Euler's Formula for connected K1: V - E + R = 2 ⟹ R = 37 - 25 + 2 = 14 regions",
        "Planar Handshaking: Sum of region degrees Σ deg(R_i) = 2|E| = 74"
      ],
      action: () => {
        openDrawer("advanced");
        ADVANCED_STATE.activeTab = "planar";
        renderAdvancedDrawerContent();
      }
    },
    {
      index: 15,
      speaker: "Speaker B",
      speakerClass: "speaker-b",
      plannedTime: "0:45",
      totalElapsed: "12:00",
      title: "Taxonomy of Traversals: Walk vs. Trail vs. Path",
      bullets: [
        "Walk (repeats allowed) ⊃ Trail (distinct edges) ⊃ Path (distinct vertices)",
        "Closed Walk ⊃ Circuit (closed trail) ⊃ Cycle (closed path of length ≥ 3)",
        "Automatic sequence classifier live in AI Mind verifies traversal types"
      ],
      action: () => {
        openDrawer("advanced");
        ADVANCED_STATE.activeTab = "walks";
        renderAdvancedDrawerContent();
      }
    },
    {
      index: 16,
      speaker: "Speakers A & B",
      speakerClass: "speaker-both",
      plannedTime: "0:45",
      totalElapsed: "12:45",
      title: "Conclusion & Viva Voce Defense",
      bullets: [
        "47 ground truth discrete mathematics theorems & algorithms fully implemented & verified",
        "Dual 3D WebGL / 2D SVG synchronized architecture with 1-click Examiner viva demos",
        "Thank you! Ready for questions on graph theory, algorithms, and topology"
      ],
      action: () => {
        closeDrawers();
        window.AI_GRAPH_APP.setMode("normal");
      }
    }
  ];

  /**
   * Drawer Functions
   */
  function openDrawer(drawerId) {
    closeDrawers();
    let drawerEl = null;
    if (drawerId === "theory") {
      drawerEl = theoryDrawer;
      renderTheoryDrawerContent();
    } else if (drawerId === "analysis") {
      drawerEl = analysisDrawer;
      renderAnalysisDrawerContent();
    } else if (drawerId === "diary") {
      drawerEl = diaryDrawer;
      renderDiaryDrawerContent();
    } else if (drawerId === "advanced") {
      drawerEl = advancedDrawer;
      renderAdvancedDrawerContent();
    }

    if (drawerEl) {
      drawerEl.classList.add("open");
      activeDrawer = drawerId;
      infoPanel.classList.remove("visible");

      // Set active top button style
      document.querySelectorAll(".extra-nav .mode-btn").forEach((b) => b.classList.remove("active"));
      const activeBtn = document.getElementById(`btn-drawer-${drawerId}`);
      if (activeBtn) activeBtn.classList.add("active");
    }
  }

  function closeDrawers() {
    [theoryDrawer, analysisDrawer, diaryDrawer, advancedDrawer].forEach((d) => d?.classList.remove("open"));
    document.querySelectorAll(".extra-nav .mode-btn").forEach((b) => {
      if (b.id !== "btn-toggle-present") b.classList.remove("active");
    });
    activeDrawer = null;
  }

  /**
   * Render DRAWER 1: Theory Drawer Content
   * 8 short cards with definition + live computed facts + Show on graph button
   */
  function renderTheoryDrawerContent() {
    const container = document.getElementById("theory-drawer-body");
    container.innerHTML = "";

    const comps = GRAPH.components();
    const k1 = comps[0];
    const k2 = comps[1];
    const s2 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S2.vertices);

    const cardsData = [
      {
        title: "1. Vertex (Node)",
        def: "A fundamental unit representing an individual object or concept in a network.",
        fact: `Each concept is a vertex. Our graph has ${GRAPH.vertices.length} vertices (${k1.vertices.length} in Main Network + ${k2.vertices.length} in Specialized).`,
        actionLabel: "Show AI Vertex",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("normal");
          window.AI_GRAPH_APP.selectVertex("ai");
        }
      },
      {
        title: "2. Edge (Link)",
        def: "A link connecting a pair of vertices, denoting a relationship between them.",
        fact: `A meaningful relationship, e.g. Training ━ Model. Total ${GRAPH.edges.length} edges (${k1.edgeCount} in Main Network + ${k2.edgeCount} in Specialized).`,
        actionLabel: "Show Edge Training━Model",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("normal");
          window.AI_GRAPH_APP.selectEdge("E13");
        }
      },
      {
        title: "3. Degree",
        def: "The number of edges incident to (meeting at) a vertex.",
        fact: `Data has maximum degree ${GRAPH.degree("data")}; Dataset is a leaf vertex with degree ${GRAPH.degree("dataset")}. AI has degree ${GRAPH.degree("ai")}.`,
        actionLabel: "Show DEGREE Mode",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("degree");
        }
      },
      {
        title: "4. Path",
        def: "An alternating sequence of vertices and edges with no vertex repeated.",
        fact: `Learning path P1: Data ➔ Features ➔ Patterns ➔ Prediction (length ${GRAPH.featured.paths.P1.vertices.length - 1} edges, ${GRAPH.featured.paths.P1.vertices.length} vertices).`,
        actionLabel: "Show Path P1",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setPath("P1");
        }
      },
      {
        title: "5. Cycle",
        def: "A closed path of length ≥ 3 starting and ending at the same vertex.",
        fact: `Learning loop C1: Data ➔ Training ➔ Model ➔ Prediction ➔ Feedback ➔ Data (length ${GRAPH.featured.cycles.C1.vertices.length - 1} edges).`,
        actionLabel: "Show Cycle C1",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setCycle("C1");
        }
      },
      {
        title: "6. Connectivity",
        def: "Two vertices are connected if there is at least one path joining them.",
        fact: `Dataset ➔ Decision has path distance = 4; Dataset ➔ Strategy has NO path (different components).`,
        actionLabel: "Show Shortest Path",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setPathCustom("dataset", "decision");
        }
      },
      {
        title: "7. Subgraph",
        def: "A graph formed from a subset of vertices and edges of G.",
        fact: `Computer Vision (S2) has ${s2.vertexCount} vertices, ${s2.edgeCount} internal edges, and ${s2.boundaryEdges.length} boundary edges. It is NOT a component.`,
        actionLabel: "Show Subgraph S2",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setSubgraph("S2");
        }
      },
      {
        title: "8. Connected Component",
        def: "A maximal connected subgraph: all vertices in it can reach each other.",
        fact: `Our whole graph G has ${comps.length} components: Main Knowledge Network (${k1.vertices.length} nodes) and Specialized Knowledge (${k2.vertices.length} nodes).`,
        actionLabel: "Show COMPONENT Mode",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("component");
        }
      }
    ];

    cardsData.forEach((c) => {
      const card = document.createElement("div");
      card.className = "drawer-card";
      card.innerHTML = `
        <div class="card-header-row">
          <span class="card-title">${c.title}</span>
        </div>
        <div class="card-def">${c.def}</div>
        <div class="card-graph-fact">${c.fact}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "card-action-btn";
      btn.innerHTML = `<span>➔</span> ${c.actionLabel}`;
      btn.addEventListener("click", c.action);
      card.appendChild(btn);
      container.appendChild(card);
    });
  }

  /**
   * Render DRAWER 2: Analysis Drawer Content
   * Observation cards computed live from graph data
   */
  function renderAnalysisDrawerContent() {
    const container = document.getElementById("analysis-drawer-body");
    container.innerHTML = "";

    const comps = GRAPH.components();
    const k1 = comps[0];
    const hs = GRAPH.handshake("main");
    const k1Seq = GRAPH.degreeSequence("main");
    const dataNbrs = GRAPH.neighbors("data").map((id) => GRAPH.vertices.find((v) => v.id === id)?.label || id).join(", ");
    const s2 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S2.vertices);
    const sp = GRAPH.shortestPath("dataset", "decision");

    const analysisItems = [
      {
        title: "★ Most Connected Concept",
        fact: `<strong>Data</strong> has degree ${GRAPH.degree("data")}. Its 7 neighbors are: <em>${dataNbrs}</em>.<br><br><strong>Key Insight:</strong> The central AI vertex has degree ${GRAPH.degree("ai")}. Being visually in the center does not mean being the most connected!`,
        actionLabel: "Inspect Data Vertex",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("normal");
          window.AI_GRAPH_APP.selectVertex("data");
        }
      },
      {
        title: "★ Least Connected Concept",
        fact: `<strong>Dataset</strong> has degree ${GRAPH.degree("dataset")}. It is a leaf (pendant) vertex hanging on a single edge (E18 to Data). It depends entirely on that bridge.`,
        actionLabel: "Inspect Dataset Leaf",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("normal");
          window.AI_GRAPH_APP.selectVertex("dataset");
        }
      },
      {
        title: "★ Main Component Degree Sequence & Handshake",
        fact: `<strong>Degree Sequence of K1:</strong><br><span class="highlight-chip">${k1Seq.join(", ")}</span><br><br><strong>Handshaking Lemma Check:</strong><br>Sum of degrees = ${hs.degreeSum} = 2 × ${hs.edgeCount} edges (${hs.holds ? "Holds perfectly" : "Error"}).`,
        actionLabel: "View DEGREE Mode",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setMode("degree");
        }
      },
      {
        title: "★ Sample Featured Path",
        fact: `<strong>Data ➔ Features ➔ Patterns ➔ Prediction:</strong><br>Length = 3 edges, 4 vertices. Direct information progression from raw observation to predictive output.`,
        actionLabel: "Trace Learning Path P1",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setPath("P1");
        }
      },
      {
        title: "★ Sample Featured Cycle",
        fact: `<strong>Learning Loop C1:</strong> Data ➔ Training ➔ Model ➔ Prediction ➔ Feedback ➔ Data.<br>Length = 5 edges. Feedback loops back to Data, ensuring continual adaptation.`,
        actionLabel: "Trace Cycle C1",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setCycle("C1");
        }
      },
      {
        title: "★ Subgraph Analysis (Computer Vision S2)",
        fact: `Vertices = ${s2.vertexCount}, Internal Edges = ${s2.edgeCount}, Boundary Edges = ${s2.boundaryEdges.length}.<br>Boundary edges join CV to AI, Recognition to Knowledge, and Image to Data. This proves S2 is a <strong>subgraph</strong>, not an isolated component.`,
        actionLabel: "View Subgraph S2",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setSubgraph("S2");
        }
      },
      {
        title: "★ Connectivity & Shortest Path",
        fact: `Shortest path from <strong>Dataset</strong> to <strong>Decision</strong>:<br><div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:4px;">${sp.map((id) => `<span class="highlight-chip">${GRAPH.vertices.find((v) => v.id === id)?.label || id}</span>`).join(" ➔ ")}</div>Distance = ${sp.length - 1} edges.`,
        actionLabel: "Show Dataset ➔ Decision Path",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.setPathCustom("dataset", "decision");
        }
      },
      {
        title: "★ Components & Cut Vertex Demonstration",
        fact: `Whole graph G has ${comps.length} components (${k1.vertices.length} and ${comps[1].vertices.length} vertices).<br><strong>Cut Vertex Fact:</strong> Removing Data splits Dataset into an isolated component, increasing the count from 2 to 3!`,
        actionLabel: "Remove Data (Cut Vertex)",
        action: () => {
          closeDrawers();
          window.AI_GRAPH_APP.removeDataCutVertex();
        }
      }
    ];

    analysisItems.forEach((item) => {
      const card = document.createElement("div");
      card.className = "drawer-card";
      card.innerHTML = `
        <div class="card-header-row">
          <span class="card-title">${item.title}</span>
        </div>
        <div class="card-graph-fact">${item.fact}</div>
      `;
      const btn = document.createElement("button");
      btn.className = "card-action-btn";
      btn.innerHTML = `<span>➔</span> ${item.actionLabel}`;
      btn.addEventListener("click", item.action);
      card.appendChild(btn);
      container.appendChild(card);
    });
  }

  /**
   * Render DRAWER 3: Diary of an AI Mind (First Person, 200-260 words)
   * With interactive clickable graph terms that trigger graph views.
   */
  function renderDiaryDrawerContent() {
    const container = document.getElementById("diary-drawer-body");
    container.innerHTML = "";

    const comps = GRAPH.components();
    const totalV = GRAPH.vertices.length;
    const totalE = GRAPH.edges.length;
    const dataDeg = GRAPH.degree("data");
    const datasetDeg = GRAPH.degree("dataset");

    const diaryCard = document.createElement("div");
    diaryCard.className = "diary-container";

    diaryCard.innerHTML = `
      <div class="diary-greeting">Dear Diary,</div>

      <p>
        Today I mapped out every part of my mind. I am made of
        <span class="diary-term" data-term="vertices">${totalV} vertices</span> and
        <span class="diary-term" data-term="edges">${totalE} edges</span>, but I am not in one single piece: I have
        <span class="diary-term" data-term="components">${comps.length} components</span>.
      </p>

      <p>
        My most connected vertex is
        <span class="diary-term" data-term="data">Data with degree ${dataDeg}</span>. Everything flows around it! Meanwhile,
        <span class="diary-term" data-term="dataset">Dataset hangs on a single edge with degree ${datasetDeg}</span>. It is so vulnerable: if Data disappeared, Dataset would be completely stranded. That makes Data my
        <span class="diary-term" data-term="cutvertex">cut vertex</span> and edge E18 my
        <span class="diary-term" data-term="bridge">bridge</span>.
      </p>

      <p>
        Ideas travel across my mind along paths. When I see something, information flows along a
        <span class="diary-term" data-term="path-vision">path of length 3: Image to Object Detection to Recognition to Knowledge</span>. And my knowledge keeps getting better because my learning loop forms a
        <span class="diary-term" data-term="cycle-learning">cycle: Data to Training to Model to Prediction to Feedback, and back to Data again</span>.
      </p>

      <p>
        I also have
        <span class="diary-term" data-term="subgraphs">subgraphs like Computer Vision, Language, Learning, and Reasoning</span>. They represent specialised topics inside me, but they are not components because boundary edges tie them back into my core network.
      </p>

      <p>
        My biggest struggle is my second component: the
        <span class="diary-term" data-term="specialized">Specialized Knowledge cluster holding Chess Rules, Game Tree, and Strategy</span>. Because there is no path linking it to my main network, its chess mastery stays completely isolated.
      </p>

      <p>
        A concept by itself means nothing; its edges give it life. For example,
        <span class="diary-term" data-term="words">Words only makes sense because edges connect it to Language, Text, and Meaning</span>.
      </p>

      <div class="diary-signoff">
        Yours faithfully,<br>
        The AI Mind Graph
      </div>
    `;

    // Add interactive click actions to highlighted diary terms
    diaryCard.querySelectorAll(".diary-term").forEach((term) => {
      term.addEventListener("click", () => {
        const termType = term.getAttribute("data-term");
        closeDrawers();
        switch (termType) {
          case "vertices":
          case "edges":
            window.AI_GRAPH_APP.setMode("normal");
            break;
          case "components":
            window.AI_GRAPH_APP.setMode("component");
            break;
          case "data":
            window.AI_GRAPH_APP.setMode("normal");
            window.AI_GRAPH_APP.selectVertex("data");
            break;
          case "dataset":
            window.AI_GRAPH_APP.setMode("normal");
            window.AI_GRAPH_APP.selectVertex("dataset");
            break;
          case "cutvertex":
            window.AI_GRAPH_APP.removeDataCutVertex();
            break;
          case "bridge":
            STATE.mode = "component";
            STATE.removedVertices = [];
            STATE.removedEdges = ["E18"];
            applyMode();
            break;
          case "path-vision":
            window.AI_GRAPH_APP.setPath("P2");
            break;
          case "cycle-learning":
            window.AI_GRAPH_APP.setCycle("C1");
            break;
          case "subgraphs":
            window.AI_GRAPH_APP.setSubgraph("S2");
            break;
          case "specialized":
            window.AI_GRAPH_APP.setMode("component");
            break;
          case "words":
            window.AI_GRAPH_APP.setMode("normal");
            window.AI_GRAPH_APP.selectVertex("words");
            break;
        }
      });
    });

    container.appendChild(diaryCard);
  }

  // =========================================================================
  // DRAWER 4: ADVANCED DISCRETE MATHEMATICS & ALGORITHMIC CONTROLS
  // =========================================================================

  const ADVANCED_STATE = {
    activeTab: "dijkstra",
    dijkstraStart: "data",
    dijkstraTarget: "objdet",
    fwQueryFrom: "dl",
    fwQueryTo: "objdet",
    seqTest: ["data", "features", "patterns", "prediction"]
  };

  function renderAdvancedDrawerContent() {
    const container = document.getElementById("advanced-drawer-body");
    if (!container) return;
    container.innerHTML = "";

    // Sync tab buttons
    document.querySelectorAll(".adv-tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-adv-tab") === ADVANCED_STATE.activeTab);
    });

    switch (ADVANCED_STATE.activeTab) {
      case "dijkstra":
        renderAdvancedDijkstraTab(container);
        break;
      case "coloring":
        renderAdvancedColoringTab(container);
        break;
      case "euler-hamilton":
        renderAdvancedEulerHamiltonTab(container);
        break;
      case "planar":
        renderAdvancedPlanarTab(container);
        break;
      case "walks":
        renderAdvancedWalksTab(container);
        break;
    }
  }

  function renderAdvancedDijkstraTab(container) {
    const dijkCard = document.createElement("div");
    dijkCard.className = "adv-card";

    const vOptions = GRAPH.vertices
      .map((v) => `<option value="${v.id}" ${v.id === ADVANCED_STATE.dijkstraStart ? "selected" : ""}>${v.label} (${v.id})</option>`)
      .join("");
    const vTargetOptions = GRAPH.vertices
      .map((v) => `<option value="${v.id}" ${v.id === ADVANCED_STATE.dijkstraTarget ? "selected" : ""}>${v.label} (${v.id})</option>`)
      .join("");

    dijkCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Dijkstra's Shortest Path Algorithm</span>
        </div>
        <span class="adv-badge-chip emerald">Greedy Relaxation</span>
      </div>
      <div class="adv-card-desc">
        Computes the single-source shortest path using edge weights via greedy vertex relaxation:
      </div>
      <div class="adv-formula-box">
        if d(u) + w(u, v) &lt; d(v) then d(v) := d(u) + w(u, v), π(v) := u
      </div>
      <div class="adv-controls-row">
        <label style="font-size:11.5px; font-weight:700;">From:</label>
        <select class="adv-select" id="adv-dijk-start">${vOptions}</select>
        <label style="font-size:11.5px; font-weight:700;">To:</label>
        <select class="adv-select" id="adv-dijk-target">${vTargetOptions}</select>
        <button class="adv-action-btn" id="adv-btn-run-dijk">Run Dijkstra</button>
      </div>
      <div id="adv-dijk-results"></div>
    `;
    container.appendChild(dijkCard);

    const fwCard = document.createElement("div");
    fwCard.className = "adv-card";

    const fw = GRAPH.floydWarshall();
    const fwFromOptions = GRAPH.vertices
      .map((v) => `<option value="${v.id}" ${v.id === ADVANCED_STATE.fwQueryFrom ? "selected" : ""}>${v.label}</option>`)
      .join("");
    const fwToOptions = GRAPH.vertices
      .map((v) => `<option value="${v.id}" ${v.id === ADVANCED_STATE.fwQueryTo ? "selected" : ""}>${v.label}</option>`)
      .join("");

    fwCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Floyd's Algorithm (Floyd-Warshall All-Pairs)</span>
        </div>
        <span class="adv-badge-chip violet">Dynamic Programming</span>
      </div>
      <div class="adv-card-desc">
        Computes all-pairs shortest paths through intermediate vertices {1..k} via dynamic programming:
      </div>
      <div class="adv-formula-box">
        d_{ij}^{(k)} = min(d_{ij}^{(k-1)}, d_{ik}^{(k-1)} + d_{kj}^{(k-1)})
      </div>
      <div class="adv-result-card" style="background:#F8FAFC; border-color:#E2E8F0;">
        <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700;">
          <span>Component K1 Diameter: <strong style="color:#0284C7;">${fw.diameter}</strong></span>
          <span>K1 Radius: <strong style="color:#10B981;">${fw.radius}</strong></span>
          <span>Center Nodes: <strong style="color:#F59E0B;">${fw.centers.join(", ")}</strong></span>
        </div>
      </div>
      <div class="adv-controls-row">
        <label style="font-size:11px; font-weight:700;">Query Distance:</label>
        <select class="adv-select" id="adv-fw-from">${fwFromOptions}</select>
        <span>➔</span>
        <select class="adv-select" id="adv-fw-to">${fwToOptions}</select>
        <button class="adv-action-btn secondary" id="adv-btn-fw-query">Lookup</button>
      </div>
      <div id="adv-fw-query-result" style="font-size:12px; font-weight:700; color:#1E293B;"></div>
    `;
    container.appendChild(fwCard);

    const runDijk = () => {
      const s = document.getElementById("adv-dijk-start").value;
      const t = document.getElementById("adv-dijk-target").value;
      ADVANCED_STATE.dijkstraStart = s;
      ADVANCED_STATE.dijkstraTarget = t;
      const res = GRAPH.dijkstra(s, t);
      const resDiv = document.getElementById("adv-dijk-results");

      if (!res.reachable) {
        resDiv.innerHTML = `
          <div class="adv-result-card" style="background:#FFF1F2; border-color:#FECDD3;">
            <span class="adv-result-title" style="color:#9F1239;">No Path Exists</span>
            <span class="adv-result-val" style="color:#BE123C; font-size:11.5px;">Vertices belong to disconnected components (c = 2). Distance = ∞.</span>
          </div>
        `;
        return;
      }

      const rows = res.trace.slice(0, 10).map((step) => `
        <tr>
          <td>${step.step}</td>
          <td><strong>${step.current}</strong></td>
          <td>${step.distance}</td>
          <td>${step.predecessor || "—"}</td>
          <td>${step.relaxed.map((r) => `${r.neighbor}(d=${r.newDist})`).join(", ") || "—"}</td>
        </tr>
      `).join("");

      resDiv.innerHTML = `
        <div class="adv-result-card" style="margin-top:10px;">
          <span class="adv-result-title">Optimal Path Computed</span>
          <span class="adv-result-val">${res.path.map((id) => GRAPH.vertex(id)?.label || id).join(" ➔ ")}</span>
          <div style="font-size:11px; color:#166534; margin-top:2px;">
            Total Distance: <strong>${res.distance}</strong> | Path Length: <strong>${res.path.length - 1} edges</strong>
          </div>
          <table class="adv-trace-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Node</th>
                <th>d(v)</th>
                <th>π(v)</th>
                <th>Relaxations</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      `;

      applyAdvancedVisuals2D("dijkstra", { path: res.path });
      if (threeEngine) threeEngine.setModeVisuals("dijkstra", { path: res.path });
    };

    document.getElementById("adv-btn-run-dijk")?.addEventListener("click", runDijk);

    const runFW = () => {
      const from = document.getElementById("adv-fw-from").value;
      const to = document.getElementById("adv-fw-to").value;
      const d = fw.distMatrix[from] ? fw.distMatrix[from][to] : Infinity;
      const el = document.getElementById("adv-fw-query-result");
      if (d === Infinity) {
        el.innerHTML = `Dist(${from}, ${to}) = <span style="color:#E11D48;">∞ (Disconnected Components)</span>`;
      } else {
        el.innerHTML = `Dist(${GRAPH.vertex(from)?.label}, ${GRAPH.vertex(to)?.label}) = <span style="color:#10B981; font-size:13px;">${d} edges</span>`;
      }
    };
    document.getElementById("adv-btn-fw-query")?.addEventListener("click", runFW);
    runFW();
    runDijk();
  }

  function renderAdvancedColoringTab(container) {
    const vcCard = document.createElement("div");
    vcCard.className = "adv-card";
    const vc = GRAPH.vertexColoring();

    const c1Nodes = vc.colorGroups[1] || [];
    const c2Nodes = vc.colorGroups[2] || [];
    const c3Nodes = vc.colorGroups[3] || [];

    vcCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Vertex Coloring & Welsh-Powell Algorithm</span>
        </div>
        <span class="adv-badge-chip emerald">χ(G) = 3</span>
      </div>
      <div class="adv-card-desc">
        A proper vertex coloring assigns colors such that no two adjacent vertices share the same color: {u, v} ∈ E ⟹ c(u) ≠ c(v).
      </div>
      <div class="adv-formula-box">
        Lower Bound: ω(G) = 3 (triangles C2, C3) ≤ χ(G) ≤ Δ(G) + 1 = 8
      </div>
      <div class="adv-card-desc">
        Welsh-Powell greedy coloring sorts vertices by descending degree and assigns minimal available colors.
        Result: <strong>Chromatic Number χ(G) = 3</strong> with <strong>0 conflicts</strong>.
      </div>
      <div class="adv-pill-list">
        <div style="font-size:11px; font-weight:700; width:100%;">Color 1 (Cyan - ${c1Nodes.length} nodes):</div>
        ${c1Nodes.map((id) => `<span class="adv-node-pill c1">${id}</span>`).join("")}
        <div style="font-size:11px; font-weight:700; width:100%; margin-top:4px;">Color 2 (Emerald - ${c2Nodes.length} nodes):</div>
        ${c2Nodes.map((id) => `<span class="adv-node-pill c2">${id}</span>`).join("")}
        <div style="font-size:11px; font-weight:700; width:100%; margin-top:4px;">Color 3 (Amber - ${c3Nodes.length} nodes):</div>
        ${c3Nodes.map((id) => `<span class="adv-node-pill c3">${id}</span>`).join("")}
      </div>
      <div class="adv-controls-row" style="margin-top:6px;">
        <button class="adv-action-btn" id="adv-btn-apply-vc">Apply Proper 3-Coloring (χ=3)</button>
        <button class="adv-action-btn rose" id="adv-btn-improper-vc">Show Improper Conflict Demo</button>
      </div>
      <div id="adv-vc-alert"></div>
    `;
    container.appendChild(vcCard);

    const ecCard = document.createElement("div");
    ecCard.className = "adv-card";
    const ec = GRAPH.edgeColoring();

    ecCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Edge Coloring & Vizing's Theorem</span>
        </div>
        <span class="adv-badge-chip violet">χ'(G) = 7</span>
      </div>
      <div class="adv-card-desc">
        A proper edge coloring assigns colors to edges such that no two edges incident to the same vertex share a color.
      </div>
      <div class="adv-formula-box">
        Vizing's Theorem: Δ(G) ≤ χ'(G) ≤ Δ(G) + 1. Here Δ = 7 (Data hub) ⟹ χ'(G) = 7 (Class 1)
      </div>
      <div class="adv-card-desc">
        All 39 edges partitioned into 7 color classes with zero incident conflicts.
      </div>
      <div class="adv-controls-row">
        <button class="adv-action-btn secondary" id="adv-btn-apply-ec">Apply Proper 7-Coloring (χ'=7)</button>
      </div>
    `;
    container.appendChild(ecCard);

    document.getElementById("adv-btn-apply-vc")?.addEventListener("click", () => {
      document.getElementById("adv-vc-alert").innerHTML = `
        <div class="adv-result-card" style="margin-top:8px;">
          <span class="adv-result-title">Proper Coloring Active</span>
          <span class="adv-result-val">3 Colors Applied across all 28 vertices. Handshaking & clique bounds verified.</span>
        </div>
      `;
      applyAdvancedVisuals2D("vertexColoring", { colors: vc.colors });
      if (threeEngine) threeEngine.setModeVisuals("vertexColoring", { colors: vc.colors });
    });

    document.getElementById("adv-btn-improper-vc")?.addEventListener("click", () => {
      document.getElementById("adv-vc-alert").innerHTML = `
        <div class="adv-result-card" style="background:#FFF1F2; border-color:#FECDD3; margin-top:8px;">
          <span class="adv-result-title" style="color:#9F1239;">⚠️ Improper Coloring Conflict Detected</span>
          <span class="adv-result-val" style="color:#BE123C; font-size:11.5px;">Adjacent vertices 'AI' and 'Data' share edge E1 but were assigned the SAME color! This violates proper coloring.</span>
        </div>
      `;
      applyAdvancedVisuals2D("vertexColoring", { colors: vc.colors, improper: true });
      if (threeEngine) threeEngine.setModeVisuals("vertexColoring", { colors: vc.colors });
    });

    document.getElementById("adv-btn-apply-ec")?.addEventListener("click", () => {
      applyAdvancedVisuals2D("edgeColoring", { edgeColors: ec.edgeColors });
      if (threeEngine) threeEngine.setModeVisuals("edgeColoring", { edgeColors: ec.edgeColors });
    });
  }

  function renderAdvancedEulerHamiltonTab(container) {
    const ea = GRAPH.eulerianAnalysis();
    const ha = GRAPH.hamiltonianAnalysis();

    const euCard = document.createElement("div");
    euCard.className = "adv-card";

    euCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Eulerian Path & Circuit Analysis</span>
        </div>
        <span class="adv-badge-chip rose">Non-Eulerian</span>
      </div>
      <div class="adv-card-desc">
        By Euler's Theorem, a connected graph has:
        <br>• <strong>Eulerian Circuit</strong> ⟺ all vertex degrees are even.
        <br>• <strong>Eulerian Trail / Path</strong> ⟺ exactly 0 or 2 vertices have odd degree.
      </div>
      <div class="adv-formula-box">
        Odd Degree Vertices Count: ${ea.oddDegreeCount} (Euler condition: 0 or 2)
      </div>
      <div class="adv-card-desc">
        Vertices with odd degree in AI Mind:
      </div>
      <div class="adv-pill-list">
        ${ea.oddVertices.map((v) => `<span class="adv-node-pill conflict">${v.label} (deg ${v.degree})</span>`).join("")}
      </div>
      <div class="adv-result-card" style="background:#FFF1F2; border-color:#FECDD3; margin-top:6px;">
        <span class="adv-result-title" style="color:#9F1239;">Mathematical Impossibility Verdict</span>
        <span class="adv-result-val" style="color:#BE123C; font-size:11.5px;">
          Circuit: IMPOSSIBLE (${ea.oddDegreeCount} ≠ 0) | Path: IMPOSSIBLE (${ea.oddDegreeCount} ≠ 2)
        </span>
      </div>
      <div class="adv-controls-row">
        <button class="adv-action-btn rose" id="adv-btn-highlight-euler">Highlight 12 Odd-Degree Vertices</button>
      </div>
    `;
    container.appendChild(euCard);

    const hamCard = document.createElement("div");
    hamCard.className = "adv-card";

    hamCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Hamiltonian Path & Circuit Analysis</span>
        </div>
        <span class="adv-badge-chip amber">Non-Hamiltonian</span>
      </div>
      <div class="adv-card-desc">
        A Hamiltonian path visits every vertex exactly once; a circuit returns to the start vertex.
      </div>
      <div class="adv-formula-box">
        Dirac's Condition: δ(G) ≥ n/2 = 14. Here min degree δ = 1 &lt; 14 (FAILS)
      </div>
      <div class="adv-card-desc">
        <strong>Cut-Set Non-Hamiltonicity Theorem:</strong> For any subset S ⊂ V, a Hamiltonian graph must satisfy c(G - S) ≤ |S|.
        <br>For S = {Data}, |S| = 1, but removing Data yields c(G - S) = 3 &gt; 1!
        <br>Also, pendant vertices (dataset, chessrules, strategy with deg=1) cannot participate in any 2-factor circuit.
      </div>
      <div class="adv-controls-row">
        <button class="adv-action-btn amber" id="adv-btn-highlight-hamilton">Demonstrate Cut-Set Violation (S={Data})</button>
      </div>
    `;
    container.appendChild(hamCard);

    document.getElementById("adv-btn-highlight-euler")?.addEventListener("click", () => {
      applyAdvancedVisuals2D("eulerian", { oddVertices: ea.oddVertices });
      if (threeEngine) threeEngine.setModeVisuals("eulerian", { oddVertices: ea.oddVertices });
    });

    document.getElementById("adv-btn-highlight-hamilton")?.addEventListener("click", () => {
      applyAdvancedVisuals2D("hamiltonian");
      if (threeEngine) threeEngine.setModeVisuals("hamiltonian");
    });
  }

  function renderAdvancedPlanarTab(container) {
    const pa = GRAPH.planarAnalysis(NODE_POSITIONS);

    const plCard = document.createElement("div");
    plCard.className = "adv-card";

    plCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Planar Graphs, Regions & Euler's Formula</span>
        </div>
        <span class="adv-badge-chip emerald">V - E + R = 1 + c</span>
      </div>
      <div class="adv-card-desc">
        A graph is planar if it can be drawn without edge crossings. In our layout:
        <br>• Edge Crossing Number: <strong>${pa.crossingsInLayout} crossings</strong>
        <br>• Graph Thickness: <strong>θ(G) ≤ ${pa.thicknessUpperBound}</strong> (can be decomposed into ≤ 2 planar subgraphs)
      </div>
      <div class="adv-formula-box">
        Euler's Planar Formula for K1: V - E + R = 2 ⟹ R = E - V + 2 = 37 - 25 + 2 = 14
      </div>
      <div class="adv-result-card">
        <span class="adv-result-title">Regions & Faces Breakdown (Component K1)</span>
        <span class="adv-result-val">Total Regions: 14 (13 Bounded Faces + 1 Exterior Unbounded Face)</span>
        <div style="font-size:11.5px; color:#14532D; margin-top:4px;">
          Sum of Region Degrees: <strong>Σ deg(R_i) = 2|E| = ${pa.regionDegreeSum}</strong> (Planar Handshaking Lemma)
        </div>
      </div>
      <div class="adv-controls-row">
        <button class="adv-action-btn" id="adv-btn-highlight-planar">Highlight Planar Network & Regions</button>
      </div>
    `;
    container.appendChild(plCard);

    document.getElementById("adv-btn-highlight-planar")?.addEventListener("click", () => {
      applyAdvancedVisuals2D("planar");
      if (threeEngine) threeEngine.setModeVisuals("planar");
    });
  }

  function renderAdvancedWalksTab(container) {
    const wCard = document.createElement("div");
    wCard.className = "adv-card";

    wCard.innerHTML = `
      <div class="adv-card-header">
        <div class="adv-card-title">
          <span>⚡ Traversal Taxonomy: Walks, Trails & Paths</span>
        </div>
        <span class="adv-badge-chip violet">Sequence Classifier</span>
      </div>
      <div class="adv-card-desc">
        Formal hierarchy of vertex-edge sequences in discrete mathematics:
        <br>• <strong>Walk:</strong> Any alternating sequence of vertices & edges. Repeats allowed.
        <br>• <strong>Trail:</strong> A walk with <em>distinct edges</em>. Vertices may repeat.
        <br>• <strong>Path:</strong> A walk with <em>distinct vertices</em> (hence distinct edges).
        <br>• <strong>Closed Walk:</strong> Walk where start = end.
        <br>• <strong>Circuit:</strong> Closed trail (distinct edges, start = end).
        <br>• <strong>Cycle:</strong> Closed path (distinct vertices except start = end, length ≥ 3).
      </div>
      <div class="adv-controls-row">
        <span style="font-size:11px; font-weight:700;">Test Presets:</span>
        <button class="adv-tab-btn" id="adv-btn-test-walk">Walk (Repeats)</button>
        <button class="adv-tab-btn" id="adv-btn-test-trail">Trail (Data repeated)</button>
        <button class="adv-tab-btn" id="adv-btn-test-path">Path (P1)</button>
        <button class="adv-tab-btn" id="adv-btn-test-cycle">Cycle (C1)</button>
      </div>
      <div id="adv-walk-results"></div>
    `;
    container.appendChild(wCard);

    const testSeq = (seq) => {
      ADVANCED_STATE.seqTest = seq;
      const cl = GRAPH.classifySequence(seq);
      const resDiv = document.getElementById("adv-walk-results");

      resDiv.innerHTML = `
        <div class="adv-result-card" style="margin-top:10px;">
          <span class="adv-result-title">Classification Result: ${cl.classification}</span>
          <span class="adv-result-val">${seq.map((id) => GRAPH.vertex(id)?.label || id).join(" ➔ ")}</span>
          <div style="font-size:11px; color:#14532D; margin-top:4px;">
            Length: <strong>${cl.length} edges</strong> | Distinct Vertices: <strong>${cl.distinctVertexCount}</strong> | Closed: <strong>${cl.isClosed ? "Yes" : "No"}</strong>
          </div>
          <div style="font-size:11px; color:#475569; margin-top:2px;">
            Walk: ${cl.isWalk ? "✓" : "✗"} | Trail: ${cl.isTrail ? "✓" : "✗"} | Path: ${cl.isPath ? "✓" : "✗"} | Circuit: ${cl.isCircuit ? "✓" : "✗"} | Cycle: ${cl.isCycle ? "✓" : "✗"}
          </div>
        </div>
      `;

      applyAdvancedVisuals2D("walks", { sequence: seq });
      if (threeEngine) threeEngine.setModeVisuals("dijkstra", { path: seq });
    };

    document.getElementById("adv-btn-test-walk")?.addEventListener("click", () => {
      testSeq(["data", "features", "patterns", "features", "data"]);
    });
    document.getElementById("adv-btn-test-trail")?.addEventListener("click", () => {
      testSeq(["data", "features", "patterns", "data", "ml", "data"]);
    });
    document.getElementById("adv-btn-test-path")?.addEventListener("click", () => {
      testSeq(["data", "features", "patterns", "prediction"]);
    });
    document.getElementById("adv-btn-test-cycle")?.addEventListener("click", () => {
      testSeq(["data", "training", "model", "prediction", "feedback", "data"]);
    });

    testSeq(ADVANCED_STATE.seqTest);
  }

  /**
   * Presentation Strip Controls
   */
  function togglePresentationMode() {
    if (presActive) {
      exitPresentationMode();
    } else {
      enterPresentationMode();
    }
  }

  function enterPresentationMode() {
    presActive = true;
    presCurrentSlide = 0;
    if (presentationStrip) presentationStrip.classList.add("active");
    document.body.classList.add("presentation-active");
    document.getElementById("btn-toggle-present")?.classList.add("active");
    document.getElementById("sub-btn-present")?.classList.add("active");
    renderCurrentSlide();
  }

  function exitPresentationMode() {
    presActive = false;
    if (presentationStrip) presentationStrip.classList.remove("active");
    document.body.classList.remove("presentation-active");
    document.getElementById("btn-toggle-present")?.classList.remove("active");
    document.getElementById("sub-btn-present")?.classList.remove("active");
  }

  function renderCurrentSlide() {
    const slide = PRESENTATION_SLIDES[presCurrentSlide];
    if (!slide) return;

    const badge = document.getElementById("pres-speaker-badge");
    badge.textContent = slide.speaker;
    badge.className = `pres-speaker-badge ${slide.speakerClass}`;

    document.getElementById("pres-slide-num").textContent = `Slide ${slide.index} / ${PRESENTATION_SLIDES.length}`;
    document.getElementById("pres-time-label").textContent = `${slide.plannedTime} (Elapsed ${slide.totalElapsed})`;

    document.getElementById("pres-slide-title").textContent = slide.title;

    const bulletsContainer = document.getElementById("pres-bullets");
    bulletsContainer.innerHTML = "";
    slide.bullets.forEach((bText) => {
      const bSpan = document.createElement("span");
      bSpan.className = "pres-bullet-item";
      bSpan.textContent = bText;
      bulletsContainer.appendChild(bSpan);
    });

    document.getElementById("pres-prev-btn").disabled = (presCurrentSlide === 0);
    document.getElementById("pres-next-btn").disabled = (presCurrentSlide === PRESENTATION_SLIDES.length - 1);

    // Execute slide's graph action
    slide.action();
  }

  function nextSlide() {
    if (presCurrentSlide < PRESENTATION_SLIDES.length - 1) {
      presCurrentSlide++;
      renderCurrentSlide();
    }
  }

  function prevSlide() {
    if (presCurrentSlide > 0) {
      presCurrentSlide--;
      renderCurrentSlide();
    }
  }

  // ---------------- 3D PARALLAX TILT & HARMONIC MOTION ENGINE ----------------
  let isMotionActive = true;
  let targetRotX = 0;
  let targetRotY = 0;
  let curRotX = 0;
  let curRotY = 0;

  const currentPositions = new Map();
  Object.entries(NODE_POSITIONS).forEach(([vid, pos]) => {
    currentPositions.set(vid, { x: pos.x, y: pos.y });
  });

  const vertexIndexMap = new Map();
  GRAPH.vertices.forEach((v, idx) => vertexIndexMap.set(v.id, idx));

  // 3D Parallax Mouse Tracking on Stage
  const stageEl = document.getElementById("stage");
  if (stageEl) {
    stageEl.addEventListener("mousemove", (e) => {
      const rect = stageEl.getBoundingClientRect();
      const normX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const normY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const cx = Math.max(-1, Math.min(1, normX));
      const cy = Math.max(-1, Math.min(1, normY));
      targetRotY = cx * 4.2;
      targetRotX = -cy * 3.6;
    });

    stageEl.addEventListener("mouseleave", () => {
      targetRotX = 0;
      targetRotY = 0;
    });
  }

  function updateOverlayBadges() {
    const badges = layerOverlays.querySelectorAll("[data-badge-vid]");
    badges.forEach((b) => {
      const vid = b.getAttribute("data-badge-vid");
      const cur = currentPositions.get(vid);
      if (cur) {
        b.setAttribute("transform", `translate(${cur.x + 14}, ${cur.y - 14})`);
      }
    });

    const cycleCenter = layerOverlays.querySelector(".cycle-center-symbol");
    if (cycleCenter && STATE.mode === "cycle") {
      const cObj = GRAPH.featured.cycles[STATE.selectedCycleId];
      if (cObj) {
        let sumX = 0, sumY = 0;
        const uVerts = cObj.vertices.slice(0, cObj.vertices.length - 1);
        uVerts.forEach((vid) => {
          const cur = currentPositions.get(vid);
          if (cur) { sumX += cur.x; sumY += cur.y; }
        });
        cycleCenter.setAttribute("x", (sumX / uVerts.length).toFixed(1));
        cycleCenter.setAttribute("y", (sumY / uVerts.length).toFixed(1));
      }
    }
  }

  function toggleMotion() {
    isMotionActive = !isMotionActive;
    const btn = document.getElementById("btn-toggle-motion");
    if (btn) {
      if (isMotionActive) {
        btn.classList.add("active");
        btn.classList.remove("paused");
        btn.title = "Toggle Organic Synaptic Motion (M) - Currently ACTIVE";
      } else {
        btn.classList.remove("active");
        btn.classList.add("paused");
        btn.title = "Toggle Organic Synaptic Motion (M) - Currently PAUSED";

        // Reset positions smoothly to base static coordinates
        Object.entries(NODE_POSITIONS).forEach(([vid, base]) => {
          currentPositions.set(vid, { x: base.x, y: base.y });
          const el = nodeDOMElements.get(vid);
          if (el && el.group) {
            el.group.setAttribute("transform", `translate(${base.x}, ${base.y})`);
          }
        });
        GRAPH.edges.forEach((edge) => {
          const p1 = NODE_POSITIONS[edge.a];
          const p2 = NODE_POSITIONS[edge.b];
          const el = edgeDOMElements.get(edge.id);
          if (el && p1 && p2) {
            el.line.setAttribute("x1", p1.x);
            el.line.setAttribute("y1", p1.y);
            el.line.setAttribute("x2", p2.x);
            el.line.setAttribute("y2", p2.y);
            el.hit.setAttribute("x1", p1.x);
            el.hit.setAttribute("y1", p1.y);
            el.hit.setAttribute("x2", p2.x);
            el.hit.setAttribute("y2", p2.y);
          }
        });
        updateOverlayBadges();
      }
    }
  }

  let curVbMinX = 0;
  let curVbWidth = 1600;

  // Organic Synaptic Animation Loop via requestAnimationFrame
  function runAnimationLoop(timestamp) {
    const t = timestamp * 0.001; // in seconds

    // Dynamic Camera ViewBox: shifts entire graph to the right when Lab HUD is open so no node is hidden
    const isLabActive = STATE.mode === "lab" && !LAB_STATE.isCollapsed;
    const targetVbMinX = isLabActive ? -560 : 0;
    const targetVbWidth = isLabActive ? 2160 : 1600;

    curVbMinX += (targetVbMinX - curVbMinX) * 0.1;
    curVbWidth += (targetVbWidth - curVbWidth) * 0.1;

    if (svg && (Math.abs(curVbMinX - targetVbMinX) > 0.2 || Math.abs(curVbWidth - targetVbWidth) > 0.2)) {
      svg.setAttribute("viewBox", `${curVbMinX.toFixed(1)} 0 ${curVbWidth.toFixed(1)} 1000`);
    }

    // 1. Mouse Tilt Lerp
    curRotX += (targetRotX - curRotX) * 0.08;
    curRotY += (targetRotY - curRotY) * 0.08;
    if (svg) {
      svg.style.transform = `rotateX(${curRotX.toFixed(2)}deg) rotateY(${curRotY.toFixed(2)}deg)`;
    }

    // 2. Harmonic Synaptic Floating
    if (isMotionActive) {
      GRAPH.vertices.forEach((v) => {
        const base = NODE_POSITIONS[v.id];
        if (!base) return;

        const idx = vertexIndexMap.get(v.id) || 0;
        const phase = idx * 0.73;
        // Central hub (AI) stays more anchored; leaf/pendant nodes float with slightly higher amplitude
        const amp = v.id === "ai" ? 1.4 : (GRAPH.degree(v.id) === 1 ? 3.4 : 2.2);
        const dx = Math.sin(t * 1.15 + phase) * amp;
        const dy = Math.cos(t * 0.88 + phase * 1.3) * (amp * 0.82);

        const curX = base.x + dx;
        const curY = base.y + dy;
        currentPositions.set(v.id, { x: curX, y: curY });

        const el = nodeDOMElements.get(v.id);
        if (el && el.group) {
          el.group.setAttribute("transform", `translate(${curX.toFixed(2)}, ${curY.toFixed(2)})`);
        }
      });

      // 3. Update Incident Edge Coordinates to follow moving nodes
      GRAPH.edges.forEach((edge) => {
        const p1 = currentPositions.get(edge.a);
        const p2 = currentPositions.get(edge.b);
        if (!p1 || !p2) return;

        const el = edgeDOMElements.get(edge.id);
        if (!el) return;

        el.line.setAttribute("x1", p1.x.toFixed(2));
        el.line.setAttribute("y1", p1.y.toFixed(2));
        el.line.setAttribute("x2", p2.x.toFixed(2));
        el.line.setAttribute("y2", p2.y.toFixed(2));

        el.hit.setAttribute("x1", p1.x.toFixed(2));
        el.hit.setAttribute("y1", p1.y.toFixed(2));
        el.hit.setAttribute("x2", p2.x.toFixed(2));
        el.hit.setAttribute("y2", p2.y.toFixed(2));
      });

      // 4. Update order badges in PATH or CYCLE modes
      if (STATE.mode === "path" || STATE.mode === "cycle") {
        updateOverlayBadges();
      }
    }

    requestAnimationFrame(runAnimationLoop);
  }

  // Setup Phase 3 Listeners
  function setupPhase3Listeners() {
    const motionBtn = document.getElementById("btn-toggle-motion");
    if (motionBtn) {
      motionBtn.addEventListener("click", toggleMotion);
    }

    const examinerBtn = document.getElementById("btn-toggle-examiner");
    if (examinerBtn) {
      examinerBtn.addEventListener("click", () => {
        if (STATE.mode === "lab" && LAB_STATE.activeTab === "examiner") {
          window.AI_GRAPH_APP.exitLab();
        } else {
          window.AI_GRAPH_APP.enterLab("examiner");
        }
      });
    }

    const labCloseBtn = document.getElementById("lab-close-btn");
    if (labCloseBtn) {
      labCloseBtn.addEventListener("click", () => {
        window.AI_GRAPH_APP.exitLab();
      });
    }

    const labCollapseBtn = document.getElementById("lab-collapse-btn");
    const labExpandPill = document.getElementById("lab-expand-pill");
    const labHudEl = document.getElementById("lab-hud");

    if (labCollapseBtn) {
      labCollapseBtn.addEventListener("click", () => {
        LAB_STATE.isCollapsed = true;
        if (labHudEl) labHudEl.classList.add("collapsed");
        if (labExpandPill) labExpandPill.style.display = "inline-flex";
      });
    }

    if (labExpandPill) {
      labExpandPill.addEventListener("click", () => {
        LAB_STATE.isCollapsed = false;
        if (labHudEl) labHudEl.classList.remove("collapsed");
        labExpandPill.style.display = "none";
      });
    }

    const labTabs = document.getElementById("lab-tabs");
    if (labTabs) {
      labTabs.addEventListener("click", (e) => {
        const btn = e.target.closest(".lab-tab-btn");
        if (!btn) return;
        const tab = btn.getAttribute("data-tab");
        if (tab) setLabTab(tab);
      });
    }

    document.getElementById("btn-drawer-theory").addEventListener("click", () => {
      if (activeDrawer === "theory") closeDrawers();
      else openDrawer("theory");
    });

    document.getElementById("btn-drawer-advanced")?.addEventListener("click", () => {
      if (activeDrawer === "advanced") closeDrawers();
      else openDrawer("advanced");
    });

    document.getElementById("adv-tabs-bar")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".adv-tab-btn");
      if (!btn) return;
      const tab = btn.getAttribute("data-adv-tab");
      if (tab) {
        ADVANCED_STATE.activeTab = tab;
        renderAdvancedDrawerContent();
      }
    });

    document.getElementById("btn-drawer-analysis").addEventListener("click", () => {
      if (activeDrawer === "analysis") closeDrawers();
      else openDrawer("analysis");
    });

    document.getElementById("btn-drawer-diary").addEventListener("click", () => {
      if (activeDrawer === "diary") closeDrawers();
      else openDrawer("diary");
    });

    document.getElementById("btn-toggle-present").addEventListener("click", togglePresentationMode);

    document.querySelectorAll("[data-close-drawer]").forEach((btn) => {
      btn.addEventListener("click", closeDrawers);
    });

    document.getElementById("pres-prev-btn").addEventListener("click", prevSlide);
    document.getElementById("pres-next-btn").addEventListener("click", nextSlide);
    document.getElementById("pres-exit-btn").addEventListener("click", exitPresentationMode);

    // Apple-style Quick Concept Search
    const searchInput = document.getElementById("node-search-input");
    const searchDropdown = document.getElementById("search-dropdown");

    if (searchInput && searchDropdown) {
      function renderSearchDropdown(query) {
        const q = (query || "").trim().toLowerCase();
        if (!q) {
          searchDropdown.style.display = "none";
          searchDropdown.innerHTML = "";
          return;
        }

        const matches = GRAPH.vertices.filter((v) =>
          v.label.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q) ||
          v.domain.toLowerCase().includes(q)
        ).slice(0, 7);

        if (matches.length === 0) {
          searchDropdown.innerHTML = `<div class="search-item" style="cursor:default; color:var(--text-muted);">No concepts found for "${query}"</div>`;
          searchDropdown.style.display = "flex";
          return;
        }

        searchDropdown.innerHTML = matches.map((v) => {
          const dom = GRAPH.domains[v.domain];
          return `
            <div class="search-item" data-vid="${v.id}">
              <div>
                <strong>${v.label}</strong>
                <span style="font-size:10.5px; opacity:0.6; margin-left:6px;">(${v.id})</span>
              </div>
              <span class="search-item-badge" style="background:${dom.bg}; color:${dom.color}; border:1px solid ${dom.border};">${dom.label}</span>
            </div>
          `;
        }).join("");

        searchDropdown.style.display = "flex";
      }

      searchInput.addEventListener("input", (e) => {
        renderSearchDropdown(e.target.value);
      });

      searchInput.addEventListener("focus", (e) => {
        if (e.target.value) renderSearchDropdown(e.target.value);
      });

      searchDropdown.addEventListener("click", (e) => {
        const item = e.target.closest(".search-item");
        if (!item) return;
        const vid = item.getAttribute("data-vid");
        if (vid) {
          handleVertexClick(vid);
          if (threeEngine) threeEngine.focusNode(vid, 900);
          searchDropdown.style.display = "none";
          searchInput.value = "";
          searchInput.blur();
        }
      });

      document.addEventListener("click", (e) => {
        if (!e.target.closest("#search-pill")) {
          searchDropdown.style.display = "none";
        }
      });

      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const firstItem = searchDropdown.querySelector(".search-item[data-vid]");
          if (firstItem) {
            const vid = firstItem.getAttribute("data-vid");
            handleVertexClick(vid);
            if (threeEngine) threeEngine.focusNode(vid, 900);
            searchDropdown.style.display = "none";
            searchInput.value = "";
            searchInput.blur();
          }
        } else if (e.key === "Escape") {
          searchDropdown.style.display = "none";
          searchInput.blur();
        }
      });
    }

    // Floating 3D Camera Dock Controls
    const btnResetCam = document.getElementById("btn-reset-cam");
    if (btnResetCam) {
      btnResetCam.addEventListener("click", () => {
        if (threeEngine) threeEngine.resetCamera(1000);
      });
    }

    const btnFocusAi = document.getElementById("btn-focus-ai");
    if (btnFocusAi) {
      btnFocusAi.addEventListener("click", () => {
        handleVertexClick("ai");
        if (threeEngine) threeEngine.focusNode("ai", 1000);
      });
    }

    // 3D / 2D View Switcher Controls
    const btnView3D = document.getElementById("btn-view-3d");
    const btnView2D = document.getElementById("btn-view-2d");
    if (btnView3D) {
      btnView3D.addEventListener("click", () => switchView("3d"));
    }
    if (btnView2D) {
      btnView2D.addEventListener("click", () => switchView("2d"));
    }

    // 2D Dashboard Domain Filter Pills
    const domainPills = document.querySelectorAll(".dash-domain-pill");
    domainPills.forEach((pill) => {
      pill.addEventListener("click", () => {
        domainPills.forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const domain = pill.getAttribute("data-domain");
        setDomainFilter(domain);
      });
    });

    // Global keyboard shortcuts for Phase 3 & Motion & Search & Views
    window.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        if (activeDrawer) closeDrawers();
        if (presActive) exitPresentationMode();
      } else if (e.key === "/") {
        e.preventDefault();
        const input = document.getElementById("node-search-input");
        if (input) {
          input.focus();
          input.select();
        }
      } else if (e.key.toLowerCase() === "v") {
        switchView(STATE.currentView === "3d" ? "2d" : "3d");
      } else if (e.key.toLowerCase() === "m") {
        toggleMotion();
      } else if (e.key.toLowerCase() === "t") {
        if (activeDrawer === "theory") closeDrawers();
        else openDrawer("theory");
      } else if (e.key.toLowerCase() === "a") {
        if (activeDrawer === "analysis") closeDrawers();
        else openDrawer("analysis");
      } else if (e.key.toLowerCase() === "d") {
        if (activeDrawer === "diary") closeDrawers();
        else openDrawer("diary");
      } else if (e.key.toLowerCase() === "x") {
        if (activeDrawer === "advanced") closeDrawers();
        else openDrawer("advanced");
      } else if (e.key.toLowerCase() === "p") {
        togglePresentationMode();
      } else if (presActive && (e.key === "ArrowRight" || e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        nextSlide();
      } else if (presActive && (e.key === "ArrowLeft" || e.key === "Backspace")) {
        e.preventDefault();
        prevSlide();
      }
    });
  }

  // Global window methods for UI actions and presentation
  window.AI_GRAPH_APP = {
    setMode: (modeName) => {
      const btn = document.querySelector(`.mode-btn[data-mode="${modeName}"]`);
      if (btn) btn.click();
      else {
        STATE.mode = modeName;
        applyMode();
      }
    },
    enterLab: (tab = "m1") => {
      STATE.mode = "lab";
      LAB_STATE.isCollapsed = false;
      const labHudEl = document.getElementById("lab-hud");
      if (labHudEl) labHudEl.classList.remove("collapsed");
      const labExpandPill = document.getElementById("lab-expand-pill");
      if (labExpandPill) labExpandPill.style.display = "none";
      document.querySelectorAll("#mode-nav .mode-btn").forEach((b) => b.classList.remove("active"));
      document.getElementById("btn-mode-lab")?.classList.add("active");
      applyMode();
      setLabTab(tab);
    },
    exitLab: () => {
      STATE.mode = "normal";
      LAB_STATE.isCollapsed = false;
      const labHudEl = document.getElementById("lab-hud");
      if (labHudEl) labHudEl.classList.remove("collapsed");
      const labExpandPill = document.getElementById("lab-expand-pill");
      if (labExpandPill) labExpandPill.style.display = "none";
      document.querySelectorAll("#mode-nav .mode-btn").forEach((b) => b.classList.remove("active"));
      document.querySelector(`#mode-nav .mode-btn[data-mode="normal"]`)?.classList.add("active");
      applyMode();
    },
    setLabTab: setLabTab,
    triggerGlitch: triggerGlitch,
    restoreGlitch: restoreGlitch,
    runExaminerDemo: runExaminerDemo,
    runGraphScanner: runGraphScanner,
    clickVertex: (vId) => {
      handleVertexClick(vId);
    },
    selectVertex: (vId) => {
      handleVertexClick(vId);
    },
    selectEdge: (eId) => {
      selectElement("edge", eId);
    },
    setPath: (pathId) => {
      STATE.mode = "path";
      STATE.selectedPathId = pathId;
      STATE.pathCustomPair = [];
      const btn = document.querySelector(`.mode-btn[data-mode="path"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    setPathCustom: (fromId, toId) => {
      STATE.mode = "path";
      STATE.pathCustomPair = [fromId, toId];
      const btn = document.querySelector(`.mode-btn[data-mode="path"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    setCycle: (cycleId) => {
      STATE.mode = "cycle";
      STATE.selectedCycleId = cycleId;
      const btn = document.querySelector(`.mode-btn[data-mode="cycle"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    setSubgraph: (subId) => {
      STATE.mode = "subgraph";
      STATE.selectedSubgraphs = new Set([subId]);
      const btn = document.querySelector(`.mode-btn[data-mode="subgraph"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    removeDataCutVertex: () => {
      STATE.mode = "component";
      STATE.removedVertices = ["data"];
      STATE.removedEdges = [];
      const btn = document.querySelector(`.mode-btn[data-mode="component"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    restoreComponents: () => {
      STATE.mode = "component";
      STATE.removedVertices = [];
      STATE.removedEdges = [];
      const btn = document.querySelector(`.mode-btn[data-mode="component"]`);
      if (btn) {
        document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      }
      applyMode();
    },
    openDrawer: openDrawer,
    closeDrawers: closeDrawers,
    enterPresentation: enterPresentationMode,
    exitPresentation: exitPresentationMode,
    toggleMotion: toggleMotion,
    isMotionActive: () => isMotionActive,
    get3DEngine: () => threeEngine,
    resetCamera: () => { if (threeEngine) threeEngine.resetCamera(); },
    focusNode: (id) => { if (threeEngine) threeEngine.focusNode(id); },
    switchView: switchView,
    getView: () => STATE.currentView,
    setDomainFilter: setDomainFilter
  };

  // Hash routing for direct navigation and screenshot captures
  function handleHashState() {
    const hash = window.location.hash.toLowerCase();
    const presMatch = hash.match(/^#presentation-?(\d+)?$/);

    if (hash === "#2d" || hash === "#dashboard") switchView("2d");
    else if (hash === "#3d") switchView("3d");
    else if (hash === "#present" || hash === "#presentation" || presMatch) {
      window.AI_GRAPH_APP.enterPresentation();
      if (presMatch && presMatch[1]) {
        const slideIdx = parseInt(presMatch[1], 10) - 1;
        if (slideIdx >= 0 && slideIdx < PRESENTATION_SLIDES.length) {
          presCurrentSlide = slideIdx;
          renderCurrentSlide();
        }
      }
    }
    else if (hash === "#normal") window.AI_GRAPH_APP.setMode("normal");
    else if (hash === "#degree") window.AI_GRAPH_APP.setMode("degree");
    else if (hash === "#path-p1") window.AI_GRAPH_APP.setPath("P1");
    else if (hash === "#cycle-c1") window.AI_GRAPH_APP.setCycle("C1");
    else if (hash === "#subgraph-s2") window.AI_GRAPH_APP.setSubgraph("S2");
    else if (hash === "#comp-cut") window.AI_GRAPH_APP.removeDataCutVertex();
    else if (hash === "#diary") window.AI_GRAPH_APP.openDrawer("diary");
    else if (hash === "#theory") window.AI_GRAPH_APP.openDrawer("theory");
    else if (hash === "#analysis") window.AI_GRAPH_APP.openDrawer("analysis");
    else if (hash === "#lab" || hash === "#lab-m1") window.AI_GRAPH_APP.enterLab("m1");
    else if (hash === "#lab-m2") window.AI_GRAPH_APP.enterLab("m2");
    else if (hash === "#lab-m3") window.AI_GRAPH_APP.enterLab("m3");
    else if (hash === "#lab-m4") window.AI_GRAPH_APP.enterLab("m4");
    else if (hash === "#glitch") window.AI_GRAPH_APP.enterLab("glitch");
    else if (hash === "#scanner") window.AI_GRAPH_APP.enterLab("scanner");
    else if (hash === "#examiner") window.AI_GRAPH_APP.enterLab("examiner");
    else if (presMatch) {
      window.AI_GRAPH_APP.enterPresentation();
      if (presMatch[1]) {
        const slideIdx = parseInt(presMatch[1], 10) - 1;
        if (slideIdx >= 0 && slideIdx < PRESENTATION_SLIDES.length) {
          presCurrentSlide = slideIdx;
          renderCurrentSlide();
        }
      }
    }
  }
  window.addEventListener("hashchange", handleHashState);

  // Initialize Three.js 3D Knowledge Graph Universe
  function initThreeEngine() {
    const container = document.getElementById("three-viewport");
    if (!container) return;

    try {
      const gData = (typeof GRAPH !== "undefined" ? GRAPH : null) || (typeof window !== "undefined" ? window.GRAPH : null);
      threeEngine = new ThreeGraphEngine(container, {
        graphData: gData,
        onNodeClick: (nodeId) => {
          handleVertexClick(nodeId);
        },
        onEdgeClick: (edgeId) => {
          selectElement("edge", edgeId);
        },
        onBackgroundClick: () => {
          clearSelection();
        }
      });
      switchView("3d");
    } catch (err) {
      console.warn("ThreeGraphEngine 3D WebGL initialization error, maintaining 2D SVG fallback:", err);
      switchView("2d");
    }
  }

  // Initialize
  initGraphDOM();
  initThreeEngine();
  setupModeNav();
  setupPhase3Listeners();
  applyMode();
  handleHashState();
  requestAnimationFrame(runAnimationLoop);
})();

