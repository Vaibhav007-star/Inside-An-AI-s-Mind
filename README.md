# Inside an AI's Mind: When Knowledge Becomes a Graph

> **CIA III-B Creative Artifact — Graph Theory in My World**  
> *"An AI's knowledge can be represented as a network, and Graph Theory gives us a way to understand that network."*

---

## 📌 Conceptual Overview

This project is a high-fidelity interactive academic artifact created for **CIA III-B (Discrete Mathematics / Graph Theory)**. 

Instead of treating Graph Theory as abstract equations on paper, we model how an artificial intelligence organizes its internal concepts as a formal mathematical graph. The project adheres strictly to syllabus requirements: **Graph Theory is the hero; AI is the creative world**.

> **Mandatory Academic Framing:**  
> *"A conceptual graph model used to demonstrate how Graph Theory can represent relationships between knowledge concepts. It is not how a real AI stores knowledge internally."*

---

## 📐 Mathematical Ground Truth

Every value and visualization in the project is strictly derived from the underlying graph $G = (V, E)$:

| Metric | Ground Truth Value | Mathematical Note |
| :--- | :--- | :--- |
| **Total Vertices ($|V|$)** | **28** | 25 in Main Knowledge Network ($K_1$), 3 in Specialized Knowledge ($K_2$) |
| **Total Edges ($|E|$)** | **39** | Simple, undirected edges (no loops, no multi-edges) |
| **Connected Components ($c(G)$)** | **2** | $K_1$ (Main AI Mind) and $K_2$ (Isolated Game Tree) |
| **Handshaking Lemma** | $\sum_{v \in V} \text{deg}(v) = 78 = 2 \times 39$ | Handshaking Lemma holds unconditionally |
| **Highest Degree Vertex** | **Data** ($\text{deg} = 7$) | Incident to AI, Feedback, Training, Dataset, Features, Image, Text |
| **Cut Vertex** | **Data** | Removing Data increases components from 2 to 3, isolating `Dataset` |
| **Bridge Edge** | **$E_{18}$ (`Data` ━ `Dataset`)** | Severing $E_{18}$ increases connected components from 2 to 3 |
| **Featured Cycles** | $C_1$ (Length 5), $C_2$ (Length 3), $C_3$ (Length 3) | Models recursive learning loops and cognitive triangles |
| **Featured Induced Subgraphs** | $S_1$ (Learning), $S_2$ (Vision), $S_3$ (NLP), $S_4$ (Reasoning) | Proper induced subgraphs with explicit boundary edges |

---

## ✨ Features & Architecture

### 1. Six Core Graph Theory Modes
1. **NORMAL (Key 1):** Complete 28-vertex overview with 3D ceramic sphere shading and domain clusters.
2. **PATH (Key 2):** Traversal explorer with featured paths ($P_1, P_2, P_3$) and custom $A \to B$ BFS shortest pathfinder.
3. **CYCLE (Key 3):** Feedback loop highlighting ($C_1$ 5-cycle learning feedback, $C_2$ training triangle, $C_3$ language triangle).
4. **SUBGRAPH (Key 4):** Induced subgraph isolation ($S_1$ Learning, $S_2$ Computer Vision, $S_3$ NLP, $S_4$ Reasoning) with boundary edge differentiation.
5. **DEGREE (Key 5):** Proportional node scaling where radius $r \propto \text{deg}(v)$ and live degree ranking sidebar.
6. **COMPONENT (Key 6):** Disconnected component isolation ($K_1$ vs $K_2$) and real-time Cut Vertex simulation.

### 2. ⚗ AI Mind Lab (Interactive Laboratory)
- **Mission 01 — Find the Path:** Step-by-step path traversal from `Data` to `Prediction` with dynamic sequence breadcrumbs.
- **Mission 02 — Find the Hub:** Discover the true degree hub of the network (`Data`, $\text{deg} = 7$).
- **Mission 03 — Find the Loop:** Trace closed walk cycles modeling AI feedback loops.
- **Mission 04 — Separate the Mind:** Identify the 4-vertex Computer Vision induced subgraph.
- **⚡ AI Mind Glitch:** Visual demonstration of bridge edges ($E_{18}$) and network failure.
- **🔬 Graph Theory Scanner:** Automated mathematical scanner computing vertex/edge audits.
- **🎙 Examiner Mode:** One-click quick demonstration buttons for oral presentation defense.
- **📖 The AI Mind Speaks:** Creative integration connecting Graph Diary reflections with real-time graph highlights.

### 3. Visual Experience & Ergonomics
- **Organic Synaptic Motion:** Toggleable mathematical node floating driven by `requestAnimationFrame`.
- **Dynamic Camera ViewBox:** Automatically offsets and centers the graph canvas when the Lab HUD is open to eliminate node occlusion.
- **Zero External Dependencies:** Built with pure vanilla HTML5, CSS3, SVG, and JavaScript. 100% offline execution.

---

## 🚀 Getting Started

### Option 1: Direct File Open
Double-click `index.html` in Windows Explorer or open it in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Option 2: Python Local Server (Recommended)
```bash
# Navigate to the project root
cd "Inside an AI's Mind"

# Start HTTP server
python -m http.server 5500
```
Open your browser at: **`http://127.0.0.1:5500/index.html`**  
To go straight to the interactive lab: **`http://127.0.0.1:5500/index.html#lab`**

### Option 3: Node.js Serve
```bash
npx serve . -p 5500
```

---

## 🧪 Ground Truth Verification

Run the automated mathematical test suite using Node.js:
```bash
node verify.mjs
```
**Test Results:** `31 passed, 0 failed` across Handshaking Lemma, Cut Vertices, Bridges, Cycles, and Subgraph definitions.

---

## 📂 File Structure

```text
├── index.html              # Main presentation stage, SVG viewport, and Lab HUD
├── style.css               # Futuristic ceramic marble styling, responsive layouts, 3D animations
├── app.js                  # State engine, BFS pathfinder, animation loops, Lab missions
├── graph-data.js           # 28 vertices, 39 edges, adjacency list, and subgraph definitions
├── verify.mjs              # 31 automated academic verification assertions
├── PROJECT_SPEC.md         # Full academic specification & rules
└── screenshots/            # High-resolution presentation capture evidence
```

---

## 👥 Authors
- **Vaibhav** — Academic Research, Graph Modeling, Creative Narrative & Interactive UI Architecture
- **CIA III-B Discrete Mathematics Project** — Department of Computer Science
