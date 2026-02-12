// ============================================================
// Presentation Mode - Graph RAG Prototype
// ============================================================

(function () {
  "use strict";

  let currentStep = 0;
  let isActive = false;

  const overlay = document.getElementById("presentationOverlay");
  const toggleBtn = document.getElementById("presentationToggle");
  const closeBtn = document.getElementById("presClose");
  const prevBtn = document.getElementById("presPrev");
  const nextBtn = document.getElementById("presNext");
  const stepIndicator = document.getElementById("presStepIndicator");
  const stepTitle = document.getElementById("presStepTitle");
  const stepDescription = document.getElementById("presStepDescription");
  const presVisual = document.getElementById("presVisual");
  const presCounter = document.getElementById("presCounter");
  const presMain = document.getElementById("presMain");

  function init() {
    toggleBtn.addEventListener("click", openPresentation);
    closeBtn.addEventListener("click", closePresentation);
    prevBtn.addEventListener("click", prevStep);
    nextBtn.addEventListener("click", nextStep);

    // Keyboard nav
    document.addEventListener("keydown", (e) => {
      if (!isActive) return;
      if (e.key === "Escape") closePresentation();
      if (e.key === "ArrowRight" || e.key === " ") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    });
  }

  function openPresentation() {
    isActive = true;
    currentStep = 0;
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    buildStepIndicator();
    renderStep();
  }

  function closePresentation() {
    isActive = false;
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
    // Remove panel highlights
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("panel-highlight"));
  }

  function buildStepIndicator() {
    stepIndicator.innerHTML = "";
    PRESENTATION_STEPS.forEach((_, i) => {
      const dot = document.createElement("div");
      dot.className = "pres-dot" + (i === 0 ? " active" : "");
      dot.addEventListener("click", () => { currentStep = i; renderStep(); });
      stepIndicator.appendChild(dot);
    });
  }

  function updateIndicator() {
    stepIndicator.querySelectorAll(".pres-dot").forEach((dot, i) => {
      dot.className = "pres-dot";
      if (i < currentStep) dot.classList.add("completed");
      if (i === currentStep) dot.classList.add("active");
    });
  }

  function renderStep() {
    const step = PRESENTATION_STEPS[currentStep];
    if (!step) return;

    // Animate transition
    presMain.style.animation = "none";
    // Trigger reflow
    void presMain.offsetHeight;
    presMain.style.animation = "presSlide 0.5s ease";

    stepTitle.textContent = step.title;
    stepDescription.textContent = step.description;
    presCounter.textContent = `${currentStep + 1} / ${PRESENTATION_STEPS.length}`;

    // Update buttons
    prevBtn.style.visibility = currentStep === 0 ? "hidden" : "visible";
    nextBtn.textContent = currentStep === PRESENTATION_STEPS.length - 1 ? "Finish" : "Next";
    if (currentStep < PRESENTATION_STEPS.length - 1) {
      nextBtn.innerHTML = `Next <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    }

    updateIndicator();
    renderVisual(step);

    // Highlight corresponding panel
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("panel-highlight"));
  }

  function renderVisual(step) {
    presVisual.innerHTML = "";

    switch (step.highlight) {
      case "upload":
        presVisual.innerHTML = `
          <div class="pres-visual-content" style="text-align:center">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.2" style="margin-bottom:16px">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <div style="font-size:20px;font-weight:600;margin-bottom:8px;">medical_records.pdf</div>
            <div style="font-size:14px;color:var(--text-secondary)">2.4 MB · Multi-page medical document</div>
            <div style="margin-top:20px;display:flex;gap:8px;justify-content:center">
              <span style="background:var(--surface);padding:6px 14px;border-radius:20px;font-size:12px;border:1px solid var(--border)">
                📄 PDF Parsing
              </span>
              <span style="background:var(--surface);padding:6px 14px;border-radius:20px;font-size:12px;border:1px solid var(--border)">
                🔤 OCR Support
              </span>
              <span style="background:var(--surface);padding:6px 14px;border-radius:20px;font-size:12px;border:1px solid var(--border)">
                🏗️ Layout Analysis
              </span>
            </div>
          </div>`;
        break;

      case "chunks":
        presVisual.innerHTML = `
          <div class="pres-visual-content">
            <div class="pres-chunk-demo">
              ${MOCK_CHUNKS.slice(0, 3).map((c, i) => `
                <div class="pres-chunk-card" style="animation: chunkSlideIn 0.5s ease ${i * 0.15}s forwards; opacity:0">
                  <div class="cc-id">${c.id}</div>
                  <div class="cc-text">${c.text.slice(0, 80)}...</div>
                  <div style="font-size:10px;color:var(--text-muted);margin-top:6px">${c.tokenCount} tokens</div>
                </div>
              `).join("")}
            </div>
            <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted)">
              Semantic chunking with overlap for context preservation
            </div>
          </div>`;
        break;

      case "embeddings":
        const emb = MOCK_CHUNKS[0].embedding;
        const maxVal = Math.max(...emb.map(Math.abs));
        presVisual.innerHTML = `
          <div class="pres-visual-content" style="text-align:center">
            <div style="font-size:13px;color:var(--accent);font-weight:600;margin-bottom:16px">chunk_001 → 10-dim Embedding Vector</div>
            <div class="pres-embed-bars">
              ${emb.map((v, i) => {
                const h = (Math.abs(v) / maxVal) * 100;
                const color = v >= 0 ? "var(--accent)" : "var(--danger)";
                return `<div class="pres-bar" style="height:${h}%;background:${color};opacity:0.8" title="dim[${i}]=${v}"></div>`;
              }).join("")}
            </div>
            <div style="margin-top:16px;font-family:monospace;font-size:11px;color:var(--text-secondary)">
              [${emb.join(", ")}]
            </div>
          </div>`;
        break;

      case "graph":
        presVisual.innerHTML = `
          <div class="pres-visual-content">
            <div class="pres-graph-mini">
              <div class="pres-node" style="background:#4a9eff">Dr. Ravi</div>
              <div class="pres-edge">→<br><span style="font-size:10px;color:var(--accent)">specializes_in</span></div>
              <div class="pres-node" style="background:#34d399">Cardiology</div>
              <div class="pres-edge">→<br><span style="font-size:10px;color:var(--accent)">treats</span></div>
              <div class="pres-node" style="background:#f87171">Heart Disease</div>
            </div>
            <div style="text-align:center;margin-top:20px">
              <div class="pres-graph-mini" style="justify-content:center">
                <div class="pres-node" style="background:#4a9eff;width:50px;height:50px;font-size:9px">Dr. Ravi</div>
                <div class="pres-edge">→<br><span style="font-size:10px;color:var(--accent)">located_in</span></div>
                <div class="pres-node" style="background:#fbbf24;color:#000">Chennai</div>
              </div>
            </div>
            <div style="text-align:center;margin-top:16px;font-size:13px;color:var(--text-muted)">
              Force-directed graph with entities and relationships
            </div>
          </div>`;
        break;

      case "query":
        presVisual.innerHTML = `
          <div class="pres-visual-content" style="text-align:left">
            <div style="font-size:14px;color:var(--text);margin-bottom:16px">
              <strong>User:</strong> "Which doctor treats heart problems in Chennai?"
            </div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Translated to Cypher Query:</div>
            <div class="pres-cypher-demo">
MATCH (d:Doctor)-[:specializes_in]->(dept:Department)
      -[:treats]->(dis:Disease),
      (d)-[:located_in]->(c:City)
WHERE dis.name CONTAINS 'Heart'
  AND c.name = 'Chennai'
RETURN d.name, dept.name, dis.name
            </div>
          </div>`;
        break;

      case "answer":
        presVisual.innerHTML = `
          <div class="pres-visual-content">
            <div style="font-size:12px;color:var(--accent);font-weight:600;margin-bottom:12px">RETRIEVED CONTEXT</div>
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:20px;line-height:1.8">
              → Dr. Ravi specializes in Cardiology<br>
              → Cardiology department treats Heart Disease<br>
              → Dr. Ravi is located in Chennai<br>
              → Dr. Ravi has 15 years of experience
            </div>
            <div style="border-top:1px solid var(--border);padding-top:16px">
              <div style="font-size:12px;color:var(--success);font-weight:600;margin-bottom:8px">LLM GENERATED ANSWER</div>
              <div class="pres-answer-demo">
                Based on the knowledge graph, <strong>Dr. Ravi</strong> is the doctor who treats heart problems in Chennai. He specializes in <strong>Cardiology</strong> at Apollo Hospital and has over <strong>15 years of experience</strong> in interventional cardiology.
              </div>
            </div>
          </div>`;
        break;
    }
  }

  function nextStep() {
    if (currentStep < PRESENTATION_STEPS.length - 1) {
      currentStep++;
      renderStep();
    } else {
      closePresentation();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
