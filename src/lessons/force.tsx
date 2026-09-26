import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        <code>d3-force</code> is a small <strong>physics engine</strong>. You give it an array of nodes, attach some
        forces (repulsion between nodes, springs along links, gravity toward a point…), and it moves the nodes step
        by step until the system settles. It&apos;s the tool behind force-directed network diagrams, but also bubble
        charts, beeswarm plots, and label de-cluttering — anywhere you want marks to find a position that satisfies
        several soft constraints at once.
      </p>

      <h2>How a simulation works</h2>
      <p>
        <code>d3.forceSimulation(nodes)</code> starts a timer immediately. On every <strong>tick</strong>:
      </p>
      <ol>
        <li>
          Each force is called and nudges the nodes&apos; <strong>velocities</strong> (<code>vx</code>,{" "}
          <code>vy</code>), scaled by the current <strong>alpha</strong>.
        </li>
        <li>
          Velocities are damped by <code>velocityDecay</code> (friction), then added to positions (<code>x</code>,{" "}
          <code>y</code>).
        </li>
        <li>
          Alpha moves toward <code>alphaTarget</code> (default 0) by <code>alphaDecay</code>. When alpha falls below{" "}
          <code>alphaMin</code> (0.001), the simulation stops and fires <code>end</code>.
        </li>
        <li>
          Your <code>tick</code> listener runs, where you update the SVG (or canvas) from the new positions.
        </li>
      </ol>
      <p>
        Think of <strong>alpha as temperature</strong>: it starts at 1 (hot, lots of movement) and cools down. With
        the default decay, a simulation runs about 300 ticks. The simulation <em>mutates your node objects</em>,
        adding <code>index</code>, <code>x</code>, <code>y</code>, <code>vx</code>, <code>vy</code> (and it seeds
        missing positions in a phyllotaxis spiral, so results are deterministic).
      </p>
      <Playground
        title="A first simulation"
        code={`
const W = 640, H = 360;
const rand = d3.randomUniform.source(d3.randomLcg(1))(4, 16);
const nodes = d3.range(90).map(i => ({ r: rand() }));

const svg = d3.select(el).append("svg").attr("viewBox", [-W / 2, -H / 2, W, H]);
const circles = svg.selectAll("circle").data(nodes).join("circle")
    .attr("r", d => d.r)
    .attr("fill", (d, i) => d3.interpolateTurbo(0.1 + 0.8 * i / nodes.length));
const label = svg.append("text").attr("x", -W / 2 + 8).attr("y", -H / 2 + 18).attr("font-size", 12);

let ticks = 0;
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-1.5)) // mild repulsion
    .force("center", d3.forceCenter(0, 0))               // keep the center of mass at 0,0
    .force("collide", d3.forceCollide(d => d.r + 1))     // no overlaps
    .on("tick", () => {
      ticks++;
      circles.attr("cx", d => d.x).attr("cy", d => d.y);
      label.text("tick " + ticks + "   alpha " + simulation.alpha().toFixed(3));
    })
    .on("end", () => log("settled after", ticks, "ticks"));

log("a node after init:", { ...nodes[0] });
`}
      />
      <Callout type="note">
        <p>
          Notice that the listener gets no arguments — you read positions straight off your data (
          <code>d.x</code>, <code>d.y</code>). Re-running a playground stops the old simulation automatically; in
          your own apps, call <code>simulation.stop()</code> when the chart is removed (e.g. in a React effect
          cleanup).
        </p>
      </Callout>

      <h2>The forces</h2>
      <ApiTable
        rows={[
          ["d3.forceSimulation(nodes)", "Create and start a simulation. .nodes() gets/sets the node array."],
          ["simulation.force(name, force)", "Add, replace or (with null) remove a named force."],
          ["simulation.on(\"tick\" | \"end\", fn)", "Listen for each step / for cooling down."],
          ["simulation.alpha(a) / alphaMin / alphaDecay", "Current temperature (default 1), stop threshold (0.001), cooling rate (~0.0228)."],
          ["simulation.alphaTarget(t)", "Temperature to settle toward — set > 0 to keep it warm while dragging."],
          ["simulation.velocityDecay(v)", "Friction, 0–1 (default 0.4). Higher = slower, calmer motion."],
          ["simulation.restart() / stop() / tick(n)", "Resume the timer / stop it / advance n steps synchronously."],
          ["simulation.find(x, y, radius)", "Nearest node to a point — handy for canvas hit-testing."],
          ["d3.forceLink(links)", "Springs along links. .id(d => d.id), .distance(30), .strength(fn), .iterations(1)."],
          ["d3.forceManyBody()", "Charge between all pairs: negative strength repels (default -30), positive attracts. .theta, .distanceMin/Max."],
          ["d3.forceCenter(x, y)", "Translates all nodes so their mean is at (x, y). Doesn't change shape. .strength(1)."],
          ["d3.forceCollide(radius)", "Treat nodes as circles that can't overlap. .strength(1), .iterations(1)."],
          ["d3.forceX(x) / forceY(y)", "Pull each node toward a target coordinate (can be per node). .strength(0.1)."],
          ["d3.forceRadial(r, x, y)", "Pull each node toward a circle of radius r around (x, y)."],
          ["node.fx / node.fy", "Fix a node's position (set to null to release)."],
        ]}
      />
      <p>
        <code>forceManyBody</code> uses the <strong>Barnes–Hut</strong> approximation: distant clusters of nodes are
        treated as a single body, turning an O(n²) computation into O(n log n). <code>theta</code> (default 0.9)
        controls the accuracy/speed trade-off. <code>forceCenter</code> vs <code>forceX</code>/
        <code>forceY</code> is a common confusion: centering shifts the whole system rigidly and never stops
        disconnected pieces from drifting apart, while <code>forceX</code>/<code>forceY</code> act like gravity on
        each node individually.
      </p>

      <h2>Links and dragging</h2>
      <p>
        <code>d3.forceLink(links)</code> treats each link as a spring with a rest length (<code>distance</code>)
        and stiffness (<code>strength</code>). Links refer to nodes via <code>source</code> and{" "}
        <code>target</code>, which can be indices or — with <code>.id(d =&gt; d.id)</code> — ids. After
        initialization, the simulation <em>replaces</em> those with references to the node objects, so in your tick
        handler you can write <code>d.source.x</code>.
      </p>
      <p>
        Dragging uses <code>d3.drag</code> plus the fixed-position properties <code>fx</code>/<code>fy</code>: while
        a node has <code>fx</code> set, the simulation pins it there. On drag start we also raise{" "}
        <code>alphaTarget</code> so the simulation keeps running (&quot;reheats&quot;) while the pointer moves:
      </p>
      <CodeBlock>{`
const drag = d3.drag()
  .on("start", (event, d) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x; d.fy = d.y;
  })
  .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
  .on("end", (event, d) => {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null; d.fy = null;        // omit these two lines to leave the node pinned
  });
`}</CodeBlock>
      <Playground
        title="Link force explorer (drag nodes, move sliders)"
        code={`
const W = 640, H = 400;
// a random tree plus a few extra edges
const rnd = d3.randomLcg(11);
const nodes = d3.range(50).map(i => ({ id: i }));
const links = d3.range(1, 50).map(i => ({ source: Math.floor(rnd() * i), target: i }));
for (let k = 0; k < 6; k++) links.push({ source: Math.floor(rnd() * 50), target: Math.floor(rnd() * 50) });

const controls = d3.select(el).append("div")
    .style("display", "flex").style("gap", "16px").style("flex-wrap", "wrap").style("font-size", "13px");
const svg = d3.select(el).append("svg").attr("viewBox", [-W / 2, -H / 2, W, H]);

const linkForce = d3.forceLink(links).id(d => d.id).distance(30);
const charge = d3.forceManyBody().strength(-60);
const simulation = d3.forceSimulation(nodes)
    .force("link", linkForce)
    .force("charge", charge)
    .force("x", d3.forceX())
    .force("y", d3.forceY());

function slider(name, min, max, step, value, apply) {
  const lab = controls.append("label");
  const out = lab.append("span").text(name + " " + value + " ");
  lab.append("input").attr("type", "range")
      .attr("min", min).attr("max", max).attr("step", step).property("value", value)
      .on("input", function () {
        out.text(name + " " + this.value + " ");
        apply(+this.value);
        simulation.alpha(0.5).restart();   // reheat so the change is visible
      });
}
slider("distance", 5, 120, 1, 30, v => linkForce.distance(v));
slider("charge", -300, 20, 5, -60, v => charge.strength(v));
slider("velocityDecay", 0.05, 0.9, 0.05, 0.4, v => simulation.velocityDecay(v));

const link = svg.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.7)
  .selectAll("line").data(links).join("line");
const node = svg.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
  .selectAll("circle").data(nodes).join("circle")
    .attr("r", d => d.id === 0 ? 8 : 5)
    .attr("fill", d => d.id === 0 ? "#e8590c" : "#1971c2")
    .style("cursor", "grab")
    .call(d3.drag()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      }));

simulation.on("tick", () => {
  link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
  node.attr("cx", d => d.x).attr("cy", d => d.y);
});
log("link source after init is a node object:", typeof links[0].source, links[0].source.id);
`}
      />
      <Callout type="warning" title="Links are mutated too">
        <p>
          Because <code>forceLink</code> swaps <code>source</code>/<code>target</code> ids for node objects, passing
          the <em>same</em> link array to a second simulation (or re-using it after changing the nodes) gives
          confusing results. Make fresh copies: <code>links.map(d =&gt; ({"{"} ...d {"}"}))</code>. Also, by
          default link strength is <code>1 / min(count(source), count(target))</code>, which weakens links attached
          to hubs so they don&apos;t collapse.
        </p>
      </Callout>

      <h2>Positioning forces: grouping, bubbles and rings</h2>
      <p>
        Without links, forces become a layout tool. <code>forceCollide</code> gives each node a radius so circles
        never overlap — the basis of a <strong>bubble chart</strong>. <code>forceX</code>/<code>forceY</code> with a
        per-node target pull nodes into <strong>groups</strong>, and <code>forceRadial</code> arranges them on
        concentric <strong>rings</strong>. Swapping forces on a live simulation and reheating it with{" "}
        <code>alpha(1).restart()</code> animates between layouts for free.
      </p>
      <Playground
        title="Bubbles: together, split, rings"
        code={`
const W = 640, H = 400;
const groups = ["Frontend", "Backend", "Data"];
const color = d3.scaleOrdinal(groups, ["#4c6ef5", "#f76707", "#2f9e44"]);
const rnd = d3.randomLcg(5);
const nodes = d3.range(130).map(i => ({
  group: groups[Math.floor(rnd() * 3)],
  value: Math.pow(rnd(), 2) * 100 + 5,
}));
const r = d3.scaleSqrt().domain([0, 105]).range([0, 18]);

const bar = d3.select(el).append("div").style("margin-bottom", "6px");
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).attr("font-family", "sans-serif");
const labels = svg.append("g").attr("font-size", 13).attr("text-anchor", "middle").attr("font-weight", "bold");
const bubbles = svg.append("g").selectAll("circle").data(nodes).join("circle")
    .attr("r", d => r(d.value))
    .attr("fill", d => color(d.group)).attr("fill-opacity", 0.85)
    .attr("stroke", "white");

const gx = d3.scalePoint(groups, [120, W - 120]);
const ringR = d3.scalePoint(groups, [40, 180]).padding(0.5);

const simulation = d3.forceSimulation(nodes)
    .force("collide", d3.forceCollide(d => r(d.value) + 1))
    .on("tick", () => bubbles.attr("cx", d => d.x).attr("cy", d => d.y));

const layouts = {
  together() {
    simulation.force("x", d3.forceX(W / 2).strength(0.06))
              .force("y", d3.forceY(H / 2).strength(0.06))
              .force("radial", null);
    labels.selectAll("text").data([]).join("text");
  },
  split() {
    simulation.force("x", d3.forceX(d => gx(d.group)).strength(0.1))
              .force("y", d3.forceY(H / 2).strength(0.06))
              .force("radial", null);
    labels.selectAll("text").data(groups).join("text")
        .attr("x", d => gx(d)).attr("y", 30).text(d => d);
  },
  rings() {
    simulation.force("x", null).force("y", null)
              .force("radial", d3.forceRadial(d => ringR(d.group), W / 2, H / 2).strength(0.3));
    labels.selectAll("text").data([]).join("text");
  },
};
for (const name of Object.keys(layouts)) {
  bar.append("button").text(name).style("margin-right", "6px").style("padding", "2px 10px")
      .style("border", "1px solid #999").style("border-radius", "4px")
      .on("click", () => { layouts[name](); simulation.alpha(1).restart(); });
}
layouts.together();
`}
      />

      <h2>Static layouts with simulation.tick()</h2>
      <p>
        Sometimes you don&apos;t want animation — you just want the final positions. Create the simulation, call{" "}
        <code>stop()</code> right away, and advance it manually with <code>tick(n)</code>. Ticking doesn&apos;t fire
        tick events; it just updates the nodes. This is how a <strong>beeswarm</strong> plot is often built:{" "}
        <code>forceX</code> pulls each dot to its exact value, a weak <code>forceY</code> keeps the swarm on its
        baseline, and <code>forceCollide</code> pushes overlapping dots up and down.
      </p>
      <Playground
        title="Beeswarm (computed synchronously)"
        code={`
const W = 640, H = 220, m = { left: 20, right: 20, bottom: 30 };
const rand = d3.randomLogNormal.source(d3.randomLcg(9))(3.6, 0.45);
const data = d3.range(260).map(() => ({ salary: Math.round(rand()) })); // $k/year (synthetic)

const x = d3.scaleLinear().domain(d3.extent(data, d => d.salary)).nice().range([m.left, W - m.right]);
const cy = (H - m.bottom) / 2;

const simulation = d3.forceSimulation(data)
    .force("x", d3.forceX(d => x(d.salary)).strength(1))
    .force("y", d3.forceY(cy).strength(0.05))
    .force("collide", d3.forceCollide(4))
    .stop();

const t0 = performance.now();
simulation.tick(200);
log("200 ticks in", (performance.now() - t0).toFixed(1), "ms");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")")
    .call(d3.axisBottom(x).tickFormat(d => "$" + d + "k"));
svg.append("g").selectAll("circle").data(data).join("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 3.5)
    .attr("fill", d => d3.interpolateViridis(x(d.salary) / W));
`}
      />

      <h2>A character network</h2>
      <p>
        Here is the canonical force-directed example: a co-occurrence network of characters from{" "}
        <em>Les Misérables</em> (a trimmed version of Knuth&apos;s dataset, in <code>/data/force-lesmis.json</code>
        ). Link <code>value</code> is how many chapters two characters share; we use it for stroke width and to make
        strong ties shorter. Hover a character to highlight their neighbors, and drag to rearrange.
      </p>
      <Playground
        title="Les Misérables co-occurrence network"
        code={`
const { nodes, links } = await d3.json("/data/force-lesmis.json");
const W = 640, H = 480;
const color = d3.scaleOrdinal(d3.schemeTableau10);

// degree → radius
const degree = d3.rollup(links.flatMap(l => [l.source, l.target]), v => v.length, d => d);
const r = d3.scaleSqrt().domain([1, d3.max(degree.values())]).range([4, 14]);

const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id)
        .distance(l => 70 - Math.min(40, l.value * 2)))
    .force("charge", d3.forceManyBody().strength(-160))
    .force("collide", d3.forceCollide(d => r(degree.get(d.id)) + 2))
    .force("x", d3.forceX().strength(0.05))
    .force("y", d3.forceY().strength(0.07));

const svg = d3.select(el).append("svg").attr("viewBox", [-W / 2, -H / 2, W, H])
    .attr("font-family", "sans-serif").attr("font-size", 10);

const link = svg.append("g").attr("stroke", "#999")
  .selectAll("line").data(links).join("line")
    .attr("stroke-opacity", 0.5)
    .attr("stroke-width", d => Math.sqrt(d.value));

const node = svg.append("g").selectAll("g").data(nodes).join("g").style("cursor", "grab");
node.append("circle")
    .attr("r", d => r(degree.get(d.id)))
    .attr("fill", d => color(d.group))
    .attr("stroke", "#fff").attr("stroke-width", 1.5);
node.append("text")
    .attr("x", d => r(degree.get(d.id)) + 2).attr("dy", "0.32em")
    .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 3)
    .text(d => d.id);

// neighbor lookup for hover. forceLink has already replaced ids with node objects here.
const adjacent = new Set(links.map(l => l.source.id + "|" + l.target.id));
const isNeighbor = (a, b) => a === b || adjacent.has(a.id + "|" + b.id) || adjacent.has(b.id + "|" + a.id);

node.on("pointerenter", (event, d) => {
  node.attr("opacity", n => isNeighbor(d, n) ? 1 : 0.15);
  link.attr("stroke-opacity", l => l.source === d || l.target === d ? 0.9 : 0.05)
      .attr("stroke", l => l.source === d || l.target === d ? color(d.group) : "#999");
}).on("pointerleave", () => {
  node.attr("opacity", 1);
  link.attr("stroke-opacity", 0.5).attr("stroke", "#999");
});

node.call(d3.drag()
  .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
  .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
  .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

simulation.on("tick", () => {
  link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
  node.attr("transform", d => "translate(" + d.x + "," + d.y + ")");
});

const top = [...degree].sort((a, b) => b[1] - a[1]).slice(0, 5);
log("most connected:", top.map(([id, k]) => id + " (" + k + ")").join(", "));
`}
      />

      <h2>Writing a custom force</h2>
      <p>
        A force is just a <strong>function of alpha</strong> that adjusts node velocities. Optionally it has an{" "}
        <code>initialize(nodes, random)</code> method, which the simulation calls whenever the force is added or
        the nodes change. That&apos;s the entire contract:
      </p>
      <CodeBlock>{`
function myForce(alpha) {
  for (const node of nodes) node.vx += (targetX - node.x) * strength * alpha;
}
myForce.initialize = (_nodes) => { nodes = _nodes; };
simulation.force("mine", myForce);
`}</CodeBlock>
      <p>
        Below, a <strong>cluster force</strong> pulls every node toward the current centroid of its own group
        (wherever that group ends up), and a <strong>box force</strong> keeps nodes inside the viewport. Try
        commenting out either one.
      </p>
      <Playground
        title="Custom cluster and bounding-box forces"
        code={`
const W = 640, H = 360, pad = 8;
const rnd = d3.randomLcg(21);
const k = 5;
const nodes = d3.range(160).map(i => ({ group: i % k, r: 3 + rnd() * 6 }));
const color = d3.scaleOrdinal(d3.schemeSet2);

function forceCluster(strength = 0.2) {
  let nodes;
  function force(alpha) {
    // centroid of each group, recomputed every tick
    const c = d3.rollup(nodes, v => ({ x: d3.mean(v, d => d.x), y: d3.mean(v, d => d.y) }), d => d.group);
    for (const d of nodes) {
      const { x, y } = c.get(d.group);
      d.vx -= (d.x - x) * strength * alpha;
      d.vy -= (d.y - y) * strength * alpha;
    }
  }
  force.initialize = _ => (nodes = _);
  return force;
}

function forceBox(x0, y0, x1, y1) {
  let nodes;
  function force() {
    for (const d of nodes) {
      d.x = Math.max(x0 + d.r, Math.min(x1 - d.r, d.x));
      d.y = Math.max(y0 + d.r, Math.min(y1 - d.r, d.y));
    }
  }
  force.initialize = _ => (nodes = _);
  return force;
}

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("rect").attr("x", pad).attr("y", pad).attr("width", W - 2 * pad).attr("height", H - 2 * pad)
    .attr("fill", "none").attr("stroke", "#ddd");
const circles = svg.selectAll("circle").data(nodes).join("circle")
    .attr("r", d => d.r).attr("fill", d => color(d.group));

d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-6))    // spreads everything out...
    .force("cluster", forceCluster(0.3))                 // ...while groups stick together
    .force("collide", d3.forceCollide(d => d.r + 1))
    .force("center", d3.forceCenter(W / 2, H / 2))
    .force("box", forceBox(pad, pad, W - pad, H - pad))
    .alphaDecay(0.01)                                    // cool more slowly
    .on("tick", () => circles.attr("cx", d => d.x).attr("cy", d => d.y));
`}
      />
      <Callout type="tip" title="Performance">
        <p>
          SVG handles a few hundred nodes comfortably. For thousands, draw on a <code>&lt;canvas&gt;</code> in the
          tick handler and use <code>simulation.find(x, y)</code> for hover and drag hit-testing. Lowering{" "}
          <code>forceManyBody().theta</code> accuracy, capping <code>distanceMax</code>, or increasing{" "}
          <code>alphaDecay</code> all reduce the work per frame.
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            In the first example, change the charge strength to <code>+5</code> (attraction). What happens without
            the collide force?
          </>,
          <>
            Make dragged nodes stay pinned where you drop them in the link explorer, and release them on
            double-click (<code>d.fx = d.fy = null</code>).
          </>,
          <>
            Add a fourth layout to the bubble chart that lays groups out vertically with <code>forceY</code>, and
            size the collide radius so bubbles have 3px of breathing room.
          </>,
          <>
            In the Les Misérables network, add a search box: typing a name fixes that node at the center (
            <code>fx = fy = 0</code>) and reheats the simulation.
          </>,
          <>
            Write a custom <code>forceWind</code> that pushes every node to the right with a constant velocity
            proportional to alpha, and combine it with the box force.
          </>,
        ]}
      />
    </>
  );
}
