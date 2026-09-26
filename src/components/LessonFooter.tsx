"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LessonMeta } from "@/lib/lessons";
import { PROGRESS_EVENT, PROGRESS_KEY, readDone } from "./Sidebar";

export function LessonFooter({ slug, prev, next }: { slug: string; prev: LessonMeta | null; next: LessonMeta | null }) {
  const [done, setDone] = useState(false);
  useEffect(() => setDone(readDone().includes(slug)), [slug]);

  const toggle = () => {
    const list = readDone().filter((s) => s !== slug);
    if (!done) list.push(slug);
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(list));
    } catch {}
    setDone(!done);
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  };

  return (
    <div className="mt-14 border-t border-[var(--border)] pt-8">
      <button
        onClick={toggle}
        className={`mb-8 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
          done
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--accent)]"
        }`}
      >
        {done ? "✓ Completed — click to undo" : "Mark lesson as complete"}
      </button>
      <div className="grid grid-cols-2 gap-4">
        {prev ? (
          <Link href={`/learn/${prev.slug}`} className="rounded-xl border border-[var(--border)] p-4 hover:border-[var(--accent)]">
            <div className="text-xs text-[var(--muted)]">← Previous</div>
            <div className="font-semibold">{prev.title}</div>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/${next.slug}`} className="rounded-xl border border-[var(--border)] p-4 text-right hover:border-[var(--accent)]">
            <div className="text-xs text-[var(--muted)]">Next →</div>
            <div className="font-semibold">{next.title}</div>
          </Link>
        )}
      </div>
    </div>
  );
}
