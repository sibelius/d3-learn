import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Color is one of the strongest channels in a visualization, and also one of the easiest to get wrong. D3
        splits the problem across three modules. <strong>d3-color</strong> parses colors and converts them between
        color spaces. <strong>d3-interpolate</strong> blends between any two values, including colors.{" "}
        <strong>d3-scale-chromatic</strong> ships dozens of carefully designed color schemes. This lesson covers
        all three.
      </p>

      <h2>Parsing and manipulating colors</h2>
      <p>
        <code>d3.color(specifier)</code> parses any CSS color string: named colors, hex, <code>rgb()</code>,{" "}
        <code>hsl()</code> and so on. It returns a color object, or <code>null</code> if the string is invalid.
        The object has channel properties (<code>r</code>, <code>g</code>, <code>b</code>, <code>opacity</code>)
        and handy methods. Colors are <strong>mutable</strong> objects, so you can change a channel and then call{" "}
        <code>toString()</code>.
      </p>
      <Playground
        title="d3.color basics"
        hideOutput
        code={`
const c = d3.color("steelblue");
log("parsed:", c);                           // {r: 70, g: 130, b: 180, opacity: 1}
log("formatHex:", c.formatHex());            // "#4682b4"
log("formatRgb:", c.formatRgb());            // "rgb(70, 130, 180)"
log("formatHsl:", c.formatHsl());
log("brighter():", c.brighter().formatHex());
log("darker(2):", c.darker(2).formatHex());

// Colors are mutable. copy() first if you want to keep the original
const faded = c.copy({ opacity: 0.4 });
log("faded:", faded + "");                   // toString() gives "rgba(70, 130, 180, 0.4)"

// Convert into other spaces
log("hsl:", d3.hsl(c));
log("lab:", d3.lab(c));
log("hcl:", d3.hcl(c));

log("invalid:", d3.color("not a color"));   // null
log("displayable?", d3.rgb(300, 0, 0).displayable(), "→ clamp:", d3.rgb(300, 0, 0).clamp() + "");
`}
      />
      <ApiTable
        rows={[
          ["d3.color(string)", "Parse any CSS color. Returns an RGB or HSL object, or null if the string is invalid."],
          ["d3.rgb(r, g, b[, opacity])", "Red, green and blue channels from 0 to 255. Also accepts a string or another color."],
          ["d3.hsl(h, s, l[, opacity])", "Hue (degrees), saturation and lightness (0 to 1). Intuitive, but not perceptual."],
          ["d3.lab(l, a, b[, opacity])", "CIELAB. L is perceived lightness from 0 to 100. a and b are the green–red and blue–yellow axes."],
          ["d3.gray(l[, opacity])", "Shorthand for a lab color with a = b = 0."],
          ["d3.hcl(h, c, l[, opacity]) / d3.lch(l, c, h)", "Lab in polar form: hue, chroma, lightness. The perceptual version of HSL."],
          ["d3.cubehelix(h, s, l[, opacity])", "Dave Green's cubehelix space. Its lightness increases steadily."],
          ["color.brighter(k = 1) / darker(k = 1)", "Returns a new color that is lighter or darker by k steps."],
          ["color.copy(values)", "Returns a copy, optionally overriding some channels, e.g. { opacity: 0.5 }."],
          ["color.formatHex() / formatHex8() / formatRgb() / formatHsl()", "Serialize to a string. toString() is the same as formatRgb()."],
          ["color.displayable() / rgb.clamp()", "Check whether the color fits in the sRGB gamut, or clamp it into range."],
        ]}
      />

      <h2>Why perceptual color spaces matter</h2>
      <p>
        HSL is built around how screens mix light, not around how eyes see. At the same HSL lightness of 50%,
        yellow looks far brighter than blue. <strong>CIELAB</strong> and its polar form <strong>HCL</strong> are
        designed so that equal numeric steps look like roughly equal visual steps. The strip below shows it. The
        top row keeps HSL lightness fixed and changes the hue. The bottom row keeps HCL lightness fixed. The small
        gray squares show each color&apos;s actual perceived lightness (Lab L).
      </p>
      <Playground
        title="Equal lightness? HSL vs HCL"
        code={`
const hues = d3.range(0, 360, 20);
const rows = [
  { label: "d3.hsl(h, 1, 0.5)", make: h => d3.hsl(h, 1, 0.5) },
  { label: "d3.hcl(h, 60, 65)", make: h => d3.hcl(h, 60, 65) },
];
const sw = 34, W = 90 + hues.length * sw;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} 170\`).style("font", "11px sans-serif");

rows.forEach((row, ri) => {
  const g = svg.append("g").attr("transform", \`translate(0,\${10 + ri * 80})\`);
  g.append("text").attr("y", 22).text(row.label).attr("font-family", "monospace");
  const cells = g.selectAll("g").data(hues).join("g").attr("transform", (h, i) => \`translate(\${90 + i * sw},0)\`);
  cells.append("rect").attr("width", sw - 2).attr("height", 34).attr("rx", 3)
    .attr("fill", h => d3.rgb(row.make(h)).formatHex());
  // perceived lightness shown as a gray swatch
  cells.append("rect").attr("y", 38).attr("width", sw - 2).attr("height", 18).attr("rx", 3)
    .attr("fill", h => d3.gray(d3.lab(row.make(h)).l).formatHex());
  cells.append("text").attr("y", 70).attr("x", (sw - 2) / 2).attr("text-anchor", "middle").attr("fill", "#666")
    .text(h => Math.round(d3.lab(row.make(h)).l));
});
`}
      />
      <p>
        The HSL row&apos;s gray swatches jump from about 30 (blue) to about 97 (yellow). In the HCL row they stay the
        same. When color encodes <em>data</em>, that difference matters: uneven lightness makes some values look
        more important than they are.
      </p>

      <h2>Interpolating colors</h2>
      <p>
        An <strong>interpolator</strong> is a function <code>t ↦ value</code> that maps <code>t</code> in [0, 1] to a
        blend between two endpoints. <code>d3.interpolateRgb(a, b)(0.5)</code> is the color halfway between a and b.
        The color space you blend in changes the result a lot:
      </p>
      <Playground
        title="Same endpoints, different spaces"
        code={`
const a = "#7b2cbf", b = "#ffd60a";
const interps = [
  ["interpolateRgb", d3.interpolateRgb(a, b)],
  ["interpolateRgb.gamma(2.2)", d3.interpolateRgb.gamma(2.2)(a, b)],
  ["interpolateHsl", d3.interpolateHsl(a, b)],
  ["interpolateHslLong", d3.interpolateHslLong(a, b)],
  ["interpolateLab", d3.interpolateLab(a, b)],
  ["interpolateHcl", d3.interpolateHcl(a, b)],
  ["interpolateHclLong", d3.interpolateHclLong(a, b)],
  ["interpolateCubehelix", d3.interpolateCubehelix(a, b)],
  ["interpolateCubehelixLong", d3.interpolateCubehelixLong(a, b)],
  ["interpolateRgbBasis([a, 'white', b])", d3.interpolateRgbBasis([a, "white", b])],
  ["piecewise(interpolateLab, [a, '#e63946', b])", d3.piecewise(d3.interpolateLab, [a, "#e63946", b])],
];
const W = 640, rowH = 30, labelW = 250, n = 64;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${interps.length * rowH}\`)
  .style("font", "11px monospace");
const rows = svg.selectAll("g").data(interps).join("g").attr("transform", (d, i) => \`translate(0,\${i * rowH})\`);
rows.append("text").attr("y", rowH / 2 + 4).text(d => d[0]);
rows.selectAll("rect").data(([, f]) => d3.range(n).map(i => f(i / (n - 1)))).join("rect")
  .attr("x", (c, i) => labelW + i * (W - labelW) / n)
  .attr("y", 3).attr("height", rowH - 6)
  .attr("width", (W - labelW) / n + 0.5)
  .attr("fill", c => c);
`}
      />
      <Callout type="note" title="Short vs long hue paths">
        <p>
          Hue is an angle, so there are two ways around the color wheel. <code>interpolateHsl</code>,{" "}
          <code>interpolateHcl</code> and <code>interpolateCubehelix</code> take the shorter path. The{" "}
          <code>…Long</code> versions go the long way around, which gives rainbow-like ramps.
        </p>
      </Callout>

      <h2>Interpolating anything</h2>
      <p>
        d3-interpolate is not limited to colors. The generic <code>d3.interpolate(a, b)</code> looks at the type of{" "}
        <code>b</code> and picks the right interpolator. Numbers, colors, dates, arrays, objects, and even strings
        with numbers inside them all work. This is the engine behind transitions and scales.
      </p>
      <Playground
        title="d3.interpolate picks a strategy"
        hideOutput
        code={`
const show = (name, f) => log(name.padEnd(28), [0, 0.25, 0.5, 1].map(t => JSON.stringify(f(t))).join("  "));

show("number", d3.interpolate(0, 100));
show("round", d3.interpolateRound(0, 7));
show("color string", d3.interpolate("red", "blue"));
show("string w/ numbers", d3.interpolate("translate(0,0) scale(1)", "translate(100,50) scale(3)"));
show("array", d3.interpolate([0, 10], [100, 20]));
show("object", d3.interpolate({ x: 0, fill: "white" }, { x: 10, fill: "black" }));
show("date", d3.interpolate(new Date(2020, 0, 1), new Date(2021, 0, 1)));
show("discrete", d3.interpolateDiscrete(["a", "b", "c"]));
show("angle (degrees)", d3.interpolateTransformSvg("rotate(350)", "rotate(10)"));

// basis: a smooth B-spline through many values
const smooth = d3.interpolateBasis([0, 100, 20, 80]);
log("basis samples:", d3.range(0, 1.01, 0.2).map(t => smooth(t).toFixed(1)).join(", "));

// quantize: turn an interpolator into n discrete samples
log("quantize:", d3.quantize(d3.interpolateHcl("white", "darkgreen"), 5));
`}
      />
      <ApiTable
        rows={[
          ["d3.interpolate(a, b)", "Picks an interpolator based on the type of b: number, color, date, string, array or object."],
          ["d3.interpolateNumber(a, b) / interpolateRound", "Linear blend between numbers. The round version returns integers."],
          ["d3.interpolateString(a, b)", "Finds the numbers inside strings and blends them, e.g. \"10px\" to \"30px\"."],
          ["d3.interpolateArray / interpolateObject", "Blends each element or property. Keys that exist only in a are dropped."],
          ["d3.interpolateNumberArray(a, b)", "Fast blend for typed arrays such as Float64Array."],
          ["d3.interpolateDate(a, b)", "Blends two dates. Returns a Date, and reuses the same object on each call."],
          ["d3.interpolateDiscrete(values)", "Step function: picks values[floor(t · n)]."],
          ["d3.interpolateRgb / Hsl / Lab / Hcl / Cubehelix (…Long)", "Color blends in a chosen space. …Long versions take the long way around hue."],
          ["d3.interpolateRgb.gamma(g) / interpolateCubehelix.gamma(g)", "Blends in gamma-corrected space, which avoids the dark middle of a plain RGB blend."],
          ["d3.interpolateRgbBasis(colors) / interpolateRgbBasisClosed", "Smooth B-spline through several colors. The closed version loops."],
          ["d3.interpolateBasis(values) / interpolateBasisClosed", "Smooth B-spline through several numbers."],
          ["d3.interpolateHue(a, b)", "Blends angles in degrees along the shortest path."],
          ["d3.interpolateTransformCss / interpolateTransformSvg", "Decomposes transforms into translate, rotate, skew and scale and blends each part."],
          ["d3.interpolateZoom(a, b)", "Smooth pan-and-zoom path between two [x, y, width] views (van Wijk & Nuij)."],
          ["d3.piecewise(interpolate, values)", "Chains an interpolator through many stops."],
          ["d3.quantize(interpolator, n)", "Returns n evenly spaced samples from an interpolator."],
        ]}
      />

      <h3>interpolateZoom: the smooth fly-to</h3>
      <p>
        <code>d3.interpolateZoom</code> is interesting. It interpolates between two views given as{" "}
        <code>[centerX, centerY, width]</code>. Instead of a straight line, it zooms <em>out</em> first, pans, then
        zooms back in, which feels natural to the eye. It exposes a <code>duration</code> property with a
        recommended length in milliseconds. d3-zoom uses it for animated transitions.
      </p>
      <Playground
        title="interpolateZoom fly-to"
        code={`
const W = 640, H = 300;
const rng = d3.randomLcg(3);
const pts = d3.range(400).map(() => [rng() * 2000, rng() * 1000]);
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("background", "#0b1020");
const g = svg.append("g");
g.selectAll("circle").data(pts).join("circle")
  .attr("cx", d => d[0]).attr("cy", d => d[1]).attr("r", 3)
  .attr("fill", d => d3.interpolateTurbo(d[0] / 2000));

const views = [[1000, 500, 2000], [200, 150, 150], [1800, 850, 120], [900, 300, 400]];
let current = views[0], idx = 0;
const apply = ([cx, cy, w]) => {
  const k = W / w;
  g.attr("transform", \`translate(\${W / 2 - cx * k},\${H / 2 - cy * k}) scale(\${k})\`);
};
apply(current);

d3.select(el).append("button").text("Fly to next view").style("margin-top", "8px").on("click", () => {
  const target = views[++idx % views.length];
  const interp = d3.interpolateZoom(current, target);
  log("recommended duration:", Math.round(interp.duration), "ms");
  svg.transition().duration(interp.duration)
    .tween("zoom", () => t => apply(current = interp(t)));
});
`}
      />

      <h2>Built-in color schemes</h2>
      <p>
        <strong>d3-scale-chromatic</strong> provides two kinds of objects:
      </p>
      <ul>
        <li>
          <strong>Interpolators</strong> such as <code>d3.interpolateViridis</code>. These are functions of{" "}
          <code>t</code> in [0, 1] and plug straight into <code>d3.scaleSequential</code> or{" "}
          <code>d3.scaleDiverging</code>.
        </li>
        <li>
          <strong>Schemes</strong> such as <code>d3.schemeTableau10</code>. These are arrays of hex strings and plug
          into <code>d3.scaleOrdinal</code>. Sequential and diverging schemes are arrays indexed by size, e.g.{" "}
          <code>d3.schemeBlues[5]</code> gives 5 blues, for sizes 3 to 9 (up to 11 for diverging schemes).
        </li>
      </ul>
      <p>Pick the family that matches the shape of your data:</p>
      <ul>
        <li>
          <strong>Sequential</strong>: ordered values from low to high (population, temperature in one direction).
        </li>
        <li>
          <strong>Diverging</strong>: values around a meaningful middle (profit/loss, change from average).
        </li>
        <li>
          <strong>Cyclical</strong>: values that wrap around (hour of day, compass direction).
        </li>
        <li>
          <strong>Categorical</strong>: unordered groups. Only a handful can be told apart, about 10 at most.
        </li>
      </ul>
      <Playground
        title="Scale-chromatic gallery"
        code={`
const groups = {
  "Sequential (single hue)": ["Blues", "Greens", "Greys", "Oranges", "Purples", "Reds"],
  "Sequential (multi-hue)": ["Viridis", "Inferno", "Magma", "Plasma", "Cividis", "Turbo", "Warm", "Cool",
    "CubehelixDefault", "BuGn", "BuPu", "GnBu", "OrRd", "PuBuGn", "PuBu", "PuRd", "RdPu", "YlGnBu", "YlGn", "YlOrBr", "YlOrRd"],
  "Diverging": ["BrBG", "PRGn", "PiYG", "PuOr", "RdBu", "RdGy", "RdYlBu", "RdYlGn", "Spectral"],
  "Cyclical": ["Rainbow", "Sinebow"],
};
const root = d3.select(el).style("font", "12px sans-serif");

for (const [title, names] of Object.entries(groups)) {
  root.append("div").text(title).style("font-weight", "700").style("margin", "12px 0 6px");
  const grid = root.append("div").style("display", "grid")
    .style("grid-template-columns", "repeat(auto-fill, minmax(190px, 1fr))").style("gap", "6px 14px");
  const item = grid.selectAll("div").data(names).join("div");
  item.append("div").style("font-family", "monospace").style("font-size", "11px").style("color", "#444")
    .text(n => "interpolate" + n);
  item.append("canvas").attr("width", 256).attr("height", 1)
    .style("width", "100%").style("height", "18px").style("border-radius", "3px").style("display", "block")
    .each(function (n) {
      const ctx = this.getContext("2d"), f = d3["interpolate" + n];
      for (let i = 0; i < 256; i++) { ctx.fillStyle = f(i / 255); ctx.fillRect(i, 0, 1, 1); }
    });
}

const cats = ["Category10", "Tableau10", "Observable10", "Accent", "Dark2", "Paired", "Pastel1", "Pastel2", "Set1", "Set2", "Set3"]
  .filter(n => d3["scheme" + n]);
root.append("div").text("Categorical").style("font-weight", "700").style("margin", "16px 0 6px");
const rows = root.selectAll("div.cat").data(cats).join("div").attr("class", "cat")
  .style("display", "flex").style("align-items", "center").style("gap", "2px").style("margin", "3px 0");
rows.append("span").style("font-family", "monospace").style("font-size", "11px").style("width", "150px")
  .text(n => "scheme" + n);
rows.selectAll("span.sw").data(n => d3["scheme" + n]).join("span").attr("class", "sw")
  .attr("title", c => c)
  .style("width", "22px").style("height", "18px").style("border-radius", "3px").style("background", c => c);
`}
      />
      <CodeBlock>{`
// Interpolators go with sequential / diverging scales
const color = d3.scaleSequential([0, 100], d3.interpolateViridis);
const delta = d3.scaleDiverging([-10, 0, 10], d3.interpolateRdBu);

// Schemes go with ordinal / quantize scales
const cat   = d3.scaleOrdinal(d3.schemeTableau10);
const steps = d3.scaleQuantize([0, 100], d3.schemeBlues[7]);
`}</CodeBlock>

      <h2>Putting it together: a heatmap</h2>
      <p>
        A realistic chart ties it all together. This heatmap shows fake hourly activity per weekday. Switch the
        interpolator and see how the rainbow-style <code>Turbo</code> makes false edges appear, while perceptual
        maps like <code>Viridis</code> and <code>Cividis</code> read smoothly. The diverging option centers the scale
        on the mean.
      </p>
      <Playground
        title="Heatmap with switchable color scales"
        code={`
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const rng = d3.randomLcg(11), noise = d3.randomNormal.source(rng)(0, 6);
const data = days.flatMap((day, di) => d3.range(24).map(h => ({
  day, h,
  v: Math.max(0, 40 + 35 * Math.sin((h - 7) / 24 * 2 * Math.PI) * (di < 5 ? 1 : 0.6) + noise()),
})));

const W = 640, H = 260, m = { t: 10, r: 10, b: 50, l: 40 };
const x = d3.scaleBand(d3.range(24), [m.l, W - m.r]).padding(0.06);
const y = d3.scaleBand(days, [m.t, H - m.b]).padding(0.06);
const extent = d3.extent(data, d => d.v), mean = d3.mean(data, d => d.v);

const options = {
  Viridis: () => d3.scaleSequential(extent, d3.interpolateViridis),
  Cividis: () => d3.scaleSequential(extent, d3.interpolateCividis),
  YlOrRd: () => d3.scaleSequential(extent, d3.interpolateYlOrRd),
  Turbo: () => d3.scaleSequential(extent, d3.interpolateTurbo),
  "RdBu (diverging)": () => d3.scaleDiverging([extent[0], mean, extent[1]], t => d3.interpolateRdBu(1 - t)),
  "Blues[5] (quantized)": () => d3.scaleQuantize(extent, d3.schemeBlues[5]),
};

const select = d3.select(el).append("select").style("margin-bottom", "6px");
select.selectAll("option").data(Object.keys(options)).join("option").text(d => d);
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("font", "10px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.b})\`).call(d3.axisBottom(x).tickValues(d3.range(0, 24, 3)).tickFormat(h => h + ":00"));
svg.append("g").attr("transform", \`translate(\${m.l},0)\`).call(d3.axisLeft(y).tickSize(0)).call(g => g.select(".domain").remove());
const cells = svg.append("g").selectAll("rect").data(data).join("rect")
  .attr("x", d => x(d.h)).attr("y", d => y(d.day))
  .attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("rx", 2);
const legend = svg.append("g").attr("transform", \`translate(\${m.l},\${H - 18})\`);

function render(name) {
  const color = options[name]();
  cells.transition().duration(500).attr("fill", d => color(d.v));
  const lw = 240;
  legend.selectAll("rect").data(d3.range(60)).join("rect")
    .attr("x", i => i * lw / 60).attr("width", lw / 60 + 0.5).attr("height", 8)
    .attr("fill", i => color(extent[0] + (extent[1] - extent[0]) * i / 59));
  legend.selectAll("text").data(extent).join("text")
    .attr("x", (d, i) => i * lw).attr("y", -2).attr("text-anchor", (d, i) => i ? "end" : "start")
    .text(d => d.toFixed(0));
}
select.on("change", event => render(event.target.value));
render("Viridis");
`}
      />
      <Callout type="warning" title="Avoid the rainbow for ordered data">
        <p>
          Rainbow maps like <code>interpolateRainbow</code>, <code>interpolateTurbo</code> and HSL hue sweeps are
          not uniform in lightness. They create visible bands where the data has none, and they don&apos;t survive
          grayscale printing or color-vision deficiency. Use Viridis, Cividis or a single-hue ramp for sequential
          data. Keep rainbows for cyclical data, where wrapping around is the point.
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            Build a 5×5 grid of swatches: <code>d3.color(&quot;tomato&quot;)</code> with <code>brighter(k)</code>{" "}
            across and <code>copy({"{"}opacity{"}"})</code> down.
          </>,
          <>
            Plot the Lab lightness (<code>d3.lab(c).l</code>) of <code>interpolateRainbow(t)</code> and{" "}
            <code>interpolateViridis(t)</code> as two line charts. Which one rises steadily?
          </>,
          <>
            Write your own diverging interpolator with <code>d3.piecewise(d3.interpolateLab, [...])</code> through
            three colors and use it in the heatmap.
          </>,
          <>
            Use <code>d3.interpolateString</code> to animate an SVG <code>path</code>&apos;s <code>d</code>{" "}
            attribute between two shapes that have the same number of commands.
          </>,
        ]}
      />
    </>
  );
}
