import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Zooming and panning let readers explore more detail than fits on screen: maps, dense scatterplots, long time
        series. <strong>d3-zoom</strong> handles the hard parts: mouse wheel, drag to pan, pinch on touch screens,
        double-click to zoom, and smooth animated transitions. It gives you one simple thing back, a{" "}
        <strong>transform</strong>, and you decide how to apply it.
      </p>

      <h2>The zoom behavior</h2>
      <p>
        <code>d3.zoom()</code> creates a <em>behavior</em>. Like axes, you apply it with{" "}
        <code>selection.call(zoom)</code>. This adds the event listeners to that element. Whenever the user zooms or
        pans, the behavior fires a <code>zoom</code> event. <code>event.transform</code> holds the new transform.
        The simplest use is to copy that transform onto a <code>&lt;g&gt;</code> that holds all the content:
      </p>
      <Playground
        title="Zooming a group"
        code={`
const W = 640, H = 360;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("background", "#f8f9fb").style("cursor", "grab");
const g = svg.append("g");

// some content: a hex grid of circles
const rng = d3.randomLcg(5);
const pts = [];
for (let row = 0; row < 20; row++)
  for (let col = 0; col < 34; col++)
    pts.push([col * 20 + (row % 2) * 10, row * 18, rng()]);
g.selectAll("circle").data(pts).join("circle")
  .attr("cx", d => d[0]).attr("cy", d => d[1]).attr("r", 7)
  .attr("fill", d => d3.interpolateYlGnBu(0.2 + d[2] * 0.8));

const zoom = d3.zoom()
  .scaleExtent([0.5, 12])                  // min / max zoom
  .on("zoom", event => {
    g.attr("transform", event.transform);  // transform.toString() → "translate(x,y) scale(k)"
  })
  .on("end", event => log("k =", event.transform.k.toFixed(2),
                          "x =", event.transform.x.toFixed(0), "y =", event.transform.y.toFixed(0)));
svg.call(zoom);
`}
      />
      <p>Scroll to zoom, drag to pan, double-click to zoom in, and shift+double-click to zoom out.</p>

      <h2>Understanding the transform</h2>
      <p>
        A zoom transform has only three numbers: scale <code>k</code> and translation <code>x</code>,{" "}
        <code>y</code>. It maps a point in your data&apos;s coordinates to a point on screen:
      </p>
      <CodeBlock>{`
screenX = x + k * dataX
screenY = y + k * dataY
`}</CodeBlock>
      <p>
        Transforms are <strong>immutable</strong>. Methods like <code>scale</code> and <code>translate</code> return
        new transforms. <code>d3.zoomIdentity</code> is the starting point (k = 1, x = y = 0), and{" "}
        <code>d3.zoomTransform(node)</code> reads the current transform stored on an element.
      </p>
      <Playground
        title="Transform math"
        hideOutput
        code={`
const t = d3.zoomIdentity.translate(100, 50).scale(2);
log("t:", t.toString());                   // translate(100,50) scale(2)
log("apply([10, 10]):", t.apply([10, 10])); // [120, 70]   data → screen
log("invert([120, 70]):", t.invert([120, 70])); // [10, 10] screen → data
log("applyX(10):", t.applyX(10), " invertY(70):", t.invertY(70));

// Rescaling a linear scale: the core of "semantic zoom"
const x = d3.scaleLinear([0, 100], [0, 500]);
const zx = t.rescaleX(x);
log("original domain:", x.domain(), "→ rescaled domain:", zx.domain());

// Order matters: translate-then-scale vs scale-then-translate
log(d3.zoomIdentity.scale(2).translate(10, 0).toString());   // translate(20,0) scale(2)
log(d3.zoomIdentity.translate(10, 0).scale(2).toString());   // translate(10,0) scale(2)
`}
      />
      <ApiTable
        rows={[
          ["d3.zoom()", "Creates a zoom behavior. Apply it with selection.call(zoom)."],
          ["zoom.on(\"start zoom end\", fn)", "Listeners get an event with transform, sourceEvent and type."],
          ["zoom.scaleExtent([min, max])", "Limits the zoom level k. The default is [0, ∞]."],
          ["zoom.translateExtent([[x0, y0], [x1, y1]])", "Limits panning so the viewport stays inside these world bounds."],
          ["zoom.extent([[x0, y0], [x1, y1]])", "The viewport size. Defaults to the SVG viewBox or the element size."],
          ["zoom.filter(fn)", "Decides which events start a zoom. The default ignores right-click and ctrl+click (except ctrl+wheel)."],
          ["zoom.wheelDelta(fn)", "How far one wheel tick zooms."],
          ["zoom.constrain(fn)", "Custom function that applies the extents to a transform."],
          ["zoom.duration(ms) / interpolate(fn)", "Timing and interpolator for double-click zoom transitions (default d3.interpolateZoom)."],
          ["zoom.clickDistance(px) / tapDistance(px)", "How far the pointer may move and still count as a click."],
          ["zoom.transform(selection, transform[, point])", "Set the transform directly. Works on a transition to animate."],
          ["zoom.scaleBy / scaleTo(selection, k[, p])", "Zoom relative to, or to, a scale around point p."],
          ["zoom.translateBy / translateTo(selection, x, y[, p])", "Pan by an amount, or so that (x, y) is at point p (default: center)."],
          ["d3.zoomIdentity / d3.zoomTransform(node)", "The identity transform, and the current transform stored on a node."],
          ["transform.apply / invert / applyX / invertX …", "Convert points between world and screen coordinates."],
          ["transform.rescaleX(scale) / rescaleY(scale)", "Returns a copy of a scale whose domain matches the visible area."],
          ["transform.scale(k) / translate(x, y)", "Return new transforms composed with this one."],
        ]}
      />

      <h2>Semantic zoom: rescaling axes</h2>
      <p>
        Transforming a <code>&lt;g&gt;</code> is <em>geometric</em> zoom. Everything gets bigger, including stroke
        widths, dot sizes and text. Often you want <strong>semantic zoom</strong> instead. The dots stay the same
        size, but spread apart, and the axes show new tick values. The trick is{" "}
        <code>transform.rescaleX(x)</code>. It returns a new scale whose domain is the visible part of the data. Use
        it to reposition the marks and redraw the axes.
      </p>
      <Playground
        title="Scatterplot with zoomable axes"
        code={`
const W = 640, H = 400, m = { t: 20, r: 20, b: 34, l: 44 };
const rng = d3.randomLcg(9);
const clusters = [[2, 3], [6, 7], [8, 2], [4, 8]];
const data = d3.range(1500).map(i => {
  const [cx, cy] = clusters[i % 4];
  return { x: d3.randomNormal.source(rng)(cx, 0.8)(), y: d3.randomNormal.source(rng)(cy, 0.8)(), c: i % 4 };
});

const x = d3.scaleLinear([0, 10], [m.l, W - m.r]);
const y = d3.scaleLinear([0, 10], [H - m.b, m.t]);
const color = d3.scaleOrdinal(d3.range(4), d3.schemeTableau10);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("font", "11px sans-serif");
svg.append("clipPath").attr("id", "zoom-clip").append("rect")
  .attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b);

const gx = svg.append("g").attr("transform", \`translate(0,\${H - m.b})\`);
const gy = svg.append("g").attr("transform", \`translate(\${m.l},0)\`);
const dots = svg.append("g").attr("clip-path", "url(#zoom-clip)")
  .selectAll("circle").data(data).join("circle")
    .attr("r", 3).attr("fill", d => color(d.c)).attr("fill-opacity", 0.7);

function render(zx, zy) {
  dots.attr("cx", d => zx(d.x)).attr("cy", d => zy(d.y));      // dots stay 3px
  gx.call(d3.axisBottom(zx).ticks(8));
  gy.call(d3.axisLeft(zy).ticks(6))
    .call(g => g.selectAll(".tick line").attr("x2", W - m.l - m.r).attr("stroke-opacity", 0.08));
}

const zoom = d3.zoom()
  .scaleExtent([1, 40])
  .extent([[m.l, m.t], [W - m.r, H - m.b]])
  .translateExtent([[m.l, m.t], [W - m.r, H - m.b]])   // can't pan past the data
  .on("zoom", ({ transform }) => render(transform.rescaleX(x), transform.rescaleY(y)));

svg.call(zoom);
render(x, y);

d3.select(el).append("button").text("Reset").on("click", () =>
  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity));
`}
      />
      <Callout type="warning" title="Always rescale from the ORIGINAL scale">
        <p>
          Call <code>transform.rescaleX(x)</code> on the untouched original scale every time. Never overwrite{" "}
          <code>x</code> with the rescaled scale and rescale that again. The transform is already the{" "}
          <em>total</em> zoom since the start, so rescaling twice applies it twice and the chart runs away.
        </p>
      </Callout>

      <h2>Programmatic zoom</h2>
      <p>
        You can drive the behavior from code too. Methods like <code>zoom.scaleBy</code>,{" "}
        <code>zoom.translateTo</code> and <code>zoom.transform</code> take a selection <em>or a transition</em>{" "}
        as their first argument. Pass a transition and the move is animated with <code>d3.interpolateZoom</code>,
        which gives a smooth zoom-out, pan, zoom-in path. Because they go through the behavior, the stored
        transform stays in sync, and the next mouse zoom continues from there.
      </p>
      <p>
        &quot;Zoom to clicked&quot; is a classic pattern. Compute the transform that fits a shape&apos;s bounding box
        in the viewport, then transition to it:
      </p>
      <Playground
        title="Zoom buttons and zoom-to-clicked"
        code={`
const W = 640, H = 400;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("background", "#f1f3f5");
const g = svg.append("g");

// a little "map" of rectangles made with a treemap
const rng = d3.randomLcg(21);
const root = d3.hierarchy({ children: d3.range(40).map(i => ({ name: "Area " + (i + 1), value: 1 + rng() * 10 })) })
  .sum(d => d.value);
d3.treemap().size([W, H]).paddingInner(3).round(true)(root);

const zoom = d3.zoom().scaleExtent([1, 20]).on("zoom", ({ transform }) => {
  g.attr("transform", transform);
  g.selectAll("rect").attr("stroke-width", 1.5 / transform.k);   // keep strokes crisp
  g.selectAll("text").attr("font-size", 11 / transform.k);
});
svg.call(zoom).on("dblclick.zoom", null);   // disable default double-click zoom

let active = null;
const cells = g.selectAll("g").data(root.leaves()).join("g");
cells.append("rect")
  .attr("x", d => d.x0).attr("y", d => d.y0)
  .attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0)
  .attr("fill", (d, i) => d3.interpolateGnBu(0.25 + (i % 10) / 14))
  .attr("stroke", "white").style("cursor", "pointer")
  .on("click", (event, d) => {
    event.stopPropagation();
    if (active === d) return reset();
    active = d;
    const [[x0, y0], [x1, y1]] = [[d.x0, d.y0], [d.x1, d.y1]];
    const k = Math.min(20, 0.9 / Math.max((x1 - x0) / W, (y1 - y0) / H));
    svg.transition().duration(900).call(
      zoom.transform,
      d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    );
    log("zoomed to", d.data.name, "at k =", k.toFixed(1));
  });
cells.append("text").attr("x", d => d.x0 + 4).attr("y", d => d.y0 + 14)
  .attr("font-size", 11).attr("fill", "#1c3d5a").style("pointer-events", "none").text(d => d.data.name);

function reset() {
  active = null;
  svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
}
svg.on("click", reset);

const bar = d3.select(el).append("div").style("display", "flex").style("gap", "6px").style("margin-top", "6px");
bar.append("button").text("＋").on("click", () => svg.transition().call(zoom.scaleBy, 1.6));
bar.append("button").text("−").on("click", () => svg.transition().call(zoom.scaleBy, 1 / 1.6));
bar.append("button").text("Center on top-left").on("click", () =>
  svg.transition().duration(750).call(zoom.translateTo, 0, 0));
bar.append("button").text("Reset").on("click", reset);
`}
      />
      <p>
        Notice the order in the zoom-to-clicked transform: <code>translate(W/2, H/2)</code>, then{" "}
        <code>scale(k)</code>, then <code>translate(-cx, -cy)</code>. Read it from right to left: move the
        shape&apos;s center to the origin, scale it up, then move the origin to the middle of the viewport.
      </p>

      <h2>Filtering events</h2>
      <p>
        By default, a scroll wheel over the chart zooms it. On a long page that is often annoying, since readers
        who just want to scroll the page get stuck in the chart. <code>zoom.filter</code> lets you decide which
        events count. Here the wheel only zooms while ctrl or ⌘ is held (trackpad pinch sends ctrl+wheel, so it
        still works), and dragging only pans with the main button.
      </p>
      <Playground
        title="Only zoom with a modifier key"
        code={`
const W = 640, H = 240;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("background", "#fff9db");
const g = svg.append("g");
const hint = svg.append("text").attr("x", W / 2).attr("y", H / 2).attr("text-anchor", "middle")
  .style("font", "600 14px sans-serif").attr("fill", "#946c00").attr("opacity", 0)
  .text("Hold ⌘ / Ctrl and scroll to zoom");

g.selectAll("path").data(d3.range(9)).join("path")
  .attr("transform", i => \`translate(\${40 + i * 70},\${H / 2})\`)
  .attr("d", i => d3.symbol(d3.symbolsFill[i % 7], 900)())
  .attr("fill", i => d3.schemeDark2[i % 8]);

const zoom = d3.zoom()
  .scaleExtent([0.5, 8])
  .filter(event => {
    if (event.type === "wheel") {
      const ok = event.ctrlKey || event.metaKey;
      if (!ok) hint.interrupt().attr("opacity", 1).transition().delay(800).duration(400).attr("opacity", 0);
      return ok;
    }
    return !event.button;                  // left button / touch only
  })
  .on("zoom", ({ transform }) => g.attr("transform", transform));
svg.call(zoom);
`}
      />

      <h2>Zoom on canvas</h2>
      <p>
        d3-zoom does not care what you draw. With canvas, apply the transform to the drawing context instead of an
        SVG attribute: call <code>ctx.translate(x, y)</code> and <code>ctx.scale(k, k)</code>, then redraw
        everything. This handles tens of thousands of points smoothly.
      </p>
      <Playground
        title="20,000 points on a zoomable canvas"
        code={`
const W = 640, H = 400, dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
  .attr("width", W * dpr).attr("height", H * dpr)
  .style("width", "100%").style("max-width", W + "px").style("display", "block")
  .style("border-radius", "8px").style("background", "#111");
const ctx = canvas.node().getContext("2d");

// a spiral galaxy of points
const rng = d3.randomLcg(3), n = d3.randomNormal.source(rng)(0, 1);
const pts = d3.range(20000).map(i => {
  const arm = i % 3, r = Math.sqrt(rng()) * 180, a = r / 40 + arm * 2 * Math.PI / 3;
  return [W / 2 + r * Math.cos(a) + n() * 8, H / 2 + r * Math.sin(a) + n() * 8, r / 180];
});

function draw(t) {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // reset, including device-pixel scaling
  ctx.clearRect(0, 0, W, H);
  ctx.translate(t.x, t.y);
  ctx.scale(t.k, t.k);
  const size = 1.5 / t.k;                   // keep points ~1.5px on screen
  for (const [x, y, r] of pts) {
    ctx.fillStyle = d3.interpolateMagma(1 - r * 0.8);
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

// No viewBox on canvas: tell zoom the extent explicitly, in canvas units
d3.select(canvas.node()).call(d3.zoom()
  .extent([[0, 0], [W, H]])
  .scaleExtent([1, 50])
  .on("zoom", ({ transform }) => draw(transform)));
draw(d3.zoomIdentity);
`}
      />
      <Callout type="note" title="Canvas size vs CSS size">
        <p>
          d3-zoom reads pointer positions in CSS pixels relative to the element. If the canvas is shown smaller than
          its drawing size (here, <code>width: 100%</code> on a narrow screen), the zoom center can be a little off.
          For precise results, keep CSS size and <code>zoom.extent</code> in the same units, or listen to resizes and
          set <code>extent</code> to the element&apos;s client size.
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            In the scatterplot, zoom only along x: use <code>transform.rescaleX(x)</code> for the dots and axis, but
            keep the original <code>y</code>.
          </>,
          <>
            Add a mini-map in a corner of the first example that shows a rectangle for the visible area. Hint: the
            visible area in world coordinates is <code>transform.invert([0, 0])</code> to{" "}
            <code>transform.invert([W, H])</code>.
          </>,
          <>
            Make the zoom-to-clicked demo show the area name in large text when zoomed in past k = 4, and hide it
            otherwise (semantic zoom).
          </>,
          <>
            In the canvas example, find the point nearest to a click with <code>transform.invert(d3.pointer(event))</code>{" "}
            and a <code>d3.quadtree</code>.
          </>,
        ]}
      />
    </>
  );
}
