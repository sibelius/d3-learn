import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Scales turn data values into pixel positions, but something still has to turn a <em>list</em> of positions
        into a shape. That is the job of <strong>d3-shape</strong>. Its generators are plain functions: you configure
        them once, call them with an array of data, and they return an SVG path string (the <code>d</code>{" "}
        attribute of a <code>&lt;path&gt;</code>). They never touch the DOM themselves, which makes them easy to
        reason about, test, and reuse — even with <code>&lt;canvas&gt;</code>.
      </p>

      <h2>d3.line: from points to a path string</h2>
      <p>
        A line generator needs to know two things about each datum: its <strong>x</strong> and its{" "}
        <strong>y</strong>. By default it expects each datum to be a two-element array <code>[x, y]</code>, but you
        will almost always pass accessor functions that read fields from your objects and run them through scales:
      </p>
      <CodeBlock>{`
const line = d3.line()
    .x(d => x(d.date))      // accessor called as (d, i, data)
    .y(d => y(d.value));

path.attr("d", line(data)); // "M10,80L50,20L90,60..."
`}</CodeBlock>
      <p>
        The returned string is just SVG path commands: <code>M</code> moves the pen, <code>L</code> draws a straight
        line to the next point, and curves use <code>C</code> (cubic Bézier). Let&apos;s generate one and print it
        so there is no magic left.
      </p>
      <Playground
        title="Demystifying the path string"
        code={`
const points = [[20, 120], [100, 40], [180, 90], [260, 30], [340, 110], [420, 60]];

const line = d3.line();                 // default accessors: d => d[0], d => d[1]
const d = line(points);
log("linear:", d);

const smooth = d3.line().curve(d3.curveMonotoneX);
log("monotoneX:", smooth(points));

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 440 150");

svg.append("path")
    .attr("d", d)
    .attr("fill", "none")
    .attr("stroke", "#adb5bd")
    .attr("stroke-dasharray", "4 3");

svg.append("path")
    .attr("d", smooth(points))
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5);

svg.selectAll("circle")
  .data(points)
  .join("circle")
    .attr("cx", p => p[0])
    .attr("cy", p => p[1])
    .attr("r", 4)
    .attr("fill", "white")
    .attr("stroke", "#e8590c")
    .attr("stroke-width", 2);
`}
      />
      <Callout type="note">
        <p>
          Because generators return strings, the idiomatic pattern is to bind the <em>whole array</em> to a{" "}
          <em>single</em> path: <code>svg.append(&quot;path&quot;).datum(data).attr(&quot;d&quot;, line)</code>.
          Using <code>.data(data)</code> would create one path per point — a very common beginner mistake.
        </p>
      </Callout>

      <h2>Curves</h2>
      <p>
        A <strong>curve</strong> decides how consecutive points are connected. The default,{" "}
        <code>d3.curveLinear</code>, draws straight segments. Others interpolate smoothly, step, or approximate.
        Choosing a curve is not just aesthetics — some curves <em>overshoot</em> (they invent values above the max or
        below the min), some don&apos;t pass through the points at all, and step curves are the honest choice for
        values that change discretely (prices, counts per period).
      </p>
      <ul>
        <li>
          <strong>curveLinear</strong> — straight segments; always correct, never lies.
        </li>
        <li>
          <strong>curveStep / curveStepBefore / curveStepAfter</strong> — piecewise constant; the change happens at
          the midpoint, before, or after each point.
        </li>
        <li>
          <strong>curveBasis</strong> — a B-spline; very smooth but does <em>not</em> pass through interior points.
        </li>
        <li>
          <strong>curveCardinal</strong> — passes through every point; <code>.tension(t)</code> from 0 (loose) to 1
          (equivalent to linear).
        </li>
        <li>
          <strong>curveCatmullRom</strong> — like cardinal but with <code>.alpha(a)</code> parameterization; 0.5
          (centripetal, the default) avoids loops and cusps.
        </li>
        <li>
          <strong>curveMonotoneX</strong> — smooth and passes through points, but preserves monotonicity so it never
          overshoots. The best default for smooth time series.
        </li>
        <li>
          <strong>curveNatural</strong> — a natural cubic spline; smooth, but can overshoot noticeably.
        </li>
        <li>
          <strong>curveBundle</strong> — a straightened B-spline with <code>.beta(b)</code>; used for edge bundling.
          Only works with <code>d3.line</code>, not areas.
        </li>
      </ul>
      <Playground
        title="Interactive curve gallery"
        code={`
const W = 640, H = 300, m = { top: 20, right: 20, bottom: 30, left: 36 };
const data = [3, 8, 6, 7, 2, 2.5, 9, 4, 5, 1, 6, 7.5].map((v, i) => ({ i, v }));

const x = d3.scaleLinear().domain([0, data.length - 1]).range([m.left, W - m.right]);
const y = d3.scaleLinear().domain([0, 10]).range([H - m.bottom, m.top]);

const curves = {
  curveLinear:     [d3.curveLinear],
  curveStep:       [d3.curveStep],
  curveStepBefore: [d3.curveStepBefore],
  curveStepAfter:  [d3.curveStepAfter],
  curveBasis:      [d3.curveBasis],
  curveCardinal:   [d3.curveCardinal, "tension", 0],
  curveCatmullRom: [d3.curveCatmullRom, "alpha", 0.5],
  curveMonotoneX:  [d3.curveMonotoneX],
  curveNatural:    [d3.curveNatural],
  curveBundle:     [d3.curveBundle, "beta", 0.85],
};

// --- controls (plain HTML built with d3) ---
const controls = d3.select(el).append("div")
    .style("display", "flex").style("gap", "12px").style("align-items", "center")
    .style("font", "13px sans-serif").style("margin-bottom", "6px");
const select = controls.append("select").style("padding", "2px 4px");
select.selectAll("option").data(Object.keys(curves)).join("option").text(k => k);
select.property("value", "curveMonotoneX");
const paramLabel = controls.append("label");
const slider = paramLabel.append("input").attr("type", "range")
    .attr("min", 0).attr("max", 1).attr("step", 0.05);
const paramText = paramLabel.append("span").style("margin-left", "6px");

// --- chart ---
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x).ticks(12));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y).ticks(5));

// shaded region = where a curve would be "lying" about the data range
svg.append("rect").attr("x", m.left).attr("width", W - m.left - m.right)
    .attr("y", y(10)).attr("height", y(9) - y(10)).attr("fill", "#fff5f5");
svg.append("rect").attr("x", m.left).attr("width", W - m.left - m.right)
    .attr("y", y(1)).attr("height", y(0) - y(1)).attr("fill", "#fff5f5");

svg.append("path").attr("fill", "none").attr("stroke", "#dee2e6")
    .attr("d", d3.line(d => x(d.i), d => y(d.v))(data));
const path = svg.append("path").attr("fill", "none")
    .attr("stroke", "steelblue").attr("stroke-width", 2.5);
svg.selectAll("circle").data(data).join("circle")
    .attr("cx", d => x(d.i)).attr("cy", d => y(d.v)).attr("r", 3.5).attr("fill", "#e8590c");

function update(resetParam) {
  const [curve, param, def] = curves[select.property("value")];
  paramLabel.style("visibility", param ? "visible" : "hidden");
  if (resetParam && param) slider.property("value", def);
  let c = curve;
  if (param) {
    const v = +slider.property("value");
    c = curve[param](v);            // e.g. d3.curveCardinal.tension(0.3)
    paramText.text(param + " = " + v);
  }
  path.attr("d", d3.line(d => x(d.i), d => y(d.v)).curve(c)(data));
}
select.on("change", () => update(true));
slider.on("input", () => update(false));
update(true);
`}
      />

      <h2>d3.area: filling between two lines</h2>
      <p>
        An area is defined by a <strong>top line</strong> and a <strong>baseline</strong>. You give it one x
        accessor and two y accessors: <code>y1</code> (top) and <code>y0</code> (bottom). For a classic area chart,{" "}
        <code>y0</code> is a constant — the pixel position of zero. When <code>y0</code> is a function too, you get a{" "}
        <strong>band</strong>, perfect for ranges such as min/max temperature or confidence intervals. (There are
        also <code>x0</code>/<code>x1</code> for vertical areas, and <code>area.lineY1()</code> etc. to derive a
        matching line generator for the edge.)
      </p>
      <Playground
        title="Area band with a mean line"
        code={`
const W = 640, H = 300, m = { top: 20, right: 20, bottom: 30, left: 40 };

// A synthetic year of daily temperatures (deterministic random)
const rnd = d3.randomNormal.source(d3.randomLcg(7))(0, 1);
const days = d3.timeDay.range(new Date(2024, 0, 1), new Date(2025, 0, 1));
let drift = 0, sdrift = 0;
const data = days.map((date, i) => {
  drift = drift * 0.95 + rnd() * 0.5;
  sdrift = sdrift * 0.9 + rnd() * 0.3;
  const avg = 16 + 9 * Math.cos((i / 366) * 2 * Math.PI) + drift;
  const spread = 5 + sdrift;
  return { date, avg, min: avg - spread, max: avg + spread };
});

const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([m.left, W - m.right]);
const y = d3.scaleLinear()
    .domain([d3.min(data, d => d.min) - 2, d3.max(data, d => d.max) + 2]).nice()
    .range([H - m.bottom, m.top]);

const band = d3.area()
    .x(d => x(d.date))
    .y0(d => y(d.min))      // bottom edge
    .y1(d => y(d.max))      // top edge
    .curve(d3.curveMonotoneX);

const mean = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.avg))
    .curve(d3.curveMonotoneX);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b")));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).ticks(6).tickFormat(d => d + "°"))
    .call(g => g.selectAll(".tick line").clone()
        .attr("x2", W - m.left - m.right).attr("stroke-opacity", 0.08));

svg.append("path").datum(data).attr("d", band).attr("fill", "#a5d8ff").attr("fill-opacity", 0.7);
svg.append("path").datum(data).attr("d", mean)
    .attr("fill", "none").attr("stroke", "#1864ab").attr("stroke-width", 1.5);

svg.append("text").attr("x", m.left + 6).attr("y", m.top + 4)
    .attr("font-size", 12).attr("font-family", "sans-serif").attr("fill", "#495057")
    .text("Daily min–max range (band) and mean (line), °C");
`}
      />

      <h2>Gaps with defined()</h2>
      <p>
        Real data has holes: a sensor went offline, a value is <code>null</code>. If you just filter out missing
        values, the line silently interpolates across the gap and implies data you do not have.{" "}
        <code>line.defined(fn)</code> tells the generator which points exist; wherever it returns{" "}
        <code>false</code> the path is broken into separate segments (a new <code>M</code> command). A nice touch is
        to draw a faint dashed line <em>under</em> it using the filtered data, so readers see the gap and the trend.
      </p>
      <Playground
        title="Missing data"
        code={`
const W = 640, H = 240, m = { top: 20, right: 20, bottom: 30, left: 40 };
const rng = d3.randomLcg(3);
const data = d3.range(60).map(i => ({
  i,
  value: (i > 14 && i < 21) || (i > 38 && i < 42) || i === 50
    ? null
    : 50 + 25 * Math.sin(i / 7) + (rng() - 0.5) * 12,
}));

const x = d3.scaleLinear().domain([0, 59]).range([m.left, W - m.right]);
const y = d3.scaleLinear().domain([0, 100]).range([H - m.bottom, m.top]);

const line = d3.line()
    .defined(d => d.value != null)   // break the line where value is missing
    .x(d => x(d.i))
    .y(d => y(d.value));

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y).ticks(5));

// 1. dashed "bridge" using only the defined points
svg.append("path")
    .attr("d", line(data.filter(line.defined())))
    .attr("fill", "none").attr("stroke", "#ced4da").attr("stroke-dasharray", "3 3");

// 2. the real line, with gaps
svg.append("path")
    .attr("d", line(data))
    .attr("fill", "none").attr("stroke", "#c2255c").attr("stroke-width", 2);

log("segments (M commands):", (line(data).match(/M/g) || []).length);
`}
      />
      <Callout type="warning">
        <p>
          A lone defined point surrounded by undefined ones produces a zero-length segment — invisible with a plain
          stroke. Add <code>stroke-linecap=&quot;round&quot;</code> or draw dots for isolated values. Also note{" "}
          <code>d.value != null</code> (loose) catches both <code>null</code> and <code>undefined</code>, and{" "}
          <code>!isNaN(d.value)</code> is needed if your parser produced <code>NaN</code>.
        </p>
      </Callout>

      <h2>Multiple series</h2>
      <p>
        For several lines, group your tidy data by series (<code>d3.group</code>) and bind the <em>groups</em>: one
        path per series, each receiving its own array. The same line generator draws them all. Below, the pointer
        finds the nearest data point across all series (using <code>d3.pointer</code> and{" "}
        <code>d3.least</code>) and highlights that line.
      </p>
      <Playground
        title="Multi-series lines with hover"
        code={`
const W = 640, H = 320, m = { top: 20, right: 90, bottom: 30, left: 40 };
const months = d3.range(12).map(i => new Date(2024, i, 1));
const cities = {
  "São Paulo": [23, 23, 22, 21, 18, 17, 17, 18, 19, 20, 21, 22],
  "Lisbon":    [11, 12, 14, 15, 18, 21, 23, 24, 22, 18, 14, 12],
  "Toronto":   [-6, -5, 0, 7, 14, 19, 22, 21, 17, 10, 4, -2],
  "Sydney":    [23, 23, 22, 19, 16, 13, 12, 13, 16, 18, 20, 22],
};
// tidy rows: { city, date, temp }
const data = Object.entries(cities).flatMap(([city, temps]) =>
  temps.map((temp, i) => ({ city, date: months[i], temp })));
const series = d3.group(data, d => d.city);

const x = d3.scaleUtc().domain(d3.extent(months)).range([m.left, W - m.right]);
const y = d3.scaleLinear().domain(d3.extent(data, d => d.temp)).nice().range([H - m.bottom, m.top]);
const color = d3.scaleOrdinal(series.keys(), d3.schemeTableau10);
const line = d3.line(d => x(d.date), d => y(d.temp)).curve(d3.curveMonotoneX);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).ticks(12).tickFormat(d3.utcFormat("%b")));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).tickFormat(d => d + "°"));

const paths = svg.append("g").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path")
  .data(series)                     // each datum is [city, rows]
  .join("path")
    .attr("stroke", ([city]) => color(city))
    .attr("d", ([, rows]) => line(rows));

// end labels, nudged apart so they don't overlap
const labels = Array.from(series, ([city, rows]) => ({ city, y: y(rows.at(-1).temp) }))
  .sort((a, b) => a.y - b.y);
for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 13);
svg.append("g").selectAll("text").data(labels).join("text")
    .attr("x", W - m.right + 6)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("fill", d => color(d.city))
    .text(d => d.city);

const dot = svg.append("g").attr("display", "none");
dot.append("circle").attr("r", 4);
dot.append("text").attr("text-anchor", "middle").attr("y", -10).attr("font-weight", "bold");

svg.append("rect").attr("width", W).attr("height", H).attr("fill", "transparent")
  .on("pointermove", (event) => {
    const [px, py] = d3.pointer(event);
    const p = d3.least(data, d => Math.hypot(x(d.date) - px, y(d.temp) - py));
    paths.attr("stroke-opacity", ([city]) => city === p.city ? 1 : 0.15);
    dot.attr("display", null).attr("transform", \`translate(\${x(p.date)},\${y(p.temp)})\`);
    dot.select("circle").attr("fill", color(p.city));
    dot.select("text").text(p.city + ": " + p.temp + "°");
  })
  .on("pointerleave", () => {
    paths.attr("stroke-opacity", 1);
    dot.attr("display", "none");
  });
`}
      />

      <h2>Radial lines and areas</h2>
      <p>
        <code>d3.lineRadial()</code> and <code>d3.areaRadial()</code> are the polar versions: instead of x and y
        they take an <code>angle</code> (radians, clockwise from 12 o&apos;clock) and a <code>radius</code> (or{" "}
        <code>innerRadius</code>/<code>outerRadius</code> for areas). The path is centered on the origin, so
        translate a group to where you want the center.
      </p>
      <Playground
        title="Radial temperature chart"
        code={`
const W = 640, H = 420, inner = 70, outer = 200;
const rnd = d3.randomNormal.source(d3.randomLcg(11))(0, 1);
let drift = 0;
const data = d3.range(365).map(i => {
  drift = drift * 0.9 + rnd() * 0.8;
  const avg = 14 - 9 * Math.cos((i / 365) * 2 * Math.PI) + drift;
  return { i, min: avg - 4 - Math.abs(rnd()) * 2, max: avg + 4 + Math.abs(rnd()) * 2, avg };
});
data.push({ ...data[0], i: 365 });      // close the loop

const angle = d3.scaleLinear().domain([0, 365]).range([0, 2 * Math.PI]);
const r = d3.scaleLinear()
    .domain([d3.min(data, d => d.min), d3.max(data, d => d.max)]).nice()
    .range([inner, outer]);

const area = d3.areaRadial()
    .angle(d => angle(d.i))
    .innerRadius(d => r(d.min))
    .outerRadius(d => r(d.max))
    .curve(d3.curveCardinal);
const line = d3.lineRadial()
    .angle(d => angle(d.i))
    .radius(d => r(d.avg))
    .curve(d3.curveCardinal);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "10px sans-serif");
const g = svg.append("g").attr("transform", \`translate(\${W / 2},\${H / 2})\`);

// radial grid
const grid = g.append("g").selectAll("g").data(r.ticks(5)).join("g");
grid.append("circle").attr("r", r).attr("fill", "none").attr("stroke", "#e9ecef");
grid.append("text").attr("y", d => -r(d)).attr("dy", "-0.3em").attr("fill", "#868e96")
    .attr("text-anchor", "middle").text(d => d + "°");

// month labels
const months = d3.timeMonths(new Date(2023, 0, 1), new Date(2024, 0, 1));
g.append("g").selectAll("text").data(months).join("text")
    .attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "#495057")
    .attr("transform", (d) => {
      const a = angle(d3.timeDay.count(months[0], d) + 15) - Math.PI / 2;
      return \`translate(\${Math.cos(a) * (outer + 18)},\${Math.sin(a) * (outer + 18)})\`;
    })
    .text(d3.timeFormat("%b"));

g.append("path").attr("d", area(data)).attr("fill", "#ffc9c9").attr("fill-opacity", 0.8);
g.append("path").attr("d", line(data)).attr("fill", "none").attr("stroke", "#c92a2a").attr("stroke-width", 1.2);
`}
      />

      <h2>d3.path and drawing to canvas</h2>
      <p>
        Under the hood, every shape generator writes to a <strong>context</strong> object with the same methods as
        the Canvas 2D API: <code>moveTo</code>, <code>lineTo</code>, <code>bezierCurveTo</code>, <code>arc</code>,{" "}
        <code>closePath</code>… By default that context is a <code>d3.path()</code>, which records the calls and
        serializes them to an SVG path string. That gives you two superpowers:
      </p>
      <ul>
        <li>
          Use <code>d3.path()</code> directly to author custom SVG shapes with a canvas-like API (no more
          hand-building <code>&quot;A rx ry …&quot;</code> arc strings).
        </li>
        <li>
          Call <code>line.context(ctx)</code> with a real canvas context and the generator <em>draws</em> instead of
          returning a string — ideal for tens of thousands of points where SVG gets slow.
        </li>
      </ul>
      <Playground
        title="d3.path and line.context(canvas)"
        code={`
// 1) d3.path: a canvas-style API that produces SVG path strings
const p = d3.path();
p.moveTo(20, 60);
p.lineTo(80, 60);
p.arc(110, 60, 30, Math.PI, 0);          // semicircle
p.quadraticCurveTo(170, 110, 200, 60);
p.closePath();
log("d3.path →", p.toString());

// d3.pathRound(digits) limits decimals for smaller strings
const pr = d3.pathRound(1);
pr.moveTo(0, 0); pr.lineTo(Math.PI, Math.E);
log("pathRound(1) →", pr.toString());

d3.select(el).append("svg").attr("viewBox", "0 0 640 120")
  .append("path").attr("d", p.toString())
    .attr("fill", "#d0ebff").attr("stroke", "#1971c2").attr("stroke-width", 2);

// 2) Same line generator, rendered to <canvas> via context()
const W = 640, H = 200, dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
    .attr("width", W * dpr).attr("height", H * dpr)
    .style("width", "100%").style("max-width", W + "px").node();
const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

// 5,000 random-walk points: cheap on canvas
const walk = d3.randomNormal.source(d3.randomLcg(1))(0, 1);
let v = 0;
const data = d3.range(5000).map(i => [i, (v += walk())]);
const x = d3.scaleLinear().domain([0, 4999]).range([10, W - 10]);
const y = d3.scaleLinear().domain(d3.extent(data, d => d[1])).range([H - 10, 10]);

const line = d3.line(d => x(d[0]), d => y(d[1])).context(ctx);
ctx.beginPath();        // you manage beginPath/stroke yourself
line(data);             // returns undefined — it drew into ctx
ctx.lineWidth = 0.8;
ctx.strokeStyle = "#5f3dc4";
ctx.stroke();
log("points drawn on canvas:", data.length);
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.line(x?, y?)", "Create a line generator; optionally pass x and y accessors directly."],
          ["line.x(fn) / line.y(fn)", "Accessors for the coordinates, called as (d, i, data)."],
          ["line.defined(fn)", "Return false for missing points to split the line into segments."],
          ["line.curve(curve)", "Interpolation between points (default d3.curveLinear)."],
          ["line.context(ctx)", "Render into a canvas context instead of returning a string (null = string)."],
          ["line.digits(n)", "Decimal precision of the output path string (default 3)."],
          ["d3.area(x?, y0?, y1?)", "Area generator; x0/x1 and y0/y1 define the two edges."],
          ["area.y0(v) / area.y1(fn)", "Baseline and topline. y0 may be a constant such as y(0)."],
          ["area.lineY1() / lineY0()…", "Derive a line generator for one edge of the area."],
          ["d3.lineRadial() / d3.areaRadial()", "Polar versions: angle + radius (or innerRadius/outerRadius)."],
          ["d3.curveLinear, curveStep*, curveBasis", "Straight, stepped and B-spline curves (plus Closed/Open variants)."],
          ["d3.curveCardinal.tension(t)", "Interpolating spline; tension 0..1."],
          ["d3.curveCatmullRom.alpha(a)", "Interpolating spline without cusps (alpha 0.5 = centripetal)."],
          ["d3.curveMonotoneX / curveMonotoneY", "Smooth, never overshoots in x (or y)."],
          ["d3.curveNatural", "Natural cubic spline."],
          ["d3.curveBundle.beta(b)", "Straightened B-spline for edge bundling (lines only)."],
          ["d3.path() / d3.pathRound(d)", "Canvas-like recorder that serializes to an SVG path string."],
        ]}
      />

      <Exercises
        items={[
          <>
            In the curve gallery, find which curves draw above 9 or below 1 (the pink zones) — i.e. which ones
            overshoot the data.
          </>,
          <>
            Turn the band chart into a classic area chart of the mean: use <code>y0(y(0))</code> — then fix the y
            domain so zero is included.
          </>,
          <>
            In the missing-data example, draw a circle for every <em>isolated</em> defined point (one whose neighbours
            are both missing).
          </>,
          <>
            Add a vertical rule and a tooltip listing all four cities&apos; temperatures for the hovered month in the
            multi-series chart (hint: use <code>d3.bisector</code> or round the x inversion).
          </>,
          <>
            Render the multi-series chart to canvas with <code>line.context(ctx)</code>, one{" "}
            <code>beginPath()</code>/<code>stroke()</code> per series.
          </>,
        ]}
      />
    </>
  );
}
