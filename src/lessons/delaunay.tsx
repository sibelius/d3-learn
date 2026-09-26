import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Give D3 a cloud of points and <code>d3-delaunay</code> can answer two closely related questions very quickly.
        <strong> Which points are neighbors?</strong> (the Delaunay triangulation) and{" "}
        <strong>which region of the plane is closest to each point?</strong> (the Voronoi diagram). Those two
        structures power a surprising amount of everyday visualization work: hover tooltips on dense scatterplots,
        nearest-neighbor search, mesh generation, stippling, and organic-looking tessellations.
      </p>

      <h2>Triangulations from first principles</h2>
      <p>
        A <em>triangulation</em> connects a set of points into non-overlapping triangles that cover their convex hull.
        There are many ways to do that; the <strong>Delaunay</strong> triangulation is the special one where no point
        lies inside the circumcircle of any triangle. That rule avoids long skinny triangles and guarantees that each
        point is connected to its natural neighbors. <code>d3-delaunay</code> is built on the extremely fast{" "}
        <em>Delaunator</em> library and triangulates hundreds of thousands of points in milliseconds.
      </p>
      <p>
        Create one with <code>d3.Delaunay.from(points)</code>. By default each point is an <code>[x, y]</code> array,
        but you can pass accessors: <code>d3.Delaunay.from(data, d =&gt; d.x, d =&gt; d.y)</code>. The result stores
        everything in flat typed arrays for speed:
      </p>
      <ApiTable
        rows={[
          ["delaunay.points", "Flat Float64Array [x0, y0, x1, y1, …] of the input coordinates."],
          ["delaunay.triangles", "Uint32Array of point indices; every three consecutive entries form a triangle."],
          ["delaunay.halfedges", "For half-edge e, the index of the opposite half-edge in the adjacent triangle, or -1 on the hull."],
          ["delaunay.hull", "Point indices of the convex hull, in counterclockwise order."],
          ["delaunay.inedges", "For point i, one incoming half-edge (useful for walking around a point)."],
          ["delaunay.render(context?)", "Draw all edges. Without a context, returns an SVG path string."],
          ["delaunay.renderHull / renderPoints(ctx, r) / renderTriangle(t)", "Draw the hull, the points as circles, or one triangle."],
          ["delaunay.trianglePolygons()", "Iterate over triangles as closed polygons [[x,y], …]."],
          ["delaunay.neighbors(i)", "Iterate over the indices of points connected to point i."],
          ["delaunay.find(x, y, i?)", "Index of the point closest to (x, y). Optional starting hint i makes repeated searches very fast."],
          ["delaunay.update()", "Re-triangulate after mutating delaunay.points in place."],
          ["delaunay.voronoi([xmin, ymin, xmax, ymax])", "Build the Voronoi diagram, clipped to the given bounds."],
        ]}
      />
      <Playground
        title="Your first triangulation"
        code={`
const W = 640, H = 360;
const rand = d3.randomLcg(7);
const points = Array.from({ length: 60 }, () => [20 + rand() * (W - 40), 20 + rand() * (H - 40)]);

const delaunay = d3.Delaunay.from(points);
log("points:", points.length, "→ flat coords:", delaunay.points.length);
log("triangles:", delaunay.triangles.length / 3);
log("first triangle (point indices):", Array.from(delaunay.triangles.slice(0, 3)));
log("hull size:", delaunay.hull.length);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);

// Fill each triangle, colored by its area
const tris = Array.from(delaunay.trianglePolygons());
const area = tris.map((t) => Math.abs(d3.polygonArea(t)));
const color = d3.scaleSequential(d3.interpolateBlues).domain([d3.max(area), 0]);

svg.append("g")
  .selectAll("path")
  .data(tris)
  .join("path")
    .attr("d", (t) => "M" + t.join("L") + "Z")
    .attr("fill", (t, i) => color(area[i]))
    .attr("fill-opacity", 0.7);

// All edges at once as one path string
svg.append("path")
    .attr("d", delaunay.render())
    .attr("fill", "none")
    .attr("stroke", "#1c1b19")
    .attr("stroke-opacity", 0.35);

svg.append("path")
    .attr("d", delaunay.renderHull())
    .attr("fill", "none")
    .attr("stroke", "#e8590c")
    .attr("stroke-width", 2.5);

svg.append("path")
    .attr("d", delaunay.renderPoints(null, 3))
    .attr("fill", "#1c1b19");
`}
      />

      <h2>Half-edges and neighbors</h2>
      <p>
        The flat arrays use a <strong>half-edge</strong> representation. Half-edge <code>e</code> belongs to triangle{" "}
        <code>Math.floor(e / 3)</code> and goes from point <code>triangles[e]</code> to the next vertex of the same
        triangle. <code>halfedges[e]</code> is the twin half-edge going the other way in the neighboring triangle (or{" "}
        <code>-1</code> on the hull). To visit every edge exactly once, keep only the half-edges where{" "}
        <code>e &gt; halfedges[e]</code>:
      </p>
      <CodeBlock>{`
const { triangles, halfedges, points } = delaunay;
const next = (e) => (e % 3 === 2 ? e - 2 : e + 1);
for (let e = 0; e < halfedges.length; e++) {
  if (e < halfedges[e]) continue;          // its twin handles it (hull edges have -1)
  const p = triangles[e], q = triangles[next(e)];
  drawLine(points[2 * p], points[2 * p + 1], points[2 * q], points[2 * q + 1]);
}
`}</CodeBlock>
      <p>
        Most of the time you don&apos;t need to touch half-edges directly: <code>delaunay.neighbors(i)</code> walks them
        for you. Hover the triangulation below — the point under the cursor is found with <code>delaunay.find</code>,
        and its neighbors are highlighted. The edges are drawn with the half-edge loop above, colored by length.
      </p>
      <Playground
        title="Edges via half-edges, neighbors on hover"
        code={`
const W = 640, H = 360;
const rand = d3.randomLcg(3);
const points = Array.from({ length: 120 }, () => [10 + rand() * (W - 20), 10 + rand() * (H - 20)]);
const delaunay = d3.Delaunay.from(points);
const { triangles, halfedges } = delaunay;
const next = (e) => (e % 3 === 2 ? e - 2 : e + 1);

const edges = [];
for (let e = 0; e < halfedges.length; e++) {
  if (e < halfedges[e]) continue;
  const a = points[triangles[e]], b = points[triangles[next(e)]];
  edges.push({ a, b, len: Math.hypot(a[0] - b[0], a[1] - b[1]) });
}
log("unique edges:", edges.length, "(half-edges:", halfedges.length + ")");

const color = d3.scaleSequential(d3.interpolatePlasma).domain([d3.max(edges, (d) => d.len), 0]);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("cursor", "crosshair");

svg.append("g").selectAll("line").data(edges).join("line")
    .attr("x1", (d) => d.a[0]).attr("y1", (d) => d.a[1])
    .attr("x2", (d) => d.b[0]).attr("y2", (d) => d.b[1])
    .attr("stroke", (d) => color(d.len))
    .attr("stroke-width", 1.2);

const hi = svg.append("g");
const dots = svg.append("g").selectAll("circle").data(points).join("circle")
    .attr("cx", (d) => d[0]).attr("cy", (d) => d[1]).attr("r", 2.5).attr("fill", "#343a40");

svg.append("rect").attr("width", W).attr("height", H).attr("fill", "transparent")
  .on("pointermove", (event) => {
    const [mx, my] = d3.pointer(event);
    const i = delaunay.find(mx, my);
    const nb = Array.from(delaunay.neighbors(i));
    hi.selectAll("line").data(nb).join("line")
        .attr("x1", points[i][0]).attr("y1", points[i][1])
        .attr("x2", (j) => points[j][0]).attr("y2", (j) => points[j][1])
        .attr("stroke", "#1c1b19").attr("stroke-width", 3);
    dots.attr("r", (d, k) => (k === i ? 7 : nb.includes(k) ? 5 : 2.5))
        .attr("fill", (d, k) => (k === i ? "#e8590c" : nb.includes(k) ? "#1971c2" : "#343a40"));
  })
  .on("pointerleave", () => {
    hi.selectAll("*").remove();
    dots.attr("r", 2.5).attr("fill", "#343a40");
  });
`}
      />

      <h2>The Voronoi diagram</h2>
      <p>
        The Voronoi diagram is the <em>dual</em> of the Delaunay triangulation. Each input point gets a{" "}
        <strong>cell</strong>: the region of the plane closer to that point than to any other. The cell vertices are
        exactly the circumcenters of the Delaunay triangles, and two cells share an edge exactly when their points are
        Delaunay neighbors. Because the outer cells are infinite, you always give <code>voronoi()</code> a clipping
        rectangle <code>[xmin, ymin, xmax, ymax]</code> (default <code>[0, 0, 960, 500]</code>).
      </p>
      <ApiTable
        rows={[
          ["voronoi.render(ctx?)", "Draw all cell edges (the mesh) — one path string without a context."],
          ["voronoi.renderBounds(ctx?)", "Draw the clipping rectangle."],
          ["voronoi.renderCell(i, ctx?)", "Draw cell i as a closed path."],
          ["voronoi.cellPolygon(i)", "Cell i as a closed polygon [[x0,y0], …, [x0,y0]], or null if empty."],
          ["voronoi.cellPolygons()", "Iterate all non-empty cells; each polygon has an .index property."],
          ["voronoi.contains(i, x, y)", "True if (x, y) is inside cell i."],
          ["voronoi.neighbors(i)", "Indices of cells sharing an edge with cell i (after clipping)."],
          ["voronoi.circumcenters", "Flat array of triangle circumcenters [cx0, cy0, …] — the cell vertices."],
          ["voronoi.xmin/ymin/xmax/ymax", "The clipping bounds."],
          ["voronoi.update()", "Recompute after mutating delaunay.points in place (also updates the triangulation)."],
        ]}
      />
      <Playground
        title="Colored Voronoi cells"
        code={`
const W = 640, H = 380;
const rand = d3.randomLcg(11);
const points = Array.from({ length: 80 }, () => [rand() * W, rand() * H]);
const delaunay = d3.Delaunay.from(points);
const voronoi = delaunay.voronoi([0, 0, W, H]);

log("cell 0 polygon has", voronoi.cellPolygon(0).length - 1, "vertices");
log("cell 0 neighbors:", Array.from(voronoi.neighbors(0)));

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const color = d3.scaleSequential(d3.interpolateRainbow);

svg.append("g")
  .selectAll("path")
  .data(points)
  .join("path")
    .attr("d", (d, i) => voronoi.renderCell(i))
    .attr("fill", (d) => color((d[0] + d[1]) / (W + H)))
    .attr("fill-opacity", 0.35)
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .on("pointerenter", function () { d3.select(this).attr("fill-opacity", 0.9); })
    .on("pointerleave", function () { d3.select(this).attr("fill-opacity", 0.35); });

// The dual: faint Delaunay edges on top
svg.append("path")
    .attr("d", delaunay.render())
    .attr("fill", "none").attr("stroke", "#1c1b19").attr("stroke-opacity", 0.12)
    .attr("pointer-events", "none");

svg.append("path")
    .attr("d", delaunay.renderPoints(null, 2.5))
    .attr("fill", "#1c1b19").attr("pointer-events", "none");
`}
      />

      <h2>Voronoi tooltips: the classic hover technique</h2>
      <p>
        Hovering tiny dots in a scatterplot is frustrating: the targets are a few pixels wide and overlap. The fix is
        to make <em>every pixel</em> of the plot belong to its nearest point. You could draw invisible Voronoi cells,
        but it&apos;s even simpler (and faster) to skip the DOM entirely: put one transparent rectangle over the plot,
        and on <code>pointermove</code> call <code>delaunay.find(x, y)</code> with the pointer position. The search
        walks the triangulation from a starting point and typically finishes in a handful of steps.
      </p>
      <Callout type="warning" title="Build the Delaunay in pixel space">
        <p>
          <code>find</code> uses Euclidean distance, so triangulate the <em>scaled</em> positions (
          <code>d3.Delaunay.from(data, d =&gt; x(d.hp), d =&gt; y(d.mpg))</code>), not the raw data values — otherwise
          an axis measured in thousands would dominate one measured in single digits. Remember to rebuild it when
          scales change (resize, zoom).
        </p>
      </Callout>
      <Playground
        title="Scatterplot with Voronoi hover"
        code={`
const W = 640, H = 400, m = { top: 20, right: 20, bottom: 40, left: 50 };
const rand = d3.randomLcg(5);
const normal = d3.randomNormal.source(rand);
const origins = ["USA", "Europe", "Japan"];
const data = Array.from({ length: 400 }, (_, i) => {
  const o = origins[i % 3];
  const hp = Math.max(45, normal(o === "USA" ? 150 : 95, o === "USA" ? 40 : 22)());
  const mpg = Math.max(9, 48 - hp * 0.16 + normal(0, 3)());
  return { name: o + " car #" + (i + 1), origin: o, hp, mpg };
});

const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.hp)).nice().range([m.left, W - m.right]);
const y = d3.scaleLinear().domain(d3.extent(data, (d) => d.mpg)).nice().range([H - m.bottom, m.top]);
const color = d3.scaleOrdinal(origins, ["#1971c2", "#e8590c", "#2f9e44"]);

const controls = d3.select(el).append("label").style("font-size", "13px").style("display", "block");
const toggle = controls.append("input").attr("type", "checkbox");
controls.append("span").text(" show Voronoi mesh");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")").call(d3.axisBottom(x))
  .call((g) => g.append("text").attr("x", W - m.right).attr("y", 34).attr("fill", "currentColor")
    .attr("text-anchor", "end").text("Horsepower →"));
svg.append("g").attr("transform", "translate(" + m.left + ",0)").call(d3.axisLeft(y))
  .call((g) => g.append("text").attr("x", -m.left).attr("y", 12).attr("fill", "currentColor")
    .attr("text-anchor", "start").text("↑ Miles per gallon"));

const delaunay = d3.Delaunay.from(data, (d) => x(d.hp), (d) => y(d.mpg));
const voronoi = delaunay.voronoi([m.left, m.top, W - m.right, H - m.bottom]);
const mesh = svg.append("path").attr("d", voronoi.render())
  .attr("fill", "none").attr("stroke", "#adb5bd").attr("stroke-width", 0.5).attr("display", "none");
toggle.on("change", (event) => mesh.attr("display", event.target.checked ? null : "none"));

const dots = svg.append("g").selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => x(d.hp)).attr("cy", (d) => y(d.mpg)).attr("r", 3)
    .attr("fill", (d) => color(d.origin)).attr("fill-opacity", 0.75);

const ring = svg.append("circle").attr("r", 8).attr("fill", "none").attr("stroke-width", 2).attr("display", "none");
const tip = svg.append("g").attr("display", "none").attr("pointer-events", "none");
const tipBg = tip.append("rect").attr("rx", 4).attr("fill", "#1c1b19").attr("fill-opacity", 0.9);
const tipText = tip.append("text").attr("fill", "white").attr("font-size", 12);

svg.append("rect")
    .attr("x", m.left).attr("y", m.top)
    .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom)
    .attr("fill", "transparent")
  .on("pointermove", (event) => {
    const [px, py] = d3.pointer(event);
    const i = delaunay.find(px, py);
    const d = data[i], cx = x(d.hp), cy = y(d.mpg);
    if (Math.hypot(px - cx, py - cy) > 40) return hide();   // too far: no tooltip
    ring.attr("display", null).attr("cx", cx).attr("cy", cy).attr("stroke", color(d.origin));
    dots.attr("fill-opacity", (e) => (e === d ? 1 : 0.35));
    tipText.selectAll("tspan").data([d.name, d.hp.toFixed(0) + " hp · " + d.mpg.toFixed(1) + " mpg"])
      .join("tspan").attr("x", 8).attr("dy", (t, k) => (k ? 16 : 17)).attr("font-weight", (t, k) => (k ? null : 700))
      .text((t) => t);
    const box = tipText.node().getBBox();
    tipBg.attr("width", box.width + 16).attr("height", box.height + 12);
    const tx = cx + 12 + box.width + 16 > W ? cx - box.width - 28 : cx + 12;
    tip.attr("display", null).attr("transform", "translate(" + tx + "," + (cy - 20) + ")");
  })
  .on("pointerleave", hide);

function hide() {
  ring.attr("display", "none");
  tip.attr("display", "none");
  dots.attr("fill-opacity", 0.75);
}
`}
      />
      <Callout type="tip">
        <p>
          When you call <code>find</code> many times in a row with nearby coordinates (e.g. scanning a grid), pass the
          previous result as the third argument: <code>i = delaunay.find(x, y, i)</code>. Starting the walk close to
          the answer makes each lookup nearly constant time — the stippling example below relies on it.
        </p>
      </Callout>

      <h2>Lloyd&apos;s relaxation</h2>
      <p>
        Random points look clumpy. <strong>Lloyd&apos;s algorithm</strong> evens them out: repeatedly move every point
        to the centroid of its Voronoi cell, then recompute the diagram. After a few dozen iterations you get a
        &quot;blue noise&quot; distribution — evenly spaced but not grid-like, with cells that look like honeycomb.
        Because <code>delaunay.points</code> is a mutable typed array, we can update coordinates in place and call{" "}
        <code>voronoi.update()</code> instead of rebuilding from scratch.
      </p>
      <Playground
        title="Lloyd's relaxation, animated"
        code={`
const W = 640, H = 380, N = 350;
const normal = d3.randomNormal.source(d3.randomLcg(1));
// Start clumped around a few centers
const pts = Array.from({ length: N }, (_, i) => {
  const c = [[160, 120], [460, 260], [320, 190]][i % 3];
  return [c[0] + normal(0, 50)(), c[1] + normal(0, 40)()];
});
const delaunay = d3.Delaunay.from(pts);
const voronoi = delaunay.voronoi([0, 0, W, H]);
const P = delaunay.points;   // Float64Array we will mutate

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const cells = svg.append("g").selectAll("path").data(d3.range(N)).join("path")
    .attr("stroke", "white").attr("stroke-width", 1)
    .attr("fill", (i) => d3.interpolateYlGnBu(0.25 + 0.6 * (i / N)));
const dots = svg.append("path").attr("fill", "#1c1b19");
const label = svg.append("text").attr("x", 10).attr("y", 22).attr("font-weight", 700)
  .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 4);

function draw(iter) {
  cells.attr("d", (i) => voronoi.renderCell(i));
  dots.attr("d", delaunay.renderPoints(null, 2));
  label.text("iteration " + iter);
}

let iter = 0;
draw(0);
d3.interval(() => {
  if (iter >= 80) return;
  for (let i = 0; i < N; i++) {
    const poly = voronoi.cellPolygon(i);
    if (!poly) continue;
    const [cx, cy] = d3.polygonCentroid(poly);
    // Move most of the way to the centroid
    P[2 * i] += (cx - P[2 * i]) * 0.9;
    P[2 * i + 1] += (cy - P[2 * i + 1]) * 0.9;
  }
  voronoi.update();   // re-triangulates and rebuilds the cells
  draw(++iter);
}, 60);
`}
      />

      <h3>Weighted relaxation: stippling</h3>
      <p>
        If the centroid is <em>weighted</em> by a density function, points drift toward dark regions and you get a
        stippled drawing (Secord&apos;s weighted Voronoi stippling). To compute weighted centroids we scan a grid of
        samples, assign each sample to its nearest point with <code>delaunay.find</code> (using the hint trick), and
        accumulate density-weighted positions. Dots are drawn on a <code>&lt;canvas&gt;</code> by passing its 2D
        context to <code>renderPoints</code>-style drawing.
      </p>
      <Playground
        title="Weighted Voronoi stippling"
        code={`
const W = 640, H = 400, N = 2500, step = 2;
const dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
  .attr("width", W * dpr).attr("height", H * dpr)
  .style("width", "100%").style("max-width", W + "px").node();
const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

// Density: a spiral galaxy (0 = white, 1 = black)
function density(x, y) {
  const dx = x - W / 2, dy = y - H / 2, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  const arms = 0.5 + 0.5 * Math.sin(r / 14 - a * 2);
  return Math.pow(arms, 2) * Math.exp(-(r * r) / (2 * 150 * 150)) + 0.9 * Math.exp(-(r * r) / 800);
}
const gw = W / step, gh = H / step;
const grid = new Float64Array(gw * gh);
for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) grid[j * gw + i] = density(i * step, j * step);

// Initial points by rejection sampling
const rand = d3.randomLcg(2);
const pts = [];
while (pts.length < N) {
  const x = rand() * W, y = rand() * H;
  if (rand() < density(x, y)) pts.push([x, y]);
}
const delaunay = d3.Delaunay.from(pts);
const P = delaunay.points;
const cx = new Float64Array(N), cy = new Float64Array(N), w = new Float64Array(N);

let iter = 0;
const timer = d3.timer(() => {
  cx.fill(0); cy.fill(0); w.fill(0);
  let hint = 0;
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const d = grid[j * gw + i];
      if (d < 1e-3) continue;
      const x = i * step, y = j * step;
      hint = delaunay.find(x, y, hint);
      cx[hint] += x * d; cy[hint] += y * d; w[hint] += d;
    }
  }
  for (let k = 0; k < N; k++) {
    if (w[k] === 0) continue;
    P[2 * k] += (cx[k] / w[k] - P[2 * k]) * 1.8;          // slight over-relaxation
    P[2 * k + 1] += (cy[k] / w[k] - P[2 * k + 1]) * 1.8;
  }
  delaunay.update();

  ctx.fillStyle = "white"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#1c1b19";
  ctx.beginPath();
  for (let k = 0; k < N; k++) {
    const x = P[2 * k], y = P[2 * k + 1];
    const r = 0.6 + 1.6 * Math.sqrt(density(x, y));
    ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 2 * Math.PI);
  }
  ctx.fill();
  ctx.fillStyle = "#868e96"; ctx.font = "12px sans-serif";
  ctx.fillText("iteration " + (iter + 1), 10, 18);
  if (++iter >= 60) timer.stop();   // unlike d3 v3, returning true does NOT stop a timer
});
`}
      />

      <h2>Odds and ends</h2>
      <ul>
        <li>
          <strong>Degenerate input.</strong> If all points are collinear there are no triangles;{" "}
          <code>delaunay.collinear</code> then lists the points in order, and <code>neighbors</code>/<code>find</code>{" "}
          still work. Duplicate points share a single vertex.
        </li>
        <li>
          <strong>Canvas rendering.</strong> Every <code>render*</code> method accepts a Canvas 2D context (or a{" "}
          <code>d3.path()</code>) instead of returning a string — call <code>ctx.beginPath()</code> first and{" "}
          <code>ctx.stroke()</code>/<code>fill()</code> after.
        </li>
        <li>
          <strong>Constructor.</strong> <code>new d3.Delaunay(flatArray)</code> accepts an existing flat{" "}
          <code>[x0, y0, x1, y1, …]</code> array without copying — handy for large typed-array datasets.
        </li>
        <li>
          <strong>Geographic data.</strong> For points on a sphere, use the separate <em>d3-geo-voronoi</em> package;
          planar Delaunay on longitude/latitude breaks near the poles and antimeridian.
        </li>
      </ul>

      <Exercises
        items={[
          <>
            In the first example, draw the circumcircle of the triangle under the pointer (hint: use{" "}
            <code>voronoi.circumcenters</code> for its center and the distance to any vertex for its radius) and verify
            no other point lies inside it.
          </>,
          <>
            Modify the scatterplot so hovering also highlights the hovered point&apos;s Delaunay neighbors — a quick
            way to show &quot;similar&quot; items.
          </>,
          <>
            Replace the transparent rect in the tooltip example with invisible Voronoi cell paths (
            <code>voronoi.renderCell(i)</code>) that each have their own <code>pointerenter</code> handler. Compare the
            code size and behavior.
          </>,
          <>
            Change the stippling <code>density</code> function to draw something else — a ring, a checkerboard, or text
            rasterized onto a hidden canvas with <code>getImageData</code>.
          </>,
          <>
            Stop the Lloyd animation automatically once the average point movement per iteration falls below 0.05px,
            and log the iteration count.
          </>,
        ]}
      />
    </>
  );
}
