import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Transitions are great when you know the start and end state. But some animations never end: a physics
        simulation, particles, a live clock, a planet going around the sun. For these you need a loop that runs code
        on every frame. <strong>d3-timer</strong> is that loop. It is a small, efficient queue built on{" "}
        <code>requestAnimationFrame</code>, and it is the same engine that powers d3-transition and d3-force.
      </p>

      <h2>d3.timer: a callback every frame</h2>
      <p>
        <code>d3.timer(callback)</code> calls <code>callback(elapsed)</code> on every animation frame, usually 60
        times a second. <code>elapsed</code> is the number of milliseconds since the timer started. The call
        returns a timer object. Call <code>timer.stop()</code> to end the loop, either from outside or from
        inside the callback.
      </p>
      <Playground
        title="d3.timer basics"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 120");
const dot = svg.append("circle").attr("cy", 60).attr("r", 16).attr("fill", "#f76707");
const label = svg.append("text").attr("x", 10).attr("y", 20).style("font", "12px monospace");

let frames = 0;
const t = d3.timer(elapsed => {
  frames++;
  // position is a function of time, not of frame count
  const x = 40 + (elapsed / 5) % 560;
  dot.attr("cx", x);
  label.text(\`elapsed: \${elapsed.toFixed(0)} ms   frames: \${frames}   fps ≈ \${(frames / elapsed * 1000).toFixed(0)}\`);
  if (elapsed > 6000) {
    t.stop();                     // stop from inside the callback
    log("stopped after", frames, "frames");
  }
});
`}
      />
      <Callout type="tip" title="Animate by time, not by frame">
        <p>
          Always compute positions from <code>elapsed</code> instead of adding a fixed step every frame. Frame rates
          vary: 120 Hz screens, busy CPUs, background tabs. An animation based on elapsed time moves at the same
          speed everywhere. One that adds a fixed step per frame runs twice as fast on a 120 Hz display.
        </p>
      </Callout>

      <h2>d3.now, delays and timer.restart</h2>
      <p>
        <code>d3.now()</code> returns the current time as the timer queue sees it. Within a single frame, every
        timer sees the <em>same</em> time, so animations stay in sync. <code>d3.timer</code> also takes optional{" "}
        <code>delay</code> and <code>time</code> arguments. The callback starts <code>delay</code> ms after{" "}
        <code>time</code> (which defaults to now). <code>timer.restart(callback, delay, time)</code> reuses a timer
        object with a new callback.
      </p>

      <h2>d3.timeout and d3.interval</h2>
      <p>
        These are the d3 versions of <code>setTimeout</code> and <code>setInterval</code>, but they run in sync with
        the animation frame queue.
      </p>
      <ul>
        <li>
          <code>d3.timeout(callback, delay)</code> runs once after <code>delay</code> ms, then stops itself.
        </li>
        <li>
          <code>d3.interval(callback, delay)</code> runs every <code>delay</code> ms. Its callback gets the elapsed
          time too.
        </li>
      </ul>
      <p>
        Because they use <code>requestAnimationFrame</code>, they pause when the tab is hidden, which saves battery.
        They also fire right before a paint, so DOM updates appear on the next frame without extra delay.
      </p>
      <Playground
        title="timeout, interval and now"
        code={`
const root = d3.select(el).style("font", "14px monospace");
const clock = root.append("div").style("font-size", "28px").style("font-weight", "700");
const status = root.append("div").style("color", "#666").style("margin-top", "4px");

const start = d3.now();
const fmt = d3.timeFormat("%H:%M:%S");
const tick = d3.interval(elapsed => {
  clock.text(fmt(new Date()));
  status.text("interval elapsed: " + (elapsed / 1000).toFixed(1) + " s");
}, 1000);
clock.text(fmt(new Date()));

d3.timeout(() => log("timeout fired after", Math.round(d3.now() - start), "ms"), 1500);
d3.timeout(() => { tick.stop(); log("interval stopped at 10 s"); }, 10000);
`}
      />

      <h2>Frame-based animation: an orrery</h2>
      <p>
        With a timer, each object&apos;s position is just a formula of time. Here each planet&apos;s angle is{" "}
        <code>elapsed / period</code>. The moon&apos;s position is relative to its planet. Buttons let you pause and
        resume. Pausing stops the timer, and resuming starts a new one while keeping track of the time already
        played, so the planets continue from where they stopped.
      </p>
      <Playground
        title="Orbiting planets"
        code={`
const W = 640, H = 400, cx = W / 2, cy = H / 2;
const planets = [
  { name: "Mercury", r: 4, orbit: 45, period: 0.24, color: "#adb5bd" },
  { name: "Venus", r: 7, orbit: 70, period: 0.62, color: "#fab005" },
  { name: "Earth", r: 8, orbit: 100, period: 1, color: "#339af0", moon: true },
  { name: "Mars", r: 6, orbit: 130, period: 1.88, color: "#fa5252" },
  { name: "Jupiter", r: 15, orbit: 170, period: 4, color: "#e8590c" },
];
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("background", "#0b1020");

// starfield (seeded so it is stable)
const rng = d3.randomLcg(1);
svg.append("g").selectAll("circle").data(d3.range(150)).join("circle")
  .attr("cx", () => rng() * W).attr("cy", () => rng() * H).attr("r", () => rng() * 1.2)
  .attr("fill", "white").attr("opacity", () => 0.3 + rng() * 0.6);

svg.append("g").selectAll("circle").data(planets).join("circle")
  .attr("cx", cx).attr("cy", cy).attr("r", d => d.orbit)
  .attr("fill", "none").attr("stroke", "white").attr("stroke-opacity", 0.12);
svg.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 22).attr("fill", "#ffd43b")
  .style("filter", "drop-shadow(0 0 12px #ffd43b)");

const bodies = svg.append("g").selectAll("g").data(planets).join("g");
bodies.append("circle").attr("r", d => d.r).attr("fill", d => d.color);
bodies.filter(d => d.moon).append("circle").attr("class", "moon").attr("r", 2.5).attr("fill", "#dee2e6");
bodies.append("text").attr("y", d => -d.r - 4).attr("text-anchor", "middle")
  .attr("fill", "#ced4da").style("font", "10px sans-serif").text(d => d.name);

const YEAR = 4000;       // ms for one Earth year
let offset = 0, timer = null;
function frame(elapsed) {
  const t = offset + elapsed;
  bodies.attr("transform", d => {
    const a = (t / (YEAR * d.period)) * 2 * Math.PI;
    return \`translate(\${cx + d.orbit * Math.cos(a)},\${cy + d.orbit * Math.sin(a)})\`;
  });
  bodies.select(".moon")
    .attr("cx", 16 * Math.cos(t / 300)).attr("cy", 16 * Math.sin(t / 300));
  return t;
}
let last = 0;
function play() { if (!timer) timer = d3.timer(e => { last = frame(e); }); }
function pause() { if (timer) { timer.stop(); timer = null; offset = last; } }

const bar = d3.select(el).append("div").style("margin-top", "6px").style("display", "flex").style("gap", "6px");
bar.append("button").text("Pause").on("click", pause);
bar.append("button").text("Play").on("click", play);
play();
`}
      />

      <h2>A particle system on canvas</h2>
      <p>
        SVG struggles when you have thousands of moving elements, because every element is a DOM node. For heavy
        animations, draw to a <code>&lt;canvas&gt;</code> instead: clear it and redraw everything every frame. The
        timer loop stays the same. Here we simulate 3,000 particles with velocity, gravity and a lifetime. Move
        the pointer over the canvas to move the emitter.
      </p>
      <Playground
        title="3,000 particles at 60fps"
        code={`
const W = 640, H = 360, dpr = window.devicePixelRatio || 1;
const canvas = d3.select(el).append("canvas")
  .attr("width", W * dpr).attr("height", H * dpr)
  .style("width", "100%").style("max-width", W + "px").style("display", "block")
  .style("background", "#0b1020").style("border-radius", "8px").style("cursor", "crosshair");
const ctx = canvas.node().getContext("2d");
ctx.scale(dpr, dpr);

const N = 3000;
const angle = d3.randomNormal(-Math.PI / 2, 0.35);
const speed = d3.randomUniform(80, 260);
const life = d3.randomUniform(1.2, 3);
let emitter = [W / 2, H - 30];

const particles = Array.from({ length: N }, () => spawn({}, Math.random() * 3));
function spawn(p, age = 0) {
  const a = angle(), s = speed();
  p.x = emitter[0]; p.y = emitter[1];
  p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
  p.life = life(); p.age = age;
  return p;
}
canvas.on("pointermove", event => {
  const [mx, my] = d3.pointer(event);
  const k = W / canvas.node().clientWidth;          // CSS px → canvas units
  emitter = [mx * k, my * k];
});

let last = 0, frames = 0;
const fps = d3.select(el).append("div").style("font", "12px monospace").style("color", "#666");
d3.timer(elapsed => {
  const dt = Math.min(0.05, (elapsed - last) / 1000);   // seconds since last frame (capped)
  last = elapsed;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(11, 16, 32, 0.35)";            // translucent clear → motion trails
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";            // additive glow
  for (const p of particles) {
    p.age += dt;
    if (p.age > p.life) spawn(p);
    p.vy += 220 * dt;                                  // gravity
    p.x += p.vx * dt; p.y += p.vy * dt;
    const t = p.age / p.life;
    ctx.fillStyle = d3.interpolateInferno(1 - t * 0.85);
    ctx.globalAlpha = 1 - t;
    ctx.fillRect(p.x, p.y, 2, 2);
  }
  ctx.globalAlpha = 1;
  if (++frames % 30 === 0) fps.text("fps ≈ " + Math.round(1 / dt) + " · " + N + " particles");
});
`}
      />
      <Callout type="warning" title="Always stop your timers">
        <p>
          A timer runs until you stop it. In a real app (React, Vue, a single-page app), stop timers when the
          component unmounts, or they keep running and holding references to removed DOM nodes. The playgrounds here
          stop <code>d3.timer</code>, <code>d3.interval</code> and <code>d3.timeout</code> for you on re-run, but
          your own code must call <code>timer.stop()</code> in its cleanup.
        </p>
      </Callout>

      <h2>timerFlush</h2>
      <p>
        New timers wait for the next animation frame before their first call. That can cause a one-frame flash of
        the initial state. <code>d3.timerFlush()</code> runs every timer that is due <em>immediately</em>, in the
        same call stack. It is mostly useful in tests and when you want a newly created transition or timer to draw
        its first frame before the browser paints.
      </p>
      <Playground
        title="timerFlush runs due timers now"
        hideOutput
        code={`
let calls = 0;
const t = d3.timer(() => { calls++; });
log("after d3.timer():   calls =", calls);   // 0: waits for the next frame
d3.timerFlush();
log("after timerFlush(): calls =", calls);   // 1: ran synchronously
t.stop();
`}
      />

      <h2>Timers vs transitions</h2>
      <p>
        Both run on the same queue, so how do you choose?
      </p>
      <ul>
        <li>
          Use a <strong>transition</strong> when you move from state A to state B over a fixed time. You get easing,
          interpolation, chaining, events and interruption for free.
        </li>
        <li>
          Use a <strong>timer</strong> when the animation is open-ended or driven by simulation, when the next state
          depends on the previous one, or when you draw to canvas.
        </li>
      </ul>
      <p>
        In fact you can write a transition with a timer. The comparison below moves two dots the same way. One uses{" "}
        <code>transition()</code> and the other a hand-written timer with <code>d3.easeCubicInOut</code>:
      </p>
      <Playground
        title="A transition, rebuilt with d3.timer"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 130").style("font", "12px monospace");
svg.append("text").attr("x", 10).attr("y", 30).text("transition");
svg.append("text").attr("x", 10).attr("y", 90).text("d3.timer");
const a = svg.append("circle").attr("cx", 110).attr("cy", 25).attr("r", 12).attr("fill", "#4c6ef5");
const b = svg.append("circle").attr("cx", 110).attr("cy", 85).attr("r", 12).attr("fill", "#f76707");
const x = d3.interpolateNumber(110, 610);

function run() {
  a.attr("cx", 110).transition().duration(1500).ease(d3.easeCubicInOut).attr("cx", 610);

  const t = d3.timer(elapsed => {
    const k = Math.min(1, elapsed / 1500);
    b.attr("cx", x(d3.easeCubicInOut(k)));
    if (k === 1) t.stop();
  });
}
d3.select(el).append("button").text("Run both").on("click", run);
run();
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.now()", "The current time in ms. It stays the same for all timers within one frame."],
          ["d3.timer(callback[, delay[, time]])", "Calls callback(elapsed) every frame, starting delay ms after time."],
          ["timer.stop()", "Stops the timer. Safe to call from inside the callback."],
          ["timer.restart(callback[, delay[, time]])", "Restarts the timer with a new callback and timing."],
          ["d3.timeout(callback[, delay[, time]])", "Runs once after delay ms, then stops itself. The callback gets elapsed."],
          ["d3.interval(callback[, delay[, time]])", "Runs every delay ms. Without a delay, it behaves like d3.timer."],
          ["d3.timerFlush()", "Runs all timers that are due right now, synchronously."],
        ]}
      />
      <CodeBlock>{`
// Typical cleanup inside a React effect
useEffect(() => {
  const t = d3.timer(draw);
  return () => t.stop();
}, []);
`}</CodeBlock>

      <Exercises
        items={[
          <>Add a speed slider to the orrery that changes the YEAR constant without making the planets jump.</>,
          <>
            Make the particles change color over time with <code>d3.interpolateRainbow(elapsed / 5000 % 1)</code>{" "}
            at spawn time.
          </>,
          <>
            Build a stopwatch with Start, Stop and Reset buttons using <code>d3.timer</code> and{" "}
            <code>d3.format(&quot;.2f&quot;)</code>.
          </>,
          <>
            Use <code>d3.interval</code> to add a new point every 500ms to a line chart that scrolls to the left,
            keeping only the last 60 points.
          </>,
        ]}
      />
    </>
  );
}
