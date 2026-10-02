import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { ImageResponse } from "next/og";
import { allLessons, getLesson, sections } from "@/lib/lessons";

export const SITE_URL = "https://d3-learn.vercel.app";
export const SITE_NAME = "Learn D3.js";
export const SITE_DESCRIPTION =
  "An interactive course covering every part of D3.js, with live, editable examples.";
export const OG_SIZE = { width: 1200, height: 630 };

const HOME_TITLE = "Learn every part of D3.js";
const HOME_BLURB =
  "A hands-on course through the whole D3 toolbox, with a live code playground in every lesson.";

const C = {
  bg: "#fbfaf8",
  ink: "#1c1b19",
  muted: "#6b6760",
  faint: "#a19d95",
  line: "#e6e3dd",
  panel: "#ffffff",
  accent: "#e8590c",
  accentText: "#c2410c",
};

function lessonFor(href: string) {
  const slug = href.replace(/^\/learn\//, "");
  const found = getLesson(slug);
  if (!found) throw new Error(`No lesson for ${href}`);
  const section = sections.find((s) => s.lessons.some((l) => l.slug === slug))!;
  return { ...found, section, sectionIndex: sections.indexOf(section) };
}

/** Page metadata for "/" or "/learn/<slug>". The layout's title template appends the site name. */
export function pageMetadata(href: string): Metadata {
  if (href === "/") {
    return {
      title: { absolute: SITE_NAME },
      description: SITE_DESCRIPTION,
      openGraph: { title: SITE_NAME, description: SITE_DESCRIPTION, url: "/", siteName: SITE_NAME, type: "website" },
      twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
    };
  }
  const { lesson } = lessonFor(href);
  const full = `${lesson.title} · ${SITE_NAME}`;
  return {
    title: lesson.title,
    description: lesson.summary,
    openGraph: { title: full, description: lesson.summary, url: href, siteName: SITE_NAME, type: "article" },
    twitter: { card: "summary_large_image", title: full, description: lesson.summary },
  };
}

export function ogAlt(href: string) {
  if (href === "/") return `${SITE_NAME}: ${HOME_BLURB}`;
  const { lesson } = lessonFor(href);
  return `${lesson.title}: ${lesson.summary} ${SITE_NAME}`;
}

// d3.interpolateWarm, sampled
const WARM = ["#6e40aa", "#bf3caf", "#fe4b83", "#ff7847", "#e2b72f", "#aff05b"];
function warm(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * (WARM.length - 1);
  const i = Math.min(Math.floor(x), WARM.length - 2);
  const f = x - i;
  const a = WARM[i].match(/\w\w/g)!.map((h) => parseInt(h, 16));
  const b = WARM[i + 1].match(/\w\w/g)!.map((h) => parseInt(h, 16));
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
}

// Seeded so every build draws the same picture
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

/** A data join, frozen: seeded points bound to circles over a d3-style bottom axis. */
function Join({ index }: { index: number }) {
  const w = 1080;
  const h = 124;
  const axisY = h - 14;
  const n = 34;
  const rand = rng(11 + index * 97);
  const phase = rand() * Math.PI * 2;
  const freq = 1.2 + rand() * 1.6;
  const pts = Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const v = 0.5 + 0.3 * Math.sin(t * Math.PI * freq + phase) + (rand() - 0.5) * 0.3;
    return { x: 14 + t * (w - 28), v: Math.min(Math.max(v, 0.05), 0.98) };
  });
  const y = (v: number) => axisY - 16 - v * (axisY - 36);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: 11 }, (_, i) => 14 + (i / 10) * (w - 28));
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={line} fill="none" stroke={C.line} strokeWidth={2} />
      {pts.map((p, i) => {
        const cy = y(p.v);
        const r = 4 + Math.sqrt(p.v) * 10;
        return <circle key={i} cx={p.x} cy={cy} r={r} fill={warm(p.v)} fillOpacity={0.9} stroke={C.bg} strokeWidth={2} />;
      })}
      <line x1={14} y1={axisY + 0.5} x2={w - 14} y2={axisY + 0.5} stroke={C.ink} strokeWidth={1.5} />
      {ticks.map((x, i) => (
        <line key={i} x1={x} y1={axisY} x2={x} y2={axisY + 8} stroke={C.ink} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

const font = (f: string) => readFile(join(process.cwd(), "assets/fonts", f));

export async function renderOg(href: string) {
  const [bold, sans, mono] = await Promise.all([
    font("Geist-ExtraBold.woff"),
    font("Geist-Regular.woff"),
    font("GeistMono-Medium.woff"),
  ]);
  const home = href === "/";
  const info = home ? null : lessonFor(href);
  const title = info ? info.lesson.title : HOME_TITLE;
  const blurb = info ? info.lesson.summary : HOME_BLURB;
  const index = info ? info.index + 1 : 0;
  const titleSize = title.length > 18 ? 80 : 96;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: C.bg,
          color: C.ink,
          padding: "52px 60px 44px",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "Geist Mono", fontSize: 24 }}>
          {info ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ color: C.accentText }}>
                {String(index).padStart(2, "0")} / {allLessons.length}
              </span>
              <span style={{ color: C.muted }}>
                Part {info.sectionIndex + 1} · {info.section.title}
              </span>
            </div>
          ) : (
            <span style={{ color: C.accentText }}>D3 v7 · {allLessons.length} lessons · every example is editable</span>
          )}
          {info && (
            <div
              style={{
                display: "flex",
                padding: "6px 16px",
                borderRadius: 999,
                border: `1.5px solid ${C.line}`,
                background: C.panel,
                color: C.accentText,
                fontSize: 21,
              }}
            >
              {info.lesson.module.split(" · ")[0]}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 34,
            fontWeight: 800,
            fontSize: titleSize,
            lineHeight: 1.08,
            letterSpacing: -2.5,
            maxWidth: 1060,
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: 18, fontSize: 29, lineHeight: 1.35, color: C.muted, maxWidth: 1000 }}>{blurb}</div>

        <div style={{ flex: 1 }} />
        <Join index={index} />
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "Geist Mono",
            fontSize: 22,
            color: C.faint,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, color: C.ink }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 40,
                height: 40,
                borderRadius: 10,
                background: C.accent,
                color: "#fff",
                fontSize: 19,
              }}
            >
              d3
            </div>
            <span style={{ fontFamily: "Geist", fontWeight: 800, fontSize: 24, letterSpacing: -0.5 }}>{SITE_NAME}</span>
          </div>
          <span>d3-learn.vercel.app</span>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: bold, weight: 800, style: "normal" },
        { name: "Geist", data: sans, weight: 400, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 500, style: "normal" },
      ],
    },
  );
}
