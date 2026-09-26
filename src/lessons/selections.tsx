import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Almost everything in D3 starts with a <strong>selection</strong>: a wrapper around one or more DOM elements
        that lets you read and change them with chainable methods. If you have used jQuery, this will feel familiar —
        but selections become far more powerful once we bind data to them in the next lesson.
      </p>

      <h2>select and selectAll</h2>
      <p>
        <code>d3.select(selector)</code> returns the <em>first</em> matching element; <code>d3.selectAll(selector)</code>{" "}
        returns <em>all</em> of them. Both accept a CSS selector string or a DOM node. You can also select{" "}
        <em>within</em> a selection: <code>selection.select(&quot;p&quot;)</code> searches inside each selected element.
      </p>
      <p>
        In these playgrounds, <code>el</code> is the empty output <code>&lt;div&gt;</code>, so{" "}
        <code>d3.select(el)</code> is always our starting point.
      </p>
      <Playground
        title="Selecting and modifying"
        code={`
const root = d3.select(el);

// append() creates a child and returns a selection of the NEW element
root.append("h3").text("Hello from D3");

for (const fruit of ["apple", "banana", "cherry"]) {
  root.append("p").attr("class", "fruit").text(fruit);
}

// selectAll within root, then style every match at once
root.selectAll(".fruit")
  .style("color", "tomato")
  .style("font-weight", "bold");

// select() only grabs the first match
root.select(".fruit").style("text-decoration", "underline");

log("fruit count:", root.selectAll(".fruit").size());
`}
      />

      <h2>Method chaining</h2>
      <p>
        Most selection methods return the <em>same</em> selection, so you can chain them. The big exception is{" "}
        <code>append</code> (and <code>insert</code>, <code>select</code>, <code>selectAll</code>) — these return a{" "}
        <em>new</em> selection. Indentation conventions help make this visible:
      </p>
      <CodeBlock>{`
d3.select(el)
  .append("svg")          // ← now the selection is the <svg>
    .attr("width", 200)
    .attr("height", 100)
  .append("circle")       // ← now it's the <circle>
    .attr("cx", 50)
    .attr("cy", 50)
    .attr("r", 40);
`}</CodeBlock>
      <Callout type="tip">
        <p>
          Four spaces of indent for methods that return the <em>same</em> selection, two spaces for methods that
          change it. Mike Bostock&apos;s examples use this convention everywhere, and it makes long chains readable.
        </p>
      </Callout>

      <h2>attr, style, property, classed, text, html</h2>
      <ApiTable
        rows={[
          ["selection.attr(name, value)", "Set an attribute (e.g. SVG geometry like cx, width, fill)."],
          ["selection.style(name, value)", "Set an inline CSS property."],
          ["selection.property(name, value)", "Set a raw DOM property (e.g. an input's checked or value)."],
          ["selection.classed(names, bool)", "Add or remove CSS classes."],
          ["selection.text(value)", "Set text content."],
          ["selection.html(value)", "Set inner HTML (HTML elements only, not SVG)."],
          ["selection.remove()", "Remove the selected elements from the document."],
          ["selection.each(fn)", "Run a function for each element; `this` is the DOM node."],
          ["selection.call(fn, ...args)", "Call fn(selection, ...args) once — great for reusable components."],
        ]}
      />
      <p>
        Every setter accepts either a constant or a <strong>function</strong>. The function is called per element
        with <code>(d, i, nodes)</code> — the bound datum, the index, and the node group. We don&apos;t have data yet,
        but the index already makes this useful:
      </p>
      <Playground
        title="Functions as values"
        code={`
const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 600 140");

for (let k = 0; k < 10; k++) svg.append("rect");

svg.selectAll("rect")
    .attr("x", (d, i) => 10 + i * 58)
    .attr("y", (d, i) => 120 - (i + 1) * 11)
    .attr("width", 48)
    .attr("height", (d, i) => (i + 1) * 11)
    .attr("rx", 4)
    .attr("fill", (d, i) => d3.interpolateViridis(i / 9))
    .classed("even", (d, i) => i % 2 === 0);

log("even bars:", svg.selectAll(".even").size());
`}
      />

      <h2>Getters</h2>
      <p>
        Called without a value, most of these methods act as <strong>getters</strong> and return the value for the
        first element. <code>selection.node()</code> returns the first raw DOM node, and <code>selection.nodes()</code>{" "}
        returns them all as an array.
      </p>
      <Playground
        title="Reading values back"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 300 80");
const c = svg.append("circle").attr("cx", 40).attr("cy", 40).attr("r", 30).attr("fill", "steelblue");

log("r attribute:", c.attr("r"));
log("fill:", c.attr("fill"));
log("node:", c.node());
log("bounding box:", c.node().getBBox());
`}
      />

      <h2>Reusable components with call()</h2>
      <p>
        <code>selection.call(fn)</code> passes the selection to a function and returns the selection, so you can
        package up styling or behavior and keep the chain going. D3&apos;s own axes, zoom and drag behaviors are all
        applied this way.
      </p>
      <Playground
        title="selection.call"
        code={`
function badge(selection, color) {
  selection
    .style("display", "inline-block")
    .style("padding", "4px 10px")
    .style("margin", "4px")
    .style("border-radius", "999px")
    .style("color", "white")
    .style("background", color);
}

const root = d3.select(el);
root.append("span").text("selection").call(badge, "#e8590c");
root.append("span").text("data join").call(badge, "#1971c2");
root.append("span").text("scales").call(badge, "#2f9e44");
`}
      />

      <Exercises
        items={[
          <>In the first example, make every other fruit a different color using a function and the index.</>,
          <>Draw a row of 20 circles whose radius grows with the index.</>,
          <>
            Write a <code>highlight(selection)</code> function and apply it with <code>.call</code> to only the last
            rect in the bar example (hint: <code>svg.select(&quot;rect:last-child&quot;)</code>).
          </>,
        ]}
      />
    </>
  );
}
