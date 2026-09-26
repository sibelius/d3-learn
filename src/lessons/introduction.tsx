import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        <strong>D3</strong> (Data-Driven Documents) is a JavaScript library for building bespoke, interactive data
        visualizations in the browser. It was created by Mike Bostock in 2011 and still powers a huge share of the
        custom charts you see in newsrooms, dashboards and research papers. This course covers <em>every</em> part of
        D3 v7, one module at a time, with live examples you can edit.
      </p>

      <h2>What D3 is — and what it isn&apos;t</h2>
      <p>
        The most important thing to understand up front: <strong>D3 is not a charting library</strong>. There is no{" "}
        <code>d3.barChart()</code>. Instead, D3 is a <em>toolbox</em> of about thirty small, independent modules, each
        solving one piece of the visualization problem:
      </p>
      <ul>
        <li>
          <strong>Scales</strong> turn data values (dollars, dates, categories) into visual values (pixels, colors).
        </li>
        <li>
          <strong>Shapes</strong> turn arrays of points into SVG path strings (lines, areas, arcs, pies).
        </li>
        <li>
          <strong>Layouts</strong> compute positions for trees, networks, treemaps and maps.
        </li>
        <li>
          <strong>Selections</strong> let you create and update DOM elements from data.
        </li>
        <li>
          <strong>Behaviors</strong> add zoom, drag, brush and transitions.
        </li>
      </ul>
      <p>
        You compose these pieces yourself into whatever graphic you need. That makes D3 more work than a
        high-level library for a standard bar chart — but it means there is no ceiling. If you can imagine it and
        draw it with SVG, Canvas or HTML, D3 can help you build it.
      </p>
      <Callout type="note" title="D3 vs. chart libraries">
        <p>
          If all you need is a quick standard chart, a higher-level tool like Observable Plot (built on D3 by the same
          team), Vega-Lite, or Recharts may be faster. Reach for D3 when you need full control over every pixel, novel
          chart forms, custom interaction, or animation.
        </p>
      </Callout>

      <h2>The modules</h2>
      <p>
        The <code>d3</code> package is simply a bundle that re-exports all of these modules under a single namespace.
        Here they are grouped by purpose, with the lesson in this course that covers each one:
      </p>
      <h3>DOM &amp; interaction</h3>
      <ApiTable
        rows={[
          ["d3-selection", <>Select elements, bind data, handle events — <a href="/learn/selections">Selections</a>, <a href="/learn/data-join">Data Joins</a>, <a href="/learn/events">Events</a>.</>],
          ["d3-transition · d3-ease", <>Animate changes to the DOM — <a href="/learn/transitions">Transitions</a>.</>],
          ["d3-timer", <>Efficient animation frames and delays — <a href="/learn/timers">Timers</a>.</>],
          ["d3-zoom", <>Pan and zoom with mouse, wheel and touch — <a href="/learn/zoom">Zoom &amp; Pan</a>.</>],
          ["d3-drag", <>Drag-and-drop behavior — <a href="/learn/drag">Drag</a>.</>],
          ["d3-brush", <>Select a 1D or 2D region — <a href="/learn/brush">Brushing</a>.</>],
          ["d3-dispatch", <>Custom named events — <a href="/learn/events">Events</a>.</>],
        ]}
      />
      <h3>Encoding data visually</h3>
      <ApiTable
        rows={[
          ["d3-scale", <>Map data to visual variables — <a href="/learn/continuous-scales">Continuous</a> and <a href="/learn/ordinal-scales">Ordinal</a> scales.</>],
          ["d3-axis", <>Render human-readable reference marks for scales — <a href="/learn/axes">Axes</a>.</>],
          ["d3-shape", <>Lines, areas, arcs, pies, stacks, symbols, links — <a href="/learn/lines-areas">Lines</a>, <a href="/learn/arcs-pies">Arcs</a>, <a href="/learn/stacks-symbols">Stacks</a>.</>],
          ["d3-path", <>A Canvas-like API that serializes to SVG path data — <a href="/learn/lines-areas">Lines &amp; Areas</a>.</>],
          ["d3-color · d3-interpolate", <>Color spaces and interpolation between any values — <a href="/learn/color">Color</a>.</>],
          ["d3-scale-chromatic", <>Ready-made color schemes (viridis, Tableau10…) — <a href="/learn/color">Color</a>.</>],
        ]}
      />
      <h3>Working with data</h3>
      <ApiTable
        rows={[
          ["d3-array", <>Statistics, grouping, binning, searching, sorting — <a href="/learn/arrays">Arrays</a>.</>],
          ["d3-format", <>Format numbers (&quot;$1.2k&quot;, &quot;34%&quot;) — <a href="/learn/formatting">Formatting</a>.</>],
          ["d3-time · d3-time-format", <>Calendar intervals and date parsing/formatting — <a href="/learn/formatting">Formatting</a>.</>],
          ["d3-fetch · d3-dsv", <>Load and parse CSV, TSV, JSON — <a href="/learn/fetching">Loading Data</a>.</>],
          ["d3-random", <>Random number generators for many distributions — <a href="/learn/random">Random</a>.</>],
        ]}
      />
      <h3>Layouts &amp; geometry</h3>
      <ApiTable
        rows={[
          ["d3-hierarchy", <>Trees, treemaps, circle packing, partitions — <a href="/learn/hierarchy">Hierarchies</a>.</>],
          ["d3-force", <>Physics simulations for network graphs — <a href="/learn/force">Force</a>.</>],
          ["d3-chord", <>Flows between groups — <a href="/learn/chord">Chord Diagrams</a>.</>],
          ["d3-geo", <>Map projections and geographic shapes — <a href="/learn/geo">Maps</a>.</>],
          ["d3-delaunay", <>Voronoi diagrams and nearest-point search — <a href="/learn/delaunay">Delaunay</a>.</>],
          ["d3-quadtree", <>2D spatial index — <a href="/learn/quadtree">Quadtrees</a>.</>],
          ["d3-contour · d3-polygon", <>Contours, density estimation, polygon math — <a href="/learn/contours">Contours</a>.</>],
        ]}
      />
      <p>
        Notice that most of these modules have <em>nothing to do with the DOM</em>. A scale is just a function; a line
        generator just returns a string. That is why D3 plays well with React, Vue, Svelte or Canvas: you can use D3
        for the math and let something else render.
      </p>

      <h2>How the playgrounds work</h2>
      <p>
        Every gray box with a <strong>▶ Run</strong> button is a live editor. The code runs in your browser as the body
        of an async function, with a few variables already defined:
      </p>
      <ApiTable
        rows={[
          ["d3", "The entire D3 v7 library."],
          ["el", "An empty <div> — your canvas. Append SVG or HTML into it."],
          ["width", "The pixel width of el, handy for responsive layouts."],
          ["log(...values)", "Prints values to the console panel under the output."],
          ["topojson", "topojson-client, used in the maps lesson."],
          ["await", "Works at the top level, e.g. const data = await d3.csv(url)."],
        ]}
      />
      <p>
        Edit anything and press <strong>Run</strong> (or <code>⌘/Ctrl + Enter</code>). <strong>Reset</strong> restores
        the original code. Timers, intervals and force simulations are stopped automatically when you re-run. Try it:
      </p>
      <Playground
        title="Your first D3 code"
        code={`
const data = [4, 8, 15, 16, 23, 42];

d3.select(el)
  .selectAll("div")
  .data(data)
  .join("div")
    .style("background", "steelblue")
    .style("color", "white")
    .style("margin", "3px 0")
    .style("padding", "4px 8px")
    .style("font", "13px sans-serif")
    .style("width", d => d * 12 + "px")
    .text(d => d);

log("max value:", d3.max(data));
log("mean value:", d3.mean(data).toFixed(2));
`}
      />
      <p>
        That&apos;s a complete bar chart made of plain <code>&lt;div&gt;</code>s. Don&apos;t worry about{" "}
        <code>data()</code> and <code>join()</code> yet — they are the subject of the Data Joins lesson.
      </p>

      <h2>An SVG primer</h2>
      <p>
        Most D3 graphics are drawn in <strong>SVG</strong> (Scalable Vector Graphics), an XML dialect for 2D shapes that
        lives right in the DOM. Because SVG elements are real DOM nodes, you can style them with CSS, attach event
        listeners, and inspect them in dev tools. The essentials:
      </p>
      <ul>
        <li>
          <strong>The coordinate system</strong> starts at the <em>top-left</em> corner. <code>x</code> grows to the
          right and <code>y</code> grows <em>downward</em> — the opposite of a math class graph. This is why bar charts
          need a little arithmetic to grow upward.
        </li>
        <li>
          <strong>viewBox</strong> defines the internal coordinate system. <code>viewBox=&quot;0 0 640 400&quot;</code>{" "}
          means &quot;my drawing is 640×400 units&quot;, and the browser scales it to whatever size the element is
          displayed at.
        </li>
        <li>
          <strong>Painting order</strong> is document order: later elements are drawn on top. There is no z-index.
        </li>
      </ul>
      <ApiTable
        rows={[
          ["<rect x y width height rx>", "A rectangle, positioned by its top-left corner. rx rounds the corners."],
          ["<circle cx cy r>", "A circle, positioned by its center."],
          ["<ellipse cx cy rx ry>", "An ellipse."],
          ["<line x1 y1 x2 y2>", "A straight line segment. Needs a stroke to be visible!"],
          ["<path d>", "Arbitrary shapes via a mini-language: M (move), L (line), C (curve), A (arc), Z (close)."],
          ["<text x y>", "Text, positioned by its baseline. Use text-anchor and dominant-baseline to align."],
          ["<g transform>", "A group. Transforms and styles apply to all children."],
          ["fill · stroke · stroke-width · opacity", "Presentation attributes (also settable via CSS)."],
          ["transform", "translate(x,y), rotate(deg[, cx, cy]), scale(k) — applied right to left."],
        ]}
      />
      <Playground
        title="SVG shapes and the coordinate system"
        code={`
const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 640 300")
  .style("font", "12px sans-serif");

// a faint grid every 50 units so you can see the coordinate system
for (let x = 0; x <= 640; x += 50)
  svg.append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", 300).attr("stroke", "#eee");
for (let y = 0; y <= 300; y += 50)
  svg.append("line").attr("y1", y).attr("y2", y).attr("x1", 0).attr("x2", 640).attr("stroke", "#eee");
svg.append("text").attr("x", 4).attr("y", 14).attr("fill", "#999").text("(0,0) — y grows down ↓");

svg.append("rect")
    .attr("x", 50).attr("y", 50).attr("width", 100).attr("height", 70)
    .attr("rx", 8).attr("fill", "#4263eb");

svg.append("circle")
    .attr("cx", 250).attr("cy", 85).attr("r", 40)
    .attr("fill", "#f76707");

svg.append("line")
    .attr("x1", 330).attr("y1", 50).attr("x2", 430).attr("y2", 120)
    .attr("stroke", "#2f9e44").attr("stroke-width", 4).attr("stroke-linecap", "round");

// M = move to, L = line to, Q = quadratic curve, Z = close
svg.append("path")
    .attr("d", "M470,120 L520,50 Q560,20 590,70 L590,120 Z")
    .attr("fill", "#ae3ec9").attr("fill-opacity", 0.6)
    .attr("stroke", "#ae3ec9");

// A group: transform moves and rotates everything inside it
const g = svg.append("g").attr("transform", "translate(320,220) rotate(-15)");
g.append("rect").attr("x", -60).attr("y", -25).attr("width", 120).attr("height", 50)
    .attr("fill", "none").attr("stroke", "#212529").attr("stroke-dasharray", "4 3");
g.append("text")
    .attr("text-anchor", "middle")        // center horizontally
    .attr("dominant-baseline", "middle")  // center vertically
    .attr("font-size", 16)
    .text("inside a <g>");
g.append("circle").attr("r", 3).attr("fill", "crimson"); // the group's origin

log("rect bbox:", svg.select("rect:nth-of-type(1)").node().getBBox());
`}
      />
      <Callout type="warning" title="Common SVG surprises">
        <ul>
          <li>
            <code>&lt;line&gt;</code> and unfilled <code>&lt;path&gt;</code>s are invisible without a{" "}
            <code>stroke</code>.
          </li>
          <li>
            Text is positioned by its <em>baseline</em>, so <code>y=0</code> puts text above the top edge.
          </li>
          <li>
            SVG elements must be created in the SVG namespace — <code>selection.append(&quot;circle&quot;)</code> handles
            this for you, but <code>innerHTML</code> tricks and <code>document.createElement</code> do not.
          </li>
        </ul>
      </Callout>

      <h2>The margin convention</h2>
      <p>
        Charts need room around the plotting area for axes and labels. The standard D3 pattern is to define a{" "}
        <code>margin</code> object, then either translate a <code>&lt;g&gt;</code> by the top-left margin or bake the
        margins into your scale ranges. Everything inside is drawn in the &quot;inner&quot; coordinate space.
      </p>
      <CodeBlock>{`
const width = 640, height = 400;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const x = d3.scaleLinear().range([margin.left, width - margin.right]);
const y = d3.scaleLinear().range([height - margin.bottom, margin.top]); // flipped: bigger = higher
`}</CodeBlock>
      <Playground
        title="The margin convention, visualized"
        code={`
const W = 640, H = 320;
const margin = { top: 30, right: 30, bottom: 40, left: 50 };

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "12px sans-serif");

// the whole SVG
svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#fff4e6");

// the plotting area
svg.append("rect")
    .attr("x", margin.left).attr("y", margin.top)
    .attr("width", W - margin.left - margin.right)
    .attr("height", H - margin.top - margin.bottom)
    .attr("fill", "#e7f5ff").attr("stroke", "#339af0");

// scales map data into the inner area
const data = d3.range(12).map(i => ({ x: i, y: 20 + 60 * Math.abs(Math.sin(i / 2)) }));
const x = d3.scaleLinear().domain([0, 11]).range([margin.left, W - margin.right]);
const y = d3.scaleLinear().domain([0, 100]).range([H - margin.bottom, margin.top]);

svg.append("g")
    .attr("transform", \`translate(0,\${H - margin.bottom})\`)
    .call(d3.axisBottom(x));
svg.append("g")
    .attr("transform", \`translate(\${margin.left},0)\`)
    .call(d3.axisLeft(y).ticks(5));

svg.append("g").attr("fill", "#1c7ed6")
  .selectAll("circle")
  .data(data)
  .join("circle")
    .attr("cx", d => x(d.x))
    .attr("cy", d => y(d.y))
    .attr("r", 5);

// label the margins
const label = (x, y, t) => svg.append("text").attr("x", x).attr("y", y)
  .attr("text-anchor", "middle").attr("fill", "#d9480f").text(t);
label(W / 2, 18, "margin.top");
label(W / 2, H - 6, "margin.bottom (axis lives here)");
svg.append("text").attr("transform", \`translate(14,\${H / 2}) rotate(-90)\`)
  .attr("text-anchor", "middle").attr("fill", "#d9480f").text("margin.left");
`}
      />

      <h2>Using D3 in a real project</h2>
      <p>Install the package from npm:</p>
      <CodeBlock lang="bash">{`npm install d3
# TypeScript types
npm install --save-dev @types/d3`}</CodeBlock>
      <p>Then import the whole namespace — this is what the playgrounds do:</p>
      <CodeBlock>{`
import * as d3 from "d3";

const x = d3.scaleLinear().domain([0, 100]).range([0, 640]);
`}</CodeBlock>
      <p>
        Or install and import individual modules to keep dependencies minimal (modern bundlers tree-shake the full{" "}
        <code>d3</code> package well, so this matters less than it used to):
      </p>
      <CodeBlock>{`
// npm install d3-scale d3-shape
import { scaleLinear } from "d3-scale";
import { line, curveMonotoneX } from "d3-shape";
`}</CodeBlock>
      <p>Without a build step, load the ES module straight from a CDN:</p>
      <CodeBlock lang="html">{`
<script type="module">
  import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
  d3.select("body").append("p").text("Hello, D3!");
</script>
`}</CodeBlock>
      <Callout type="tip">
        <p>
          D3 v7 is published as pure ES modules. In older CommonJS setups (like Jest without ESM support) you may need
          to transform <code>d3</code> or mock it. Frameworks like Next.js and Vite handle it out of the box.
        </p>
      </Callout>

      <Exercises
        items={[
          <>In the first playground, color each bar with <code>d3.interpolateTurbo(d / 42)</code> instead of steelblue.</>,
          <>
            In the SVG primer, add a <code>&lt;ellipse&gt;</code> and a second <code>&lt;g&gt;</code> with{" "}
            <code>scale(2)</code>. What happens to the stroke width?
          </>,
          <>
            Draw a smiley face using only <code>circle</code> and one <code>path</code> with an <code>A</code> (arc)
            command.
          </>,
          <>In the margin example, change <code>margin.left</code> to 100 and re-run. Which elements move and why?</>,
        ]}
      />
    </>
  );
}
