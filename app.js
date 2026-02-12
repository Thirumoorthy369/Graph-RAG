// ============================================================
// Main Application Logic - Graph RAG Prototype
// ============================================================

(function () {
  "use strict";

  // ---- State ----
  let graph = null;
  let documentUploaded = false;
  let currentQueryData = null;
  let pipelineRunning = false;

  // ---- DOM Refs ----
  const uploadArea = document.getElementById("uploadArea");
  const uploadBtn = document.getElementById("uploadBtn");
  const fileInfo = document.getElementById("fileInfo");
  const processing = document.getElementById("processing");
  const processingFill = document.getElementById("processingFill");
  const processingText = document.getElementById("processingText");
  const chunksContainer = document.getElementById("chunksContainer");
  const chunksList = document.getElementById("chunksList");
  const chunkCount = document.getElementById("chunkCount");

  const queryInput = document.getElementById("queryInput");
  const queryBtn = document.getElementById("queryBtn");
  const pipelineContainer = document.getElementById("pipelineContainer");

  const embeddingModal = document.getElementById("embeddingModal");
  const modalClose = document.getElementById("modalClose");
  const embeddingInfo = document.getElementById("embeddingInfo");
  const embeddingChart = document.getElementById("embeddingChart");
  const embeddingVector = document.getElementById("embeddingVector");

  const graphZoomIn = document.getElementById("graphZoomIn");
  const graphZoomOut = document.getElementById("graphZoomOut");
  const graphReset = document.getElementById("graphReset");

  const fileInput = document.getElementById("fileInput");
  const fileSizeText = document.getElementById("fileSizeText");
  const graphPlaceholder = document.getElementById("graphPlaceholder");
  const graphBuildStatus = document.getElementById("graphBuildStatus");
  const graphBuildText = document.getElementById("graphBuildText");

  // ---- Initialize ----
  function init() {
    // Init Knowledge Graph (empty — builds after upload)
    graph = new KnowledgeGraph("graphContainer", "graphSvg");
    requestAnimationFrame(() => {
      graph.init();
    });

    // Event listeners — open real file picker
    uploadArea.addEventListener("click", () => fileInput.click());
    uploadBtn.addEventListener("click", (e) => { e.stopPropagation(); fileInput.click(); });
    fileInput.addEventListener("change", handleFileSelected);
    queryBtn.addEventListener("click", handleQuery);
    queryInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleQuery();
    });
    modalClose.addEventListener("click", closeEmbeddingModal);
    embeddingModal.addEventListener("click", (e) => {
      if (e.target === embeddingModal) closeEmbeddingModal();
    });

    // Suggestion chips
    document.querySelectorAll(".suggestion-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        queryInput.value = chip.dataset.query;
        handleQuery();
      });
    });

    // Graph controls
    graphZoomIn.addEventListener("click", () => graph.zoomIn());
    graphZoomOut.addEventListener("click", () => graph.zoomOut());
    graphReset.addEventListener("click", () => graph.resetZoom());

    // Drag and drop on upload area
    uploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadArea.classList.add("drag-over");
    });
    uploadArea.addEventListener("dragleave", () => {
      uploadArea.classList.remove("drag-over");
    });
    uploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadArea.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });
  }

  // ---- File Selected via picker ----
  function handleFileSelected(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
  }

  // ---- Process the uploaded file ----
  function processFile(file) {
    if (documentUploaded) return;
    documentUploaded = true;

    // Show real file info
    const sizeStr = formatFileSize(file.size);
    document.getElementById("fileName").textContent = file.name;

    uploadArea.classList.add("hidden");
    processing.classList.remove("hidden");

    const steps = [
      { progress: 15, text: "Reading " + file.name + "..." },
      { progress: 30, text: "Extracting text content..." },
      { progress: 50, text: "Splitting into semantic chunks..." },
      { progress: 65, text: "Generating embedding vectors..." },
      { progress: 80, text: "Extracting entities & relationships..." },
      { progress: 95, text: "Building knowledge graph..." },
      { progress: 100, text: "Processing complete!" },
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        processingFill.style.width = steps[stepIndex].progress + "%";
        processingText.textContent = steps[stepIndex].text;
        stepIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          processing.classList.add("hidden");
          fileSizeText.textContent = sizeStr + " \u00b7 " + MOCK_CHUNKS.length + " chunks extracted";
          fileInfo.classList.remove("hidden");
          showChunks();

          // After chunks shown, start building the graph
          setTimeout(() => startGraphBuild(), 600);
        }, 400);
      }
    }, 550);
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  // ---- Animated Graph Build ----
  function startGraphBuild() {
    // Hide placeholder, show build status
    graphPlaceholder.classList.add("hidden");
    graphBuildStatus.classList.remove("hidden");
    graphBuildText.textContent = "Extracting entities...";

    graph.updateDimensions();

    graph.buildAnimated(
      // onProgress callback
      function (info) {
        if (info.phase === "nodes") {
          graphBuildText.textContent = "Found entity: " + info.currentEntity + " (" + info.currentType + ")";
        } else {
          graphBuildText.textContent = "Adding relationship: " + info.currentEntity;
        }
      },
      // onComplete callback
      function () {
        graphBuildStatus.classList.add("hidden");
      }
    );
  }

  // ---- Show Chunks ----
  function showChunks() {
    chunksContainer.classList.remove("hidden");
    chunkCount.textContent = MOCK_CHUNKS.length + " chunks";
    chunksList.innerHTML = "";

    MOCK_CHUNKS.forEach((chunk, i) => {
      const card = document.createElement("div");
      card.className = "chunk-card";
      card.style.animationDelay = (i * 0.1) + "s";

      card.innerHTML = `
        <div class="chunk-id">
          <span>${chunk.id}</span>
          <span class="chunk-tokens">${chunk.tokenCount} tokens</span>
        </div>
        <div class="chunk-text">${chunk.text}</div>
        <div class="chunk-actions">
          <button class="btn btn-ghost btn-sm view-embedding-btn" data-index="${i}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
            View Embedding
          </button>
        </div>
      `;

      chunksList.appendChild(card);
    });

    // Bind embedding buttons
    document.querySelectorAll(".view-embedding-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.index);
        openEmbeddingModal(MOCK_CHUNKS[idx]);
      });
    });
  }

  // ---- Embedding Modal ----
  function openEmbeddingModal(chunk) {
    embeddingInfo.innerHTML = `
      <div class="chunk-label">${chunk.id}</div>
      <div class="dim-count">${chunk.embedding.length}-dimensional embedding vector</div>
    `;

    // Render bar chart
    embeddingChart.innerHTML = "";
    const maxVal = Math.max(...chunk.embedding.map(Math.abs));

    chunk.embedding.forEach((val, i) => {
      const bar = document.createElement("div");
      const heightPct = (Math.abs(val) / maxVal) * 100;
      bar.className = `emb-bar ${val >= 0 ? "positive" : "negative"}`;

      if (val >= 0) {
        bar.style.height = heightPct + "%";
        bar.style.alignSelf = "flex-end";
      } else {
        bar.style.height = heightPct + "%";
        bar.style.alignSelf = "flex-end";
        bar.style.background = "var(--danger)";
        bar.style.opacity = "0.8";
      }

      bar.innerHTML = `<span class="emb-bar-label">d${i}</span>`;
      bar.title = `dim[${i}] = ${val}`;
      embeddingChart.appendChild(bar);

      // Animate
      bar.style.height = "0%";
      setTimeout(() => {
        bar.style.height = heightPct + "%";
      }, i * 50);
    });

    // Show raw vector
    embeddingVector.textContent = `[${chunk.embedding.join(", ")}]`;

    embeddingModal.classList.remove("hidden");
  }

  function closeEmbeddingModal() {
    embeddingModal.classList.add("hidden");
  }

  // ---- Query Pipeline ----
  function handleQuery() {
    if (pipelineRunning) return;
    const question = queryInput.value.trim();
    if (!question) {
      queryInput.value = "Which doctor treats heart problems in Chennai?";
      return;
    }

    // Find matching query data
    const q = question.toLowerCase();
    currentQueryData = SAMPLE_QUERIES.find((sq) => {
      const keywords = sq.question.toLowerCase();
      if (q.includes("heart") || q.includes("cardio") || q.includes("chennai")) return keywords.includes("heart");
      if (q.includes("epilepsy") || q.includes("neuro") || q.includes("bangalore")) return keywords.includes("epilepsy");
      if (q.includes("cancer") || q.includes("oncol") || q.includes("mumbai") || q.includes("leukemia")) return keywords.includes("cancer");
      if (q.includes("arthritis") || q.includes("ortho") || q.includes("delhi") || q.includes("joint")) return keywords.includes("arthritis");
      return false;
    }) || SAMPLE_QUERIES[0];

    pipelineRunning = true;

    // Reset graph highlight
    graph.resetHighlight();

    // Show pipeline
    pipelineContainer.classList.remove("hidden");
    resetPipeline();

    // Run steps sequentially
    runPipelineStep(1, question, 0);
  }

  function resetPipeline() {
    document.querySelectorAll(".pipeline-step").forEach((step) => {
      step.classList.remove("visible", "active", "completed");
      step.querySelector(".step-body").innerHTML = "";
    });
  }

  function runPipelineStep(stepNum, question, delay) {
    setTimeout(() => {
      const stepEl = document.querySelector(`[data-step="${stepNum}"]`);
      if (!stepEl) { pipelineRunning = false; return; }

      stepEl.classList.add("visible", "active");
      const body = stepEl.querySelector(".step-body");

      switch (stepNum) {
        case 1:
          body.innerHTML = `<div style="color:var(--text)">"${question}"</div>`;
          completeStep(stepNum, question, 600);
          break;

        case 2:
          body.innerHTML = `<div>${currentQueryData.pipelineSteps.understanding}</div>`;
          completeStep(stepNum, question, 800);
          break;

        case 3:
          body.innerHTML = `<div>${currentQueryData.pipelineSteps.queryTranslation}</div>`;
          completeStep(stepNum, question, 700);
          break;

        case 4:
          body.innerHTML = `<div class="cypher">${currentQueryData.cypherQuery}</div>`;
          // Highlight graph
          graph.highlightSubgraph(currentQueryData.highlightNodes, currentQueryData.highlightEdges);
          completeStep(stepNum, question, 1000);
          break;

        case 5:
          let factsHtml = "";
          currentQueryData.retrievedFacts.forEach((fact) => {
            factsHtml += `<div class="fact">${fact}</div>`;
          });
          body.innerHTML = factsHtml;
          completeStep(stepNum, question, 900);
          break;

        case 6:
          body.innerHTML = `<div style="color:var(--text-muted)">Generating response from retrieved context...<span class="typing-cursor"></span></div>`;
          completeStep(stepNum, question, 1200);
          break;

        case 7:
          // Typewriter effect for the answer
          typewriterAnswer(body, currentQueryData.answer);
          setTimeout(() => {
            stepEl.classList.remove("active");
            stepEl.classList.add("completed");
            pipelineRunning = false;
          }, currentQueryData.answer.length * 15 + 500);
          return;
      }
    }, delay);
  }

  function completeStep(stepNum, question, nextDelay) {
    setTimeout(() => {
      const stepEl = document.querySelector(`[data-step="${stepNum}"]`);
      stepEl.classList.remove("active");
      stepEl.classList.add("completed");
      runPipelineStep(stepNum + 1, question, 200);
    }, nextDelay);
  }

  function typewriterAnswer(container, text) {
    // Parse markdown bold
    const segments = parseMarkdown(text);
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "answer-text";
    container.appendChild(wrapper);

    let charIndex = 0;
    const plainText = text.replace(/\*\*/g, "");

    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";

    function typeNext() {
      if (charIndex < plainText.length) {
        // Build HTML progressively using segments
        wrapper.innerHTML = buildPartialHtml(segments, charIndex + 1);
        wrapper.appendChild(cursor);
        charIndex++;
        setTimeout(typeNext, 12 + Math.random() * 8);
      } else {
        cursor.remove();
      }
    }

    typeNext();
  }

  function parseMarkdown(text) {
    const segments = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), bold: false });
      }
      segments.push({ text: match[1], bold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), bold: false });
    }
    return segments;
  }

  function buildPartialHtml(segments, charCount) {
    let html = "";
    let remaining = charCount;

    for (const seg of segments) {
      if (remaining <= 0) break;
      const text = seg.text.slice(0, remaining);
      remaining -= text.length;
      html += seg.bold ? `<strong>${text}</strong>` : text;
    }
    return html;
  }

  // ---- Start ----
  document.addEventListener("DOMContentLoaded", init);
})();
