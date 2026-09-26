import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Every chart is an act of translation: a revenue of $3.2M must become a bar 214 pixels tall; a temperature of
        31°C must become a shade of red. <strong>Scales</strong> are the functions that perform this translation. A
        scale maps an input <strong>domain</strong> (data space) to an output <strong>range</strong> (visual space).
        This lesson covers <em>continuous</em> scales, where both domain and range are continuous intervals.
      </p>

      <h2>Scales are functions</h2>
      <p>
        <code>d3.scaleLinear()</code> returns a function. Configure it with <code>.domain([min, max])</code> and{" "}
        <code>.range([min, max])</code>, then call it with a data value:
      </p>
      <CodeBlock>{`
const x = d3.scaleLinear()
    .domain([0, 100])     // data: 0 to 100
    .range([0, 640]);     // pixels: 0 to 640

x(50);   // 320
x(25);   // 160
x(150);  // 960 — extrapolates beyond the range by default

// shorthand: domain and range as constructor arguments
const y = d3.scaleLinear([0, 100], [400, 0]);  // flipped: 0 at the bottom
`}</CodeBlock>
      <p>
        That&apos;s it — a linear scale is just <code>y = mx + b</code> computed for you. The power comes from the
        family of scales that share this interface and the helpers attached to them.
      </p>
      <Playground
        title="Linear scale basics"
        code={`
const x = d3.scaleLinear().domain([0, 100]).range([0, 640]);

log("x(0)   =", x(0));
log("x(50)  =", x(50));
log("x(150) =", x(150), "← extrapolated");
log("x.invert(480) =", x.invert(480), "← pixels back to data");

// ranges don't have to be numbers — anything d3.interpolate understands works
const color = d3.scaleLinear([0, 100], ["#e7f5ff", "#1864ab"]);
log("color(50) =", color(50));

// polylinear: more than two stops (domain and range must have the same length)
const temp = d3.scaleLinear([-10, 0, 35], ["#1c7ed6", "#f1f3f5", "#e03131"]);

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 60");
svg.selectAll("rect")
  .data(d3.range(-10, 36))
  .join("rect")
    .attr("x", (d, i) => i * (640 / 46))
    .attr("width", 640 / 46 + 1)
    .attr("height", 40)
    .attr("fill", d => temp(d));
svg.selectAll("text")
  .data([-10, 0, 35])
  .join("text")
    .attr("x", d => (d + 10) * (640 / 46) + 4)
    .attr("y", 55)
    .attr("font", "11px sans-serif")
    .text(d => d + "°C");
`}
      />

      <h2>Configuring a scale</h2>
      <h3>nice()</h3>
      <p>
        Data rarely starts and ends on round numbers. <code>.nice()</code> extends the domain outward to the nearest
        round values so axes start and end on a tick: <code>[0.23, 97.4]</code> becomes <code>[0, 100]</code>. Call it{" "}
        <em>after</em> setting the domain.
      </p>
      <h3>clamp()</h3>
      <p>
        By default scales extrapolate: inputs outside the domain produce outputs outside the range.{" "}
        <code>.clamp(true)</code> pins outputs to the range, which is useful for color scales and for keeping marks
        inside the plot area.
      </p>
      <h3>ticks() and tickFormat()</h3>
      <p>
        <code>scale.ticks(count)</code> returns about <code>count</code> nicely rounded values within the domain (1, 2
        or 5 times a power of ten). <code>scale.tickFormat(count, specifier)</code> returns a formatter with the right
        precision for those ticks. Axes use these under the hood, but you can use them directly for gridlines or
        labels.
      </p>
      <h3>interpolate(), round() and unknown()</h3>
      <p>
        <code>.interpolate(d3.interpolateHcl)</code> changes <em>how</em> range values are blended (great for color).{" "}
        <code>.rangeRound(range)</code> sets the range and rounds outputs to integers for crisp edges.{" "}
        <code>.unknown(value)</code> sets what the scale returns for <code>undefined</code>/<code>NaN</code> input.
      </p>
      <Playground
        title="nice, clamp, ticks, tickFormat, unknown"
        code={`
const raw = d3.scaleLinear().domain([0.23, 97.4]).range([0, 600]);
log("raw domain:", raw.domain());
log("after nice():", raw.copy().nice().domain());

const clamped = d3.scaleLinear([0, 100], [0, 600]).clamp(true);
log("clamped(150) =", clamped(150), "  clamped(-20) =", clamped(-20));
log("clamped.invert(900) =", clamped.invert(900));

const s = d3.scaleLinear([0, 1], [0, 600]);
log("ticks(5):", s.ticks(5));
log("ticks(10):", s.ticks(10));
log("formatted with tickFormat(10, '%'):", s.ticks(10).map(s.tickFormat(10, "%")));

const big = d3.scaleLinear([0, 2.5e6], [0, 600]);
log("big ticks with 's' (SI):", big.ticks(5).map(big.tickFormat(5, "s")));

const safe = d3.scaleLinear([0, 10], [0, 100]).unknown(-1);
log("safe(undefined) =", safe(undefined), "  safe(NaN) =", safe(NaN));

const rounded = d3.scaleLinear([0, 3], [0, 100]).rangeRound([0, 100]);
log("rounded(1) =", rounded(1), " vs unrounded", d3.scaleLinear([0, 3], [0, 100])(1));

// visual: the same data extent before and after nice()
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 110").style("font", "11px sans-serif");
const before = d3.scaleLinear([0.23, 97.4], [40, 600]);
const after = before.copy().nice();
svg.append("text").attr("x", 40).attr("y", 14).text("without nice(): axis ends on awkward values");
svg.append("g").attr("transform", "translate(0,22)").call(d3.axisBottom(before).tickValues([...before.domain(), ...before.ticks(5)]).tickFormat(d3.format(".3~f")));
svg.append("text").attr("x", 40).attr("y", 68).text("with nice(): domain extended to [0, 100]");
svg.append("g").attr("transform", "translate(0,76)").call(d3.axisBottom(after).ticks(5));
`}
      />

      <h2>Power and square-root scales</h2>
      <p>
        <code>d3.scalePow().exponent(k)</code> applies <code>y = m·x^k + b</code>. The most important special case is{" "}
        <code>d3.scaleSqrt()</code> (exponent 0.5), because of how we perceive <strong>area</strong>. If you size
        circles by value with a linear radius, a value twice as large gets a circle with <em>four</em> times the area
        — readers judge it as much bigger than it is. Mapping value to radius with a square-root scale makes{" "}
        <em>area</em> proportional to value.
      </p>
      <Playground
        title="Area encoding: linear radius vs sqrt radius"
        code={`
const values = [1, 2, 4, 8, 16];
const W = 640, H = 300;
const rLinear = d3.scaleLinear([0, 16], [0, 60]);
const rSqrt = d3.scaleSqrt([0, 16], [0, 60]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

const x = d3.scalePoint(values, [70, W - 70]).padding(0.1);

const rows = [
  { y: 80, scale: rLinear, name: "scaleLinear → radius (misleading: area ∝ value²)", color: "#e03131" },
  { y: 220, scale: rSqrt, name: "scaleSqrt → radius (honest: area ∝ value)", color: "#2f9e44" },
];
for (const row of rows) {
  svg.append("text").attr("x", 10).attr("y", row.y - 65).attr("font-weight", "bold").attr("fill", row.color).text(row.name);
  svg.selectAll(null)
    .data(values)
    .join("circle")
      .attr("cx", d => x(d))
      .attr("cy", row.y)
      .attr("r", d => row.scale(d))
      .attr("fill", row.color)
      .attr("fill-opacity", 0.25)
      .attr("stroke", row.color);
  svg.selectAll(null)
    .data(values)
    .join("text")
      .attr("x", d => x(d))
      .attr("y", row.y + 4)
      .attr("text-anchor", "middle")
      .text(d => d);
}

log("area ratio 16 vs 1, linear:", (rLinear(16) / rLinear(1)) ** 2);
log("area ratio 16 vs 1, sqrt:  ", (rSqrt(16) / rSqrt(1)) ** 2);
`}
      />
      <Callout type="tip">
        <p>
          <code>d3.scaleRadial()</code> is the sqrt scale&apos;s cousin for <em>radial</em> charts: it maps values to a
          radius such that the <em>area</em> of a ring between an inner and outer radius is linear in the value. Use it
          for radial bar charts where bars start at an inner radius &gt; 0.
        </p>
      </Callout>

      <h2>Log and symlog scales</h2>
      <p>
        <code>d3.scaleLog()</code> maps equal <em>ratios</em> to equal distances: 1→10 takes the same space as
        10→100. Use it when data spans several orders of magnitude (populations, incomes, earthquake energy). Two
        gotchas: the domain must be strictly positive <em>or</em> strictly negative (log(0) is −∞), and its ticks
        need a formatter like <code>scale.tickFormat(n, &quot;,&quot;)</code> to avoid a wall of labels.{" "}
        <code>.base(2)</code> changes the log base.
      </p>
      <p>
        <code>d3.scaleSymlog()</code> is a &quot;symmetric log&quot; that is linear near zero and logarithmic further
        out, so it handles zero and negative values. <code>.constant(c)</code> controls the width of the linear region.
      </p>

      <h2>Comparing the continuous scales</h2>
      <p>
        The best way to feel the difference is to put the same data through different scales. Each row below places
        identical values — spanning 0 to 10,000 — using a different scale type. Change the <code>values</code> array to
        explore.
      </p>
      <Playground
        title="Same data, different scales"
        code={`
const values = [0, 1, 5, 10, 50, 100, 500, 1000, 5000, 10000];
const W = 640, rowH = 70, m = { left: 90, right: 30 };
const range = [m.left, W - m.right];

const scales = [
  { name: "linear", s: d3.scaleLinear([0, 10000], range) },
  { name: "sqrt", s: d3.scaleSqrt([0, 10000], range) },
  { name: "pow(0.25)", s: d3.scalePow([0, 10000], range).exponent(0.25) },
  { name: "log", s: d3.scaleLog([1, 10000], range), skipZero: true },
  { name: "symlog", s: d3.scaleSymlog([0, 10000], range) },
];

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${scales.length * rowH + 10}\`)
  .style("font", "11px sans-serif");

const color = d3.scaleSequentialLog([1, 10000], d3.interpolatePlasma);

scales.forEach(({ name, s, skipZero }, i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH + 20})\`);
  g.append("text").attr("x", 10).attr("y", 4).attr("font-weight", "bold").text(name);
  g.append("g").attr("transform", "translate(0,14)")
    .call(d3.axisBottom(s).ticks(4, ",").tickSizeOuter(0))
    .call(ax => ax.selectAll(".tick text").attr("fill", "#868e96"));
  g.selectAll("circle")
    .data(skipZero ? values.filter(v => v > 0) : values)
    .join("circle")
      .attr("cx", d => s(d))
      .attr("r", 5)
      .attr("fill", d => d === 0 ? "#adb5bd" : color(d))
      .attr("stroke", "white")
    .append("title").text(d => d);
});

log("log scale can't show 0:", d3.scaleLog([1, 10], [0, 100])(0));
`}
      />

      <h2>Time scales</h2>
      <p>
        <code>d3.scaleTime()</code> is a linear scale whose domain is JavaScript <code>Date</code>s. The difference is
        in the helpers: <code>ticks()</code> returns sensible calendar boundaries (every 1st of the month, every
        Monday, every 6 hours) and <code>tickFormat()</code> produces multi-scale labels like &quot;March&quot;,
        &quot;2024&quot; or &quot;03 PM&quot;. You can also pass an interval: <code>ticks(d3.timeWeek.every(2))</code>.{" "}
        <code>d3.scaleUtc()</code> is identical but uses UTC instead of local time.
      </p>
      <Playground
        title="scaleTime"
        code={`
const x = d3.scaleTime()
    .domain([new Date(2024, 0, 1), new Date(2024, 11, 31)])
    .range([0, 600]);

log("x(July 1) =", x(new Date(2024, 6, 1)).toFixed(1));
log("x.invert(300) =", x.invert(300));
log("default ticks:", x.ticks().map(x.tickFormat()));
log("every 2 months:", x.ticks(d3.timeMonth.every(2)).map(d3.timeFormat("%b %d")));

const short = d3.scaleTime([new Date(2024, 0, 1, 8), new Date(2024, 0, 1, 18)], [0, 600]);
log("a 10-hour domain:", short.ticks(5).map(short.tickFormat()));

// nice() rounds to calendar boundaries
const messy = d3.scaleTime([new Date(2024, 1, 7, 13, 21), new Date(2024, 3, 22, 4)], [0, 600]).nice();
log("nice domain:", messy.domain().map(d3.timeFormat("%Y-%m-%d %H:%M")));

// visual: ticks from the 2024 scale
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 50").style("font", "11px sans-serif");
svg.append("g").attr("transform", "translate(20,10)").call(d3.axisBottom(x));
`}
      />

      <h2>Identity, and the copy() habit</h2>
      <p>
        <code>d3.scaleIdentity()</code> returns its input unchanged — handy when a component expects a scale but your
        data is already in pixels (e.g. an axis over a raw pixel range). And every scale has <code>.copy()</code>,
        which returns an independent clone: modify the copy (as zooming does with <code>transform.rescaleX</code>)
        without touching the original.
      </p>

      <h2>A realistic chart</h2>
      <p>
        Putting it together: a bubble chart of (fictional) countries with GDP per capita on a <strong>log</strong> x
        axis, life expectancy on a <strong>linear</strong> y axis, population as <strong>sqrt</strong>-scaled radius,
        and continent as color.
      </p>
      <Playground
        title="Log × linear × sqrt bubble chart"
        code={`
const rng = d3.randomLcg(42);
const continents = ["Africa", "Americas", "Asia", "Europe", "Oceania"];
const data = d3.range(70).map(i => {
  const c = continents[i % 5];
  const gdp = Math.exp(6.5 + rng() * 4.5 + (c === "Europe" ? 1 : c === "Africa" ? -0.8 : 0));
  return {
    continent: c,
    gdp,
    life: Math.min(85, 38 + Math.log(gdp) * 4 + rng() * 6),
    pop: 1e6 * Math.exp(rng() * 7),
  };
});

const W = 640, H = 400, m = { top: 20, right: 20, bottom: 40, left: 45 };
const x = d3.scaleLog(d3.extent(data, d => d.gdp), [m.left, W - m.right]).nice();
const y = d3.scaleLinear(d3.extent(data, d => d.life), [H - m.bottom, m.top]).nice();
const r = d3.scaleSqrt([0, d3.max(data, d => d.pop)], [0, 28]);
const color = d3.scaleOrdinal(continents, d3.schemeTableau10);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "11px sans-serif");

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).ticks(6, "$,.0f"))
  .append("text").attr("x", W - m.right).attr("y", 32).attr("fill", "currentColor")
    .attr("text-anchor", "end").text("GDP per capita (log scale) →");
svg.append("g").attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y))
  .append("text").attr("x", 4).attr("y", m.top).attr("fill", "currentColor")
    .attr("text-anchor", "start").text("↑ Life expectancy (years)");

svg.append("g")
    .attr("stroke", "white")
  .selectAll("circle")
  .data(data.sort((a, b) => b.pop - a.pop))   // big bubbles first, so small ones stay on top
  .join("circle")
    .attr("cx", d => x(d.gdp))
    .attr("cy", d => y(d.life))
    .attr("r", d => r(d.pop))
    .attr("fill", d => color(d.continent))
    .attr("fill-opacity", 0.75)
  .append("title")
    .text(d => \`\${d.continent}\\nGDP: \${d3.format("$,.0f")(d.gdp)}\\nPop: \${d3.format(".3s")(d.pop)}\`);

const legend = svg.append("g").attr("transform", \`translate(\${m.left + 10},\${m.top + 20})\`);
continents.forEach((c, i) => {
  legend.append("circle").attr("cx", 0).attr("cy", i * 16).attr("r", 5).attr("fill", color(c));
  legend.append("text").attr("x", 10).attr("y", i * 16).attr("dy", "0.35em").text(c);
});
`}
      />
      <Callout type="warning" title="Domain order matters">
        <p>
          SVG&apos;s y axis points down, so vertical scales almost always use an inverted range:{" "}
          <code>range([height - margin.bottom, margin.top])</code>. Forgetting this is the #1 reason bar charts come
          out upside down.
        </p>
      </Callout>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.scaleLinear([domain, ]range)", "Linear mapping y = mx + b."],
          ["d3.scalePow().exponent(k)", "Power mapping y = mx^k + b."],
          ["d3.scaleSqrt()", "Pow scale with exponent 0.5 — use for circle radius (area encoding)."],
          ["d3.scaleLog().base(b)", "Logarithmic; domain must not include or cross 0."],
          ["d3.scaleSymlog().constant(c)", "Symmetric log; handles zero and negatives."],
          ["d3.scaleRadial()", "Maps to radius so that ring area is linear in value."],
          ["d3.scaleTime() · d3.scaleUtc()", "Linear over Dates with calendar-aware ticks and formats."],
          ["d3.scaleIdentity()", "Output equals input."],
          ["scale(value)", "Map a domain value to the range."],
          ["scale.invert(value)", "Map a range value back to the domain (numeric ranges only)."],
          ["scale.domain([...]) · scale.range([...])", "Get or set domain/range; more than two values makes a piecewise scale."],
          ["scale.rangeRound(range)", "Set range and round outputs to integers."],
          ["scale.nice([count])", "Extend the domain to round values."],
          ["scale.clamp(bool)", "Restrict outputs to the range."],
          ["scale.interpolate(factory)", "Change how range values are interpolated (e.g. d3.interpolateHcl)."],
          ["scale.ticks([count]) · scale.tickFormat([count, spec])", "Representative values and a matching formatter."],
          ["scale.unknown(value)", "Output for undefined/NaN input."],
          ["scale.copy()", "An independent clone."],
        ]}
      />

      <Exercises
        items={[
          <>
            Create a scale that maps temperatures from 0°C to 40°C onto the colors <code>&quot;steelblue&quot;</code>{" "}
            → <code>&quot;tomato&quot;</code> using <code>d3.interpolateHcl</code>, and log the color at 20°C.
          </>,
          <>
            In the comparison demo, add a <code>scaleLog().base(2)</code> row and a <code>symlog</code> row with{" "}
            <code>.constant(100)</code>. How do they differ?
          </>,
          <>
            In the bubble chart, switch the x axis to <code>scaleLinear</code>. Why does the log scale tell the story
            better?
          </>,
          <>
            Use <code>y.invert</code> with <code>d3.pointer</code> (from the Events lesson) to show the life
            expectancy under the mouse.
          </>,
        ]}
      />
    </>
  );
}
