import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        A <strong>brush</strong> lets the user click and drag to select a region: a range along one axis, or a
        rectangle in two dimensions. It&apos;s the standard way to filter, zoom into a time range, or pick a group of
        points. Like axes and zoom, a brush is a <em>behavior</em> that you create once and apply to a{" "}
        <code>&lt;g&gt;</code> with <code>selection.call(brush)</code>. D3 then builds and manages all the little
        SVG elements (the overlay, the selection rectangle and its resize handles) for you.
      </p>

      <h2>Three kinds of brush</h2>
      <ul>
        <li>
          <code>d3.brushX()</code> — selects a horizontal range. The selection is <code>[x0, x1]</code>.
        </li>
        <li>
          <code>d3.brushY()</code> — selects a vertical range. The selection is <code>[y0, y1]</code>.
        </li>
        <li>
          <code>d3.brush()</code> — selects a rectangle. The selection is <code>[[x0, y0], [x1, y1]]</code>.
        </li>
      </ul>
      <p>
        Crucially, selections are always in <strong>pixels</strong> (the brush&apos;s own coordinate system), not
        in data units. To get data values back you run the pixel coordinates through your scale&apos;s{" "}
        <code>invert</code> method. When nothing is selected, <code>event.selection</code> is <code>null</code>.
      </p>

      <Playground
        title="A 1D brush and scale.invert"
        code={`
const W = 640, H = 120, margin = { left: 20, right: 20 };
const x = d3.scaleLinear().domain([0, 100]).range([margin.left, W - margin.right]);

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + W + " " + H);

svg.append("g")
    .attr("transform", "translate(0,80)")
    .call(d3.axisBottom(x));

const label = svg.append("text").attr("x", W / 2).attr("y", 110)
    .attr("text-anchor", "middle").attr("font-size", 13).text("drag across the band");

const brush = d3.brushX()
    // extent = the area where brushing is allowed, in pixels
    .extent([[margin.left, 20], [W - margin.right, 78]])
    .on("start brush end", (event) => {
      if (!event.selection) { label.text("no selection"); return; }
      const [x0, x1] = event.selection.map(x.invert);
      label.text(event.type + ": " + x0.toFixed(1) + " → " + x1.toFixed(1));
      if (event.type === "end") log("pixels", event.selection, "data", [x0, x1]);
    });

svg.append("g").attr("class", "brush").call(brush);
`}
      />

      <h3>What the brush creates</h3>
      <p>
        Inspect the output and you&apos;ll find a <code>rect.overlay</code> (the invisible area that captures
        pointer events and gets a crosshair cursor), a <code>rect.selection</code> (the grey rectangle), and{" "}
        <code>rect.handle</code> elements on each edge for resizing. You can style them with CSS or with{" "}
        <code>selection.select(&quot;.selection&quot;).attr(&quot;fill&quot;, ...)</code> after calling the
        brush.
      </p>

      <h2>The brush API</h2>
      <ApiTable
        rows={[
          ["d3.brush() / brushX() / brushY()", "Create a 2D, horizontal or vertical brush behavior."],
          ["brush.extent([[x0, y0], [x1, y1]])", "The brushable area in local pixel coordinates. Defaults to the SVG's viewBox/size."],
          ["brush.on(typenames, listener)", <>Listen for <code>start</code>, <code>brush</code> and <code>end</code>. Names can be namespaced: <code>&quot;brush.chart&quot;</code>.</>],
          ["brush.move(group, selection)", <>Set the selection programmatically; pass <code>null</code> to clear. Also works with a transition.</>],
          ["brush.clear(group)", "Shorthand for brush.move(group, null) (d3-brush 3+)."],
          ["brush.filter(fn)", "Decide which pointer events start a brush (default ignores ctrl-click and secondary buttons)."],
          ["brush.handleSize(px)", "Width of the invisible resize handles (default 6)."],
          ["brush.keyModifiers(bool)", "Enable alt (centered) and shift (lock axis) modifiers — true by default."],
          ["brush.touchable(fn)", "Whether touch events are supported on this device."],
          ["d3.brushSelection(node)", "Read the current selection of a brushed <g> (or null) at any time."],
          ["event.selection", "The pixel selection, or null when cleared."],
          ["event.sourceEvent", <>The underlying pointer event — <code>null</code> when the change came from <code>brush.move</code>.</>],
          ["event.mode", <><code>&quot;drag&quot;</code>, <code>&quot;space&quot;</code>, <code>&quot;handle&quot;</code> or <code>&quot;center&quot;</code>.</>],
        ]}
      />

      <h2>Brushing a scatterplot</h2>
      <p>
        With a 2D brush, the selection is a rectangle. For each point, check whether its <em>pixel</em> position
        falls inside. That&apos;s cheaper than inverting (and works with any scale type, including ordinal ones that
        have no <code>invert</code>). Here we toggle a class and log how many points are selected.
      </p>
      <Playground
        title="2D brush highlights points"
        code={`
const W = 640, H = 380, m = { top: 20, right: 20, bottom: 30, left: 40 };
const rand = d3.randomNormal.source(d3.randomLcg(42));
const gx = rand(50, 15), gy = rand(50, 18);
const data = Array.from({ length: 300 }, (_, i) => ({ id: i, x: gx(), y: gy() * 0.6 + i / 10 }));

const x = d3.scaleLinear().domain(d3.extent(data, d => d.x)).nice().range([m.left, W - m.right]);
const y = d3.scaleLinear().domain(d3.extent(data, d => d.y)).nice().range([H - m.bottom, m.top]);

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + W + " " + H);
svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")").call(d3.axisBottom(x));
svg.append("g").attr("transform", "translate(" + m.left + ",0)").call(d3.axisLeft(y));

const dots = svg.append("g")
  .selectAll("circle")
  .data(data)
  .join("circle")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 3.5)
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.7);

const status = svg.append("text").attr("x", W - m.right).attr("y", m.top)
    .attr("text-anchor", "end").attr("font-size", 12);

function brushed({ selection }) {
  if (!selection) {
    dots.attr("fill", "steelblue").attr("r", 3.5);
    status.text("");
    return;
  }
  const [[x0, y0], [x1, y1]] = selection;
  let n = 0;
  dots.each(function (d) {
    const cx = x(d.x), cy = y(d.y);
    const inside = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    if (inside) n++;
    d3.select(this).attr("fill", inside ? "tomato" : "#ccc").attr("r", inside ? 4.5 : 3);
  });
  status.text(n + " selected");
}

const brush = d3.brush()
    .extent([[m.left, m.top], [W - m.right, H - m.bottom]])
    .on("start brush end", brushed);

// appended last, so its overlay sits on top and receives the pointer events
svg.append("g").call(brush);
`}
      />
      <Callout type="warning" title="Brushes eat pointer events">
        <p>
          The brush overlay is a rectangle that captures every pointer event inside its extent. If you append it
          after your marks, tooltips and hover effects on those marks stop working. Options: put the brush{" "}
          <code>&lt;g&gt;</code> <em>before</em> the marks and give marks <code>pointer-events: none</code> only
          while brushing, restrict the brush&apos;s <code>extent</code> to a margin strip, or use{" "}
          <code>brush.filter</code> to only start brushing with a modifier key.
        </p>
      </Callout>

      <h2>Programmatic control: move, clear and snapping</h2>
      <p>
        <code>brush.move</code> is how you set a brush from code — to initialize a default selection, respond to a
        button, or <strong>snap</strong> the selection to round values when the user lets go. Because calling{" "}
        <code>move</code> fires brush events itself, guard against infinite loops by checking{" "}
        <code>event.sourceEvent</code>: it&apos;s <code>null</code> when the event came from code rather than the
        user.
      </p>
      <CodeBlock>{`
// initialize with a selection (in pixels!)
gBrush.call(brush.move, [x(10), x(30)]);

// animate a change
gBrush.transition().duration(750).call(brush.move, [x(40), x(60)]);

// clear
gBrush.call(brush.move, null);   // or: gBrush.call(brush.clear)
`}</CodeBlock>
      <Playground
        title="Snapping to whole days + buttons"
        code={`
const W = 640, H = 110, m = { left: 20, right: 20 };
const start = new Date(2024, 0, 1), end = new Date(2024, 0, 22);
const x = d3.scaleTime().domain([start, end]).range([m.left, W - m.right]);

const root = d3.select(el);
const bar = root.append("div").style("margin-bottom", "6px");
const svg = root.append("svg").attr("viewBox", "0 0 " + W + " " + H);

svg.append("g").attr("transform", "translate(0,70)")
    .call(d3.axisBottom(x).ticks(d3.timeDay.every(2)).tickFormat(d3.timeFormat("%b %d")));

const label = svg.append("text").attr("x", W / 2).attr("y", 104)
    .attr("text-anchor", "middle").attr("font-size", 13);
const fmt = d3.timeFormat("%a %b %d");

const brush = d3.brushX()
    .extent([[m.left, 10], [W - m.right, 68]])
    .on("brush", ({ selection }) => {
      if (selection) label.text(selection.map(x.invert).map(fmt).join(" → "));
    })
    .on("end", function (event) {
      if (!event.sourceEvent) return;          // ignore our own brush.move
      if (!event.selection) { label.text("cleared"); return; }
      // round to whole days, then move the brush to the snapped position
      const d0 = event.selection.map(x.invert).map(d3.timeDay.round);
      if (d0[0] >= d0[1]) { d0[0] = d3.timeDay.floor(d0[0]); d0[1] = d3.timeDay.offset(d0[0]); }
      d3.select(this).transition().call(brush.move, d0.map(x));
      label.text(d0.map(fmt).join(" → "));
      log("snapped to", d0.map(fmt));
    });

const gBrush = svg.append("g").call(brush)
    .call(brush.move, [x(new Date(2024, 0, 5)), x(new Date(2024, 0, 9))]);
gBrush.select(".selection").attr("fill", "#4c6ef5").attr("fill-opacity", 0.25);
label.text("Fri Jan 05 → Tue Jan 09");

const btn = (text, fn) => bar.append("button").text(text)
    .style("margin-right", "6px").style("padding", "2px 8px")
    .style("border", "1px solid #999").style("border-radius", "4px").on("click", fn);

btn("First week", () => gBrush.transition().duration(600)
    .call(brush.move, [x(start), x(d3.timeDay.offset(start, 7))]));
btn("Last 3 days", () => gBrush.transition().duration(600)
    .call(brush.move, [x(d3.timeDay.offset(end, -3)), x(end)]));
btn("Clear", () => { gBrush.call(brush.move, null); label.text("cleared"); });
`}
      />
      <Callout type="tip">
        <p>
          Clicking (without dragging) on the overlay clears the selection — the <code>end</code> event fires with{" "}
          <code>selection === null</code>. Many apps treat that as &quot;reset the filter&quot;. You can also read
          the selection at any time with <code>d3.brushSelection(gBrush.node())</code>.
        </p>
      </Callout>

      <h2>Focus + context</h2>
      <p>
        The classic brushing pattern: a small <strong>context</strong> chart shows the entire dataset with a brush,
        and a large <strong>focus</strong> chart shows only the brushed range. On every brush event, invert the
        selection, set it as the focus scale&apos;s domain, and redraw the focus line and axis. A{" "}
        <code>clipPath</code> keeps the focus line from spilling past the axes.
      </p>
      <Playground
        title="Overview brush drives a detail chart"
        code={`
const W = 640, m = { top: 10, right: 20, bottom: 24, left: 44 };
const focusH = 260, ctxH = 70, gap = 30, H = focusH + gap + ctxH;

// A random-walk "stock price" over two years
const rnd = d3.randomNormal.source(d3.randomLcg(7))(0, 1);
let v = 100;
const data = d3.timeDays(new Date(2023, 0, 1), new Date(2025, 0, 1))
  .map(date => ({ date, value: (v = Math.max(20, v + rnd() * 2)) }));

const x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([m.left, W - m.right]);
const x2 = x.copy();                   // context scale never changes
const y = d3.scaleLinear().domain([0, d3.max(data, d => d.value)]).nice().range([focusH - m.bottom, m.top]);
const y2 = y.copy().range([H - m.bottom, H - ctxH]);

const svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + W + " " + H);
svg.append("clipPath").attr("id", "fc-clip")
  .append("rect").attr("x", m.left).attr("y", m.top)
  .attr("width", W - m.left - m.right).attr("height", focusH - m.top - m.bottom);

const line = d3.line().x(d => x(d.date)).y(d => y(d.value));
const area2 = d3.area().x(d => x2(d.date)).y0(y2(0)).y1(d => y2(d.value));

// focus
const focusPath = svg.append("path").datum(data)
    .attr("clip-path", "url(#fc-clip)")
    .attr("fill", "none").attr("stroke", "steelblue").attr("stroke-width", 1.5)
    .attr("d", line);
const xAxis = svg.append("g").attr("transform", "translate(0," + (focusH - m.bottom) + ")").call(d3.axisBottom(x));
svg.append("g").attr("transform", "translate(" + m.left + ",0)").call(d3.axisLeft(y));

// context
svg.append("path").datum(data).attr("fill", "#a5b4fc").attr("d", area2);
svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")").call(d3.axisBottom(x2));

const brush = d3.brushX()
    .extent([[m.left, H - ctxH], [W - m.right, H - m.bottom]])
    .on("brush end", ({ selection }) => {
      // empty selection → show everything
      x.domain(selection ? selection.map(x2.invert) : x2.domain());
      focusPath.attr("d", line);
      xAxis.call(d3.axisBottom(x));
    });

svg.append("g").call(brush)
    .call(brush.move, [x2(new Date(2024, 2, 1)), x2(new Date(2024, 7, 1))]);
`}
      />
      <p>
        The same idea generalizes: brush a histogram to filter a map, brush one axis of a parallel-coordinates plot
        (one <code>brushY</code> per axis), or link several brushed charts together (&quot;crossfilter&quot;). In
        every case the brush produces a pixel range, you convert it into a data predicate, and you re-render the
        views that depend on it.
      </p>

      <Exercises
        items={[
          <>
            In the scatterplot, log the <em>data</em> extent of the selection (use <code>x.invert</code> and{" "}
            <code>y.invert</code>) and note that <code>y0</code> in pixels corresponds to the <em>larger</em> data
            value.
          </>,
          <>
            Change the scatterplot to use <code>d3.brushX()</code> so that it selects a vertical band of points. What
            changes about the shape of <code>selection</code>?
          </>,
          <>
            In the focus + context example, make the y-axis of the focus chart rescale to fit only the visible data
            (hint: filter data by the new x-domain and use <code>d3.extent</code>).
          </>,
          <>
            Add a <code>brush.filter(event =&gt; event.shiftKey)</code> to the scatterplot and add hover tooltips to
            the dots, so brushing only starts with Shift held.
          </>,
        ]}
      />
    </>
  );
}
