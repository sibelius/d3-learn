export type LessonMeta = {
  slug: string;
  title: string;
  module: string; // the d3 module(s) covered, e.g. "d3-selection"
  summary: string;
};

export type Section = {
  title: string;
  lessons: LessonMeta[];
};

export const sections: Section[] = [
  {
    title: "Foundations",
    lessons: [
      { slug: "introduction", title: "What is D3?", module: "d3", summary: "The mental model: D3 is a toolbox of small modules, not a charting library." },
      { slug: "selections", title: "Selections", module: "d3-selection", summary: "select, selectAll, attr, style, text, append, and method chaining." },
      { slug: "data-join", title: "Data Joins", module: "d3-selection", summary: "Bind data to elements with data() and join(); enter, update, exit; key functions." },
      { slug: "events", title: "Events & Interaction", module: "d3-selection", summary: "on(), event objects, d3.pointer, tooltips and hover states." },
    ],
  },
  {
    title: "Scales & Axes",
    lessons: [
      { slug: "continuous-scales", title: "Continuous Scales", module: "d3-scale", summary: "Linear, pow, sqrt, log, symlog and time scales; domain, range, nice, clamp, invert." },
      { slug: "ordinal-scales", title: "Ordinal & Discrete Scales", module: "d3-scale", summary: "Band, point, ordinal, quantize, quantile, threshold, sequential and diverging scales." },
      { slug: "axes", title: "Axes", module: "d3-axis", summary: "axisBottom/Left/Top/Right, ticks, tick formats, gridlines and styling." },
    ],
  },
  {
    title: "Shapes",
    lessons: [
      { slug: "lines-areas", title: "Lines & Areas", module: "d3-shape", summary: "d3.line, d3.area, curves, defined() for gaps, and d3.path." },
      { slug: "arcs-pies", title: "Arcs & Pies", module: "d3-shape", summary: "d3.arc and d3.pie to build pie and donut charts." },
      { slug: "stacks-symbols", title: "Stacks, Symbols & Links", module: "d3-shape", summary: "d3.stack for stacked bars/areas, d3.symbol, d3.link." },
    ],
  },
  {
    title: "Data",
    lessons: [
      { slug: "arrays", title: "Arrays & Statistics", module: "d3-array", summary: "extent, min, max, mean, median, group, rollup, bin, ticks, bisect, sort." },
      { slug: "formatting", title: "Numbers, Dates & Time", module: "d3-format · d3-time · d3-time-format", summary: "Format numbers, parse and format dates, time intervals." },
      { slug: "fetching", title: "Loading & Parsing Data", module: "d3-fetch · d3-dsv", summary: "d3.csv, d3.json, csvParse, autoType, and row conversion." },
      { slug: "random", title: "Random Numbers", module: "d3-random", summary: "Uniform, normal, log-normal, exponential and seeded generators." },
    ],
  },
  {
    title: "Color & Motion",
    lessons: [
      { slug: "color", title: "Color & Interpolation", module: "d3-color · d3-interpolate · d3-scale-chromatic", summary: "Color spaces, interpolators, and built-in color schemes." },
      { slug: "transitions", title: "Transitions", module: "d3-transition · d3-ease", summary: "Animate attributes, durations, delays, easing, chaining and interruption." },
      { slug: "timers", title: "Timers & Animation Loops", module: "d3-timer", summary: "d3.timer, d3.interval, d3.timeout and frame-based animation." },
    ],
  },
  {
    title: "Interaction",
    lessons: [
      { slug: "zoom", title: "Zoom & Pan", module: "d3-zoom", summary: "d3.zoom, transforms, rescaling axes, programmatic zoom." },
      { slug: "drag", title: "Drag", module: "d3-drag", summary: "d3.drag with start, drag, end events and subjects." },
      { slug: "brush", title: "Brushing", module: "d3-brush", summary: "1D and 2D brushes for selecting ranges and filtering." },
    ],
  },
  {
    title: "Layouts",
    lessons: [
      { slug: "hierarchy", title: "Hierarchies", module: "d3-hierarchy", summary: "hierarchy, stratify, tree, cluster, treemap, pack, partition." },
      { slug: "force", title: "Force Simulations", module: "d3-force", summary: "Force-directed graphs: links, many-body, collide, center, x/y forces." },
      { slug: "chord", title: "Chord Diagrams", module: "d3-chord", summary: "d3.chord, ribbons and arcs for flows between groups." },
    ],
  },
  {
    title: "Geometry & Maps",
    lessons: [
      { slug: "geo", title: "Maps & Projections", module: "d3-geo", summary: "Projections, geoPath, graticules, GeoJSON and TopoJSON." },
      { slug: "delaunay", title: "Delaunay & Voronoi", module: "d3-delaunay", summary: "Triangulations, Voronoi diagrams and fast nearest-point lookup." },
      { slug: "quadtree", title: "Quadtrees", module: "d3-quadtree", summary: "Spatial indexing for search and collision detection." },
      { slug: "contours", title: "Contours & Density", module: "d3-contour · d3-polygon", summary: "Contour plots, density estimation and polygon utilities." },
    ],
  },
  {
    title: "Putting It Together",
    lessons: [
      { slug: "react", title: "D3 with React", module: "patterns", summary: "Two patterns: D3 owns the DOM (useRef/useEffect) vs React renders and D3 computes." },
      { slug: "capstone", title: "Capstone: Interactive Chart", module: "everything", summary: "Build a full interactive, animated, responsive chart from scratch." },
    ],
  },
];

export const allLessons: LessonMeta[] = sections.flatMap((s) => s.lessons);

export function getLesson(slug: string) {
  const index = allLessons.findIndex((l) => l.slug === slug);
  if (index === -1) return null;
  return {
    lesson: allLessons[index],
    index,
    prev: allLessons[index - 1] ?? null,
    next: allLessons[index + 1] ?? null,
  };
}
