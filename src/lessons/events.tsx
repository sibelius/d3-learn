import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Static charts answer one question; interactive charts let readers ask their own. D3 doesn&apos;t invent a new
        event system — it wraps the browser&apos;s native DOM events with a thin layer that adds one crucial thing: the
        listener receives the <strong>bound datum</strong> of the element that was interacted with. This lesson covers
        listening to events, finding where the pointer is in chart coordinates, tooltips, click and keyboard
        interaction, and custom events with <code>d3-dispatch</code>.
      </p>

      <h2>selection.on(type, listener)</h2>
      <p>
        <code>selection.on(&quot;click&quot;, listener)</code> adds a listener to every selected element. In D3 v6+, the
        listener is called with two arguments: <code>(event, d)</code> — the native DOM event and the element&apos;s
        bound datum. Inside a regular <code>function</code>, <code>this</code> is the element (arrow functions
        don&apos;t get <code>this</code>, so use <code>event.currentTarget</code> instead).
      </p>
      <CodeBlock>{`
circles.on("click", (event, d) => {
  console.log("clicked", d, "at", event.clientX, event.clientY);
  d3.select(event.currentTarget).attr("fill", "red");
});
`}</CodeBlock>
      <Callout type="warning" title="No more d3.event">
        <p>
          Examples written for D3 v5 and earlier use a global <code>d3.event</code> and listeners with the signature{" "}
          <code>(d, i)</code>. Both are gone since v6. If you&apos;re porting old code, change{" "}
          <code>function(d) {"{"} d3.event.x ... {"}"}</code> to <code>function(event, d) {"{"} event.x ... {"}"}</code>.
          To get the index, use <code>selection.nodes().indexOf(this)</code> or store it in your data.
        </p>
      </Callout>
      <p>
        Some useful details: register several listeners of the same type using names —{" "}
        <code>.on(&quot;click.log&quot;, ...)</code> and <code>.on(&quot;click.highlight&quot;, ...)</code> coexist.
        Pass <code>null</code> to remove one: <code>.on(&quot;click.log&quot;, null)</code>. And{" "}
        <code>.on(&quot;.log&quot;, null)</code> removes every listener in that namespace.
      </p>

      <h2>Hover highlighting</h2>
      <p>
        The simplest and most useful interaction. Use <code>pointerenter</code>/<code>pointerleave</code> (or the
        mouse equivalents) — they don&apos;t bubble, so moving between an element&apos;s children won&apos;t fire them
        repeatedly the way <code>mouseover</code>/<code>mouseout</code> do.
      </p>
      <Playground
        title="Hover highlight"
        code={`
const data = [
  { fruit: "Apples", n: 42 }, { fruit: "Bananas", n: 67 }, { fruit: "Cherries", n: 23 },
  { fruit: "Dates", n: 35 }, { fruit: "Elderberries", n: 12 }, { fruit: "Figs", n: 51 },
];
const W = 640, H = 260, m = { top: 20, right: 10, bottom: 30, left: 10 };
const x = d3.scaleBand(data.map(d => d.fruit), [m.left, W - m.right]).padding(0.2);
const y = d3.scaleLinear([0, 70], [H - m.bottom, m.top]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

const label = svg.append("text").attr("x", W / 2).attr("y", 14)
  .attr("text-anchor", "middle").attr("fill", "#495057").text("Hover a bar");

svg.selectAll("rect")
  .data(data)
  .join("rect")
    .attr("x", d => x(d.fruit))
    .attr("y", d => y(d.n))
    .attr("width", x.bandwidth())
    .attr("height", d => y(0) - y(d.n))
    .attr("rx", 3)
    .attr("fill", "#adb5bd")
    .style("cursor", "pointer")
    .on("pointerenter", function (event, d) {
      d3.select(this).attr("fill", "#f76707");
      svg.selectAll("rect").filter(e => e !== d).attr("opacity", 0.4);
      label.text(\`\${d.fruit}: \${d.n}\`);
    })
    .on("pointerleave", function () {
      svg.selectAll("rect").attr("fill", "#adb5bd").attr("opacity", 1);
      label.text("Hover a bar");
    });

svg.append("g")
    .attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).tickSizeOuter(0));
`}
      />
      <Callout type="tip">
        <p>
          Pure visual hover effects can also be done in CSS: <code>rect:hover {"{"} fill: orange; {"}"}</code>. Use D3
          listeners when the hover needs data (labels, linked highlighting across charts).
        </p>
      </Callout>

      <h2>The event object and d3.pointer</h2>
      <p>
        The event object is the browser&apos;s own <code>MouseEvent</code>, <code>PointerEvent</code>,{" "}
        <code>KeyboardEvent</code>, etc., so all standard properties are there: <code>type</code>,{" "}
        <code>target</code>, <code>currentTarget</code>, <code>clientX/Y</code>, <code>shiftKey</code>,{" "}
        <code>key</code>, and methods like <code>preventDefault()</code>.
      </p>
      <p>
        But <code>clientX/Y</code> are relative to the browser window, which is rarely what you want. And because our
        SVG uses a <code>viewBox</code> that is scaled to fit, even element-relative pixel offsets are wrong.{" "}
        <code>d3.pointer(event, target)</code> solves both: it returns <code>[x, y]</code> in the{" "}
        <em>local coordinate system</em> of <code>target</code>, accounting for viewBox scaling and any transforms.
        Combine it with <code>scale.invert</code> to convert pixels back to data values.
      </p>
      <Playground
        title="d3.pointer + invert: a crosshair"
        code={`
const W = 640, H = 300, m = { top: 20, right: 20, bottom: 30, left: 40 };
const x = d3.scaleLinear([0, 10], [m.left, W - m.right]);
const y = d3.scaleLinear([0, 100], [H - m.bottom, m.top]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y));

const cross = svg.append("g").attr("pointer-events", "none").style("display", "none");
const vline = cross.append("line").attr("y1", m.top).attr("y2", H - m.bottom).attr("stroke", "#e64980");
const hline = cross.append("line").attr("x1", m.left).attr("x2", W - m.right).attr("stroke", "#e64980");
const readout = cross.append("text").attr("fill", "#e64980").attr("font-weight", "bold");

// a transparent rect catches pointer events over the whole plot area
svg.append("rect")
    .attr("x", m.left).attr("y", m.top)
    .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom)
    .attr("fill", "transparent")
    .on("pointerenter", () => cross.style("display", null))
    .on("pointerleave", () => cross.style("display", "none"))
    .on("pointermove", (event) => {
      const [px, py] = d3.pointer(event);       // in SVG user units (viewBox-aware)
      vline.attr("x1", px).attr("x2", px);
      hline.attr("y1", py).attr("y2", py);
      readout.attr("x", px + 8).attr("y", py - 8)
        .text(\`x=\${x.invert(px).toFixed(2)}, y=\${y.invert(py).toFixed(1)}\`);
    })
    .on("click", (event) => log("clicked at", d3.pointer(event).map(Math.round), "clientX/Y:", event.clientX, event.clientY));
`}
      />
      <p>
        <code>d3.pointer(event)</code> with no target uses <code>event.currentTarget</code>. For touch devices with
        multiple fingers, <code>d3.pointers(event)</code> returns an array of positions.
      </p>

      <h2>Tooltips</h2>
      <p>
        The classic tooltip is an absolutely positioned HTML <code>&lt;div&gt;</code> (HTML wraps text and supports
        rich formatting; SVG text doesn&apos;t). Make the container <code>position: relative</code>, then place the
        tooltip with <code>d3.pointer(event, container)</code> so the coordinates are in the container&apos;s pixel
        space. This example also finds the nearest point with <code>d3.least</code>, so users don&apos;t have to hit
        tiny circles exactly.
      </p>
      <Playground
        title="Scatterplot with a tooltip"
        code={`
d3.select(el).style("position", "relative");

const W = 640, H = 360, m = { top: 20, right: 20, bottom: 40, left: 50 };
const rand = d3.randomNormal.source(d3.randomLcg(7));
const species = ["Adelie", "Gentoo", "Chinstrap"];
const data = species.flatMap((s, k) => d3.range(40).map(() => ({
  species: s,
  flipper: rand(185 + k * 15, 6)(),
  mass: rand(3700 + k * 700, 350)(),
})));

const x = d3.scaleLinear(d3.extent(data, d => d.flipper), [m.left, W - m.right]).nice();
const y = d3.scaleLinear(d3.extent(data, d => d.mass), [H - m.bottom, m.top]).nice();
const color = d3.scaleOrdinal(species, ["#f08c00", "#1c7ed6", "#9c36b5"]);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`).call(d3.axisBottom(x))
  .append("text").attr("x", W - m.right).attr("y", 32).attr("fill", "currentColor")
    .attr("text-anchor", "end").text("Flipper length (mm) →");
svg.append("g").attr("transform", \`translate(\${m.left},0)\`).call(d3.axisLeft(y))
  .append("text").attr("x", -m.left).attr("y", 12).attr("fill", "currentColor")
    .attr("text-anchor", "start").text("↑ Body mass (g)");

const dots = svg.append("g").selectAll("circle")
  .data(data)
  .join("circle")
    .attr("cx", d => x(d.flipper))
    .attr("cy", d => y(d.mass))
    .attr("r", 4.5)
    .attr("fill", d => color(d.species))
    .attr("fill-opacity", 0.7);

const tooltip = d3.select(el).append("div")
  .style("position", "absolute")
  .style("pointer-events", "none")
  .style("background", "rgba(33,37,41,0.92)")
  .style("color", "white")
  .style("padding", "6px 10px")
  .style("border-radius", "6px")
  .style("font", "12px sans-serif")
  .style("line-height", "1.4")
  .style("opacity", 0);

svg.on("pointermove", (event) => {
  const [px, py] = d3.pointer(event);                // SVG coords
  const d = d3.least(data, d => Math.hypot(x(d.flipper) - px, y(d.mass) - py));
  const [cx, cy] = d3.pointer(event, el);            // container pixel coords for the div
  dots.attr("r", e => e === d ? 8 : 4.5).attr("stroke", e => e === d ? "black" : null);
  tooltip
      .style("opacity", 1)
      .style("left", (cx + 12) + "px")
      .style("top", (cy - 12) + "px")
      .html(\`<b style="color:\${color(d.species)}">\${d.species}</b><br>\` +
            \`Flipper: \${d.flipper.toFixed(1)} mm<br>Mass: \${d3.format(",.0f")(d.mass)} g\`);
});
svg.on("pointerleave", () => {
  tooltip.style("opacity", 0);
  dots.attr("r", 4.5).attr("stroke", null);
});
`}
      />
      <Callout type="note" title="The zero-dependency tooltip">
        <p>
          For quick work, <code>.append(&quot;title&quot;).text(d =&gt; ...)</code> inside an SVG element gives you a
          native browser tooltip for free. It&apos;s accessible, but slow to appear and can&apos;t be styled.
        </p>
      </Callout>

      <h2>Click to toggle, and keyboard</h2>
      <p>
        Interaction state usually lives in your data or a <code>Set</code>. On click, update the state, then re-apply
        styles from it. For keyboard access, give SVG elements <code>tabindex=&quot;0&quot;</code> so they can receive
        focus, and listen for <code>keydown</code>. Global shortcuts go on <code>window</code> — and since that listener
        outlives the playground, we return a cleanup function that removes it.
      </p>
      <Playground
        title="Toggle selection with mouse and keyboard"
        code={`
const W = 640, H = 170;
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "13px sans-serif");

const items = d3.range(8).map(i => ({ id: i, label: "Item " + (i + 1) }));
const selected = new Set();
const status = svg.append("text").attr("x", 20).attr("y", 150).attr("fill", "#495057");

const cells = svg.selectAll("g.cell")
  .data(items)
  .join("g")
    .attr("class", "cell")
    .attr("transform", d => \`translate(\${20 + d.id * 76},30)\`)
    .attr("tabindex", 0)                      // focusable → keyboard events
    .style("cursor", "pointer")
    .style("outline", "none")
    .on("click", (event, d) => toggle(d, event.shiftKey))
    .on("keydown", (event, d) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();               // don't scroll the page on space
        toggle(d, event.shiftKey);
      }
    })
    .on("focus", function () { d3.select(this).select("rect").attr("stroke-width", 3); })
    .on("blur", function () { d3.select(this).select("rect").attr("stroke-width", 1.5); });

cells.append("rect").attr("width", 66).attr("height", 80).attr("rx", 8)
  .attr("stroke", "#1971c2").attr("stroke-width", 1.5);
cells.append("text").attr("x", 33).attr("y", 45).attr("text-anchor", "middle").text(d => d.label);

function toggle(d, additive) {
  if (!additive && !selected.has(d.id)) selected.clear();
  selected.has(d.id) ? selected.delete(d.id) : selected.add(d.id);
  render();
}
function render() {
  cells.select("rect").attr("fill", d => selected.has(d.id) ? "#1971c2" : "#e7f5ff");
  cells.select("text").attr("fill", d => selected.has(d.id) ? "white" : "#1971c2");
  status.text(selected.size ? "Selected: " + [...selected].map(i => i + 1).join(", ")
    : "Click (Shift+click to multi-select), or Tab + Enter. Press Esc to clear.");
}
render();

// a global keyboard shortcut — clean it up when the playground re-runs
function onKey(event) {
  if (event.key === "Escape") { selected.clear(); render(); log("cleared"); }
}
window.addEventListener("keydown", onKey);
return () => window.removeEventListener("keydown", onKey);
`}
      />

      <h2>Custom events with d3.dispatch</h2>
      <p>
        As charts grow, you&apos;ll want components to talk to each other without knowing about each other: a legend
        that highlights a series in a line chart, a map that filters a table. <code>d3.dispatch</code> (from{" "}
        <code>d3-dispatch</code>) is a tiny event emitter. You declare event names up front, register listeners with{" "}
        <code>.on()</code> (supporting the same <code>type.name</code> namespaces), and fire events with{" "}
        <code>.call(type, thisArg, ...args)</code>. D3&apos;s own drag, zoom, brush and force modules use it
        internally.
      </p>
      <Playground
        title="Linked views via dispatch"
        code={`
const dispatch = d3.dispatch("highlight", "reset");
const categories = ["North", "South", "East", "West"];
const color = d3.scaleOrdinal(categories, d3.schemeSet2);
const values = { North: 34, South: 52, East: 21, West: 44 };

const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 640 220")
  .style("font", "13px sans-serif");

// --- Component 1: a legend. It only EMITS events. ---
const legend = svg.append("g").attr("transform", "translate(20,40)");
const items = legend.selectAll("g")
  .data(categories)
  .join("g")
    .attr("transform", (d, i) => \`translate(0,\${i * 36})\`)
    .style("cursor", "pointer")
    .on("pointerenter", (event, d) => dispatch.call("highlight", null, d))
    .on("pointerleave", () => dispatch.call("reset"));
items.append("rect").attr("width", 20).attr("height", 20).attr("rx", 4).attr("fill", color);
items.append("text").attr("x", 28).attr("y", 15).text(d => d);

// --- Component 2: a bar chart. It only LISTENS. ---
const x = d3.scaleLinear([0, 60], [0, 400]);
const bars = svg.append("g").attr("transform", "translate(180,40)")
  .selectAll("rect")
  .data(categories)
  .join("rect")
    .attr("y", (d, i) => i * 36)
    .attr("height", 24)
    .attr("width", d => x(values[d]))
    .attr("fill", color);

dispatch.on("highlight.bars", cat => bars.attr("opacity", d => d === cat ? 1 : 0.2));
dispatch.on("reset.bars", () => bars.attr("opacity", 1));

// --- Component 3: a logger, added without touching the others ---
dispatch.on("highlight.log", cat => log("highlight:", cat, values[cat]));
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["selection.on(typenames, listener)", "Add a listener; called as listener(event, d) with this = element. Pass null to remove."],
          ["selection.on(typenames)", "Get the current listener for the given type."],
          ["selection.dispatch(type[, params])", "Fire a synthetic DOM event (params: {bubbles, cancelable, detail})."],
          ["d3.pointer(event[, target])", "[x, y] of the pointer relative to target (default event.currentTarget)."],
          ["d3.pointers(event[, target])", "Array of [x, y] for every active touch/pointer."],
          ["d3.dispatch(...types)", "Create a dispatcher for the named custom event types."],
          ["dispatch.on(typenames, callback)", "Register (or with null, remove) a callback; supports type.name."],
          ["dispatch.call(type, that, ...args)", "Invoke all callbacks for type with the given this and arguments."],
          ["dispatch.apply(type, that, args)", "Like call, but arguments passed as an array."],
          ["dispatch.copy()", "A copy of the dispatcher with the same callbacks."],
        ]}
      />
      <p>Common event types worth knowing:</p>
      <ApiTable
        rows={[
          ["click · dblclick · contextmenu", "Mouse button interactions (contextmenu = right click)."],
          ["pointerenter · pointerleave", "Hover start/end; don't bubble. Works for mouse, pen and touch."],
          ["pointermove · pointerdown · pointerup", "Unified mouse/touch/pen tracking."],
          ["mouseover · mouseout", "Like enter/leave but bubble from children (fire more often)."],
          ["keydown · keyup", "Keyboard input on focused elements or window."],
          ["focus · blur", "Keyboard focus changes (needs tabindex on SVG elements)."],
          ["wheel", "Scroll wheel / trackpad; usually handled by d3-zoom."],
        ]}
      />

      <Exercises
        items={[
          <>In the hover example, add a <code>click</code> listener that logs the fruit and its percentage of the total.</>,
          <>
            Make the tooltip flip to the left side of the cursor when it would overflow the right edge (compare{" "}
            <code>cx</code> to <code>width</code>).
          </>,
          <>
            In the crosshair example, snap the vertical line to the nearest integer x value using{" "}
            <code>Math.round(x.invert(px))</code>.
          </>,
          <>
            Add arrow-key navigation to the toggle example: Left/Right should move focus to the neighboring cell (
            <code>node.focus()</code>).
          </>,
          <>
            Add a third component to the dispatch example — a big number that shows the highlighted value — without
            modifying the legend.
          </>,
        ]}
      />
    </>
  );
}
