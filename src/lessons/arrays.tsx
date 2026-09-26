import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Before you can draw data you almost always have to <em>shape</em> it: find its range for a scale, group it by
        category, count things, bin it into a histogram, or look up the point under the mouse.{" "}
        <strong>d3-array</strong> is D3&apos;s toolbox for that. None of it touches the DOM — these are pure
        functions on plain JavaScript arrays and iterables, and they are useful even in projects that don&apos;t draw
        anything.
      </p>
      <p>
        Two conventions run through the whole module. First, almost every function accepts an optional{" "}
        <strong>accessor</strong> <code>(d, i, data) =&gt; value</code>, so you rarely need to <code>map</code>{" "}
        first. Second, the statistics functions <strong>ignore</strong> <code>null</code>, <code>undefined</code> and{" "}
        <code>NaN</code> — unlike <code>Math.max</code>, which returns <code>NaN</code> as soon as one value is
        missing.
      </p>

      <h2>Summary statistics</h2>
      <Playground
        title="extent, min, max, sum, mean, median, quantile…"
        hideOutput
        code={`
const cities = [
  { name: "São Paulo", pop: 22.4, area: 7947 },
  { name: "Lisbon",    pop: 2.9,  area: 3015 },
  { name: "Tokyo",     pop: 37.1, area: 13452 },
  { name: "Lagos",     pop: 15.9, area: 1171 },
  { name: "Oslo",      pop: 1.1,  area: 454 },
  { name: "Unknown",   pop: null, area: 1000 },   // missing value: ignored
];

log("min / max:", d3.min(cities, d => d.pop), d3.max(cities, d => d.pop));
log("extent:", d3.extent(cities, d => d.pop));           // [min, max] — perfect for scale.domain
log("sum:", d3.sum(cities, d => d.pop));
log("mean:", d3.mean(cities, d => d.pop));
log("median:", d3.median(cities, d => d.pop));
log("quantile 0.25 / 0.75:", d3.quantile(cities, 0.25, d => d.pop), d3.quantile(cities, 0.75, d => d.pop));
log("variance:", d3.variance(cities, d => d.pop).toFixed(2));
log("deviation:", d3.deviation(cities, d => d.pop).toFixed(2));
log("mode of [1,2,2,3]:", d3.mode([1, 2, 2, 3]));
log("count (valid numbers):", d3.count(cities, d => d.pop));

// Which datum? greatest/least return the element, maxIndex/minIndex the index
log("largest city:", d3.greatest(cities, d => d.pop).name);
log("densest city:", d3.greatest(cities, d => d.pop / d.area).name);
log("index of smallest area:", d3.minIndex(cities, d => d.area));

log("Math.max with a NaN:", String(Math.max(...[3, null, NaN])), " vs d3.max:", d3.max([3, null, NaN]));
`}
      />
      <Callout type="warning">
        <p>
          <code>d3.min</code> and <code>d3.max</code> compare <em>natural order</em>, so strings compare
          lexicographically: <code>d3.max([&quot;10&quot;, &quot;9&quot;])</code> is <code>&quot;9&quot;</code>.
          Values loaded from CSV are strings until you convert them — coerce with <code>+d.value</code> in the
          accessor or use <code>d3.autoType</code> when loading. <code>d3.sum</code> and <code>d3.mean</code> coerce
          for you, which can hide the bug.
        </p>
      </Callout>

      <h2>Grouping: group, rollup, index</h2>
      <p>
        <code>d3.group(data, ...keys)</code> returns a <code>Map</code> from key to the array of matching elements.
        Pass several key functions to nest: <code>d3.group(data, d =&gt; d.region, d =&gt; d.year)</code> gives a Map
        of Maps. <code>d3.rollup(data, reduce, ...keys)</code> is the same, but each group is <em>reduced</em> to a
        single value (a count, a sum…). The variants:
      </p>
      <ul>
        <li>
          <code>groups</code> / <code>rollups</code> — return nested <code>[key, value]</code> arrays instead of Maps
          (easy to sort and to bind with <code>.data()</code>).
        </li>
        <li>
          <code>index</code> / <code>indexes</code> — like group, but each key must be <em>unique</em>; returns the
          single element (throws on duplicates). Ideal for lookups by id.
        </li>
        <li>
          <code>flatGroup</code> / <code>flatRollup</code> — flatten nested keys into rows like{" "}
          <code>[key1, key2, value]</code>, handy for tables.
        </li>
      </ul>
      <Playground
        title="Group and summarize sales"
        hideOutput
        code={`
const sales = [
  { id: 1, region: "North", product: "Coffee", units: 120, year: 2024 },
  { id: 2, region: "North", product: "Tea",    units: 80,  year: 2024 },
  { id: 3, region: "South", product: "Coffee", units: 200, year: 2024 },
  { id: 4, region: "South", product: "Tea",    units: 40,  year: 2025 },
  { id: 5, region: "North", product: "Coffee", units: 150, year: 2025 },
  { id: 6, region: "South", product: "Coffee", units: 170, year: 2025 },
];

const byRegion = d3.group(sales, d => d.region);
log("group → Map keys:", [...byRegion.keys()], "North has", byRegion.get("North").length, "rows");

log("rollup: units by region", d3.rollup(sales, v => d3.sum(v, d => d.units), d => d.region));

log("nested rollup: region → product → units",
  d3.rollup(sales, v => d3.sum(v, d => d.units), d => d.region, d => d.product));

// rollups returns arrays → easy to sort
const ranked = d3.rollups(sales, v => d3.sum(v, d => d.units), d => d.product)
  .sort((a, b) => d3.descending(a[1], b[1]));
log("rollups sorted:", ranked);

log("flatRollup:", d3.flatRollup(sales, v => v.length, d => d.region, d => d.year));

const byId = d3.index(sales, d => d.id);
log("index lookup id 3:", byId.get(3));
`}
      />

      <h2>Binning: d3.bin and histograms</h2>
      <p>
        <code>d3.bin()</code> groups continuous values into intervals. Configure it with <code>.value</code>{" "}
        (accessor), <code>.domain</code> (default: the extent) and <code>.thresholds</code> — a count (a
        <em> hint</em>, which D3 rounds to nice boundaries), an explicit array of boundaries, or a function like{" "}
        <code>d3.thresholdSturges</code>, <code>d3.thresholdScott</code> or{" "}
        <code>d3.thresholdFreedmanDiaconis</code>. Each returned bin is an array of the values in it, with extra{" "}
        <code>x0</code> (inclusive) and <code>x1</code> (exclusive) properties.
      </p>
      <Playground
        title="Histogram with adjustable thresholds"
        code={`
const W = 640, H = 300, m = { top: 20, right: 20, bottom: 36, left: 40 };
// 1,000 simulated delivery times: a mix of two log-normal populations
const rng = d3.randomLcg(9);
const fast = d3.randomLogNormal.source(rng)(3.2, 0.25);
const slow = d3.randomLogNormal.source(rng)(3.9, 0.2);
const values = d3.range(1000).map(i => (i % 4 === 0 ? slow() : fast()));

const label = d3.select(el).append("label").style("font", "12px sans-serif");
label.append("span").text("thresholds hint: ");
const input = label.append("input").attr("type", "range").attr("min", 3).attr("max", 80).property("value", 25);
const out = label.append("span").style("margin-left", "8px");

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
const x = d3.scaleLinear().domain(d3.extent(values)).nice().range([m.left, W - m.right]);
const y = d3.scaleLinear().range([H - m.bottom, m.top]);
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x))
  .append("text").attr("x", W - m.right).attr("y", 32).attr("fill", "black").attr("text-anchor", "end")
    .text("Delivery time (minutes) →");
const yAxis = svg.append("g").attr("transform", \`translate(\${m.left},0)\`);
const bars = svg.append("g").attr("fill", "#5c7cfa");

function render() {
  const bin = d3.bin().domain(x.domain()).thresholds(+input.property("value"));
  const bins = bin(values);
  out.text(bins.length + " bins, width " + (bins[0].x1 - bins[0].x0));
  y.domain([0, d3.max(bins, b => b.length)]).nice();
  yAxis.call(d3.axisLeft(y).ticks(5));
  bars.selectAll("rect").data(bins).join("rect")
      .attr("x", b => x(b.x0) + 1)
      .attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 1))
      .attr("y", b => y(b.length))
      .attr("height", b => y(0) - y(b.length));
}
input.on("input", render);
render();

log("Sturges:", d3.bin().thresholds(d3.thresholdSturges)(values).length, "bins;",
    "Freedman–Diaconis:", d3.bin().thresholds(d3.thresholdFreedmanDiaconis)(values).length, "bins");
`}
      />
      <Callout type="tip">
        <p>
          Always pass the scale&apos;s domain to the bin generator (<code>.domain(x.domain())</code>) after calling{" "}
          <code>.nice()</code> on the scale. Otherwise the first and last bins may be narrower than the others,
          which visually distorts the histogram.
        </p>
      </Callout>

      <h2>Ticks, nice and range</h2>
      <p>
        Scales use these helpers internally, but they are handy on their own. <code>d3.ticks(start, stop, count)</code>{" "}
        returns about <code>count</code> &quot;nice&quot; values (multiples of 1, 2 or 5 × 10ⁿ).{" "}
        <code>d3.nice</code> expands an interval to round boundaries, and <code>d3.range</code> is the Python-style
        sequence generator.
      </p>
      <Playground
        title="ticks, tickStep, nice, range"
        hideOutput
        code={`
log("ticks(0, 1, 5):", d3.ticks(0, 1, 5));
log("ticks(-3.7, 93.1, 10):", d3.ticks(-3.7, 93.1, 10));
log("tickStep(0, 1000, 7):", d3.tickStep(0, 1000, 7));
log("tickIncrement(0, 1000, 7):", d3.tickIncrement(0, 1000, 7));
log("nice(0.21, 9.87, 10):", d3.nice(0.21, 9.87, 10));
log("range(5):", d3.range(5));
log("range(0, 1, 0.25):", d3.range(0, 1, 0.25));
log("range(10, 0, -3):", d3.range(10, 0, -3));
`}
      />

      <h2>Bisecting: finding the point under the mouse</h2>
      <p>
        For a sorted array, binary search finds where a value belongs in O(log n). <code>d3.bisector(accessor)</code>{" "}
        creates a bisector for objects; its <code>.left</code>/<code>.right</code> return an insertion index, and{" "}
        <code>.center</code> returns the index of the <em>closest</em> element — exactly what you need for a hover
        tooltip on a time series. Invert the pointer position through the x scale, then bisect.
      </p>
      <Playground
        title="Hover lookup with bisector.center"
        code={`
const W = 640, H = 280, m = { top: 20, right: 30, bottom: 30, left: 46 };
const rnd = d3.randomNormal.source(d3.randomLcg(21))(0.4, 3);
let v = 100;
const data = d3.timeDay.range(new Date(2025, 0, 1), new Date(2025, 6, 1))
  .map(date => ({ date, value: (v = Math.max(20, v + rnd())) }));   // sorted by date

const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([m.left, W - m.right]);  // local dates → scaleTime
const y = d3.scaleLinear().domain(d3.extent(data, d => d.value)).nice().range([H - m.bottom, m.top]);
const bisect = d3.bisector(d => d.date).center;

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x).ticks(6));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y).ticks(5, "$~s"));
svg.append("path").datum(data)
    .attr("d", d3.line(d => x(d.date), d => y(d.value)))
    .attr("fill", "none").attr("stroke", "#0ca678").attr("stroke-width", 1.8);

const focus = svg.append("g").style("display", "none");
focus.append("line").attr("y1", m.top).attr("y2", H - m.bottom).attr("stroke", "#adb5bd");
focus.append("circle").attr("r", 4.5).attr("fill", "#0ca678").attr("stroke", "white").attr("stroke-width", 2);
const tip = focus.append("text").attr("y", m.top).attr("dy", "0.7em").attr("font-weight", "bold");
const fmt = d3.timeFormat("%b %d");

svg.append("rect").attr("x", m.left).attr("y", m.top)
    .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom)
    .attr("fill", "transparent")
  .on("pointermove", (event) => {
    const [px] = d3.pointer(event);
    const i = bisect(data, x.invert(px));          // index of closest date
    const d = data[i];
    focus.style("display", null);
    focus.select("line").attr("x1", x(d.date)).attr("x2", x(d.date));
    focus.select("circle").attr("cx", x(d.date)).attr("cy", y(d.value));
    tip.attr("x", x(d.date) + (x(d.date) > W / 2 ? -8 : 8))
       .attr("text-anchor", x(d.date) > W / 2 ? "end" : "start")
       .text(fmt(d.date) + ": $" + d.value.toFixed(2));
  })
  .on("pointerleave", () => focus.style("display", "none"));

log("bisectLeft([1,2,2,3], 2) =", d3.bisectLeft([1, 2, 2, 3], 2), "; bisectRight =", d3.bisectRight([1, 2, 2, 3], 2));
`}
      />

      <h2>Sorting, ranking and transforming</h2>
      <p>
        <code>d3.ascending</code> and <code>d3.descending</code> are comparators that handle mixed types and put{" "}
        <code>undefined</code>/<code>NaN</code> last. <code>d3.sort(iterable, ...accessors)</code> returns a{" "}
        <em>new</em> sorted array (unlike <code>Array.prototype.sort</code>, which mutates) and accepts accessors
        directly. A few more transforms are indispensable:
      </p>
      <Playground
        title="sort, rank, cumsum, cross, pairs, zip, merge, blur"
        hideOutput
        code={`
const people = [
  { name: "Ana", age: 31, team: "B" }, { name: "Bo", age: 25, team: "A" },
  { name: "Cy", age: 31, team: "A" },  { name: "Di", age: 42, team: "B" },
];
// multiple accessors = tie-breakers
log("sort by age, then name:", d3.sort(people, d => d.age, d => d.name).map(d => d.name));
log("sort with comparator:", d3.sort(people, (a, b) => d3.descending(a.age, b.age)).map(d => d.name));
log("original untouched:", people.map(d => d.name));

log("rank ages:", Array.from(d3.rank(people, d => d.age)));        // ties share a rank
log("cumsum:", Array.from(d3.cumsum([10, 20, 5, 15])));

log("cross:", d3.cross(["a", "b"], [1, 2]));
log("cross with reducer:", d3.cross(["x", "y"], [1, 2], (a, b) => a + b));
log("pairs:", d3.pairs([1, 4, 9, 16], (a, b) => b - a));    // successive differences
log("zip:", d3.zip(["a", "b", "c"], [1, 2, 3]));
log("transpose:", d3.transpose([[1, 2, 3], [4, 5, 6]]));
log("merge:", d3.merge([[1, 2], [3], [4, 5]]));
log("shuffle (seeded):", d3.shuffler(d3.randomLcg(1))(d3.range(8)));

// blur: smooth an array in place (box blur applied 3x ≈ gaussian)
const spiky = [0, 0, 0, 10, 0, 0, 0, 0, 10, 0];
log("blur radius 1:", Array.from(d3.blur(spiky.slice(), 1), v => +v.toFixed(2)));
`}
      />

      <h2>InternMap, InternSet and set operations</h2>
      <p>
        JavaScript <code>Map</code> and <code>Set</code> compare keys by <em>identity</em>, so two{" "}
        <code>Date</code> objects for the same instant are different keys. <code>d3.InternMap</code> and{" "}
        <code>d3.InternSet</code> &quot;intern&quot; keys by their primitive value (<code>valueOf()</code>), so dates
        behave. This is why <code>d3.group</code> keyed by dates just works — it returns InternMaps.
      </p>
      <Playground
        title="Dates as keys and set operations"
        hideOutput
        code={`
const a = new Date(2025, 0, 1), b = new Date(2025, 0, 1);

const plain = new Map([[a, "hello"]]);
log("Map.get with equal date:", plain.get(b));           // undefined!

const interned = new d3.InternMap([[a, "hello"]]);
log("InternMap.get with equal date:", interned.get(b));   // "hello"

const days = new d3.InternSet([a, b, new Date(2025, 0, 2)]);
log("InternSet size (dedupes dates):", days.size);

const events = [{ day: new Date(2025, 0, 1) }, { day: new Date(2025, 0, 1) }, { day: new Date(2025, 0, 2) }];
const counts = d3.rollup(events, v => v.length, d => d.day);
log("rollup by date → InternMap?", counts instanceof d3.InternMap, "count on Jan 1:", counts.get(new Date(2025, 0, 1)));

// set operations return InternSets
log("union:", [...d3.union([1, 2, 3], [3, 4])]);
log("intersection:", [...d3.intersection([1, 2, 3], [2, 3, 4], [3, 2])]);
log("difference:", [...d3.difference([1, 2, 3, 4], [2, 4])]);
log("superset?", d3.superset([1, 2, 3], [1, 3]), " disjoint?", d3.disjoint([1, 2], [3, 4]));
`}
      />

      <h2>Iterable helpers</h2>
      <p>
        D3 also offers array-method equivalents that work on <em>any</em> iterable (Sets, Maps, generators):{" "}
        <code>d3.filter</code>, <code>d3.map</code>, <code>d3.reduce</code>, <code>d3.some</code>,{" "}
        <code>d3.every</code>, <code>d3.reverse</code>. They are useful for the values of a Map without converting to
        an array first:
      </p>
      <CodeBlock>{`
const totals = d3.rollup(sales, v => d3.sum(v, d => d.units), d => d.region);
d3.max(totals.values());                    // works on iterables directly
d3.filter(totals.keys(), k => k !== "N/A"); // → array
`}</CodeBlock>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.min / max / extent(it, acc?)", "Minimum, maximum, or [min, max]; ignores null/NaN."],
          ["d3.sum / mean / median / mode", "Totals and central tendency."],
          ["d3.quantile(it, p, acc?)", "p-quantile (0..1); quantileSorted for pre-sorted data."],
          ["d3.variance / deviation", "Sample variance and standard deviation."],
          ["d3.least / greatest / minIndex / maxIndex", "Return the element (or index) with the smallest/largest value."],
          ["d3.group / groups / rollup / rollups", "Group into (nested) Maps or arrays, optionally reducing each group."],
          ["d3.index / indexes", "Like group with unique keys — one element per key."],
          ["d3.flatGroup / flatRollup", "Grouped results as flat [key1, key2, …, value] rows."],
          ["d3.bin()", "Histogram generator: .value, .domain, .thresholds; bins have x0/x1."],
          ["d3.ticks / tickStep / nice", "Nice human-friendly values and intervals."],
          ["d3.range(start, stop, step)", "Arithmetic sequence."],
          ["d3.bisector(acc).left/right/center", "Binary search in a sorted array; center = closest."],
          ["d3.sort / ascending / descending", "Non-mutating sort with accessors; comparators."],
          ["d3.rank / cumsum", "Rank of each value; running totals (Float64Array)."],
          ["d3.cross / pairs / zip / transpose / merge", "Cartesian product, neighbors, column/row reshaping, flatten."],
          ["d3.shuffle / shuffler(random)", "In-place Fisher–Yates shuffle, optionally seeded."],
          ["d3.blur / blur2", "In-place smoothing of 1D / 2D numeric arrays."],
          ["d3.InternMap / InternSet", "Map/Set keyed by primitive value (dates work)."],
          ["d3.union / intersection / difference / superset / subset / disjoint", "Set algebra on iterables."],
        ]}
      />

      <Exercises
        items={[
          <>
            In the sales example, compute each product&apos;s <em>share</em> of total units per region (hint: a nested
            rollup, then divide by <code>d3.sum</code> of the region).
          </>,
          <>
            Add a box plot to the histogram: draw the 25th, 50th and 75th percentiles (<code>d3.quantile</code>) as
            vertical lines over the bars.
          </>,
          <>
            Change the histogram to use explicit thresholds every 5 minutes with{" "}
            <code>.thresholds(d3.range(0, 100, 5))</code>. What happens to values above 100?
          </>,
          <>
            In the bisector chart, show the change from the first day of the month in the tooltip (use{" "}
            <code>d3.timeMonth.floor</code> and another bisect).
          </>,
          <>
            Use <code>d3.pairs</code> to compute day-over-day percentage changes in the bisector data and find the
            biggest drop with <code>d3.least</code>.
          </>,
        ]}
      />
    </>
  );
}
