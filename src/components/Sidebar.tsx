"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { sections, allLessons } from "@/lib/lessons";

export const PROGRESS_KEY = "d3-learn:done";
export const PROGRESS_EVENT = "d3-learn:progress";

export function readDone(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setDone(readDone());
    sync();
    window.addEventListener(PROGRESS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROGRESS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const pct = Math.round((done.length / allLessons.length) * 100);

  return (
    <>
      <button
        className="fixed right-4 top-3 z-50 rounded-md border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-sm font-medium lg:hidden"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Lessons"}
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-[var(--border)] bg-[var(--panel)] px-4 pb-10 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="sticky top-0 z-10 -mx-4 mb-2 flex items-center gap-2 bg-[var(--panel)] px-4 py-4">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--accent)] font-mono text-sm font-bold text-white">d3</span>
          <span className="font-bold tracking-tight">Learn D3.js</span>
        </Link>

        <div className="mb-5">
          <div className="mb-1 flex justify-between text-xs text-[var(--muted)]">
            <span>Progress</span>
            <span>
              {done.length}/{allLessons.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--hover)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <nav className="space-y-5">
          {sections.map((section, si) => (
            <div key={section.title}>
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                {si + 1}. {section.title}
              </div>
              <ul>
                {section.lessons.map((l) => {
                  const href = `/learn/${l.slug}`;
                  const active = pathname === href;
                  const isDone = done.includes(l.slug);
                  return (
                    <li key={l.slug}>
                      <Link
                        href={href}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[14px] ${
                          active ? "bg-[var(--accent)]/10 font-semibold text-[var(--accent-text)]" : "hover:bg-[var(--hover)]"
                        }`}
                      >
                        <span
                          className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] ${
                            isDone ? "border-emerald-500 bg-emerald-500 text-white" : "border-[var(--border)]"
                          }`}
                        >
                          {isDone ? "✓" : ""}
                        </span>
                        {l.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
