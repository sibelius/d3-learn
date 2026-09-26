import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Scales turn data into pixels; <strong>axes</strong> turn scales back into something humans can read. The{" "}
        <code>d3-axis</code> module renders a scale as a line with tick marks and labels. It works with every scale
        type that has <code>ticks</code> or a discrete domain — linear, log, time, band, point — and it&apos;s the
        textbook example of a reusable component applied with <code>selection.call</code>.
      </p>

      <h2>Creating an axis</h2>
      <p>
        There are four axis generators, named for where the ticks and labels point relative to the axis line:
      </p>
      <ul>
        <li>
          <code>d3.axisBottom(scale)</code> — horizontal, ticks below. The usual x axis.
        </li>
        <li>
          <code>d3.axisTop(scale)</code> — horizontal, ticks above.
        </li>
        <li>
          <code>d3.axisLeft(scale)</code> — vertical, ticks to the left. The usual y axis.
        </li>
        <li>
          <code>d3.axisRight(scale)</code> — vertical, ticks to the right.
        </li>
      </ul>
      <p>
        An axis is a function that takes a selection (usually a <code>&lt;g&gt;</code>) and renders into it. The axis
        is always drawn at the origin of its container, so you position it with a <code>transform</code> — for example,
        an x axis at the bottom of the chart is translated down by <code>height - margin.bottom</code>.
      </p>
      <CodeBlock>{`
svg.append("g")
    .attr("transform", \`translate(0,\${height - margin.bottom})\`)
    .call(d3.axisBottom(x));
`}</CodeBlock>
      <Playground
        title="The four orientations"
        code={`
const W = 640, H = 340, m = 60;
const x = d3.scaleLinear([0, 100], [m, W - m]);
const y = d3.scaleLinear([0, 1], [H - m, m]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

svg.append("rect").attr("x", m).attr("y", m).attr("width", W - 2 * m).attr("height", H - 2 * m)
  .attr("fill", "#f8f9fa");

svg.append("g").attr("transform", \`translate(0,\${H - m})\`).call(d3.axisBottom(x));
svg.append("g").attr("transform", \`translate(0,\${m})\`).call(d3.axisTop(x));
svg.append("g").attr("transform", \`translate(\${m},0)\`).call(d3.axisLeft(y));
svg.append("g").attr("transform", \`translate(\${W - m},0)\`).call(d3.axisRight(y).tickFormat(d3.format(".0%")));

svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle").attr("fill", "#868e96")
  .text("axisTop · axisRight · axisBottom · axisLeft");

// What did the axis generate? Inspect the DOM:
const g = svg.select("g");
log("classes:", g.selectAll("*").nodes().slice(0, 4).map(n => n.nodeName + (n.getAttribute("class") ? "." + n.getAttribute("class") : "")));
log("tick count:", g.selectAll(".tick").size());
`}
      />
      <p>
        The generated structure is simple and fully styleable: a <code>path.domain</code> for the axis line, and a{" "}
        <code>g.tick</code> per tick containing a <code>line</code> and a <code>text</code>. The container{" "}
        <code>g</code> gets default <code>font-size</code>, <code>font-family</code> and{" "}
        <code>fill=&quot;none&quot;</code>; lines and text use <code>currentColor</code>, so setting the CSS{" "}
        <code>color</code> on the axis recolors everything.
      </p>

      <h2>Controlling ticks</h2>
      <p>
        By default an axis asks the scale for about 10 ticks via <code>scale.ticks()</code>. You can influence this in
        several ways:
      </p>
      <ul>
        <li>
          <code>axis.ticks(count)</code> — a <em>hint</em> for how many ticks; the scale still picks round numbers, so
          you might get 4 or 6 when asking for 5.
        </li>
        <li>
          <code>axis.ticks(count, specifier)</code> — also sets a format, e.g. <code>ticks(5, &quot;$.2f&quot;)</code>{" "}
          or <code>ticks(5, &quot;%&quot;)</code>. For time scales, pass an interval:{" "}
          <code>ticks(d3.timeMonth.every(3))</code>.
        </li>
        <li>
          <code>axis.tickValues([...])</code> — exact tick positions, overriding the scale&apos;s choice.
        </li>
        <li>
          <code>axis.tickFormat(fn)</code> — any function from value to string. <code>d3.format</code> and{" "}
          <code>d3.timeFormat</code> produce such functions.
        </li>
      </ul>
      <Playground
        title="ticks, tickValues, tickFormat"
        code={`
const W = 640, rowH = 58, m = { left: 30, right: 30 };
const x = d3.scaleLinear([0, 1200000], [m.left, W - m.right]);

const variants = [
  ["default", d3.axisBottom(x)],
  ["ticks(4)", d3.axisBottom(x).ticks(4)],
  ['ticks(5, "s")', d3.axisBottom(x).ticks(5, "s")],
  ['ticks(6, "$~s")', d3.axisBottom(x).ticks(6, "$~s")],
  ["tickValues([0, 250k, 1M])", d3.axisBottom(x).tickValues([0, 250000, 1000000]).tickFormat(d3.format(".2s"))],
  ["tickFormat(d => d / 1e3 + 'k')", d3.axisBottom(x).ticks(6).tickFormat(d => d / 1e3 + "k")],
];

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${variants.length * rowH}\`)
  .style("font", "12px sans-serif");

variants.forEach(([label, axis], i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH})\`);
  g.append("text").attr("x", m.left).attr("y", 14).attr("font-weight", "bold").attr("font-family", "monospace").text(label);
  g.append("g").attr("transform", "translate(0,24)").call(axis);
});

log("x.ticks(4):", x.ticks(4), "← asked for 4, got", x.ticks(4).length);
`}
      />

      <h2>Tick size and padding</h2>
      <ApiTable
        rows={[
          ["axis.tickSizeInner(size)", "Length of the tick lines at each tick (default 6)."],
          ["axis.tickSizeOuter(size)", "Length of the end caps of the domain path (default 6). Set to 0 for a clean line."],
          ["axis.tickSize(size)", "Sets both inner and outer."],
          ["axis.tickPadding(px)", "Space between tick line and label (default 3)."],
          ["axis.offset(px)", "Sub-pixel offset for crisp lines (default 0.5 on low-DPI screens, 0 otherwise)."],
        ]}
      />
      <p>
        Negative sizes flip ticks to the other side. And a tick size equal to the <em>chart&apos;s height or width</em>{" "}
        turns ticks into full-length <strong>gridlines</strong> — the classic D3 trick:
      </p>
      <Playground
        title="Tick sizes and the gridline trick"
        code={`
const W = 640, H = 300, m = { top: 20, right: 20, bottom: 30, left: 50 };
const x = d3.scaleLinear([0, 10], [m.left, W - m.right]);
const y = d3.scaleLinear([0, 100], [H - m.bottom, m.top]);
const innerW = W - m.left - m.right, innerH = H - m.top - m.bottom;

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

// GRIDLINES: axes with tickSize spanning the plot, no labels, no domain
svg.append("g")
    .attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).tickSize(-innerH).tickFormat(""))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#e9ecef"));
svg.append("g")
    .attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).tickSize(-innerW).tickFormat(""))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").attr("stroke", "#e9ecef"));

// the real axes on top
svg.append("g")
    .attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).tickSizeOuter(0).tickPadding(8));
svg.append("g")
    .attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).tickSizeInner(3).tickSizeOuter(0).tickPadding(6));

// some data
const data = d3.range(0, 10.01, 0.25).map(t => [t, 50 + 35 * Math.sin(t) * Math.exp(-t / 8)]);
svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#7048e8")
    .attr("stroke-width", 2.5)
    .attr("d", d3.line(d => x(d[0]), d => y(d[1])).curve(d3.curveMonotoneX));
`}
      />

      <h2>Styling: the modern minimal look</h2>
      <p>
        Because axes render plain SVG, you can post-process them with <code>.call(g =&gt; ...)</code> right after
        rendering: remove the domain line, extend ticks into gridlines, move a label, or add an axis title. This pattern
        (popularized by Observable examples) keeps all customization next to the axis.
      </p>
      <Playground
        title="Styled axes"
        code={`
const W = 640, H = 320, m = { top: 30, right: 20, bottom: 35, left: 50 };
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const data = months.map((mo, i) => ({ mo, v: 20 + 60 * Math.sin((i + 1) / 12 * Math.PI) + (i % 3) * 6 }));

const x = d3.scaleBand(months, [m.left, W - m.right]).padding(0.25);
const y = d3.scaleLinear([0, 100], [H - m.bottom, m.top]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px system-ui, sans-serif");

svg.append("g")
    .attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "%"))
    .call(g => g.select(".domain").remove())                                // no axis line
    .call(g => g.selectAll(".tick line").clone()                           // gridlines via clone
        .attr("x2", W - m.left - m.right)
        .attr("stroke-opacity", 0.1))
    .call(g => g.selectAll(".tick text").attr("fill", "#868e96"))
    .call(g => g.append("text")                                             // axis title
        .attr("x", -m.left)
        .attr("y", 14)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("↑ Satisfaction"));

svg.append("g")
    .attr("transform", \`translate(0,\${H - m.bottom})\`)
    .style("color", "#495057")                                             // currentColor drives lines + text
    .call(d3.axisBottom(x).tickSize(0).tickPadding(10))
    .call(g => g.select(".domain").attr("stroke", "#ced4da"));

svg.append("g")
    .attr("fill", "#20c997")
  .selectAll("rect")
  .data(data)
  .join("rect")
    .attr("x", d => x(d.mo))
    .attr("y", d => y(d.v))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.v))
    .attr("rx", 3);
`}
      />
      <Callout type="tip">
        <p>
          Band scales position ticks at the <em>center</em> of each band automatically. For long category labels on a
          bottom axis, rotate them:{" "}
          <code>.selectAll(&quot;.tick text&quot;).attr(&quot;transform&quot;, &quot;rotate(-40)&quot;).attr(&quot;text-anchor&quot;, &quot;end&quot;)</code>{" "}
          — or better, switch to a horizontal bar chart.
        </p>
      </Callout>

      <h2>Time axes</h2>
      <p>
        With a time scale, the axis picks calendar-aware ticks and a <strong>multi-scale format</strong>: the first
        tick of a new year shows the year, the first of a month shows the month name, and so on. You can override with{" "}
        <code>ticks(d3.timeWeek.every(2))</code> and <code>tickFormat(d3.timeFormat(&quot;%b %d&quot;))</code>. A common
        pattern for long spans is two stacked axes: fine ticks for months and a second axis for years.
      </p>
      <Playground
        title="Time axes"
        code={`
const W = 640, rowH = 62, m = { left: 30, right: 30 };
const make = (a, b) => d3.scaleTime([a, b], [m.left, W - m.right]);

const rows = [
  ["3 years, default", d3.axisBottom(make(new Date(2022, 0, 1), new Date(2025, 0, 1)))],
  ["3 months, default", d3.axisBottom(make(new Date(2024, 0, 1), new Date(2024, 3, 1)))],
  ["1 day, default", d3.axisBottom(make(new Date(2024, 5, 1), new Date(2024, 5, 2)))],
  ["1 year, every month, %b", d3.axisBottom(make(new Date(2024, 0, 1), new Date(2024, 11, 31)))
     .ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"))],
  ["2 months, weekly, %b %d", d3.axisBottom(make(new Date(2024, 2, 1), new Date(2024, 4, 1)))
     .ticks(d3.timeMonday.every(1)).tickFormat(d3.timeFormat("%b %d"))],
];

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${rows.length * rowH + 60}\`)
  .style("font", "12px sans-serif");

rows.forEach(([label, axis], i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH})\`);
  g.append("text").attr("x", m.left).attr("y", 14).attr("font-weight", "bold").text(label);
  g.append("g").attr("transform", "translate(0,24)").call(axis);
});

// Two-level axis: months (minor) + years (major)
const x = make(new Date(2023, 6, 1), new Date(2025, 5, 30));
const g = svg.append("g").attr("transform", \`translate(0,\${rows.length * rowH})\`);
g.append("text").attr("x", m.left).attr("y", 14).attr("font-weight", "bold").text("two-level: months + years");
g.append("g").attr("transform", "translate(0,24)")
  .call(d3.axisBottom(x).ticks(d3.timeMonth.every(2)).tickFormat(d3.timeFormat("%b")).tickSizeOuter(0));
g.append("g").attr("transform", "translate(0,24)")
  .call(d3.axisBottom(x).ticks(d3.timeYear).tickFormat(d3.timeFormat("%Y")).tickSize(30).tickPadding(-12))
  .call(a => a.select(".domain").remove())
  .call(a => a.selectAll(".tick text").attr("text-anchor", "start").attr("dx", 4).attr("font-weight", "bold"));
`}
      />

      <h2>Animated axis updates</h2>
      <p>
        Call an axis on a <strong>transition</strong> instead of a selection, and D3 animates everything: existing
        ticks slide to their new positions, new ticks fade in, removed ticks fade out. Ticks are keyed by their value,
        so a tick labeled &quot;50&quot; glides smoothly as the domain changes. Combine with a data transition and the
        whole chart rescales smoothly.
      </p>
      <Playground
        title="Transitions on axes"
        code={`
const W = 640, H = 320, m = { top: 20, right: 20, bottom: 30, left: 50 };
const x = d3.scaleLinear([0, 49], [m.left, W - m.right]);
const y = d3.scaleLinear().range([H - m.bottom, m.top]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x));
const yAxisG = svg.append("g").attr("transform", \`translate(\${m.left},0)\`);
const path = svg.append("path").attr("fill", "none").attr("stroke", "#1098ad").attr("stroke-width", 2);
const line = d3.line((d, i) => x(i), d => y(d)).curve(d3.curveCatmullRom);
// gridlines baked into the axis via tickSize, so the transition animates them too
const yAxis = d3.axisLeft(y).tickSize(-(W - m.left - m.right)).tickPadding(8);

let walk = 0;
function update(first) {
  // random walks whose magnitude varies wildly, so the y domain must change
  const scale = Math.pow(10, Math.random() * 3);
  const data = d3.range(50).map(() => (walk += (Math.random() - 0.5) * scale));
  y.domain(d3.extent(data)).nice();

  const t = svg.transition().duration(first ? 0 : 900);
  yAxisG.transition(t).call(yAxis);                     // ← axis on a TRANSITION
  // re-apply styling each time: entering ticks are brand-new elements
  yAxisG.call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke-opacity", 0.1));
  path.datum(data).transition(t).attr("d", line);
  log("y domain:", y.domain().map(d3.format(".3~s")).join(" → "));
}
update(true);
d3.interval(() => update(false), 2200);
`}
      />
      <Callout type="warning" title="Style after the transition, or re-apply every time">
        <p>
          When an axis transitions, entering ticks are brand-new elements with default styles, and the axis re-sets
          the attributes it owns (like tick line length) at the end of the transition. So bake what you can into
          the axis itself (gridlines via <code>tickSize</code>), re-apply other post-processing after every{" "}
          <code>.call(axis)</code> (as above), or use CSS rules targeting <code>.tick line</code>, which apply to new
          elements automatically.
        </p>
      </Callout>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.axisTop · axisRight · axisBottom · axisLeft(scale)", "Create an axis generator for a scale in the given orientation."],
          ["axis(selection or transition)", "Render the axis into a <g> (usually via selection.call(axis))."],
          ["axis.scale([scale])", "Get or set the scale."],
          ["axis.ticks(count[, specifier]) · axis.ticks(interval)", "Hint tick count and format; time interval for time scales."],
          ["axis.tickArguments([args])", "The raw arguments passed to scale.ticks and scale.tickFormat."],
          ["axis.tickValues([values])", "Explicit tick values (null to go back to automatic)."],
          ["axis.tickFormat(fn)", "Label formatter (null for the scale default)."],
          ["axis.tickSize · tickSizeInner · tickSizeOuter", "Tick line lengths; negative flips, full-height makes gridlines."],
          ["axis.tickPadding(px)", "Gap between tick and label."],
          ["axis.offset(px)", "Pixel offset for crisp rendering."],
          [".domain · .tick · .tick line · .tick text", "Generated classes/elements you can select and style."],
        ]}
      />

      <Exercises
        items={[
          <>
            In the orientation demo, make the top axis show only three ticks at 0, 50 and 100 with labels
            &quot;low&quot;, &quot;mid&quot;, &quot;high&quot;.
          </>,
          <>Add dashed gridlines (<code>stroke-dasharray</code>) to the styled bar chart for only the y axis.</>,
          <>
            Build a log-scale axis from 1 to 1,000,000 that labels only powers of ten (hint:{" "}
            <code>ticks(6, &quot;~s&quot;)</code> or explicit <code>tickValues</code>).
          </>,
          <>
            In the animated example, add an x axis that also changes (e.g. the number of points varies between 20 and
            100) and transitions.
          </>,
        ]}
      />
    </>
  );
}
