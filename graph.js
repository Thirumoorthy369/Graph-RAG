// ============================================================
// D3.js Knowledge Graph Visualization (Neo4j-style)
// ============================================================

class KnowledgeGraph {
  constructor(containerId, svgId) {
    this.container = document.getElementById(containerId);
    this.svgEl = document.getElementById(svgId);
    this.tooltip = document.getElementById("graphTooltip");
    this.width = 0;
    this.height = 0;
    this.simulation = null;
    this.svg = null;
    this.g = null;
    this.zoom = null;
    this.linkGroup = null;
    this.nodeGroup = null;
    this.linkLabelGroup = null;
    this.nodes = [];
    this.links = [];
    this.highlightedNodes = new Set();
    this.highlightedEdges = new Set();
  }

  init() {
    this.updateDimensions();
    this.svg = d3.select(this.svgEl)
      .attr("width", this.width)
      .attr("height", this.height);

    // Defs for glow filter
    const defs = this.svg.append("defs");

    // Glow filter
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "4").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Arrow markers for edges
    const markerTypes = ["specializes_in", "treats", "located_in"];
    markerTypes.forEach((t) => {
      defs.append("marker")
        .attr("id", `arrow-${t}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "rgba(107, 114, 128, 0.5)");
    });

    // Zoom behavior
    this.zoom = d3.zoom()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        this.g.attr("transform", event.transform);
      });
    this.svg.call(this.zoom);

    // Main group
    this.g = this.svg.append("g");

    // Layer groups
    this.linkGroup = this.g.append("g").attr("class", "links");
    this.linkLabelGroup = this.g.append("g").attr("class", "link-labels");
    this.nodeGroup = this.g.append("g").attr("class", "nodes");

    // Start empty — graph builds after document upload
    this.nodes = [];
    this.links = [];
    this.isBuilt = false;

    // Handle resize
    window.addEventListener("resize", () => this.onResize());
  }

  // Build graph incrementally node-by-node like a real product
  buildAnimated(onProgress, onComplete) {
    if (this.isBuilt) { if (onComplete) onComplete(); return; }

    const allNodes = GRAPH_NODES.map((d) => ({ ...d }));
    const allLinks = GRAPH_LINKS.map((d) => ({ ...d }));
    this.nodes = [];
    this.links = [];
    let nodeIndex = 0;
    const totalNodes = allNodes.length;
    const totalLinks = allLinks.length;

    const addNextNode = () => {
      if (nodeIndex >= totalNodes) {
        // All nodes added, now add edges one by one
        this._addEdgesAnimated(allLinks, 0, totalNodes, totalLinks, onProgress, onComplete);
        return;
      }

      const node = allNodes[nodeIndex];
      this.nodes.push(node);
      nodeIndex++;

      // Update stats
      if (onProgress) {
        onProgress({
          phase: "nodes",
          nodesDone: nodeIndex,
          totalNodes,
          linksDone: 0,
          totalLinks,
          currentEntity: node.label,
          currentType: node.type,
        });
      }

      document.getElementById("nodeCount").textContent = nodeIndex + " nodes";

      // Rebuild simulation with current data
      this._rebuildLive();

      setTimeout(addNextNode, 280);
    };

    addNextNode();
  }

  _addEdgesAnimated(allLinks, linkIndex, totalNodes, totalLinks, onProgress, onComplete) {
    if (linkIndex >= totalLinks) {
      this.isBuilt = true;
      if (onComplete) onComplete();
      return;
    }

    const link = allLinks[linkIndex];
    this.links.push(link);
    linkIndex++;

    if (onProgress) {
      onProgress({
        phase: "edges",
        nodesDone: totalNodes,
        totalNodes,
        linksDone: linkIndex,
        totalLinks,
        currentEntity: link.label,
        currentType: "Relationship",
      });
    }

    document.getElementById("edgeCount").textContent = linkIndex + " relationships";

    this._rebuildLive();

    setTimeout(() => this._addEdgesAnimated(allLinks, linkIndex, totalNodes, totalLinks, onProgress, onComplete), 180);
  }

  _rebuildLive() {
    if (this.simulation) this.simulation.stop();

    this.simulation = d3.forceSimulation(this.nodes)
      .force("link", d3.forceLink(this.links).id((d) => d.id).distance(120).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .force("x", d3.forceX(this.width / 2).strength(0.05))
      .force("y", d3.forceY(this.height / 2).strength(0.05))
      .alphaDecay(0.02)
      .on("tick", () => this.ticked());

    this.render();
  }

  updateDimensions() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
  }

  loadData() {
    this.nodes = GRAPH_NODES.map((d) => ({ ...d }));
    this.links = GRAPH_LINKS.map((d) => ({ ...d }));
  }

  createSimulation() {
    if (this.nodes.length === 0) return;
    this.simulation = d3.forceSimulation(this.nodes)
      .force("link", d3.forceLink(this.links).id((d) => d.id).distance(120).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .force("x", d3.forceX(this.width / 2).strength(0.05))
      .force("y", d3.forceY(this.height / 2).strength(0.05))
      .alphaDecay(0.02)
      .on("tick", () => this.ticked());
  }

  render() {
    if (this.nodes.length === 0) return;
    const self = this;

    // Links
    this.linkElements = this.linkGroup
      .selectAll("line")
      .data(this.links)
      .join("line")
      .attr("class", "link-line")
      .attr("marker-end", (d) => `url(#arrow-${d.label})`)
      .on("mouseover", function (event, d) {
        self.showEdgeTooltip(event, d);
        d3.select(this).classed("highlighted", true);
      })
      .on("mouseout", function () {
        self.hideTooltip();
        if (!self.highlightedEdges.has(d3.select(this).datum().label)) {
          d3.select(this).classed("highlighted", false);
        }
      });

    // Link labels
    this.linkLabelElements = this.linkLabelGroup
      .selectAll("text")
      .data(this.links)
      .join("text")
      .attr("class", "link-label")
      .text((d) => d.label);

    // Node groups
    this.nodeElements = this.nodeGroup
      .selectAll("g")
      .data(this.nodes)
      .join("g")
      .attr("class", "node-group")
      .call(this.drag());

    // Glow circle (behind)
    this.nodeElements.append("circle")
      .attr("class", "node-glow")
      .attr("r", 28)
      .attr("fill", (d) => NODE_COLORS[d.type].glow)
      .attr("opacity", 0);

    // Pulse circle for highlighted nodes
    this.nodeElements.append("circle")
      .attr("class", "node-pulse-ring")
      .attr("r", 26)
      .attr("fill", "none")
      .attr("stroke", (d) => NODE_COLORS[d.type].fill)
      .attr("stroke-width", 2)
      .attr("opacity", 0);

    // Main circle
    this.nodeElements.append("circle")
      .attr("class", "node-circle")
      .attr("r", 22)
      .attr("fill", (d) => NODE_COLORS[d.type].fill)
      .attr("stroke", (d) => NODE_COLORS[d.type].stroke)
      .attr("stroke-width", 2)
      .attr("filter", "url(#glow)")
      .on("mouseover", function (event, d) {
        self.showNodeTooltip(event, d);
        d3.select(this.parentNode).select(".node-glow").attr("opacity", 0.5);
      })
      .on("mouseout", function () {
        self.hideTooltip();
        d3.select(this.parentNode).select(".node-glow").attr("opacity", 0);
      });

    // Node label
    this.nodeElements.append("text")
      .attr("class", "node-label")
      .attr("dy", 36)
      .text((d) => d.label);

    // Initial animation
    this.nodeElements
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 80)
      .duration(600)
      .style("opacity", 1);

    this.linkElements
      .style("opacity", 0)
      .transition()
      .delay((d, i) => i * 60 + 200)
      .duration(500)
      .style("opacity", 1);
  }

  ticked() {
    if (!this.linkElements || !this.nodeElements) return;
    this.linkElements
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    if (this.linkLabelElements) {
      this.linkLabelElements
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2 - 6);
    }

    this.nodeElements
      .attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  drag() {
    const simulation = this.simulation;
    return d3.drag()
      .on("start", function (event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", function (event, d) {
        d.fx = event.x; d.fy = event.y;
      })
      .on("end", function (event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      });
  }

  showNodeTooltip(event, d) {
    const connections = this.links.filter(
      (l) => (l.source.id || l.source) === d.id || (l.target.id || l.target) === d.id
    );

    let propsHtml = '<div class="tooltip-props">';
    if (d.properties) {
      Object.entries(d.properties).forEach(([k, v]) => {
        propsHtml += `<div><strong>${k}:</strong> ${v}</div>`;
      });
    }
    propsHtml += "</div>";

    let relHtml = '<div class="tooltip-relations">';
    connections.forEach((c) => {
      const src = typeof c.source === "object" ? c.source.label : c.source;
      const tgt = typeof c.target === "object" ? c.target.label : c.target;
      relHtml += `<div><span class="tooltip-rel-label">${c.label}</span> → ${tgt === d.label ? src : tgt}</div>`;
    });
    relHtml += "</div>";

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${d.label}</div>
      <div class="tooltip-type ${d.type}">${d.type}</div>
      ${propsHtml}
      ${relHtml}
    `;

    this.positionTooltip(event);
    this.tooltip.classList.remove("hidden");
  }

  showEdgeTooltip(event, d) {
    const src = typeof d.source === "object" ? d.source.label : d.source;
    const tgt = typeof d.target === "object" ? d.target.label : d.target;
    this.tooltip.innerHTML = `
      <div class="tooltip-title">${d.label}</div>
      <div style="font-size:11px;color:var(--text-secondary)">${src} → ${tgt}</div>
    `;
    this.positionTooltip(event);
    this.tooltip.classList.remove("hidden");
  }

  positionTooltip(event) {
    const panelRect = this.container.closest(".panel").getBoundingClientRect();
    const x = event.clientX - panelRect.left + 12;
    const y = event.clientY - panelRect.top + 12;
    this.tooltip.style.left = x + "px";
    this.tooltip.style.top = y + "px";
  }

  hideTooltip() {
    this.tooltip.classList.add("hidden");
  }

  // Highlight specific nodes and edges (for query visualization)
  highlightSubgraph(nodeIds, edgeLabels) {
    this.highlightedNodes = new Set(nodeIds);
    this.highlightedEdges = new Set(edgeLabels);

    // Dim non-highlighted nodes
    this.nodeElements.each(function (d) {
      const isHighlighted = nodeIds.includes(d.id);
      d3.select(this)
        .select(".node-circle")
        .transition()
        .duration(400)
        .attr("r", isHighlighted ? 26 : 18)
        .style("opacity", isHighlighted ? 1 : 0.3);

      d3.select(this)
        .select(".node-label")
        .transition()
        .duration(400)
        .style("opacity", isHighlighted ? 1 : 0.3);

      // Show pulse on highlighted
      d3.select(this)
        .select(".node-pulse-ring")
        .attr("opacity", isHighlighted ? 0.6 : 0)
        .attr("class", isHighlighted ? "node-pulse-ring node-pulse" : "node-pulse-ring");
    });

    // Highlight edges
    this.linkElements
      .classed("highlighted", (d) => {
        const srcId = typeof d.source === "object" ? d.source.id : d.source;
        const tgtId = typeof d.target === "object" ? d.target.id : d.target;
        return nodeIds.includes(srcId) && nodeIds.includes(tgtId);
      })
      .transition()
      .duration(400)
      .style("opacity", (d) => {
        const srcId = typeof d.source === "object" ? d.source.id : d.source;
        const tgtId = typeof d.target === "object" ? d.target.id : d.target;
        return nodeIds.includes(srcId) && nodeIds.includes(tgtId) ? 1 : 0.15;
      });

    this.linkLabelElements
      .classed("highlighted", (d) => {
        const srcId = typeof d.source === "object" ? d.source.id : d.source;
        const tgtId = typeof d.target === "object" ? d.target.id : d.target;
        return nodeIds.includes(srcId) && nodeIds.includes(tgtId);
      })
      .transition()
      .duration(400)
      .style("opacity", (d) => {
        const srcId = typeof d.source === "object" ? d.source.id : d.source;
        const tgtId = typeof d.target === "object" ? d.target.id : d.target;
        return nodeIds.includes(srcId) && nodeIds.includes(tgtId) ? 1 : 0.15;
      });
  }

  // Reset highlight
  resetHighlight() {
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();

    this.nodeElements.each(function () {
      d3.select(this)
        .select(".node-circle")
        .transition()
        .duration(400)
        .attr("r", 22)
        .style("opacity", 1);

      d3.select(this)
        .select(".node-label")
        .transition()
        .duration(400)
        .style("opacity", 1);

      d3.select(this)
        .select(".node-pulse-ring")
        .attr("opacity", 0)
        .attr("class", "node-pulse-ring");
    });

    this.linkElements
      .classed("highlighted", false)
      .transition()
      .duration(400)
      .style("opacity", 1);

    this.linkLabelElements
      .classed("highlighted", false)
      .transition()
      .duration(400)
      .style("opacity", 1);
  }

  // Zoom controls
  zoomIn() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 1.3);
  }

  zoomOut() {
    this.svg.transition().duration(300).call(this.zoom.scaleBy, 0.7);
  }

  resetZoom() {
    this.svg.transition().duration(500).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(0, 0).scale(1)
    );
    this.resetHighlight();
  }

  onResize() {
    this.updateDimensions();
    this.svg.attr("width", this.width).attr("height", this.height);
    if (this.simulation) {
      this.simulation.force("center", d3.forceCenter(this.width / 2, this.height / 2));
      this.simulation.alpha(0.3).restart();
    }
  }
}
