import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Real charts start from real files. <strong>d3-fetch</strong> is a thin, promise-based layer over the
        browser&apos;s <code>fetch()</code> that loads a URL and parses the response in one step, and{" "}
        <strong>d3-dsv</strong> is the parser (and serializer) for delimiter-separated values like CSV and TSV. You
        can use d3-dsv on its own whenever you already have text in hand — from a textarea, a file input, or an API.
      </p>

      <h2>Loading a CSV file</h2>
      <p>
        <code>d3.csv(url)</code> returns a <strong>Promise</strong> that resolves to an array of objects, one per
        row, keyed by the header line. The array also has a <code>columns</code> property listing the headers in
        order. Since our playgrounds run inside an async function, we can simply <code>await</code> it. The file used
        here lives at <code>/data/fetching-cities.csv</code> in the project&apos;s <code>public</code> folder.
      </p>
      <Playground
        title="d3.csv"
        hideOutput
        code={`
const data = await d3.csv("/data/fetching-cities.csv");

log("rows:", data.length);
log("columns:", data.columns);
log("first row:", data[0]);

// Everything is a string! This is the #1 source of bugs:
log("typeof population:", typeof data[0].population);
log("string max (wrong):", d3.max(data, d => d.population));
log("numeric max (right):", d3.max(data, d => +d.population));
`}
      />
      <Callout type="warning">
        <p>
          CSV has no types, so d3-dsv gives you strings for every value. Comparisons and <code>+</code> then behave
          like string operations: <code>&quot;9748000&quot; &gt; &quot;37115000&quot;</code> is true, and{" "}
          <code>&quot;2&quot; + &quot;3&quot;</code> is <code>&quot;23&quot;</code>. Always convert values right
          when you load them — with a row function or <code>d3.autoType</code>.
        </p>
      </Callout>

      <h2>Row conversion and d3.autoType</h2>
      <p>
        Every d3-fetch DSV method accepts a <strong>row function</strong> as its second argument. It is called for
        each row as <code>row(d, i, columns)</code> and whatever it returns becomes the element in the result array.
        Return <code>null</code> or <code>undefined</code> to <em>skip</em> the row. This is the place to rename
        fields, coerce types, parse dates and drop bad rows — all in one pass.
      </p>
      <p>
        If your file is well-formed, <code>d3.autoType</code> is a ready-made row function that infers types:
        numbers become numbers, <code>&quot;true&quot;</code>/<code>&quot;false&quot;</code> become booleans, empty
        cells become <code>null</code>, <code>&quot;NaN&quot;</code> becomes <code>NaN</code>, and ISO 8601 strings
        become <code>Date</code> objects.
      </p>
      <Playground
        title="Row function vs. autoType"
        hideOutput
        code={`
// 1) An explicit row function: rename, coerce, derive, filter
const cities = await d3.csv("/data/fetching-cities.csv", (d, i) => {
  if (d.continent === "Africa") return null;     // skip rows
  return {
    name: d.city,
    country: d.country,
    population: +d.population,
    density: Math.round(+d.population / +d.area_km2),
    founded: d.founded ? +d.founded : undefined,
  };
});
log("row fn → rows (Africa skipped):", cities.length);
log(cities[0]);

// 2) autoType: infer types automatically
const auto = await d3.csv("/data/fetching-cities.csv", d3.autoType);
log("autoType:", auto[0]);
log("empty cell →", auto.find(d => d.city === "Paris").founded);

// autoType also parses ISO dates (date-only strings as UTC midnight)
const temps = await d3.csv("/data/fetching-temps.csv", d3.autoType);
log("date:", temps[0].date instanceof Date, temps[0].date.toISOString());
`}
      />
      <Callout type="tip">
        <p>
          <code>d3.autoType</code> is convenient but blunt: a ZIP code like <code>&quot;01310&quot;</code> becomes
          the number 1310 and an ID column of digits becomes numbers. When a column must stay a string, write a row
          function — or wrap autoType: <code>d =&gt; ({"{"} ...d3.autoType(d), zip: d.zip {"}"})</code>.
        </p>
      </Callout>

      <h2>The fetch family</h2>
      <p>
        Each method is <code>fetch</code> plus a parser. All accept an optional <code>init</code> object (passed to{" "}
        <code>fetch</code> — headers, credentials, method) and all reject on HTTP errors (a 404 is an error, unlike
        raw <code>fetch</code>).
      </p>
      <ApiTable
        rows={[
          ["d3.csv(url, [init], [row])", "Load and parse comma-separated values."],
          ["d3.tsv(url, [init], [row])", "Load and parse tab-separated values."],
          ["d3.dsv(delimiter, url, [init], [row])", "Any single-character delimiter, e.g. \";\" or \"|\"."],
          ["d3.json(url, [init])", "Load and JSON.parse. Resolves undefined for 204/205 responses."],
          ["d3.text(url, [init])", "Load as a plain string."],
          ["d3.blob / d3.buffer(url, [init])", "Load as a Blob / ArrayBuffer (binary data)."],
          ["d3.image(url, [attrs])", "Load an <img>; resolves once it has loaded. attrs e.g. { crossOrigin: \"anonymous\" }."],
          ["d3.xml / d3.html / d3.svg(url)", "Load and parse into a Document (XML, HTML or SVG)."],
        ]}
      />
      <Playground
        title="text, tsv, json, xml and image"
        code={`
const raw = await d3.text("/data/fetching-sales.tsv");
log("d3.text gives a string:", JSON.stringify(raw.slice(0, 40)) + "…");

const sales = await d3.tsv("/data/fetching-sales.tsv", d3.autoType);
log("d3.tsv:", sales);

const meta = await d3.json("/data/fetching-cities-meta.json");
log("d3.json → source:", meta.source, "| cities:", meta.cities.map(c => c.name));

// d3.svg / d3.xml return a Document; import its root element into the page
const row = d3.select(el).append("div").style("display", "flex").style("gap", "24px")
    .style("align-items", "center").style("font", "12px sans-serif");
const doc = await d3.svg("/globe.svg");
const svgNode = document.importNode(doc.documentElement, true);
d3.select(svgNode).attr("width", 64).attr("height", 64);
row.append("div").call(f => f.node().append(svgNode))
  .append("div").text("d3.svg('/globe.svg')");

const img = await d3.image("/next.svg");
row.append("div").call(f => f.node().append(img))
  .append("div").text("d3.image → " + img.naturalWidth + "×" + img.naturalHeight);
d3.select(img).style("height", "40px").style("display", "block");
`}
      />

      <h2>Parsing and formatting strings with d3-dsv</h2>
      <p>
        When the text is already in memory, skip the network and use the parsers directly.{" "}
        <code>csvParse</code> treats the first line as the header and returns objects (again with{" "}
        <code>.columns</code>). <code>csvParseRows</code> has no header concept and returns arrays of strings.{" "}
        <code>csvFormat</code> goes the other way — objects back to CSV text, quoting values that contain commas,
        quotes or newlines. <code>d3.dsvFormat(delimiter)</code> builds a parser/formatter for any delimiter.
      </p>
      <Playground
        title="csvParse, csvParseRows, csvFormat, dsvFormat"
        hideOutput
        code={`
const text = \`name,score,passed
"Silva, Ana",91.5,true
Bruno,68,false
"Chen ""CJ"" Li",77,true\`;

const rows = d3.csvParse(text, d3.autoType);
log("csvParse + autoType:", rows);
log("columns:", rows.columns);

log("csvParseRows:", d3.csvParseRows(text).slice(0, 2));

// Formatting: objects → CSV (values with commas/quotes get quoted)
const out = d3.csvFormat(rows, ["name", "score"]);   // optional column subset/order
log("csvFormat:");
log(out);
log("csvFormatRows:");
log(d3.csvFormatRows([["x", "y"], [1, 2], [3, "a,b"]]));

// Other delimiters
const psv = d3.dsvFormat("|");
log("dsvFormat('|').parse:", psv.parse("a|b\\n1|2\\n3|4", d3.autoType));
log("tsvParse:", d3.tsvParse("k\\tv\\nx\\t1"));
`}
      />
      <Callout type="note">
        <p>
          <code>csvFormat</code> converts <code>Date</code> values to ISO strings and <code>null</code>/
          <code>undefined</code> to empty cells, so a parse-with-autoType / format round trip is lossless for most
          data. Pair it with a Blob and an <code>&lt;a download&gt;</code> link to let users export what they see.
        </p>
      </Callout>

      <h2>Multiple files, Promise.all and error handling</h2>
      <p>
        Loading several files in sequence with one <code>await</code> after another is slow — each request waits for
        the previous one. Start them together and wait for all with <code>Promise.all</code>. If <em>any</em>{" "}
        request fails, the whole <code>Promise.all</code> rejects, so wrap it in <code>try/catch</code> (or use{" "}
        <code>Promise.allSettled</code> when partial data is acceptable).
      </p>
      <Playground
        title="Parallel loading and failures"
        hideOutput
        code={`
const t0 = performance.now();
const [cities, temps, meta] = await Promise.all([
  d3.csv("/data/fetching-cities.csv", d3.autoType),
  d3.csv("/data/fetching-temps.csv", d3.autoType),
  d3.json("/data/fetching-cities-meta.json"),
]);
log("loaded", cities.length, "cities,", temps.length, "temps,", meta.cities.length, "meta entries in",
    Math.round(performance.now() - t0), "ms");

// Failures reject the promise. Try changing the URL to "/data/does-not-exist.csv"
// to see a 404 ("404 Not Found"). Here we ask d3.json to parse a CSV file instead:
try {
  await d3.json("/data/fetching-cities.csv");
} catch (error) {
  log("caught:", error.name, "-", error.message);
}

// allSettled: keep what succeeded
const results = await Promise.allSettled([
  d3.json("/data/fetching-cities-meta.json"),
  d3.json("/data/fetching-sales.tsv"),   // not JSON → rejected
]);
log(results.map(r => r.status));

// Promise-style chaining works too, without await:
d3.csv("/data/fetching-cities.csv")
  .then(rows => log(".then():", rows.length, "rows"))
  .catch(err => log("error:", err.message));
`}
      />
      <Callout type="warning">
        <p>
          Two common failure modes are not HTTP errors. <strong>Wrong type:</strong> a server that returns an HTML
          error page with status 200 will make <code>d3.json</code> throw a <code>SyntaxError</code>.{" "}
          <strong>CORS:</strong> loading from another origin requires that server to send{" "}
          <code>Access-Control-Allow-Origin</code>; otherwise the promise rejects with a generic{" "}
          <code>TypeError: Failed to fetch</code>. During development, put data files in <code>public/</code> so they
          are served from the same origin.
        </p>
      </Callout>

      <h2>From file to chart</h2>
      <p>
        Now the full pipeline: load a CSV with a row function, sort, and draw a horizontal bar chart of the largest
        metropolitan areas, colored by continent.
      </p>
      <Playground
        title="Bar chart from a CSV"
        code={`
const data = await d3.csv("/data/fetching-cities.csv", d => ({
  city: d.city,
  continent: d.continent,
  population: +d.population,
}));
data.sort((a, b) => d3.descending(a.population, b.population));
const top = data.slice(0, 15);

const W = 640, barH = 22, m = { top: 30, right: 60, bottom: 10, left: 110 };
const H = m.top + top.length * barH + m.bottom;
const x = d3.scaleLinear().domain([0, d3.max(top, d => d.population)]).range([m.left, W - m.right]);
const y = d3.scaleBand(top.map(d => d.city), [m.top, H - m.bottom]).padding(0.15);
const color = d3.scaleOrdinal(d3.sort(new Set(data.map(d => d.continent))), d3.schemeSet2);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${m.top})\`)
    .call(d3.axisTop(x).ticks(6, "~s"))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone().attr("y2", H - m.top - m.bottom).attr("stroke-opacity", 0.1));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).tickSize(0)).call(g => g.select(".domain").remove());

svg.append("g").selectAll("rect").data(top).join("rect")
    .attr("x", x(0)).attr("y", d => y(d.city))
    .attr("width", d => x(d.population) - x(0)).attr("height", y.bandwidth())
    .attr("fill", d => color(d.continent));
svg.append("g").selectAll("text").data(top).join("text")
    .attr("x", d => x(d.population) + 4).attr("y", d => y(d.city) + y.bandwidth() / 2)
    .attr("dy", "0.35em").attr("fill", "#495057")
    .text(d => d3.format(".3s")(d.population));

const legend = svg.append("g").attr("transform", \`translate(\${W - m.right - 110},\${H - 110})\`)
  .selectAll("g").data(color.domain()).join("g").attr("transform", (d, i) => \`translate(0,\${i * 17})\`);
legend.append("rect").attr("width", 11).attr("height", 11).attr("fill", color);
legend.append("text").attr("x", 16).attr("y", 9).text(d => d);
`}
      />
      <p>
        And a chart that <strong>joins</strong> two files: temperatures from a CSV (tidy: one row per city and
        month, with ISO dates parsed by <code>autoType</code>) and display names and colors from a JSON metadata file,
        looked up with <code>d3.index</code>.
      </p>
      <Playground
        title="Joining CSV and JSON into a line chart"
        code={`
const [temps, meta] = await Promise.all([
  d3.csv("/data/fetching-temps.csv", d3.autoType),
  d3.json("/data/fetching-cities-meta.json"),
]);
const cityById = d3.index(meta.cities, c => c.id);
const series = d3.group(temps, d => d.city_id);

const W = 640, H = 320, m = { top: 20, right: 90, bottom: 30, left: 40 };
// autoType parses "2024-01-01" as UTC midnight → use a UTC scale and format
const x = d3.scaleUtc().domain(d3.extent(temps, d => d.date)).range([m.left, W - m.right]);
const y = d3.scaleLinear().domain(d3.extent(temps, d => d.temp_c)).nice().range([H - m.bottom, m.top]);
const line = d3.line(d => x(d.date), d => y(d.temp_c)).curve(d3.curveMonotoneX);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
    .style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(0,\${H - m.bottom})\`)
    .call(d3.axisBottom(x).ticks(d3.utcMonth.every(1)).tickFormat(d3.utcFormat("%b")));
svg.append("g").attr("transform", \`translate(\${m.left},0)\`)
    .call(d3.axisLeft(y).tickFormat(d => d + meta.units.temp_c))
    .call(g => g.selectAll(".tick line").clone().attr("x2", W - m.left - m.right).attr("stroke-opacity", 0.08));

svg.append("g").attr("fill", "none").attr("stroke-width", 2)
  .selectAll("path").data(series).join("path")
    .attr("stroke", ([id]) => cityById.get(id).color)
    .attr("stroke-dasharray", ([id]) => cityById.get(id).hemisphere === "south" ? "5 3" : null)
    .attr("d", ([, rows]) => line(rows));

const labels = Array.from(series, ([id, rows]) => ({ ...cityById.get(id), y: y(rows.at(-1).temp_c) }))
  .sort((a, b) => a.y - b.y);
for (let i = 1; i < labels.length; i++) labels[i].y = Math.max(labels[i].y, labels[i - 1].y + 13);
svg.append("g").selectAll("text").data(labels).join("text")
    .attr("x", W - m.right + 6)
    .attr("y", d => d.y)
    .attr("dy", "0.35em")
    .attr("fill", d => d.color)
    .text(d => d.name);

log(meta.source + " — dashed lines: southern hemisphere");
`}
      />

      <h2>Where to put the loading code</h2>
      <p>
        In a framework app (like this Next.js site), you can also fetch on the server and pass parsed data to the
        client, or import small data files directly. d3-dsv works fine in Node — only d3-fetch&apos;s{" "}
        <code>image</code>/<code>xml</code>/<code>html</code>/<code>svg</code> need a browser (they rely on{" "}
        <code>Image</code> and <code>DOMParser</code>).
      </p>
      <CodeBlock>{`
// Server-side (Node / route handler / build step)
import { csvParse, autoType } from "d3-dsv";
import { readFile } from "node:fs/promises";

const rows = csvParse(await readFile("data/cities.csv", "utf8"), autoType);
`}</CodeBlock>

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.csvParse(text, [row])", "CSV text with header → array of objects (+ .columns)."],
          ["d3.csvParseRows(text, [row])", "CSV text → array of arrays (no header handling)."],
          ["d3.csvFormat(rows, [columns])", "Array of objects → CSV text with header."],
          ["d3.csvFormatBody / csvFormatRows / csvFormatRow / csvFormatValue", "Serialize without header / arrays / one row / one value."],
          ["d3.tsvParse / tsvFormat …", "Same API for tab-separated values."],
          ["d3.dsvFormat(delimiter)", "Build a { parse, parseRows, format, … } object for any delimiter."],
          ["d3.autoType(row)", "Row function inferring numbers, booleans, null, NaN and ISO dates."],
          ["row(d, i, columns)", "Your conversion function; return null/undefined to skip a row."],
        ]}
      />

      <Exercises
        items={[
          <>
            Using a row function, load <code>fetching-cities.csv</code> keeping only cities founded before 1500, and
            log them sorted by founding year. What happens to Paris (empty cell)?
          </>,
          <>
            Add a precipitation panel below the temperature chart using <code>precip_mm</code> from the same CSV
            (bars per month for one selected city).
          </>,
          <>
            Build an &quot;Export CSV&quot; button: serialize the top-15 cities with <code>d3.csvFormat</code>, wrap
            it in a <code>Blob</code>, and trigger a download via <code>URL.createObjectURL</code>.
          </>,
          <>
            Add a <code>&lt;textarea&gt;</code> where users can paste CSV, and redraw the bar chart from{" "}
            <code>d3.csvParse(textarea.value, d3.autoType)</code> on every input.
          </>,
        ]}
      />
    </>
  );
}
