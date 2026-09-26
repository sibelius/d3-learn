import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Lots of data is naturally <strong>hierarchical</strong>: files in folders, an org chart, a taxonomy, the
        budget of a government split by department, the modules of a software package. <code>d3-hierarchy</code>{" "}
        gives you two things: a <em>node</em> data structure (with handy traversal methods) and a set of{" "}
        <em>layouts</em> that compute positions for those nodes — tidy trees, dendrograms, treemaps, circle packing
        and partitions (icicles and sunbursts).
      </p>
      <p>
        Like the shape generators you&apos;ve seen before, layouts don&apos;t draw anything. They annotate each node
        with numbers (<code>x</code>/<code>y</code>, or <code>x0</code>/<code>y0</code>/<code>x1</code>/
        <code>y1</code>, or <code>x</code>/<code>y</code>/<code>r</code>) and you render those however you like.
      </p>

      <h2>d3.hierarchy: from nested data to nodes</h2>
      <p>
        <code>d3.hierarchy(data, children?)</code> takes nested JSON — by default it looks for a{" "}
        <code>children</code> array on each object — and returns the <strong>root node</strong>. Every node has:
      </p>
      <ul>
        <li>
          <code>node.data</code> — the original object you passed in
        </li>
        <li>
          <code>node.depth</code> (0 for the root), <code>node.height</code> (0 for leaves)
        </li>
        <li>
          <code>node.parent</code> and <code>node.children</code> (undefined for leaves)
        </li>
        <li>
          <code>node.value</code> — only after you call <code>sum</code> or <code>count</code>
        </li>
      </ul>
      <p>
        Throughout this lesson we&apos;ll use a trimmed-down version of the classic <em>flare</em> dataset — the
        class hierarchy of a visualization toolkit, where each leaf&apos;s <code>value</code> is the file size in
        bytes. It lives at <code>/data/hierarchy-flare.json</code>:
      </p>
      <CodeBlock>{`
{ "name": "flare", "children": [
  { "name": "analytics", "children": [
    { "name": "cluster", "children": [
      { "name": "AgglomerativeCluster", "value": 3938 }, ...
`}</CodeBlock>

      <Playground
        title="Exploring a hierarchy"
        code={`
const data = await d3.json("/data/hierarchy-flare.json");
const root = d3.hierarchy(data);

log("height:", root.height, "descendants:", root.descendants().length,
    "leaves:", root.leaves().length, "links:", root.links().length);

// sum() computes value bottom-up: a node's value = its own value + its children's
root.sum(d => d.value);
log("total bytes:", root.value);

// count() sets value to the number of leaves below each node (on a copy here)
log("leaf count via count():", root.copy().count().value);

// sort siblings, biggest first — do this AFTER sum so values exist
root.sort((a, b) => b.value - a.value);

const tween = root.find(d => d.data.name === "Tween");
const logScale = root.find(d => d.data.name === "LogScale");
log("ancestors of Tween:", tween.ancestors().map(d => d.data.name));
log("path Tween → LogScale:", tween.path(logScale).map(d => d.data.name));

// eachBefore = pre-order (parent before children) → perfect for an outline
const fmt = d3.format(",");
const box = d3.select(el).append("div")
    .style("font", "12px ui-monospace, monospace")
    .style("columns", "2").style("line-height", "1.5");
root.eachBefore(d => {
  box.append("div")
      .style("padding-left", d.depth * 14 + "px")
      .style("font-weight", d.children ? "bold" : "normal")
      .text((d.children ? "▾ " : "· ") + d.data.name + "  " + fmt(d.value));
});
`}
      />

      <h3>Traversal orders</h3>
      <p>
        Three iterators visit every node. The difference matters when a node&apos;s computation depends on its
        parent (use pre-order) or on its children (use post-order):
      </p>
      <ul>
        <li>
          <code>node.each(fn)</code> — breadth-first: the root, then all depth-1 nodes, then depth-2…
        </li>
        <li>
          <code>node.eachBefore(fn)</code> — pre-order: a node is visited before its descendants.
        </li>
        <li>
          <code>node.eachAfter(fn)</code> — post-order: a node is visited after its descendants (this is how{" "}
          <code>sum</code> works internally).
        </li>
      </ul>
      <p>
        Nodes are also iterable (<code>for (const node of root)</code>, breadth-first), and{" "}
        <code>node.find(fn)</code> returns the first node matching a predicate.
      </p>

      <h2>d3.stratify: from flat tables to hierarchies</h2>
      <p>
        Data often comes as rows (a CSV, a database table) with an <code>id</code> and a <code>parentId</code>{" "}
        column instead of nested JSON. <code>d3.stratify()</code> converts such a table into the same node
        structure <code>d3.hierarchy</code> produces. There must be exactly one root (a row with an empty parent)
        and ids must be unique. Alternatively, <code>stratify.path(accessor)</code> builds the tree from
        slash-separated paths like file names, inventing the missing intermediate directories for you.
      </p>
      <Playground
        title="stratify: parentId and path"
        code={`
// 1) id / parentId table — like an org chart CSV
const table = [
  { id: "Ada",    parentId: "",      role: "CEO" },
  { id: "Grace",  parentId: "Ada",   role: "CTO" },
  { id: "Linus",  parentId: "Grace", role: "Kernel lead" },
  { id: "Guido",  parentId: "Grace", role: "Language lead" },
  { id: "Radia",  parentId: "Ada",   role: "COO" },
  { id: "Barbara",parentId: "Radia", role: "Operations" },
];
const org = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parentId)(table);

log("org height:", org.height, "— Guido's chain:", org.find(d => d.id === "Guido").ancestors().map(d => d.id));

// 2) path-based — missing parents ("/src", "/src/lib") are created automatically
const files = [
  { path: "/src/app/page.tsx", size: 4 },
  { path: "/src/app/layout.tsx", size: 2 },
  { path: "/src/lib/lessons.ts", size: 6 },
  { path: "/src/lib/utils.ts", size: 1 },
  { path: "/package.json", size: 1 },
];
const fs = d3.stratify().path(d => d.path)(files);
fs.sum(d => d ? d.size : 0);  // synthesized parents have data = null

const out = d3.select(el).append("div").style("display", "flex").style("gap", "40px")
    .style("font", "13px ui-monospace, monospace");
function outline(root, label) {
  const col = out.append("div");
  root.eachBefore(d => col.append("div")
      .style("padding-left", d.depth * 16 + "px")
      .text((d.children ? "▾ " : "· ") + label(d)));
}
outline(org, d => d.id + " (" + d.data.role + ")");
outline(fs, d => (d.id.split("/").pop() || "/") + "  [" + d.value + "]");
`}
      />
      <Callout type="note">
        <p>
          With <code>stratify</code>, <code>node.id</code> is set from your id accessor (and is the full path in
          path mode) — handy as a stable key for data joins. Nodes built with <code>d3.hierarchy</code> have no id
          by default, so use something like <code>d.ancestors().map(a =&gt; a.data.name).join(&quot;/&quot;)</code>{" "}
          if names aren&apos;t unique.
        </p>
      </Callout>

      <h2>Layouts at a glance</h2>
      <ApiTable
        rows={[
          ["d3.hierarchy(data, children)", "Build a root node from nested data."],
          ["node.sum(value) / node.count()", "Compute node.value bottom-up (required before treemap, pack and partition)."],
          ["node.sort(compare)", "Sort every node's children in place."],
          ["node.descendants() / leaves()", "Array of all nodes (breadth-first) / only the leaves."],
          ["node.links()", "Array of {source, target} parent→child links."],
          ["node.ancestors() / path(target)", "Nodes from this up to the root / shortest path to another node."],
          ["node.each / eachBefore / eachAfter", "Breadth-first, pre-order and post-order traversal."],
          ["node.find(fn) / copy()", "First matching node / deep copy of the subtree."],
          ["d3.stratify().id().parentId()", "Tabular (id, parentId) data → hierarchy. Or .path(fn) for slash paths."],
          ["d3.tree()", "Tidy tree (Reingold–Tilford): x = breadth, y = depth."],
          ["d3.cluster()", "Dendrogram: all leaves at the same depth."],
          ["tree.size([w, h]) / nodeSize([dx, dy])", "Fit the layout to a size, or give each node fixed spacing."],
          ["tree.separation(fn)", "Relative gap between neighboring nodes (siblings vs cousins)."],
          ["d3.treemap()", "Nested rectangles sized by value; sets x0, y0, x1, y1."],
          ["treemap.tile(method)", "treemapSquarify (default), Binary, Slice, Dice, SliceDice, Resquarify."],
          ["treemap.padding / paddingInner / paddingOuter / paddingTop", "Gaps between and inside cells (room for labels)."],
          ["d3.pack()", "Circle packing; sets x, y, r. Also .padding() and .radius()."],
          ["d3.packSiblings(circles) / packEnclose(circles)", "Pack an array of {r} circles / smallest enclosing circle."],
          ["d3.partition()", "Adjacency diagram (icicle, sunburst); sets x0, y0, x1, y1."],
        ]}
      />

      <h2>Tree and cluster</h2>
      <p>
        <code>d3.tree()</code> produces a <strong>tidy tree</strong>: parents are centered above their children,
        subtrees don&apos;t overlap, and identical subtrees look identical. <code>d3.cluster()</code> produces a{" "}
        <strong>dendrogram</strong>, where every leaf is placed at the same depth — useful when the leaves are what
        you compare. Both set <code>node.x</code> (the breadth position) and <code>node.y</code> (the depth
        position). For a left-to-right tree, simply swap them when drawing.
      </p>
      <p>
        For a <strong>radial</strong> layout, set the size to <code>[2 * Math.PI, radius]</code>: now{" "}
        <code>x</code> is an angle and <code>y</code> a radius. Links are drawn with <code>d3.linkHorizontal</code>{" "}
        or <code>d3.linkRadial</code>, which produce smooth cubic Bézier curves between parent and child.
      </p>
      <Playground
        title="Tidy tree, dendrogram, radial"
        code={`
const data = await d3.json("/data/hierarchy-flare.json");
const W = 640;
const base = d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.name, b.data.name));

const select = d3.select(el).append("select").style("margin-bottom", "8px")
    .on("change", e => draw(e.target.value));
select.selectAll("option")
  .data(["tree", "cluster", "radial tree", "radial cluster"])
  .join("option").text(d => d);
const svg = d3.select(el).append("svg")
    .attr("font-family", "sans-serif").attr("font-size", 10);

function draw(mode) {
  svg.selectAll("*").remove();
  const root = base.copy();
  const radial = mode.startsWith("radial");
  const layout = mode.endsWith("cluster") ? d3.cluster() : d3.tree();
  let linkGen, place;

  if (!radial) {
    const dx = 12, dy = (W - 230) / root.height;
    layout.nodeSize([dx, dy])(root);          // fixed spacing, then compute bounds
    const [x0, x1] = d3.extent(root.descendants(), d => d.x);
    svg.attr("viewBox", [-50, x0 - dx, W, x1 - x0 + dx * 2]);
    linkGen = d3.linkHorizontal().x(d => d.y).y(d => d.x);   // swap x/y!
    place = d => "translate(" + d.y + "," + d.x + ")";
  } else {
    const R = 190;
    layout.size([2 * Math.PI, R])
        .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth)(root);
    svg.attr("viewBox", [-W / 2, -W / 2, W, W]);
    linkGen = d3.linkRadial().angle(d => d.x).radius(d => d.y);
    place = d => "rotate(" + (d.x * 180 / Math.PI - 90) + ") translate(" + d.y + ",0)";
  }

  svg.append("g").attr("fill", "none").attr("stroke", "#9ca3af").attr("stroke-width", 1.2)
    .selectAll("path").data(root.links()).join("path").attr("d", linkGen);

  const node = svg.append("g").selectAll("g").data(root.descendants()).join("g")
      .attr("transform", place);
  node.append("circle").attr("r", 2.8).attr("fill", d => d.children ? "#374151" : "#10b981");

  // label placement: outside for leaves, inside for internal nodes
  const outside = d => !d.children;
  const flip = d => radial && d.x >= Math.PI;   // text on the left half would be upside down
  node.append("text")
      .attr("dy", "0.32em")
      .attr("x", d => (outside(d) !== flip(d) ? 6 : -6))
      .attr("text-anchor", d => (outside(d) !== flip(d) ? "start" : "end"))
      .attr("transform", d => flip(d) ? "rotate(180)" : null)
      .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 3)
      .text(d => d.data.name);

  log(mode + ": leaf depths =", [...new Set(root.leaves().map(d => Math.round(d.y)))].join(", "));
}
draw("tree");
`}
      />
      <Callout type="tip" title="size vs nodeSize">
        <p>
          <code>size([w, h])</code> squeezes the whole tree into a fixed box, so a tree with many leaves gets
          cramped. <code>nodeSize([dx, dy])</code> gives each node a fixed amount of room instead; the tree then
          grows as needed and is centered on the root at <code>(0, 0)</code>, so compute the extent afterwards to
          set your viewBox — exactly what the horizontal version above does.
        </p>
      </Callout>

      <h2>Treemaps</h2>
      <p>
        A <strong>treemap</strong> recursively subdivides a rectangle so that each node&apos;s area is proportional
        to its <code>value</code>. That means you must call <code>root.sum(...)</code> first (and usually{" "}
        <code>sort</code> by value, which makes the layout more orderly). The <em>tiling method</em> decides how
        each parent is split:
      </p>
      <ul>
        <li>
          <strong>squarify</strong> (default) — aims for cells with an aspect ratio near the golden ratio, which are
          easiest to compare.
        </li>
        <li>
          <strong>binary</strong> — recursively splits children into two groups of roughly equal value; balanced
          and fast.
        </li>
        <li>
          <strong>slice</strong> / <strong>dice</strong> — split vertically (stacked rows) / horizontally (side by
          side columns). Preserves order but produces slivers.
        </li>
        <li>
          <strong>sliceDice</strong> — alternates slice and dice by depth (the original treemap algorithm).
        </li>
        <li>
          <strong>resquarify</strong> — like squarify, but on later layouts it <em>keeps</em> the previous
          arrangement of rows and only resizes them. Use it when animating value changes, so cells don&apos;t jump
          around.
        </li>
      </ul>
      <Playground
        title="Treemap with tiling methods"
        code={`
const data = await d3.json("/data/hierarchy-flare.json");
const W = 640, H = 420;
const tiles = {
  squarify: d3.treemapSquarify, binary: d3.treemapBinary, slice: d3.treemapSlice,
  dice: d3.treemapDice, sliceDice: d3.treemapSliceDice, resquarify: d3.treemapResquarify,
};
const root = d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value);
const color = d3.scaleOrdinal(d3.schemeTableau10);
const top = d => d.depth === 0 ? d : d.ancestors().find(a => a.depth === 1);
const key = d => d.ancestors().map(a => a.data.name).join("/");

d3.select(el).append("select").style("margin-bottom", "8px")
    .on("change", e => draw(e.target.value))
  .selectAll("option").data(Object.keys(tiles)).join("option").text(d => d);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H])
    .attr("font-family", "sans-serif").attr("font-size", 10);

function draw(name) {
  d3.treemap()
      .tile(tiles[name])
      .size([W, H])
      .paddingOuter(3).paddingTop(15).paddingInner(1)
      .round(true)(root);

  const node = svg.selectAll("g.node")
    .data(root.descendants(), key)
    .join(enter => {
      const g = enter.append("g").attr("class", "node");
      g.append("rect");
      g.append("text").attr("x", 3).attr("y", 11);
      g.append("title");
      return g;
    });

  const t = svg.transition().duration(750);
  node.transition(t).attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");
  node.select("rect").transition(t)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => d.depth === 0 ? "#e5e7eb" : color(top(d).data.name))
      .attr("fill-opacity", d => d.children ? 0.35 : 0.85);
  node.select("title").text(d => key(d) + "\\n" + d3.format(",")(d.value) + " bytes");
  node.select("text")
      .attr("font-weight", d => d.children ? "bold" : "normal")
      .text(d => {
        const w = d.x1 - d.x0, h = d.y1 - d.y0, chars = Math.floor((w - 4) / 6);
        if (h < 13 || chars < 3) return "";
        const s = d.data.name;
        return s.length > chars ? s.slice(0, chars - 1) + "…" : s;
      });

  // average aspect ratio of leaves — squarify should win
  const ratios = root.leaves().map(d => {
    const w = d.x1 - d.x0, h = d.y1 - d.y0;
    return Math.max(w / h, h / w);
  });
  log(name + ": median leaf aspect ratio", d3.median(ratios).toFixed(2));
}
draw("squarify");
`}
      />

      <h2>Circle packing</h2>
      <p>
        <code>d3.pack()</code> nests circles inside circles; leaf <em>areas</em> are proportional to value. It wastes
        more space than a treemap, but the hierarchy is much easier to see. The layout sets <code>x</code>,{" "}
        <code>y</code> and <code>r</code> on every node. Under the hood it uses two functions you can call
        directly: <code>d3.packSiblings(circles)</code> places an array of circles (objects with an <code>r</code>)
        tightly around the origin, and <code>d3.packEnclose(circles)</code> returns the smallest circle containing
        them all.
      </p>
      <Playground
        title="packSiblings and packEnclose"
        code={`
const rand = d3.randomUniform.source(d3.randomLcg(3))(4, 26);
const circles = d3.range(40).map(() => ({ r: rand() }));

d3.packSiblings(circles);            // mutates: adds x, y (centered on 0,0)
const enc = d3.packEnclose(circles); // {x, y, r}
log("enclosing radius:", enc.r.toFixed(1));

const svg = d3.select(el).append("svg").attr("viewBox", [-160, -160, 320, 320])
    .style("max-width", "360px");
svg.append("circle").attr("cx", enc.x).attr("cy", enc.y).attr("r", enc.r)
    .attr("fill", "none").attr("stroke", "#ef4444").attr("stroke-dasharray", "4 3");
svg.selectAll(".c").data(circles).join("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r)
    .attr("fill", (d, i) => d3.interpolateCool(i / circles.length)).attr("fill-opacity", 0.8);
`}
      />
      <Playground
        title="Circle packing the flare package"
        code={`
const data = await d3.json("/data/hierarchy-flare.json");
const S = 600;
const root = d3.pack().size([S, S]).padding(3)(
  d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value)
);
const color = d3.scaleSequential([-1, root.height + 1], d3.interpolateGnBu);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, S, S])
    .style("max-width", "600px").attr("font-family", "sans-serif").attr("text-anchor", "middle");
const info = svg.append("text").attr("x", 8).attr("y", 16).attr("text-anchor", "start")
    .attr("font-size", 12).attr("font-weight", "bold");

svg.append("g").selectAll("circle")
  .data(root.descendants())
  .join("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r)
    .attr("fill", d => d.children ? color(d.depth) : "white")
    .attr("stroke", d => d.children ? null : color(root.height))
    .on("pointerenter", function (event, d) {
      d3.select(this).attr("stroke", "#111").attr("stroke-width", 2);
      info.text(d.ancestors().reverse().map(a => a.data.name).join(" / ") + " — " + d3.format(",")(d.value));
    })
    .on("pointerleave", function (event, d) {
      d3.select(this).attr("stroke", d.children ? null : color(root.height)).attr("stroke-width", 1);
    });

svg.append("g").attr("pointer-events", "none")
  .selectAll("text")
  .data(root.leaves().filter(d => d.r > 20))
  .join("text")
    .attr("x", d => d.x).attr("y", d => d.y).attr("dy", "0.32em")
    .attr("font-size", d => Math.min(11, d.r / 4))
    .text(d => d.data.name);
`}
      />

      <h2>Partition: icicles and sunbursts</h2>
      <p>
        <code>d3.partition()</code> produces an <strong>adjacency diagram</strong>: each node is a band whose length
        (along one axis) is proportional to its value, and children sit next to their parent along the other axis.
        With a rectangular size you get an <strong>icicle</strong>; with a size of{" "}
        <code>[2 * Math.PI, radius]</code> and <code>d3.arc</code> you get a <strong>sunburst</strong>. Unlike a
        treemap, depth is encoded by position, so internal nodes are as visible as leaves.
      </p>
      <Playground
        title="Icicle and sunburst with hover path"
        code={`
const data = await d3.json("/data/hierarchy-flare.json");
const W = 640, H = 460, R = 210;
const hier = d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value - a.value);
const color = d3.scaleOrdinal(d3.schemeTableau10);
const hue = d => d.depth === 0 ? "#d1d5db" : color(d.ancestors().find(a => a.depth === 1).data.name);
const fmt = d3.format(",");

d3.select(el).append("select").style("margin-bottom", "8px")
    .on("change", e => draw(e.target.value))
  .selectAll("option").data(["sunburst", "icicle"]).join("option").text(d => d);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H])
    .attr("font-family", "sans-serif").attr("font-size", 10);

function draw(mode) {
  svg.selectAll("*").remove();
  const root = hier.copy().sum(d => d.value);
  let shapes;
  if (mode === "icicle") {
    d3.partition().size([H - 30, W]).padding(1)(root);   // x = vertical, y = depth (horizontal)
    shapes = svg.append("g").attr("transform", "translate(0,30)")
      .selectAll("rect").data(root.descendants()).join("rect")
        .attr("x", d => d.y0).attr("y", d => d.x0)
        .attr("width", d => d.y1 - d.y0).attr("height", d => d.x1 - d.x0);
    svg.append("g").attr("transform", "translate(0,30)").attr("pointer-events", "none")
      .selectAll("text").data(root.descendants().filter(d => d.x1 - d.x0 > 11)).join("text")
        .attr("x", d => d.y0 + 4).attr("y", d => (d.x0 + d.x1) / 2).attr("dy", "0.32em")
        .text(d => d.data.name);
  } else {
    d3.partition().size([2 * Math.PI, R])(root);
    const arc = d3.arc()
        .startAngle(d => d.x0).endAngle(d => d.x1)
        .padAngle(0.004).padRadius(R / 2)
        .innerRadius(d => d.y0).outerRadius(d => d.y1 - 1);
    shapes = svg.append("g").attr("transform", "translate(" + W / 2 + "," + (H / 2 + 14) + ")")
      .selectAll("path").data(root.descendants()).join("path").attr("d", arc);
  }
  shapes.attr("fill", hue).attr("fill-opacity", d => d.children ? 0.6 : 0.9);

  const info = svg.append("text").attr("x", 6).attr("y", 18).attr("font-size", 13);
  shapes
    .on("pointerenter", (event, d) => {
      const chain = new Set(d.ancestors());
      shapes.attr("fill-opacity", n => chain.has(n) ? 1 : 0.15);
      info.text(d.ancestors().reverse().map(a => a.data.name).join(" › ") + "  —  " +
        fmt(d.value) + " bytes (" + d3.format(".1%")(d.value / root.value) + ")");
    })
    .on("pointerleave", () => {
      shapes.attr("fill-opacity", d => d.children ? 0.6 : 0.9);
      info.text("");
    });
}
draw("sunburst");
`}
      />
      <Callout type="warning" title="Layouts mutate nodes">
        <p>
          Every layout writes its coordinates directly onto the node objects, and <code>sum</code>/
          <code>sort</code> modify them too. If you run two layouts on the same root, the second overwrites the
          first. Use <code>root.copy()</code> when you need two independent layouts (as the examples above do when
          switching modes), and remember <code>copy()</code> does not copy <code>value</code> — call{" "}
          <code>sum</code> again.
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            Use <code>root.eachAfter</code> to compute, for every node, the size of its <em>largest</em> leaf, and
            log the result for each top-level package.
          </>,
          <>
            Convert the flare JSON into a flat <code>{"{"}id, parentId, value{"}"}</code> table with{" "}
            <code>root.descendants()</code>, then rebuild it with <code>d3.stratify</code> and check the totals
            match.
          </>,
          <>
            Make the tidy tree collapsible: clicking an internal node moves its <code>children</code> to{" "}
            <code>_children</code> and re-runs the layout.
          </>,
          <>
            Add zoom-on-click to the treemap: clicking a top-level package re-runs the layout with that node as
            the root (hint: <code>node.copy()</code>).
          </>,
          <>
            Change the treemap to size cells by <code>count()</code> instead of <code>sum</code>. How does the
            picture change?
          </>,
        ]}
      />
    </>
  );
}
