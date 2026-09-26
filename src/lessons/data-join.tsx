import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        The <strong>data join</strong> is the idea that gives D3 its name: <em>data-driven</em> documents. Instead of
        writing a loop that creates one element per data point, you declare &quot;there should be one{" "}
        <code>&lt;circle&gt;</code> per item in this array&quot; and let D3 work out which elements to create, which to
        update and which to remove. Master this lesson and the rest of D3 falls into place.
      </p>

      <h2>Binding data with data()</h2>
      <p>
        <code>selection.data(array)</code> pairs each element in a selection with an item from the array — by default,
        by index: the first element gets <code>array[0]</code>, the second gets <code>array[1]</code>, and so on. The
        bound value is stored on the DOM node itself (as <code>node.__data__</code>), and it is the <code>d</code>{" "}
        passed to every attribute function afterwards.
      </p>
      <p>
        Pairing produces three groups:
      </p>
      <ul>
        <li>
          <strong>update</strong> — elements that already exist and got a datum.
        </li>
        <li>
          <strong>enter</strong> — data items with no element yet (placeholders for elements you need to create).
        </li>
        <li>
          <strong>exit</strong> — existing elements left over with no datum (usually removed).
        </li>
      </ul>
      <p>
        The trick that confuses everyone at first: you <code>selectAll</code> elements that <em>don&apos;t exist
        yet</em>. On the first render the selection is empty, so every datum lands in the enter group.
      </p>

      <h2>join(): the easy way</h2>
      <p>
        Since D3 v6, <code>selection.join(&quot;circle&quot;)</code> handles all three groups: it appends a circle for
        each entering datum, removes exiting elements, and returns the merged enter + update selection so you can set
        attributes on everything at once.
      </p>
      <Playground
        title="Your first data join"
        code={`
const data = [12, 31, 22, 17, 25, 18, 29, 14, 9];

const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 640 200")
  .style("font", "12px sans-serif");

svg.selectAll("circle")        // empty selection — no circles yet
  .data(data)                  // bind 9 numbers → 9 entering placeholders
  .join("circle")              // create a circle for each
    .attr("cx", (d, i) => 40 + i * 70)
    .attr("cy", 100)
    .attr("r", d => d * 1.3)
    .attr("fill", "#4c6ef5")
    .attr("fill-opacity", 0.75);

svg.selectAll("text")
  .data(data)
  .join("text")
    .attr("x", (d, i) => 40 + i * 70)
    .attr("y", 100)
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .text(d => d);

log("bound data:", svg.selectAll("circle").data());
log("first node's __data__:", svg.select("circle").node().__data__);
`}
      />

      <h2>Enter, update and exit, explicitly</h2>
      <p>
        When you need different treatment for each group — typically to animate elements in and out — pass three
        functions to <code>join</code>. Each receives the corresponding selection; enter and update must return a
        selection, which <code>join</code> merges and returns.
      </p>
      <CodeBlock>{`
selection.data(data)
  .join(
    enter => enter.append("circle").attr("r", 0),   // create
    update => update.attr("fill", "gray"),          // modify existing
    exit => exit.remove()                           // delete leftovers
  )
  .attr("cx", d => x(d));                           // applies to enter + update
`}</CodeBlock>
      <p>
        Under the hood this is just sugar for the older, lower-level API: <code>selection.enter()</code>,{" "}
        <code>selection.exit()</code>, and <code>merge()</code>. You&apos;ll still see this in older examples:
      </p>
      <CodeBlock>{`
const circles = svg.selectAll("circle").data(data);
circles.exit().remove();
circles.enter().append("circle")
  .merge(circles)
    .attr("cx", d => x(d));
`}</CodeBlock>
      <Playground
        title="Seeing the three groups"
        code={`
const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 640 140")
  .style("font", "14px sans-serif");

// Start with 4 letters on screen
function render(letters) {
  svg.selectAll("text")
    .data(letters)
    .join(
      enter => enter.append("text").attr("fill", "#2f9e44"),   // green = entered
      update => update.attr("fill", "#868e96"),                 // gray = updated
      exit => exit.attr("fill", "#e03131").text(d => d + "✕")    // red = exiting (kept to show you)
    )
      .attr("x", (d, i) => 20 + i * 44)
      .attr("y", 70)
      .attr("font-size", 28)
      .text(d => d);
}

render(["a", "b", "c", "d"]);
log("after first render:", svg.selectAll("text").size(), "elements");

// by INDEX: 6 data vs 4 elements → 4 update, 2 enter
render(["x", "y", "z", "w", "u", "v"]);
log("after second render: 4 updated (gray), 2 entered (green)");

// Try: render(["q", "r"]) → 2 update, 4 exit (red, not removed in this demo)
`}
      />

      <h2>Key functions: tracking identity</h2>
      <p>
        By default, data is matched to elements <strong>by index</strong>. That works for static charts, but breaks
        down when the data changes: if you remove the first item, every element gets the datum of its neighbor, and
        animations show elements morphing into each other instead of the removed one leaving.
      </p>
      <p>
        A <strong>key function</strong>, passed as the second argument to <code>data()</code>, returns a string
        identifier for each datum. D3 then matches new data to existing elements by key, so &quot;Alice&quot; stays
        attached to Alice&apos;s element no matter where she moves in the array.
      </p>
      <CodeBlock>{`
svg.selectAll("rect")
  .data(people, d => d.name)   // key by name
  .join("rect");
`}</CodeBlock>
      <Callout type="warning" title="Keys must be unique and stable">
        <p>
          Duplicate keys put the extras in enter (for data) or exit (for elements). Never use the index as a key
          (that&apos;s the default anyway), and never generate random keys — they&apos;d make every element exit and
          re-enter on each update.
        </p>
      </Callout>

      <h2>The general update pattern</h2>
      <p>
        Combine keys, enter/update/exit functions and transitions and you get the classic <em>general update
        pattern</em>. Below, a random subset of the alphabet is chosen every 1.8 seconds. Entering letters drop in from
        above in green, updating letters slide to their new position, and exiting letters fall away in red. Try
        deleting the key function <code>d =&gt; d</code> and watch the animation break.
      </p>
      <Playground
        title="General update pattern"
        code={`
const W = 640, H = 140;
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "bold 30px monospace");

const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function update(letters) {
  const t = svg.transition().duration(750);

  svg.selectAll("text")
    .data(letters, d => d)                        // ← key function
    .join(
      enter => enter.append("text")
          .attr("fill", "#2f9e44")
          .attr("x", (d, i) => 16 + i * 24)
          .attr("y", -30)
          .text(d => d)
        .call(enter => enter.transition(t).attr("y", 80)),
      update => update
          .attr("fill", "#343a40")
        .call(update => update.transition(t).attr("x", (d, i) => 16 + i * 24)),
      exit => exit
          .attr("fill", "#e03131")
        .call(exit => exit.transition(t).attr("y", H + 30).remove())
    );
}

update(alphabet);
d3.interval(() => {
  const letters = d3.shuffle(alphabet.slice())
    .slice(0, 6 + Math.floor(Math.random() * 20))
    .sort();
  update(letters);
  log(letters.join(""));
}, 1800);
`}
      />
      <Callout type="tip">
        <p>
          Notice the pattern <code>.call(sel =&gt; sel.transition(t)...)</code>. Transitions are not selections, so
          returning <code>enter.transition()</code> from the enter function would break <code>join</code>&apos;s merge.
          Using <code>call</code> starts the transition as a side effect while still returning the selection.
        </p>
      </Callout>

      <h2>A realistic example: a sortable, updating bar chart</h2>
      <p>
        Here objects are keyed by <code>name</code>. Each tick, values change, some items drop out and new ones may
        arrive. Bars are sorted by value, so the key function is what lets each bar glide to its new rank.
      </p>
      <Playground
        title="Keyed bar chart"
        code={`
const W = 640, H = 320;
const margin = { top: 10, right: 50, bottom: 10, left: 80 };
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "13px sans-serif");

const names = ["Ana", "Bruno", "Carla", "Diego", "Elena", "Felipe", "Gabi", "Hugo", "Iris", "João"];
const color = d3.scaleOrdinal(names, d3.schemeTableau10);
const x = d3.scaleLinear().range([margin.left, W - margin.right]);
const y = d3.scaleBand().range([margin.top, H - margin.bottom]).padding(0.15);

function randomData() {
  return d3.shuffle(names.slice())
    .slice(0, 5 + Math.floor(Math.random() * 5))
    .map(name => ({ name, value: Math.round(10 + Math.random() * 90) }))
    .sort((a, b) => d3.descending(a.value, b.value));
}

function update(data) {
  x.domain([0, d3.max(data, d => d.value)]);
  y.domain(data.map(d => d.name));
  const t = svg.transition().duration(800);

  svg.selectAll("g.bar")
    .data(data, d => d.name)
    .join(
      enter => {
        const g = enter.append("g").attr("class", "bar")
            .attr("transform", \`translate(0,\${H})\`)
            .attr("opacity", 0);
        g.append("rect").attr("x", margin.left).attr("fill", d => color(d.name));
        g.append("text").attr("class", "name").attr("x", margin.left - 6)
            .attr("text-anchor", "end").attr("dy", "0.35em").text(d => d.name);
        g.append("text").attr("class", "value").attr("dy", "0.35em").attr("fill", "#495057");
        return g;
      },
      update => update,
      exit => exit.call(g => g.transition(t).attr("opacity", 0)
          .attr("transform", \`translate(0,\${H})\`).remove())
    )
    .call(g => g.transition(t)
        .attr("opacity", 1)
        .attr("transform", d => \`translate(0,\${y(d.name)})\`))
    .call(g => g.select("rect").transition(t)
        .attr("height", y.bandwidth())
        .attr("width", d => x(d.value) - margin.left))
    .call(g => g.select(".name").attr("y", y.bandwidth() / 2))
    .call(g => g.select(".value").attr("y", y.bandwidth() / 2)
        .text(d => d.value)
        .transition(t).attr("x", d => x(d.value) + 6));
}

update(randomData());
d3.interval(() => update(randomData()), 2000);
`}
      />
      <p>
        Note how <code>g.select(&quot;rect&quot;)</code> works: <code>select</code> (unlike <code>selectAll</code>){" "}
        <strong>propagates</strong> the parent&apos;s datum to the child, so the rect and texts always see the latest
        bound object.
      </p>

      <h2>datum(): binding without a join</h2>
      <p>
        <code>selection.datum(value)</code> sets the bound data on every selected element <em>without</em> computing a
        join — no enter, no exit. Use it when a single element represents the whole dataset, like a line path drawn
        from an entire array:
      </p>
      <Playground
        title="datum for a single path"
        code={`
const W = 640, H = 200;
const data = d3.range(40).map(i => 100 + 60 * Math.sin(i / 4) + Math.random() * 20);
const x = d3.scaleLinear([0, data.length - 1], [20, W - 20]);
const y = d3.scaleLinear([0, 200], [H - 20, 20]);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);

svg.append("path")
    .datum(data)                   // ONE path, bound to the WHOLE array
    .attr("fill", "none")
    .attr("stroke", "#e8590c")
    .attr("stroke-width", 2.5)
    .attr("d", d3.line((d, i) => x(i), d => y(d)));

log("path datum length:", svg.select("path").datum().length);
`}
      />

      <h2>Nested data</h2>
      <p>
        Data joins compose. Join an outer array to groups, then inside each group call{" "}
        <code>selectAll(...).data(d =&gt; d.children)</code>: the data argument can be a <em>function</em> that
        receives the parent&apos;s datum and returns the child array. This is how you build tables, small multiples,
        grouped bar charts and heatmaps.
      </p>
      <Playground
        title="Nested join: a heatmap"
        code={`
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const matrix = days.map(day => ({
  day,
  hours: d3.range(24).map(h => Math.max(0, Math.sin((h - 6) / 24 * Math.PI * 2) * 50 + Math.random() * 40
    + (day === "Sat" || day === "Sun" ? -20 : 10)))
}));

const cell = 24, left = 40, top = 20;
const color = d3.scaleSequential([0, 100], d3.interpolateYlGnBu);

const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${left + 24 * cell + 10} \${top + 7 * cell + 10}\`)
  .style("font", "11px sans-serif");

const rows = svg.selectAll("g.row")
  .data(matrix)                         // outer join: one <g> per day
  .join("g")
    .attr("class", "row")
    .attr("transform", (d, i) => \`translate(\${left},\${top + i * cell})\`);

rows.append("text")
    .attr("x", -6).attr("y", cell / 2).attr("dy", "0.35em")
    .attr("text-anchor", "end")
    .text(d => d.day);

rows.selectAll("rect")
  .data(d => d.hours)                   // inner join: parent datum → child array
  .join("rect")
    .attr("x", (d, i) => i * cell)
    .attr("width", cell - 2)
    .attr("height", cell - 2)
    .attr("rx", 3)
    .attr("fill", d => color(d))
  .append("title")
    .text(d => d.toFixed(1));

svg.selectAll("text.hour")
  .data(d3.range(0, 24, 3))
  .join("text")
    .attr("class", "hour")
    .attr("x", h => left + h * cell + cell / 2)
    .attr("y", top - 6)
    .attr("text-anchor", "middle")
    .text(h => h + "h");

log("rows:", rows.size(), "cells:", svg.selectAll("rect").size());
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["selection.data(values[, key])", "Join an array (or a function of the parent datum returning one) to the selection. Returns the update selection with enter/exit attached."],
          ["selection.join(enter[, update, exit])", "Append, update and remove in one go. enter can be a tag name or a function; returns merged enter + update."],
          ["selection.enter()", "The enter selection: placeholders for data without elements."],
          ["selection.exit()", "The exit selection: elements without data."],
          ["selection.merge(other)", "Combine two selections (e.g. enter + update)."],
          ["selection.datum([value])", "Get or set bound data on each element without a join."],
          ["selection.data()", "With no arguments, returns the array of bound data."],
          ["selection.order()", "Re-insert elements so document order matches data order."],
          ["selection.sort(compare)", "Sort elements by their data and reorder the DOM."],
          ["selection.filter(filter)", "Keep only elements matching a selector or predicate(d, i)."],
        ]}
      />

      <Exercises
        items={[
          <>In the first playground, add a third element per datum — a label below each circle showing its index.</>,
          <>
            In the general update pattern, make entering letters fade in (<code>fill-opacity</code> from 0 to 1) instead
            of dropping from above.
          </>,
          <>
            Remove the key function in the keyed bar chart. Describe what goes wrong with the colors and the
            animation.
          </>,
          <>
            Turn the heatmap into an HTML <code>&lt;table&gt;</code> using the same nested join, with{" "}
            <code>tr</code> for days and <code>td</code> for hours.
          </>,
        ]}
      />
    </>
  );
}
