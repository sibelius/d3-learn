import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Pie and donut charts in D3 are built from two cooperating pieces. <code>d3.pie()</code> is a{" "}
        <strong>layout</strong>: it takes your values and computes angles, but draws nothing.{" "}
        <code>d3.arc()</code> is a <strong>shape generator</strong>: it takes angles and radii and returns an SVG path
        string for one wedge. Keeping them separate means you can use arcs for gauges, radial bar charts and sunbursts
        too — anywhere you need a slice of a ring.
      </p>

      <h2>d3.arc: one slice of a ring</h2>
      <p>An arc is described by four numbers:</p>
      <ul>
        <li>
          <code>innerRadius</code> and <code>outerRadius</code> — in pixels. An inner radius of 0 gives a pie wedge;
          anything larger gives a donut segment.
        </li>
        <li>
          <code>startAngle</code> and <code>endAngle</code> — in <strong>radians</strong>, measured{" "}
          <strong>clockwise from 12 o&apos;clock</strong> (not from 3 o&apos;clock like Canvas or trigonometry). A
          full circle is <code>2 * Math.PI</code>.
        </li>
      </ul>
      <p>
        Each of these can be a constant or an accessor. The generator is centered on (0, 0), so you translate a group
        to where the center should be. On top of the geometry, <code>cornerRadius</code> rounds the corners and{" "}
        <code>padAngle</code> leaves a gap between adjacent arcs. Finally, <code>arc.centroid(d)</code> returns the
        [x, y] midpoint of the arc — the natural spot for a label.
      </p>
      <Playground
        title="Arc anatomy"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 200")
    .style("font", "11px sans-serif");

const examples = [
  { label: "pie wedge",       inner: 0,  outer: 70, corner: 0,  start: 0, end: 2 },
  { label: "donut segment",   inner: 40, outer: 70, corner: 0,  start: 0, end: 4 },
  { label: "cornerRadius(8)", inner: 40, outer: 70, corner: 8,  start: -1, end: 2.5 },
  { label: "full ring",       inner: 55, outer: 70, corner: 0,  start: 0, end: 2 * Math.PI },
];

const arc = d3.arc()
    .innerRadius(d => d.inner)
    .outerRadius(d => d.outer)
    .cornerRadius(d => d.corner)
    .startAngle(d => d.start)
    .endAngle(d => d.end);

const g = svg.selectAll("g").data(examples).join("g")
    .attr("transform", (d, i) => \`translate(\${85 + i * 157},95)\`);

g.append("circle").attr("r", d => d.outer).attr("fill", "none")
    .attr("stroke", "#e9ecef").attr("stroke-dasharray", "2 2");
g.append("path").attr("d", arc).attr("fill", "#4dabf7").attr("stroke", "#1971c2");
g.append("circle")                       // centroid
    .attr("transform", d => \`translate(\${arc.centroid(d)})\`)
    .attr("r", 3).attr("fill", "#e8590c");
g.append("text").attr("y", 92).attr("text-anchor", "middle").text(d => d.label);

log("pie wedge path:", arc(examples[0]));
log("centroid of donut segment:", arc.centroid(examples[1]));
`}
      />
      <Callout type="tip">
        <p>
          <code>translate(${"{"}arc.centroid(d){"}"})</code> works because an array converts to the string{" "}
          <code>&quot;x,y&quot;</code>. For labels that sit <em>outside</em> the pie, make a second arc generator
          with a larger radius and use <em>its</em> centroid.
        </p>
      </Callout>

      <h2>d3.pie: values to angles</h2>
      <p>
        <code>d3.pie()</code> takes an array and returns a <em>new</em> array of objects, one per datum, shaped
        exactly the way <code>d3.arc</code> wants:{" "}
        <code>{"{"} data, value, index, startAngle, endAngle, padAngle {"}"}</code>. The original datum is kept in{" "}
        <code>.data</code>. Configuration:
      </p>
      <ul>
        <li>
          <code>pie.value(fn)</code> — how to read the number from each datum (default: the datum itself).
        </li>
        <li>
          <code>pie.sort(comparator)</code> / <code>pie.sortValues(comparator)</code> — by default slices are sorted
          by <em>descending value</em> (though the output array keeps input order; only the angles change). Pass{" "}
          <code>null</code> to keep the input order around the circle.
        </li>
        <li>
          <code>pie.startAngle</code> / <code>pie.endAngle</code> — the total sweep, default 0 to 2π. Use −π/2 to π/2
          for a semicircle.
        </li>
        <li>
          <code>pie.padAngle</code> — gap between slices, passed through to the arc generator.
        </li>
      </ul>
      <Playground
        title="What d3.pie returns"
        hideOutput
        code={`
const data = [
  { fruit: "apples",  count: 10 },
  { fruit: "bananas", count: 30 },
  { fruit: "cherries", count: 20 },
];

const pie = d3.pie().value(d => d.count);
const arcs = pie(data);
log(arcs.map(a => ({
  fruit: a.data.fruit, value: a.value, index: a.index,
  startDeg: +(a.startAngle * 180 / Math.PI).toFixed(1),
  endDeg: +(a.endAngle * 180 / Math.PI).toFixed(1),
})));
// Note: bananas (largest) got index 0 and starts at 0° — sorted by value.

const unsorted = d3.pie().value(d => d.count).sort(null)(data);
log("sort(null) start angles (deg):", unsorted.map(a => Math.round(a.startAngle * 180 / Math.PI)));

const half = d3.pie().value(d => d.count).startAngle(-Math.PI / 2).endAngle(Math.PI / 2)(data);
log("semicircle end of last slice (rad):", half.at(-1).endAngle);
`}
      />

      <h2>Tuning with padAngle, cornerRadius and innerRadius</h2>
      <p>
        These three settings change the character of a chart dramatically. Pad angles need a non-zero inner radius
        to look even (the gap is a constant <em>angle</em>, so it narrows to a point at the center; D3 also uses{" "}
        <code>arc.padRadius</code> to keep the gap width parallel). Drag the sliders:
      </p>
      <Playground
        title="Interactive donut settings"
        code={`
const data = [42, 28, 17, 9, 4];
const color = d3.scaleOrdinal(d3.schemeTableau10);
const R = 140;

const controls = d3.select(el).append("div")
    .style("display", "grid").style("grid-template-columns", "repeat(3, auto)")
    .style("gap", "4px 16px").style("font", "12px sans-serif").style("justify-content", "start");
function slider(label, min, max, step, value) {
  const wrap = controls.append("label");
  wrap.append("div").text(label);
  return wrap.append("input").attr("type", "range")
      .attr("min", min).attr("max", max).attr("step", step).property("value", value)
      .on("input", render);
}
const inner = slider("innerRadius", 0, 130, 1, 70);
const pad = slider("padAngle", 0, 0.12, 0.005, 0.02);
const corner = slider("cornerRadius", 0, 30, 1, 6);

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 300");
const g = svg.append("g").attr("transform", "translate(320,150)");

function render() {
  const pie = d3.pie().sort(null).padAngle(+pad.property("value"));
  const arc = d3.arc()
      .innerRadius(+inner.property("value"))
      .outerRadius(R)
      .cornerRadius(+corner.property("value"));
  g.selectAll("path").data(pie(data)).join("path")
      .attr("d", arc)
      .attr("fill", (d, i) => color(i));
}
render();
`}
      />

      <h2>A donut chart with labels</h2>
      <p>
        Here is a complete chart: a donut with percentage labels inside each slice (using the centroid), category
        labels outside with leader lines (using a second, larger &quot;label arc&quot;), and a total in the middle.
        Small slices get no inside label — hiding labels that won&apos;t fit is essential for readable pies.
      </p>
      <Playground
        title="Labeled donut chart"
        code={`
const data = [
  { source: "Hydro",   share: 61.9 },
  { source: "Wind",    share: 13.2 },
  { source: "Biomass", share: 8.0 },
  { source: "Natural gas", share: 6.4 },
  { source: "Solar",   share: 5.1 },
  { source: "Nuclear", share: 2.2 },
  { source: "Other",   share: 3.2 },
];
const W = 640, H = 380, R = 130;

const color = d3.scaleOrdinal()
    .domain(data.map(d => d.source))
    .range(d3.quantize(t => d3.interpolateSpectral(t * 0.8 + 0.1), data.length).reverse());

const pie = d3.pie().value(d => d.share).sort(null).padAngle(0.012);
const arc = d3.arc().innerRadius(R * 0.58).outerRadius(R).cornerRadius(3);
const labelArc = d3.arc().innerRadius(R * 1.18).outerRadius(R * 1.18);
const arcs = pie(data);
const total = d3.sum(data, d => d.share);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "12px sans-serif");
const g = svg.append("g").attr("transform", \`translate(\${W / 2},\${H / 2})\`);

g.selectAll("path").data(arcs).join("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.source))
  .append("title")
    .text(d => d.data.source + ": " + d.data.share + "%");

// inside labels (only for slices wider than ~0.3 rad)
g.selectAll(".pct").data(arcs.filter(d => d.endAngle - d.startAngle > 0.3)).join("text")
    .attr("class", "pct")
    .attr("transform", d => \`translate(\${arc.centroid(d)})\`)
    .attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("fill", d => d3.lab(color(d.data.source)).l > 70 ? "#343a40" : "white")
    .attr("font-weight", "bold")
    .text(d => Math.round(d.data.share / total * 100) + "%");

// outside labels with leader lines
const midAngle = d => (d.startAngle + d.endAngle) / 2;
const side = d => midAngle(d) < Math.PI ? 1 : -1;
// label y positions, nudged apart per side so small neighbours don't collide
for (const s of [1, -1]) {
  const group = arcs.filter(d => side(d) === s).sort((a, b) => labelArc.centroid(a)[1] - labelArc.centroid(b)[1]);
  group.forEach((d, i) => {
    d.labelY = labelArc.centroid(d)[1];
    if (i > 0) d.labelY = Math.max(d.labelY, group[i - 1].labelY + 15);
  });
}
g.selectAll("polyline").data(arcs).join("polyline")
    .attr("fill", "none").attr("stroke", "#adb5bd")
    .attr("points", d => {
      const a = arc.centroid(d), b = labelArc.centroid(d);
      return [a, [b[0], d.labelY], [R * 1.35 * side(d), d.labelY]];
    });
g.selectAll(".name").data(arcs).join("text")
    .attr("class", "name")
    .attr("transform", d => \`translate(\${R * 1.38 * side(d)},\${d.labelY})\`)
    .attr("text-anchor", d => midAngle(d) < Math.PI ? "start" : "end")
    .attr("dy", "0.35em").attr("fill", "#343a40")
    .text(d => d.data.source);

g.append("text").attr("text-anchor", "middle").attr("dy", "-0.2em")
    .attr("font-size", 22).attr("font-weight", "bold").text("Brazil");
g.append("text").attr("text-anchor", "middle").attr("dy", "1.2em").attr("fill", "#868e96")
    .text("electricity mix (illustrative)");
`}
      />
      <Callout type="warning">
        <p>
          The outside labels above can still collide when several tiny slices sit next to each other. Production
          charts typically nudge labels apart vertically (a small relaxation loop) or fall back to a legend. And
          remember the perception research: people compare angles poorly — if precise comparison matters, a sorted bar
          chart usually beats a pie.
        </p>
      </Callout>

      <h2>Animating arcs with attrTween</h2>
      <p>
        If you transition the <code>d</code> attribute of an arc directly, D3 interpolates the <em>path
        strings</em> number by number — and the shapes warp into nonsense mid-transition. The fix is to interpolate
        the <em>angles</em> instead and regenerate the path at every tick with <code>attrTween</code>. We store each
        slice&apos;s last angles on the DOM node (<code>this._current</code>) so the next transition starts from where
        the previous one ended.
      </p>
      <CodeBlock>{`
path.transition().duration(750)
    .attrTween("d", function (d) {
      const i = d3.interpolate(this._current, d); // interpolates startAngle/endAngle
      this._current = i(1);
      return t => arc(i(t));
    });
`}</CodeBlock>
      <Playground
        title="Arc tween between datasets"
        code={`
const datasets = {
  "2019": { Mobile: 52, Desktop: 44, Tablet: 4 },
  "2022": { Mobile: 59, Desktop: 39, Tablet: 2 },
  "2025": { Mobile: 64, Desktop: 34, Tablet: 2 },
  "Even": { Mobile: 33, Desktop: 33, Tablet: 34 },
};
const keys = ["Mobile", "Desktop", "Tablet"];
const color = d3.scaleOrdinal(keys, ["#4263eb", "#20c997", "#fab005"]);

const buttons = d3.select(el).append("div").style("margin-bottom", "6px");
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 300")
    .style("font", "12px sans-serif");
const g = svg.append("g").attr("transform", "translate(240,150)");

const pie = d3.pie().value(k => current[k]).sort(null);
const arc = d3.arc().innerRadius(70).outerRadius(130).padAngle(0.015).cornerRadius(4);
let current = datasets["2019"];

const paths = g.selectAll("path").data(pie(keys)).join("path")
    .attr("fill", d => color(d.data))
    .attr("d", arc)
    .each(function (d) { this._current = d; });   // remember initial angles

const center = g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
    .attr("font-size", 26).attr("font-weight", "bold").text("2019");

const legend = svg.append("g").attr("transform", "translate(420,110)")
  .selectAll("g").data(keys).join("g").attr("transform", (d, i) => \`translate(0,\${i * 26})\`);
legend.append("rect").attr("width", 16).attr("height", 16).attr("rx", 3).attr("fill", color);
const legendText = legend.append("text").attr("x", 24).attr("y", 12);
legendText.text(k => k + " " + current[k] + "%");

buttons.selectAll("button").data(Object.keys(datasets)).join("button")
    .text(d => d)
    .style("margin-right", "6px").style("padding", "3px 12px").style("cursor", "pointer").style("border", "1px solid #ced4da").style("border-radius", "6px").style("background", "#f8f9fa")
    .on("click", (event, name) => {
      current = datasets[name];
      center.text(name);
      legendText.text(k => k + " " + current[k] + "%");
      paths.data(pie(keys))
        .transition().duration(800).ease(d3.easeCubicInOut)
          .attrTween("d", function (d) {
            const i = d3.interpolate(this._current, d);
            this._current = i(1);
            return t => arc(i(t));
          });
    });
`}
      />

      <h2>Gauges and semicircles</h2>
      <p>
        A gauge is just arcs with a restricted angle range. Map your value through a linear scale whose range is{" "}
        <code>[-Math.PI / 2, Math.PI / 2]</code> and use the result as the <code>endAngle</code> of the value arc.
        Tweening the end angle alone (with <code>d3.interpolate</code> on a number) animates the fill; the same
        interpolated angle rotates the needle. Remember that arc angles start at 12 o&apos;clock, while SVG{" "}
        <code>rotate()</code> is in degrees — hence the conversion.
      </p>
      <Playground
        title="Animated gauge"
        code={`
const W = 640, H = 300, R = 170, cx = W / 2, cy = 230;
const angle = d3.scaleLinear().domain([0, 100]).range([-Math.PI / 2, Math.PI / 2]).clamp(true);
const color = d3.scaleSequential([0, 100], t => d3.interpolateRdYlGn(1 - t));

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "12px sans-serif");
const g = svg.append("g").attr("transform", \`translate(\${cx},\${cy})\`);

const arc = d3.arc().innerRadius(R - 36).outerRadius(R).cornerRadius(6).startAngle(-Math.PI / 2);

// track
g.append("path").attr("d", arc({ endAngle: Math.PI / 2 })).attr("fill", "#f1f3f5");
// ticks
g.selectAll(".tick").data(d3.range(0, 101, 10)).join("text")
    .attr("class", "tick").attr("text-anchor", "middle").attr("fill", "#868e96")
    .attr("x", v => Math.sin(angle(v)) * (R + 16))
    .attr("y", v => -Math.cos(angle(v)) * (R + 16) + 4)
    .text(v => v);

const valueArc = g.append("path").datum({ endAngle: angle(0) }).attr("d", arc);
const needle = g.append("g");
needle.append("path").attr("d", "M-5,0 L0,-" + (R - 44) + " L5,0 Z").attr("fill", "#343a40");
needle.append("circle").attr("r", 9).attr("fill", "#343a40");
const label = g.append("text").attr("text-anchor", "middle").attr("y", 50)
    .attr("font-size", 30).attr("font-weight", "bold");

let value = 0;
function setValue(v) {
  const from = value; value = v;
  valueArc.transition().duration(1200).ease(d3.easeElasticOut.amplitude(1).period(0.5))
    .attrTween("d", d => {
      const i = d3.interpolate(d.endAngle, angle(v));
      return t => { d.endAngle = i(t); return arc(d); };
    })
    .tween("needle", () => {
      const i = d3.interpolate(from, v);
      return t => {
        const cur = i(t);
        needle.attr("transform", "rotate(" + (angle(cur) * 180 / Math.PI) + ")");
        valueArc.attr("fill", color(cur));
        label.text(Math.round(cur) + "%");
      };
    });
}

d3.select(el).insert("button", ":first-child").text("Random value")
    .style("padding", "3px 12px").style("cursor", "pointer").style("border", "1px solid #ced4da").style("border-radius", "6px").style("background", "#f8f9fa")
    .on("click", () => setValue(Math.round(Math.random() * 100)));
setValue(72);
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.arc()", "Create an arc generator. Call it with an object (or datum) to get a path string."],
          ["arc.innerRadius(r) / outerRadius(r)", "Radii in pixels; constant or accessor. inner 0 = pie wedge."],
          ["arc.startAngle(a) / endAngle(a)", "Angles in radians, clockwise from 12 o'clock. Default reads d.startAngle / d.endAngle."],
          ["arc.cornerRadius(r)", "Round the corners of each arc."],
          ["arc.padAngle(a) / padRadius(r)", "Gap between adjacent arcs; padRadius keeps the gap width parallel."],
          ["arc.centroid(d)", "The [x, y] midpoint of the arc — handy for labels."],
          ["arc.context(ctx)", "Render to canvas instead of returning a string."],
          ["d3.pie()", "Create a pie layout: data → array of { data, value, index, startAngle, endAngle, padAngle }."],
          ["pie.value(fn)", "Accessor for each datum's numeric value."],
          ["pie.sort(cmp) / pie.sortValues(cmp)", "Order of slices around the circle. null = input order. Default: descending value."],
          ["pie.startAngle(a) / endAngle(a)", "Total sweep (default 0 → 2π). Use −π/2 → π/2 for a semicircle."],
          ["pie.padAngle(a)", "Pad angle stored on each output object for the arc generator."],
        ]}
      />

      <Exercises
        items={[
          <>
            In the labeled donut, add a hover effect: on <code>pointerenter</code>, grow the slice by switching to an
            arc generator with a slightly larger <code>outerRadius</code>.
          </>,
          <>
            Change the tween example so slices animate in from zero on first render (start every{" "}
            <code>_current</code> at <code>{"{"}startAngle: 0, endAngle: 0{"}"}</code>).
          </>,
          <>
            Build a <em>radial bar chart</em>: one arc per month where the angle is fixed (2π / 12 each) and the{" "}
            <code>outerRadius</code> encodes the value through a <code>d3.scaleRadial</code>.
          </>,
          <>
            Turn the gauge into a three-zone gauge (green / yellow / red) drawn with three static arcs behind the
            needle.
          </>,
        ]}
      />
    </>
  );
}
