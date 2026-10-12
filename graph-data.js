/**
 * Graph Data and Pure Math Functions for "Inside an AI's Mind: When Knowledge Becomes a Graph"
 * CIA III-B Mini Project, Graph Theory in My World.
 *
 * Works in both browser (<script>) and Node (require/import).
 */

const GRAPH = {
  domains: {
    core: { id: "core", name: "Core", color: "#FFD166" },
    learning: { id: "learning", name: "Learning and Data", color: "#22D3EE" },
    vision: { id: "vision", name: "Computer Vision", color: "#F472B6" },
    nlp: { id: "nlp", name: "Language (NLP)", color: "#4ADE80" },
    reasoning: { id: "reasoning", name: "Reasoning", color: "#FB923C" },
    special: { id: "special", name: "Specialized Knowledge", color: "#A78BFA" }
  },

  vertices: [
    { id: "ai", label: "AI", domain: "core", meaning: "The whole system whose knowledge we model" },
    { id: "ml", label: "Machine Learning", domain: "learning", meaning: "AI that learns from examples" },
    { id: "dl", label: "Deep Learning", domain: "learning", meaning: "ML using many-layered neural networks" },
    { id: "nn", label: "Neural Network", domain: "learning", meaning: "Layers of connected units that learn patterns" },
    { id: "training", label: "Training", domain: "learning", meaning: "Adjusting the model using data" },
    { id: "model", label: "Model", domain: "learning", meaning: "What the AI has learned, ready to use" },
    { id: "prediction", label: "Prediction", domain: "learning", meaning: "The AI's best guess about something new" },
    { id: "feedback", label: "Feedback", domain: "learning", meaning: "Information on how good a prediction was" },
    { id: "data", label: "Data", domain: "learning", meaning: "Raw information the AI learns from" },
    { id: "dataset", label: "Dataset", domain: "learning", meaning: "An organised collection of data" },
    { id: "features", label: "Features", domain: "learning", meaning: "Measurable details taken from data" },
    { id: "patterns", label: "Patterns", domain: "learning", meaning: "Regularities found in features" },
    { id: "cv", label: "Computer Vision", domain: "vision", meaning: "AI that understands pictures" },
    { id: "image", label: "Image", domain: "vision", meaning: "A picture given to the AI" },
    { id: "objdet", label: "Object Detection", domain: "vision", meaning: "Finding objects inside an image" },
    { id: "recognition", label: "Recognition", domain: "vision", meaning: "Naming what a detected object is" },
    { id: "nlp", label: "NLP", domain: "nlp", meaning: "AI that understands human language" },
    { id: "language", label: "Language", domain: "nlp", meaning: "A system of words and rules" },
    { id: "words", label: "Words", domain: "nlp", meaning: "Basic units of language" },
    { id: "text", label: "Text", domain: "nlp", meaning: "Written language" },
    { id: "meaning", label: "Meaning", domain: "nlp", meaning: "What words actually express" },
    { id: "context", label: "Context", domain: "nlp", meaning: "Surrounding situation that fixes meaning" },
    { id: "knowledge", label: "Knowledge", domain: "reasoning", meaning: "Organised understanding the AI can use" },
    { id: "reasoning", label: "Reasoning", domain: "reasoning", meaning: "Drawing conclusions from knowledge" },
    { id: "decision", label: "Decision", domain: "reasoning", meaning: "Choosing an action from conclusions" },
    { id: "chessrules", label: "Chess Rules", domain: "special", meaning: "The legal moves of chess" },
    { id: "gametree", label: "Game Tree", domain: "special", meaning: "All possible move sequences" },
    { id: "strategy", label: "Strategy", domain: "special", meaning: "A plan chosen by searching the game tree" }
  ],

  edges: [
    { id: "E1", a: "ai", b: "ml", meaning: "ML is the learning branch of AI" },
    { id: "E2", a: "ai", b: "cv", meaning: "Computer Vision lets AI see" },
    { id: "E3", a: "ai", b: "nlp", meaning: "NLP lets AI handle human language" },
    { id: "E4", a: "ai", b: "data", meaning: "AI depends on data" },
    { id: "E5", a: "ai", b: "knowledge", meaning: "AI keeps what it learned as knowledge" },
    { id: "E6", a: "ml", b: "dl", meaning: "Deep Learning is a type of ML" },
    { id: "E7", a: "ml", b: "training", meaning: "ML models learn through training" },
    { id: "E8", a: "ml", b: "prediction", meaning: "ML produces predictions" },
    { id: "E9", a: "ml", b: "model", meaning: "ML builds models" },
    { id: "E10", a: "dl", b: "nn", meaning: "Deep Learning uses neural networks" },
    { id: "E11", a: "nn", b: "training", meaning: "A neural network is adjusted by training" },
    { id: "E12", a: "nn", b: "model", meaning: "A trained neural network is a model" },
    { id: "E13", a: "training", b: "model", meaning: "Training shapes the model" },
    { id: "E14", a: "model", b: "prediction", meaning: "The model makes predictions" },
    { id: "E15", a: "prediction", b: "feedback", meaning: "Prediction results create feedback" },
    { id: "E16", a: "feedback", b: "data", meaning: "Feedback becomes new data" },
    { id: "E17", a: "data", b: "training", meaning: "Training uses data" },
    { id: "E18", a: "data", b: "dataset", meaning: "A dataset is an organised collection of data" },
    { id: "E19", a: "data", b: "features", meaning: "Features are extracted from data" },
    { id: "E20", a: "features", b: "patterns", meaning: "Patterns are found in features" },
    { id: "E21", a: "patterns", b: "prediction", meaning: "Patterns support predictions" },
    { id: "E22", a: "cv", b: "image", meaning: "Computer Vision works on images" },
    { id: "E23", a: "image", b: "objdet", meaning: "Objects are detected in an image" },
    { id: "E24", a: "objdet", b: "recognition", meaning: "Detected objects get recognised" },
    { id: "E25", a: "recognition", b: "knowledge", meaning: "Recognition adds to knowledge" },
    { id: "E26", a: "image", b: "data", meaning: "An image is a kind of data" },
    { id: "E27", a: "nlp", b: "language", meaning: "NLP studies language" },
    { id: "E28", a: "language", b: "words", meaning: "Language is built from words" },
    { id: "E29", a: "words", b: "meaning", meaning: "Words carry meaning" },
    { id: "E30", a: "meaning", b: "context", meaning: "Context decides meaning" },
    { id: "E31", a: "language", b: "text", meaning: "Language is written as text" },
    { id: "E32", a: "text", b: "words", meaning: "Text is made of words" },
    { id: "E33", a: "context", b: "knowledge", meaning: "Context helps place knowledge" },
    { id: "E34", a: "text", b: "data", meaning: "Text is a kind of data" },
    { id: "E35", a: "knowledge", b: "reasoning", meaning: "Reasoning uses knowledge" },
    { id: "E36", a: "reasoning", b: "decision", meaning: "Reasoning leads to decisions" },
    { id: "E37", a: "decision", b: "prediction", meaning: "Decisions rely on predictions" },
    { id: "E38", a: "chessrules", b: "gametree", meaning: "Rules generate the game tree" },
    { id: "E39", a: "gametree", b: "strategy", meaning: "Strategy searches the game tree" }
  ],

  featured: {
    paths: {
      P1: {
        id: "P1",
        name: "Learning path",
        vertices: ["data", "features", "patterns", "prediction"],
        description: "data -> features -> patterns -> prediction"
      },
      P2: {
        id: "P2",
        name: "Seeing path",
        vertices: ["image", "objdet", "recognition", "knowledge"],
        description: "image -> objdet -> recognition -> knowledge"
      },
      P3: {
        id: "P3",
        name: "Language path",
        vertices: ["language", "words", "meaning", "context"],
        description: "language -> words -> meaning -> context"
      }
    },
    cycles: {
      C1: {
        id: "C1",
        name: "Learning loop",
        vertices: ["data", "training", "model", "prediction", "feedback", "data"],
        description: "data -> training -> model -> prediction -> feedback -> data"
      },
      C2: {
        id: "C2",
        name: "Training loop",
        vertices: ["training", "model", "nn", "training"],
        description: "training -> model -> nn -> training"
      },
      C3: {
        id: "C3",
        name: "Text & Words triangle",
        vertices: ["language", "words", "text", "language"],
        description: "language -> words -> text -> language"
      }
    },
    subgraphs: {
      S1: {
        id: "S1",
        name: "Learning and Prediction",
        vertices: ["ml", "dl", "nn", "training", "model", "prediction", "feedback", "data", "dataset", "features", "patterns"],
        domain: "learning"
      },
      S2: {
        id: "S2",
        name: "Computer Vision",
        vertices: ["cv", "image", "objdet", "recognition"],
        domain: "vision"
      },
      S3: {
        id: "S3",
        name: "Natural Language (NLP)",
        vertices: ["nlp", "language", "words", "text", "meaning", "context"],
        domain: "nlp"
      },
      S4: {
        id: "S4",
        name: "Reasoning",
        vertices: ["knowledge", "reasoning", "decision"],
        domain: "reasoning"
      }
    },
    components: {
      K1: {
        id: "K1",
        name: "Main Knowledge Network",
        vertices: [
          "ai", "ml", "dl", "nn", "training", "model", "prediction", "feedback",
          "data", "dataset", "features", "patterns", "cv", "image", "objdet",
          "recognition", "nlp", "language", "words", "text", "meaning",
          "context", "knowledge", "reasoning", "decision"
        ]
      },
      K2: {
        id: "K2",
        name: "Specialized Knowledge",
        vertices: ["chessrules", "gametree", "strategy"]
      }
    }
  },

  // ---------------- Pure Graph Theory Functions ----------------

  /**
   * Returns array of adjacent vertex IDs
   */
  neighbors(id) {
    const n = [];
    for (let i = 0; i < this.edges.length; i++) {
      const e = this.edges[i];
      if (e.a === id) {
        n.push(e.b);
      } else if (e.b === id) {
        n.push(e.a);
      }
    }
    return n;
  },

  /**
   * Degree of a vertex: number of incident edges
   */
  degree(id) {
    return this.neighbors(id).length;
  },

  /**
   * Degree sequence: sorted descending array of degrees
   * scope: "main" (K1) | "all" (whole graph G)
   */
  degreeSequence(scope = "all") {
    let vList = this.vertices;
    if (scope === "main") {
      vList = vList.filter((v) => v.domain !== "special");
    }
    const degs = vList.map((v) => this.degree(v.id));
    degs.sort((a, b) => b - a);
    return degs;
  },

  /**
   * Connected components of the graph, optionally after removing vertices/edges.
   * Returns array of components, each { vertices: string[], edgeCount: number }
   * sorted by vertex count descending.
   */
  components(removedVertices = [], removedEdges = []) {
    const remVSet = new Set(removedVertices);
    const remESet = new Set(removedEdges);

    // Filter active vertices
    const activeVertices = this.vertices
      .map((v) => v.id)
      .filter((id) => !remVSet.has(id));

    // Build active adjacency list
    const adj = {};
    for (const v of activeVertices) {
      adj[v] = [];
    }

    // Active edges
    const activeEdges = [];
    for (const e of this.edges) {
      if (remESet.has(e.id)) continue;
      if (remVSet.has(e.a) || remVSet.has(e.b)) continue;
      activeEdges.push(e);
      if (adj[e.a] && adj[e.b]) {
        adj[e.a].push(e.b);
        adj[e.b].push(e.a);
      }
    }

    const visited = new Set();
    const result = [];

    for (const v of activeVertices) {
      if (visited.has(v)) continue;

      const compVertices = [];
      const queue = [v];
      visited.add(v);

      while (queue.length > 0) {
        const curr = queue.shift();
        compVertices.push(curr);
        for (const neighbor of adj[curr] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      // Count edges in this component
      const compVSet = new Set(compVertices);
      let compEdgeCount = 0;
      for (const e of activeEdges) {
        if (compVSet.has(e.a) && compVSet.has(e.b)) {
          compEdgeCount++;
        }
      }

      result.push({
        vertices: compVertices,
        edgeCount: compEdgeCount
      });
    }

    // Sort descending by number of vertices
    result.sort((a, b) => b.vertices.length - a.vertices.length);
    return result;
  },

  /**
   * Finds shortest path between from and to (BFS).
   * Returns array of vertex IDs [from, ..., to] or null if not connected.
   */
  shortestPath(from, to, removedVertices = []) {
    if (from === to) return [from];
    const remVSet = new Set(removedVertices);
    if (remVSet.has(from) || remVSet.has(to)) return null;

    const queue = [[from]];
    const visited = new Set([from]);

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      for (const n of this.neighbors(curr)) {
        if (remVSet.has(n)) continue;
        if (n === to) {
          return [...path, to];
        }
        if (!visited.has(n)) {
          visited.add(n);
          queue.push([...path, n]);
        }
      }
    }

    return null;
  },

  /**
   * Validates if a list of vertex IDs forms a valid path in G.
   * Path: no repeated vertices, consecutive vertices connected by an edge.
   */
  isPath(list) {
    if (!Array.isArray(list) || list.length < 1) return false;
    // Check all vertices exist
    const vSet = new Set(this.vertices.map((v) => v.id));
    for (const id of list) {
      if (!vSet.has(id)) return false;
    }
    // Check no repeated vertices
    const seen = new Set(list);
    if (seen.size !== list.length) return false;

    // Check consecutive edges
    for (let i = 0; i < list.length - 1; i++) {
      const u = list[i];
      const v = list[i + 1];
      if (!this.neighbors(u).includes(v)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Validates if a list of vertex IDs forms a valid cycle in G.
   * Cycle: closed path of length >= 3 (starts and ends at the same vertex,
   * no other vertex repeated).
   */
  isCycle(list) {
    if (!Array.isArray(list) || list.length < 4) return false; // length >= 3 edges means at least 4 entries [v0, v1, v2, v0]
    if (list[0] !== list[list.length - 1]) return false;

    const inner = list.slice(0, list.length - 1);
    const vSet = new Set(this.vertices.map((v) => v.id));
    for (const id of inner) {
      if (!vSet.has(id)) return false;
    }
    const seen = new Set(inner);
    if (seen.size !== inner.length) return false;

    for (let i = 0; i < list.length - 1; i++) {
      const u = list[i];
      const v = list[i + 1];
      if (!this.neighbors(u).includes(v)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Induced Subgraph by a given array of vertex IDs:
   * contains all vertices and all edges of G whose endpoints are both in vertexIds.
   * boundaryEdges: edges of G with exactly one endpoint in vertexIds.
   */
  inducedSubgraph(vertexIds) {
    const vSet = new Set(vertexIds);
    const internalEdges = [];
    const boundaryEdges = [];

    for (const e of this.edges) {
      const aIn = vSet.has(e.a);
      const bIn = vSet.has(e.b);
      if (aIn && bIn) {
        internalEdges.push(e);
      } else if (aIn || bIn) {
        boundaryEdges.push(e);
      }
    }

    return {
      vertexCount: vertexIds.length,
      edgeCount: internalEdges.length,
      edges: internalEdges,
      boundaryEdges: boundaryEdges
    };
  },

  /**
   * Returns true if removing vertex id increases the number of connected components.
   */
  isCutVertex(id) {
    const baseCount = this.components().length;
    const newCount = this.components([id], []).length;
    // For a cut vertex in an connected piece of size > 1, removing it splits that piece,
    // so total component count increases.
    return newCount > baseCount;
  },

  /**
   * Returns true if removing edgeId increases the number of connected components.
   */
  isBridge(edgeId) {
    const baseCount = this.components().length;
    const newCount = this.components([], [edgeId]).length;
    return newCount > baseCount;
  },

  /**
   * Handshaking lemma: sum of degrees = 2 * edgeCount
   */
  handshake(scope = "all") {
    let degSum = 0;
    let edgeCnt = 0;

    if (scope === "main") {
      const k1Vertices = this.vertices.filter((v) => v.domain !== "special").map((v) => v.id);
      const k1Set = new Set(k1Vertices);
      degSum = k1Vertices.reduce((sum, vid) => sum + this.degree(vid), 0);
      edgeCnt = this.edges.filter((e) => k1Set.has(e.a) && k1Set.has(e.b)).length;
    } else {
      degSum = this.vertices.reduce((sum, v) => sum + this.degree(v.id), 0);
      edgeCnt = this.edges.length;
    }

    return {
      degreeSum: degSum,
      edgeCount: edgeCnt,
      holds: degSum === 2 * edgeCnt
    };
  },

  /**
   * Single-source shortest path using Dijkstra's Algorithm
   */
  dijkstra(startId, targetId = null, customWeights = {}) {
    const distances = {};
    const previous = {};
    const unvisited = new Set();
    const trace = [];

    this.vertices.forEach((v) => {
      distances[v.id] = v.id === startId ? 0 : Infinity;
      previous[v.id] = null;
      unvisited.add(v.id);
    });

    while (unvisited.size > 0) {
      let curr = null;
      let minD = Infinity;
      for (const vid of unvisited) {
        if (distances[vid] < minD) {
          minD = distances[vid];
          curr = vid;
        }
      }

      if (!curr || minD === Infinity) break;
      unvisited.delete(curr);

      const stepRecord = {
        vertex: curr,
        distance: minD,
        relaxations: []
      };

      if (targetId && curr === targetId) {
        trace.push(stepRecord);
        break;
      }

      for (const e of this.edges) {
        let nbr = null;
        if (e.a === curr) nbr = e.b;
        else if (e.b === curr) nbr = e.a;

        if (nbr && unvisited.has(nbr)) {
          const w = (customWeights && customWeights[e.id] !== undefined) ? customWeights[e.id] : 1;
          const alt = distances[curr] + w;
          if (alt < distances[nbr]) {
            stepRecord.relaxations.push({
              neighbor: nbr,
              edgeId: e.id,
              oldDist: distances[nbr],
              newDist: alt
            });
            distances[nbr] = alt;
            previous[nbr] = curr;
          }
        }
      }

      trace.push(stepRecord);
    }

    const getPath = (dest) => {
      if (distances[dest] === Infinity) return null;
      const path = [];
      let c = dest;
      while (c) {
        path.unshift(c);
        c = previous[c];
      }
      return path;
    };

    return {
      startId,
      distances,
      previous,
      trace,
      getPath: targetId ? getPath(targetId) : null,
      pathTo: getPath
    };
  },

  /**
   * All-pairs shortest path using Floyd-Warshall Algorithm O(V^3)
   */
  floydWarshall() {
    const vList = this.vertices.map((v) => v.id);
    const n = vList.length;
    const vIndex = {};
    vList.forEach((id, idx) => { vIndex[id] = idx; });

    const dist = Array.from({ length: n }, () => Array(n).fill(Infinity));
    const next = Array.from({ length: n }, () => Array(n).fill(null));

    for (let i = 0; i < n; i++) {
      dist[i][i] = 0;
      next[i][i] = vList[i];
    }

    for (const e of this.edges) {
      const u = vIndex[e.a];
      const v = vIndex[e.b];
      dist[u][v] = 1;
      dist[v][u] = 1;
      next[u][v] = e.b;
      next[v][u] = e.a;
    }

    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
            next[i][j] = next[i][k];
          }
        }
      }
    }

    const k1Nodes = this.vertices.filter((v) => v.domain !== "special").map((v) => v.id);
    const eccentricity = {};
    let diameter = 0;

    k1Nodes.forEach((uId) => {
      const u = vIndex[uId];
      let maxD = 0;
      k1Nodes.forEach((vId) => {
        const v = vIndex[vId];
        const d = dist[u][v];
        if (d > maxD && d < Infinity) {
          maxD = d;
        }
      });
      eccentricity[uId] = maxD;
      if (maxD > diameter) {
        diameter = maxD;
      }
    });

    const radius = Math.min(...Object.values(eccentricity));
    const center = k1Nodes.filter((id) => eccentricity[id] === radius);

    const getShortestPath = (uId, vId) => {
      const u = vIndex[uId];
      const v = vIndex[vId];
      if (dist[u][v] === Infinity) return null;
      const path = [uId];
      let curr = u;
      while (curr !== v) {
        const nextId = next[curr][v];
        path.push(nextId);
        curr = vIndex[nextId];
      }
      return path;
    };

    return {
      vList,
      dist,
      next,
      diameter,
      radius,
      center,
      eccentricity,
      getDistance: (uId, vId) => dist[vIndex[uId]][vIndex[vId]],
      getPath: getShortestPath
    };
  },

  /**
   * Proper Vertex Coloring using Welsh-Powell algorithm (chi(G) = 3)
   */
  vertexColoring() {
    const sorted = [...this.vertices].sort((a, b) => this.degree(b.id) - this.degree(a.id));
    const colors = {};

    sorted.forEach((v) => {
      const neighborColors = new Set(
        this.neighbors(v.id).map((nbrId) => colors[nbrId]).filter((c) => c !== undefined)
      );
      let c = 1;
      while (neighborColors.has(c)) {
        c++;
      }
      colors[v.id] = c;
    });

    const chromaticNumber = Math.max(...Object.values(colors));
    const colorClasses = {};
    for (let c = 1; c <= chromaticNumber; c++) {
      colorClasses[c] = [];
    }
    Object.entries(colors).forEach(([vid, c]) => {
      colorClasses[c].push(vid);
    });

    let isProper = true;
    for (const e of this.edges) {
      if (colors[e.a] === colors[e.b]) {
        isProper = false;
        break;
      }
    }

    const colorPalette = {
      1: "#06B6D4", // Cyan
      2: "#10B981", // Emerald
      3: "#F59E0B", // Amber Gold
      4: "#F43F5E", // Rose
      5: "#8B5CF6"  // Violet
    };

    return {
      chromaticNumber,
      colors,
      colorClasses,
      isProper,
      colorPalette,
      improperExample: {
        nodeA: "data",
        nodeB: "training",
        sharedColor: 1,
        explanation: "If adjacent vertices Data and Training shared Color 1, the edge {data, training} would be monochromatic, violating proper coloring."
      }
    };
  },

  /**
   * Edge Coloring and Chromatic Index chi'(G) = 7 (Class 1)
   */
  edgeColoring() {
    const edgeColors = {};
    const maxDegree = Math.max(...this.vertices.map((v) => this.degree(v.id)));

    this.edges.forEach((e) => {
      const incidentColors = new Set();
      Object.entries(edgeColors).forEach(([oeId, oc]) => {
        const oe = this.edges.find((x) => x.id === oeId);
        if (oe.a === e.a || oe.a === e.b || oe.b === e.a || oe.b === e.b) {
          incidentColors.add(oc);
        }
      });
      let c = 1;
      while (incidentColors.has(c)) {
        c++;
      }
      edgeColors[e.id] = c;
    });

    const chromaticIndex = Math.max(...Object.values(edgeColors));

    let isProper = true;
    for (let i = 0; i < this.edges.length; i++) {
      for (let j = i + 1; j < this.edges.length; j++) {
        const e1 = this.edges[i];
        const e2 = this.edges[j];
        if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) {
          if (edgeColors[e1.id] === edgeColors[e2.id]) {
            isProper = false;
          }
        }
      }
    }

    const edgePalette = {
      1: "#06B6D4",
      2: "#10B981",
      3: "#F59E0B",
      4: "#EC4899",
      5: "#8B5CF6",
      6: "#3B82F6",
      7: "#EF4444"
    };

    return {
      chromaticIndex,
      maxDegree,
      isClass1: chromaticIndex === maxDegree,
      edgeColors,
      isProper,
      edgePalette
    };
  },

  /**
   * Eulerian Graph Analysis (Euler's Theorem)
   */
  eulerianAnalysis() {
    const degrees = this.vertices.map((v) => ({
      id: v.id,
      label: v.label,
      degree: this.degree(v.id),
      isOdd: this.degree(v.id) % 2 !== 0
    }));

    const oddVertices = degrees.filter((d) => d.isOdd);
    const evenVertices = degrees.filter((d) => !d.isOdd);

    const hasEulerianCircuit = oddVertices.length === 0;
    const hasEulerianPath = oddVertices.length === 0 || oddVertices.length === 2;

    return {
      oddCount: oddVertices.length,
      evenCount: evenVertices.length,
      oddVertices,
      hasEulerianCircuit,
      hasEulerianPath,
      theoremProof: `Euler's Theorem states a connected graph has an Eulerian Circuit iff all vertex degrees are even, and an Eulerian Path iff exactly 0 or 2 vertices have odd degree. Since G has ${oddVertices.length} odd-degree vertices (Data:7, AI:5, ML:5, Prediction:5, NN:3, Image:3, Language:3, Words:3, Text:3, Dataset:1, ChessRules:1, Strategy:1), G is neither Eulerian nor Semi-Eulerian.`
    };
  },

  /**
   * Hamiltonian Graph Analysis
   */
  hamiltonianAnalysis() {
    const n = this.vertices.length;
    const minDegree = Math.min(...this.vertices.map((v) => this.degree(v.id)));
    const diracThreshold = Math.ceil(n / 2);
    const satisfiesDirac = minDegree >= diracThreshold;

    const cutSetTest = {
      cutSet: ["data"],
      cutSetSize: 1,
      resultingComponents: 3,
      violatesCondition: true,
      explanation: "By the Cut-Set Condition, in any Hamiltonian graph, removing any subset S of vertices can create at most |S| connected components. Here, removing S = {Data} (|S|=1) produces 3 connected components (3 > 1). Thus G CANNOT have a Hamiltonian cycle."
    };

    return {
      minDegree,
      diracThreshold,
      satisfiesDirac,
      cutSetTest,
      hasHamiltonianCircuit: false,
      hasHamiltonianPath: false,
      reasons: [
        "1. Disconnected Graph: G has c = 2 components, so no single path or cycle can visit all vertices.",
        "2. Pendant Vertices: Vertices Dataset, ChessRules, and Strategy have degree 1, which cannot participate in a cycle.",
        "3. Cut-Set Violation: c(G - {Data}) = 3 > 1, proving non-Hamiltonicity by contradiction."
      ]
    };
  },

  /**
   * Planar Graph Analysis & Euler's Planar Formula
   */
  planarAnalysis(nodePositions = null) {
    const V = 25; // Main mind component K1
    const E = 37;
    const c = 1;

    const regions = E - V + 1 + c; // 37 - 25 + 2 = 14 regions
    const boundedRegions = regions - 1; // 13 bounded + 1 exterior
    const regionDegreeSum = 2 * E; // 74

    let layoutCrossings = 0;
    if (nodePositions) {
      const ccw = (A, B, C) => (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
      const intersect = (p1, p2, p3, p4) =>
        ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);

      for (let i = 0; i < this.edges.length; i++) {
        for (let j = i + 1; j < this.edges.length; j++) {
          const e1 = this.edges[i];
          const e2 = this.edges[j];
          if (e1.a === e2.a || e1.a === e2.b || e1.b === e2.a || e1.b === e2.b) continue;
          const p1 = nodePositions[e1.a];
          const p2 = nodePositions[e1.b];
          const p3 = nodePositions[e2.a];
          const p4 = nodePositions[e2.b];
          if (p1 && p2 && p3 && p4 && intersect(p1, p2, p3, p4)) {
            layoutCrossings++;
          }
        }
      }
    }

    return {
      V,
      E,
      regions,
      boundedRegions,
      exteriorRegions: 1,
      eulerFormula: `${V} - ${E} + ${regions} = 2`,
      regionDegreeSum,
      layoutCrossings,
      thicknessNumber: 2,
      satisfiesPlanarEdgeBound: E <= 3 * V - 6
    };
  },

  /**
   * Formal classification of a sequence of vertices: Walk, Trail, Path, Circuit, Cycle
   */
  classifySequence(vertexIds) {
    if (!vertexIds || vertexIds.length < 2) {
      return { isValid: false, reason: "Sequence must contain at least 2 vertices." };
    }

    const edgeSequence = [];
    for (let i = 0; i < vertexIds.length - 1; i++) {
      const u = vertexIds[i];
      const v = vertexIds[i + 1];
      const edge = this.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
      if (!edge) {
        return {
          isValid: false,
          reason: `No edge exists between '${u}' and '${v}'.`
        };
      }
      edgeSequence.push(edge.id);
    }

    const isClosed = vertexIds[0] === vertexIds[vertexIds.length - 1];
    const uniqueEdges = new Set(edgeSequence).size === edgeSequence.length;

    const verticesToCheck = isClosed ? vertexIds.slice(0, -1) : vertexIds;
    const uniqueVertices = new Set(verticesToCheck).size === verticesToCheck.length;

    let classification = "Walk";
    if (uniqueEdges && uniqueVertices) {
      if (isClosed && vertexIds.length >= 4) classification = "Cycle";
      else if (!isClosed) classification = "Path";
      else classification = "Circuit";
    } else if (uniqueEdges) {
      if (isClosed) classification = "Circuit";
      else classification = "Trail";
    } else {
      classification = isClosed ? "Closed Walk" : "Open Walk";
    }

    return {
      isValid: true,
      length: edgeSequence.length,
      isClosed,
      hasRepeatedEdges: !uniqueEdges,
      hasRepeatedVertices: !uniqueVertices,
      classification,
      edgeSequence,
      description: `${classification} of length ${edgeSequence.length} (${isClosed ? "Closed" : "Open"}).`
    };
  }
};

if (typeof window !== "undefined") {
  window.GRAPH = GRAPH;
}
if (typeof globalThis !== "undefined") {
  globalThis.GRAPH = GRAPH;
}

if (typeof module !== "undefined") {
  module.exports = GRAPH;
}
