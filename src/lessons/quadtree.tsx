import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Suppose you have 50,000 points and want the one nearest the mouse, or every point inside a rectangle, or every
        pair of circles that overlap. The naive answer — loop over everything — costs <em>O(n)</em> per query and{" "}
        <em>O(n²)</em> for all pairs, which gets slow fast. A <strong>quadtree</strong> is a spatial index that lets you
        skip whole regions of space you know can&apos;t contain an answer. D3 uses one internally for{" "}
        <code>forceCollide</code> and <code>forceManyBody</code>, and <code>d3-quadtree</code> exposes it for your own
        use.
      </p>

      <h2>How a quadtree works</h2>
      <p>
        Start with a square that covers all your points. If a square holds more than one point, split it into four
        equal quadrants (top-left, top-right, bottom-left, bottom-right) and push the points down into them. Repeat
        recursively. Dense areas end up subdivided into many tiny squares while empty areas stay as one big square.
      </p>
      <p>In D3&apos;s implementation, a node is one of two things:</p>
      <ul>
        <li>
          An <strong>internal node</strong>: a four-element array <code>[topLeft, topRight, bottomLeft, bottomRight]</code>{" "}
          whose entries are child nodes or <code>undefined</code> for empty quadrants.
        </li>
        <li>
          A <strong>leaf node</strong>: an object <code>{"{"} data, next {"}"}</code> holding one datum.{" "}
          <code>next</code> links to further leaves at the <em>exact same position</em> (coincident points). You can
          tell them apart with <code>node.length</code> — only internal nodes have it.
        </li>
      </ul>
      <p>
        Node bounds aren&apos;t stored on the nodes; they are computed on the fly and passed to your callback when you
        traverse the tree with <code>visit</code>.
      </p>
      <ApiTable
        rows={[
          ["d3.quadtree(data?, x?, y?)", "Create a quadtree, optionally adding data with the given accessors."],
          ["quadtree.x(fn) / .y(fn)", "Coordinate accessors (default d => d[0] and d => d[1]). Set these before adding data."],
          ["quadtree.extent([[x0, y0], [x1, y1]])", "Expand the root square to cover the given extent."],
          ["quadtree.cover(x, y)", "Expand (by repeated doubling) so that the point (x, y) is covered."],
          ["quadtree.add(d) / addAll(data)", "Insert one datum, or many at once (addAll computes the extent first — faster)."],
          ["quadtree.remove(d) / removeAll(data)", "Remove data by identity."],
          ["quadtree.copy()", "A copy of the tree; data objects are shared, not cloned."],
          ["quadtree.root()", "The root node."],
          ["quadtree.data() / size()", "All data as an array / the number of data."],
          ["quadtree.find(x, y, radius?)", "The datum closest to (x, y) within the search radius, or undefined."],
          ["quadtree.visit(cb)", "Pre-order traversal: cb(node, x0, y0, x1, y1); return true to skip that node's children."],
          ["quadtree.visitAfter(cb)", "Post-order traversal (children before parents) — for aggregating values upward."],
        ]}
      />

      <h2>Building and drawing a quadtree</h2>
      <p>
        Here we index 400 clustered points and draw every node square by visiting the whole tree. Click anywhere to{" "}
        <code>add</code> a point and watch the local subdivision update. Notice how the squares shrink only where points
        crowd together.
      </p>
      <Playground
        title="Visualizing the quadtree"
        code={`
const W = 640, H = 400;
const normal = d3.randomNormal.source(d3.randomLcg(4));
const data = Array.from({ length: 400 }, (_, i) => {
  const [cx, cy, s] = [[170, 130, 45], [440, 250, 70], [520, 90, 25]][i % 3];
  return [Math.max(1, Math.min(W - 1, normal(cx, s)())), Math.max(1, Math.min(H - 1, normal(cy, s)()))];
});

const tree = d3.quadtree()
    .x((d) => d[0])
    .y((d) => d[1])
    .extent([[0, 0], [W, H]])
    .addAll(data);

log("size:", tree.size(), "extent:", tree.extent());
log("root is internal?", Array.isArray(tree.root()));

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("cursor", "copy");
const gRect = svg.append("g");
const gDot = svg.append("g");

function draw() {
  const nodes = [];
  tree.visit((node, x0, y0, x1, y1) => { nodes.push({ x0, y0, x1, y1, leaf: !node.length }); });
  gRect.selectAll("rect").data(nodes).join("rect")
      .attr("x", (d) => d.x0).attr("y", (d) => d.y0)
      .attr("width", (d) => d.x1 - d.x0).attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => (d.leaf ? "none" : d3.interpolateBlues(Math.min(1, 12 / (d.x1 - d.x0)))))
      .attr("fill-opacity", 0.35)
      .attr("stroke", "#1c7ed6").attr("stroke-opacity", 0.5).attr("stroke-width", 0.6);
  gDot.selectAll("circle").data(tree.data()).join("circle")
      .attr("cx", (d) => d[0]).attr("cy", (d) => d[1]).attr("r", 2).attr("fill", "#1c1b19");
  return nodes.length;
}
log("nodes (internal + leaves):", draw());

svg.on("click", (event) => {
  tree.add(d3.pointer(event));
  log("added → size", tree.size(), "· nodes", draw());
});
`}
      />
      <Callout type="warning" title="Set accessors before adding data">
        <p>
          <code>x()</code> and <code>y()</code> are read at insertion time. Changing them after <code>addAll</code>{" "}
          won&apos;t re-index anything — you&apos;ll get a silently broken tree. Likewise, if your data moves (as in a
          simulation), the tree does not notice: rebuild it (it&apos;s cheap) rather than mutating positions under it.
        </p>
      </Callout>

      <h2>Nearest neighbor: find</h2>
      <p>
        <code>tree.find(x, y)</code> returns the closest datum to a point. It traverses the tree nearest-quadrant first
        and prunes any square farther away than the best candidate found so far. The optional <code>radius</code>{" "}
        limits the search: if nothing is within that distance you get <code>undefined</code> — perfect for
        &quot;snap to point if close enough&quot; interactions.
      </p>
      <Playground
        title="find(x, y, radius) on hover"
        code={`
const W = 640, H = 380;
const rand = d3.randomLcg(9);
const data = Array.from({ length: 1500 }, () => ({ x: rand() * W, y: rand() * H, id: 0 }))
  .map((d, i) => ((d.id = i), d));
const tree = d3.quadtree(data, (d) => d.x, (d) => d.y);

const ctl = d3.select(el).append("div").style("font-size", "13px");
ctl.append("span").text("search radius: ");
const slider = ctl.append("input").attr("type", "range").attr("min", 5).attr("max", 120).attr("value", 40);
const out = ctl.append("span").style("margin-left", "8px").style("font-variant-numeric", "tabular-nums");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("cursor", "none");
svg.append("g").selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", 1.8).attr("fill", "#adb5bd");
const halo = svg.append("circle").attr("fill", "#1c7ed6").attr("fill-opacity", 0.08)
  .attr("stroke", "#1c7ed6").attr("stroke-dasharray", "4 3");
const link = svg.append("line").attr("stroke", "#e8590c").attr("stroke-width", 1.5);
const hit = svg.append("circle").attr("r", 6).attr("fill", "#e8590c");

svg.append("rect").attr("width", W).attr("height", H).attr("fill", "transparent")
  .on("pointermove", (event) => {
    const [mx, my] = d3.pointer(event);
    const r = +slider.property("value");
    const d = tree.find(mx, my, r);
    halo.attr("cx", mx).attr("cy", my).attr("r", r);
    if (d) {
      link.attr("display", null).attr("x1", mx).attr("y1", my).attr("x2", d.x).attr("y2", d.y);
      hit.attr("display", null).attr("cx", d.x).attr("cy", d.y);
      out.text("nearest #" + d.id + " at " + Math.hypot(d.x - mx, d.y - my).toFixed(1) + "px");
    } else {
      link.attr("display", "none");
      hit.attr("display", "none");
      out.text("nothing within " + r + "px");
    }
  });
`}
      />

      <h2>Range search with visit</h2>
      <p>
        <code>visit</code> is the general-purpose tool. It walks the tree top-down, calling your callback with each node
        and its bounds <code>x0, y0, x1, y1</code>. If the callback returns <code>true</code>, that node&apos;s children
        are skipped. For a rectangular query, you skip every square that doesn&apos;t intersect the query rectangle,
        and test individual points only at leaves:
      </p>
      <CodeBlock>{`
function search(tree, [[qx0, qy0], [qx1, qy1]]) {
  const found = [];
  tree.visit((node, x0, y0, x1, y1) => {
    if (!node.length) {                     // leaf: test each (possibly coincident) datum
      do {
        const d = node.data, x = tree._x(d), y = tree._y(d);
        if (x >= qx0 && x < qx1 && y >= qy0 && y < qy1) found.push(d);
      } while ((node = node.next));
    }
    return x0 >= qx1 || y0 >= qy1 || x1 < qx0 || y1 < qy0;   // true = skip children
  });
  return found;
}
`}</CodeBlock>
      <p>
        Drag a rectangle below (it uses <code>d3.brush</code>). Orange squares are the nodes the search actually
        visited — everything else was pruned without ever being looked at.
      </p>
      <Playground
        title="Brush → quadtree range query"
        code={`
const W = 640, H = 400;
const normal = d3.randomNormal.source(d3.randomLcg(21));
const data = Array.from({ length: 3000 }, () => [
  Math.max(0, Math.min(W, normal(W / 2, 140)())),
  Math.max(0, Math.min(H, normal(H / 2, 90)())),
]);
const tree = d3.quadtree().extent([[0, 0], [W, H]]).addAll(data);
let total = 0;
tree.visit(() => { total++; });

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const gNodes = svg.append("g");
const dots = svg.append("g").selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => d[0]).attr("cy", (d) => d[1]).attr("r", 1.6).attr("fill", "#adb5bd");
const stats = svg.append("text").attr("x", 10).attr("y", 20).attr("font-size", 13).attr("font-weight", 600)
  .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 4)
  .text("Drag to select a region");

function search([[qx0, qy0], [qx1, qy1]]) {
  const visited = [], found = new Set();
  tree.visit((node, x0, y0, x1, y1) => {
    visited.push([x0, y0, x1, y1]);
    if (!node.length) {
      do {
        const [x, y] = node.data;
        if (x >= qx0 && x < qx1 && y >= qy0 && y < qy1) found.add(node.data);
      } while ((node = node.next));
    }
    return x0 >= qx1 || y0 >= qy1 || x1 < qx0 || y1 < qy0;
  });
  return { visited, found };
}

const brush = d3.brush()
  .extent([[0, 0], [W, H]])
  .on("start brush end", ({ selection }) => {
    if (!selection) {
      gNodes.selectAll("*").remove();
      dots.attr("fill", "#adb5bd").attr("r", 1.6);
      return;
    }
    const { visited, found } = search(selection);
    gNodes.selectAll("rect").data(visited).join("rect")
        .attr("x", (d) => d[0]).attr("y", (d) => d[1])
        .attr("width", (d) => d[2] - d[0]).attr("height", (d) => d[3] - d[1])
        .attr("fill", "#ffe8cc").attr("fill-opacity", 0.4)
        .attr("stroke", "#e8590c").attr("stroke-opacity", 0.6).attr("stroke-width", 0.5);
    dots.attr("fill", (d) => (found.has(d) ? "#1c1b19" : "#ced4da")).attr("r", (d) => (found.has(d) ? 2.2 : 1.4));
    stats.text(found.size + " points found · visited " + visited.length + " of " + total + " nodes");
  });

svg.append("g").call(brush).call(brush.move, [[240, 140], [400, 260]]);
`}
      />

      <h2>extent, cover, remove and friends</h2>
      <p>
        The root square only ever <em>grows</em>. <code>extent</code> and <code>cover</code> expand it by repeatedly
        doubling its size until the target fits — and <code>add</code> calls <code>cover</code> automatically if you
        insert a point outside the current bounds. Because it doubles, the root is always square and usually larger
        than your data&apos;s bounding box. <code>addAll</code> is smarter: it computes the bounds of all new points
        first and covers them once, which is why it&apos;s preferred for bulk loading.
      </p>
      <Playground
        title="How the extent grows"
        code={`
const tree = d3.quadtree();
const snaps = [];
const snap = (label) => { snaps.push({ label, e: tree.extent() }); log(label.padEnd(22), JSON.stringify(tree.extent())); };

tree.cover(10, 10);      snap("cover(10, 10)");
tree.add([30, 20]);      snap("add([30, 20])");
tree.add([100, 60]);     snap("add([100, 60])");
tree.add([260, 150]);    snap("add([260, 150])");

log("size:", tree.size(), "data:", JSON.stringify(tree.data()));
const d = tree.find(95, 55);
tree.remove(d);
log("removed", JSON.stringify(d), "→ size", tree.size());
const copy = tree.copy();
copy.add([0, 0]);
log("copy size", copy.size(), "original size", tree.size());

// Draw each successive root square
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 350");
const s = 1.2, ox = 170, oy = 10;
const X = (v) => ox + v * s, Y = (v) => oy + v * s;
const color = d3.scaleSequential(d3.interpolateOranges).domain([-1, snaps.length]);
const g = svg.append("g").selectAll("g").data(snaps.slice().reverse()).join("g");
g.append("rect")
    .attr("x", (d) => X(d.e[0][0])).attr("y", (d) => Y(d.e[0][1]))
    .attr("width", (d) => (d.e[1][0] - d.e[0][0]) * s).attr("height", (d) => (d.e[1][1] - d.e[0][1]) * s)
    .attr("fill", (d, i) => color(snaps.length - 1 - i)).attr("fill-opacity", 0.35).attr("stroke", "#d9480f");
g.append("text")
    .attr("x", (d) => X(d.e[0][0]) - 8)
    .attr("y", (d) => Y(d.e[1][1]))
    .attr("text-anchor", "end").attr("font-size", 12)
    .text((d) => d.label + " → " + (d.e[1][0] - d.e[0][0]) + "px square");
svg.append("g").selectAll("circle").data([[10, 10], [30, 20], [100, 60], [260, 150]]).join("circle")
    .attr("cx", (d) => X(d[0])).attr("cy", (d) => Y(d[1])).attr("r", 4).attr("fill", "#1c1b19");
`}
      />

      <h2>Aggregating with visitAfter: Barnes–Hut</h2>
      <p>
        <code>visitAfter</code> visits children before their parent, so you can compute summaries bottom-up — for
        example, the number of points and their center of mass in every square. That&apos;s the core of the{" "}
        <strong>Barnes–Hut</strong> approximation used by <code>d3.forceManyBody</code>: when a square is small
        relative to its distance from you (<code>width / distance &lt; θ</code>), treat all its points as one heavy
        point at their centroid. Move the pointer and watch distant clusters collapse into single weighted circles.
      </p>
      <Playground
        title="Barnes–Hut approximation (θ = 0.9)"
        code={`
const W = 640, H = 400, theta = 0.9;
const normal = d3.randomNormal.source(d3.randomLcg(8));
const data = Array.from({ length: 1200 }, (_, i) => {
  const [cx, cy] = [[140, 110], [480, 120], [320, 300], [560, 330]][i % 4];
  return [normal(cx, 40)(), normal(cy, 35)()];
});
const tree = d3.quadtree().extent([[0, 0], [W, H]]).addAll(data);

// Post-order: aggregate count and centroid into every node
tree.visitAfter((node) => {
  if (!node.length) {
    let n = 0, sx = 0, sy = 0, q = node;
    do { n++; sx += q.data[0]; sy += q.data[1]; } while ((q = q.next));
    node.n = n; node.cx = sx / n; node.cy = sy / n;
  } else {
    let n = 0, sx = 0, sy = 0;
    for (const c of node) if (c) { n += c.n; sx += c.cx * c.n; sy += c.cy * c.n; }
    node.n = n; node.cx = sx / n; node.cy = sy / n;
  }
});
log("root holds", tree.root().n, "points, centroid", tree.root().cx.toFixed(1), tree.root().cy.toFixed(1));

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const gSq = svg.append("g"), gAgg = svg.append("g");
const me = svg.append("circle").attr("r", 6).attr("fill", "#e8590c");
const label = svg.append("text").attr("x", 10).attr("y", 20).attr("font-weight", 600).attr("font-size", 13);

function update(px, py) {
  const groups = [];
  tree.visit((node, x0, y0, x1, y1) => {
    const dist = Math.hypot(node.cx - px, node.cy - py);
    if (!node.length || (x1 - x0) / dist < theta) {
      groups.push({ node, x0, y0, x1, y1 });
      return true;   // approximate: don't descend
    }
  });
  gSq.selectAll("rect").data(groups.filter((g) => g.node.length)).join("rect")
      .attr("x", (g) => g.x0).attr("y", (g) => g.y0)
      .attr("width", (g) => g.x1 - g.x0).attr("height", (g) => g.y1 - g.y0)
      .attr("fill", "none").attr("stroke", "#74c0fc").attr("stroke-width", 0.7);
  gAgg.selectAll("circle").data(groups).join("circle")
      .attr("cx", (g) => g.node.cx).attr("cy", (g) => g.node.cy)
      .attr("r", (g) => 1.5 + Math.sqrt(g.node.n) * 1.2)
      .attr("fill", (g) => (g.node.n > 1 ? "#1971c2" : "#495057"))
      .attr("fill-opacity", (g) => (g.node.n > 1 ? 0.6 : 0.8));
  me.attr("cx", px).attr("cy", py);
  label.text(groups.length + " interactions instead of " + data.length);
}
update(W / 2, H / 2);
svg.on("pointermove", (event) => update(...d3.pointer(event)));
`}
      />

      <h2>Collision detection</h2>
      <p>
        Checking every pair of <em>n</em> circles for overlap costs <em>n(n−1)/2</em> tests. With a quadtree, each
        circle only inspects squares that intersect its own bounding box expanded by the largest radius. This example
        rebuilds the tree every frame (rebuilding is cheaper than updating moving points), resolves overlaps and
        bounces circles off each other with an elastic impulse.
      </p>
      <Playground
        title="Bouncing circles with quadtree collisions"
        code={`
const W = 640, H = 400, N = 450;
const rand = d3.randomLcg(12);
const nodes = Array.from({ length: N }, (_, i) => {
  const r = 3 + Math.pow(rand(), 3) * 16;
  return { i, r, m: r * r, x: r + rand() * (W - 2 * r), y: r + rand() * (H - 2 * r),
           vx: (rand() - 0.5) * 2.5, vy: (rand() - 0.5) * 2.5 };
});
const maxR = d3.max(nodes, (d) => d.r);
const color = d3.scaleSequential(d3.interpolateTurbo).domain([3, maxR + 2]);

const dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas").attr("width", W * dpr).attr("height", H * dpr)
  .style("width", "100%").style("max-width", W + "px").node();
const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

let checks = 0;
function collide() {
  const tree = d3.quadtree(nodes, (d) => d.x, (d) => d.y);
  checks = 0;
  for (const a of nodes) {
    const R = a.r + maxR, nx0 = a.x - R, nx1 = a.x + R, ny0 = a.y - R, ny1 = a.y + R;
    tree.visit((q, x0, y0, x1, y1) => {
      if (!q.length) {
        do {
          const b = q.data;
          if (b.i > a.i) {
            checks++;
            let dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy);
            const min = a.r + b.r;
            if (l < min && l > 0) {
              const nx = dx / l, ny = dy / l, overlap = (min - l) / (a.m + b.m);
              // separate proportionally to mass
              a.x -= nx * overlap * b.m; a.y -= ny * overlap * b.m;
              b.x += nx * overlap * a.m; b.y += ny * overlap * a.m;
              // elastic impulse along the normal
              const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rel < 0) {
                const j = (2 * rel) / (a.m + b.m);
                a.vx += j * b.m * nx; a.vy += j * b.m * ny;
                b.vx -= j * a.m * nx; b.vy -= j * a.m * ny;
              }
            }
          }
        } while ((q = q.next));
      }
      return x0 > nx1 || x1 < nx0 || y0 > ny1 || y1 < ny0;
    });
  }
}

d3.timer(() => {
  for (const d of nodes) {
    d.x += d.vx; d.y += d.vy;
    if (d.x < d.r) { d.x = d.r; d.vx = Math.abs(d.vx); }
    if (d.x > W - d.r) { d.x = W - d.r; d.vx = -Math.abs(d.vx); }
    if (d.y < d.r) { d.y = d.r; d.vy = Math.abs(d.vy); }
    if (d.y > H - d.r) { d.y = H - d.r; d.vy = -Math.abs(d.vy); }
  }
  collide();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
  for (const d of nodes) {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
    ctx.fillStyle = color(d.r);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(6, 6, 300, 22);
  ctx.fillStyle = "#1c1b19";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("pair checks: " + checks + "  (brute force: " + (N * (N - 1)) / 2 + ")", 12, 21);
});
`}
      />
      <Callout type="note">
        <p>
          This is exactly how <code>d3.forceCollide</code> works internally — it builds a quadtree of nodes each tick,
          stores the max radius per node with <code>visitAfter</code>, and uses <code>visit</code> to find overlaps. If
          you are already using a force simulation, reach for <code>forceCollide</code> instead of rolling your own.
        </p>
      </Callout>

      <h2>How much faster is it?</h2>
      <p>
        Let&apos;s measure. We index 50,000 points, then run 2,000 nearest-neighbor queries and 200 rectangle queries
        both ways using <code>performance.now()</code>. Building the tree has an up-front cost, which pays for itself
        after a handful of queries. (Numbers vary by machine; re-run a few times.)
      </p>
      <Playground
        title="Brute force vs quadtree benchmark"
        code={`
const N = 50000, Q = 2000, RQ = 200;
const rand = d3.randomLcg(1);
const pts = Array.from({ length: N }, () => [rand() * 1000, rand() * 1000]);
const queries = Array.from({ length: Q }, () => [rand() * 1000, rand() * 1000]);
const rects = Array.from({ length: RQ }, () => { const x = rand() * 900, y = rand() * 900; return [x, y, x + 60, y + 60]; });

const time = (fn) => { const t = performance.now(); const r = fn(); return [performance.now() - t, r]; };

const [tBuild, tree] = time(() => d3.quadtree().addAll(pts));

const [tBruteFind, a] = time(() => queries.map(([qx, qy]) => {
  let best = null, bd = Infinity;
  for (const p of pts) { const d = (p[0] - qx) ** 2 + (p[1] - qy) ** 2; if (d < bd) { bd = d; best = p; } }
  return best;
}));
const [tTreeFind, b] = time(() => queries.map(([qx, qy]) => tree.find(qx, qy)));
log("find results identical:", a.every((p, i) => p === b[i]));

const [tBruteRange, c] = time(() => rects.map(([x0, y0, x1, y1]) =>
  pts.filter(([x, y]) => x >= x0 && x < x1 && y >= y0 && y < y1).length));
const [tTreeRange, d] = time(() => rects.map(([qx0, qy0, qx1, qy1]) => {
  let n = 0;
  tree.visit((node, x0, y0, x1, y1) => {
    if (!node.length) do { const [x, y] = node.data; if (x >= qx0 && x < qx1 && y >= qy0 && y < qy1) n++; } while ((node = node.next));
    return x0 >= qx1 || y0 >= qy1 || x1 < qx0 || y1 < qy0;
  });
  return n;
}));
log("range results identical:", c.every((n, i) => n === d[i]));
log("build quadtree:", tBuild.toFixed(1) + "ms");

const rows = [
  { task: Q + " × nearest", method: "brute force", ms: tBruteFind },
  { task: Q + " × nearest", method: "quadtree", ms: tTreeFind },
  { task: RQ + " × rectangle", method: "brute force", ms: tBruteRange },
  { task: RQ + " × rectangle", method: "quadtree", ms: tTreeRange },
];
const W = 640, H = 220, m = { l: 190, r: 90, t: 10, b: 24 };
const x = d3.scaleLinear().domain([0, d3.max(rows, (r) => r.ms)]).range([m.l, W - m.r]);
const y = d3.scaleBand().domain(rows.map((r, i) => i)).range([m.t, H - m.b]).padding(0.25);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("g").attr("transform", "translate(0," + (H - m.b) + ")").call(d3.axisBottom(x).ticks(6).tickFormat((v) => v + "ms"));
const row = svg.append("g").selectAll("g").data(rows).join("g").attr("transform", (r, i) => "translate(0," + y(i) + ")");
row.append("rect").attr("x", m.l).attr("height", y.bandwidth()).attr("width", (r) => Math.max(1, x(r.ms) - m.l))
  .attr("rx", 3).attr("fill", (r) => (r.method === "quadtree" ? "#2f9e44" : "#adb5bd"));
row.append("text").attr("x", m.l - 8).attr("y", y.bandwidth() / 2).attr("dy", "0.35em").attr("text-anchor", "end")
  .attr("font-size", 12).text((r) => r.task + " · " + r.method);
row.append("text").attr("x", (r) => x(r.ms) + 6).attr("y", y.bandwidth() / 2).attr("dy", "0.35em")
  .attr("font-size", 12).attr("font-weight", 600).text((r) => r.ms.toFixed(1) + "ms");
log("nearest speedup: ×" + (tBruteFind / tTreeFind).toFixed(0), " range speedup: ×" + (tBruteRange / tTreeRange).toFixed(0));
`}
      />

      <Exercises
        items={[
          <>
            In the first example, make shift-click <code>remove</code> the point nearest the pointer (use{" "}
            <code>find</code> with a small radius) and redraw.
          </>,
          <>
            Write a <code>findAll(tree, x, y, r)</code> function using <code>visit</code> that returns every point within
            a <em>circle</em> (hint: prune squares whose closest point to (x, y) is farther than r). Use it to
            highlight points around the cursor.
          </>,
          <>
            Implement k-nearest neighbors: repeatedly call <code>find</code>, temporarily <code>remove</code> each
            result, then add them back. Compare against a brute-force version in the benchmark.
          </>,
          <>
            In the Barnes–Hut example, add a slider for θ and log how the interaction count changes. What happens at θ
            = 0?
          </>,
          <>
            Add a heavy &quot;cursor ball&quot; to the collision demo that follows the pointer and pushes the other
            circles around.
          </>,
        ]}
      />
    </>
  );
}
