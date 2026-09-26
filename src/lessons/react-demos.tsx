"use client";

import * as d3 from "d3";
import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

/* ------------------------------------------------------------------ */
/* Shared hooks                                                        */
/* ------------------------------------------------------------------ */

/** Measure an element's width with ResizeObserver (0 until mounted). */
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

/** Tween an array of numbers toward `target` with d3.timer + d3.interpolate. */
function useTweened(target: number[], duration = 600) {
  const [current, setCurrent] = useState(target);
  const currentRef = useRef(target);
  useEffect(() => {
    const interp = d3.interpolateNumberArray(Float64Array.from(currentRef.current), Float64Array.from(target));
    const timer = d3.timer((elapsed) => {
      const k = Math.min(1, elapsed / duration);
      const next = Array.from(interp(d3.easeCubicOut(k)));
      currentRef.current = next;
      setCurrent(next);
      if (k === 1) timer.stop();
    });
    return () => timer.stop(); // StrictMode-safe: the first (discarded) effect is cleaned up
  }, [target, duration]);
  return current;
}

const btn =
  "rounded-md border border-neutral-300 bg-white px-3 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100";

/* ------------------------------------------------------------------ */
/* 1. React renders, D3 computes: bar chart                            */
/* ------------------------------------------------------------------ */

type Bar = { key: string; value: number };
const LETTERS = "ABCDEFGHIJKL".split("");

function makeBars(random: () => number): Bar[] {
  return LETTERS.map((key) => ({ key, value: Math.round(5 + random() * 95) }));
}

export function ReactBarChart() {
  // Deterministic initial data so server and client render the same markup (no hydration mismatch).
  const [data, setData] = useState<Bar[]>(() => makeBars(d3.randomLcg(1)));
  const [sorted, setSorted] = useState(false);

  const W = 600, H = 260, m = { top: 16, right: 12, bottom: 28, left: 36 };
  const ordered = useMemo(
    () => (sorted ? d3.sort(data, (d) => -d.value) : data),
    [data, sorted],
  );
  const x = useMemo(
    () => d3.scaleBand(ordered.map((d) => d.key), [m.left, W - m.right]).padding(0.2),
    [ordered, m.left, m.right],
  );
  const y = useMemo(() => d3.scaleLinear([0, 100], [H - m.bottom, m.top]), [m.bottom, m.top]);

  // Tween values and x positions in LETTERS order so each bar keeps its identity
  const target = useMemo(() => {
    const byKey = new Map(data.map((d) => [d.key, d.value]));
    return LETTERS.flatMap((k) => [byKey.get(k) ?? 0, x(k) ?? 0]);
  }, [data, x]);
  const tween = useTweened(target);

  return (
    <div>
      <div className="mb-2 flex gap-2">
        <button className={btn} onClick={() => setData(makeBars(Math.random))}>
          Randomize
        </button>
        <button className={btn} onClick={() => setSorted((s) => !s)}>
          {sorted ? "Alphabetical" : "Sort by value"}
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxWidth: W }}>
        {y.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${y(t)})`}>
            <line x1={m.left} x2={W - m.right} stroke="#e9ecef" />
            <text x={m.left - 6} dy="0.32em" textAnchor="end" fontSize={11} fill="#868e96">
              {t}
            </text>
          </g>
        ))}
        {LETTERS.map((k, i) => {
          const v = tween[2 * i], bx = tween[2 * i + 1];
          return (
            <g key={k} transform={`translate(${bx},0)`}>
              <rect y={y(v)} width={x.bandwidth()} height={y(0) - y(v)} rx={3} fill={d3.interpolateBlues(0.35 + v / 160)} />
              <text x={x.bandwidth() / 2} y={y(v) - 4} textAnchor="middle" fontSize={10} fill="#495057">
                {Math.round(v)}
              </text>
              <text x={x.bandwidth() / 2} y={H - m.bottom + 16} textAnchor="middle" fontSize={12} fill="#1c1b19">
                {k}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. React renders, D3 computes: responsive line chart with hover     */
/* ------------------------------------------------------------------ */

type Point = { date: Date; value: number };

function makeSeries(): Point[] {
  const rand = d3.randomNormal.source(d3.randomLcg(7))(0, 1.4);
  let v = 100;
  const start = new Date(2025, 0, 1);
  return d3.range(180).map((i) => ({ date: d3.timeDay.offset(start, i), value: (v += rand() + 0.08) }));
}

const bisectDate = d3.bisector<Point, Date>((d) => d.date).center;
const fmtDate = d3.timeFormat("%b %d, %Y");

export function ReactLineChart() {
  const [ref, measured] = useWidth<HTMLDivElement>();
  const data = useMemo(makeSeries, []);
  const [hover, setHover] = useState<number | null>(null);

  const W = Math.max(320, measured || 600), H = 260;
  const m = { top: 16, right: 16, bottom: 28, left: 40 };

  const x = useMemo(
    () => d3.scaleUtc(d3.extent(data, (d) => d.date) as [Date, Date], [m.left, W - m.right]),
    [data, W, m.left, m.right],
  );
  const y = useMemo(
    () => d3.scaleLinear(d3.extent(data, (d) => d.value) as [number, number], [H - m.bottom, m.top]).nice(),
    [data, m.bottom, m.top],
  );
  const line = useMemo(() => d3.line<Point>((d) => x(d.date), (d) => y(d.value)).curve(d3.curveMonotoneX), [x, y]);
  const area = useMemo(
    () => d3.area<Point>((d) => x(d.date), y.range()[0], (d) => y(d.value)).curve(d3.curveMonotoneX),
    [x, y],
  );

  function onMove(event: PointerEvent<SVGRectElement>) {
    const [mx] = d3.pointer(event.nativeEvent, event.currentTarget);
    setHover(bisectDate(data, x.invert(mx)));
  }

  const h = hover === null ? null : data[hover];
  return (
    <div ref={ref}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: "100%", display: "block" }}>
        <defs>
          <linearGradient id="react-line-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#e8590c" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#e8590c" stopOpacity={0} />
          </linearGradient>
        </defs>
        {x.ticks(Math.max(2, Math.floor(W / 110))).map((t) => (
          <text key={+t} x={x(t)} y={H - 8} textAnchor="middle" fontSize={11} fill="#868e96">
            {d3.utcFormat("%b")(t)}
          </text>
        ))}
        {y.ticks(5).map((t) => (
          <g key={t} transform={`translate(0,${y(t)})`}>
            <line x1={m.left} x2={W - m.right} stroke="#f1f3f5" />
            <text x={m.left - 6} dy="0.32em" textAnchor="end" fontSize={11} fill="#868e96">
              {t}
            </text>
          </g>
        ))}
        <path d={area(data) ?? undefined} fill="url(#react-line-fill)" />
        <path d={line(data) ?? undefined} fill="none" stroke="#e8590c" strokeWidth={2} />
        {h && (
          <g pointerEvents="none">
            <line x1={x(h.date)} x2={x(h.date)} y1={m.top} y2={H - m.bottom} stroke="#adb5bd" strokeDasharray="3 3" />
            <circle cx={x(h.date)} cy={y(h.value)} r={5} fill="#e8590c" stroke="white" strokeWidth={2} />
            <g transform={`translate(${Math.min(x(h.date) + 10, W - m.right - 130)},${m.top + 4})`}>
              <rect width={128} height={38} rx={4} fill="#1c1b19" fillOpacity={0.9} />
              <text x={8} y={16} fontSize={11} fill="#ced4da">
                {fmtDate(h.date)}
              </text>
              <text x={8} y={31} fontSize={13} fontWeight={700} fill="white">
                {h.value.toFixed(2)}
              </text>
            </g>
          </g>
        )}
        <rect
          x={m.left}
          y={m.top}
          width={W - m.left - m.right}
          height={H - m.top - m.bottom}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      <p className="mt-1 text-xs text-neutral-500">Resize the window: width comes from a ResizeObserver hook ({Math.round(W)}px).</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. D3 owns the DOM: axes + zoom via useRef/useEffect                */
/* ------------------------------------------------------------------ */

export function D3ZoomScatter() {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [scale, setScale] = useState(1);
  const [count, setCount] = useState(800);

  const data = useMemo(() => {
    const n = d3.randomNormal.source(d3.randomLcg(count))(0, 1);
    return d3.range(count).map((i) => [n() * (i % 2 ? 1 : 2.2), n() * (i % 3 ? 1 : 0.4)] as [number, number]);
  }, [count]);

  useEffect(() => {
    const W = 600, H = 320, m = { top: 12, right: 12, bottom: 26, left: 36 };
    const svg = d3.select(svgRef.current!);
    const x = d3.scaleLinear([-6, 6], [m.left, W - m.right]);
    const y = d3.scaleLinear([-4, 4], [H - m.bottom, m.top]);
    const color = d3.scaleSequential(d3.interpolateViridis).domain([0, 5]);

    svg.append("clipPath").attr("id", "zoom-clip")
      .append("rect").attr("x", m.left).attr("y", m.top)
      .attr("width", W - m.left - m.right).attr("height", H - m.top - m.bottom);
    const gx = svg.append("g").attr("transform", `translate(0,${H - m.bottom})`);
    const gy = svg.append("g").attr("transform", `translate(${m.left},0)`);
    const dots = svg.append("g").attr("clip-path", "url(#zoom-clip)")
      .selectAll("circle").data(data).join("circle")
        .attr("r", 2.5)
        .attr("fill", (d) => color(Math.hypot(d[0], d[1])))
        .attr("fill-opacity", 0.8);

    function render(t: d3.ZoomTransform) {
      const zx = t.rescaleX(x), zy = t.rescaleY(y);
      gx.call(d3.axisBottom(zx).ticks(8));
      gy.call(d3.axisLeft(zy).ticks(6));
      dots.attr("cx", (d) => zx(d[0])).attr("cy", (d) => zy(d[1]));
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 32])
      .extent([[m.left, m.top], [W - m.right, H - m.bottom]])
      .on("zoom", ({ transform }: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        render(transform);
        setScale(transform.k); // push D3 state *out* to React
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    render(d3.zoomTransform(svg.node()!));

    // Cleanup: remove listeners and everything we appended. Essential under StrictMode,
    // which mounts → unmounts → remounts in development and would otherwise double the chart.
    return () => {
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
    };
  }, [data]);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-700">
        <button
          className={btn}
          onClick={() => {
            if (!svgRef.current || !zoomRef.current) return;
            d3.select(svgRef.current).transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
          }}
        >
          Reset zoom
        </button>
        <button className={btn} onClick={() => setCount((c) => (c === 800 ? 3000 : 800))}>
          {count === 800 ? "3000 points" : "800 points"}
        </button>
        <span className="tabular-nums">zoom ×{scale.toFixed(2)} · scroll or drag to explore</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 600 320" className="w-full touch-none" style={{ maxWidth: 600, cursor: "grab" }} />
    </div>
  );
}
