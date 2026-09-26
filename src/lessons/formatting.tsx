import { Playground } from "@/components/Playground";
import { ApiTable, Callout, CodeBlock, Exercises } from "@/components/ui";

export default function Lesson() {
  return (
    <>
      <p>
        Every chart ends up printing numbers and dates: axis ticks, tooltips, labels. Doing that by hand with{" "}
        <code>toFixed</code> and string concatenation gets messy fast — thousands separators, percentages, SI
        prefixes like &quot;1.2M&quot;, locales, time zones. D3 splits the job across three small modules:{" "}
        <strong>d3-format</strong> for numbers, <strong>d3-time-format</strong> for parsing and printing dates, and{" "}
        <strong>d3-time</strong> for calendar arithmetic (intervals like &quot;every Monday&quot; or &quot;the first
        of each month&quot;).
      </p>

      <h2>d3.format: a mini-language for numbers</h2>
      <p>
        <code>d3.format(specifier)</code> returns a <em>function</em> that formats numbers. Create the formatter once
        and reuse it — parsing the specifier is the expensive part. The specifier is a compact string modeled on
        Python&apos;s format spec:
      </p>
      <CodeBlock>{`
[[fill]align][sign][symbol][0][width][,][.precision][~][type]

  fill       any character used for padding (needs align)
  align      >  right   <  left   ^  center   =  pad after the sign
  sign       -  minus only (default)   +  always   (  parentheses for negatives   space
  symbol     $  currency (from the locale)   #  prefix 0b / 0o / 0x
  0          zero-padding (same as fill "0" with align "=")
  width      minimum field width
  ,          group thousands
  .precision digits after the decimal point (f, %) or significant digits (s, r, g, e)
  ~          trim insignificant trailing zeros
  type       f e g r s % p d b o x X c  (see table)
`}</CodeBlock>
      <ApiTable
        rows={[
          ['d3.format(",.2f")(1234.5)', '"1,234.50" — fixed point, 2 decimals, grouped'],
          ['d3.format(",d")(1234567)', '"1,234,567" — integer (rounds: format("d")(3.7) is "4")'],
          ['d3.format(".0%")(0.123)', '"12%" — multiply by 100, add %'],
          ['d3.format(".1%")(0.1234)', '"12.3%"'],
          ['d3.format("$,.2f")(1234.5)', '"$1,234.50" — currency symbol from the locale'],
          ['d3.format("+.1f")(3)', '"+3.0" — always show sign'],
          ['d3.format("(.2f")(-3.5)', '"(3.50)" — accounting style negatives'],
          ['d3.format(",.0f")(-1234.56)', '"−1,235" — note the Unicode minus sign'],
          ['d3.format(".2s")(42e6)', '"42M" — SI prefix, 2 significant digits'],
          ['d3.format(".3s")(1500)', '"1.50k"'],
          ['d3.format("~s")(1500)', '"1.5k" — ~ trims trailing zeros'],
          ['d3.format("$.2s")(3.4e9)', '"$3.4G" — SI uses G (giga), not B (billion)'],
          ['d3.format(".2e")(12345)', '"1.23e+4" — exponent notation'],
          ['d3.format(".3r")(1234.5)', '"1230" — round to significant digits, no exponent'],
          ['d3.format(".3g")(0.00012345)', '"0.000123" — general: fixed or exponent'],
          ['d3.format("08.2f")(3.14159)', '"00003.14" — zero-pad to width 8'],
          ['d3.format("*^9")(42)', '"***42****" — custom fill, centered'],
          ['d3.format("=+8")(42)', '"+     42" — pad between sign and digits'],
          ['d3.format("x")(255) / ("#x")', '"ff" / "0xff" — hexadecimal'],
          ['d3.format("b")(5)', '"101" — binary (also o for octal)'],
        ]}
      />
      <Playground
        title="Format explorer"
        code={`
const box = d3.select(el).style("font", "13px sans-serif");
const row = box.append("div").style("display", "flex").style("gap", "10px").style("flex-wrap", "wrap");
const specIn = row.append("label").text("specifier ").append("input")
    .property("value", "$,.2f").style("width", "90px").style("font-family", "monospace")
    .style("border", "1px solid #ced4da").style("border-radius", "4px").style("padding", "2px 6px");
const numIn = row.append("label").text("value ").append("input")
    .property("value", "1234567.891").style("width", "120px").style("font-family", "monospace")
    .style("border", "1px solid #ced4da").style("border-radius", "4px").style("padding", "2px 6px");

const result = box.append("div").style("font", "bold 28px ui-monospace, monospace")
    .style("margin", "12px 0").style("color", "#1864ab");
const anatomy = box.append("div").style("font-family", "monospace").style("color", "#495057");
const table = box.append("table").style("margin-top", "10px").style("border-collapse", "collapse");

const samples = [0, 0.5, -0.0123, 42, 1234.5, -98765.4321, 3.2e9];

function update() {
  const spec = specIn.property("value");
  const value = +numIn.property("value");
  let f;
  try {
    f = d3.format(spec);
  } catch (e) {
    result.text("invalid: " + e.message).style("color", "#c92a2a");
    return;
  }
  result.text(JSON.stringify(f(value))).style("color", "#1864ab");

  // formatSpecifier parses the string into its parts
  const s = d3.formatSpecifier(spec);
  anatomy.text(["fill", "align", "sign", "symbol", "zero", "width", "comma", "precision", "trim", "type"]
    .map(k => k + "=" + JSON.stringify(s[k])).join("  "));

  table.selectAll("tr").data(samples).join("tr")
      .style("border-bottom", "1px solid #e9ecef")
      .html(d => "<td style='padding:2px 16px 2px 0;color:#868e96'>" + d + "</td>" +
                 "<td style='font-family:monospace'>" + f(d) + "</td>");
}
specIn.on("input", update);
numIn.on("input", update);
update();
`}
      />
      <Callout type="warning">
        <p>
          By default D3 formats negative numbers with the typographic minus sign <code>−</code> (U+2212), not the
          ASCII hyphen <code>-</code>. It looks better, but it breaks <code>parseFloat</code> and string comparison
          in tests. If you need ASCII, create a locale with <code>minus: &quot;-&quot;</code>. Also, the{" "}
          <code>s</code> type always uses SI prefixes: 3.4e9 is <code>&quot;3.4G&quot;</code>, not
          &quot;3.4B&quot; — replace the suffix yourself for financial charts.
        </p>
      </Callout>

      <h2>formatPrefix, precision helpers and locales</h2>
      <p>
        <code>d3.formatPrefix(specifier, value)</code> fixes the SI prefix based on a reference value, so every tick
        on an axis uses the same unit (&quot;0.5M, 1.0M, 1.5M&quot; instead of &quot;500k, 1.0M, 1.5M&quot;). The{" "}
        <code>precision*</code> helpers compute a suitable precision from a step size — this is how scales choose
        tick formats. And <code>d3.formatLocale</code> creates a whole formatting system for another locale: decimal
        and thousands separators, grouping, currency, numerals.
      </p>
      <Playground
        title="formatPrefix, precision and pt-BR locale"
        hideOutput
        code={`
const m = d3.formatPrefix(",.1", 1e6);
log("formatPrefix(',.1', 1e6):", [0.5e6, 1e6, 1.5e6, 12.3e6].map(m));

log("precisionFixed(0.01):", d3.precisionFixed(0.01));          // → 2 decimals
log("precisionPrefix(1e5, 1.3e6):", d3.precisionPrefix(1e5, 1.3e6));
log("precisionRound(0.01, 1.01):", d3.precisionRound(0.01, 1.01));

// A Brazilian Portuguese locale
const ptBR = d3.formatLocale({
  decimal: ",",
  thousands: ".",
  grouping: [3],
  currency: ["R$ ", ""],
});
log("pt-BR $,.2f:", ptBR.format("$,.2f")(1234567.891));
log("pt-BR ,.1%:", ptBR.format(",.1%")(0.4567));

// A locale with an ASCII minus and euro suffix
const de = d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["", " €"], minus: "-" });
log("de $,.2f:", de.format("$,.2f")(-9876.5));

// Indian grouping: 12,34,567
const inLocale = d3.formatLocale({ decimal: ".", thousands: ",", grouping: [3, 2, 2, 2], currency: ["₹", ""] });
log("en-IN:", inLocale.format("$,d")(1234567));

// d3.formatDefaultLocale(def) replaces d3.format globally (use sparingly)
`}
      />

      <h2>Parsing and formatting dates</h2>
      <p>
        <code>d3.timeFormat(specifier)</code> turns a <code>Date</code> into a string, and{" "}
        <code>d3.timeParse(specifier)</code> does the reverse, returning <code>null</code> if the string doesn&apos;t
        match. Both interpret dates in the browser&apos;s <strong>local time zone</strong>; <code>d3.utcFormat</code>{" "}
        and <code>d3.utcParse</code> use UTC instead. For ISO 8601 strings there are ready-made{" "}
        <code>d3.isoParse</code> and <code>d3.isoFormat</code>. Specifiers are made of <code>%</code> directives,
        borrowed from C&apos;s <code>strftime</code>:
      </p>
      <ApiTable
        rows={[
          ["%Y / %y", "4-digit year / 2-digit year (2025 / 25)"],
          ["%m / %B / %b", "month number 01–12 / full name (March) / abbreviated (Mar)"],
          ["%d / %e / %-d", "zero-padded day 01–31 / space-padded / unpadded"],
          ["%A / %a", "weekday name (Friday) / abbreviated (Fri)"],
          ["%H / %I / %p", "hour 00–23 / hour 01–12 / AM or PM"],
          ["%M / %S / %L", "minutes / seconds / milliseconds"],
          ["%j / %U / %V / %w", "day of year / week of year (Sunday-based) / ISO week / weekday number"],
          ["%Z", "time zone offset, e.g. -0300"],
          ["%s / %Q", "UNIX seconds / milliseconds since epoch"],
          ["%x / %X / %c", "locale date / time / date and time"],
          ["%-  %_  %0", "padding modifiers: none, spaces, zeros (e.g. %-m → 3)"],
          ["%%", "a literal percent sign"],
        ]}
      />
      <Playground
        title="timeParse, timeFormat, utcParse, isoParse"
        hideOutput
        code={`
const parse = d3.timeParse("%Y-%m-%d");
const date = parse("2025-03-14");
log("parsed (local):", date.toString());
log("bad input returns:", parse("14/03/2025"));

const formats = ["%Y-%m-%d", "%d/%m/%Y", "%B %-d, %Y", "%a %b %e", "%I:%M %p", "Q" + "%q %Y", "day %j, week %U"];
const t = new Date(2025, 2, 14, 15, 9, 26);
for (const f of formats) log(f.padEnd(16), "→", d3.timeFormat(f)(t));

// UTC vs local: same instant, different wall-clock
const u = d3.utcParse("%Y-%m-%dT%H:%M")("2025-03-14T12:00");
log("utcParse → UTC fmt:", d3.utcFormat("%H:%M")(u), " local fmt:", d3.timeFormat("%H:%M %Z")(u));

log("isoParse:", d3.isoParse("2025-03-14T12:00:00.000Z").getTime());
log("isoFormat:", d3.isoFormat(new Date(Date.UTC(2025, 2, 14))));

// Parse a timestamp column like "1710417600" (UNIX seconds)
log("%s:", d3.timeFormat("%Y-%m-%d")(d3.timeParse("%s")("1710417600")));
`}
      />
      <Callout type="note">
        <p>
          A date string like <code>&quot;2025-03-14&quot;</code> passed to <code>new Date()</code> is parsed as{" "}
          <em>UTC</em> midnight, which in the Americas displays as the previous day. <code>d3.timeParse</code> parses
          it as <em>local</em> midnight, which is usually what you want for calendar dates. Be consistent: use local
          (<code>time*</code>) or UTC (<code>utc*</code>) functions throughout a chart, including scales (
          <code>scaleTime</code> vs <code>scaleUtc</code>).
        </p>
      </Callout>
      <p>
        Dates in other languages use <code>d3.timeFormatLocale</code>, which takes month and day names:
      </p>
      <CodeBlock>{`
const ptBR = d3.timeFormatLocale({
  dateTime: "%A, %e de %B de %Y. %X", date: "%d/%m/%Y", time: "%H:%M:%S",
  periods: ["AM", "PM"],
  days: ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  shortDays: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  months: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
           "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  shortMonths: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
});
ptBR.format("%-d de %B")(new Date(2025, 2, 14)); // "14 de Março"
`}</CodeBlock>

      <h2>d3-time: intervals</h2>
      <p>
        Calendar math is surprisingly hard — months have different lengths and daylight saving time makes some days
        23 or 25 hours long. A d3-time <strong>interval</strong> knows the boundaries of a unit of time and handles
        all of that. Each interval (<code>d3.timeDay</code>, <code>d3.timeMonth</code>, <code>d3.timeMonday</code>
        …, plus <code>utc*</code> versions) has the same methods:
      </p>
      <ul>
        <li>
          <code>floor(date)</code> / <code>ceil(date)</code> / <code>round(date)</code> — snap to a boundary.
        </li>
        <li>
          <code>offset(date, step)</code> — add (or subtract) whole units.
        </li>
        <li>
          <code>range(start, stop, step?)</code> — every boundary in [start, stop). Shorthands like{" "}
          <code>d3.timeDays(start, stop)</code> exist.
        </li>
        <li>
          <code>count(start, end)</code> — number of boundaries after start up to end.
        </li>
        <li>
          <code>every(n)</code> — a filtered interval, e.g. every 15 minutes or every 3 months; and{" "}
          <code>filter(fn)</code> for arbitrary rules.
        </li>
      </ul>
      <Playground
        title="Calendar arithmetic with intervals"
        hideOutput
        code={`
const f = d3.timeFormat("%a %Y-%m-%d %H:%M");
const now = new Date(2025, 2, 14, 15, 9);    // Fri Mar 14 2025, 15:09
log("now:            ", f(now));
log("timeDay.floor:  ", f(d3.timeDay.floor(now)));
log("timeDay.ceil:   ", f(d3.timeDay.ceil(now)));
log("timeMonth.floor:", f(d3.timeMonth.floor(now)));
log("timeWeek.floor: ", f(d3.timeWeek.floor(now)), "(weeks start Sunday)");
log("timeMonday.floor:", f(d3.timeMonday.floor(now)));
log("timeYear.ceil:  ", f(d3.timeYear.ceil(now)));

log("offset +10 days:", f(d3.timeDay.offset(now, 10)));
log("Jan 31 + 1 month:", f(d3.timeMonth.offset(new Date(2025, 0, 31), 1)), "(no clamping: Feb 31 rolls over to Mar 3)");

const start = new Date(2025, 0, 1), end = new Date(2026, 0, 1);
log("days in 2025:", d3.timeDay.count(start, end));
log("Mondays in 2025:", d3.timeMonday.count(start, end));
log("range with step 3:", d3.timeMonth.range(start, end, 3).map(d3.timeFormat("%b")));
log("quarters via every(3):", d3.timeMonth.every(3).range(start, end).map(d3.timeFormat("%b %d")));
log("every 15 minutes:", d3.timeMinute.every(15).range(now, d3.timeHour.offset(now, 1)).map(d3.timeFormat("%H:%M")));

const weekdays = d3.timeDay.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
log("business days in March 2025:", weekdays.range(new Date(2025, 2, 1), new Date(2025, 3, 1)).length);
// (filtered intervals support floor/ceil/offset/range, but not count)
`}
      />

      <h2>Multi-scale time formats</h2>
      <p>
        A time axis may span milliseconds or decades, and each tick should show only the <em>most significant</em>{" "}
        part that changed: &quot;March&quot; at a month boundary, &quot;Wed 12&quot; at a day, &quot;03 PM&quot;
        at an hour. Time scales do this by default via <code>scale.tickFormat()</code>, but you can write your own by
        testing which interval boundary a date falls on (<code>interval.floor(date) &lt; date</code> means it is not
        on that boundary):
      </p>
      <Playground
        title="Custom multi-scale axis format"
        code={`
const fMs = d3.timeFormat(".%L"), fSec = d3.timeFormat(":%S"), fMin = d3.timeFormat("%H:%M"),
      fHour = d3.timeFormat("%H:00"), fDay = d3.timeFormat("%a %d"), fWeek = d3.timeFormat("%b %d"),
      fMonth = d3.timeFormat("%B"), fYear = d3.timeFormat("%Y");

function multiFormat(date) {
  return (d3.timeSecond(date) < date ? fMs
    : d3.timeMinute(date) < date ? fSec
    : d3.timeHour(date) < date ? fMin
    : d3.timeDay(date) < date ? fHour
    : d3.timeMonth(date) < date ? (d3.timeWeek(date) < date ? fDay : fWeek)
    : d3.timeYear(date) < date ? fMonth
    : fYear)(date);
}

const W = 640, rowH = 58;
const t0 = new Date(2025, 0, 1);
const domains = [
  ["2 minutes", [t0, d3.timeMinute.offset(t0, 2)]],
  ["1 day",     [t0, d3.timeDay.offset(t0, 1)]],
  ["3 weeks",   [t0, d3.timeWeek.offset(t0, 3)]],
  ["1 year",    [t0, d3.timeYear.offset(t0, 1)]],
  ["12 years",  [t0, d3.timeYear.offset(t0, 12)]],
];

const svg = d3.select(el).append("svg").attr("viewBox", \`0 0 \${W} \${domains.length * rowH + 10}\`)
    .style("font", "11px sans-serif");
domains.forEach(([name, domain], i) => {
  const x = d3.scaleTime().domain(domain).range([90, W - 30]);
  const g = svg.append("g").attr("transform", \`translate(0,\${i * rowH + 24})\`);
  g.append("text").attr("x", 0).attr("y", 4).attr("fill", "#343a40").attr("font-weight", "bold").text(name);
  g.call(d3.axisBottom(x).ticks(7).tickFormat(multiFormat));
});
`}
      />

      <h2>API reference</h2>
      <ApiTable
        rows={[
          ["d3.format(spec)", "Number formatter from a specifier string."],
          ["d3.formatPrefix(spec, value)", "Formatter with a fixed SI prefix derived from value."],
          ["d3.formatSpecifier(spec)", "Parse a specifier into { fill, align, sign, symbol, zero, width, comma, precision, trim, type }."],
          ["d3.precisionFixed / Prefix / Round", "Suggested precision for a given step (and max value)."],
          ["d3.formatLocale(def) / formatDefaultLocale", "Number formatting for another locale (decimal, thousands, grouping, currency, minus…)."],
          ["d3.timeFormat(spec) / utcFormat", "Date → string in local time / UTC."],
          ["d3.timeParse(spec) / utcParse", "String → Date (or null) in local time / UTC."],
          ["d3.isoParse / d3.isoFormat", "ISO 8601 in UTC."],
          ["d3.timeFormatLocale(def)", "Date formatting with localized day and month names."],
          ["d3.timeMillisecond … timeYear", "Intervals: Second, Minute, Hour, Day, Week (Sunday…Saturday), Month, Year; utc* equivalents."],
          ["interval.floor / ceil / round", "Snap a date to an interval boundary."],
          ["interval.offset(date, step)", "Add or subtract whole intervals."],
          ["interval.range(start, stop, step)", "Array of boundaries; also d3.timeDays, d3.timeMonths…"],
          ["interval.count(start, end) / every(n) / filter(fn)", "Count boundaries; derive sparser or custom intervals."],
          ["d3.timeTicks(start, stop, count)", "Nice time ticks, as used by scaleTime."],
        ]}
      />

      <Exercises
        items={[
          <>
            In the format explorer, find a specifier that prints <code>1234.5</code> as{" "}
            <code>&quot;   +1,234.50&quot;</code> (right-aligned, width 12, always signed).
          </>,
          <>
            Write a <code>formatBRL</code> function with the pt-BR locale that prints compact values like{" "}
            <code>&quot;R$ 1,2 mi&quot;</code> for 1.2 million (hint: combine <code>formatPrefix</code> and a custom
            suffix).
          </>,
          <>
            Use <code>d3.timeDay.count</code> to write a <code>daysUntil(date)</code> function and log how many days
            remain until the next New Year.
          </>,
          <>
            Change the multi-scale axis to use <code>scaleUtc</code> with <code>utc*</code> intervals and formats. Do
            any labels change in your time zone?
          </>,
        ]}
      />
    </>
  );
}
