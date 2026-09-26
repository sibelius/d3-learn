import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        A <strong>transition</strong> is a selection that changes over time instead of all at once. You write the
        same <code>.attr()</code> and <code>.style()</code> calls you already know, but D3 moves each value smoothly
        from where it is now to where you asked it to go. Motion helps readers follow what changed: a bar that grows
        is easier to track than one that just appears at a new height.
      </p>

      <h2>Your first transition</h2>
      <p>
        Call <code>selection.transition()</code> to turn a selection into a transition. Every attribute or style you
        set after that is animated. D3 reads the <em>current</em> value, builds an interpolator to the{" "}
        <em>target</em> value (using the interpolators from the color lesson), and runs it on every animation
        frame.
      </p>
      <Playground
        title="selection.transition()"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 140");
const circle = svg.append("circle")
    .attr("cx", 60).attr("cy", 70).attr("r", 30)
    .attr("fill", "steelblue");

d3.select(el).append("button").text("Animate").on("click", () => {
  const right = +circle.attr("cx") < 320;
  circle.transition()
      .duration(1000)                   // milliseconds (default 250)
      .attr("cx", right ? 580 : 60)
      .attr("r", right ? 50 : 30)
      .attr("fill", right ? "tomato" : "steelblue");
});
`}
      />

      <h2>Timing: duration, delay and ease</h2>
      <p>
        Three settings control <em>when</em> and <em>how</em> the change happens:
      </p>
      <ul>
        <li>
          <code>duration(ms)</code> sets how long it takes.
        </li>
        <li>
          <code>delay(ms)</code> sets how long to wait before starting. If you pass a function of{" "}
          <code>(d, i)</code>, you get a <strong>staggered</strong> effect where elements start one after another.
        </li>
        <li>
          <code>ease(fn)</code> sets the speed curve. It maps normalized time <code>t</code> to eased progress. The
          default is <code>d3.easeCubic</code>, which starts slow, speeds up, then slows down.
        </li>
      </ul>
      <Playground
        title="Staggered delay with a data join"
        code={`
const W = 640, H = 200;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`);
const x = d3.scaleBand(d3.range(20), [10, W - 10]).padding(0.15);
const y = d3.scaleLinear([0, 100], [H - 10, 10]);

const bars = svg.selectAll("rect").data(d3.range(20).map(() => 50)).join("rect")
    .attr("x", (d, i) => x(i)).attr("width", x.bandwidth())
    .attr("y", y(50)).attr("height", y(0) - y(50))
    .attr("rx", 3).attr("fill", "#4c6ef5");

function shuffle() {
  bars.data(d3.range(20).map(() => Math.random() * 95 + 5))
    .transition()
      .duration(600)
      .delay((d, i) => i * 40)          // one after another, left to right
      .ease(d3.easeBackOut)
      .attr("y", d => y(d))
      .attr("height", d => y(0) - y(d))
      .attr("fill", d => d3.interpolatePlasma(d / 110));
}
d3.select(el).append("button").text("New data").on("click", shuffle);
shuffle();
`}
      />

      <h2>The easing gallery</h2>
      <p>
        d3-ease provides many easing functions. Each takes normalized time <code>t</code> in [0, 1] and returns
        progress, usually also in [0, 1] (elastic and back go past it on purpose). Most have <code>In</code>,{" "}
        <code>Out</code> and <code>InOut</code> variants: speed up at the start, slow down at the end, or both. Some
        can be customized, like <code>d3.easePolyIn.exponent(4)</code>, <code>d3.easeBackOut.overshoot(3)</code> and{" "}
        <code>d3.easeElasticOut.amplitude(1).period(0.4)</code>.
      </p>
      <Playground
        title="Every easing function, animated and plotted"
        code={`
const names = ["easeLinear", "easeQuadInOut", "easeCubicIn", "easeCubicOut", "easeCubicInOut",
  "easePolyInOut", "easeSinInOut", "easeExpInOut", "easeCircleInOut",
  "easeBackIn", "easeBackOut", "easeBackInOut", "easeElasticIn", "easeElasticOut", "easeBounceOut", "easeBounceInOut"];
const cols = 4, cw = 160, ch = 140, pw = 100, ph = 70;
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${cols * cw} \${Math.ceil(names.length / cols) * ch}\`)
  .style("font", "10px monospace");

const cells = svg.selectAll("g").data(names).join("g")
  .attr("transform", (d, i) => \`translate(\${(i % cols) * cw + 30},\${Math.floor(i / cols) * ch + 34})\`);
const x = d3.scaleLinear([0, 1], [0, pw]);
const y = d3.scaleLinear([0, 1], [ph, 0]);

cells.append("text").attr("x", -20).attr("y", -18).attr("font-weight", 700).text(d => d);
cells.append("rect").attr("width", pw).attr("height", ph).attr("fill", "#f3f5f9");
cells.append("path")
  .attr("fill", "none").attr("stroke", "#adb5bd").attr("stroke-width", 1.5)
  .attr("d", n => d3.line().x(t => x(t)).y(t => y(d3[n](t)))(d3.range(0, 1.001, 0.01)));
// a marker moving along the curve, and a dot moving on a track
const marker = cells.append("circle").attr("r", 3.5).attr("fill", "#e8590c").attr("cx", x(0)).attr("cy", y(0));
const track = cells.append("line").attr("x1", -14).attr("x2", -14).attr("y1", y(0)).attr("y2", y(1)).attr("stroke", "#dee2e6");
const dot = cells.append("circle").attr("r", 5).attr("fill", "#4c6ef5").attr("cx", -14).attr("cy", y(0));

function play() {
  // tween gives us raw (linear) t, so we can apply each easing ourselves
  marker.transition().duration(2000).ease(d3.easeLinear)
    .tween("move", function (n) {
      const m = d3.select(this);
      return t => m.attr("cx", x(t)).attr("cy", y(d3[n](t)));
    });
  // easeVarying: a different easing function per element
  dot.attr("cy", y(0)).transition().duration(2000)
    .easeVarying(n => d3[n])
    .attr("cy", y(1));
}
d3.select(el).append("button").text("Replay").on("click", play);
play();
`}
      />
      <Callout type="note" title="ease vs easeVarying">
        <p>
          <code>transition.ease(fn)</code> takes one easing function for every element. To give each element its
          own easing, use <code>transition.easeVarying((d, i) =&gt; easeFn)</code>, as the blue dots do. The orange
          markers use a linear transition with a <code>tween</code> so they can apply the easing to the y
          coordinate only.
        </p>
      </Callout>

      <h2>Tweens: custom interpolation</h2>
      <p>
        D3 guesses a sensible interpolator from the start and end values. When you need control, use a{" "}
        <strong>tween</strong>. A tween factory runs once per element when the transition starts, and returns a
        function of eased <code>t</code> that runs every frame:
      </p>
      <ul>
        <li>
          <code>attrTween(name, factory)</code> and <code>styleTween(name, factory)</code>: the inner function
          returns the value to set.
        </li>
        <li>
          <code>textTween(factory)</code>: the inner function returns text. Perfect for counting numbers.
        </li>
        <li>
          <code>tween(name, factory)</code>: the inner function does anything it likes, e.g. updates several things
          at once.
        </li>
      </ul>
      <Playground
        title="textTween counter + attrTween arc"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 220");
const g = svg.append("g").attr("transform", "translate(320,115)");
const arc = d3.arc().innerRadius(70).outerRadius(95).startAngle(0).cornerRadius(6);

g.append("path").datum({ endAngle: 2 * Math.PI }).attr("d", arc).attr("fill", "#edf0f5");
const fg = g.append("path").datum({ endAngle: 0 }).attr("d", arc).attr("fill", "#12b886");
const label = g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
  .style("font", "700 34px sans-serif").text("0%");

let current = 0;
function go() {
  const target = Math.random();
  // attrTween: interpolate the ANGLE, not the path string
  fg.transition().duration(1200)
    .attrTween("d", d => {
      const i = d3.interpolate(d.endAngle, target * 2 * Math.PI);
      return t => arc({ ...d, endAngle: (d.endAngle = i(t)) });
    })
    .styleTween("fill", () => d3.interpolateHcl(d3.interpolateRdYlGn(current), d3.interpolateRdYlGn(target)));

  // textTween: count up/down smoothly
  const from = current;
  label.transition().duration(1200)
    .textTween(() => t => d3.format(".0%")(d3.interpolateNumber(from, target)(t)));
  current = target;
}
d3.select(el).append("button").text("New value").on("click", go);
go();
`}
      />
      <Callout type="warning" title="Why not just transition the path's d?">
        <p>
          If you write <code>.attr(&quot;d&quot;, newPath)</code>, D3 uses <code>interpolateString</code> on the two
          path strings and matches their numbers one by one. For arcs, the numbers don&apos;t line up, so the shape
          warps in strange ways. Interpolating the <em>data</em> (the angle) and rebuilding the path each frame gives
          correct in-between shapes. This is the most common reason to reach for <code>attrTween</code>.
        </p>
      </Callout>

      <h2>Chaining, naming and interrupting</h2>
      <p>
        Calling <code>.transition()</code> on a <em>transition</em> creates a follow-up that starts when the first
        one ends, on the same elements. This is how you build sequences. Chained transitions inherit the name, ease
        and timing of the parent unless you change them.
      </p>
      <p>
        An element can only run <strong>one transition per name</strong> at a time. Starting a new one with the
        same name cancels the old one. Give transitions different names, e.g.{" "}
        <code>selection.transition(&quot;color&quot;)</code>, to let them run in parallel.{" "}
        <code>selection.interrupt(name)</code> stops the active transition with that name and cancels any that are
        scheduled.
      </p>
      <Playground
        title="Chains, named transitions and interrupt"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 160");
const box = svg.append("rect").attr("x", 20).attr("y", 50).attr("width", 60).attr("height", 60)
  .attr("rx", 8).attr("fill", "#7950f2");

const bar = d3.select(el).append("div").style("display", "flex").style("gap", "6px");
bar.append("button").text("Run sequence").on("click", () => {
  box.transition("move")                     // named "move"
      .duration(700).attr("x", 560)
    .transition()                             // chained: waits for the previous step
      .attr("y", 10).attr("height", 140)
    .transition()
      .ease(d3.easeBounceOut).duration(900)
      .attr("x", 20).attr("y", 50).attr("height", 60)
    .on("end", () => log("sequence finished"));
});
bar.append("button").text("Pulse color (runs in parallel)").on("click", () => {
  box.transition("color").duration(400).attr("fill", "#fa5252")
    .transition().duration(400).attr("fill", "#7950f2");
});
bar.append("button").text("Interrupt move").on("click", () => {
  box.interrupt("move");                      // stops "move", leaves "color" alone
  log("interrupted at x =", Math.round(box.attr("x")));
});
box.on("click", () => log("the box is still clickable during transitions"));
`}
      />
      <CodeBlock>{`
// Reusing timing with a transition object
const t = svg.transition().duration(750).ease(d3.easeCubicInOut);
bars.transition(t).attr("y", d => y(d));    // all of these stay in sync
axis.transition(t).call(d3.axisLeft(y));
`}</CodeBlock>

      <h2>Events and the end() promise</h2>
      <p>
        Transitions emit <code>start</code>, <code>end</code>, <code>interrupt</code> and <code>cancel</code>{" "}
        events for <em>each element</em>. For step-by-step code, <code>transition.end()</code> returns a Promise that
        resolves when <strong>every</strong> element has finished. It rejects if any of them is interrupted or
        cancelled. With <code>await</code>, this reads like a script:
      </p>
      <Playground
        title="await transition.end()"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 180");
const dots = svg.selectAll("circle").data(d3.range(12)).join("circle")
  .attr("cx", i => 40 + i * 51).attr("cy", 90).attr("r", 0).attr("fill", i => d3.interpolateCool(i / 11));

try {
  log("1. grow");
  await dots.transition().duration(500).delay(i => i * 50).attr("r", 18).end();
  log("2. wave");
  await dots.transition().duration(600).delay(i => i * 60).attr("cy", i => 90 + 50 * Math.sin(i)).end();
  log("3. line up");
  await dots.transition().duration(800).ease(d3.easeElasticOut).attr("cy", 90).end();
  log("done ✔");
} catch {
  log("interrupted (the playground was re-run)");
}
`}
      />

      <h2>Enter, update and exit transitions</h2>
      <p>
        The data join from the earlier lessons and transitions go hand in hand. <code>selection.join</code> accepts
        three functions, so you can animate each group differently: new elements fade and grow in, existing ones
        slide to their new position, and removed ones fade out. <code>transition.remove()</code> removes the element
        when its transition ends.
      </p>
      <Playground
        title="Animated join: letters"
        code={`
const W = 640, H = 120;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`)
  .style("font", "bold 40px monospace");
const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

function update(letters) {
  const t = svg.transition().duration(750);
  svg.selectAll("text")
    .data(letters, d => d)                   // key by letter so each keeps its identity
    .join(
      enter => enter.append("text")
          .attr("fill", "#2f9e44")
          .attr("x", (d, i) => i * 32 + 16)
          .attr("y", -30)
          .text(d => d)
        .call(e => e.transition(t).attr("y", 70)),
      update => update
          .attr("fill", "#343a40")
        .call(u => u.transition(t).attr("x", (d, i) => i * 32 + 16)),
      exit => exit
          .attr("fill", "#e03131")
        .call(x => x.transition(t).attr("y", 140).style("opacity", 0).remove())
    );
}

update(alphabet.slice(0, 10));
const id = d3.interval(() => {
  update(d3.shuffle(alphabet.slice()).slice(0, 6 + Math.floor(Math.random() * 12)).sort());
}, 1600);
`}
      />

      <h2>d3.active: looping transitions</h2>
      <p>
        Inside a transition&apos;s <code>on(&quot;start&quot;)</code> or <code>on(&quot;end&quot;)</code> handler,{" "}
        <code>d3.active(this)</code> returns the transition currently running on that element. You can then chain
        from it. Calling the same function again on <code>start</code> gives an endless loop that still stops
        cleanly when interrupted:
      </p>
      <Playground
        title="Endless pulse with d3.active"
        code={`
const svg = d3.select(el).append("svg").attr("viewBox", "0 0 640 160");
const rings = svg.selectAll("circle").data(d3.range(5)).join("circle")
  .attr("cx", 320).attr("cy", 80).attr("r", 0)
  .attr("fill", "none").attr("stroke", "#1c7ed6").attr("stroke-width", 3);

rings.transition().delay(i => i * 400).on("start", function repeat() {
  d3.active(this)
      .attr("r", 0).style("opacity", 1)
    .transition()
      .duration(2000).ease(d3.easeCubicOut)
      .attr("r", 75).style("opacity", 0)
    .transition()
      .on("start", repeat);                  // loop forever
});

d3.select(el).append("button").text("Stop").on("click", () => rings.interrupt());
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["selection.transition([name | transition])", "Starts a transition on the selection. Pass a transition to copy its id and timing."],
          ["selection.interrupt([name])", "Stops the active transition with that name and cancels scheduled ones."],
          ["transition.duration(ms) / delay(ms) / ease(fn)", "Timing. Duration and delay can be functions of (d, i). Ease must be a single function."],
          ["transition.easeVarying(factory)", "Per-element easing: factory(d, i) returns an easing function."],
          ["transition.attr / style / text", "Animate to a target value. Uses d3.interpolate unless the value is a function returning null."],
          ["transition.attrTween / styleTween / textTween", "Custom interpolator factories. The factory runs once per element at start."],
          ["transition.tween(name, factory)", "Run any code each frame. factory returns t => { … }."],
          ["transition.transition()", "Chain a transition that starts when this one ends."],
          ["transition.on(type, listener)", "Listen for start, end, interrupt or cancel for each element."],
          ["transition.end()", "Promise that resolves when all elements finish, and rejects on interrupt or cancel."],
          ["transition.remove()", "Remove the elements when the transition ends."],
          ["transition.selection()", "Get back a plain selection of the same elements."],
          ["transition.each / call / filter / merge / select / selectAll", "Selection-like helpers that return transitions."],
          ["d3.transition([name])", "A transition on the document root, often used as a shared timing object."],
          ["d3.active(node[, name])", "The active transition on a node, or null. Used for looping."],
          ["d3.interrupt(node[, name])", "Same as selection.interrupt, for a single node."],
          ["d3.ease*", "Linear, Quad, Cubic, Poly, Sin, Exp, Circle, Elastic, Back, Bounce, each with In, Out and InOut."],
        ]}
      />
      <Callout type="tip">
        <p>
          Transitions only animate from the <em>current</em> value. If an element has no <code>fill</code> yet, D3
          has nothing to start from and uses the browser&apos;s default (black). Always set the start state before
          the transition, as the enter functions above do with <code>.attr(&quot;y&quot;, -30)</code>.
        </p>
      </Callout>

      <Exercises
        items={[
          <>In the bar example, make the bars stagger from the tallest to the shortest instead of left to right.</>,
          <>
            Use <code>textTween</code> to build a live price ticker that counts to a new random value every second
            with <code>d3.format(&quot;$,.2f&quot;)</code>.
          </>,
          <>
            Make the letters example use <code>transition.easeVarying</code> so letters further right use a stronger{" "}
            <code>easeBackOut.overshoot</code>.
          </>,
          <>
            Chain four transitions that move a square around the edges of the SVG, then loop it forever with{" "}
            <code>d3.active</code>.
          </>,
        ]}
      />
    </>
  );
}
