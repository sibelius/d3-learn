import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        <code>Math.random()</code> gives you one thing: a number evenly spread between 0 and 1. Real data rarely
        looks like that. Heights cluster around an average, waiting times are mostly short with a long tail, and
        counts of rare events pile up near zero. <strong>d3-random</strong> gives you generators for all of these
        shapes. They are very handy for mock data, simulations, jittering points, and generative art.
      </p>

      <h2>Generators, not numbers</h2>
      <p>
        Every d3-random function is a <em>factory</em>. You call it once with the distribution&apos;s parameters and
        get back a <strong>generator function</strong>. Each call to that generator returns a new sample. So you
        pay for the setup once and can then sample cheaply in a loop:
      </p>
      <CodeBlock>{`
const normal = d3.randomNormal(170, 10); // mean 170, standard deviation 10
normal(); // 163.2…
normal(); // 181.7…

// Build an array of 1000 samples
const heights = Array.from({ length: 1000 }, normal);
`}</CodeBlock>
      <Playground
        title="Your first generators"
        hideOutput
        code={`
const uniform = d3.randomUniform(10, 20);   // any real number in [10, 20)
const dice = d3.randomInt(1, 7);            // integer in [1, 7): a six-sided die
const normal = d3.randomNormal(0, 1);       // standard normal

log("uniform:", d3.range(5).map(() => uniform().toFixed(2)).join(", "));
log("dice:   ", d3.range(10).map(dice).join(", "));
log("normal: ", d3.range(5).map(() => normal().toFixed(3)).join(", "));

// Quick sanity check with d3-array
const many = Array.from({ length: 100000 }, normal);
log("mean ≈", d3.mean(many).toFixed(4), " deviation ≈", d3.deviation(many).toFixed(4));
`}
      />
      <Callout type="warning" title="Watch out: factory vs generator">
        <p>
          <code>d3.randomNormal</code> is the factory. <code>d3.randomNormal(0, 1)</code> is the generator.{" "}
          <code>Array.from({"{"} length: 100 {"}"}, d3.randomNormal(0, 1))</code> works because it passes the
          generator, and generators ignore the <code>(value, index)</code> arguments that <code>Array.from</code>{" "}
          gives them. Passing the factory by mistake gives you an array of 100 functions instead of numbers.
        </p>
      </Callout>

      <h2>The distributions</h2>
      <ApiTable
        rows={[
          ["d3.randomUniform(min = 0, max = 1)", "Any real number in [min, max). With one argument it means [0, max)."],
          ["d3.randomInt(min = 0, max)", "Integer in [min, max). With one argument it means [0, max)."],
          ["d3.randomNormal(mu = 0, sigma = 1)", "Gaussian bell curve with mean μ and standard deviation σ."],
          ["d3.randomLogNormal(mu = 0, sigma = 1)", "exp(normal). Always positive and right-skewed, like incomes or file sizes."],
          ["d3.randomExponential(lambda)", "Time between events that happen at rate λ. The mean is 1/λ."],
          ["d3.randomBates(n)", "Mean of n uniforms. The range stays [0, 1], and it gets narrower and more bell-shaped as n grows."],
          ["d3.randomIrwinHall(n)", "Sum of n uniforms. The range is [0, n] and the mean is n/2."],
          ["d3.randomPareto(alpha)", "Power-law distribution with a heavy tail and minimum 1. It models the 80/20 rule."],
          ["d3.randomPoisson(lambda)", "Count of events in a fixed interval with mean λ. Returns integers."],
          ["d3.randomBinomial(n, p)", "Number of successes in n trials with success probability p."],
          ["d3.randomGeometric(p)", "Number of trials until the first success. Returns integers ≥ 1."],
          ["d3.randomBernoulli(p)", "1 with probability p, otherwise 0. A weighted coin."],
          ["d3.randomGamma(k, theta = 1)", "Gamma distribution with shape k and scale θ. Covers waiting times for k events."],
          ["d3.randomBeta(alpha, beta)", "Values in [0, 1]. Often used for probabilities and proportions."],
          ["d3.randomWeibull(k, a = 0, b = 1)", "Weibull, Gumbel or Fréchet depending on k. Used for failure times and extremes."],
          ["d3.randomCauchy(a = 0, b = 1)", "Bell-like shape but with extreme outliers. It has no defined mean."],
          ["d3.randomLogistic(a = 0, b = 1)", "Like a normal distribution with slightly heavier tails."],
          ["d3.randomLcg(seed)", "Seeded pseudo-random source in [0, 1). The same seed gives the same sequence."],
          ["generator.source(source)", "Returns a copy of the factory that draws from source instead of Math.random."],
        ]}
      />

      <h2>Seeing distributions with histograms</h2>
      <p>
        A list of numbers tells you very little. A <strong>histogram</strong> tells you a lot. We draw many
        samples, group them with <code>d3.bin</code>, and draw one bar per bin. The helper below renders one small
        histogram per distribution so you can compare their shapes. Change the parameters and re-run.
      </p>
      <Playground
        title="Continuous distributions side by side"
        code={`
const N = 20000;
const dists = [
  { name: "randomUniform(0, 1)", gen: d3.randomUniform(0, 1), domain: [0, 1] },
  { name: "randomNormal(0.5, 0.12)", gen: d3.randomNormal(0.5, 0.12), domain: [0, 1] },
  { name: "randomLogNormal(0, 0.5)", gen: d3.randomLogNormal(0, 0.5), domain: [0, 4] },
  { name: "randomExponential(2)", gen: d3.randomExponential(2), domain: [0, 3] },
  { name: "randomBates(4)", gen: d3.randomBates(4), domain: [0, 1] },
  { name: "randomIrwinHall(4)", gen: d3.randomIrwinHall(4), domain: [0, 4] },
  { name: "randomPareto(3)", gen: d3.randomPareto(3), domain: [1, 4] },
  { name: "randomGamma(2, 0.5)", gen: d3.randomGamma(2, 0.5), domain: [0, 4] },
  { name: "randomBeta(2, 5)", gen: d3.randomBeta(2, 5), domain: [0, 1] },
];

const cols = 3, cw = 210, ch = 130, pad = { t: 22, r: 10, b: 20, l: 10 };
const svg = d3.select(el).append("svg")
  .attr("viewBox", \`0 0 \${cols * cw} \${Math.ceil(dists.length / cols) * ch}\`)
  .style("font", "11px sans-serif");

dists.forEach((dist, i) => {
  const g = svg.append("g")
    .attr("transform", \`translate(\${(i % cols) * cw},\${Math.floor(i / cols) * ch})\`);
  const values = Array.from({ length: N }, dist.gen);
  const x = d3.scaleLinear().domain(dist.domain).range([pad.l, cw - pad.r]);
  const bins = d3.bin().domain(x.domain()).thresholds(x.ticks(30))(values);
  const y = d3.scaleLinear().domain([0, d3.max(bins, b => b.length)]).range([ch - pad.b, pad.t]);

  g.append("rect").attr("x", 4).attr("y", 4).attr("width", cw - 8).attr("height", ch - 8)
    .attr("rx", 8).attr("fill", "#f8f9fb");
  g.selectAll("rect.bar").data(bins).join("rect")
    .attr("class", "bar")
    .attr("x", b => x(b.x0) + 0.5)
    .attr("width", b => Math.max(0, x(b.x1) - x(b.x0) - 1))
    .attr("y", b => y(b.length))
    .attr("height", b => y(0) - y(b.length))
    .attr("fill", d3.schemeTableau10[i]);
  g.append("text").attr("x", pad.l).attr("y", 17).attr("font-weight", 600).text(dist.name);
  g.append("g").attr("transform", \`translate(0,\${ch - pad.b})\`)
    .call(d3.axisBottom(x).ticks(4).tickSizeOuter(0))
    .call(a => a.select(".domain").attr("stroke", "#aaa"));
});
`}
      />
      <p>
        Look at Bates and Irwin–Hall. Both are built from sums of uniforms, and they already look bell-shaped with
        only four terms. This is the <strong>central limit theorem</strong> at work. It is also why{" "}
        <code>randomBates</code> is a cheap way to get &quot;clustered, but always inside [0, 1]&quot; values for
        generative art.
      </p>

      <h2>Discrete distributions</h2>
      <p>
        Poisson, binomial, geometric and Bernoulli return <strong>integers</strong>. For those, give every integer
        its own bar instead of using ranged bins. <code>d3.rollup</code> counts how often each value appears.
      </p>
      <Playground
        title="Discrete distributions"
        code={`
const N = 10000;
const dists = [
  { name: "randomPoisson(3)", gen: d3.randomPoisson(3) },
  { name: "randomBinomial(20, 0.3)", gen: d3.randomBinomial(20, 0.3) },
  { name: "randomGeometric(0.25)", gen: d3.randomGeometric(0.25) },
  { name: "randomInt(1, 7) + randomInt(1, 7)", gen: (() => { const d = d3.randomInt(1, 7); return () => d() + d(); })() },
];
const cw = 320, ch = 150;
const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${cw * 2} \${ch * 2}\`)
  .style("font", "11px sans-serif");

dists.forEach((dist, i) => {
  const g = svg.append("g").attr("transform", \`translate(\${(i % 2) * cw},\${Math.floor(i / 2) * ch})\`);
  const counts = d3.rollup(Array.from({ length: N }, dist.gen), v => v.length, d => d);
  const keys = d3.range(0, Math.min(d3.max(counts.keys()), 20) + 1);
  const x = d3.scaleBand().domain(keys).range([14, cw - 14]).padding(0.15);
  const y = d3.scaleLinear().domain([0, d3.max(counts.values())]).range([ch - 22, 26]);

  g.selectAll("rect").data(keys).join("rect")
    .attr("x", k => x(k)).attr("width", x.bandwidth())
    .attr("y", k => y(counts.get(k) ?? 0))
    .attr("height", k => y(0) - y(counts.get(k) ?? 0))
    .attr("rx", 2)
    .attr("fill", d3.schemeSet2[i]);
  g.append("text").attr("x", 14).attr("y", 16).attr("font-weight", 600).text(dist.name);
  g.append("g").attr("transform", \`translate(0,\${ch - 22})\`)
    .call(d3.axisBottom(x).tickValues(keys.filter(k => k % 2 === 0)).tickSizeOuter(0));
});
`}
      />

      <h2>Reproducibility: seeded randomness</h2>
      <p>
        <code>Math.random()</code> cannot be seeded. Every page load gives new data. That is a problem for tests,
        for screenshots, and for generative art you want to show again. <code>d3.randomLcg(seed)</code> returns a
        <em> deterministic</em> source based on a linear congruential generator. Given the same seed, it always
        produces the same sequence.
      </p>
      <p>
        Any distribution factory can be rewired to use it with <code>.source()</code>:
      </p>
      <CodeBlock>{`
const random = d3.randomLcg(42);            // seeded source: () => number in [0, 1)
const normal = d3.randomNormal.source(random)(0, 1);
const int    = d3.randomInt.source(random)(0, 100);
`}</CodeBlock>
      <Playground
        title="Seeded generative art"
        code={`
let seed = 7;
const root = d3.select(el);
const bar = root.append("div").style("display", "flex").style("gap", "8px").style("align-items", "center")
  .style("margin-bottom", "8px").style("font", "13px sans-serif");
const label = bar.append("span");
bar.append("button").text("Previous seed").on("click", () => draw(--seed));
bar.append("button").text("Next seed").on("click", () => draw(++seed));
bar.append("button").text("Math.random (different every time)").on("click", () => draw(null));

const svg = root.append("svg").attr("viewBox", "0 0 640 300");

function draw(s) {
  const source = s == null ? Math.random : d3.randomLcg(s);
  label.text(s == null ? "unseeded" : "seed = " + s);
  const x = d3.randomNormal.source(source)(320, 110);
  const y = d3.randomNormal.source(source)(150, 55);
  const r = d3.randomLogNormal.source(source)(1.6, 0.6);
  const hue = d3.randomUniform.source(source)(0, 1);

  const dots = Array.from({ length: 260 }, () => ({ x: x(), y: y(), r: Math.min(r(), 40), c: hue() }));
  svg.selectAll("circle").data(dots).join("circle")
    .attr("cx", d => d.x).attr("cy", d => d.y).attr("r", d => d.r)
    .attr("fill", d => d3.interpolateRainbow(d.c))
    .attr("fill-opacity", 0.55)
    .attr("stroke", "white");

  // The first 3 raw values prove the sequence repeats for the same seed
  const peek = d3.randomLcg(s ?? Math.random());
  log((s == null ? "unseeded" : "seed " + s) + ":", [peek(), peek(), peek()].map(v => v.toFixed(5)).join(", "));
}
draw(seed);
`}
      />
      <Callout type="tip">
        <p>
          A seeded source keeps state. Every generator built on the <em>same</em> source object draws from the
          same stream, so the order of calls matters. If you add a new random call in the middle of your code,
          every value after it changes. To keep parts independent, give each part its own{" "}
          <code>d3.randomLcg(seed)</code>.
        </p>
      </Callout>

      <h2>A realistic use: jittered strip plot</h2>
      <p>
        Random numbers are also useful as a <em>visual</em> tool. When many points share the same category, they
        sit on top of each other. Adding a small random horizontal <strong>jitter</strong> spreads them out. Here we
        make mock response times per server with log-normal data, then jitter each dot inside its band. A seed keeps
        the chart stable between renders.
      </p>
      <Playground
        title="Jittered strip plot with mock data"
        code={`
const rng = d3.randomLcg(2024);
const servers = [
  { name: "api-1", mu: 4.0, sigma: 0.35 },
  { name: "api-2", mu: 4.3, sigma: 0.25 },
  { name: "api-3", mu: 3.7, sigma: 0.6 },
  { name: "api-4", mu: 4.6, sigma: 0.4 },
];
const data = servers.flatMap(s => {
  const ms = d3.randomLogNormal.source(rng)(s.mu, s.sigma);
  return Array.from({ length: 180 }, () => ({ server: s.name, ms: ms() }));
});
const jitter = d3.randomUniform.source(rng)(-0.35, 0.35);

const W = 640, H = 340, m = { t: 20, r: 20, b: 36, l: 50 };
const x = d3.scaleBand().domain(servers.map(s => s.name)).range([m.l, W - m.r]).padding(0.2);
const y = d3.scaleLog().domain([15, 600]).range([H - m.b, m.t]).clamp(true);
const color = d3.scaleOrdinal(x.domain(), d3.schemeTableau10);

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${H}\`).style("font", "11px sans-serif");
svg.append("g").attr("transform", \`translate(\${m.l},0)\`)
  .call(d3.axisLeft(y).ticks(6, "~s"))
  .call(g => g.selectAll(".tick line").clone().attr("x2", W - m.l - m.r).attr("stroke-opacity", 0.1));
svg.append("g").attr("transform", \`translate(0,\${H - m.b})\`).call(d3.axisBottom(x));
svg.append("text").attr("x", m.l).attr("y", 12).attr("font-weight", 600).text("response time (ms, log scale)");

svg.append("g").selectAll("circle").data(data).join("circle")
  .attr("cx", d => x(d.server) + x.bandwidth() * (0.5 + jitter()))
  .attr("cy", d => y(d.ms))
  .attr("r", 2.6)
  .attr("fill", d => color(d.server))
  .attr("fill-opacity", 0.6);

// median line per server
const medians = d3.rollups(data, v => d3.median(v, d => d.ms), d => d.server);
svg.append("g").selectAll("line").data(medians).join("line")
  .attr("x1", ([s]) => x(s)).attr("x2", ([s]) => x(s) + x.bandwidth())
  .attr("y1", ([, m]) => y(m)).attr("y2", ([, m]) => y(m))
  .attr("stroke", "#222").attr("stroke-width", 2);
medians.forEach(([s, m]) => log(s, "median", m.toFixed(1), "ms"));
`}
      />

      <Exercises
        items={[
          <>
            Add <code>d3.randomCauchy(0.5, 0.05)</code> to the first histogram gallery. Why do some samples fall far
            outside the domain, and what happens to them in <code>d3.bin</code> with a fixed domain?
          </>,
          <>
            Show that <code>randomBinomial(1000, 0.003)</code> and <code>randomPoisson(3)</code> give nearly the same
            histogram. The Poisson distribution is the limit of the binomial when n is large and p is small.
          </>,
          <>
            Build a random walk: start at 0, add <code>d3.randomNormal()()</code> each step, and draw 20 seeded walks
            as lines with <code>d3.line</code>.
          </>,
          <>
            Use <code>d3.randomBernoulli(0.1)</code> to add &quot;outliers&quot; to the strip plot. When it returns 1,
            multiply the response time by 5.
          </>,
        ]}
      />
    </>
  );
}
