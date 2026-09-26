import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Drawing a map means answering two questions: <em>what</em> shapes to draw (geographic data, as longitude
        and latitude) and <em>how</em> to flatten the round Earth onto a flat screen (a <strong>projection</strong>
        ). <code>d3-geo</code> handles the second part and the geometry around it: projections, a path generator
        that turns geographic features into SVG or canvas drawings, and spherical math like areas, distances and
        great-circle interpolation.
      </p>

      <h2>GeoJSON and TopoJSON</h2>
      <p>
        D3 speaks <strong>GeoJSON</strong>: plain JSON objects with a <code>type</code> and coordinates in{" "}
        <code>[longitude, latitude]</code> order (x before y!). The geometry types are <code>Point</code>,{" "}
        <code>MultiPoint</code>, <code>LineString</code>, <code>MultiLineString</code>, <code>Polygon</code>,{" "}
        <code>MultiPolygon</code> and <code>GeometryCollection</code>. A <code>Feature</code> wraps a geometry
        with arbitrary <code>properties</code>, and a <code>FeatureCollection</code> holds an array of features. D3
        adds one special type of its own: <code>{"{"}type: &quot;Sphere&quot;{"}"}</code>, the whole globe.
      </p>
      <CodeBlock>{`
{ "type": "Feature",
  "properties": { "name": "Bermuda Triangle" },
  "geometry": { "type": "Polygon",
                "coordinates": [[[-80.2, 25.8], [-64.8, 32.3], [-66.1, 18.5], [-80.2, 25.8]]] } }
`}</CodeBlock>
      <p>
        <strong>TopoJSON</strong> is a compact encoding of GeoJSON. Instead of storing each country&apos;s border
        separately (so every shared border is stored twice), it stores shared line segments (&quot;arcs&quot;) once
        and quantizes coordinates to integers. Files are often 80% smaller, and because topology is preserved you
        can compute things like &quot;only the internal borders&quot;. D3 doesn&apos;t read TopoJSON directly; you
        convert with <code>topojson-client</code>:
      </p>
      <ul>
        <li>
          <code>topojson.feature(topology, object)</code> → GeoJSON Feature or FeatureCollection
        </li>
        <li>
          <code>topojson.mesh(topology, object, filter)</code> → a single MultiLineString of borders; the filter{" "}
          <code>(a, b) =&gt; a !== b</code> keeps only borders shared by two different features.
        </li>
      </ul>

      <h2>geoPath: from features to pixels</h2>
      <p>
        <code>d3.geoPath(projection)</code> returns a function: give it any GeoJSON object and it returns an SVG
        path string. It also <em>measures</em> in screen space: <code>path.area</code>, <code>path.centroid</code>,{" "}
        <code>path.bounds</code> and <code>path.measure</code>. Their spherical counterparts —{" "}
        <code>d3.geoArea</code>, <code>d3.geoCentroid</code>, <code>d3.geoBounds</code>, <code>d3.geoLength</code>{" "}
        — work in steradians and radians on the unit sphere, independent of any projection.
      </p>
      <Playground
        title="A hand-made GeoJSON, projected and measured"
        code={`
const W = 640, H = 330;
const triangle = { type: "Feature", properties: { name: "Bermuda Triangle" },
  geometry: { type: "Polygon", coordinates: [[[-80.2, 25.8], [-64.8, 32.3], [-66.1, 18.5], [-80.2, 25.8]]] } };
const route = { type: "LineString", coordinates: [[-74, 40.7], [-0.13, 51.5]] };  // New York → London
const point = { type: "Point", coordinates: [2.35, 48.86] };                      // Paris

const projection = d3.geoEqualEarth().rotate([40, 0]).fitExtent([[10, 10], [W - 10, H - 10]], { type: "Sphere" });
const path = d3.geoPath(projection);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("path").attr("d", path({ type: "Sphere" })).attr("fill", "#eef6fb").attr("stroke", "#333");
svg.append("path").attr("d", path(d3.geoGraticule10())).attr("fill", "none").attr("stroke", "#c8d6e0");
svg.append("path").attr("d", path(triangle)).attr("fill", "tomato").attr("fill-opacity", 0.6).attr("stroke", "tomato");
svg.append("path").attr("d", path(route)).attr("fill", "none").attr("stroke", "#1971c2").attr("stroke-width", 2);
svg.append("path").attr("d", path.pointRadius(5)(point)).attr("fill", "#2f9e44");

const R = 6371; // Earth radius in km
log("path (first 60 chars):", path(triangle).slice(0, 60) + "…");
log("screen area (px²):", path.area(triangle).toFixed(1), "  bounds:", JSON.stringify(path.bounds(triangle).map(p => p.map(Math.round))));
log("screen centroid:", path.centroid(triangle).map(Math.round).join(", "), "  geo centroid:", d3.geoCentroid(triangle).map(v => v.toFixed(2)).join(", "));
log("true area (km²):", Math.round(d3.geoArea(triangle) * R * R).toLocaleString());
log("NY→London great-circle length (km):", Math.round(d3.geoLength(route) * R));
`}
      />
      <Callout type="warning" title="Winding order matters">
        <p>
          d3-geo works on the <strong>sphere</strong>, where any ring divides the globe in two, so the direction of
          the ring decides which side is &quot;inside&quot;. D3 expects exterior rings to be{" "}
          <strong>clockwise</strong> — the opposite of the RFC 7946 &quot;right-hand rule&quot; many tools output.
          If a polygon suddenly fills the entire map except itself, reverse its rings (
          <code>ring.reverse()</code>) or rewind the file with a tool like <code>@turf/rewind</code>. Also note that
          a straight line between two points in GeoJSON means the <em>great-circle</em> arc, which is why the NY →
          London route above bends.
        </p>
      </Callout>

      <h2>A world map from TopoJSON</h2>
      <p>
        The <code>world-atlas</code> package provides Natural Earth country boundaries as TopoJSON. A typical map has
        four layers: the <strong>sphere</strong> (ocean background and outline), a <strong>graticule</strong>{" "}
        (<code>d3.geoGraticule10()</code> gives lines every 10°), the land or country fills, and a{" "}
        <strong>mesh</strong> of internal borders stroked on top (stroking each country separately would draw every
        border twice). <code>projection.fitSize([w, h], object)</code> sets the projection&apos;s scale and
        translate so the object fills the box; <code>fitExtent([[x0, y0], [x1, y1]], object)</code> adds margins.
      </p>
      <Playground
        title="World map: sphere, graticule, countries, borders"
        code={`
const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
log("topology objects:", Object.keys(world.objects).join(", "), "  shared arcs:", world.arcs.length);

const countries = topojson.feature(world, world.objects.countries);
const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
log(countries.features.length, "features; e.g.", countries.features[5].id, countries.features[5].properties.name,
    countries.features[5].geometry.type);

const W = 640, H = 330;
const projection = d3.geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: "Sphere" });
const path = d3.geoPath(projection);
log("fitted scale:", projection.scale().toFixed(1), "translate:", projection.translate().map(Math.round).join(", "));

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);
svg.append("path").attr("d", path({ type: "Sphere" })).attr("fill", "#e7f1f8");
svg.append("path").attr("d", path(d3.geoGraticule10())).attr("fill", "none").attr("stroke", "#c5d5e2").attr("stroke-width", 0.5);
svg.append("g").selectAll("path").data(countries.features).join("path")
    .attr("d", path).attr("fill", "#cdd7c2")
  .append("title").text(d => d.properties.name);
svg.append("path").attr("d", path(borders)).attr("fill", "none").attr("stroke", "white").attr("stroke-width", 0.5);
svg.append("path").attr("d", path({ type: "Sphere" })).attr("fill", "none").attr("stroke", "#555");
`}
      />

      <h2>Projections</h2>
      <p>
        Every projection distorts something: area, shape (angles), distance or direction. Choose based on what your
        map needs to show:
      </p>
      <ul>
        <li>
          <strong>Equal-area</strong> (<code>geoEqualEarth</code>, <code>geoConicEqualArea</code>,{" "}
          <code>geoAzimuthalEqualArea</code>, <code>geoAlbers</code>) — sizes are comparable; use for choropleths
          and density maps.
        </li>
        <li>
          <strong>Conformal</strong> (<code>geoMercator</code>, <code>geoStereographic</code>,{" "}
          <code>geoConicConformal</code>) — local shapes and angles preserved; Mercator is the web-map standard but
          hugely inflates high latitudes.
        </li>
        <li>
          <strong>Compromise</strong> (<code>geoNaturalEarth1</code>) — pleasant-looking world maps that
          aren&apos;t strictly anything.
        </li>
        <li>
          <strong>Azimuthal</strong> (<code>geoOrthographic</code>, <code>geoAzimuthalEquidistant</code>,{" "}
          <code>geoGnomonic</code>) — views centered on a point; orthographic looks like a globe from space.
        </li>
        <li>
          <strong>Composite</strong> (<code>geoAlbersUsa</code>) — the lower 48 states plus insets of Alaska and
          Hawaii. It only works for US data and can&apos;t draw a sphere or graticule.
        </li>
      </ul>
      <p>
        All projections share a common API: <code>scale</code>, <code>translate</code>, <code>center</code>,{" "}
        <code>rotate([λ, φ, γ])</code> (spin the globe <em>before</em> projecting — the easiest way to re-center a
        world map), <code>clipAngle</code>, <code>precision</code>, plus <code>projection([lon, lat])</code> →{" "}
        <code>[x, y]</code> and <code>projection.invert([x, y])</code> → <code>[lon, lat]</code>.
      </p>
      <Playground
        title="Projection gallery"
        code={`
const [world, us] = await Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
]);
const land = topojson.feature(world, world.objects.land);
const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
const noAntarctica = { type: "FeatureCollection",
  features: topojson.feature(world, world.objects.countries).features.filter(d => d.properties.name !== "Antarctica") };
const states = topojson.feature(us, us.objects.states);
const stateBorders = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

const W = 640, H = 400, sphere = { type: "Sphere" };
// fit: what to fit into the box; sphere: whether the projection has a finite outline
const gallery = {
  geoEqualEarth:          { make: () => d3.geoEqualEarth(), fit: sphere },
  geoNaturalEarth1:       { make: () => d3.geoNaturalEarth1(), fit: sphere },
  geoMercator:            { make: () => d3.geoMercator(), fit: noAntarctica, sphere: false },
  geoEquirectangular:     { make: () => d3.geoEquirectangular(), fit: sphere },
  geoOrthographic:        { make: () => d3.geoOrthographic().rotate([-10, -30]), fit: sphere },
  geoStereographic:       { make: () => d3.geoStereographic().rotate([-10, -50]).clipAngle(110), fit: sphere },
  geoAzimuthalEqualArea:  { make: () => d3.geoAzimuthalEqualArea().rotate([-10, -50]), fit: sphere },
  geoAzimuthalEquidistant:{ make: () => d3.geoAzimuthalEquidistant().rotate([0, -90]), fit: sphere },
  geoConicEqualArea:      { make: () => d3.geoConicEqualArea().parallels([20, 60]).rotate([-10, 0]), fit: sphere },
  geoConicEquidistant:    { make: () => d3.geoConicEquidistant().parallels([20, 60]).rotate([-10, 0]), fit: sphere },
  geoGnomonic:            { make: () => d3.geoGnomonic().rotate([-10, -50]).clipAngle(60), fit: sphere },
  geoAlbersUsa:           { make: () => d3.geoAlbersUsa(), fit: states, sphere: false, us: true },
};

d3.select(el).append("select").style("margin-bottom", "8px")
    .on("change", e => draw(e.target.value))
  .selectAll("option").data(Object.keys(gallery)).join("option").text(d => d);
const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]);

function draw(name) {
  const cfg = gallery[name];
  const projection = cfg.make().fitExtent([[6, 6], [W - 6, H - 6]], cfg.fit);
  const path = d3.geoPath(projection);
  svg.selectAll("*").remove();
  const hasSphere = cfg.sphere !== false;
  if (hasSphere) svg.append("path").attr("d", path(sphere)).attr("fill", "#e7f1f8");
  if (!cfg.us) svg.append("path").attr("d", path(d3.geoGraticule10()))
      .attr("fill", "none").attr("stroke", "#b9cad8").attr("stroke-width", 0.5);
  svg.append("path").attr("d", path(cfg.us ? states : land)).attr("fill", "#c9d5bb");
  svg.append("path").attr("d", path(cfg.us ? stateBorders : borders))
      .attr("fill", "none").attr("stroke", "white").attr("stroke-width", 0.5);
  if (hasSphere) svg.append("path").attr("d", path(sphere)).attr("fill", "none").attr("stroke", "#444");
  const paris = projection([2.35, 48.86]);
  log(name + ": scale " + projection.scale().toFixed(0) + ", Paris → " + (paris ? paris.map(Math.round) : "null (not in this projection)"));
}
draw("geoEqualEarth");
`}
      />
      <Callout type="note" title="Pre-projected US data">
        <p>
          We used <code>us-atlas/states-10m.json</code>, which is in longitude/latitude, together with{" "}
          <code>d3.geoAlbersUsa()</code>. The same package also ships <code>states-albers-10m.json</code>, whose
          coordinates are <em>already projected</em> with AlbersUsa into a 975×610 pixel space. For that file you
          must use <code>d3.geoPath()</code> with a <strong>null projection</strong> (the identity) — applying a
          projection again would treat pixels as degrees and produce garbage. Pre-projected files are faster to
          render; unprojected ones let you choose the projection and use spherical math.
        </p>
      </Callout>

      <h2>The geo API</h2>
      <ApiTable
        rows={[
          ["d3.geoPath(projection, context)", "Path generator for GeoJSON; returns SVG path data, or draws to a canvas context."],
          ["path.area / centroid / bounds / measure", "Projected area (px²), centroid, bounding box and length."],
          ["path.pointRadius(r)", "Radius used when drawing Point and MultiPoint geometries."],
          ["projection([lon, lat]) / invert([x, y])", "Project a coordinate / invert a pixel back to a coordinate."],
          ["projection.fitSize / fitExtent / fitWidth / fitHeight", "Set scale and translate so an object fits a box."],
          ["projection.rotate([λ, φ, γ])", "Rotate the sphere before projecting (yaw, pitch, roll in degrees)."],
          ["projection.scale / translate / center", "Zoom factor, pixel position of the center, and geographic center."],
          ["projection.clipAngle / clipExtent / precision", "Small-circle clipping, rectangular clipping, adaptive resampling."],
          ["d3.geoGraticule() / geoGraticule10()", "Generator for meridians and parallels / a default 10° graticule."],
          ["d3.geoArea / geoCentroid / geoBounds / geoLength", "Spherical area (sr), centroid, lon/lat bounds, length (radians)."],
          ["d3.geoDistance(a, b)", "Great-circle distance between two points in radians (× 6371 for km)."],
          ["d3.geoInterpolate(a, b)", "Function t ∈ [0, 1] → point along the great circle from a to b."],
          ["d3.geoContains(object, point)", "Whether a GeoJSON object contains a [lon, lat] point."],
          ["d3.geoCircle().center().radius()", "Generate a circle polygon on the sphere (radius in degrees)."],
          ["d3.geoRotation(angles)", "A standalone rotation function for coordinates."],
        ]}
      />

      <h2>A choropleth</h2>
      <p>
        A <strong>choropleth</strong> colors each region by a value. Use an equal-area projection so large regions
        don&apos;t look more important than they are. The data below is{" "}
        <strong>fake</strong>: each country gets a pseudo-random value seeded by its numeric ISO id, so it&apos;s
        stable across runs but meaningless. In a real map you&apos;d join your table on{" "}
        <code>feature.id</code> (ISO 3166 numeric codes in world-atlas) with a <code>Map</code>. We also use{" "}
        <code>path.area</code> and <code>path.centroid</code> to label the largest countries.
      </p>
      <Playground
        title="Choropleth with legend and hover"
        code={`
const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
const countries = topojson.feature(world, world.objects.countries);
countries.features = countries.features.filter(d => d.properties.name !== "Antarctica");

// FAKE data: a stable pseudo-random "score" per country (seeded generator, countries in id order)
const rng = d3.randomLcg(0.42);
const values = new Map(d3.sort(countries.features, f => f.id).map(f => [f.id, Math.round(rng() * 100)]));

const W = 640, H = 360;
const projection = d3.geoEqualEarth().fitExtent([[4, 30], [W - 4, H - 4]], countries);
const path = d3.geoPath(projection);
const color = d3.scaleSequential([0, 100], d3.interpolateYlGnBu);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H]).attr("font-family", "sans-serif");
const shapes = svg.append("g").selectAll("path").data(countries.features).join("path")
    .attr("d", path)
    .attr("fill", d => values.has(d.id) ? color(values.get(d.id)) : "#ccc")
    .attr("stroke", "white").attr("stroke-width", 0.4);
const info = svg.append("text").attr("x", W - 8).attr("y", 18).attr("text-anchor", "end").attr("font-size", 13);

shapes.on("pointerenter", function (event, d) {
    d3.select(this).raise().attr("stroke", "#111").attr("stroke-width", 1.2);
    info.text(d.properties.name + ": " + values.get(d.id));
  })
  .on("pointerleave", function () {
    d3.select(this).attr("stroke", "white").attr("stroke-width", 0.4);
    info.text("");
  });

// label the 6 largest countries (in projected area) at their centroids
const biggest = d3.sort(countries.features, d => -path.area(d)).slice(0, 6);
svg.append("g").attr("pointer-events", "none").attr("font-size", 10).attr("text-anchor", "middle")
  .selectAll("text").data(biggest).join("text")
    .attr("transform", d => "translate(" + path.centroid(d) + ")")
    .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 2.5)
    .text(d => d.properties.name);

// gradient legend
const lw = 200, lx = 10, ly = 10;
const grad = svg.append("defs").append("linearGradient").attr("id", "geo-choro-grad");
grad.selectAll("stop").data(d3.range(0, 1.01, 0.1)).join("stop")
    .attr("offset", d => d).attr("stop-color", d => color(d * 100));
svg.append("rect").attr("x", lx).attr("y", ly).attr("width", lw).attr("height", 10).attr("fill", "url(#geo-choro-grad)");
svg.append("g").attr("transform", "translate(0," + (ly + 10) + ")").attr("font-size", 9)
    .call(d3.axisBottom(d3.scaleLinear([0, 100], [lx, lx + lw])).ticks(5).tickSize(4))
    .call(g => g.select(".domain").remove());

log("largest by projected area:", biggest.map(d => d.properties.name).join(", "));
`}
      />

      <h2>Canvas and a rotating globe</h2>
      <p>
        Pass a canvas 2D context as the second argument to <code>d3.geoPath</code> (or call{" "}
        <code>path.context(ctx)</code>) and it <em>draws</em> instead of returning strings — you wrap each call in{" "}
        <code>ctx.beginPath()</code> and then <code>fill()</code> or <code>stroke()</code>. Redrawing the whole map
        on canvas every frame is fast, which makes animation practical. Here an orthographic projection is rotated a
        little on every <code>d3.timer</code> tick; dragging takes over the rotation. Points on the far side of the
        globe are clipped automatically by the projection, and for labels we test visibility with{" "}
        <code>d3.geoDistance</code> from the view center (less than 90° means visible).
      </p>
      <Playground
        title="Spinning, draggable globe (canvas)"
        code={`
const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
const land = topojson.feature(world, world.objects.land);
const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);
const cities = [
  ["London", -0.13, 51.5], ["New York", -74, 40.7], ["Tokyo", 139.7, 35.7], ["São Paulo", -46.6, -23.5],
  ["Sydney", 151.2, -33.9], ["Cairo", 31.2, 30], ["Mumbai", 72.9, 19.1], ["Lagos", 3.4, 6.5],
  ["Moscow", 37.6, 55.8], ["Mexico City", -99.1, 19.4], ["Cape Town", 18.4, -33.9], ["Singapore", 103.8, 1.35],
];

const S = 460, dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
    .attr("width", S * dpr).attr("height", S * dpr)
    .style("width", "100%").style("max-width", S + "px").style("cursor", "grab").node();
const ctx = canvas.getContext("2d");
ctx.scale(dpr, dpr);

const projection = d3.geoOrthographic().rotate([0, -25]).fitExtent([[8, 8], [S - 8, S - 8]], { type: "Sphere" });
const path = d3.geoPath(projection, ctx).pointRadius(3.5);
const graticule = d3.geoGraticule10();

function render() {
  ctx.clearRect(0, 0, S, S);
  ctx.beginPath(); path({ type: "Sphere" }); ctx.fillStyle = "#dcecf8"; ctx.fill();
  ctx.beginPath(); path(graticule); ctx.strokeStyle = "rgba(0,0,0,0.12)"; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.beginPath(); path(land); ctx.fillStyle = "#86a874"; ctx.fill();
  ctx.beginPath(); path(borders); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.stroke();

  const [lambda, phi] = projection.rotate();
  const center = [-lambda, -phi];
  ctx.font = "11px sans-serif"; ctx.fillStyle = "#c92a2a";
  for (const [name, lon, lat] of cities) {
    ctx.beginPath(); path({ type: "Point", coordinates: [lon, lat] }); ctx.fill();
    if (d3.geoDistance([lon, lat], center) < Math.PI / 2 - 0.25) {
      const [x, y] = projection([lon, lat]);
      ctx.fillText(name, x + 5, y - 4);
    }
  }
  ctx.beginPath(); path({ type: "Sphere" }); ctx.strokeStyle = "#333"; ctx.lineWidth = 1; ctx.stroke();
}

let dragging = false;
d3.timer(() => {
  if (dragging) return;
  const [l, p, g] = projection.rotate();
  projection.rotate([l + 0.2, p, g]);
  render();
});

d3.select(canvas).call(d3.drag()
  .on("start", () => { dragging = true; canvas.style.cursor = "grabbing"; })
  .on("drag", (event) => {
    const k = 75 / projection.scale();          // degrees per pixel, roughly
    const [l, p] = projection.rotate();
    projection.rotate([l + event.dx * k, Math.max(-90, Math.min(90, p - event.dy * k))]);
    render();
  })
  .on("end", () => { dragging = false; canvas.style.cursor = "grab"; }));

render();
log("scale:", projection.scale().toFixed(1), "— drag to spin");
`}
      />

      <h2>Great circles, distances and point-in-polygon</h2>
      <p>
        The shortest route between two points on a sphere is a <strong>great-circle arc</strong>. You get it for
        free by drawing a GeoJSON <code>LineString</code> — geoPath resamples along the arc, which is why flight
        routes curve on flat maps. <code>d3.geoDistance(a, b)</code> returns the angular distance in radians
        (multiply by Earth&apos;s radius, ~6371 km), and <code>d3.geoInterpolate(a, b)</code> returns a function
        giving intermediate points — perfect for animating a plane along the route.
      </p>
      <p>
        Going the other way, <code>projection.invert([x, y])</code> turns a pixel into a coordinate, and{" "}
        <code>d3.geoContains(feature, [lon, lat])</code> tests whether a feature contains it. Click the map to find
        out which country you clicked and how far it is from São Paulo.
      </p>
      <Playground
        title="Flight routes, animated planes and click-to-identify"
        code={`
const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
const countries = topojson.feature(world, world.objects.countries);
const cities = {
  "São Paulo": [-46.6, -23.5], London: [-0.13, 51.5], "New York": [-74, 40.7], Tokyo: [139.7, 35.7],
  Sydney: [151.2, -33.9], Lagos: [3.4, 6.5], Moscow: [37.6, 55.8], Mumbai: [72.9, 19.1], "Cape Town": [18.4, -33.9],
};
const hub = cities["São Paulo"];
const R = 6371;

const W = 640, H = 330;
const projection = d3.geoNaturalEarth1().rotate([-10, 0]).fitExtent([[4, 4], [W - 4, H - 4]], { type: "Sphere" });
const path = d3.geoPath(projection);

const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, W, H])
    .attr("font-family", "sans-serif").attr("font-size", 10).style("cursor", "crosshair");
// the clickable base map: ocean + countries (everything drawn on top ignores the pointer)
const base = svg.append("g");
base.append("path").attr("d", path({ type: "Sphere" })).attr("fill", "#eef4f8").attr("stroke", "#999");
base.append("path").attr("d", path(countries)).attr("fill", "#d9dfd0").attr("stroke", "white").attr("stroke-width", 0.4);
const overlay = svg.append("g").attr("pointer-events", "none");
const highlight = overlay.append("path").attr("fill", "#ffd43b").attr("stroke", "#e67700");

const routes = Object.entries(cities).filter(([n]) => n !== "São Paulo")
  .map(([name, c]) => ({ name, c, km: d3.geoDistance(hub, c) * R, interp: d3.geoInterpolate(hub, c) }));
log(routes.map(r => r.name + " " + Math.round(r.km).toLocaleString() + " km").join(" · "));

overlay.append("g").attr("fill", "none").attr("stroke", "#1c7ed6").attr("stroke-width", 1.2).attr("stroke-opacity", 0.7)
  .selectAll("path").data(routes).join("path")
    .attr("d", r => path({ type: "LineString", coordinates: [hub, r.c] }));

overlay.append("g").selectAll("g").data(Object.entries(cities)).join("g")
    .attr("transform", ([, c]) => "translate(" + projection(c) + ")")
    .call(g => g.append("circle").attr("r", 3).attr("fill", "#c92a2a"))
    .call(g => g.append("text").attr("x", 5).attr("dy", "-0.3em")
      .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 2.5).text(([n]) => n));

// planes: move along each great circle with geoInterpolate
const planes = overlay.append("g").selectAll("circle").data(routes).join("circle")
    .attr("r", 3.5).attr("fill", "#0b7285").attr("stroke", "white");
d3.timer(elapsed => {
  planes.attr("transform", (r, i) => {
    const t = ((elapsed / 4000) + i / routes.length) % 1;
    return "translate(" + projection(r.interp(t)) + ")";
  });
});

// click: invert the pixel, find the containing country, measure distance from the hub
const clickLine = overlay.append("path").attr("fill", "none").attr("stroke", "#e67700")
    .attr("stroke-width", 2).attr("stroke-dasharray", "4 3");
const label = overlay.append("text").attr("x", 8).attr("y", H - 10).attr("font-size", 13).text("click anywhere on the map");
base.on("click", (event) => {
  const lonlat = projection.invert(d3.pointer(event, svg.node()));
  const country = countries.features.find(f => d3.geoContains(f, lonlat));
  highlight.attr("d", country ? path(country) : null);
  clickLine.attr("d", path({ type: "LineString", coordinates: [hub, lonlat] }));
  const km = Math.round(d3.geoDistance(hub, lonlat) * R).toLocaleString();
  label.text((country ? country.properties.name : "Ocean") + " (" + lonlat.map(v => v.toFixed(1)).join(", ") + ") — " + km + " km from São Paulo");
});
`}
      />
      <Callout type="tip" title="Picking the right tool for points">
        <p>
          <code>d3.geoContains</code> is exact but checks one feature at a time, so testing a point against 177
          countries on every mouse move is fine, but against thousands of polygons it isn&apos;t — use SVG{" "}
          <code>pointerenter</code> events on the paths themselves, or build a spatial index. For placing many
          points (cities, earthquakes), project them once with <code>projection([lon, lat])</code> and draw circles;
          use <code>path.pointRadius</code> only when you need points clipped exactly like other geometry (e.g. on
          the back of a globe).
        </p>
      </Callout>

      <Exercises
        items={[
          <>
            In the first example, reverse the triangle&apos;s ring (<code>.reverse()</code>) and log{" "}
            <code>d3.geoArea</code> again. Compare it to <code>4 * Math.PI</code> and explain what you see on the
            map.
          </>,
          <>
            Add <code>geoTransverseMercator</code> and <code>geoConicConformal</code> to the projection gallery. Why
            can&apos;t you fit them to the sphere?
          </>,
          <>
            Turn the choropleth into a bivariate or diverging map: use <code>d3.interpolateRdBu</code> centered on
            50 and add a hover tooltip that follows the pointer.
          </>,
          <>
            On the globe, add great-circle arcs from London to every other city, and draw a{" "}
            <code>d3.geoCircle().center([lon, lat]).radius(10)</code> around the city nearest to the view center.
          </>,
          <>
            Load <code>us-atlas@3/states-albers-10m.json</code> and draw it with <code>d3.geoPath()</code> (null
            projection). Then label each state at its <code>path.centroid</code>.
          </>,
        ]}
      />
    </>
  );
}
