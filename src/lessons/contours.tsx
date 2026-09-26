import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        A contour line (or <em>isoline</em>) connects points that share the same value — the lines on a topographic
        map, isobars on a weather chart. <code>d3-contour</code> computes them from a grid of numbers using the{" "}
        <strong>marching squares</strong> algorithm, and can also estimate a smooth density surface from scattered
        points and contour that. We&apos;ll finish with <code>d3-polygon</code>, a tiny module of geometry helpers for
        areas, centroids, convex hulls and hit testing.
      </p>

      <h2>From a grid to contours</h2>
      <p>
        The input to <code>d3.contours()</code> is a flat array of <code>n × m</code> values in row-major order:
        the value for column <code>i</code>, row <code>j</code> lives at index <code>i + j * n</code>. You typically
        fill it by sampling a function, reading pixels from an image, or loading a raster dataset.
      </p>
      <CodeBlock>{`
const n = 240, m = 160;                       // grid columns × rows
const values = new Float64Array(n * m);
for (let j = 0; j < m; j++) {
  for (let i = 0; i < n; i++) {
    values[i + j * n] = f(x(i), y(j));        // sample your function
  }
}
const contours = d3.contours()
    .size([n, m])                             // required: grid dimensions
    .thresholds(20)                           // ~20 "nice" levels, or an explicit array
  (values);                                   // → array of GeoJSON MultiPolygons
`}</CodeBlock>
      <p>
        Each returned object is a GeoJSON <code>MultiPolygon</code> with an extra <code>value</code> property: the
        region where the grid is <strong>greater than or equal to</strong> that threshold. Because the regions nest
        (the ≥ 100 region contains the ≥ 200 region), drawing them in order from lowest to highest threshold produces
        a filled contour plot. The coordinates are in grid units — <code>[0, n] × [0, m]</code> — so you render them
        with <code>d3.geoPath</code> and either a <code>d3.geoIdentity()</code> projection that scales them to
        pixels, or a null projection plus an SVG <code>transform</code>.
      </p>
      <ApiTable
        rows={[
          ["d3.contours()", "Create a contour generator with default settings."],
          ["contours.size([n, m])", "The grid dimensions. Values must have length n × m."],
          ["contours.thresholds(count | array | fn)", "Threshold levels: a count (nice levels via Sturges-like ticks), an explicit array, or a function (values) → array."],
          ["contours.smooth(bool)", "Linearly interpolate contour vertices between grid points (default true). False gives a blocky staircase."],
          ["contours(values)", "Compute contours for all thresholds → array of MultiPolygons with .value."],
          ["contours.contour(values, threshold)", "Compute a single MultiPolygon for one threshold."],
        ]}
      />
      <p>
        Here is the Goldstein–Price function, a classic optimization test surface whose values span many orders of
        magnitude — so we use power-of-two thresholds and a <em>log</em> color scale.
      </p>
      <Playground
        title="Filled contours of Goldstein–Price"
        code={`
const n = 240, m = 150, W = 640, H = W * m / n;
// Goldstein–Price on x ∈ [-2, 2], y ∈ [-2, 1]
function f(x, y) {
  return (1 + (x + y + 1) ** 2 * (19 - 14 * x + 3 * x * x - 14 * y + 6 * x * y + 3 * y * y))
       * (30 + (2 * x - 3 * y) ** 2 * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y));
}
const values = new Float64Array(n * m);
for (let j = 0; j < m; ++j) {
  for (let i = 0; i < n; ++i) {
    values[i + j * n] = f((i / n) * 4 - 2, 1 - (j / m) * 3);
  }
}
log("value range:", d3.extent(values).map((v) => v.toFixed(1)));

const thresholds = d3.range(1, 21).map((p) => 2 ** p);
const color = d3.scaleSequentialLog(d3.extent(thresholds), d3.interpolateMagma);
const contours = d3.contours().size([n, m]).thresholds(thresholds)(values);

log("first contour:", contours[0].type, "value", contours[0].value, "polygons", contours[0].coordinates.length);

// geoIdentity scales grid units → pixels
const path = d3.geoPath(d3.geoIdentity().scale(W / n));

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("g")
    .attr("stroke", "#fff").attr("stroke-opacity", 0.25).attr("stroke-width", 0.5)
  .selectAll("path")
  .data(contours)
  .join("path")
    .attr("d", path)
    .attr("fill", (d) => color(d.value))
  .append("title")
    .text((d) => "≥ " + d.value.toLocaleString());

// Mark the global minimum at (0, -1) where f = 3
const px = ((0 + 2) / 4) * W, py = ((1 - -1) / 3) * H;
svg.append("circle").attr("cx", px).attr("cy", py).attr("r", 5).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 2);
svg.append("text").attr("x", px + 9).attr("y", py + 4).attr("fill", "white").attr("font-size", 12).text("min f(0,−1) = 3");
`}
      />
      <Callout type="note" title="geoPath with a null projection">
        <p>
          <code>d3.geoPath()</code> (or <code>d3.geoPath(null)</code>) passes coordinates through untouched, so the
          contours come out in grid units. That&apos;s fine if you then scale the containing group with{" "}
          <code>transform=&quot;scale(k)&quot;</code> — just add <code>vector-effect: non-scaling-stroke</code> so
          outlines don&apos;t get fat. The next example uses exactly that approach.
        </p>
      </Callout>

      <h2>smooth() and single contours</h2>
      <p>
        Marching squares looks at each 2×2 block of grid values and decides which edges an isoline crosses. With{" "}
        <code>smooth(true)</code> (the default), the crossing point is placed by linear interpolation between the two
        values; with <code>smooth(false)</code> it sits at the midpoint, producing a pixelated staircase — useful for
        categorical rasters. On a coarse grid the difference is obvious. <code>contours.contour(values, t)</code>{" "}
        computes just one level; drag the slider to sweep the threshold.
      </p>
      <Playground
        title="Coarse grid: smoothing and a single isoline"
        code={`
const n = 24, m = 14, k = 26, W = n * k, H = m * k;
const values = new Float64Array(n * m);
for (let j = 0; j < m; j++)
  for (let i = 0; i < n; i++)
    values[i + j * n] = Math.sin(i / 3.2) * Math.cos(j / 2.6) + Math.sin((i + j) / 7);

const ctl = d3.select(el).append("div").style("font-size", "13px").style("display", "flex").style("gap", "16px").style("align-items", "center");
const label = ctl.append("label");
const smoothBox = label.append("input").attr("type", "checkbox").property("checked", true);
label.append("span").text(" smooth");
ctl.append("span").text("threshold:");
const slider = ctl.append("input").attr("type", "range").attr("min", -1.8).attr("max", 1.8).attr("step", 0.01).attr("value", 0.3);
const readout = ctl.append("span").style("font-family", "monospace");

const color = d3.scaleSequential(d3.interpolateRdBu).domain([2, -2]);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);

// The raw grid: one square per value
svg.append("g").selectAll("rect").data(values).join("rect")
    .attr("x", (v, idx) => (idx % n) * k).attr("y", (v, idx) => Math.floor(idx / n) * k)
    .attr("width", k).attr("height", k).attr("fill", (v) => color(v)).attr("fill-opacity", 0.55);

// Grid units → pixels via a transform; the null projection keeps coordinates as-is
const g = svg.append("g").attr("transform", "scale(" + k + ")");
const region = g.append("path").attr("fill", "#1c1b19").attr("fill-opacity", 0.12);
const line = g.append("path").attr("fill", "none").attr("stroke", "#1c1b19").attr("stroke-width", 2.5)
  .style("vector-effect", "non-scaling-stroke");
const path = d3.geoPath();
const gen = d3.contours().size([n, m]);

function update() {
  const t = +slider.property("value");
  gen.smooth(smoothBox.property("checked"));
  const c = gen.contour(values, t);
  region.attr("d", path(c));
  line.attr("d", path(c));
  readout.text("≥ " + t.toFixed(2) + " · " + c.coordinates.length + " polygon(s)");
}
slider.on("input", update);
smoothBox.on("change", update);
update();
`}
      />

      <h2>Density estimation: contourDensity</h2>
      <p>
        Scatterplots with thousands of overlapping points become blobs. <code>d3.contourDensity()</code> performs a{" "}
        <strong>kernel density estimate</strong>: each point contributes a little Gaussian bump, the bumps are summed
        on a grid, and the resulting surface is contoured. Unlike <code>d3.contours</code>, you give it the raw data
        plus accessors, and it returns contours already in your <em>pixel</em> coordinates.
      </p>
      <ApiTable
        rows={[
          ["d3.contourDensity()", "Create a density contour generator."],
          ["density.x(fn) / .y(fn)", "Pixel position accessors (default d => d[0], d => d[1]). Apply your scales here."],
          ["density.weight(fn)", "Per-point weight (default 1) — e.g. population or sales."],
          ["density.size([w, h])", "The area to estimate over, in pixels (default [960, 500])."],
          ["density.bandwidth(px)", "Standard deviation of the Gaussian kernel in pixels (default 20.4). Bigger = smoother."],
          ["density.thresholds(count | array | fn)", "Density levels to contour."],
          ["density.cellSize(px)", "Grid resolution as a power of two (default 4). Smaller = finer but slower."],
          ["density(data)", "→ array of MultiPolygons; value is the estimated density (points per square pixel)."],
          ["density.contours(data)", "→ a function contour(threshold) plus .max, for computing individual levels cheaply."],
        ]}
      />
      <Playground
        title="Two Gaussian clusters with density contours"
        code={`
const W = 640, H = 400, m = { t: 16, r: 16, b: 32, l: 40 };
const rand = d3.randomLcg(3);
const nA = d3.randomNormal.source(rand);
const data = [
  ...Array.from({ length: 700 }, () => ({ x: nA(3, 1.1)(), y: nA(4, 0.8)(), g: "A" })),
  ...Array.from({ length: 500 }, () => ({ x: nA(7, 0.7)(), y: nA(7, 1.3)(), g: "B" })),
];

const x = d3.scaleLinear().domain([0, 10]).range([m.l, W - m.r]);
const y = d3.scaleLinear().domain([0, 10]).range([H - m.b, m.t]);

const ctl = d3.select(el).append("div").style("font-size", "13px");
ctl.append("span").text("bandwidth: ");
const bw = ctl.append("input").attr("type", "range").attr("min", 4).attr("max", 50).attr("value", 18);
const bwOut = ctl.append("span").style("font-family", "monospace").style("margin-left", "6px");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const clip = svg.append("clipPath").attr("id", "density-clip")
  .append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b);
const gC = svg.append("g").attr("clip-path", "url(#density-clip)");
svg.append("g").attr("transform", "translate(0," + (H - m.b) + ")").call(d3.axisBottom(x));
svg.append("g").attr("transform", "translate(" + m.l + ",0)").call(d3.axisLeft(y));
svg.append("g").selectAll("circle").data(data).join("circle")
    .attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 1.4)
    .attr("fill", "#1c1b19").attr("fill-opacity", 0.45);

function update() {
  const b = +bw.property("value");
  bwOut.text(b + "px");
  const contours = d3.contourDensity()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .size([W, H])
      .bandwidth(b)
      .thresholds(14)
    (data);
  const color = d3.scaleSequential(d3.interpolateYlGnBu).domain([0, d3.max(contours, (d) => d.value)]);
  gC.selectAll("path").data(contours).join("path")
      .attr("d", d3.geoPath())
      .attr("fill", (d) => color(d.value))
      .attr("stroke", "#0b4f6c").attr("stroke-opacity", 0.35).attr("stroke-width", 0.6);
  log("bandwidth", b, "→", contours.length, "levels, peak density", d3.max(contours, (d) => d.value).toExponential(2));
}
bw.on("input", update);
update();
`}
      />
      <Callout type="warning" title="Density values depend on everything">
        <p>
          The <code>value</code> of a density contour is in <em>points per square pixel</em> (times weight). It changes
          with the chart size, the bandwidth and the number of points, so don&apos;t compare raw values across charts —
          use a color scale whose domain is computed from the contours themselves, or normalize by the total.
        </p>
      </Callout>

      <h2>Smoothing a noisy grid with d3.blur2</h2>
      <p>
        Real rasters are noisy, and contouring noise gives you confetti. <code>d3.blur2({"{"}data, width, height{"}"}, rx, ry?)</code>{" "}
        (from d3-array) applies a fast approximate Gaussian blur <em>in place</em> to a flat grid, and{" "}
        <code>d3.blur(array, r)</code> does the same in one dimension. Blur first, then contour. (It&apos;s also what{" "}
        <code>contourDensity</code> uses internally to spread each point.)
      </p>
      <Playground
        title="Contours of noise, before and after blur2"
        code={`
const n = 120, m = 72, k = 640 / n, W = 640, H = m * k;
const rand = d3.randomLcg(42);
const raw = Float64Array.from({ length: n * m }, (_, idx) => {
  const i = idx % n, j = Math.floor(idx / n);
  return Math.sin(i / 14) + Math.cos(j / 10) + (rand() - 0.5) * 3;   // signal + heavy noise
});

const ctl = d3.select(el).append("div").style("font-size", "13px");
ctl.append("span").text("blur radius: ");
const slider = ctl.append("input").attr("type", "range").attr("min", 0).attr("max", 12).attr("value", 4);
const out = ctl.append("span").style("font-family", "monospace").style("margin-left", "6px");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const g = svg.append("g");
const path = d3.geoPath(d3.geoIdentity().scale(k));
const color = d3.scaleSequential(d3.interpolateViridis).domain([-2, 2]);

function update() {
  const r = +slider.property("value");
  const grid = { data: raw.slice(), width: n, height: m };   // copy: blur2 mutates
  d3.blur2(grid, r);
  const contours = d3.contours().size([n, m]).thresholds(d3.range(-2.5, 2.6, 0.5))(grid.data);
  g.selectAll("path").data(contours).join("path")
      .attr("d", path).attr("fill", (d) => color(d.value))
      .attr("stroke", "white").attr("stroke-width", 0.4);
  const rings = d3.sum(contours, (c) => c.coordinates.length);
  out.text(r + " → " + rings + " polygons");
}
slider.on("input", update);
update();
`}
      />

      <h2>d3-polygon: geometry helpers</h2>
      <p>
        A polygon in d3-polygon is just an array of <code>[x, y]</code> points (closing point optional). The module is
        small but handy everywhere — including on the rings of contour MultiPolygons.
      </p>
      <ApiTable
        rows={[
          ["d3.polygonArea(polygon)", "Signed area: positive if the vertices are counterclockwise (in y-up coordinates), negative if clockwise. In SVG's y-down space the sign flips — take Math.abs if you only need size."],
          ["d3.polygonCentroid(polygon)", "The centroid (center of mass) [x, y]."],
          ["d3.polygonHull(points)", "Convex hull of a set of points (Andrew's monotone chain), or null if fewer than 3 points."],
          ["d3.polygonContains(polygon, [x, y])", "True if the point is inside (ray casting). Works for concave polygons too."],
          ["d3.polygonLength(polygon)", "Perimeter length, including the closing segment."],
        ]}
      />
      <p>
        Click to add points. The dashed line is your polygon in click order; the filled shape is its convex hull. Move
        the pointer around to see <code>polygonContains</code> at work against both shapes.
      </p>
      <Playground
        title="Interactive convex hull"
        code={`
const W = 640, H = 380;
let points = [[180, 120], [300, 80], [420, 150], [380, 270], [240, 300], [300, 190]];

const bar = d3.select(el).append("div").style("font-size", "13px").style("display", "flex").style("gap", "10px").style("align-items", "center");
bar.append("button").text("Clear").style("padding", "2px 10px").style("border", "1px solid #ccc").style("border-radius", "6px")
  .on("click", () => { points = []; draw(); });
bar.append("button").text("Random 30").style("padding", "2px 10px").style("border", "1px solid #ccc").style("border-radius", "6px")
  .on("click", () => {
    const r = d3.randomNormal(0, 70);
    points = Array.from({ length: 30 }, () => [W / 2 + r(), H / 2 + r() * 0.7]);
    draw();
  });
const info = bar.append("span").style("font-variant-numeric", "tabular-nums");

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H])
  .style("cursor", "crosshair").style("background", "#f8f9fa").style("border-radius", "8px");
const hullPath = svg.append("path").attr("stroke", "#1971c2").attr("stroke-width", 2).attr("stroke-linejoin", "round");
const polyPath = svg.append("path").attr("fill", "none").attr("stroke", "#495057").attr("stroke-dasharray", "4 4");
const gDots = svg.append("g");
const centroid = svg.append("g").attr("display", "none");
centroid.append("path").attr("d", "M-7,0H7M0,-7V7").attr("stroke", "#e8590c").attr("stroke-width", 2.5);
centroid.append("text").attr("x", 9).attr("y", -6).attr("font-size", 11).attr("fill", "#e8590c").text("centroid");
const status = svg.append("text").attr("x", 10).attr("y", H - 12).attr("font-size", 12).attr("font-weight", 600);

let pointer = null;
function draw() {
  const hull = d3.polygonHull(points);
  gDots.selectAll("circle").data(points).join("circle")
      .attr("cx", (d) => d[0]).attr("cy", (d) => d[1]).attr("r", 4.5)
      .attr("fill", "#1c1b19").attr("stroke", "white").attr("stroke-width", 1.5);
  polyPath.attr("d", points.length > 1 ? "M" + points.join("L") + "Z" : null);
  if (!hull) {
    hullPath.attr("d", null); centroid.attr("display", "none");
    info.text("add at least 3 points"); status.text("");
    return;
  }
  const inside = pointer && d3.polygonContains(hull, pointer);
  const insidePoly = pointer && points.length > 2 && d3.polygonContains(points, pointer);
  hullPath.attr("d", "M" + hull.join("L") + "Z").attr("fill", inside ? "#a5d8ff" : "#d0ebff").attr("fill-opacity", 0.8);
  const [cx, cy] = d3.polygonCentroid(hull);
  centroid.attr("display", null).attr("transform", "translate(" + cx + "," + cy + ")");
  info.text(
    "hull: " + hull.length + " vertices · area " + Math.abs(d3.polygonArea(hull)).toFixed(0) +
    "px² · perimeter " + d3.polygonLength(hull).toFixed(0) + "px"
  );
  status.text(pointer ? "pointer inside hull: " + !!inside + " · inside dashed polygon: " + !!insidePoly : "");
}

svg.on("click", (event) => { points.push(d3.pointer(event)); draw(); })
   .on("pointermove", (event) => { pointer = d3.pointer(event); draw(); })
   .on("pointerleave", () => { pointer = null; draw(); });
draw();
log("signed area of hull:", d3.polygonArea(d3.polygonHull(points)).toFixed(1), "(positive: polygonHull is counterclockwise in y-up terms, i.e. clockwise on screen)");
`}
      />
      <Callout type="tip" title="Combining the modules">
        <p>
          Contour MultiPolygons are arrays of polygons, each an array of rings (outer ring first, then holes). So{" "}
          <code>d3.polygonArea(contour.coordinates[0][0])</code> gives the area of the first region, and{" "}
          <code>polygonCentroid</code> is a quick way to place a label on each blob of a density plot.
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            Replace Goldstein–Price with <code>Math.sin(x * y)</code> or the Rosenbrock function and choose thresholds
            and a color scale that suit its value range. Add labeled isolines by drawing only the stroke for every
            fifth threshold.
          </>,
          <>
            In the density example, give group B a weight of 3 using <code>density.weight</code>. How does the picture
            change? Then try <code>cellSize(1)</code> and <code>cellSize(16)</code>.
          </>,
          <>
            Label each density region: for every contour, compute the centroid of its largest ring (by{" "}
            <code>Math.abs(d3.polygonArea(ring))</code>) and place the threshold value there.
          </>,
          <>
            Load an image onto a hidden canvas, read its brightness with <code>getImageData</code>, blur it with{" "}
            <code>d3.blur2</code>, and draw it as a contour map.
          </>,
          <>
            In the hull demo, color each clicked point by whether it lies on the hull, and show the ratio of the dashed
            polygon&apos;s area to the hull&apos;s area.
          </>,
        ]}
      />
    </>
  );
}
