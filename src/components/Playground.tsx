"use client";

import * as d3 from "d3";
import * as topojson from "topojson-client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { javascript } from "@codemirror/lang-javascript";
import { githubDark, githubLight } from "@uiw/codemirror-theme-github";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";

const CodeMirror = dynamic(() => import("@uiw/react-codemirror"), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse bg-[var(--code-bg)]" />,
});

type Cleanup = (() => void) | void;
type Stoppable = { stop: () => void };

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function subscribeDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useDark = () =>
  useSyncExternalStore(
    subscribeDark,
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
    () => false,
  );

function formatValue(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "function") return v.toString().split("\n")[0] + " …";
  if (v instanceof Node) return `<${v.nodeName.toLowerCase()}>`;
  try {
    return JSON.stringify(v, (_k, val) => (val instanceof Map ? Object.fromEntries(val) : val), 2) ?? String(v);
  } catch {
    return String(v);
  }
}

/**
 * A live D3 sandbox. The code runs as the body of an async function with:
 *   d3       – the full d3 library
 *   el       – an empty <div> to render into
 *   width    – the pixel width of `el`
 *   log(...) – prints values to the console panel under the output
 *   topojson – topojson-client (used in the maps lesson)
 * The code may return a cleanup function. Timers, intervals and force
 * simulations created through `d3` are stopped automatically on re-run.
 */
export function Playground({
  code: initialCode,
  title,
  height,
  hideOutput = false,
}: {
  code: string;
  title?: string;
  height?: number;
  hideOutput?: boolean;
}) {
  const starter = initialCode.replace(/^\n/, "").replace(/\s+$/, "") + "\n";
  const [code, setCode] = useState(starter);
  const [logs, setLogs] = useState<{ kind: "log" | "error"; text: string }[]>([]);
  const outRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const runIdRef = useRef(0);
  const codeRef = useRef(code);
  codeRef.current = code;
  const dark = useDark();

  const run = useCallback(async () => {
    const out = outRef.current;
    if (!out) return;
    const runId = ++runIdRef.current;
    const isCurrent = () => runId === runIdRef.current;
    cleanupRef.current();
    d3.select(out).selectAll("*").interrupt();
    out.innerHTML = "";
    setLogs([]);
    // Each run renders into its own host, so a stale run still awaiting
    // (e.g. a fetch) writes into a detached node instead of the page.
    const el = out.appendChild(document.createElement("div"));

    const tracked: Stoppable[] = [];
    const track = <T extends Stoppable>(t: T) => (tracked.push(t), t);
    const sandboxD3 = {
      ...d3,
      timer: (...a: Parameters<typeof d3.timer>) => track(d3.timer(...a)),
      interval: (...a: Parameters<typeof d3.interval>) => track(d3.interval(...a)),
      timeout: (...a: Parameters<typeof d3.timeout>) => track(d3.timeout(...a)),
      forceSimulation: (...a: Parameters<typeof d3.forceSimulation>) => track(d3.forceSimulation(...a)),
    };
    const log = (...args: unknown[]) =>
      isCurrent() &&
      setLogs((l) => [...l, { kind: "log", text: args.map(formatValue).join(" ") }]);

    let userCleanup: Cleanup;
    cleanupRef.current = () => {
      tracked.forEach((t) => t.stop());
      if (typeof userCleanup === "function") userCleanup();
    };
    try {
      const fn = new AsyncFunction("d3", "el", "width", "log", "topojson", codeRef.current);
      userCleanup = await fn(sandboxD3, el, el.clientWidth, log, topojson);
      if (!isCurrent()) {
        tracked.forEach((t) => t.stop());
        if (typeof userCleanup === "function") userCleanup();
      }
    } catch (e) {
      if (!isCurrent()) return;
      setLogs((l) => [...l, { kind: "error", text: String(e instanceof Error ? `${e.name}: ${e.message}` : e) }]);
    }
  }, []);

  useEffect(() => {
    run();
    return () => cleanupRef.current();
  }, [run]);

  const runKeymap = Prec.highest(
    keymap.of([
      { key: "Mod-Enter", run: () => (run(), true) },
      { key: "Shift-Enter", run: () => (run(), true) },
    ]),
  );

  return (
    <figure className="my-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-3 py-2 text-xs">
        <span className="font-medium text-[var(--muted)]">{title ?? "Live example"} · editable</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCode(starter);
              codeRef.current = starter;
              run();
            }}
            className="rounded-md px-2 py-1 text-[var(--muted)] hover:bg-[var(--hover)]"
          >
            Reset
          </button>
          <button
            onClick={run}
            className="rounded-md bg-[var(--accent)] px-3 py-1 font-semibold text-white hover:opacity-90"
            title="Run (⌘/Ctrl + Enter)"
          >
            ▶ Run
          </button>
        </div>
      </div>
      <div className="text-[13px]">
        <CodeMirror
          value={code}
          onChange={setCode}
          theme={dark ? githubDark : githubLight}
          extensions={[javascript(), runKeymap, EditorView.lineWrapping]}
          basicSetup={{ foldGutter: false, highlightActiveLine: false }}
        />
      </div>
      <div className="border-t border-[var(--border)] px-3 pt-2 text-[11px] uppercase tracking-wide text-[var(--muted)]">
        Output <span className="normal-case tracking-normal">— press ⌘/Ctrl + Enter to re-run</span>
      </div>
      <div
        ref={outRef}
        className={`d3-output overflow-x-auto p-3 ${hideOutput ? "hidden" : ""}`}
        style={height ? { minHeight: height } : undefined}
      />
      {logs.length > 0 && (
        <pre className="max-h-72 overflow-auto border-t border-[var(--border)] bg-[var(--code-bg)] px-3 py-2 font-mono text-xs leading-relaxed">
          {logs.map((l, i) => (
            <div key={i} className={l.kind === "error" ? "text-red-500" : ""}>
              {l.kind === "error" ? "✖ " : "› "}
              {l.text}
            </div>
          ))}
        </pre>
      )}
    </figure>
  );
}
