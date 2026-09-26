import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        A <strong>chord diagram</strong> shows flows or relationships <em>between</em> a set of groups: people moving
        between countries, trade between regions, users switching between phone brands. Groups are arranged as arcs
        around a circle, and each pair of groups is connected by a <strong>ribbon</strong> whose width encodes the
        amount of flow. The input is always a square <strong>matrix</strong>, where <code>matrix[i][j]</code> is the
        flow from group <code>i</code> to group <code>j</code>.
      </p>
      <p>
        As usual, D3 splits the job in two: a <em>layout</em> (<code>d3.chord</code>) turns the matrix into angles,
        and <em>shape generators</em> (<code>d3.arc</code> for the outer groups, <code>d3.ribbon</code> for the
        ribbons) turn those angles into SVG paths.
      </p>

      <h2>From matrix to angles</h2>
      <p>
        Here&apos;s a classic small dataset: survey respondents&apos; hair color and their preferred partner&apos;s
        hair color. Row <code>i</code> is the respondent&apos;s color; column <code>j</code> is the preference.
      </p>
      <CodeBlock>{`
//           black  blond  brown  red
const matrix = [
  [11975,  5871, 8916, 2868],  // black
  [ 1951, 10048, 2060, 6171],  // blond
  [ 8010, 16145, 8090, 8045],  // brown
  [ 1013,   990,  940, 6907],  // red
];
`}</CodeBlock>
      <p>
        <code>d3.chord()(matrix)</code> returns an array of <strong>chords</strong>, plus a <code>groups</code>{" "}
        property. Each group has <code>index</code>, <code>startAngle</code>, <code>endAngle</code> and{" "}
        <code>value</code> (the row total). Each chord has a <code>source</code> and a <code>target</code>{" "}
        <em>subgroup</em>, each with its own angles and value. For the default undirected layout, the chord between{" "}
        <code>i</code> and <code>j</code> combines <code>matrix[i][j]</code> (the end on group <code>i</code>) and{" "}
        <code>matrix[j][i]</code> (the end on group <code>j</code>), so a ribbon can be wider at one end than the
        other. D3 labels the <em>larger</em> end as <code>source</code>, so coloring ribbons by{" "}
        <code>d.source.index</code> colors each pair by its dominant side.
      </p>
      <Playground
        title="A minimal chord diagram"
        code={`
const names = ["black", "blond", "brown", "red"];
const colors = ["#222222", "#ffdd89", "#957244", "#f26223"];
const matrix = [
  [11975,  5871, 8916, 2868],
  [ 1951, 10048, 2060, 6171],
  [ 8010, 16145, 8090, 8045],
  [ 1013,   990,  940, 6907],
];

const chords = d3.chord().padAngle(0.05)(matrix);
log("groups:", chords.groups.map(g => ({ index: g.index, value: g.value, startAngle: +g.startAngle.toFixed(2) })));
log("black ↔ blond chord:", chords.find(c => c.source.index + c.target.index === 1));

const S = 480, outer = S / 2 - 20, inner = outer - 18;
const svg = d3.select(el).append("svg").attr("viewBox", [-S / 2, -S / 2, S, S]).style("max-width", "480px");

// outer arcs, one per group
svg.append("g").selectAll("path").data(chords.groups).join("path")
    .attr("d", d3.arc().innerRadius(inner).outerRadius(outer))
    .attr("fill", d => colors[d.index]).attr("stroke", "#fff");

// ribbons, one per chord
svg.append("g").attr("fill-opacity", 0.75).selectAll("path").data(chords).join("path")
    .attr("d", d3.ribbon().radius(inner - 1))
    .attr("fill", d => colors[d.source.index])
    .attr("stroke", "#fff").attr("stroke-width", 0.5);
`}
      />
      <Callout type="note">
        <p>
          <code>d3.arc</code> is happy to draw a group directly because a group already has{" "}
          <code>startAngle</code> and <code>endAngle</code> — you only supply the radii. Likewise{" "}
          <code>d3.ribbon</code> reads <code>d.source</code> and <code>d.target</code> angles, and you supply the
          radius. Angles are in radians, measured clockwise from 12 o&apos;clock.
        </p>
      </Callout>

      <h2>The API</h2>
      <ApiTable
        rows={[
          ["d3.chord()", "Undirected layout: one chord per pair {i, j}; its two ends are matrix[i][j] and matrix[j][i], and source is the larger end."],
          ["d3.chordDirected()", "Directed layout: one chord per non-zero matrix[i][j] (source i, target j), equal width at both ends. Each group arc holds its outgoing and incoming flows, so its value is row sum + column sum. Pair with ribbonArrow."],
          ["d3.chordTranspose()", "chordDirected on the transposed matrix: matrix[i][j] is read as a flow from j to i. Use it when your matrix is stored as to × from."],
          ["chord(matrix)", <>Returns the chords array; <code>chords.groups</code> holds the groups.</>],
          ["chord.padAngle(radians)", "Gap between adjacent groups (default 0)."],
          ["chord.sortGroups(compare)", "Order groups around the circle by their total, e.g. d3.descending."],
          ["chord.sortSubgroups(compare)", "Order subgroups within each group by value."],
          ["chord.sortChords(compare)", "Z-order of the chords (which ribbons are drawn on top), by combined value."],
          ["d3.ribbon()", "Ribbon generator: two arcs joined by quadratic curves through the center."],
          ["d3.ribbonArrow()", "A ribbon with an arrowhead at the target end; .headRadius(px)."],
          ["ribbon.radius / sourceRadius / targetRadius", "Radius of the ribbon ends (can be per-end)."],
          ["ribbon.padAngle(radians)", "Shrink each ribbon end slightly so neighbors don't touch."],
          ["ribbon.source / target / startAngle / endAngle", "Accessors, if your data isn't shaped like d3.chord output."],
          ["ribbon.context(ctx)", "Render to a canvas 2D context instead of returning a path string."],
        ]}
      />

      <h2>Ribbons on their own</h2>
      <p>
        A ribbon generator doesn&apos;t care where its angles come from. Feeding it hand-made objects makes the
        geometry obvious: each end is an arc segment on the circle, and the two ends are joined by curves bent
        toward the center. <code>ribbonArrow</code> turns the target end into an arrowhead.
      </p>
      <Playground
        title="d3.ribbon and d3.ribbonArrow by hand"
        code={`
const S = 300, R = 120;
const deg = d => d * Math.PI / 180;
const chord = {
  source: { startAngle: deg(-20), endAngle: deg(20) },
  target: { startAngle: deg(150), endAngle: deg(190) },
};

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, 2 * S, S]);
[[d3.ribbon().radius(R), "d3.ribbon()"],
 [d3.ribbonArrow().radius(R).headRadius(24), "d3.ribbonArrow()"]].forEach(([gen, title], i) => {
  const g = svg.append("g").attr("transform", "translate(" + (S / 2 + i * S) + "," + S / 2 + ")");
  g.append("circle").attr("r", R).attr("fill", "none").attr("stroke", "#ddd");
  g.append("path").attr("d", gen(chord)).attr("fill", i ? "#e8590c" : "#1971c2").attr("fill-opacity", 0.7);
  g.append("text").attr("y", S / 2 - 8).attr("text-anchor", "middle").attr("font-size", 13)
      .attr("font-family", "monospace").text(title);
  log(title, "→", gen(chord).slice(0, 60) + "…");
});
`}
      />

      <h2>Layout options: directed, sorted, padded</h2>
      <p>
        With plain <code>d3.chord</code> a ribbon represents <em>two</em> flows (i→j and j→i). That&apos;s compact but
        makes it hard to tell direction. <code>d3.chordDirected</code> emits a separate chord for each direction,
        each with the same width at both ends — use it with <code>d3.ribbonArrow</code> so direction is explicit.
        Each group arc then contains both what the group sends and what it receives, so arcs are bigger than in
        the undirected layout. <code>d3.chordTranspose</code> reads the matrix the other way round (columns are
        sources), which reverses every arrow. Play with the options below and watch the angles change.
      </p>
      <Playground
        title="Chord layout explorer"
        code={`
const names = ["black", "blond", "brown", "red"];
const colors = ["#222222", "#ffdd89", "#957244", "#f26223"];
const matrix = [
  [11975,  5871, 8916, 2868],
  [ 1951, 10048, 2060, 6171],
  [ 8010, 16145, 8090, 8045],
  [ 1013,   990,  940, 6907],
];
const state = { layout: "chord", sortGroups: "none", sortSubgroups: "none", pad: 0.04 };
const sorts = { none: null, descending: d3.descending, ascending: d3.ascending };

const form = d3.select(el).append("div").style("display", "flex").style("gap", "12px")
    .style("flex-wrap", "wrap").style("font-size", "13px");
function picker(key, options) {
  const lab = form.append("label").text(key + " ");
  lab.append("select").on("change", e => { state[key] = e.target.value; draw(); })
    .selectAll("option").data(options).join("option").text(d => d);
}
picker("layout", ["chord", "chordDirected", "chordTranspose"]);
picker("sortGroups", Object.keys(sorts));
picker("sortSubgroups", Object.keys(sorts));
const padLab = form.append("label").text("padAngle ");
padLab.append("input").attr("type", "range").attr("min", 0).attr("max", 0.3).attr("step", 0.01)
    .property("value", state.pad).on("input", e => { state.pad = +e.target.value; draw(); });

const S = 480, outer = S / 2 - 40, inner = outer - 16;
const svg = d3.select(el).append("svg").attr("viewBox", [-S / 2, -S / 2, S, S]).style("max-width", "480px")
    .attr("font-family", "sans-serif").attr("font-size", 12);
const gArcs = svg.append("g"), gRibbons = svg.append("g").attr("fill-opacity", 0.75), gLabels = svg.append("g");

function draw() {
  const layout = d3[state.layout]().padAngle(state.pad);
  if (sorts[state.sortGroups]) layout.sortGroups(sorts[state.sortGroups]);
  if (sorts[state.sortSubgroups]) layout.sortSubgroups(sorts[state.sortSubgroups]);
  const chords = layout(matrix);
  const directed = state.layout !== "chord";
  const ribbon = (directed ? d3.ribbonArrow().headRadius(12) : d3.ribbon()).radius(inner - 1)
      .padAngle(directed ? 1 / inner : 0);

  gArcs.selectAll("path").data(chords.groups).join("path")
      .attr("d", d3.arc().innerRadius(inner).outerRadius(outer))
      .attr("fill", d => colors[d.index]);
  gRibbons.selectAll("path").data(chords).join("path")
      .attr("d", ribbon)
      .attr("fill", d => colors[d.source.index])
      .attr("stroke", "#fff").attr("stroke-width", 0.5);
  gLabels.selectAll("text").data(chords.groups).join("text")
      .attr("transform", d => {
        const a = (d.startAngle + d.endAngle) / 2;
        return "translate(" + Math.sin(a) * (outer + 18) + "," + -Math.cos(a) * (outer + 18) + ")";
      })
      .attr("text-anchor", "middle").attr("dy", "0.35em").text(d => names[d.index]);
  log(state.layout, "→", chords.length, "chords; group order:",
      chords.groups.slice().sort((a, b) => a.startAngle - b.startAngle).map(g => names[g.index]).join(", "));
}
draw();
`}
      />
      <Callout type="warning" title="Self-flows and zero rows">
        <p>
          Diagonal entries (<code>matrix[i][i]</code>) become chords that start and end on the same group — a
          &quot;hump&quot; ribbon. Both layouts skip zero entries, so set the diagonal to 0 if staying put
          isn&apos;t meaningful (as in migration). A group whose row and column are all
          zero gets zero width but still takes a <code>padAngle</code> gap, so filter such groups out beforehand.
        </p>
      </Callout>

      <h2>A complete example: migration flows</h2>
      <p>
        Let&apos;s put everything together with directed flows between world regions. The numbers are{" "}
        <em>illustrative</em> (in millions of people, loosely inspired by UN migrant stock estimates), and the
        diagonal is zero. We add group labels, tick marks along each arc, arrow ribbons, and a hover interaction
        that fades every ribbon not connected to the hovered region. Hovering a ribbon shows its exact flow.
      </p>
      <Playground
        title="Migration between regions (directed)"
        code={`
const names = ["Africa", "Asia", "Europe", "Latin America", "North America", "Oceania"];
// matrix[i][j] = people (millions) born in region i living in region j — illustrative numbers
const matrix = [
  [ 0,  4, 11, 0.1, 2.8, 0.6],
  [ 3,  0, 21, 0.4, 18,  4],
  [ 1,  7,  0, 1.4, 7,   3],
  [ 0.1, 0.5, 5, 0, 26, 0.2],
  [ 0.2, 1.2, 1.1, 1.6, 0, 0.3],
  [ 0.05, 0.1, 0.3, 0.02, 0.3, 0],
];
const color = d3.scaleOrdinal(names, d3.schemeTableau10);
const S = 640, outer = S / 2 - 90, inner = outer - 14;

const chords = d3.chordDirected()
    .padAngle(10 / inner)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending)(matrix);

const arc = d3.arc().innerRadius(inner).outerRadius(outer);
const ribbon = d3.ribbonArrow().radius(inner - 1).padAngle(1 / inner).headRadius(10);

const svg = d3.select(el).append("svg").attr("viewBox", [-S / 2, -S / 2, S, S])
    .attr("font-family", "sans-serif").attr("font-size", 10);

const ribbons = svg.append("g").attr("fill-opacity", 0.8)
  .selectAll("path").data(chords).join("path")
    .attr("d", ribbon)
    .attr("fill", d => color(names[d.source.index]))
    .attr("stroke", "white").attr("stroke-width", 0.5)
    .style("mix-blend-mode", "multiply");
ribbons.append("title")
    .text(d => names[d.source.index] + " → " + names[d.target.index] + ": " + d.source.value + "M");

// ticks every 5M along each group arc
function groupTicks(d, step) {
  const k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, d.value, step).map(value => ({ value, angle: value * k + d.startAngle }));
}

const group = svg.append("g").selectAll("g").data(chords.groups).join("g");
group.append("path").attr("d", arc).attr("fill", d => color(names[d.index])).attr("stroke", "white");

const tick = group.append("g").selectAll("g").data(d => groupTicks(d, 5)).join("g")
    .attr("transform", d => "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + outer + ",0)");
tick.append("line").attr("stroke", "#555").attr("x2", 5);
tick.append("text")
    .attr("x", 8).attr("dy", "0.35em")
    .attr("transform", d => d.angle > Math.PI ? "rotate(180) translate(-16)" : null)
    .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
    .attr("fill", "#555")
    .text(d => d.value === 0 ? "" : d.value + "M");

// region labels, placed outside the ticks
group.append("text")
    .each(d => { d.mid = (d.startAngle + d.endAngle) / 2; })
    .attr("transform", d => "rotate(" + (d.mid * 180 / Math.PI - 90) + ") translate(" + (outer + 36) + ")" +
      (d.mid > Math.PI ? " rotate(180)" : ""))
    .attr("text-anchor", d => d.mid > Math.PI ? "end" : "start")
    .attr("dy", "0.35em").attr("font-size", 12).attr("font-weight", "bold")
    .text(d => names[d.index]);

group
  .on("pointerenter", (event, g) => {
    ribbons.transition().duration(150)
        .attr("fill-opacity", d => d.source.index === g.index || d.target.index === g.index ? 0.9 : 0.06);
  })
  .on("pointerleave", () => ribbons.transition().duration(150).attr("fill-opacity", 0.8));

const outflow = d3.sum(matrix[4]), inflow = d3.sum(matrix, row => row[4]);
log("North America: out", outflow.toFixed(1) + "M", "in", inflow.toFixed(1) + "M");
`}
      />
      <p>
        In <code>chordDirected</code>, each region&apos;s arc is split into two parts: the bases of its outgoing
        ribbons (emigration) and the arrowheads of incoming ones (immigration). With{" "}
        <code>sortSubgroups(d3.descending)</code>, each arc lists its outgoing flows first (largest first),
        followed by its incoming flows (smallest first). Hover North America: almost all of its
        arc is arrowheads, because it mostly receives. If your matrix were stored as destination × origin, you
        would use <code>d3.chordTranspose()</code> instead to get the arrows pointing the right way.
      </p>

      <Exercises
        items={[
          <>
            In the minimal example, color each ribbon by its <em>target</em> group instead of its source. Which
            reading of the data does each coloring emphasize?
          </>,
          <>
            Add a percentage to the hover title of each ribbon: the flow as a share of its source region&apos;s
            total emigration.
          </>,
          <>
            Change the migration chart to <code>d3.chordTranspose()</code>. What happens to the arrows? Then
            change it to plain <code>d3.chord()</code> with <code>d3.ribbon()</code> — which regions look
            different, and why?
          </>,
          <>
            Render the hair-color diagram to a <code>&lt;canvas&gt;</code> using <code>arc.context(ctx)</code> and{" "}
            <code>ribbon.context(ctx)</code>.
          </>,
        ]}
      />
    </>
  );
}
