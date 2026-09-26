import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        This lesson covers the rest of d3-shape: the <strong>stack</strong> layout, which computes baselines so that
        series can be piled on top of each other (stacked bars, stacked areas, streamgraphs); the{" "}
        <strong>symbol</strong> generator for scatterplot markers; and the <strong>link</strong> generators that draw
        the smooth curved connectors used in trees and flow diagrams.
      </p>

      <h2>d3.stack: computing baselines</h2>
      <p>
        Stacking is a data transformation, not a drawing operation. Given &quot;wide&quot; data — one row per x
        value with a column per series — and a list of <code>keys</code>, <code>d3.stack()</code> returns{" "}
        <strong>one array per key</strong> (a <em>series</em>). Each series contains one point per input row, and
        each point is a two-element array <code>[y0, y1]</code>: the lower and upper value of that segment. The
        original row is available as <code>point.data</code>, and the series carries <code>.key</code> and{" "}
        <code>.index</code>.
      </p>
      <Playground
        title="The shape of stacked data"
        hideOutput
        code={`
const data = [
  { month: "Jan", apples: 30, bananas: 20, cherries: 10 },
  { month: "Feb", apples: 25, bananas: 30, cherries: 15 },
  { month: "Mar", apples: 40, bananas: 10, cherries: 20 },
];

const stack = d3.stack().keys(["apples", "bananas", "cherries"]);
const series = stack(data);

// Arrays with extra properties don't print nicely, so reshape for logging:
log(series.map(s => ({
  key: s.key,
  index: s.index,
  points: s.map(p => [p[0], p[1]]),   // [y0, y1] per month
})));

log("first point's original row:", series[0][0].data);

// The max of the top series is the y-domain max you need:
log("y max:", d3.max(series, s => d3.max(s, p => p[1])));
`}
      />
      <p>
        Two options change the result. <code>stack.order</code> decides which series goes at the bottom, and{" "}
        <code>stack.offset</code> decides where the baseline is:
      </p>
      <ul>
        <li>
          <strong>Orders</strong>: <code>stackOrderNone</code> (key order, the default),{" "}
          <code>stackOrderAscending</code> / <code>Descending</code> (by series sum),{" "}
          <code>stackOrderInsideOut</code> (largest in the middle — great for streamgraphs),{" "}
          <code>stackOrderAppearance</code> (by when each series peaks), <code>stackOrderReverse</code>.
        </li>
        <li>
          <strong>Offsets</strong>: <code>stackOffsetNone</code> (zero baseline), <code>stackOffsetExpand</code>{" "}
          (normalize every column to 0–1, i.e. 100% stacked), <code>stackOffsetDiverging</code> (positives up,
          negatives down), <code>stackOffsetSilhouette</code> (centered around zero) and{" "}
          <code>stackOffsetWiggle</code> (minimizes weighted slope changes — the streamgraph offset).
        </li>
      </ul>

      <h2>Stacked bar chart</h2>
      <p>
        Draw a stacked bar chart with a <strong>nested join</strong>: one <code>&lt;g&gt;</code> per series (sets
        the color), then one <code>&lt;rect&gt;</code> per point inside it. <code>y(p[1])</code> is the top of each
        segment and <code>y(p[0]) - y(p[1])</code> its height. Toggle between absolute and 100% stacking:
      </p>
      <Playground
        title="Stacked bars (absolute / normalized)"
        code={`
const keys = ["Organic", "Paid search", "Social", "Email", "Referral"];
const raw = [
  [4200, 2100, 1800, 900, 600], [4500, 2300, 1500, 1100, 700], [4800, 2600, 2200, 950, 650],
  [5100, 2400, 2600, 1200, 800], [5600, 2900, 2400, 1300, 900], [5400, 3100, 2900, 1250, 1000],
  [6000, 3000, 3300, 1400, 950], [6300, 3400, 3000, 1500, 1100],
];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const data = raw.map((vals, i) => ({ month: months[i], ...Object.fromEntries(keys.map((k, j) => [k, vals[j]])) }));

const W = 640, H = 340, m = { top: 40, right: 20, bottom: 30, left: 50 };
const color = d3.scaleOrdinal(keys, d3.schemeTableau10);
const x = d3.scaleBand(months, [m.left, W - m.right]).padding(0.2);
const y = d3.scaleLinear().range([H - m.bottom, m.top]);

const buttons = d3.select(el).append("div");
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x).tickSizeOuter(0));
const yAxis = svg.append("g").attr("transform", \`translate(\${m.left},0)\`);

// legend
const leg = svg.append("g").selectAll("g").data(keys).join("g")
    .attr("transform", (d, i) => \`translate(\${m.left + i * 110},12)\`);
leg.append("rect").attr("width", 12).attr("height", 12).attr("fill", color);
leg.append("text").attr("x", 16).attr("y", 10).text(d => d);

const layer = svg.append("g");

function render(offset) {
  const series = d3.stack().keys(keys).offset(offset)(data);
  y.domain([0, d3.max(series, s => d3.max(s, p => p[1]))]).nice();
  yAxis.transition().duration(600)
      .call(d3.axisLeft(y).ticks(6, offset === d3.stackOffsetExpand ? "%" : "~s"));

  layer.selectAll("g").data(series, s => s.key).join("g")
      .attr("fill", s => color(s.key))
    .selectAll("rect")
    .data(s => s.map(p => Object.assign(p, { key: s.key })))
    .join(enter => enter.append("rect").attr("y", y(0)).attr("height", 0)
            .call(r => r.append("title")))
      .attr("x", p => x(p.data.month))
      .attr("width", x.bandwidth())
      .call(r => r.select("title").text(p => p.key + ", " + p.data.month + ": " + p.data[p.key].toLocaleString()))
    .transition().duration(600)
      .attr("y", p => y(p[1]))
      .attr("height", p => y(p[0]) - y(p[1]));
}

buttons.selectAll("button")
  .data([["Absolute", d3.stackOffsetNone], ["100% (stackOffsetExpand)", d3.stackOffsetExpand]])
  .join("button")
    .text(d => d[0]).style("margin-right", "6px").style("padding", "3px 12px").style("cursor", "pointer").style("border", "1px solid #ced4da").style("border-radius", "6px").style("background", "#f8f9fa")
    .on("click", (event, d) => render(d[1]));
render(d3.stackOffsetNone);
`}
      />
      <Callout type="tip">
        <p>
          <code>d3.stack</code> wants wide data. If yours is tidy (one row per month <em>and</em> series), pivot it
          with <code>d3.index</code> and tell the stack how to read values:{" "}
          <code>
            d3.stack().keys(keys).value(([, group], key) =&gt; group.get(key).value)(d3.index(data, d =&gt; d.month, d
            =&gt; d.series))
          </code>
          .
        </p>
      </Callout>

      <h2>Stacked areas and streamgraphs</h2>
      <p>
        Stacked series plug straight into <code>d3.area()</code>: use <code>p[0]</code> for <code>y0</code> and{" "}
        <code>p[1]</code> for <code>y1</code>, and <code>p.data</code> for x. Switching the offset to{" "}
        <code>stackOffsetWiggle</code> and the order to <code>stackOrderInsideOut</code> turns a stacked area chart
        into a <strong>streamgraph</strong>. Try the combinations below (the data is Lee Byron&apos;s classic
        &quot;bumps&quot; test function):
      </p>
      <Playground
        title="Offsets and orders explorer"
        code={`
const n = 9, m = 80;                       // 9 series, 80 samples
const rng = d3.randomLcg(42);
function bumps() {
  const a = new Array(m).fill(0);
  for (let i = 0; i < 5; i++) {
    const x = 1 / (0.1 + rng()), y = 2 * rng() - 0.5, z = 10 / (0.1 + rng());
    for (let j = 0; j < m; j++) { const w = (j / m - y) * z; a[j] += x * Math.exp(-w * w); }
  }
  return a;
}
const keys = d3.range(n).map(i => "s" + i);
const cols = keys.map(bumps);
const data = d3.range(m).map(j => Object.fromEntries([["t", j], ...keys.map((k, i) => [k, cols[i][j]])]));

const offsets = ["stackOffsetWiggle", "stackOffsetSilhouette", "stackOffsetExpand", "stackOffsetNone"];
const orders = ["stackOrderInsideOut", "stackOrderNone", "stackOrderAscending", "stackOrderDescending", "stackOrderAppearance", "stackOrderReverse"];

const ctrl = d3.select(el).append("div").style("font", "12px sans-serif").style("display", "flex").style("gap", "10px");
const offSel = ctrl.append("select"); offSel.selectAll("option").data(offsets).join("option").text(d => d);
const ordSel = ctrl.append("select"); ordSel.selectAll("option").data(orders).join("option").text(d => d);

const W = 640, H = 300;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);
const x = d3.scaleLinear([0, m - 1], [0, W]);
const y = d3.scaleLinear().range([H - 10, 10]);
const color = d3.scaleOrdinal(keys, d3.quantize(d3.interpolateCool, n));
const area = d3.area()
    .x(p => x(p.data.t))
    .y0(p => y(p[0]))
    .y1(p => y(p[1]))
    .curve(d3.curveBasis);

function render() {
  const series = d3.stack().keys(keys)
      .offset(d3[offSel.property("value")])
      .order(d3[ordSel.property("value")])(data);
  y.domain([d3.min(series, s => d3.min(s, p => p[0])), d3.max(series, s => d3.max(s, p => p[1]))]);
  svg.selectAll("path").data(series, s => s.key).join("path")
      .attr("fill", s => color(s.key))
    .transition().duration(700)
      .attr("d", area);
}
offSel.on("change", render);
ordSel.on("change", render);
render();
`}
      />
      <Callout type="warning">
        <p>
          With <code>stackOffsetNone</code>, negative values produce overlapping segments. Use{" "}
          <code>stackOffsetDiverging</code> for data with mixed signs (e.g. a Likert survey or profit/loss): positive
          values stack upward from zero and negative values stack downward, and your y domain must then span{" "}
          <code>d3.min(series, s =&gt; d3.min(s, p =&gt; p[0]))</code> to the max.
        </p>
      </Callout>

      <h2>Symbols</h2>
      <p>
        <code>d3.symbol(type, size)</code> generates marker shapes centered on the origin. <code>size</code> is the{" "}
        <strong>area</strong> in square pixels (default 64), not the radius — so perceived size scales naturally
        (pair it with <code>d3.scaleLinear</code> on area, or <code>scaleSqrt</code> if you think in radii). D3 ships
        two curated sets: <code>d3.symbolsFill</code> (designed to be filled) and <code>d3.symbolsStroke</code>{" "}
        (designed to be stroked, from Heman Robinson&apos;s research on distinguishable markers).
      </p>
      <Playground
        title="Symbol gallery"
        code={`
const fillNames = ["symbolCircle", "symbolCross", "symbolDiamond", "symbolSquare", "symbolStar", "symbolTriangle", "symbolWye"];
const strokeNames = ["symbolCircle", "symbolPlus", "symbolTimes", "symbolTriangle2", "symbolAsterisk", "symbolSquare2", "symbolDiamond2"];

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 260")
    .style("font", "10px sans-serif");

function row(title, types, names, y, filled) {
  svg.append("text").attr("x", 10).attr("y", y - 40).attr("font-weight", "bold").text(title);
  const g = svg.selectAll(null).data(types).join("g")
      .attr("transform", (d, i) => \`translate(\${50 + i * 88},\${y})\`);
  g.append("path")
      .attr("d", t => d3.symbol(t, 500)())
      .attr("fill", filled ? "#7048e8" : "none")
      .attr("stroke", filled ? "none" : "#7048e8")
      .attr("stroke-width", 1.5);
  g.append("text").attr("y", 32).attr("text-anchor", "middle").text((d, i) => names[i].replace("symbol", ""));
}
row("d3.symbolsFill", d3.symbolsFill, fillNames, 70, true);
row("d3.symbolsStroke", d3.symbolsStroke, strokeNames, 190, false);

log("symbolCircle, size 64:", d3.symbol()());
`}
      />
      <p>
        A common use is encoding a category with shape <em>and</em> color, which is more accessible than color
        alone. Map categories to types with an ordinal scale:
      </p>
      <Playground
        title="Scatterplot with symbol shapes"
        code={`
const species = ["Adelie", "Chinstrap", "Gentoo"];
const rnd = d3.randomNormal.source(d3.randomLcg(5))(0, 1);
const centers = { Adelie: [38.8, 18.3, 3700], Chinstrap: [48.8, 18.4, 3730], Gentoo: [47.5, 15.0, 5080] };
const data = species.flatMap(s => d3.range(50).map(() => ({
  species: s,
  bill: centers[s][0] + rnd() * 2.8,
  depth: centers[s][1] + rnd() * 1.0,
  mass: centers[s][2] + rnd() * 450,
})));

const W = 640, H = 360, m = { top: 20, right: 110, bottom: 40, left: 46 };
const x = d3.scaleLinear().domain(d3.extent(data, d => d.bill)).nice().range([m.left, W - m.right]);
const y = d3.scaleLinear().domain(d3.extent(data, d => d.depth)).nice().range([H - m.bottom, m.top]);
const shape = d3.scaleOrdinal(species, [d3.symbolCircle, d3.symbolTriangle, d3.symbolSquare]);
const color = d3.scaleOrdinal(species, ["#e8590c", "#ae3ec9", "#0c8599"]);
const size = d3.scaleLinear().domain(d3.extent(data, d => d.mass)).range([20, 140]);  // area!

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x))
  .append("text").attr("x", W - m.right).attr("y", 32).attr("fill", "black")
    .attr("text-anchor", "end").text("Bill length (mm) →");
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y))
  .append("text").attr("x", -m.left).attr("y", 12).attr("fill", "black")
    .attr("text-anchor", "start").text("↑ Bill depth (mm)");

const symbol = d3.symbol().type(d => shape(d.species)).size(d => size(d.mass));
svg.append("g").selectAll("path").data(data).join("path")
    .attr("transform", d => \`translate(\${x(d.bill)},\${y(d.depth)})\`)
    .attr("d", symbol)
    .attr("fill", d => color(d.species)).attr("fill-opacity", 0.7)
    .attr("stroke", "white").attr("stroke-width", 0.5);

const leg = svg.append("g").attr("transform", \`translate(\${W - m.right + 20},\${m.top + 10})\`)
  .selectAll("g").data(species).join("g").attr("transform", (d, i) => \`translate(0,\${i * 22})\`);
leg.append("path").attr("d", s => d3.symbol(shape(s), 100)()).attr("fill", color);
leg.append("text").attr("x", 12).attr("dy", "0.35em").text(s => s);
`}
      />

      <h2>Links</h2>
      <p>
        Link generators draw a smooth cubic Bézier from a <code>source</code> point to a <code>target</code> point —
        the curved edges you see in tree diagrams. <code>d3.linkHorizontal()</code> leaves and enters horizontally
        (for left-to-right trees), <code>d3.linkVertical()</code> vertically (top-down trees), and{" "}
        <code>d3.linkRadial()</code> uses <code>angle</code>/<code>radius</code> for radial trees. By default a link
        datum looks like <code>{"{"} source: [x, y], target: [x, y] {"}"}</code>; customize with{" "}
        <code>.source()</code>, <code>.target()</code>, <code>.x()</code> and <code>.y()</code>. (For arbitrary
        curve types there is also <code>d3.link(curve)</code>, e.g. <code>d3.link(d3.curveBumpX)</code>.)
      </p>
      <Playground
        title="linkHorizontal, linkVertical, linkRadial"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 230")
    .style("font", "11px sans-serif");
const nodeStyle = s => s.attr("r", 4).attr("fill", "white").attr("stroke", "#495057").attr("stroke-width", 1.5);

// --- horizontal: one root fanning out to 5 leaves
const gh = svg.append("g").attr("transform", "translate(20,30)");
const hLinks = d3.range(5).map(i => ({ source: [0, 80], target: [160, i * 40] }));
gh.selectAll("path").data(hLinks).join("path")
    .attr("d", d3.linkHorizontal())
    .attr("fill", "none").attr("stroke", "#4dabf7").attr("stroke-width", 1.5);
gh.selectAll("circle").data([[0, 80], ...hLinks.map(l => l.target)]).join("circle")
    .attr("cx", d => d[0]).attr("cy", d => d[1]).call(nodeStyle);
gh.append("text").attr("x", 80).attr("y", 190).attr("text-anchor", "middle").text("linkHorizontal");

// --- vertical, with object nodes and custom accessors
const gv = svg.append("g").attr("transform", "translate(230,30)");
const root = { x: 80, y: 0 };
const kids = d3.range(4).map(i => ({ x: i * 53, y: 150 }));
const vLink = d3.linkVertical().x(n => n.x).y(n => n.y);
gv.selectAll("path").data(kids.map(k => ({ source: root, target: k }))).join("path")
    .attr("d", vLink)
    .attr("fill", "none").attr("stroke", "#38d9a9").attr("stroke-width", 1.5);
gv.selectAll("circle").data([root, ...kids]).join("circle")
    .attr("cx", n => n.x).attr("cy", n => n.y).call(nodeStyle);
gv.append("text").attr("x", 80).attr("y", 190).attr("text-anchor", "middle").text("linkVertical");

// --- radial: [angle, radius] points around a center
const gr = svg.append("g").attr("transform", "translate(540,105)");
const rLinks = d3.range(10).map(i => ({ source: [0, 0], target: [(i / 10) * 2 * Math.PI, 75] }));
gr.selectAll("path").data(rLinks).join("path")
    .attr("d", d3.linkRadial().angle(p => p[0]).radius(p => p[1]))
    .attr("fill", "none").attr("stroke", "#f783ac").attr("stroke-width", 1.5);
gr.selectAll("circle").data(rLinks.map(l => l.target)).join("circle")
    .attr("cx", p => 75 * Math.sin(p[0])).attr("cy", p => -75 * Math.cos(p[0])).call(nodeStyle);
gr.append("circle").call(nodeStyle);
gr.append("text").attr("y", 115).attr("text-anchor", "middle").text("linkRadial");

log(d3.linkHorizontal()({ source: [0, 0], target: [100, 50] }));
`}
      />
      <p>
        In practice you rarely build link data by hand: <code>d3.hierarchy</code> and <code>d3.tree</code> (see the
        Hierarchies lesson) give you <code>root.links()</code>, an array of exactly these{" "}
        <code>{"{"}source, target{"}"}</code> objects.
      </p>
      <CodeBlock>{`
svg.selectAll("path")
  .data(root.links())
  .join("path")
    .attr("d", d3.linkHorizontal().x(d => d.y).y(d => d.x)); // swap for left-to-right trees
`}</CodeBlock>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.stack()", "Create a stack generator: wide data → one series per key of [y0, y1] points."],
          ["stack.keys(keys)", "Which columns to stack (array or function returning an array)."],
          ["stack.value(fn)", "How to read a value: (row, key) => number. Default row[key]."],
          ["stack.order(order)", "stackOrderNone, Ascending, Descending, InsideOut, Appearance, Reverse."],
          ["stack.offset(offset)", "stackOffsetNone, Expand, Diverging, Silhouette, Wiggle."],
          ["d3.symbol(type?, size?)", "Symbol generator; size is area in px² (default 64)."],
          ["symbol.type(t) / symbol.size(s)", "Constant or accessor for shape and area."],
          ["d3.symbolsFill / d3.symbolsStroke", "Curated arrays of 7 filled / 7 stroked symbol types."],
          ["d3.symbolCircle, symbolStar, symbolWye…", "Individual symbol types."],
          ["d3.linkHorizontal() / linkVertical()", "Cubic Bézier from source to target with horizontal/vertical tangents."],
          ["d3.linkRadial()", "Radial link using angle and radius accessors."],
          ["link.source(fn) / target(fn) / x(fn) / y(fn)", "Accessors for endpoints and their coordinates."],
          ["d3.link(curve)", "Link generator using any curve, e.g. d3.curveBumpX."],
        ]}
      />

      <Exercises
        items={[
          <>
            Change the stacked bar chart into a <em>grouped</em> bar chart: use a nested{" "}
            <code>d3.scaleBand</code> for the keys within each month instead of stacking.
          </>,
          <>
            Add a hover effect to the streamgraph that dims all other layers and shows the series key.
          </>,
          <>
            Create a diverging stacked bar chart for a 5-point survey (Strongly disagree … Strongly agree) by making
            the disagree values negative and using <code>stackOffsetDiverging</code>.
          </>,
          <>
            In the scatterplot, switch the palette to <code>d3.symbolsStroke</code> with no fill — is it easier or
            harder to tell overlapping species apart?
          </>,
        ]}
      />
    </>
  );
}
