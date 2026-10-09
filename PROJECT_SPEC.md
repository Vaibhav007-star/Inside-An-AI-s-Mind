# PROJECT SPEC: "INSIDE AN AI'S MIND: WHEN KNOWLEDGE BECOMES A GRAPH"

## 0. What this is
A CIA III-B creative artifact for "Graph Theory in My World". Team of 2, 10-minute oral
presentation. Area of interest = AI. We show how an AI's KNOWLEDGE can be modelled as a
graph and analyse it with Graph Theory.

GRAPH THEORY IS THE HERO. AI IS ONLY THE CREATIVE WORLD.

Mandatory framing (must appear in the artifact, e.g. in a footer line):
"A conceptual graph model used to demonstrate how Graph Theory can represent relationships
between knowledge concepts. It is not how a real AI stores knowledge internally."

## 1. Hard rules
DO NOT: build or simulate an actual AI/ML model; add future-planning, commercialization,
deployment, or "implementation" sections; use frameworks/libraries/CDNs/network calls
(must work offline by double-clicking index.html); make a generic AI dashboard or a
website with menus; use AI jargon beyond what a student can explain.
DO: use correct Graph Theory terminology; compute every number from the data; keep the
graph the main visual element; keep language student-friendly.

## 2. Graph conventions
- SIMPLE, UNDIRECTED graph (no loops, no multi-edges). The arrows in relationship
  descriptions are only reading direction; an edge works both ways.
- Terminology: vertex, edge, degree, path (no repeated vertex), cycle (closed path, length >= 3),
  connectivity, subgraph, connected component (maximal connected subgraph).
- A "subgraph" is NOT a "component". Vision/NLP/Learning are subgraphs of the main graph; they
  are NOT components because edges join them to the rest.
- The whole graph G has 2 components: the Main Knowledge Network (25 vertices) and the
  isolated Specialized Knowledge cluster (3 vertices).

## 3. Domains and colours
core      "Core"                  #FFD166 (gold)     -> AI
learning  "Learning and Data"     #22D3EE (cyan)     -> ml dl nn training model prediction feedback data dataset features patterns
vision    "Computer Vision"       #F472B6 (pink)     -> cv image objdet recognition
nlp       "Language (NLP)"        #4ADE80 (green)    -> nlp language words text meaning context
reasoning "Reasoning"             #FB923C (orange)   -> knowledge reasoning decision
special   "Specialized Knowledge" #A78BFA (violet)   -> chessrules gametree strategy
Background #05070F (near black). Glowing nodes. System font stack only.

## 4. Vertices (28)  id | label | meaning (<= 10 words)
ai          | AI                 | The whole system whose knowledge we model
ml          | Machine Learning   | AI that learns from examples
dl          | Deep Learning      | ML using many-layered neural networks
nn          | Neural Network     | Layers of connected units that learn patterns
training    | Training           | Adjusting the model using data
model       | Model              | What the AI has learned, ready to use
prediction  | Prediction         | The AI's best guess about something new
feedback    | Feedback           | Information on how good a prediction was
data        | Data               | Raw information the AI learns from
dataset     | Dataset            | An organised collection of data
features    | Features           | Measurable details taken from data
patterns    | Patterns           | Regularities found in features
cv          | Computer Vision    | AI that understands pictures
image       | Image              | A picture given to the AI
objdet      | Object Detection   | Finding objects inside an image
recognition | Recognition        | Naming what a detected object is
nlp         | NLP                | AI that understands human language
language    | Language           | A system of words and rules
words       | Words              | Basic units of language
text        | Text               | Written language
meaning     | Meaning            | What words actually express
context     | Context            | Surrounding situation that fixes meaning
knowledge   | Knowledge          | Organised understanding the AI can use
reasoning   | Reasoning          | Drawing conclusions from knowledge
decision    | Decision           | Choosing an action from conclusions
chessrules  | Chess Rules        | The legal moves of chess
gametree    | Game Tree          | All possible move sequences
strategy    | Strategy           | A plan chosen by searching the game tree

## 5. Edges (39)  id | a - b | meaning
E1  | ai - ml                | ML is the learning branch of AI
E2  | ai - cv                | Computer Vision lets AI see
E3  | ai - nlp               | NLP lets AI handle human language
E4  | ai - data              | AI depends on data
E5  | ai - knowledge         | AI keeps what it learned as knowledge
E6  | ml - dl                | Deep Learning is a type of ML
E7  | ml - training          | ML models learn through training
E8  | ml - prediction        | ML produces predictions
E9  | ml - model             | ML builds models
E10 | dl - nn                | Deep Learning uses neural networks
E11 | nn - training          | A neural network is adjusted by training
E12 | nn - model             | A trained neural network is a model
E13 | training - model       | Training shapes the model
E14 | model - prediction     | The model makes predictions
E15 | prediction - feedback  | Prediction results create feedback
E16 | feedback - data        | Feedback becomes new data
E17 | data - training        | Training uses data
E18 | data - dataset         | A dataset is an organised collection of data
E19 | data - features        | Features are extracted from data
E20 | features - patterns    | Patterns are found in features
E21 | patterns - prediction  | Patterns support predictions
E22 | cv - image             | Computer Vision works on images
E23 | image - objdet         | Objects are detected in an image
E24 | objdet - recognition   | Detected objects get recognised
E25 | recognition - knowledge| Recognition adds to knowledge
E26 | image - data           | An image is a kind of data
E27 | nlp - language         | NLP studies language
E28 | language - words       | Language is built from words
E29 | words - meaning        | Words carry meaning
E30 | meaning - context      | Context decides meaning
E31 | language - text        | Language is written as text
E32 | text - words           | Text is made of words
E33 | context - knowledge    | Context helps place knowledge
E34 | text - data            | Text is a kind of data
E35 | knowledge - reasoning  | Reasoning uses knowledge
E36 | reasoning - decision   | Reasoning leads to decisions
E37 | decision - prediction  | Decisions rely on predictions
E38 | chessrules - gametree  | Rules generate the game tree
E39 | gametree - strategy    | Strategy searches the game tree

## 6. Featured structures
PATHS (length = number of edges)
P1 "Learning path"      data -> features -> patterns -> prediction            (length 3)
P2 "Seeing path"        image -> objdet -> recognition -> knowledge           (length 3)
P3 "Language path"      language -> words -> meaning -> context               (length 3)

CYCLES
C1 "Learning loop" (MAIN, 5 vertices): data -> training -> model -> prediction -> feedback -> data
C2 triangle: training -> model -> nn -> training
C3 triangle: language -> words -> text -> language
(The graph has other cycles too, e.g. data-features-patterns-prediction-feedback-data. Only C1-C3 are featured.)

SUBGRAPHS (all induced: contain every edge of G between their vertices)
S1 Learning and Prediction : ml dl nn training model prediction feedback data dataset features patterns
S2 Computer Vision         : cv image objdet recognition
S3 Natural Language (NLP)  : nlp language words text meaning context
S4 Reasoning               : knowledge reasoning decision
(AI is not inside S1-S4; it is the central hub.)

COMPONENTS
K1 Main Knowledge Network : the 25 vertices in domains core, learning, vision, nlp, reasoning
K2 Specialized Knowledge  : chessrules gametree strategy (isolated from K1)

CONNECTIVITY DEMOS
- Shortest path dataset -> decision : dataset, data, feedback, prediction, decision (length 4)
- dataset -> strategy : NOT connected (different components)

BREAK DEMOS
- Remove vertex Data: Data is a cut vertex. Component count goes 2 -> 3
  (components become {Dataset}, the other 23 main vertices, and K2).
- Remove edge E18 (data-dataset): E18 is a bridge, Dataset becomes isolated.

## 7. GROUND TRUTH (verify.mjs must assert all of these)
Main component K1: 25 vertices, 37 edges. K2: 3 vertices, 2 edges.
Whole graph G: 28 vertices, 39 edges, 2 components.
Handshake: sum of degrees in K1 = 74 = 2 x 37. In G = 78 = 2 x 39.

Degrees:
Data 7 | AI 5 | Machine Learning 5 | Prediction 5
Training 4 | Model 4 | Knowledge 4
Neural Network 3 | Image 3 | Language 3 | Words 3 | Text 3
Deep Learning 2 | Feedback 2 | Features 2 | Patterns 2 | Computer Vision 2 |
Object Detection 2 | Recognition 2 | NLP 2 | Meaning 2 | Context 2 | Reasoning 2 | Decision 2
Dataset 1
Chess Rules 1 | Game Tree 2 | Strategy 1
Highest degree = Data (7), unique. Note AI (5) is NOT the most connected vertex.
K1 degree sequence: 7,5,5,5,4,4,4,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,1

Subgraphs (vertices / edges / boundary edges):
S1: 11 / 16 / 5   (internal edges E6 to E21; boundary E1, E4, E26, E34, E37)
S2:  4 /  3 / 3   (internal E22, E23, E24; boundary E2, E25, E26)
S3:  6 /  6 / 3   (internal E27 to E32; boundary E3, E33, E34)
S4:  3 /  2 / 4   (internal E35, E36; boundary E5, E25, E33, E37)
The code must compute these from the edge list; verify.mjs then asserts they match.

Cut vertex: Data = true. AI = false. Bridge: E18 = true.
After removing Data: 3 components total.
