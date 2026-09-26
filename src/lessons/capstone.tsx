import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Time to put everything together. In this capstone we build a complete, production-quality chart from an empty
        <code> &lt;div&gt;</code>: a multi-series line chart of weekly downloads for four (fictional) JavaScript
        libraries over four years. Each step is a live playground that <em>extends</em> the previous one, so you can
        see exactly what every addition costs. By the end we have hover tooltips, an animated entrance, toggleable
        series, a focus + context brush, and a layout that re-renders when its container resizes.
      </p>
      <p>Here&apos;s the plan, and the lessons each step draws on:</p>
      <ApiTable
        rows={[
          ["1. Load & parse", "d3.csv with a row function, d3.utcParse, d3.group / d3.rollup, d3.extent (Fetching, Arrays)"],
          ["2. Scales & axes", "The margin convention, scaleUtc, scaleLinear, axisBottom/axisLeft, gridlines (Scales, Axes)"],
          ["3. Lines & legend", "d3.line + curves, d3.groups, scaleOrdinal colors, a data-joined legend (Shapes, Data join)"],
          ["4. Hover", "d3.pointer, d3.bisector, an HTML tooltip (Events, Arrays)"],
          ["5. Entrance", "stroke-dasharray + transitions with staggered delays (Transitions)"],
          ["6. Toggle series", "Legend clicks, recomputed domains, axis and line transitions (Events, Transitions)"],
          ["7. Brush on x", "Focus + context with d3.brushX, clip paths (Brushing)"],
          ["8. Final", "Everything together + ResizeObserver for true responsiveness"],
        ]}
      />

      <h2>Step 1: Load and parse the data</h2>
      <p>
        The data lives in <code>/data/capstone-downloads.csv</code> in &quot;long&quot; (tidy) format — one row per
        library per week:
      </p>
      <CodeBlock>{`
date,library,downloads
2022-01-09,Atlas,433
2022-01-16,Atlas,434
…
`}</CodeBlock>
      <p>
        CSV values are always strings, so we pass a <strong>row conversion function</strong> to <code>d3.csv</code>{" "}
        that parses dates with <code>d3.utcParse</code> and numbers with the unary <code>+</code>. Then we explore:
        how many rows, what date range, and a per-library summary with <code>d3.rollup</code>. Always look at your data
        before charting it.
      </p>
      <Playground
        title="Step 1 · load, parse, summarize"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date),
  library: d.library,
  downloads: +d.downloads,          // thousands of downloads per week
}));

log("rows:", data.length);
log("first row:", data[0]);
log("date range:", d3.extent(data, (d) => d.date).map(d3.utcFormat("%Y-%m-%d")));

// Group into series: Map { "Atlas" => [...], "Borealis" => [...], ... }
const byLibrary = d3.group(data, (d) => d.library);
log("libraries:", [...byLibrary.keys()]);

// Summary statistics per library
const summary = d3.rollup(
  data,
  (v) => ({
    weeks: v.length,
    first: v[0].downloads,
    last: v[v.length - 1].downloads,
    mean: d3.mean(v, (d) => d.downloads),
    max: d3.max(v, (d) => d.downloads),
  }),
  (d) => d.library
);

// Render the summary as a small HTML table
const fmt = d3.format(",.0f");
const table = d3.select(el).append("table")
  .style("border-collapse", "collapse").style("font-size", "13px").style("min-width", "420px");
table.append("thead").append("tr").selectAll("th")
  .data(["library", "weeks", "first", "last", "mean", "max", "change"])
  .join("th").text((d) => d)
  .style("text-align", (d, i) => (i ? "right" : "left")).style("padding", "4px 10px")
  .style("border-bottom", "2px solid #dee2e6");
table.append("tbody").selectAll("tr")
  .data([...summary])
  .join("tr")
  .selectAll("td")
  .data(([name, s]) => [name, s.weeks, fmt(s.first), fmt(s.last), fmt(s.mean), fmt(s.max),
    d3.format("+.0%")(s.last / s.first - 1)])
  .join("td").text((d) => d)
  .style("text-align", (d, i) => (i ? "right" : "left")).style("padding", "4px 10px")
  .style("border-bottom", "1px solid #f1f3f5")
  .style("font-variant-numeric", "tabular-nums")
  .style("color", (d, i) => (i === 6 ? (String(d).startsWith("-") ? "#e03131" : "#2f9e44") : null));
`}
      />
      <Callout type="tip" title="UTC or local time?">
        <p>
          Dates like <code>2022-01-09</code> have no time zone. Parsing them as UTC (<code>d3.utcParse</code>) and
          pairing that with <code>d3.scaleUtc</code> and <code>d3.utcFormat</code> means every viewer sees the same
          ticks regardless of their location. Mixing UTC parsing with a local-time scale is a classic source of
          off-by-one-day bugs.
        </p>
      </Callout>

      <h2>Step 2: Scales, axes and the margin convention</h2>
      <p>
        The <strong>margin convention</strong> reserves space around the plot for axes and labels: define{" "}
        <code>margin = {"{"} top, right, bottom, left {"}"}</code> and set each scale&apos;s range to the inner area.
        The dashed rectangle below shows that inner plot area. The width comes from the playground&apos;s{" "}
        <code>width</code> variable, so the chart fills its container; we derive the number of x ticks from the width
        too. Gridlines are just the y axis ticks extended across the plot with <code>tickSize</code>.
      </p>
      <Playground
        title="Step 2 · scales, axes, gridlines"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));

const W = Math.max(480, width - 24), H = 380;
const margin = { top: 44, right: 20, bottom: 30, left: 48 };

const x = d3.scaleUtc()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin.left, W - margin.right]);
const y = d3.scaleLinear()
    .domain([0, d3.max(data, (d) => d.downloads)]).nice()
    .range([H - margin.bottom, margin.top]);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");

// Visualize the margin convention
svg.append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", W - margin.left - margin.right).attr("height", H - margin.top - margin.bottom)
    .attr("fill", "#fff4e6").attr("stroke", "#e8590c").attr("stroke-dasharray", "4 4");
svg.append("text").attr("x", W - margin.right - 8).attr("y", margin.top + 18)
    .attr("text-anchor", "end").attr("fill", "#e8590c").text("plot area (inside the margins)");

// x axis
svg.append("g")
    .attr("transform", "translate(0," + (H - margin.bottom) + ")")
    .call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));

// y axis with gridlines and a label
svg.append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right)))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0.12))
    .call((g) => g.append("text")
        .attr("x", -margin.left).attr("y", margin.top - 26)
        .attr("fill", "currentColor").attr("text-anchor", "start").attr("font-weight", 600)
        .text("↑ Weekly downloads (thousands)"));
`}
      />

      <h2>Step 3: Lines and a color legend</h2>
      <p>
        <code>d3.groups</code> turns the long-format rows into an array of <code>[name, values]</code> pairs — one per
        series — which we map to objects and data-join to <code>&lt;path&gt;</code> elements. Each path&apos;s{" "}
        <code>d</code> comes from a single <code>d3.line</code> generator. <code>curveMonotoneX</code> smooths the
        line without overshooting the data. The legend is another data join; each item is positioned after measuring
        the previous one with <code>getBBox()</code>.
      </p>
      <Playground
        title="Step 3 · lines + legend"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));

const W = Math.max(480, width - 24), H = 380;
const margin = { top: 44, right: 20, bottom: 30, left: 48 };
const x = d3.scaleUtc(d3.extent(data, (d) => d.date), [margin.left, W - margin.right]);
const y = d3.scaleLinear([0, d3.max(data, (d) => d.downloads)], [H - margin.bottom, margin.top]).nice();
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");
svg.append("g").attr("transform", "translate(0," + (H - margin.bottom) + ")")
    .call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));
svg.append("g").attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right)))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0.12));

const line = d3.line()
    .x((d) => x(d.date))
    .y((d) => y(d.downloads))
    .curve(d3.curveMonotoneX);

svg.append("g")
    .attr("fill", "none").attr("stroke-width", 2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
  .selectAll("path")
  .data(series)
  .join("path")
    .attr("stroke", (s) => color(s.name))
    .attr("d", (s) => line(s.values));

// Legend
const legend = svg.append("g").attr("transform", "translate(" + margin.left + ",16)");
const items = legend.selectAll("g").data(series).join("g");
items.append("rect").attr("y", -9).attr("width", 12).attr("height", 12).attr("rx", 3).attr("fill", (s) => color(s.name));
items.append("text").attr("x", 17).attr("dy", "0.1em").text((s) => s.name);
let offset = 0;
items.attr("transform", function () {
  const t = "translate(" + offset + ",0)";
  offset += this.getBBox().width + 20;
  return t;
});
log("series:", series.map((s) => s.name + " (" + s.values.length + " pts)"));
`}
      />

      <h2>Step 4: Hover crosshair and tooltip</h2>
      <p>
        All series share the same weekly dates, so on <code>pointermove</code> we convert the pointer&apos;s x back to
        a date with <code>x.invert</code>, snap to the nearest week with <code>d3.bisector(...).center</code>, and
        read every series at that index. The crosshair and dots are SVG; the tooltip is an absolutely positioned HTML{" "}
        <code>&lt;div&gt;</code>, which is easier to style and wraps text naturally. We position it with{" "}
        <code>d3.pointer(event, el)</code> — pointer coordinates relative to the container.
      </p>
      <Playground
        title="Step 4 · bisector hover + tooltip"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));
const dates = series[0].values.map((d) => d.date);

const W = Math.max(480, width - 24), H = 380;
const margin = { top: 44, right: 20, bottom: 30, left: 48 };
const x = d3.scaleUtc(d3.extent(dates), [margin.left, W - margin.right]);
const y = d3.scaleLinear([0, d3.max(data, (d) => d.downloads)], [H - margin.bottom, margin.top]).nice();
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);
const line = d3.line((d) => x(d.date), (d) => y(d.downloads)).curve(d3.curveMonotoneX);

el.style.position = "relative";
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");
svg.append("g").attr("transform", "translate(0," + (H - margin.bottom) + ")")
    .call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));
svg.append("g").attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right)))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0.12));
const paths = svg.append("g").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path").data(series).join("path")
    .attr("stroke", (s) => color(s.name)).attr("d", (s) => line(s.values));

const legend = svg.append("g").attr("transform", "translate(" + margin.left + ",16)");
const items = legend.selectAll("g").data(series).join("g");
items.append("rect").attr("y", -9).attr("width", 12).attr("height", 12).attr("rx", 3).attr("fill", (s) => color(s.name));
items.append("text").attr("x", 17).attr("dy", "0.1em").text((s) => s.name);
let offset = 0;
items.attr("transform", function () { const t = "translate(" + offset + ",0)"; offset += this.getBBox().width + 20; return t; });

// --- NEW: crosshair, dots, tooltip ---
const bisect = d3.bisector((d) => d).center;
const fmtDate = d3.utcFormat("%b %d, %Y");
const focus = svg.append("g").attr("display", "none").attr("pointer-events", "none");
const rule = focus.append("line").attr("y1", margin.top).attr("y2", H - margin.bottom).attr("stroke", "#868e96").attr("stroke-dasharray", "3 3");
const dots = focus.selectAll("circle").data(series).join("circle")
    .attr("r", 4.5).attr("fill", (s) => color(s.name)).attr("stroke", "white").attr("stroke-width", 2);

const tip = d3.select(el).append("div")
    .style("position", "absolute").style("pointer-events", "none").style("opacity", 0)
    .style("background", "white").style("border", "1px solid #e9ecef").style("border-radius", "8px")
    .style("box-shadow", "0 6px 18px rgba(0,0,0,.12)").style("padding", "8px 10px")
    .style("font-size", "12px").style("min-width", "150px").style("transition", "opacity 120ms");

svg.append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", W - margin.left - margin.right).attr("height", H - margin.top - margin.bottom)
    .attr("fill", "transparent")
  .on("pointermove", (event) => {
    const i = bisect(dates, x.invert(d3.pointer(event)[0]));
    const date = dates[i];
    focus.attr("display", null);
    rule.attr("x1", x(date)).attr("x2", x(date));
    dots.attr("cx", x(date)).attr("cy", (s) => y(s.values[i].downloads));

    const rows = d3.sort(series, (s) => -s.values[i].downloads);
    tip.html("<div style='font-weight:700;margin-bottom:4px'>" + fmtDate(date) + "</div>" +
      rows.map((s) => "<div style='display:flex;gap:8px;align-items:center'>" +
        "<span style='width:10px;height:10px;border-radius:2px;background:" + color(s.name) + "'></span>" +
        "<span style='flex:1'>" + s.name + "</span><b style='font-variant-numeric:tabular-nums'>" +
        d3.format(",")(s.values[i].downloads) + "k</b></div>").join(""));
    const [px, py] = d3.pointer(event, el);
    const tw = tip.node().offsetWidth;
    tip.style("opacity", 1)
      .style("left", (px + 16 + tw > el.clientWidth ? px - tw - 16 : px + 16) + "px")
      .style("top", Math.max(0, py - 40) + "px");
  })
  .on("pointerleave", () => { focus.attr("display", "none"); tip.style("opacity", 0); });
`}
      />
      <Callout type="note">
        <p>
          If your series had <em>different</em> dates (or missing weeks), you&apos;d bisect each series separately:{" "}
          <code>s.values[bisectDate(s.values, date)]</code> with <code>d3.bisector(d =&gt; d.date).center</code>. And
          for gaps, use <code>line.defined(d =&gt; !isNaN(d.downloads))</code> so the line breaks instead of
          interpolating across missing data.
        </p>
      </Callout>

      <h2>Step 5: An animated entrance</h2>
      <p>
        The classic line-drawing effect uses two SVG stroke properties. Set <code>stroke-dasharray</code> to{" "}
        <code>&quot;L L&quot;</code> (one dash as long as the whole path, one gap just as long) and{" "}
        <code>stroke-dashoffset</code> to <code>L</code> so the gap covers the line; then transition the offset to 0.{" "}
        <code>path.getTotalLength()</code> gives <code>L</code>. A staggered <code>delay</code> draws the series one
        after another, and removing the dash array on <code>end</code> keeps later updates clean.
      </p>
      <Playground
        title="Step 5 · stroke-dasharray entrance"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));

const W = Math.max(480, width - 24), H = 380;
const margin = { top: 44, right: 64, bottom: 30, left: 48 };
const x = d3.scaleUtc(d3.extent(data, (d) => d.date), [margin.left, W - margin.right]);
const y = d3.scaleLinear([0, d3.max(data, (d) => d.downloads)], [H - margin.bottom, margin.top]).nice();
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);
const line = d3.line((d) => x(d.date), (d) => y(d.downloads)).curve(d3.curveMonotoneX);

d3.select(el).append("button").text("↻ Replay").on("click", play)
  .style("padding", "2px 10px").style("border", "1px solid #ccc").style("border-radius", "6px").style("font-size", "12px");
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");
const gx = svg.append("g").attr("transform", "translate(0," + (H - margin.bottom) + ")")
    .call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));
const gy = svg.append("g").attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right)))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").attr("stroke-opacity", 0.12));
const paths = svg.append("g").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path").data(series).join("path")
    .attr("stroke", (s) => color(s.name)).attr("d", (s) => line(s.values));

// Direct labels at the end of each line (fade in after the line arrives)
const labels = svg.append("g").selectAll("text").data(series).join("text")
    .attr("x", W - margin.right + 6)
    .attr("y", (s) => y(s.values[s.values.length - 1].downloads))
    .attr("dy", "0.35em").attr("fill", (s) => color(s.name)).attr("font-weight", 700)
    .text((s) => s.name);

function play() {
  gy.attr("opacity", 0).transition().duration(600).attr("opacity", 1);
  gx.attr("opacity", 0).transition().duration(600).attr("opacity", 1);
  paths
      .interrupt()
      .attr("stroke-dasharray", function () { const L = this.getTotalLength(); return L + " " + L; })
      .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
    .transition()
      .delay((s, i) => 300 + i * 350)
      .duration(1800)
      .ease(d3.easeCubicInOut)
      .attr("stroke-dashoffset", 0)
      .on("end", function () { d3.select(this).attr("stroke-dasharray", null); });
  labels
      .interrupt().attr("opacity", 0)
    .transition()
      .delay((s, i) => 300 + i * 350 + 1700)
      .duration(400)
      .attr("opacity", 1);
}
play();
`}
      />

      <h2>Step 6: Toggle series from the legend</h2>
      <p>
        Now the legend becomes interactive. A <code>Set</code> of hidden names is the only state. On every click we
        recompute the y domain from the <em>visible</em> series, then run one shared transition that rescales the
        axis, reshapes every line and fades hidden ones out. Because every path keeps the same number of points, D3
        can interpolate the <code>d</code> attribute smoothly. Try hiding Atlas and Cirrus to see the smaller series
        expand to fill the chart.
      </p>
      <Playground
        title="Step 6 · clickable legend with transitions"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));

const W = Math.max(480, width - 24), H = 380;
const margin = { top: 44, right: 20, bottom: 30, left: 48 };
const x = d3.scaleUtc(d3.extent(data, (d) => d.date), [margin.left, W - margin.right]);
const y = d3.scaleLinear().range([H - margin.bottom, margin.top]);
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);
const line = d3.line((d) => x(d.date), (d) => y(d.downloads)).curve(d3.curveMonotoneX);
const hidden = new Set();

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");
// CSS styles survive axis re-renders (unlike one-off .attr calls on ticks)
svg.append("style").text(".cap6-grid .domain{display:none} .cap6-grid .tick line{stroke-opacity:.12}");
svg.append("g").attr("transform", "translate(0," + (H - margin.bottom) + ")")
    .call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));
const gy = svg.append("g").attr("class", "cap6-grid").attr("transform", "translate(" + margin.left + ",0)");
const yAxis = d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right));
const paths = svg.append("g").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path").data(series).join("path").attr("stroke", (s) => color(s.name));

const legend = svg.append("g").attr("transform", "translate(" + margin.left + ",16)").style("cursor", "pointer");
const items = legend.selectAll("g").data(series).join("g");
items.append("rect").attr("y", -9).attr("width", 12).attr("height", 12).attr("rx", 3)
    .attr("stroke", (s) => color(s.name)).attr("stroke-width", 1.5);
items.append("text").attr("x", 17).attr("dy", "0.1em").text((s) => s.name);
let offset = 0;
items.attr("transform", function () { const t = "translate(" + offset + ",0)"; offset += this.getBBox().width + 20; return t; });
legend.append("text").attr("x", offset + 4).attr("dy", "0.1em").attr("fill", "#adb5bd").text("← click to toggle");

items.on("click", (event, s) => {
  if (hidden.has(s.name)) hidden.delete(s.name);
  else if (hidden.size < series.length - 1) hidden.add(s.name);   // keep at least one visible
  update(750);
});

function update(duration) {
  const visible = series.filter((s) => !hidden.has(s.name));
  y.domain([0, d3.max(visible, (s) => d3.max(s.values, (d) => d.downloads))]).nice();
  const t = svg.transition().duration(duration).ease(d3.easeCubicInOut);
  gy.transition(t).call(yAxis);
  paths.transition(t)
      .attr("d", (s) => line(s.values))
      .attr("opacity", (s) => (hidden.has(s.name) ? 0 : 1));
  items.select("rect").transition(t).attr("fill", (s) => (hidden.has(s.name) ? "white" : color(s.name)));
  items.select("text").transition(t).attr("fill", (s) => (hidden.has(s.name) ? "#adb5bd" : "currentColor"));
  log("visible:", visible.map((s) => s.name).join(", "), "· y max", y.domain()[1] + "k");
}
update(0);
`}
      />
      <Callout type="warning" title="One transition, many elements">
        <p>
          Creating the transition once (<code>const t = svg.transition()</code>) and passing it to{" "}
          <code>selection.transition(t)</code> keeps the axis, lines and legend perfectly in sync. Rapid clicks are
          safe: starting a new transition on an element interrupts the previous one of the same name, and it animates
          from wherever the element currently is.
        </p>
      </Callout>

      <h2>Step 7: Focus + context with a brush</h2>
      <p>
        Four years of weekly data is dense. The <strong>focus + context</strong> pattern adds a small overview chart
        (the context) below the main one (the focus). Brushing a range on the overview with <code>d3.brushX</code>{" "}
        sets the focus chart&apos;s x domain. We also rescale y to the visible window and clip the focus lines to the
        plot area with a <code>&lt;clipPath&gt;</code> so they don&apos;t spill over the axis. Drag the grey
        selection, resize its edges, or click outside it to reset to the full range.
      </p>
      <Playground
        title="Step 7 · brushable overview"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));
const dates = series[0].values.map((d) => d.date);

const W = Math.max(480, width - 24), H = 440;
const margin = { top: 24, right: 20, bottom: 30, left: 48 };
const ctxH = 60, gap = 52;
const mainBottom = H - margin.bottom - ctxH - gap;
const ctxTop = H - margin.bottom - ctxH, ctxBottom = H - margin.bottom;

const x = d3.scaleUtc(d3.extent(dates), [margin.left, W - margin.right]);
const x2 = x.copy();                                    // the context scale never changes
const y = d3.scaleLinear().range([mainBottom, margin.top]);
const y2 = d3.scaleLinear([0, d3.max(data, (d) => d.downloads)], [ctxBottom, ctxTop]).nice();
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);
const line = d3.line((d) => x(d.date), (d) => y(d.downloads)).curve(d3.curveMonotoneX);
const line2 = d3.line((d) => x2(d.date), (d) => y2(d.downloads)).curve(d3.curveMonotoneX);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).style("font-size", "12px");
svg.append("style").text(".cap7-grid .domain{display:none} .cap7-grid .tick line{stroke-opacity:.12}");
svg.append("clipPath").attr("id", "cap7-clip").append("rect")
    .attr("x", margin.left).attr("y", 0).attr("width", W - margin.left - margin.right).attr("height", mainBottom);

const gx = svg.append("g").attr("transform", "translate(0," + mainBottom + ")");
const gy = svg.append("g").attr("class", "cap7-grid").attr("transform", "translate(" + margin.left + ",0)");
const paths = svg.append("g").attr("clip-path", "url(#cap7-clip)").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path").data(series).join("path").attr("stroke", (s) => color(s.name));

// Context chart
const ctx = svg.append("g");
ctx.append("g").attr("fill", "none").attr("stroke-width", 1)
  .selectAll("path").data(series).join("path")
    .attr("stroke", (s) => color(s.name)).attr("d", (s) => line2(s.values));
ctx.append("g").attr("transform", "translate(0," + ctxBottom + ")")
    .call(d3.axisBottom(x2).ticks(W / 100).tickSizeOuter(0));
const label = svg.append("text").attr("x", margin.left).attr("y", ctxTop - 8).attr("fill", "#868e96");

function update() {
  const [x0, x1] = x.domain();
  const ymax = d3.max(series, (s) => d3.max(s.values, (d) => (d.date >= x0 && d.date <= x1 ? d.downloads : NaN)));
  y.domain([0, ymax]).nice();
  gx.call(d3.axisBottom(x).ticks(W / 110).tickSizeOuter(0));
  gy.call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "k").tickSize(-(W - margin.left - margin.right)));
  paths.attr("d", (s) => line(s.values));
  const f = d3.utcFormat("%b %Y");
  label.text("Showing " + f(x0) + " – " + f(x1) + " · drag on the overview below");
}

const brush = d3.brushX()
  .extent([[margin.left, ctxTop], [W - margin.right, ctxBottom]])
  .on("brush end", ({ selection }) => {
    x.domain(selection ? selection.map(x2.invert) : x2.domain());
    update();
  });

const last = dates[dates.length - 1];
ctx.append("g").call(brush).call(brush.move, [d3.utcYear.offset(last, -1), last].map(x2));
`}
      />

      <h2>Step 8: The final chart</h2>
      <p>
        Finally, everything together: parsed data, margin convention, lines, legend toggling, crosshair tooltip,
        animated entrance and focus + context brushing. Two structural changes make it production-ready:
      </p>
      <ul>
        <li>
          <strong>All drawing lives in a <code>render(width)</code> function</strong>, and a{" "}
          <code>ResizeObserver</code> calls it whenever the container&apos;s width changes. Unlike{" "}
          <code>viewBox</code> scaling, text stays the same size and the number of ticks adapts. Try resizing your
          browser window.
        </li>
        <li>
          <strong>State lives outside <code>render</code></strong> — the hidden set, the brushed range and whether the
          entrance has played — so a re-render after a resize preserves what the user did. The observer is
          disconnected in the returned cleanup function.
        </li>
      </ul>
      <Playground
        title="Step 8 · the complete interactive chart"
        code={`
const parse = d3.utcParse("%Y-%m-%d");
const data = await d3.csv("/data/capstone-downloads.csv", (d) => ({
  date: parse(d.date), library: d.library, downloads: +d.downloads,
}));
const series = d3.groups(data, (d) => d.library).map(([name, values]) => ({ name, values }));
const dates = series[0].values.map((d) => d.date);
const color = d3.scaleOrdinal(series.map((s) => s.name), ["#4269d0", "#efb118", "#ff725c", "#3ca951"]);
const bisect = d3.bisector((d) => d).center;
const fmtDate = d3.utcFormat("%b %d, %Y");
const fmtNum = d3.format(",");

// ---- state that survives re-renders ----
const hidden = new Set();
let focusDomain = [d3.utcYear.offset(dates[dates.length - 1], -2), dates[dates.length - 1]];
let played = false;

el.style.position = "relative";

function render(W) {
  d3.select(el).selectAll("*").interrupt().remove();
  const H = W < 560 ? 420 : 480;
  const margin = { top: 48, right: 20, bottom: 30, left: 48 };
  const ctxH = 56, gap = 34;
  const mainBottom = H - margin.bottom - ctxH - gap;
  const ctxTop = H - margin.bottom - ctxH, ctxBottom = H - margin.bottom;
  const innerW = W - margin.left - margin.right;

  const x = d3.scaleUtc(focusDomain, [margin.left, W - margin.right]);
  const x2 = d3.scaleUtc(d3.extent(dates), [margin.left, W - margin.right]);
  const y = d3.scaleLinear().range([mainBottom, margin.top]);
  const y2 = d3.scaleLinear([0, d3.max(data, (d) => d.downloads)], [ctxBottom, ctxTop]).nice();
  const line = d3.line((d) => x(d.date), (d) => y(d.downloads)).curve(d3.curveMonotoneX);
  const line2 = d3.line((d) => x2(d.date), (d) => y2(d.downloads)).curve(d3.curveMonotoneX);

  const svg = d3.select(el).append("svg")
      .attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H)
      .style("font-size", "12px").style("display", "block");
  svg.append("style").text(".cap8-grid .domain{display:none} .cap8-grid .tick line{stroke-opacity:.12}");
  svg.append("clipPath").attr("id", "cap8-clip").append("rect")
      .attr("x", margin.left).attr("y", 0).attr("width", innerW).attr("height", mainBottom);

  svg.append("text").attr("x", margin.left - 40).attr("y", margin.top - 14)
      .attr("font-weight", 600).attr("fill", "#495057").text("↑ Weekly downloads (thousands)");
  const gx = svg.append("g").attr("transform", "translate(0," + mainBottom + ")");
  const gy = svg.append("g").attr("class", "cap8-grid").attr("transform", "translate(" + margin.left + ",0)");
  const paths = svg.append("g").attr("clip-path", "url(#cap8-clip)")
      .attr("fill", "none").attr("stroke-width", 2.2).attr("stroke-linejoin", "round").attr("stroke-linecap", "round")
    .selectAll("path").data(series).join("path").attr("stroke", (s) => color(s.name));

  // ---- legend ----
  const legend = svg.append("g").attr("transform", "translate(" + (margin.left - 40) + ",14)").style("cursor", "pointer");
  const items = legend.selectAll("g").data(series).join("g");
  items.append("rect").attr("y", -9).attr("width", 12).attr("height", 12).attr("rx", 3)
      .attr("stroke", (s) => color(s.name)).attr("stroke-width", 1.5);
  items.append("text").attr("x", 17).attr("dy", "0.1em").text((s) => s.name);
  let offset = 0;
  items.attr("transform", function () { const t = "translate(" + offset + ",0)"; offset += this.getBBox().width + 18; return t; });
  items.on("click", (event, s) => {
    if (hidden.has(s.name)) hidden.delete(s.name);
    else if (hidden.size < series.length - 1) hidden.add(s.name);
    update(700);
  });

  // ---- context ----
  const ctx = svg.append("g");
  const ctxPaths = ctx.append("g").attr("fill", "none").attr("stroke-width", 1)
    .selectAll("path").data(series).join("path")
      .attr("stroke", (s) => color(s.name)).attr("d", (s) => line2(s.values));
  ctx.append("g").attr("transform", "translate(0," + ctxBottom + ")")
      .call(d3.axisBottom(x2).ticks(W / 110).tickSizeOuter(0));

  // ---- hover ----
  const focus = svg.append("g").attr("display", "none").attr("pointer-events", "none");
  const rule = focus.append("line").attr("y1", margin.top).attr("y2", mainBottom).attr("stroke", "#868e96").attr("stroke-dasharray", "3 3");
  const dots = focus.selectAll("circle").data(series).join("circle")
      .attr("r", 4.5).attr("fill", (s) => color(s.name)).attr("stroke", "white").attr("stroke-width", 2);
  const tip = d3.select(el).append("div")
      .style("position", "absolute").style("pointer-events", "none").style("opacity", 0)
      .style("background", "white").style("border", "1px solid #e9ecef").style("border-radius", "8px")
      .style("box-shadow", "0 6px 18px rgba(0,0,0,.12)").style("padding", "8px 10px")
      .style("font-size", "12px").style("min-width", "150px");

  svg.append("rect")
      .attr("x", margin.left).attr("y", margin.top).attr("width", innerW).attr("height", mainBottom - margin.top)
      .attr("fill", "transparent")
    .on("pointermove", (event) => {
      const [x0, x1] = x.domain();
      const i = bisect(dates, x.invert(d3.pointer(event)[0]));
      const date = dates[i];
      if (date < x0 || date > x1) return;
      const visible = series.filter((s) => !hidden.has(s.name));
      focus.attr("display", null);
      rule.attr("x1", x(date)).attr("x2", x(date));
      dots.attr("display", (s) => (hidden.has(s.name) ? "none" : null))
          .attr("cx", x(date)).attr("cy", (s) => y(s.values[i].downloads));
      tip.html("<div style='font-weight:700;margin-bottom:4px'>" + fmtDate(date) + "</div>" +
        d3.sort(visible, (s) => -s.values[i].downloads).map((s) =>
          "<div style='display:flex;gap:8px;align-items:center'>" +
          "<span style='width:10px;height:10px;border-radius:2px;background:" + color(s.name) + "'></span>" +
          "<span style='flex:1'>" + s.name + "</span><b style='font-variant-numeric:tabular-nums'>" +
          fmtNum(s.values[i].downloads) + "k</b></div>").join(""));
      const [px, py] = d3.pointer(event, el);
      const tw = tip.node().offsetWidth;
      tip.style("opacity", 1)
        .style("left", (px + 16 + tw > el.clientWidth ? px - tw - 16 : px + 16) + "px")
        .style("top", Math.max(0, py - 40) + "px");
    })
    .on("pointerleave", () => { focus.attr("display", "none"); tip.style("opacity", 0); });

  // ---- update: shared by brush (instant) and legend (animated) ----
  function update(duration) {
    const [x0, x1] = x.domain();
    const visible = series.filter((s) => !hidden.has(s.name));
    const ymax = d3.max(visible, (s) => d3.max(s.values, (d) => (d.date >= x0 && d.date <= x1 ? d.downloads : NaN)));
    y.domain([0, ymax || 1]).nice();
    const T = (sel) => (duration ? sel.transition().duration(duration).ease(d3.easeCubicInOut) : sel.interrupt());
    if (duration) paths.interrupt().attr("stroke-dasharray", null);   // cancel a running entrance
    T(gx).call(d3.axisBottom(x).ticks(W / 90).tickSizeOuter(0));
    T(gy).call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "k").tickSize(-innerW));
    T(paths).attr("d", (s) => line(s.values)).attr("opacity", (s) => (hidden.has(s.name) ? 0 : 1));
    ctxPaths.attr("opacity", (s) => (hidden.has(s.name) ? 0.15 : 1));
    items.select("rect").attr("fill", (s) => (hidden.has(s.name) ? "white" : color(s.name)));
    items.select("text").attr("fill", (s) => (hidden.has(s.name) ? "#adb5bd" : "currentColor"));
    focus.attr("display", "none");
  }

  // ---- brush ----
  const brush = d3.brushX()
    .extent([[margin.left, ctxTop], [W - margin.right, ctxBottom]])
    .on("brush end", ({ selection }) => {
      focusDomain = selection ? selection.map(x2.invert) : x2.domain();
      x.domain(focusDomain);
      update(0);
    });
  ctx.append("g").call(brush).call(brush.move, focusDomain.map(x2));

  // ---- entrance, only the first time ----
  if (!played) {
    played = true;
    paths
        .attr("stroke-dasharray", function () { const L = this.getTotalLength(); return L + " " + L; })
        .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
      .transition().delay((s, i) => i * 250).duration(1600).ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0)
        .on("end", function () { d3.select(this).attr("stroke-dasharray", null); });
  }
}

// ---- responsive: re-render when the container width changes ----
let lastWidth = 0;
const ro = new ResizeObserver(([entry]) => {
  const w = Math.max(360, Math.floor(entry.contentRect.width));
  if (w !== lastWidth) { lastWidth = w; render(w); }
});
ro.observe(el);
return () => ro.disconnect();
`}
      />
      <Callout type="tip" title="Checklist for your own charts">
        <p>
          Parse and inspect the data first · margin convention · scales from data extents with <code>nice()</code> ·
          axes with readable ticks and a unit label · a legend or direct labels · a tooltip that snaps to data ·
          transitions that explain change (not decoration) · state kept separate from rendering · cleanup for
          observers, timers and listeners.
        </p>
      </Callout>

      <h2>Where to go next</h2>
      <p>
        You&apos;ve now seen every major part of D3 — selections and joins, scales and axes, shapes and layouts,
        geography, interaction, animation, spatial algorithms — and combined them into a real chart. Some next steps:
      </p>
      <ul>
        <li>
          <a href="https://d3js.org" target="_blank" rel="noreferrer">d3js.org</a> — the official documentation, with
          API references for every module and an excellent &quot;What is D3?&quot; introduction.
        </li>
        <li>
          <a href="https://observablehq.com/@d3/gallery" target="_blank" rel="noreferrer">The D3 Gallery</a> — hundreds
          of forkable examples, from bar charts to force-directed graphs and map projections. Reading them is the
          fastest way to learn idioms.
        </li>
        <li>
          <a href="https://observablehq.com/plot/" target="_blank" rel="noreferrer">Observable Plot</a> — a
          higher-level library built on D3 by the same team. For exploratory analysis and standard charts, a one-line{" "}
          <code>Plot.lineY(data, {"{"}x: &quot;date&quot;, y: &quot;downloads&quot;, stroke: &quot;library&quot;{"}"})</code>{" "}
          replaces much of this lesson. Reach for raw D3 when you need bespoke interaction or visuals.
        </li>
        <li>
          <a href="https://observablehq.com" target="_blank" rel="noreferrer">observablehq.com</a> — reactive notebooks
          where D3 feels at home; great for prototyping before porting to an app.
        </li>
        <li>
          Revisit the <strong>D3 with React</strong> lesson and port this capstone to a React component: which parts
          become JSX, and which stay in an effect?
        </li>
      </ul>

      <Exercises
        items={[
          <>
            Replace the brush with <code>d3.zoom</code> on the focus chart (x only): use{" "}
            <code>transform.rescaleX(x2)</code> in the zoom handler, and keep the brush and zoom in sync so both work.
          </>,
          <>
            Add a &quot;normalize&quot; toggle that switches the y axis to percent change since the first visible week
            (<code>value / baseline - 1</code>) with a smooth transition.
          </>,
          <>
            Add keyboard accessibility: make legend items focusable (<code>tabindex=&quot;0&quot;</code>,{" "}
            <code>role=&quot;button&quot;</code>) and toggle them with Enter/Space; let the arrow keys move the
            crosshair week by week.
          </>,
          <>
            Annotate an event: draw a vertical marker and label at the week Cirrus overtakes Borealis (compute it from
            the data, don&apos;t hard-code it).
          </>,
          <>
            Swap the dataset for a real one (e.g. npm download counts from the npm API, or a CSV of your own) and make
            the chart handle a different number of series and missing weeks with <code>line.defined</code>.
          </>,
        ]}
      />
    </>
  );
}
