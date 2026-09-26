import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Continuous scales map a continuous domain to a continuous range. But lots of data isn&apos;t like that:
        product names, days of the week, survey answers. And sometimes you <em>want</em> a continuous input to snap to
        a few discrete buckets — five shades on a choropleth instead of a smooth gradient. This lesson covers the rest
        of <code>d3-scale</code>: scales with a <strong>discrete</strong> domain, a <strong>discrete</strong> range, or
        both, plus the sequential and diverging scales built for color.
      </p>
      <p>A useful map of the territory:</p>
      <ApiTable
        rows={[
          ["discrete → discrete", "scaleOrdinal — categories to colors, symbols, anything."],
          ["discrete → continuous", "scaleBand, scalePoint — categories to positions."],
          ["continuous → discrete", "scaleQuantize, scaleQuantile, scaleThreshold — numbers to buckets."],
          ["continuous → interpolator", "scaleSequential, scaleDiverging — numbers to smooth color ramps."],
        ]}
      />

      <h2>Band scales</h2>
      <p>
        <code>d3.scaleBand()</code> is made for bar charts. Give it a list of categories as the domain and a pixel
        interval as the range; it divides the range into equal <strong>bands</strong>. <code>x(&quot;B&quot;)</code>{" "}
        returns the <em>start</em> of band B, and <code>x.bandwidth()</code> returns the width of each band.
      </p>
      <p>Padding controls the gaps, expressed as a fraction of the <code>step</code> (band + gap):</p>
      <ul>
        <li>
          <code>paddingInner(p)</code> — the gap <em>between</em> bands.
        </li>
        <li>
          <code>paddingOuter(p)</code> — the space before the first band and after the last.
        </li>
        <li>
          <code>padding(p)</code> — sets both at once.
        </li>
        <li>
          <code>align(a)</code> — where to put leftover outer space: 0 = left, 0.5 = center (default), 1 = right.
        </li>
        <li>
          <code>round(true)</code> — snap to whole pixels for crisp edges.
        </li>
      </ul>
      <Playground
        title="Band padding, visualized"
        code={`
const domain = ["A", "B", "C", "D", "E"];
const W = 640, rowH = 70;
const configs = [
  { label: "padding(0)", s: d3.scaleBand(domain, [20, W - 20]) },
  { label: "paddingInner(0.3)", s: d3.scaleBand(domain, [20, W - 20]).paddingInner(0.3) },
  { label: "paddingOuter(0.5)", s: d3.scaleBand(domain, [20, W - 20]).paddingOuter(0.5) },
  { label: "padding(0.3)", s: d3.scaleBand(domain, [20, W - 20]).padding(0.3) },
  { label: "padding(0.3).paddingOuter(1).align(0)", s: d3.scaleBand(domain, [20, W - 20]).padding(0.3).paddingOuter(1).align(0) },
];

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${configs.length * rowH}\`)
  .style("font", "11px sans-serif");

configs.forEach(({ label, s }, i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH})\`);
  g.append("rect").attr("x", 20).attr("y", 18).attr("width", W - 40).attr("height", 36)
    .attr("fill", "#fff4e6").attr("stroke", "#ffa94d").attr("stroke-dasharray", "3 2");
  g.append("text").attr("x", 20).attr("y", 13).attr("font-weight", "bold")
    .text(\`\${label}   → bandwidth \${s.bandwidth().toFixed(1)}, step \${s.step().toFixed(1)}\`);
  g.selectAll(".band")
    .data(domain)
    .join("rect")
      .attr("x", d => s(d))
      .attr("y", 22)
      .attr("width", s.bandwidth())
      .attr("height", 28)
      .attr("fill", "#4c6ef5");
  g.selectAll(".lbl")
    .data(domain)
    .join("text")
      .attr("x", d => s(d) + s.bandwidth() / 2)
      .attr("y", 40)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text(d => d);
});

const s = d3.scaleBand(domain, [0, 500]).padding(0.2);
log("x('C') =", s("C"), " bandwidth =", s.bandwidth(), " step =", s.step());
log("unknown category:", s("Z"));
`}
      />
      <Callout type="tip">
        <p>
          The orange dashed box is the full range. Watch how <code>paddingOuter</code> shrinks the bands to make room
          on the ends, and how <code>align(0)</code> pushes all leftover space to the right.
        </p>
      </Callout>

      <h2>Point scales</h2>
      <p>
        <code>d3.scalePoint()</code> is a band scale with zero bandwidth: it maps each category to a single point,
        evenly spaced. Perfect for dot plots, or a line chart over categorical x values. <code>padding(p)</code> adds
        outer space in units of the step.
      </p>
      <Playground
        title="scalePoint for a dot plot"
        code={`
const data = [
  { day: "Mon", min: 12, max: 21 }, { day: "Tue", min: 14, max: 24 }, { day: "Wed", min: 11, max: 19 },
  { day: "Thu", min: 9, max: 17 }, { day: "Fri", min: 13, max: 26 }, { day: "Sat", min: 16, max: 29 },
  { day: "Sun", min: 15, max: 27 },
];
const W = 640, H = 260, m = { top: 20, right: 20, bottom: 30, left: 40 };
const x = d3.scalePoint(data.map(d => d.day), [m.left, W - m.right]).padding(0.5);
const y = d3.scaleLinear([5, 32], [H - m.bottom, m.top]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y).ticks(5).tickFormat(d => d + "°"));

const g = svg.selectAll("g.day").data(data).join("g").attr("class", "day");
g.append("line")
    .attr("x1", d => x(d.day)).attr("x2", d => x(d.day))
    .attr("y1", d => y(d.min)).attr("y2", d => y(d.max))
    .attr("stroke", "#ced4da").attr("stroke-width", 4).attr("stroke-linecap", "round");
g.append("circle").attr("cx", d => x(d.day)).attr("cy", d => y(d.min)).attr("r", 6).attr("fill", "#1c7ed6");
g.append("circle").attr("cx", d => x(d.day)).attr("cy", d => y(d.max)).attr("r", 6).attr("fill", "#e03131");

log("step:", x.step(), " bandwidth:", x.bandwidth());
`}
      />

      <h2>Ordinal scales and color schemes</h2>
      <p>
        <code>d3.scaleOrdinal(domain, range)</code> maps each domain value to the range value at the same index,
        cycling through the range if it&apos;s shorter. Most often the range is a categorical color scheme from{" "}
        <code>d3-scale-chromatic</code>: <code>d3.schemeTableau10</code>, <code>schemeCategory10</code>,{" "}
        <code>schemeSet2</code>, <code>schemePaired</code>, <code>schemeObservable10</code> and more.
      </p>
      <p>
        If you don&apos;t set a domain, the scale builds one <em>implicitly</em>: each new value gets the next range
        item, in order of first appearance. This is convenient but order-dependent — set the domain explicitly if colors
        must be stable across charts. <code>.unknown(value)</code> disables the implicit behavior and returns{" "}
        <code>value</code> for anything not in the domain.
      </p>
      <Playground
        title="Ordinal color schemes"
        code={`
const schemes = ["schemeCategory10", "schemeTableau10", "schemeObservable10", "schemeSet2", "schemeDark2", "schemePastel1", "schemePaired"];
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 640 \${schemes.length * 34 + 10}\`)
  .style("font", "12px monospace");

schemes.forEach((name, i) => {
  const colors = d3[name];
  const g = svg.append("g").attr("transform", \`translate(0,\${i * 34 + 8})\`);
  g.append("text").attr("x", 0).attr("y", 16).text(name);
  g.selectAll("rect")
    .data(colors)
    .join("rect")
      .attr("x", (d, j) => 170 + j * 36)
      .attr("width", 32).attr("height", 24).attr("rx", 4)
      .attr("fill", d => d)
    .append("title").text(d => d);
});

// implicit domain: order of first use
const c = d3.scaleOrdinal(d3.schemeTableau10);
log(c("banana"), c("apple"), c("banana"), "→ domain:", c.domain());

// explicit domain + unknown
const fixed = d3.scaleOrdinal(["low", "mid", "high"], ["#40c057", "#fab005", "#fa5252"]).unknown("#ced4da");
log("fixed('high') =", fixed("high"), " fixed('???') =", fixed("???"));

// ranges can be anything: shapes, labels...
const shape = d3.scaleOrdinal(["a", "b", "c"], [d3.symbolCircle, d3.symbolSquare, d3.symbolTriangle]);
log("shape('b') is symbolSquare:", shape("b") === d3.symbolSquare);
`}
      />

      <h2>Quantize, quantile and threshold</h2>
      <p>
        These three map a <em>continuous</em> input to a <em>discrete</em> output — the classic use is a choropleth map
        with a handful of color classes. They differ in <strong>how the bucket boundaries are chosen</strong>:
      </p>
      <ul>
        <li>
          <code>scaleQuantize(domain, range)</code> — splits the domain into <strong>equal-width</strong> intervals, one
          per range value. Simple, but skewed data leaves most buckets empty.
        </li>
        <li>
          <code>scaleQuantile(data, range)</code> — takes the <strong>whole dataset</strong> as its domain and picks
          boundaries so each bucket gets the <strong>same number of values</strong>. Great for skewed data; boundaries
          are arbitrary numbers.
        </li>
        <li>
          <code>scaleThreshold(thresholds, range)</code> — <strong>you choose the boundaries</strong>. With n
          thresholds you need n + 1 range values. Best when meaningful cutoffs exist (poverty lines, AQI levels).
        </li>
      </ul>
      <p>
        All three support <code>invertExtent(rangeValue)</code>, which returns the <code>[min, max]</code> of domain
        values that map to a given output — exactly what you need to draw a legend. Quantize and quantile also expose{" "}
        <code>.thresholds()</code> / <code>.quantiles()</code>.
      </p>
      <Playground
        title="Same skewed data, three bucketing strategies"
        code={`
// log-normal data: most values small, a long right tail
const data = Array.from({ length: 400 }, d3.randomLogNormal.source(d3.randomLcg(3))(3, 0.7));
const colors = d3.schemeBlues[5];
const extent = d3.extent(data);

const scales = [
  { name: "scaleQuantize (equal width)", s: d3.scaleQuantize(extent, colors) },
  { name: "scaleQuantile (equal count)", s: d3.scaleQuantile(data, colors) },
  { name: "scaleThreshold ([10, 20, 40, 80])", s: d3.scaleThreshold([10, 20, 40, 80], colors) },
];

const W = 640, rowH = 100, m = { left: 20, right: 20 };
const x = d3.scaleLinear(extent, [m.left, W - m.right]);
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${scales.length * rowH + 10}\`)
  .style("font", "11px sans-serif");

scales.forEach(({ name, s }, i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH + 18})\`);
  g.append("text").attr("x", m.left).attr("font-weight", "bold").text(name);

  // colored band segments showing each bucket's extent
  g.selectAll("rect")
    .data(colors)
    .join("rect")
      .attr("x", c => x(Math.max(extent[0], s.invertExtent(c)[0] ?? extent[0])))
      .attr("width", c => {
        const [a, b] = s.invertExtent(c);
        return Math.max(0, x(Math.min(extent[1], b ?? extent[1])) - x(Math.max(extent[0], a ?? extent[0])));
      })
      .attr("y", 8).attr("height", 14)
      .attr("fill", c => c);

  // every data point as a tick, colored by its bucket
  g.selectAll("line")
    .data(data)
    .join("line")
      .attr("x1", d => x(d)).attr("x2", d => x(d))
      .attr("y1", 28).attr("y2", 48)
      .attr("stroke", d => s(d)).attr("stroke-opacity", 0.8);

  // bucket counts
  const counts = d3.rollup(data, v => v.length, d => s(d));
  g.append("text").attr("x", m.left).attr("y", 66).attr("fill", "#495057")
    .text("counts per bucket: " + colors.map(c => counts.get(c) ?? 0).join(" · "));
});

log("quantize thresholds:", scales[0].s.thresholds().map(d => +d.toFixed(1)));
log("quantile boundaries:", scales[1].s.quantiles().map(d => +d.toFixed(1)));
log("threshold invertExtent(colors[0]):", scales[2].s.invertExtent(colors[0]));
`}
      />
      <p>
        Notice how quantize crams nearly everything into the first bucket, while quantile distributes points evenly at
        the cost of odd boundaries. A threshold legend is where <code>invertExtent</code> shines:
      </p>
      <Playground
        title="A threshold legend for a choropleth"
        code={`
const thresholds = [5, 10, 20, 50, 100, 200];
const color = d3.scaleThreshold(thresholds, d3.schemeYlOrRd[7]);

const W = 640, H = 90, m = { left: 20, right: 20 };
// position scale for the legend: log looks nicer for these cutoffs
const x = d3.scaleLog([2, 400], [m.left, W - m.right]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "11px sans-serif");

svg.append("text").attr("x", m.left).attr("y", 14).attr("font-weight", "bold")
  .text("Population density (people / km²)");

svg.append("g")
  .selectAll("rect")
  .data(color.range().map(c => {
    const [a, b] = color.invertExtent(c);
    return [a ?? x.domain()[0], b ?? x.domain()[1], c];
  }))
  .join("rect")
    .attr("x", d => x(d[0]))
    .attr("width", d => x(d[1]) - x(d[0]))
    .attr("y", 24).attr("height", 16)
    .attr("fill", d => d[2]);

svg.append("g")
    .attr("transform", "translate(0,24)")
    .call(d3.axisBottom(x).tickValues(thresholds).tickSize(22).tickFormat(d3.format("d")))
    .call(g => g.select(".domain").remove());

// sample classification
const samples = [3, 8, 42, 150, 380];
svg.append("g").selectAll("text")
  .data(samples)
  .join("text")
    .attr("x", (d, i) => m.left + i * 120)
    .attr("y", 84)
    .text(d => \`\${d} → \`)
  .append("tspan")
    .attr("fill", d => color(d))
    .attr("font-size", 14)
    .text("■");
log(samples.map(d => [d, color(d)]));
`}
      />

      <h2>Sequential and diverging scales</h2>
      <p>
        <code>d3.scaleSequential(domain, interpolator)</code> maps a continuous domain onto an{" "}
        <strong>interpolator</strong> — a function from [0, 1] to a color, like <code>d3.interpolateViridis</code>{" "}
        — instead of a range array. Use it for smooth ramps where more means darker or brighter.
      </p>
      <p>
        <code>d3.scaleDiverging([min, mid, max], interpolator)</code> has a <strong>three-value domain</strong> with a
        meaningful midpoint (zero change, 50% vote share, the average). Values below the midpoint map to [0, 0.5] of
        the interpolator and values above to [0.5, 1], so the neutral color always sits at the midpoint even when the
        domain is asymmetric.
      </p>
      <p>
        Both have log, sqrt, pow and symlog variants (<code>scaleSequentialLog</code>,{" "}
        <code>scaleDivergingSqrt</code>, …), and there are quantile variants (<code>scaleSequentialQuantile</code>).
      </p>
      <Playground
        title="Sequential vs diverging"
        code={`
const W = 640, rowH = 58;
const rows = [
  { name: "scaleSequential viridis [0,100]", s: d3.scaleSequential([0, 100], d3.interpolateViridis), dom: [0, 100] },
  { name: "scaleSequential blues [0,100]", s: d3.scaleSequential([0, 100], d3.interpolateBlues), dom: [0, 100] },
  { name: "scaleSequentialLog magma [1,1000]", s: d3.scaleSequentialLog([1, 1000], d3.interpolateMagma), dom: [1, 1000] },
  { name: "scaleDiverging RdBu [-10, 0, 40]", s: d3.scaleDiverging([-10, 0, 40], d3.interpolateRdBu), dom: [-10, 40] },
  { name: "scaleDiverging PiYG [0, 50, 100]", s: d3.scaleDiverging([0, 50, 100], d3.interpolatePiYG), dom: [0, 100] },
];

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${rows.length * rowH}\`)
  .style("font", "11px sans-serif");

rows.forEach(({ name, s, dom }, i) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH})\`);
  g.append("text").attr("x", 20).attr("y", 13).attr("font-weight", "bold").text(name);
  const isLog = name.includes("Log");
  const x = (isLog ? d3.scaleLog() : d3.scaleLinear()).domain(dom).range([20, W - 20]);
  const n = 120;
  g.selectAll("rect")
    .data(d3.range(n).map(k => x.invert(20 + k * (W - 40) / n)))
    .join("rect")
      .attr("x", d => x(d))
      .attr("width", (W - 40) / n + 1)
      .attr("y", 18).attr("height", 16)
      .attr("fill", d => s(d));
  g.append("g").attr("transform", "translate(0,34)")
    .call(d3.axisBottom(x).ticks(isLog ? 3 : 6, isLog ? "~s" : null).tickSize(4))
    .call(a => a.select(".domain").remove());
});

const div = d3.scaleDiverging([-10, 0, 40], d3.interpolateRdBu);
log("diverging(0) is the neutral middle:", div(0));
log("interpolator(0.5):", d3.interpolateRdBu(0.5));
`}
      />
      <Callout type="warning" title="Pick scales for the data, not the look">
        <p>
          Use sequential ramps for magnitudes, diverging only when there&apos;s a meaningful midpoint, and categorical
          schemes only for unordered categories. A rainbow scheme on ordered data (or a sequential ramp on categories)
          actively misleads. Also check your palettes for color-blind safety — viridis, cividis and the ColorBrewer
          schemes are good defaults.
        </p>
      </Callout>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.scaleBand(domain, range)", "Categories → equal bands. x(v) = band start."],
          ["band.bandwidth() · band.step()", "Width of each band; distance between band starts."],
          ["band.padding · paddingInner · paddingOuter", "Gaps as a fraction of the step."],
          ["band.align(a) · band.round(bool)", "Distribute outer space; snap to pixels."],
          ["d3.scalePoint(domain, range)", "Categories → evenly spaced points (bandwidth 0)."],
          ["d3.scaleOrdinal(domain, range)", "Discrete → discrete, cycling range. Implicit domain if unset."],
          ["ordinal.unknown(value)", "Return value for unseen inputs instead of growing the domain."],
          ["d3.scaleQuantize(domain, range)", "Continuous → discrete, equal-width buckets."],
          ["d3.scaleQuantile(data, range)", "Continuous → discrete, equal-count buckets from a sample."],
          ["d3.scaleThreshold(thresholds, range)", "Continuous → discrete at explicit cutoffs (n thresholds, n+1 outputs)."],
          ["scale.invertExtent(output)", "[min, max] of inputs that map to output (quantize/quantile/threshold)."],
          ["quantize.thresholds() · quantile.quantiles()", "The computed bucket boundaries."],
          ["d3.scaleSequential(domain, interpolator)", "Continuous → interpolator(t). Also Log/Sqrt/Pow/Symlog/Quantile variants."],
          ["d3.scaleDiverging([lo, mid, hi], interp)", "Like sequential with a midpoint mapped to t = 0.5."],
          ["d3.scheme* · d3.interpolate*", "Categorical arrays and continuous interpolators from d3-scale-chromatic."],
        ]}
      />
      <CodeBlock>{`
// quick recipes
const x = d3.scaleBand(categories, [0, width]).padding(0.1);   // bar chart x
const color = d3.scaleOrdinal(categories, d3.schemeTableau10);  // series colors
const fill = d3.scaleQuantize([0, 100], d3.schemeGreens[5]);    // 5-class map
const heat = d3.scaleSequential([0, max], d3.interpolateInferno); // heatmap
`}</CodeBlock>

      <Exercises
        items={[
          <>In the band demo, add a row with <code>.round(true)</code> and a range that doesn&apos;t divide evenly. What changes?</>,
          <>
            Build a vertical bar chart using <code>scaleBand</code> for x and <code>scaleLinear</code> for y, with
            bars colored by a <code>scaleOrdinal</code>.
          </>,
          <>
            In the bucketing demo, change the data to a uniform distribution (<code>d3.randomUniform</code>). How do
            quantize and quantile compare now?
          </>,
          <>
            Write a <code>legend(color)</code> function that draws a swatch + label for any{" "}
            <code>scaleQuantize</code> using <code>invertExtent</code> and <code>d3.format</code>.
          </>,
        ]}
      />
    </>
  );
}
