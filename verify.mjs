/**
 * Verification Script for Graph Data and Math
 * Asserts all values in PROJECT_SPEC.md GROUND TRUTH section.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const GRAPH = require("./graph-data.js");

console.log("================================================================================");
console.log("      GRAPH THEORY IN MY WORLD - GROUND TRUTH VERIFICATION (PHASE 1)");
console.log("================================================================================\n");

// Print Degree Table
console.log("VERTEX DEGREE TABLE:");
console.log("--------------------------------------------------------------------------------");
console.log(
  "ID".padEnd(14) +
  "Label".padEnd(20) +
  "Domain".padEnd(14) +
  "Degree".padEnd(8) +
  "Neighbors"
);
console.log("--------------------------------------------------------------------------------");
for (const v of GRAPH.vertices) {
  const deg = GRAPH.degree(v.id);
  const nbrs = GRAPH.neighbors(v.id).join(", ");
  console.log(
    v.id.padEnd(14) +
    v.label.padEnd(20) +
    v.domain.padEnd(14) +
    String(deg).padEnd(8) +
    nbrs
  );
}
console.log("--------------------------------------------------------------------------------\n");

let passed = 0;
let failed = 0;

function assert(description, condition, actualInfo = "") {
  if (condition) {
    console.log(`[PASS] ${description}`);
    passed++;
  } else {
    console.error(`[FAIL] ${description} -> ${actualInfo}`);
    failed++;
  }
}

// 1. Basic counts
assert("Total vertices count is 28", GRAPH.vertices.length === 28, `Got ${GRAPH.vertices.length}`);
assert("Total edges count is 39", GRAPH.edges.length === 39, `Got ${GRAPH.edges.length}`);

// 2. Components
const comps = GRAPH.components();
assert("Whole graph G has exactly 2 components", comps.length === 2, `Got ${comps.length}`);
const k1 = comps.find((c) => c.vertices.includes("ai"));
const k2 = comps.find((c) => c.vertices.includes("chessrules"));
assert("Main component K1 has 25 vertices", k1 && k1.vertices.length === 25, `Got ${k1?.vertices.length}`);
assert("Main component K1 has 37 edges", k1 && k1.edgeCount === 37, `Got ${k1?.edgeCount}`);
assert("Specialized component K2 has 3 vertices", k2 && k2.vertices.length === 3, `Got ${k2?.vertices.length}`);
assert("Specialized component K2 has 2 edges", k2 && k2.edgeCount === 2, `Got ${k2?.edgeCount}`);

// 3. Handshaking Lemma
const hsAll = GRAPH.handshake("all");
assert("Handshake lemma for G: sum of degrees = 78 = 2 x 39", hsAll.degreeSum === 78 && hsAll.edgeCount === 39 && hsAll.holds, JSON.stringify(hsAll));

const hsMain = GRAPH.handshake("main");
assert("Handshake lemma for K1: sum of degrees = 74 = 2 x 37", hsMain.degreeSum === 74 && hsMain.edgeCount === 37 && hsMain.holds, JSON.stringify(hsMain));

// 4. Expected Degrees
const expectedDegrees = {
  data: 7, ai: 5, ml: 5, prediction: 5,
  training: 4, model: 4, knowledge: 4,
  nn: 3, image: 3, language: 3, words: 3, text: 3,
  dl: 2, feedback: 2, features: 2, patterns: 2, cv: 2,
  objdet: 2, recognition: 2, nlp: 2, meaning: 2, context: 2, reasoning: 2, decision: 2,
  dataset: 1,
  chessrules: 1, gametree: 2, strategy: 1
};

let allDegsMatch = true;
for (const [id, exp] of Object.entries(expectedDegrees)) {
  const actual = GRAPH.degree(id);
  if (actual !== exp) {
    allDegsMatch = false;
    console.error(`Degree mismatch for ${id}: expected ${exp}, got ${actual}`);
  }
}
assert("All 28 vertex degrees match ground truth", allDegsMatch);

// 5. Highest-degree vertex
const degreesWithId = GRAPH.vertices.map((v) => ({ id: v.id, deg: GRAPH.degree(v.id) }));
degreesWithId.sort((a, b) => b.deg - a.deg);
const highest = degreesWithId[0];
const secondHighest = degreesWithId[1];
assert("Highest degree vertex is Data (7) and uniquely maximal", highest.id === "data" && highest.deg === 7 && secondHighest.deg < 7, `Highest: ${JSON.stringify(highest)}`);
assert("AI vertex has degree 5 (not the highest degree)", GRAPH.degree("ai") === 5);

// 6. Degree sequence of K1
const expSeq = [7, 5, 5, 5, 4, 4, 4, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1];
const actualSeq = GRAPH.degreeSequence("main");
const seqMatch = JSON.stringify(expSeq) === JSON.stringify(actualSeq);
assert("K1 degree sequence is [7,5,5,5,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,1]", seqMatch, `Got ${JSON.stringify(actualSeq)}`);

// 7. Featured Paths
assert("P1 is a valid path of length 3", GRAPH.isPath(GRAPH.featured.paths.P1.vertices) && GRAPH.featured.paths.P1.vertices.length === 4);
assert("P2 is a valid path of length 3", GRAPH.isPath(GRAPH.featured.paths.P2.vertices) && GRAPH.featured.paths.P2.vertices.length === 4);
assert("P3 is a valid path of length 3", GRAPH.isPath(GRAPH.featured.paths.P3.vertices) && GRAPH.featured.paths.P3.vertices.length === 4);

// 8. Featured Cycles
assert("C1 is a valid cycle of length 5 (5 distinct vertices)", GRAPH.isCycle(GRAPH.featured.cycles.C1.vertices) && GRAPH.featured.cycles.C1.vertices.length === 6);
assert("C2 is a valid cycle of length 3 (triangle)", GRAPH.isCycle(GRAPH.featured.cycles.C2.vertices) && GRAPH.featured.cycles.C2.vertices.length === 4);
assert("C3 is a valid cycle of length 3 (triangle)", GRAPH.isCycle(GRAPH.featured.cycles.C3.vertices) && GRAPH.featured.cycles.C3.vertices.length === 4);

// 9. Subgraphs (vertices / internal edges / boundary edges)
const s1 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S1.vertices);
assert("S1 (Learning): 11 vertices, 16 edges, 5 boundary edges", s1.vertexCount === 11 && s1.edgeCount === 16 && s1.boundaryEdges.length === 5, JSON.stringify(s1));

const s2 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S2.vertices);
assert("S2 (Vision): 4 vertices, 3 edges, 3 boundary edges", s2.vertexCount === 4 && s2.edgeCount === 3 && s2.boundaryEdges.length === 3, JSON.stringify(s2));

const s3 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S3.vertices);
assert("S3 (NLP): 6 vertices, 6 edges, 3 boundary edges", s3.vertexCount === 6 && s3.edgeCount === 6 && s3.boundaryEdges.length === 3, JSON.stringify(s3));

const s4 = GRAPH.inducedSubgraph(GRAPH.featured.subgraphs.S4.vertices);
assert("S4 (Reasoning): 3 vertices, 2 edges, 4 boundary edges", s4.vertexCount === 3 && s4.edgeCount === 2 && s4.boundaryEdges.length === 4, JSON.stringify(s4));

// 10. Cut Vertices and Bridges
assert("Data is a cut vertex (isCutVertex === true)", GRAPH.isCutVertex("data") === true);
assert("AI is NOT a cut vertex (isCutVertex === false)", GRAPH.isCutVertex("ai") === false);
assert("E18 (data-dataset) is a bridge (isBridge === true)", GRAPH.isBridge("E18") === true);

// 11. Break Demos
const compsWithoutData = GRAPH.components(["data"]);
assert("Removing Data increases component count from 2 to 3", compsWithoutData.length === 3, `Got ${compsWithoutData.length}`);
const isolatedDataset = compsWithoutData.find((c) => c.vertices.includes("dataset"));
assert("After removing Data, {dataset} is an isolated component", isolatedDataset && isolatedDataset.vertices.length === 1);

const compsWithoutE18 = GRAPH.components([], ["E18"]);
assert("Removing edge E18 results in 3 components with {dataset} isolated", compsWithoutE18.length === 3 && compsWithoutE18.some((c) => c.vertices.length === 1 && c.vertices.includes("dataset")));

// 13. Advanced Discrete Mathematics & Algorithm Assertions
// Dijkstra's Algorithm
const dijkstraResult = GRAPH.dijkstra("data", "prediction");
assert("Dijkstra's shortest path data -> prediction found", dijkstraResult.getPath && dijkstraResult.getPath[0] === "data" && dijkstraResult.getPath[dijkstraResult.getPath.length - 1] === "prediction");
assert("Dijkstra distance data -> prediction is 2", dijkstraResult.distances["prediction"] === 2, `Got ${dijkstraResult.distances["prediction"]}`);

// Floyd-Warshall All-Pairs
const fw = GRAPH.floydWarshall();
assert("Floyd-Warshall diameter of K1 is 5", fw.diameter === 5, `Got ${fw.diameter}`);
assert("Floyd-Warshall radius of K1 is 3", fw.radius === 3, `Got ${fw.radius}`);
assert("Floyd-Warshall center nodes of K1 are AI and Data", fw.center.includes("ai") && fw.center.includes("data"), `Got ${JSON.stringify(fw.center)}`);

// Graph Coloring (Vertex & Edge)
const vc = GRAPH.vertexColoring();
assert("Chromatic number chi(G) is exactly 3 (Welsh-Powell)", vc.chromaticNumber === 3, `Got ${vc.chromaticNumber}`);
assert("Proper vertex coloring verified (no adjacent nodes share a color)", vc.isProper === true);

const ec = GRAPH.edgeColoring();
assert("Chromatic index chi'(G) is 7 (Class 1 under Vizing's theorem, chi' = Delta)", ec.chromaticIndex === 7 && ec.isClass1 === true, `Got ${ec.chromaticIndex}`);
assert("Proper edge coloring verified (no incident edges share a color)", ec.isProper === true);

// Eulerian Graph Analysis
const euler = GRAPH.eulerianAnalysis();
assert("Graph G has exactly 12 odd-degree vertices violating Euler's circuit condition", euler.oddCount === 12);
assert("Graph G has NO Eulerian circuit (hasEulerianCircuit === false)", euler.hasEulerianCircuit === false);
assert("Graph G has NO Eulerian path (hasEulerianPath === false)", euler.hasEulerianPath === false);

// Hamiltonian Graph Analysis
const ham = GRAPH.hamiltonianAnalysis();
assert("Graph G is non-Hamiltonian by Cut-Set condition c(G - {data}) = 3 > 1", ham.cutSetTest.violatesCondition === true && ham.hasHamiltonianCircuit === false);

// Planar Graph Analysis & Euler's Formula
const planar = GRAPH.planarAnalysis();
assert("Euler's Planar Formula for K1: V - E + R = 25 - 37 + 14 = 2", planar.regions === 14 && (planar.V - planar.E + planar.regions === 2));
assert("Region degree sum equals 2 * E = 74 by face handshaking lemma", planar.regionDegreeSum === 74, `Got ${planar.regionDegreeSum}`);

// Walk, Trail, Path Classification
assert("Sequence ['data', 'training', 'model'] is a Path", GRAPH.classifySequence(["data", "training", "model"]).classification === "Path");
assert("Sequence ['ml', 'training', 'model', 'ml'] is a Cycle", GRAPH.classifySequence(["ml", "training", "model", "ml"]).classification === "Cycle");
assert("Sequence with repeated edge is a Walk (not Trail)", GRAPH.classifySequence(["data", "training", "model", "training", "data"]).classification.includes("Walk"));

console.log("\n================================================================================");
console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("ALL GROUND TRUTH ASSERTIONS PASSED PERFECTLY!\n");
}

