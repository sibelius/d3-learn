import Link from "next/link";
import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Direct manipulation, grabbing a thing and moving it, is one of the most natural ways to interact with a
        chart. You could wire up <code>pointerdown</code>, <code>pointermove</code> and <code>pointerup</code>{" "}
        yourself, but there are many edge cases: capturing moves outside the element, touch versus mouse, several
        fingers at once, telling a click apart from a drag, and blocking text selection. <strong>d3-drag</strong>{" "}
        handles all of that and gives you three clean events: <code>start</code>, <code>drag</code> and{" "}
        <code>end</code>.
      </p>

      <h2>A first drag</h2>
      <p>
        Like zoom, <code>d3.drag()</code> creates a behavior that you apply with <code>selection.call(drag)</code>.
        In the <code>drag</code> listener, <code>event.x</code> and <code>event.y</code> give the new position.
        You move the element there. The second argument is the element&apos;s bound datum, so storing the position
        in the data keeps everything in sync.
      </p>
      <Playground
        title="Draggable circles"
        code={`
const W = 640, H = 300;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("background", "#f8f9fb");
const data = d3.range(12).map(i => ({
  x: 60 + (i % 6) * 104, y: 90 + Math.floor(i / 6) * 120, color: d3.schemeTableau10[i % 10],
}));

const drag = d3.drag()
  .on("start", function (event, d) {
    d3.select(this).raise().attr("stroke", "#222");   // bring to front
  })
  .on("drag", function (event, d) {
    d.x = event.x; d.y = event.y;                     // update the data…
    d3.select(this).attr("cx", d.x).attr("cy", d.y); // …then the DOM
  })
  .on("end", function (event, d) {
    d3.select(this).attr("stroke", null);
    log("dropped at", Math.round(d.x), Math.round(d.y));
  });

svg.selectAll("circle").data(data).join("circle")
  .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", 32)
  .attr("fill", d => d.color).attr("stroke-width", 3)
  .style("cursor", "grab")
  .call(drag);
`}
      />

      <h2>The drag event and the subject</h2>
      <p>
        Why does the circle not jump so its center snaps to the pointer when you grab it off-center? Because of the{" "}
        <strong>subject</strong>. When a drag starts, d3-drag computes a subject, which by default is the datum{" "}
        <code>d</code>, or <code>{"{"}x: event.x, y: event.y{"}"}</code> if there is no datum. It then remembers the
        offset between the pointer and <code>subject.x</code>, <code>subject.y</code>. During the drag,{" "}
        <code>event.x</code> and <code>event.y</code> are the pointer position <em>plus</em> that offset. So the
        point you grabbed stays under the pointer.
      </p>
      <ApiTable
        rows={[
          ["event.type", "\"start\", \"drag\" or \"end\"."],
          ["event.x, event.y", "New position of the subject: pointer plus the offset from the grab point."],
          ["event.dx, event.dy", "Change since the previous drag event."],
          ["event.subject", "The thing being dragged, as returned by drag.subject."],
          ["event.identifier", "\"mouse\", or a touch or pointer id. Several fingers can drag at once."],
          ["event.active", "Number of active drag gestures (useful with force layouts)."],
          ["event.sourceEvent", "The underlying pointer, mouse or touch event."],
          ["event.on(type, fn)", "Adds listeners for the rest of this one gesture only."],
        ]}
      />
      <Playground
        title="Inspecting drag events"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 200").style("background", "#f8f9fb");
const box = svg.append("rect").datum({ x: 270, y: 60 })
  .attr("x", d => d.x).attr("y", d => d.y).attr("width", 100).attr("height", 80).attr("rx", 10)
  .attr("fill", "#7048e8").style("cursor", "move");
const readout = svg.append("text").attr("x", 10).attr("y", 20).style("font", "12px monospace");
const trail = svg.insert("path", "rect").attr("fill", "none").attr("stroke", "#b197fc").attr("stroke-dasharray", "3 3");
let points = [];

box.call(d3.drag()
  .on("start", (event, d) => {
    points = [[event.x + 50, event.y + 40]];
    log("start  subject:", event.subject, " pointer:", event.sourceEvent.type, " id:", event.identifier);
  })
  .on("drag", function (event, d) {
    d.x = event.x; d.y = event.y;
    d3.select(this).attr("x", d.x).attr("y", d.y);
    points.push([d.x + 50, d.y + 40]);
    trail.attr("d", d3.line()(points));
    readout.text(\`x=\${event.x.toFixed(0)} y=\${event.y.toFixed(0)} dx=\${event.dx.toFixed(1)} dy=\${event.dy.toFixed(1)}\`);
  })
  .on("end", () => log("end    after", points.length, "drag events")));
`}
      />
      <Callout type="tip" title="Clicks still work">
        <p>
          If the pointer barely moves between down and up, d3-drag does not treat it as a drag, and the element
          still gets a normal <code>click</code> event. If it does move, the click is suppressed so dropping an
          element does not also &quot;click&quot; it. <code>drag.clickDistance(px)</code> sets how many pixels of
          movement are allowed before a click becomes a drag.
        </p>
      </Callout>

      <h2>Constraining a drag</h2>
      <p>
        Since you decide where the element goes, constraints are just math on <code>event.x</code> and{" "}
        <code>event.y</code>. Clamp them to a range, snap to a grid, or project onto a path. Here is a custom
        slider: the knob only moves along x, stays within the track, and snaps to whole steps with a scale&apos;s{" "}
        <code>invert</code>.
      </p>
      <Playground
        title="A custom slider"
        code={`
const W = 640, H = 120, m = 40;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("font", "12px sans-serif");
const x = d3.scaleLinear([0, 100], [m, W - m]).clamp(true);   // clamp keeps invert() in range

svg.append("g").attr("transform", \`translate(0,\${H / 2 + 22})\`)
  .call(d3.axisBottom(x).ticks(10).tickSize(6)).call(g => g.select(".domain").remove());
svg.append("line").attr("x1", x.range()[0]).attr("x2", x.range()[1])
  .attr("y1", H / 2).attr("y2", H / 2).attr("stroke", "#dee2e6").attr("stroke-width", 8).attr("stroke-linecap", "round");
const fill = svg.append("line").attr("x1", x.range()[0]).attr("y1", H / 2).attr("y2", H / 2)
  .attr("stroke", "#1c7ed6").attr("stroke-width", 8).attr("stroke-linecap", "round");
const label = svg.append("text").attr("y", H / 2 - 22).attr("text-anchor", "middle").attr("font-weight", 700);
const knob = svg.append("circle").attr("cy", H / 2).attr("r", 12)
  .attr("fill", "white").attr("stroke", "#1c7ed6").attr("stroke-width", 3).style("cursor", "ew-resize");

function set(v) {
  const px = x(v);
  knob.attr("cx", px); fill.attr("x2", px);
  label.attr("x", px).text(v);
}
knob.call(d3.drag()
  .subject(() => ({ x: +knob.attr("cx"), y: H / 2 }))    // keep the grab offset
  .on("drag", event => set(Math.round(x.invert(event.x) / 5) * 5))   // clamp + snap to 5
  .on("end", () => log("value:", label.text())));
set(35);
`}
      />

      <h2>container: whose coordinates?</h2>
      <p>
        <code>event.x</code> and <code>event.y</code> are measured relative to the drag&apos;s{" "}
        <strong>container</strong>. By default that is the parent node of the dragged element. This matters when
        the element sits inside a transformed <code>&lt;g&gt;</code>: coordinates come in the group&apos;s own
        (transformed) system, which is usually exactly what you want. Set <code>drag.container(node)</code> to
        measure against a different element, e.g. when the element you listen on is not the one you move.
      </p>
      <CodeBlock>{`
// Drag handles inside a rotated/scaled group get local coordinates automatically
const g = svg.append("g").attr("transform", "translate(100,50) rotate(20) scale(1.5)");
g.selectAll("circle").data(points).join("circle")
  .call(d3.drag().on("drag", function (event, d) {
    d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y); // local coords
  }));
`}</CodeBlock>

      <h2>Drag to reorder</h2>
      <p>
        A realistic pattern: a sortable list. While you drag a row, it follows the pointer vertically. We compute
        which slot it is over, reorder the array, and animate the <em>other</em> rows into their new positions with
        a transition. On <code>end</code>, the dragged row snaps into its slot.
      </p>
      <Playground
        title="Sortable list"
        code={`
const W = 640, rowH = 44;
let items = ["Selections", "Data joins", "Scales", "Axes", "Shapes", "Transitions", "Zoom & drag"]
  .map((name, i) => ({ name, color: d3.schemeTableau10[i] }));
const H = items.length * rowH + 10;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("font", "15px sans-serif");
const y = i => 5 + i * rowH;

const rows = svg.selectAll("g").data(items, d => d.name).join("g")
  .attr("transform", (d, i) => \`translate(0,\${y(i)})\`)
  .style("cursor", "grab");
rows.append("rect").attr("x", 10).attr("width", W - 20).attr("height", rowH - 6).attr("rx", 8)
  .attr("fill", "white").attr("stroke", "#dee2e6");
rows.append("rect").attr("x", 10).attr("width", 8).attr("height", rowH - 6).attr("rx", 4).attr("fill", d => d.color);
rows.append("text").attr("x", 32).attr("y", rowH / 2).attr("dy", "0.1em").text(d => d.name);
rows.append("text").attr("x", W - 30).attr("y", rowH / 2).attr("dy", "0.1em").attr("fill", "#adb5bd")
  .attr("text-anchor", "end").text("⋮⋮");

function layout(except) {
  rows.filter(d => d !== except)
    .transition().duration(200)
    .attr("transform", d => \`translate(0,\${y(items.indexOf(d))})\`);
}

rows.call(d3.drag()
  .subject((event, d) => ({ x: 0, y: y(items.indexOf(d)) }))   // start from the row's slot
  .on("start", function (event, d) {
    d3.select(this).raise().style("cursor", "grabbing")
      .select("rect").transition().duration(150).attr("stroke", d.color).attr("stroke-width", 2)
      .style("filter", "drop-shadow(0 4px 6px rgba(0,0,0,.15))");
  })
  .on("drag", function (event, d) {
    const top = Math.max(0, Math.min(H - rowH, event.y));
    d3.select(this).attr("transform", \`translate(0,\${top})\`);
    const target = Math.max(0, Math.min(items.length - 1, Math.round((top - 5) / rowH)));
    const from = items.indexOf(d);
    if (target !== from) {
      items.splice(from, 1);
      items.splice(target, 0, d);
      layout(d);
    }
  })
  .on("end", function (event, d) {
    d3.select(this).style("cursor", "grab")
      .transition().duration(200).attr("transform", \`translate(0,\${y(items.indexOf(d))})\`)
      .select("rect").attr("stroke", "#dee2e6").attr("stroke-width", 1).style("filter", null);
    log("order:", items.map(d => d.name).join(" → "));
  }));
`}
      />

      <h2>Dragging on canvas with subject</h2>
      <p>
        Canvas has no elements to attach listeners to, since it is one big bitmap. The <code>subject</code>{" "}
        function solves this. Apply the drag to the canvas itself, and in <code>subject</code> do your own{" "}
        <strong>hit test</strong>: find the shape under the pointer and return it. If <code>subject</code> returns{" "}
        <code>null</code> or <code>undefined</code>, no drag starts. From then on, <code>event.subject</code> is your
        shape object and <code>event.x</code> and <code>event.y</code> move it.
      </p>
      <Playground
        title="Canvas drag with hit testing"
        code={`
const W = 640, H = 360, dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
  .attr("width", W * dpr).attr("height", H * dpr)
  .style("width", W + "px").style("max-width", "100%").style("display", "block")
  .style("background", "#f8f9fb").style("border-radius", "8px");
const ctx = canvas.node().getContext("2d");
ctx.scale(dpr, dpr);

const rng = d3.randomLcg(4);
const circles = d3.range(60).map(i => ({
  x: 20 + rng() * (W - 40), y: 20 + rng() * (H - 40), r: 8 + rng() * 22, color: d3.interpolateSinebow(i / 60),
}));
let dragged = null;

function draw() {
  ctx.clearRect(0, 0, W, H);
  for (const c of circles) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, 2 * Math.PI);
    ctx.fillStyle = c.color;
    ctx.globalAlpha = c === dragged ? 1 : 0.75;
    ctx.fill();
    if (c === dragged) { ctx.lineWidth = 3; ctx.strokeStyle = "#212529"; ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
}

// CSS px → canvas units (the canvas may be shown narrower than W)
const scale = () => W / canvas.node().clientWidth;

d3.select(canvas.node()).call(d3.drag()
  .subject(event => {
    const k = scale(), px = event.x * k, py = event.y * k;
    // topmost circle containing the pointer (last drawn = on top)
    for (let i = circles.length - 1; i >= 0; i--) {
      const c = circles[i];
      if ((px - c.x) ** 2 + (py - c.y) ** 2 < c.r ** 2) return { circle: c, x: c.x / k, y: c.y / k };
    }
    return null;                           // nothing hit → no drag
  })
  .on("start", event => {
    dragged = event.subject.circle;
    circles.splice(circles.indexOf(dragged), 1);
    circles.push(dragged);                 // move to top of the draw order
    draw();
  })
  .on("drag", event => {
    const k = scale();
    dragged.x = event.x * k; dragged.y = event.y * k;
    draw();
  })
  .on("end", () => { dragged = null; draw(); }));

canvas.on("pointermove", event => {
  const [px, py] = d3.pointer(event).map(v => v * scale());
  const hit = circles.some(c => (px - c.x) ** 2 + (py - c.y) ** 2 < c.r ** 2);
  canvas.style("cursor", hit ? "grab" : "default");
});
draw();
`}
      />
      <Callout type="warning" title="Remember the grab offset for custom subjects">
        <p>
          The subject&apos;s <code>x</code> and <code>y</code> set the starting point that <code>event.x</code> and{" "}
          <code>event.y</code> move from. If you return a subject without <code>x</code>/<code>y</code>, or with the
          wrong ones, the shape jumps on the first move. Always return the shape&apos;s current position in the same
          coordinate system as the pointer, as above (divided by <code>k</code> to get CSS pixels).
        </p>
      </Callout>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.drag()", "Creates a drag behavior. Apply it with selection.call(drag)."],
          ["drag.on(\"start drag end\", fn)", "Listeners receive (event, d) with this set to the element."],
          ["drag.subject(fn)", "Returns the thing being dragged. Return null to cancel. Default: d, or the pointer position."],
          ["drag.container(fn | node)", "The element that coordinates are measured against. Default: the parent node."],
          ["drag.filter(fn)", "Which events can start a drag. Default: ignore ctrl+click and non-primary buttons."],
          ["drag.touchable(fn)", "Whether to add touch listeners. Default: only on touch-capable devices."],
          ["drag.clickDistance(px)", "Maximum movement for a gesture to still count as a click. Default 0."],
          ["d3.dragDisable(window) / dragEnable(window, noclick)", "Lower-level helpers to block native drag and text selection."],
        ]}
      />
      <p>
        Dragging nodes in a force-directed graph is one of the most popular uses of d3-drag. It combines{" "}
        <code>event.active</code> with the simulation&apos;s <code>alphaTarget</code> and fixed{" "}
        <code>fx</code>/<code>fy</code> positions. That pattern is covered in the{" "}
        <Link href="/learn/force">Force Simulations lesson</Link>.
      </p>

      <Exercises
        items={[
          <>
            Make the circles in the first example snap to a 40px grid on <code>end</code>, with a short
            transition.
          </>,
          <>
            Turn the slider into a range slider with two knobs that can&apos;t cross each other.
          </>,
          <>
            Draw a polygon from 5 draggable vertex handles. Redraw the <code>path</code> on every drag and show its
            area with <code>d3.polygonArea</code>.
          </>,
          <>
            In the canvas example, drag with two fingers on a touch screen. Keep a separate{" "}
            <code>dragged</code> per <code>event.identifier</code> so both circles move at once.
          </>,
        ]}
      />
    </>
  );
}
