import type { ReactNode } from "react";

/** A highlighted aside: tip, note, or warning. */
export function Callout({
  type = "tip",
  title,
  children,
}: {
  type?: "tip" | "note" | "warning";
  title?: string;
  children: ReactNode;
}) {
  const styles = {
    tip: "border-emerald-500/40 bg-emerald-500/10",
    note: "border-sky-500/40 bg-sky-500/10",
    warning: "border-amber-500/50 bg-amber-500/10",
  }[type];
  const label = title ?? { tip: "Tip", note: "Note", warning: "Watch out" }[type];
  return (
    <aside className={`not-prose my-6 rounded-lg border-l-4 px-4 py-3 text-[15px] leading-relaxed ${styles}`}>
      <div className="mb-1 text-xs font-bold uppercase tracking-wide opacity-80">{label}</div>
      <div className="callout-body">{children}</div>
    </aside>
  );
}

/** A static (non-runnable) code snippet. */
export function CodeBlock({ children, lang = "js" }: { children: string; lang?: string }) {
  return (
    <pre className="not-prose my-4 overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-4 font-mono text-[13px] leading-relaxed" data-lang={lang}>
      <code>{children.replace(/^\n/, "").replace(/\s+$/, "")}</code>
    </pre>
  );
}

/** A compact API reference table: [signature, description] pairs. */
export function ApiTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-[var(--border)]">
      <table className="w-full text-left text-sm">
        <tbody>
          {rows.map(([sig, desc]) => (
            <tr key={sig} className="border-b border-[var(--border)] last:border-0">
              <td className="whitespace-nowrap bg-[var(--code-bg)] px-3 py-2 align-top font-mono text-[12.5px] text-[var(--accent-text)]">{sig}</td>
              <td className="px-3 py-2 align-top leading-relaxed">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Numbered practice tasks at the end of a lesson. */
export function Exercises({ items }: { items: ReactNode[] }) {
  return (
    <section className="not-prose my-8 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <h3 className="mb-3 text-base font-bold">🏋️ Try it yourself</h3>
      <ol className="list-decimal space-y-2 pl-5 text-[15px] leading-relaxed">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
