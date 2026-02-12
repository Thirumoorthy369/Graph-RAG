// ============================================================
// Mock Data Module - Graph RAG Prototype
// ============================================================

const MOCK_CHUNKS = [
  {
    id: "chunk_001",
    text: "Dr. Ravi is a senior cardiologist with over 15 years of experience in interventional cardiology. He currently practices at Apollo Hospital in Chennai and specializes in treating complex heart conditions including coronary artery disease and heart failure.",
    tokenCount: 42,
    embedding: [0.12, -0.44, 0.98, 0.34, -0.22, 0.77, 0.09, -0.11, 0.63, 0.28],
  },
  {
    id: "chunk_002",
    text: "The Cardiology Department at Apollo Hospital is one of the leading cardiac care centers in South India. It treats a wide range of heart diseases including hypertension, arrhythmia, and congenital heart defects using state-of-the-art diagnostic and surgical equipment.",
    tokenCount: 47,
    embedding: [0.45, -0.31, 0.67, 0.12, -0.56, 0.89, -0.23, 0.41, 0.15, -0.08],
  },
  {
    id: "chunk_003",
    text: "Heart Disease remains the leading cause of mortality worldwide. In Chennai, the prevalence of cardiovascular diseases has been rising due to sedentary lifestyles and dietary habits. Early diagnosis and intervention by experienced cardiologists can significantly improve patient outcomes.",
    tokenCount: 44,
    embedding: [-0.33, 0.72, 0.18, -0.61, 0.44, 0.05, 0.91, -0.27, 0.53, 0.36],
  },
  {
    id: "chunk_004",
    text: "Dr. Meena is a neurologist based in Bangalore. She specializes in treating epilepsy and neurodegenerative disorders at the Neurology Department of Manipal Hospital. Her research focuses on early detection of Alzheimer's disease.",
    tokenCount: 39,
    embedding: [0.67, -0.15, 0.33, 0.82, -0.47, 0.21, -0.58, 0.44, 0.76, -0.19],
  },
  {
    id: "chunk_005",
    text: "Chennai is a major metropolitan city in Tamil Nadu, India. It is home to several world-class healthcare institutions including Apollo Hospital, MIOT International, and Fortis Malar Hospital. The city is often referred to as the healthcare capital of India.",
    tokenCount: 45,
    embedding: [-0.22, 0.55, -0.41, 0.68, 0.13, -0.77, 0.32, 0.89, -0.06, 0.47],
  },
  {
    id: "chunk_006",
    text: "Dr. Arjun is a leading oncologist at Tata Memorial Hospital in Mumbai. With 20 years of experience, he specializes in treating lung cancer and leukemia. The Oncology Department at Tata Memorial is recognized as one of the top cancer research and treatment centers in Asia.",
    tokenCount: 48,
    embedding: [0.81, -0.26, 0.53, -0.39, 0.17, 0.64, -0.72, 0.35, 0.48, -0.14],
  },
  {
    id: "chunk_007",
    text: "Dr. Priya is an orthopedic surgeon based in Delhi at AIIMS Hospital. She has 12 years of experience and specializes in joint replacement surgery and treating arthritis. The Orthopedics Department at AIIMS is a national leader in musculoskeletal care and sports medicine.",
    tokenCount: 46,
    embedding: [-0.18, 0.62, 0.29, 0.74, -0.55, 0.11, 0.87, -0.33, 0.41, 0.66],
  },
];

const GRAPH_NODES = [
  { id: "dr_ravi", label: "Dr. Ravi", type: "Doctor", properties: { experience: "15 years", hospital: "Apollo Hospital", specialty: "Interventional Cardiology" } },
  { id: "dr_meena", label: "Dr. Meena", type: "Doctor", properties: { experience: "10 years", hospital: "Manipal Hospital", specialty: "Neurology" } },
  { id: "cardiology", label: "Cardiology", type: "Department", properties: { hospital: "Apollo Hospital", staff: 45, beds: 120 } },
  { id: "neurology", label: "Neurology", type: "Department", properties: { hospital: "Manipal Hospital", staff: 30, beds: 80 } },
  { id: "heart_disease", label: "Heart Disease", type: "Disease", properties: { icd_code: "I25.9", severity: "High", prevalence: "Very Common" } },
  { id: "epilepsy", label: "Epilepsy", type: "Disease", properties: { icd_code: "G40", severity: "Moderate", prevalence: "Common" } },
  { id: "alzheimers", label: "Alzheimer's", type: "Disease", properties: { icd_code: "G30", severity: "High", prevalence: "Common" } },
  { id: "chennai", label: "Chennai", type: "City", properties: { state: "Tamil Nadu", population: "10.9M", hospitals: 250 } },
  { id: "bangalore", label: "Bangalore", type: "City", properties: { state: "Karnataka", population: "12.3M", hospitals: 300 } },
  { id: "dr_arjun", label: "Dr. Arjun", type: "Doctor", properties: { experience: "20 years", hospital: "Tata Memorial Hospital", specialty: "Oncology" } },
  { id: "dr_priya", label: "Dr. Priya", type: "Doctor", properties: { experience: "12 years", hospital: "AIIMS Hospital", specialty: "Orthopedic Surgery" } },
  { id: "oncology", label: "Oncology", type: "Department", properties: { hospital: "Tata Memorial Hospital", staff: 60, beds: 200 } },
  { id: "orthopedics", label: "Orthopedics", type: "Department", properties: { hospital: "AIIMS Hospital", staff: 50, beds: 150 } },
  { id: "lung_cancer", label: "Lung Cancer", type: "Disease", properties: { icd_code: "C34", severity: "Very High", prevalence: "Common" } },
  { id: "leukemia", label: "Leukemia", type: "Disease", properties: { icd_code: "C95", severity: "Very High", prevalence: "Moderate" } },
  { id: "arthritis", label: "Arthritis", type: "Disease", properties: { icd_code: "M13", severity: "Moderate", prevalence: "Very Common" } },
  { id: "mumbai", label: "Mumbai", type: "City", properties: { state: "Maharashtra", population: "20.7M", hospitals: 400 } },
  { id: "delhi", label: "Delhi", type: "City", properties: { state: "Delhi NCR", population: "19.0M", hospitals: 350 } },
];

const GRAPH_LINKS = [
  { source: "dr_ravi", target: "cardiology", label: "specializes_in" },
  { source: "dr_meena", target: "neurology", label: "specializes_in" },
  { source: "cardiology", target: "heart_disease", label: "treats" },
  { source: "neurology", target: "epilepsy", label: "treats" },
  { source: "neurology", target: "alzheimers", label: "treats" },
  { source: "dr_ravi", target: "chennai", label: "located_in" },
  { source: "dr_meena", target: "bangalore", label: "located_in" },
  { source: "cardiology", target: "chennai", label: "located_in" },
  { source: "neurology", target: "bangalore", label: "located_in" },
  { source: "dr_arjun", target: "oncology", label: "specializes_in" },
  { source: "dr_priya", target: "orthopedics", label: "specializes_in" },
  { source: "oncology", target: "lung_cancer", label: "treats" },
  { source: "oncology", target: "leukemia", label: "treats" },
  { source: "orthopedics", target: "arthritis", label: "treats" },
  { source: "dr_arjun", target: "mumbai", label: "located_in" },
  { source: "dr_priya", target: "delhi", label: "located_in" },
  { source: "oncology", target: "mumbai", label: "located_in" },
  { source: "orthopedics", target: "delhi", label: "located_in" },
];

const NODE_COLORS = {
  Doctor: { fill: "#4a9eff", stroke: "#2178d8", glow: "rgba(74, 158, 255, 0.6)" },
  Department: { fill: "#34d399", stroke: "#10b981", glow: "rgba(52, 211, 153, 0.6)" },
  Disease: { fill: "#f87171", stroke: "#ef4444", glow: "rgba(248, 113, 113, 0.6)" },
  City: { fill: "#fbbf24", stroke: "#f59e0b", glow: "rgba(251, 191, 36, 0.6)" },
};

const SAMPLE_QUERIES = [
  {
    question: "Which doctor treats heart problems in Chennai?",
    cypherQuery: `MATCH (d:Doctor)-[:specializes_in]->(dept:Department)-[:treats]->(dis:Disease),\n      (d)-[:located_in]->(c:City)\nWHERE dis.name CONTAINS 'Heart' AND c.name = 'Chennai'\nRETURN d.name, dept.name, dis.name, c.name`,
    highlightNodes: ["dr_ravi", "cardiology", "heart_disease", "chennai"],
    highlightEdges: ["specializes_in", "treats", "located_in"],
    retrievedFacts: [
      "Dr. Ravi specializes in Cardiology",
      "Cardiology department treats Heart Disease",
      "Dr. Ravi is located in Chennai",
      "Dr. Ravi has 15 years of experience",
    ],
    answer: "Based on the knowledge graph, **Dr. Ravi** is the doctor who treats heart problems in Chennai. He specializes in **Cardiology** at Apollo Hospital and has over **15 years of experience** in interventional cardiology. The Cardiology department specifically treats **Heart Disease** and related cardiovascular conditions.",
    pipelineSteps: {
      understanding: "Intent: Find doctors → treating heart conditions → located in Chennai",
      queryTranslation: "Entities: Heart Disease, Chennai | Relations: treats, located_in, specializes_in",
    },
  },
  {
    question: "Who treats epilepsy in Bangalore?",
    cypherQuery: `MATCH (d:Doctor)-[:specializes_in]->(dept:Department)-[:treats]->(dis:Disease),\n      (d)-[:located_in]->(c:City)\nWHERE dis.name = 'Epilepsy' AND c.name = 'Bangalore'\nRETURN d.name, dept.name, dis.name, c.name`,
    highlightNodes: ["dr_meena", "neurology", "epilepsy", "bangalore"],
    highlightEdges: ["specializes_in", "treats", "located_in"],
    retrievedFacts: [
      "Dr. Meena specializes in Neurology",
      "Neurology department treats Epilepsy",
      "Dr. Meena is located in Bangalore",
      "Dr. Meena has 10 years of experience",
    ],
    answer: "Based on the knowledge graph, **Dr. Meena** treats epilepsy in Bangalore. She specializes in **Neurology** at Manipal Hospital and has **10 years of experience**. Her department handles epilepsy and neurodegenerative disorders.",
    pipelineSteps: {
      understanding: "Intent: Find doctors → treating epilepsy → located in Bangalore",
      queryTranslation: "Entities: Epilepsy, Bangalore | Relations: treats, located_in, specializes_in",
    },
  },
  {
    question: "Which doctor treats cancer in Mumbai?",
    cypherQuery: `MATCH (d:Doctor)-[:specializes_in]->(dept:Department)-[:treats]->(dis:Disease),\n      (d)-[:located_in]->(c:City)\nWHERE dis.name CONTAINS 'Cancer' AND c.name = 'Mumbai'\nRETURN d.name, dept.name, dis.name, c.name`,
    highlightNodes: ["dr_arjun", "oncology", "lung_cancer", "leukemia", "mumbai"],
    highlightEdges: ["specializes_in", "treats", "located_in"],
    retrievedFacts: [
      "Dr. Arjun specializes in Oncology",
      "Oncology department treats Lung Cancer",
      "Oncology department treats Leukemia",
      "Dr. Arjun is located in Mumbai",
      "Dr. Arjun has 20 years of experience",
    ],
    answer: "Based on the knowledge graph, **Dr. Arjun** is the doctor who treats cancer in Mumbai. He specializes in **Oncology** at Tata Memorial Hospital and has **20 years of experience**. His department treats both **Lung Cancer** and **Leukemia**, making him one of the most experienced cancer specialists in the region.",
    pipelineSteps: {
      understanding: "Intent: Find doctors → treating cancer → located in Mumbai",
      queryTranslation: "Entities: Cancer, Mumbai | Relations: treats, located_in, specializes_in",
    },
  },
  {
    question: "Who treats arthritis in Delhi?",
    cypherQuery: `MATCH (d:Doctor)-[:specializes_in]->(dept:Department)-[:treats]->(dis:Disease),\n      (d)-[:located_in]->(c:City)\nWHERE dis.name = 'Arthritis' AND c.name = 'Delhi'\nRETURN d.name, dept.name, dis.name, c.name`,
    highlightNodes: ["dr_priya", "orthopedics", "arthritis", "delhi"],
    highlightEdges: ["specializes_in", "treats", "located_in"],
    retrievedFacts: [
      "Dr. Priya specializes in Orthopedics",
      "Orthopedics department treats Arthritis",
      "Dr. Priya is located in Delhi",
      "Dr. Priya has 12 years of experience",
    ],
    answer: "Based on the knowledge graph, **Dr. Priya** treats arthritis in Delhi. She specializes in **Orthopedics** at AIIMS Hospital and has **12 years of experience** in joint replacement surgery. The Orthopedics department at AIIMS is a national leader in **musculoskeletal care**.",
    pipelineSteps: {
      understanding: "Intent: Find doctors → treating arthritis → located in Delhi",
      queryTranslation: "Entities: Arthritis, Delhi | Relations: treats, located_in, specializes_in",
    },
  },
];

const PRESENTATION_STEPS = [
  {
    title: "Document Ingestion",
    description: "PDF documents are uploaded and processed for information extraction.",
    highlight: "upload",
    panel: "left",
  },
  {
    title: "Text Chunking",
    description: "Documents are split into semantic chunks with overlap for context preservation.",
    highlight: "chunks",
    panel: "left",
  },
  {
    title: "Embedding Generation",
    description: "Each chunk is converted into a dense vector representation using a language model.",
    highlight: "embeddings",
    panel: "left",
  },
  {
    title: "Knowledge Graph Extraction",
    description: "Named entities and relationships are extracted and stored as a graph structure.",
    highlight: "graph",
    panel: "middle",
  },
  {
    title: "Graph Query Execution",
    description: "User questions are translated into graph queries (Cypher) to retrieve relevant subgraphs.",
    highlight: "query",
    panel: "right",
  },
  {
    title: "LLM Answer Generation",
    description: "Retrieved graph context is fed to an LLM to generate a coherent, grounded answer.",
    highlight: "answer",
    panel: "right",
  },
];
