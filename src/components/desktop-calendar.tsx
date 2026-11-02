// Layout desktop del calendario (stile Google Calendar). Funzionano lo scorrimento
// e il cambio di vista (mese / settimana / anno); il resto è ancora solo grafica.

import Link from "next/link";
import { AutoScroll } from "@/components/auto-scroll";
import { ViewMenu } from "@/components/view-menu";
import { addDays, toISO } from "@/lib/dates";

export type View = "month" | "week" | "year";

const WEEKDAYS = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
const WEEKDAYS_MINI = ["L", "M", "M", "G", "V", "S", "D"];
const HOUR_PX = 48;

const VIEWS: { key: View; label: string }[] = [
  { key: "month", label: "Mese" },
  { key: "week", label: "Settimana" },
  { key: "year", label: "Anno" },
];
const UNIT: Record<View, { prev: string; next: string }> = {
  month: { prev: "Mese precedente", next: "Mese successivo" },
  week: { prev: "Settimana precedente", next: "Settimana successiva" },
  year: { prev: "Anno precedente", next: "Anno successivo" },
};

// routine di esempio, solo per vedere l'aspetto della barra laterale
const SAMPLE_ROUTINES = [
  { name: "Routine mattutina", color: "bg-emerald-500" },
  { name: "Allenamento", color: "bg-sky-500" },
  { name: "Lettura", color: "bg-amber-500" },
];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// tutti i giorni visibili del mese, a settimane intere che partono da lunedì
function monthDays(year: number, month: number) {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((offset + total) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(year, month, 1 - offset + i));
}

function weekDays(anchor: Date) {
  const start = addDays(anchor, -((anchor.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function shift(view: View, anchor: Date, dir: 1 | -1) {
  if (view === "week") return addDays(anchor, 7 * dir);
  if (view === "year") return new Date(anchor.getFullYear() + dir, 0, 1);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
}

function href(view: View, date: Date) {
  return `/desktop?v=${view}&d=${toISO(date)}`;
}

function title(view: View, anchor: Date) {
  if (view === "year") return String(anchor.getFullYear());
  if (view === "month") return anchor.toLocaleDateString("it-IT", { month: "long", year: "numeric" });
  const days = weekDays(anchor);
  const [s, e] = [days[0], days[6]];
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()} – ${e.getDate()} ${e.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}`;
  }
  const short = (d: Date, year: boolean) =>
    d.toLocaleDateString("it-IT", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}) });
  return s.getFullYear() === e.getFullYear()
    ? `${short(s, false)} – ${short(e, true)}`
    : `${short(s, true)} – ${short(e, true)}`;
}

function DayNumber({ date, now, dim, strong }: { date: Date; now: Date; dim?: boolean; strong?: boolean }) {
  const today = sameDay(date, now);
  return (
    <span
      className={[
        "flex h-7 min-w-7 items-center justify-center rounded-full px-1",
        strong ? "text-sm font-bold" : "text-xs",
        today ? "bg-emerald-600 text-white" : "",
        today && !strong ? "font-medium" : "",
        !today && dim ? "text-neutral-400" : "",
      ].join(" ")}
    >
      {date.getDate()}
    </span>
  );
}

function IconLink({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full text-lg hover:bg-neutral-500/15"
    >
      {children}
    </Link>
  );
}

function MonthView({ now, anchor }: { now: Date; anchor: Date }) {
  const days = monthDays(anchor.getFullYear(), anchor.getMonth());
  return (
    <>
      <div className="grid shrink-0 grid-cols-7">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-[11px] font-medium text-neutral-500">
            {w}
          </div>
        ))}
      </div>
      <div
        className="grid min-h-0 flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
      >
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className="min-h-0 border-t border-l border-neutral-300 p-1 dark:border-neutral-800 [&:nth-child(7n+1)]:border-l-0"
          >
            <div className="flex justify-center">
              <DayNumber
                date={d}
                now={now}
                dim={d.getMonth() !== anchor.getMonth()}
                strong={d.getMonth() === anchor.getMonth()}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function WeekView({ now, anchor }: { now: Date; anchor: Date }) {
  const days = weekDays(anchor);
  const hours = Array.from({ length: 24 }, (_, h) => h);
  return (
    <>
      <div className="grid shrink-0 grid-cols-[56px_repeat(7,1fr)] overflow-y-hidden [scrollbar-gutter:stable]">
        <div />
        {days.map((d, i) => (
          <div key={d.toISOString()} className="flex flex-col items-center gap-1 border-l border-neutral-300 py-2 dark:border-neutral-800">
            <span className="text-[11px] font-medium text-neutral-500">{WEEKDAYS[i]}</span>
            <span
              className={[
                "flex h-10 w-10 items-center justify-center rounded-full text-xl",
                sameDay(d, now) ? "bg-emerald-600 font-medium text-white" : "",
              ].join(" ")}
            >
              {d.getDate()}
            </span>
          </div>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-neutral-300 [scrollbar-gutter:stable] dark:border-neutral-800">
        <AutoScroll top={7 * HOUR_PX} />
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          <div>
            {hours.map((h) => (
              <div key={h} className="relative text-right" style={{ height: HOUR_PX }}>
                {h > 0 && (
                  <span className="absolute -top-2 right-2 text-[10px] text-neutral-500">
                    {String(h).padStart(2, "0")}:00
                  </span>
                )}
              </div>
            ))}
          </div>
          {days.map((d) => (
            <div key={d.toISOString()} className="border-l border-neutral-300 dark:border-neutral-800">
              {hours.map((h) => (
                <div
                  key={h}
                  className="border-t border-neutral-300 first:border-t-0 dark:border-neutral-800"
                  style={{ height: HOUR_PX }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function YearView({ now, anchor }: { now: Date; anchor: Date }) {
  const year = anchor.getFullYear();
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-6 gap-y-4 overflow-y-auto p-6 lg:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, m) => {
        const first = new Date(year, m, 1);
        return (
          <section key={m}>
            <Link
              href={href("month", first)}
              className="mb-2 inline-block rounded px-1 text-sm font-medium capitalize hover:underline"
            >
              {first.toLocaleDateString("it-IT", { month: "long" })}
            </Link>
            <div className="grid grid-cols-7 text-center text-[11px] text-neutral-500">
              {WEEKDAYS_MINI.map((w, i) => (
                <div key={i} className="py-1">{w}</div>
              ))}
              {monthDays(year, m).map((d) =>
                d.getMonth() === m ? (
                  <div key={d.toISOString()} className="flex items-center justify-center py-0.5">
                    <DayNumber date={d} now={now} />
                  </div>
                ) : (
                  <div key={d.toISOString()} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function DesktopCalendar({ now, view, anchor }: { now: Date; view: View; anchor: Date }) {
  return (
    <div className="flex h-screen flex-col">
      {/* barra superiore */}
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <div className="mr-6 ml-2 flex items-center gap-2 text-xl">
          <span>🌱</span>
          <span className="font-medium">Momi</span>
        </div>
        <Link
          href={href(view, now)}
          className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium hover:bg-neutral-500/10 dark:border-neutral-700"
        >
          Oggi
        </Link>
        <IconLink label={UNIT[view].prev} href={href(view, shift(view, anchor, -1))}>‹</IconLink>
        <IconLink label={UNIT[view].next} href={href(view, shift(view, anchor, 1))}>›</IconLink>
        <h1 className="ml-2 text-[22px] capitalize">{title(view, anchor)}</h1>
        <div className="ml-auto flex items-center gap-3">
          <ViewMenu
            current={view}
            items={VIEWS.map((v) => ({ ...v, href: href(v.key, anchor) }))}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* barra laterale */}
        <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto pt-2 pb-4">
          <div className="px-3">
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl bg-emerald-600/15 py-4 pr-6 pl-4 text-sm font-medium shadow-sm hover:shadow-md"
            >
              <span className="text-2xl leading-none">+</span> Crea
            </button>
          </div>

          <section className="px-4">
            <h2 className="mb-2 flex items-center justify-between text-sm font-medium">
              Le mie routine <span className="text-neutral-500">⌃</span>
            </h2>
            <ul className="space-y-1">
              {SAMPLE_ROUTINES.map((r) => (
                <li key={r.name} className="flex items-center gap-3 rounded-lg py-1.5 text-sm hover:bg-neutral-500/10">
                  <span className={`h-4 w-4 rounded-sm ${r.color}`} />
                  {r.name}
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col rounded-tl-2xl border-t border-l border-neutral-300 dark:border-neutral-800">
          {view === "month" && <MonthView now={now} anchor={anchor} />}
          {view === "week" && <WeekView now={now} anchor={anchor} />}
          {view === "year" && <YearView now={now} anchor={anchor} />}
        </main>
      </div>
    </div>
  );
}
