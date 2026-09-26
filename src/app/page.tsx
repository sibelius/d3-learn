import Link from "next/link";
import { allLessons, sections } from "@/lib/lessons";
import { Playground } from "@/components/Playground";

const hello = `
// Every example on this site is live. Edit me and press ⌘/Ctrl + Enter.
const data = [4, 8, 15, 16, 23, 42];

const svg = d3.select(el).append("svg")
  .attr("viewBox", "0 0 600 120");

svg.selectAll("circle")
  .data(data)
  .join("circle")
    .attr("cx", (d, i) => 50 + i * 100)
    .attr("cy", 60)
    .attr("r", 0)
    .attr("fill", (d) => d3.interpolateWarm(d / 42))
  .transition()
    .delay((d, i) => i * 120)
    .attr("r", (d) => Math.sqrt(d) * 7);
`;

export default function Home() {
  return (
    <div className="lesson mx-auto max-w-4xl px-5 pb-24 pt-14 sm:px-8">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
        D3 v{"7"} · {allLessons.length} lessons · every example is editable
      </div>
      <h1 className="!text-5xl">Learn every part of D3.js</h1>
      <p className="max-w-2xl !text-lg text-[var(--muted)]">
        A hands-on course that walks through the whole D3 toolbox — selections, data joins, scales, axes, shapes,
        transitions, interaction, layouts, maps and geometry — with a live code playground in every lesson.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href={`/learn/${allLessons[0].slug}`}
          className="!no-underline rounded-lg bg-[var(--accent)] px-5 py-2.5 font-semibold !text-white hover:opacity-90"
        >
          Start learning →
        </Link>
      </div>

      <Playground code={hello} title="Hello, D3" />

      <h2>Curriculum</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section, si) => (
          <div key={section.title} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Part {si + 1}
            </div>
            <h3 className="!mt-0 !mb-3">{section.title}</h3>
            <ul className="not-prose space-y-2">
              {section.lessons.map((l) => (
                <li key={l.slug}>
                  <Link href={`/learn/${l.slug}`} className="group block !no-underline">
                    <div className="font-medium !text-[var(--foreground)] group-hover:!text-[var(--accent-text)]">{l.title}</div>
                    <div className="text-sm text-[var(--muted)]">{l.summary}</div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
