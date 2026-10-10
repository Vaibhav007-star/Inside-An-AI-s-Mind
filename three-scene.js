/**
 * Three.js 3D Knowledge Graph Visualization Engine
 * "Inside an AI's Mind: When Knowledge Becomes a Graph"
 *
 * Implements genuine 3D graph universe with PBR physical materials,
 * studio lighting, smooth OrbitControls, CSS2D billboard labels,
 * camera flight tweening, and real-time Graph Theory mode shaders.
 */

import * as THREE from './vendor/three.module.js';
import { OrbitControls } from './vendor/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from './vendor/renderers/CSS2DRenderer.js';

export class ThreeGraphEngine {
  constructor(containerOrOptions = {}, maybeOptions = {}) {
    let options = {};
    if (containerOrOptions && (containerOrOptions instanceof HTMLElement || containerOrOptions.nodeType === 1)) {
      options = { container: containerOrOptions, ...maybeOptions };
    } else {
      options = containerOrOptions || {};
    }
    this.container = options.container || document.getElementById('three-viewport');
    this.graphData = options.graphData || 
      (typeof window !== 'undefined' ? window.GRAPH : null) || 
      (typeof globalThis !== 'undefined' ? globalThis.GRAPH : null) || 
      (typeof GRAPH !== 'undefined' ? GRAPH : null);

    // Callbacks
    this.onNodeClickCallback = options.onNodeClick || (() => {});
    this.onEdgeClickCallback = options.onEdgeClick || (() => {});
    this.onBackgroundClickCallback = options.onBackgroundClick || (() => {});

    // Deterministic 3D Coordinates (scaled with organic depth & domain clustering)
    this.nodePositions = {
      ai: { x: 0, y: 0, z: 0 },
      // Learning & Data Domain (Left hemisphere)
      ml: { x: -65, y: -10, z: 25 },
      dl: { x: -85, y: 40, z: 15 },
      nn: { x: -130, y: 45, z: 30 },
      training: { x: -145, y: -20, z: 40 },
      model: { x: -110, y: -25, z: -10 },
      prediction: { x: -125, y: 95, z: 0 },
      feedback: { x: -180, y: 40, z: -25 },
      data: { x: -140, y: -75, z: 10 },
      dataset: { x: -105, y: -125, z: 35 },
      features: { x: -195, y: -90, z: -15 },
      patterns: { x: -210, y: 15, z: -10 },
      // Computer Vision Domain (Lower right hemisphere)
      cv: { x: 80, y: -50, z: 20 },
      image: { x: 125, y: -95, z: 35 },
      objdet: { x: 175, y: -105, z: 10 },
      recognition: { x: 165, y: -45, z: -20 },
      // NLP & Language Domain (Upper right hemisphere)
      nlp: { x: 75, y: 45, z: 20 },
      language: { x: 125, y: 80, z: 35 },
      words: { x: 180, y: 60, z: 15 },
      text: { x: 115, y: 15, z: 50 },
      meaning: { x: 205, y: 110, z: -10 },
      context: { x: 125, y: 130, z: -20 },
      // Reasoning Domain (Top central hemisphere)
      knowledge: { x: 0, y: 65, z: -40 },
      reasoning: { x: -25, y: 120, z: -50 },
      decision: { x: -70, y: 110, z: -40 },
      // Specialized Knowledge: Component K2 (Isolated plane)
      chessrules: { x: 175, y: -140, z: -100 },
      gametree: { x: 220, y: -140, z: -100 },
      strategy: { x: 265, y: -140, z: -100 }
    };

    // Color definitions
    this.domainColors = {
      core: 0xFFD166,
      learning: 0x22D3EE,
      vision: 0xF472B6,
      nlp: 0x4ADE80,
      reasoning: 0xFB923C,
      special: 0xA78BFA
    };

    // Scene Graph Objects
    this.nodeMeshes = new Map();
    this.nodeLabels = new Map();
    this.edgeObjects = new Map();
    this.pulseParticles = [];
    this.specializedFrame = null;
    this.scannerBeamMesh = null;

    // State
    this.currentMode = 'normal';
    this.selectedElement = null;
    this.hoveredNodeId = null;
    this.isMotionActive = true;
    this.isDegreeScaled = false;
    this.isGlitchActive = false;

    // Camera animation state
    this.isCameraFlying = false;
    this.cameraFlightStart = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
    this.cameraFlightEnd = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
    this.cameraFlightProgress = 0;
    this.defaultCameraPos = new THREE.Vector3(0, 30, 420);
    this.defaultCameraTarget = new THREE.Vector3(0, 0, 0);

    // Raycasting
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.init();
  }

  init() {
    if (!this.container) return;
    if (!this.graphData || !this.graphData.vertices) {
      console.warn("ThreeGraphEngine: graphData not available yet.");
      return;
    }

    const width = Math.max(this.container.clientWidth || 0, window.innerWidth || 1200);
    const height = Math.max(this.container.clientHeight || 0, window.innerHeight || 800);

    // 1. Three.js Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent so ivory/ceramic or dark ambient theme shines through

    // 2. Perspective Camera
    this.camera = new THREE.PerspectiveCamera(46, width / height, 1, 2500);
    this.camera.position.copy(this.defaultCameraPos);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. CSS2D Label Renderer (Crisp HTML Typography)
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.className = 'three-css2d-container';
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.width = '100%';
    this.labelRenderer.domElement.style.height = '100%';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    // 5. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;
    this.controls.minDistance = 90;
    this.controls.maxDistance = 750;
    this.controls.maxPolarAngle = Math.PI - 0.08;
    this.controls.minPolarAngle = 0.08;
    this.controls.target.copy(this.defaultCameraTarget);

    // 6. Studio Lighting System
    this.setupLighting();

    // 7. Build Graph Entities in 3D
    this.build3DNodes();
    this.build3DEdges();
    this.buildSpecializedBoundary();
    this.buildScannerBeam();

    // 8. Event Listeners
    window.addEventListener('resize', this.onResize.bind(this));
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.renderer.domElement.addEventListener('click', this.onPointerClick.bind(this));

    // 9. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft Ambient Light
    this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.95);
    this.scene.add(this.ambientLight);

    // Main Studio Key Light
    this.keyLight = new THREE.DirectionalLight(0xFFFBEB, 1.35);
    this.keyLight.position.set(160, 240, 200);
    this.scene.add(this.keyLight);

    // Soft Cool Fill Light (Azure)
    this.fillLight = new THREE.DirectionalLight(0xBAE6FD, 0.7);
    this.fillLight.position.set(-180, -90, -120);
    this.scene.add(this.fillLight);

    // Warm Rim Light
    this.rimLight = new THREE.DirectionalLight(0xFDE68A, 0.5);
    this.rimLight.position.set(0, -180, 150);
    this.scene.add(this.rimLight);
  }

  build3DNodes() {
    this.nodesGroup = new THREE.Group();
    this.nodesGroup.name = 'nodes-group';
    this.scene.add(this.nodesGroup);

    const baseSphereGeo = new THREE.SphereGeometry(1, 32, 28);

    this.graphData.vertices.forEach((v) => {
      const pos = this.nodePositions[v.id] || { x: 0, y: 0, z: 0 };
      const domainColor = this.domainColors[v.domain] || 0x22D3EE;
      const isCentral = v.id === 'ai';
      const baseRadius = isCentral ? 11 : 6.2;

      // PBR Ceramic / Metallic Lacquer Material
      const material = new THREE.MeshPhysicalMaterial({
        color: domainColor,
        roughness: isCentral ? 0.12 : 0.22,
        metalness: isCentral ? 0.35 : 0.08,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
        reflectivity: 0.85,
        emissive: domainColor,
        emissiveIntensity: isCentral ? 0.32 : 0.15
      });

      const mesh = new THREE.Mesh(baseSphereGeo, material);
      mesh.scale.setScalar(baseRadius);
      mesh.position.set(pos.x, pos.y, pos.z);
      mesh.userData = {
        id: v.id,
        vertexData: v,
        baseRadius: baseRadius,
        baseColor: domainColor,
        originalPos: { ...pos },
        degree: this.graphData.degree(v.id)
      };

      // Outer Halo Ring for Central AI
      if (isCentral) {
        const ringGeo = new THREE.RingGeometry(14, 16.5, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xF59E0B,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.45
        });
        const halo = new THREE.Mesh(ringGeo, ringMat);
        halo.rotation.x = Math.PI / 2.8;
        mesh.add(halo);
        mesh.userData.halo = halo;
      }

      this.nodesGroup.add(mesh);
      this.nodeMeshes.set(v.id, mesh);

      // CSS2D Billboard HTML Label
      const labelDiv = document.createElement('div');
      labelDiv.className = `three-label domain-${v.domain}`;
      labelDiv.dataset.id = v.id;
      labelDiv.innerHTML = `
        <span class="label-dot" style="background:${this.graphData.domains[v.domain].color}"></span>
        <span class="label-text">${v.label}</span>
      `;
      const labelObject = new CSS2DObject(labelDiv);
      labelObject.position.set(0, baseRadius + 3.8, 0);
      mesh.add(labelObject);
      this.nodeLabels.set(v.id, labelObject);
    });
  }

  build3DEdges() {
    this.edgesGroup = new THREE.Group();
    this.edgesGroup.name = 'edges-group';
    this.scene.add(this.edgesGroup);

    this.graphData.edges.forEach((e) => {
      const p1 = this.nodePositions[e.a];
      const p2 = this.nodePositions[e.b];
      if (!p1 || !p2) return;

      const v1 = new THREE.Vector3(p1.x, p1.y, p1.z);
      const v2 = new THREE.Vector3(p2.x, p2.y, p2.z);

      const geom = new THREE.BufferGeometry().setFromPoints([v1, v2]);
      const mat = new THREE.LineBasicMaterial({
        color: 0x94A3B8,
        transparent: true,
        opacity: 0.55,
        linewidth: 1
      });

      const line = new THREE.Line(geom, mat);
      line.userData = {
        id: e.id,
        edgeData: e,
        baseColor: 0x94A3B8,
        baseOpacity: 0.55
      };

      this.edgesGroup.add(line);
      this.edgeObjects.set(e.id, line);
    });
  }

  buildSpecializedBoundary() {
    // 3D Visual Boundary Ring for Component K2 (Specialized Knowledge)
    const k2Points = [
      new THREE.Vector3(150, -110, -100),
      new THREE.Vector3(285, -110, -100),
      new THREE.Vector3(285, -170, -100),
      new THREE.Vector3(150, -170, -100),
      new THREE.Vector3(150, -110, -100)
    ];
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(k2Points);
    const boundaryMat = new THREE.LineDashedMaterial({
      color: 0xA78BFA,
      dashSize: 6,
      gapSize: 4,
      transparent: true,
      opacity: 0.75
    });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    boundaryLine.computeLineDistances();

    // Boundary CSS2D Label
    const tagDiv = document.createElement('div');
    tagDiv.className = 'three-k2-boundary-tag';
    tagDiv.textContent = 'SPECIALIZED KNOWLEDGE (COMPONENT K2)';
    const tagObj = new CSS2DObject(tagDiv);
    tagObj.position.set(217, -105, -100);
    boundaryLine.add(tagObj);

    this.specializedFrame = boundaryLine;
    this.scene.add(boundaryLine);
  }

  buildScannerBeam() {
    // 3D Laser Beam Plane for Graph Theory Scanner Diagnostic
    const beamGeo = new THREE.PlaneGeometry(550, 4);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.scannerBeamMesh = new THREE.Mesh(beamGeo, beamMat);
    this.scannerBeamMesh.position.set(0, 0, 0);
    this.scannerBeamMesh.visible = false;
    this.scene.add(this.scannerBeamMesh);
  }

  // ---------------- CAMERA CONTROLS & TWEENING ----------------
  flyCameraTo(targetPos, lookAtTarget, duration = 850) {
    this.isCameraFlying = true;
    this.cameraFlightStart.pos.copy(this.camera.position);
    this.cameraFlightStart.target.copy(this.controls.target);

    this.cameraFlightEnd.pos.copy(targetPos);
    this.cameraFlightEnd.target.copy(lookAtTarget);

    this.cameraFlightDuration = duration;
    this.cameraFlightStartTime = performance.now();
  }

  resetCamera(duration = 750) {
    this.flyCameraTo(this.defaultCameraPos, this.defaultCameraTarget, duration);
  }

  focusNode(nodeId, duration = 800) {
    const mesh = this.nodeMeshes.get(nodeId);
    if (!mesh) return;

    const pos = mesh.position;
    // Calculate elegant camera offset for focused inspection
    const cameraOffset = new THREE.Vector3(pos.x * 0.35, pos.y * 0.35 + 18, pos.z + 105);
    this.flyCameraTo(cameraOffset, pos, duration);
  }

  // ---------------- INTERACTION & PICKING ----------------
  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodesGroup.children, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const hitId = hitMesh.userData.id;
      if (this.hoveredNodeId !== hitId) {
        this.setHoveredNode(hitId);
      }
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      if (this.hoveredNodeId !== null) {
        this.setHoveredNode(null);
      }
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  onPointerClick(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodesGroup.children, false);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const vId = hitMesh.userData.id;
      this.onNodeClickCallback(vId);
    } else {
      this.onBackgroundClickCallback();
    }
  }

  setHoveredNode(nodeId) {
    this.hoveredNodeId = nodeId;
    this.nodeMeshes.forEach((mesh, id) => {
      const isHovered = id === nodeId;
      const isSelected = this.selectedElement?.id === id;
      const scaleMultiplier = isHovered ? 1.25 : (isSelected ? 1.18 : 1.0);
      const targetScale = mesh.userData.baseRadius * scaleMultiplier;

      mesh.scale.setScalar(targetScale);

      if (isHovered) {
        mesh.material.emissiveIntensity = 0.55;
      } else if (!isSelected) {
        mesh.material.emissiveIntensity = id === 'ai' ? 0.32 : 0.15;
      }
    });
  }

  highlightElement(type, id) {
    this.selectedElement = { type, id };
    if (type === 'vertex') {
      const neighbors = new Set(this.graphData.neighbors(id));
      this.nodeMeshes.forEach((mesh, vId) => {
        const isTarget = vId === id;
        const isNeighbor = neighbors.has(vId);
        if (isTarget) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.emissiveIntensity = 0.85;
          mesh.scale.setScalar(mesh.userData.baseRadius * 1.35);
          const lbl = this.nodeLabels.get(vId);
          if (lbl) {
            lbl.element.classList.remove('dimmed');
            lbl.element.classList.add('highlight-path');
          }
        } else if (isNeighbor) {
          mesh.material.transparent = false;
          mesh.material.opacity = 0.9;
          mesh.material.emissiveIntensity = 0.45;
          mesh.scale.setScalar(mesh.userData.baseRadius * 1.08);
          const lbl = this.nodeLabels.get(vId);
          if (lbl) lbl.element.classList.remove('dimmed');
        } else {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.25;
          mesh.scale.setScalar(mesh.userData.baseRadius * 0.95);
          const lbl = this.nodeLabels.get(vId);
          if (lbl) lbl.element.classList.add('dimmed');
        }
      });

      this.edgeObjects.forEach((line) => {
        const e = line.userData.edgeData;
        const isIncident = e.a === id || e.b === id;
        if (isIncident) {
          line.material.opacity = 1.0;
          line.material.color.setHex(0x10B981);
        } else {
          line.material.opacity = 0.12;
        }
      });
    } else if (type === 'edge') {
      const edge = this.graphData.edges.find((e) => e.id === id);
      if (!edge) return;
      this.nodeMeshes.forEach((mesh, vId) => {
        if (vId === edge.a || vId === edge.b) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
          mesh.material.emissiveIntensity = 0.75;
          mesh.scale.setScalar(mesh.userData.baseRadius * 1.25);
          const lbl = this.nodeLabels.get(vId);
          if (lbl) lbl.element.classList.remove('dimmed');
        } else {
          mesh.material.transparent = true;
          mesh.material.opacity = 0.25;
          const lbl = this.nodeLabels.get(vId);
          if (lbl) lbl.element.classList.add('dimmed');
        }
      });
      this.edgeObjects.forEach((line, eId) => {
        if (eId === id) {
          line.material.opacity = 1.0;
          line.material.color.setHex(0x10B981);
        } else {
          line.material.opacity = 0.12;
        }
      });
    }
  }

  clearHighlight() {
    this.selectedElement = null;
    this.nodeMeshes.forEach((mesh, vId) => {
      mesh.material.transparent = false;
      mesh.material.opacity = 1.0;
      mesh.material.color.setHex(mesh.userData.baseColor);
      mesh.material.emissive.setHex(mesh.userData.baseColor);
      mesh.material.emissiveIntensity = vId === 'ai' ? 0.32 : 0.15;
      mesh.scale.setScalar(mesh.userData.baseRadius);

      const lbl = this.nodeLabels.get(vId);
      if (lbl) {
        lbl.element.className = `three-label domain-${mesh.userData.vertexData.domain}`;
      }
    });

    this.edgeObjects.forEach((line) => {
      line.material.opacity = line.userData.baseOpacity;
      line.material.color.setHex(line.userData.baseColor);
    });
  }

  // ---------------- GRAPH THEORY MODE SHADERS & VISUALIZATIONS ----------------
  setModeVisuals(modeOrState, maybeOptions = {}) {
    let mode = 'normal';
    let options = {};

    if (typeof modeOrState === 'string') {
      mode = modeOrState;
      options = maybeOptions || {};
    } else if (typeof modeOrState === 'object' && modeOrState !== null) {
      mode = modeOrState.mode || 'normal';
      options = modeOrState;
    }

    this.currentMode = mode;
    this.selectedElement = options.selectedElement || null;

    // Reset base materials
    this.nodeMeshes.forEach((mesh, id) => {
      mesh.material.opacity = 1.0;
      mesh.material.transparent = false;
      mesh.material.color.setHex(mesh.userData.baseColor);
      mesh.material.emissive.setHex(mesh.userData.baseColor);
      mesh.material.emissiveIntensity = id === 'ai' ? 0.32 : 0.15;
      const r = mesh.userData.baseRadius;
      mesh.scale.setScalar(r);

      const label = this.nodeLabels.get(id);
      if (label) label.element.className = `three-label domain-${mesh.userData.vertexData.domain}`;
    });

    this.edgeObjects.forEach((line) => {
      line.material.opacity = line.userData.baseOpacity;
      line.material.color.setHex(line.userData.baseColor);
    });

    switch (this.currentMode) {
      case 'normal':
        this.renderNormalModeVisuals();
        break;
      case 'path': {
        const path = options.pathVertices || options.activePath || [];
        this.renderPathModeVisuals(path);
        break;
      }
      case 'cycle': {
        const cycle = options.cycleVertices || options.activeCycle || [];
        this.renderCycleModeVisuals(cycle);
        break;
      }
      case 'subgraph': {
        const subNodes = options.subgraphNodes || options.activeSubgraphs || [];
        this.renderSubgraphModeVisuals(subNodes);
        break;
      }
      case 'degree':
        this.renderDegreeModeVisuals();
        break;
      case 'component':
        this.renderComponentModeVisuals(options);
        break;
      case 'lab':
        this.renderLabModeVisuals(options.lab || options);
        break;
    }
  }

  renderNormalModeVisuals() {
    // Normal balanced studio state
  }

  renderPathModeVisuals(pathVertices = []) {
    if (!pathVertices || pathVertices.length === 0) return;

    const pathSet = new Set(pathVertices);

    // Dim non-path elements
    this.nodeMeshes.forEach((mesh, id) => {
      if (!pathSet.has(id)) {
        mesh.material.transparent = true;
        mesh.material.opacity = 0.22;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('dimmed');
      } else {
        mesh.material.emissive.setHex(0x10B981);
        mesh.material.emissiveIntensity = 0.7;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('highlight-path');
      }
    });

    // Highlight path edges in brilliant emerald
    for (let i = 0; i < pathVertices.length - 1; i++) {
      const u = pathVertices[i];
      const v = pathVertices[i + 1];
      const edge = this.graphData.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
      if (edge) {
        const line = this.edgeObjects.get(edge.id);
        if (line) {
          line.material.color.setHex(0x10B981);
          line.material.opacity = 1.0;
        }
      }
    }
  }

  renderCycleModeVisuals(cycleVertices = []) {
    if (!cycleVertices || cycleVertices.length === 0) return;

    const cycleSet = new Set(cycleVertices);

    this.nodeMeshes.forEach((mesh, id) => {
      if (!cycleSet.has(id)) {
        mesh.material.transparent = true;
        mesh.material.opacity = 0.22;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('dimmed');
      } else {
        mesh.material.emissive.setHex(0xF59E0B);
        mesh.material.emissiveIntensity = 0.75;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('highlight-cycle');
      }
    });

    for (let i = 0; i < cycleVertices.length; i++) {
      const u = cycleVertices[i];
      const v = cycleVertices[(i + 1) % cycleVertices.length];
      const edge = this.graphData.edges.find((e) => (e.a === u && e.b === v) || (e.a === v && e.b === u));
      if (edge) {
        const line = this.edgeObjects.get(edge.id);
        if (line) {
          line.material.color.setHex(0xF59E0B);
          line.material.opacity = 1.0;
        }
      }
    }
  }

  renderSubgraphModeVisuals(selectedSubgraphs = new Set()) {
    const includedVertices = new Set();
    selectedSubgraphs.forEach((subKey) => {
      const sObj = this.graphData.featured.subgraphs[subKey];
      if (sObj) sObj.vertices.forEach((vid) => includedVertices.add(vid));
    });

    if (includedVertices.size === 0) return;

    this.nodeMeshes.forEach((mesh, id) => {
      if (!includedVertices.has(id)) {
        mesh.material.transparent = true;
        mesh.material.opacity = 0.18;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('dimmed');
      } else {
        mesh.material.emissiveIntensity = 0.6;
        const lbl = this.nodeLabels.get(id);
        if (lbl) lbl.element.classList.add('highlight-subgraph');
      }
    });

    this.edgeObjects.forEach((line, eId) => {
      const e = line.userData.edgeData;
      const inA = includedVertices.has(e.a);
      const inB = includedVertices.has(e.b);
      if (inA && inB) {
        line.material.color.setHex(0xEC4899);
        line.material.opacity = 1.0;
      } else if (inA || inB) {
        line.material.color.setHex(0x94A3B8);
        line.material.opacity = 0.35;
      } else {
        line.material.opacity = 0.1;
      }
    });
  }

  renderDegreeModeVisuals() {
    // Proportional physical scale: r(v) = 3.6 + 1.25 * deg(v)
    this.nodeMeshes.forEach((mesh, id) => {
      const deg = this.graphData.degree(id);
      const scaledR = 3.8 + deg * 1.35;
      mesh.scale.setScalar(scaledR);

      if (id === 'data') {
        // Maximal hub highlight
        mesh.material.emissive.setHex(0x10B981);
        mesh.material.emissiveIntensity = 0.8;
      }
    });
  }

  renderComponentModeVisuals(cutVertexRemoved = false) {
    if (cutVertexRemoved) {
      // Data cut vertex removed: isolates Dataset and increases components from 2 to 3
      const dataMesh = this.nodeMeshes.get('data');
      if (dataMesh) {
        dataMesh.material.transparent = true;
        dataMesh.material.opacity = 0.1;
      }

      const dsMesh = this.nodeMeshes.get('dataset');
      if (dsMesh) {
        dsMesh.material.color.setHex(0xE11D48);
        dsMesh.material.emissive.setHex(0xE11D48);
        dsMesh.material.emissiveIntensity = 0.85;
      }

      // Hide all incident edges of Data
      this.edgeObjects.forEach((line) => {
        const e = line.userData.edgeData;
        if (e.a === 'data' || e.b === 'data') {
          line.visible = false;
        }
      });
    } else {
      this.edgeObjects.forEach((line) => { line.visible = true; });
    }
  }

  renderLabModeVisuals(labState) {
    if (!labState) return;

    if (labState.glitch?.active) {
      // Sever bridge E18 in 3D
      const e18 = this.edgeObjects.get('E18');
      if (e18) {
        e18.material.color.setHex(0xE11D48);
        e18.material.opacity = Math.sin(performance.now() * 0.015) > 0 ? 0.9 : 0.1;
      }
      const ds = this.nodeMeshes.get('dataset');
      if (ds) {
        ds.material.color.setHex(0xE11D48);
        ds.material.emissive.setHex(0xE11D48);
        ds.material.emissiveIntensity = 0.9;
      }
    }
  }

  triggerScanner3D(onProgress, onComplete) {
    if (!this.scannerBeamMesh) return;
    this.scannerBeamMesh.visible = true;
    this.scannerBeamMesh.material.opacity = 0.75;

    const startY = 160;
    const endY = -160;
    const startTime = performance.now();
    const duration = 1200;

    const scanStep = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1.0);
      const curY = startY + (endY - startY) * t;

      this.scannerBeamMesh.position.y = curY;
      if (onProgress) onProgress(t);

      if (t < 1.0) {
        requestAnimationFrame(scanStep);
      } else {
        this.scannerBeamMesh.visible = false;
        this.scannerBeamMesh.material.opacity = 0;
        if (onComplete) onComplete();
      }
    };
    requestAnimationFrame(scanStep);
  }

  // ---------------- ANIMATION & RENDER LOOP ----------------
  animate(timestamp) {
    requestAnimationFrame(this.animate);

    const time = timestamp * 0.001;

    // 1. Camera Tweening
    if (this.isCameraFlying) {
      const elapsed = performance.now() - this.cameraFlightStartTime;
      const progress = Math.min(elapsed / this.cameraFlightDuration, 1.0);
      // Smooth cubic ease-out
      const ease = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(this.cameraFlightStart.pos, this.cameraFlightEnd.pos, ease);
      this.controls.target.lerpVectors(this.cameraFlightStart.target, this.cameraFlightEnd.target, ease);

      if (progress >= 1.0) {
        this.isCameraFlying = false;
      }
    }

    // 2. Update OrbitControls
    this.controls.update();

    // 3. Synaptic Organic Harmonic Motion
    if (this.isMotionActive) {
      let idx = 0;
      this.nodeMeshes.forEach((mesh, id) => {
        const orig = mesh.userData.originalPos;
        const phase = idx * 0.65;
        const amp = id === 'ai' ? 0.7 : 1.6;

        const dy = Math.sin(time * 1.35 + phase) * amp;
        const dx = Math.cos(time * 1.1 + phase * 1.2) * (amp * 0.65);

        mesh.position.y = orig.y + dy;
        mesh.position.x = orig.x + dx;

        idx++;
      });

      // Update 3D Edge Coordinates to follow moving nodes
      this.edgeObjects.forEach((line) => {
        const e = line.userData.edgeData;
        const m1 = this.nodeMeshes.get(e.a);
        const m2 = this.nodeMeshes.get(e.b);
        if (m1 && m2) {
          const posAttr = line.geometry.attributes.position;
          posAttr.setXYZ(0, m1.position.x, m1.position.y, m1.position.z);
          posAttr.setXYZ(1, m2.position.x, m2.position.y, m2.position.z);
          posAttr.needsUpdate = true;
        }
      });
    }

    // 4. Central Halo Rotation
    const aiMesh = this.nodeMeshes.get('ai');
    if (aiMesh && aiMesh.userData.halo) {
      aiMesh.userData.halo.rotation.z += 0.008;
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
  }
}
