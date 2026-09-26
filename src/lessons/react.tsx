import type { ReactNode } from "react";
import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";
import { D3ZoomScatter, ReactBarChart, ReactLineChart } from "./react-demos";

function Demo({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
      <div className="border-b border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)]">
        {title} · live React component
      </div>
      <div className="react-demo bg-white p-4 text-[#1c1b19]">{children}</div>
    </div>
  );
}

export default function Lesson() {
  return (
    <>
      <p>
        D3 and React both want to control the DOM. D3&apos;s selections create, update and remove elements
        imperatively; React describes the DOM declaratively and reconciles it for you. If both touch the same nodes,
        they fight: React may wipe out elements D3 appended, or D3 may mutate nodes React thinks it owns. The trick is
        to decide, <em>per piece of the chart</em>, who owns which DOM. In practice there are two patterns.
      </p>

      <h2>Pattern 1: React renders, D3 computes</h2>
      <p>
        Most of D3 never touches the DOM at all. Scales, shape generators (<code>d3.line</code>,{" "}
        <code>d3.arc</code>, <code>d3.area</code>), layouts (<code>d3.stack</code>, <code>d3.pie</code>,{" "}
        <code>d3.treemap</code>, <code>d3.hierarchy</code>), <code>d3.geoPath</code>, array utilities, formatting,
        color and interpolation — these are pure functions that turn data into numbers and path strings. Use them
        inside your components and let React render the <code>&lt;svg&gt;</code> elements. This is the preferred
        approach for most charts: the output is plain JSX, works with server rendering, and state flows the normal
        React way.
      </p>
      <p>Here&apos;s what &quot;D3 as a calculator&quot; means in vanilla terms — nothing but strings and numbers come out:</p>
      <Playground
        title="D3 computes, something else renders"
        code={`
const data = [3, 7, 4, 9, 6, 11, 8];
const W = 600, H = 200;

const x = d3.scaleLinear().domain([0, data.length - 1]).range([30, W - 10]);
const y = d3.scaleLinear().domain([0, d3.max(data)]).nice().range([H - 20, 10]);
const line = d3.line((d, i) => x(i), (d) => y(d)).curve(d3.curveCatmullRom);

log("x(3) =", x(3), " y(9) =", y(9));
log("y.ticks(4) =", y.ticks(4));
log("path d =", line(data).slice(0, 60) + "…");

// This is exactly what a React component would return as JSX:
const markup =
  '<svg viewBox="0 0 ' + W + ' ' + H + '">' +
  y.ticks(4).map((t) =>
    '<line x1="30" x2="' + (W - 10) + '" y1="' + y(t) + '" y2="' + y(t) + '" stroke="#eee"/>' +
    '<text x="24" y="' + y(t) + '" dy="0.32em" text-anchor="end" font-size="11" fill="#888">' + t + '</text>'
  ).join("") +
  '<path d="' + line(data) + '" fill="none" stroke="#e8590c" stroke-width="2.5"/>' +
  data.map((d, i) => '<circle cx="' + x(i) + '" cy="' + y(d) + '" r="4" fill="#e8590c"/>').join("") +
  "</svg>";
el.innerHTML = markup;
`}
      />
      <p>The same idea as a React component:</p>
      <CodeBlock lang="tsx">{`
"use client";
import * as d3 from "d3";
import { useMemo } from "react";

type Datum = { date: Date; value: number };

export function LineChart({ data, width = 600, height = 260 }: { data: Datum[]; width?: number; height?: number }) {
  const m = { top: 16, right: 16, bottom: 28, left: 40 };

  // Scales and generators are derived data: memoize them on their inputs
  const x = useMemo(
    () => d3.scaleUtc(d3.extent(data, (d) => d.date) as [Date, Date], [m.left, width - m.right]),
    [data, width],
  );
  const y = useMemo(
    () => d3.scaleLinear(d3.extent(data, (d) => d.value) as [number, number], [height - m.bottom, m.top]).nice(),
    [data, height],
  );
  const line = d3.line<Datum>((d) => x(d.date), (d) => y(d.value));

  return (
    <svg viewBox={\`0 0 \${width} \${height}\`}>
      {y.ticks(5).map((t) => (
        <g key={t} transform={\`translate(0,\${y(t)})\`}>
          <line x1={m.left} x2={width - m.right} stroke="#eee" />
          <text x={m.left - 6} dy="0.32em" textAnchor="end" fontSize={11}>{t}</text>
        </g>
      ))}
      <path d={line(data) ?? undefined} fill="none" stroke="#e8590c" strokeWidth={2} />
    </svg>
  );
}
`}</CodeBlock>
      <p>
        Below are two live components built this way. The bar chart keeps data in <code>useState</code>, derives
        scales with <code>useMemo</code>, and animates by tweening numbers with <code>d3.timer</code> +{" "}
        <code>d3.interpolate</code> while React re-renders each frame. The line chart finds the hovered point with{" "}
        <code>d3.bisector(...).center</code> and stores just the <em>index</em> in React state; the crosshair and
        tooltip are ordinary JSX.
      </p>
      <Demo title="Bar chart: React-rendered, D3 scales + interpolation">
        <ReactBarChart />
      </Demo>
      <Demo title="Line chart: d3.line + d3.bisector hover in React state">
        <ReactLineChart />
      </Demo>
      <p>The hover handler is just a few lines:</p>
      <CodeBlock lang="tsx">{`
const bisectDate = d3.bisector<Datum, Date>((d) => d.date).center;   // module scope: created once

function onMove(event: React.PointerEvent<SVGRectElement>) {
  // d3.pointer works with the native event; coordinates are relative to the target element
  const [mx] = d3.pointer(event.nativeEvent, event.currentTarget);
  setHover(bisectDate(data, x.invert(mx)));
}
`}</CodeBlock>
      <Callout type="note" title="Keys vs key functions">
        <p>
          In Pattern 1 React&apos;s <code>key</code> prop plays the role of D3&apos;s key function in{" "}
          <code>selection.data(data, d =&gt; d.id)</code>: it decides which element represents which datum across
          renders. Use a stable id (<code>key={"{"}d.id{"}"}</code>), never the array index if items can be reordered,
          added or removed — otherwise elements get reused for the wrong data and animations look wrong.
        </p>
      </Callout>

      <h2>Pattern 2: D3 owns a DOM node</h2>
      <p>
        Some D3 modules are fundamentally about DOM and events: <code>d3.zoom</code>, <code>d3.brush</code>,{" "}
        <code>d3.drag</code>, <code>d3.axis</code> and transitions. They attach listeners, store state on nodes (
        <code>__zoom</code>, <code>__brush</code>) and mutate attributes every frame. For these, let React render an
        empty container and hand it to D3 through a ref. React never renders children into that node, so there&apos;s
        nothing to conflict with.
      </p>
      <CodeBlock lang="tsx">{`
"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

export function ZoomableScatter({ data }: { data: [number, number][] }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    const x = d3.scaleLinear([-6, 6], [36, 588]);
    const y = d3.scaleLinear([-4, 4], [294, 12]);
    const gx = svg.append("g").attr("transform", "translate(0,294)");
    const gy = svg.append("g").attr("transform", "translate(36,0)");
    const dots = svg.append("g").selectAll("circle").data(data).join("circle").attr("r", 2.5);

    function render(t: d3.ZoomTransform) {
      const zx = t.rescaleX(x), zy = t.rescaleY(y);
      gx.call(d3.axisBottom(zx));
      gy.call(d3.axisLeft(zy));
      dots.attr("cx", (d) => zx(d[0])).attr("cy", (d) => zy(d[1]));
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 32])
      .on("zoom", (event) => render(event.transform));
    svg.call(zoom);
    render(d3.zoomIdentity);

    return () => {                       // ← cleanup is not optional
      svg.on(".zoom", null);             // remove zoom listeners
      svg.selectAll("*").remove();       // remove everything we appended
    };
  }, [data]);                            // re-run only when data changes

  return <svg ref={ref} viewBox="0 0 600 320" />;
}
`}</CodeBlock>
      <Demo title="D3-owned SVG: axes + zoom via useRef / useEffect">
        <D3ZoomScatter />
      </Demo>
      <p>
        Mixing is fine and common: React renders the marks while a small <code>useEffect</code> calls{" "}
        <code>d3.axisBottom</code> on a <code>&lt;g ref={"{"}axisRef{"}"} /&gt;</code>, or attaches{" "}
        <code>d3.zoom</code> to an <code>&lt;svg&gt;</code> and copies the transform into React state that the
        marks read. The rule is simply that each DOM node has exactly one owner.
      </p>
      <CodeBlock lang="tsx">{`
function Axis({ scale, transform }: { scale: d3.ScaleLinear<number, number>; transform: string }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    d3.select(ref.current!).transition().duration(500).call(d3.axisBottom(scale));
  }, [scale]);
  return <g ref={ref} transform={transform} />;   // React owns the <g>, D3 owns its children
}
`}</CodeBlock>

      <h2>Which pattern when?</h2>
      <ApiTable
        rows={[
          ["Static or state-driven marks", "Pattern 1. Bars, lines, areas, pies, maps, treemaps, scatterplots."],
          ["Axes", "Either: render ticks from scale.ticks() in JSX, or a <g ref> + d3.axis in an effect."],
          ["Zoom, brush, drag", "Pattern 2 (attach the behavior in an effect); feed the resulting transform/selection into React state if marks are React-rendered."],
          ["Transitions", "Pattern 2 for d3.transition; in Pattern 1 tween numbers yourself (d3.timer + d3.interpolate) or use CSS / an animation library."],
          ["Thousands of marks", "Canvas via a ref, drawn in an effect — React re-rendering 10k SVG nodes per frame is slow."],
          ["Force simulations", "Run the simulation in an effect; either mutate D3-owned nodes on tick or copy positions into state (throttled)."],
        ]}
      />

      <h2>Pitfalls</h2>
      <h3>StrictMode runs effects twice</h3>
      <p>
        In development, React 18+ StrictMode mounts, unmounts and re-mounts every component to flush out missing
        cleanup. An effect that does <code>svg.append(&quot;g&quot;)</code> without a cleanup will produce{" "}
        <em>two</em> axes, two sets of dots and two zoom handlers. Always return a cleanup that removes what you added
        and detaches listeners (<code>selection.on(&quot;.zoom&quot;, null)</code>), and stops timers, transitions
        and simulations (<code>timer.stop()</code>, <code>simulation.stop()</code>,{" "}
        <code>selection.interrupt()</code>).
      </p>
      <h3>Stale closures</h3>
      <p>
        D3 event handlers are registered once, inside an effect. If they read React state or props, they capture the
        values from <em>that</em> render and never see updates:
      </p>
      <CodeBlock lang="tsx">{`
const [color, setColor] = useState("steelblue");
useEffect(() => {
  d3.select(ref.current!).on("click", () => console.log(color)); // ✗ always logs "steelblue"
}, []);

// Fix 1: list the dependency so the handler is re-bound when it changes
useEffect(() => { /* ... */ }, [color]);

// Fix 2: read through a ref that always holds the latest value
const colorRef = useRef(color);
colorRef.current = color;
useEffect(() => {
  d3.select(ref.current!).on("click", () => console.log(colorRef.current)); // ✓
}, []);
`}</CodeBlock>
      <h3>Server rendering and &quot;use client&quot;</h3>
      <p>
        In the Next.js App Router, components are server components by default. Pure Pattern 1 charts can render on the
        server (great for static pages), but anything using <code>useState</code>, <code>useEffect</code>, refs or
        event handlers needs <code>&quot;use client&quot;</code> at the top of the file. D3 code that touches{" "}
        <code>window</code> or <code>document</code> must live inside effects or handlers, never at render time. Watch
        out for <code>Math.random()</code> or <code>new Date()</code> during render: server and client produce
        different markup and React reports a hydration mismatch — seed with <code>d3.randomLcg</code> or generate
        data in an effect.
      </p>
      <h3>Memoize scales and generators</h3>
      <p>
        Creating a scale is cheap, but creating a <em>new</em> scale object every render breaks effect dependencies (
        <code>[scale]</code> changes each time, so the axis effect re-runs and transitions restart) and memoized
        children. Wrap scales, layouts and expensive computations (<code>d3.hierarchy</code>,{" "}
        <code>d3.contourDensity</code>, <code>d3.Delaunay.from</code>) in <code>useMemo</code> keyed on data and
        size.
      </p>
      <h3>Responsive sizing</h3>
      <p>
        <code>viewBox</code> scaling is the easiest responsive strategy, but text and strokes shrink with the chart. For
        true responsiveness (more ticks on wide screens, constant font size), measure the container with a{" "}
        <code>ResizeObserver</code> and feed the width into your scales:
      </p>
      <CodeBlock lang="tsx">{`
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

// usage
const [ref, width] = useWidth<HTMLDivElement>();
const x = useMemo(() => d3.scaleUtc(domain, [40, Math.max(320, width) - 16]), [domain, width]);
return <div ref={ref}>{width > 0 && <svg width={width} height={260}>…</svg>}</div>;
`}</CodeBlock>
      <Callout type="warning" title="Don't import d3 piecemeal by accident">
        <p>
          <code>import * as d3 from &quot;d3&quot;</code> is convenient, and modern bundlers tree-shake it well. If
          bundle size matters, import from the modules directly (<code>import {"{"} scaleLinear {"}"} from
          &quot;d3-scale&quot;</code>). Note that <code>selection.transition()</code> only exists once{" "}
          <code>d3-transition</code> has been imported somewhere — importing <code>d3-selection</code> alone leaves it
          undefined.
        </p>
      </Callout>

      <h2>Vanilla vs React, side by side</h2>
      <p>
        For comparison, here is the React bar chart above written as a plain D3 playground. D3&apos;s data join with a
        key function (<code>d =&gt; d.key</code>) does what React&apos;s <code>key</code> prop did, and{" "}
        <code>transition()</code> replaces the manual tween. Neither is &quot;better&quot; — the vanilla version is
        shorter for animation-heavy work; the React version composes naturally with the rest of your app.
      </p>
      <Playground
        title="The bar chart in vanilla D3"
        code={`
const W = 600, H = 260, m = { top: 16, right: 12, bottom: 28, left: 36 };
const letters = "ABCDEFGHIJKL".split("");
const make = (rnd) => letters.map((key) => ({ key, value: Math.round(5 + rnd() * 95) }));
let data = make(d3.randomLcg(1)), sorted = false;

const bar = d3.select(el).append("div").style("display", "flex").style("gap", "8px").style("margin-bottom", "6px");
const button = (label, fn) => bar.append("button").text(label).on("click", fn)
  .style("padding", "2px 10px").style("border", "1px solid #ccc").style("border-radius", "6px").style("font-size", "12px");
button("Randomize", () => { data = make(Math.random); update(); });
const sortBtn = button("Sort by value", () => { sorted = !sorted; sortBtn.text(sorted ? "Alphabetical" : "Sort by value"); update(); });

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
const y = d3.scaleLinear([0, 100], [H - m.bottom, m.top]);
const x = d3.scaleBand().range([m.left, W - m.right]).padding(0.2);
svg.append("g").attr("transform", "translate(" + m.left + ",0)")
  .call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.left - m.right)))
  .call((g) => g.select(".domain").remove())
  .call((g) => g.selectAll(".tick line").attr("stroke", "#e9ecef"))
  .call((g) => g.selectAll(".tick text").attr("fill", "#868e96"));
const gx = svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")");

function update() {
  const ordered = sorted ? d3.sort(data, (d) => -d.value) : data;
  x.domain(ordered.map((d) => d.key));
  const t = svg.transition().duration(600).ease(d3.easeCubicOut);

  svg.selectAll(".bar")
    .data(data, (d) => d.key)                 // ← key function, like React's key prop
    .join((enter) => enter.append("rect").attr("class", "bar").attr("rx", 3)
      .attr("x", (d) => x(d.key)).attr("y", y(0)).attr("height", 0))
    .attr("width", x.bandwidth())
    .transition(t)
      .attr("x", (d) => x(d.key))
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value))
      .attr("fill", (d) => d3.interpolateBlues(0.35 + d.value / 160));

  gx.transition(t).call(d3.axisBottom(x).tickSize(0)).call((g) => g.select(".domain").remove());
}
update();
`}
      />
      <p>And the line chart hover, vanilla-style — compare how the hovered index lives in a local variable instead of React state:</p>
      <Playground
        title="Bisector hover in vanilla D3"
        code={`
const W = 600, H = 260, m = { top: 16, right: 16, bottom: 28, left: 40 };
const rand = d3.randomNormal.source(d3.randomLcg(7))(0, 1.4);
let v = 100;
const data = d3.range(180).map((i) => ({ date: d3.timeDay.offset(new Date(2025, 0, 1), i), value: (v += rand() + 0.08) }));

const x = d3.scaleUtc(d3.extent(data, (d) => d.date), [m.left, W - m.right]);
const y = d3.scaleLinear(d3.extent(data, (d) => d.value), [H - m.bottom, m.top]).nice();
const bisect = d3.bisector((d) => d.date).center;

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("g").attr("transform", "translate(0," + (H - m.bottom) + ")").call(d3.axisBottom(x).ticks(6));
svg.append("g").attr("transform", "translate(" + m.left + ",0)").call(d3.axisLeft(y).ticks(5));
svg.append("path").datum(data)
  .attr("d", d3.line((d) => x(d.date), (d) => y(d.value)).curve(d3.curveMonotoneX))
  .attr("fill", "none").attr("stroke", "#e8590c").attr("stroke-width", 2);

const focus = svg.append("g").attr("display", "none").attr("pointer-events", "none");
const rule = focus.append("line").attr("y1", m.top).attr("y2", H - m.bottom).attr("stroke", "#adb5bd").attr("stroke-dasharray", "3 3");
const dot = focus.append("circle").attr("r", 5).attr("fill", "#e8590c").attr("stroke", "white").attr("stroke-width", 2);
const label = focus.append("text").attr("font-size", 12).attr("font-weight", 700)
  .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 4);

svg.append("rect").attr("x", m.left).attr("y", m.top)
  .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom).attr("fill", "transparent")
  .on("pointermove", (event) => {
    const i = bisect(data, x.invert(d3.pointer(event)[0]));
    const d = data[i];
    focus.attr("display", null);
    rule.attr("x1", x(d.date)).attr("x2", x(d.date));
    dot.attr("cx", x(d.date)).attr("cy", y(d.value));
    label.attr("x", Math.min(x(d.date) + 8, W - 150)).attr("y", m.top + 12)
      .text(d3.timeFormat("%b %d")(d.date) + " · " + d.value.toFixed(2));
  })
  .on("pointerleave", () => focus.attr("display", "none"));
`}
      />

      <Exercises
        items={[
          <>
            Turn the <code>Axis</code> component above into a reusable <code>&lt;AxisLeft&gt;</code> and{" "}
            <code>&lt;AxisBottom&gt;</code> pair and use them in the Pattern 1 line chart.
          </>,
          <>
            Add a <code>d3.brush</code> to a React line chart: attach it in an effect to a <code>&lt;g ref&gt;</code>,
            and on <code>end</code> store the selected date range in state so a second (React-rendered) chart can zoom
            into it.
          </>,
          <>
            Deliberately remove the cleanup function from a Pattern 2 component running under StrictMode, observe the
            doubled output, then fix it.
          </>,
          <>
            Render 20,000 points with Pattern 1 (one <code>&lt;circle&gt;</code> each) and then with a{" "}
            <code>&lt;canvas&gt;</code> drawn in an effect. Measure re-render time when the data changes.
          </>,
          <>
            Build a <code>useD3(renderFn, deps)</code> hook that creates the ref, runs <code>renderFn(selection)</code>{" "}
            in an effect, and calls the cleanup it returns.
          </>,
        ]}
      />
    </>
  );
}
