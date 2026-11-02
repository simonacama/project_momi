"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fromISO, toISO } from "@/lib/dates";

type Routine = { id: string; name: string; days: number[]; created_at: string };

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

export function Calendar({ today }: { today: string }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [month, setMonth] = useState(() => {
    const d = fromISO(today);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(today);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set()); // `${routineId}|${day}`
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const first = toISO(month);
  const last = toISO(new Date(month.getFullYear(), month.getMonth() + 1, 0));

  const load = useCallback(async () => {
    const [r, c, n] = await Promise.all([
      supabase.from("routines").select("id,name,days,created_at").eq("active", true).order("created_at"),
      supabase.from("completions").select("routine_id,day").gte("day", first).lte("day", last),
      supabase.from("day_notes").select("day,body").gte("day", first).lte("day", last),
    ]);
    if (r.error || c.error || n.error) {
      setError("Errore nel caricamento dei dati");
      return;
    }
    setError(null);
    setRoutines(r.data);
    setDone(new Set(c.data.map((x) => `${x.routine_id}|${x.day}`)));
    setNotes(Object.fromEntries(n.data.map((x) => [x.day, x.body])));
  }, [supabase, first, last]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const dueOn = useCallback(
    (day: string) =>
      routines.filter(
        (r) => r.days.includes(fromISO(day).getDay()) && r.created_at.slice(0, 10) <= day,
      ),
    [routines],
  );

  async function toggle(routineId: string, day: string) {
    const key = `${routineId}|${day}`;
    const was = done.has(key);
    setDone((prev) => {
      const next = new Set(prev);
      if (was) next.delete(key);
      else next.add(key);
      return next;
    });
    const { error } = was
      ? await supabase.from("completions").delete().eq("routine_id", routineId).eq("day", day)
      : await supabase.from("completions").insert({ routine_id: routineId, day });
    if (error) {
      setError("Impossibile salvare");
      load();
    }
  }

  async function addRoutine(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const { error } = await supabase.from("routines").insert({ name });
    if (error) return setError("Impossibile creare la routine");
    setNewName("");
    load();
  }

  async function saveNote(day: string, body: string) {
    if (body === (notes[day] ?? "")) return;
    const { error } = await supabase.from("day_notes").upsert({ day, body, updated_at: new Date().toISOString() });
    if (error) return setError("Impossibile salvare la nota");
    setNotes((prev) => ({ ...prev, [day]: body }));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  // griglia del mese, settimana che parte da lunedì
  const offset = (month.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) =>
      toISO(new Date(month.getFullYear(), month.getMonth(), i + 1)),
    ),
  ];

  const dueSelected = dueOn(selected);
  const doneSelected = dueSelected.filter((r) => done.has(`${r.id}|${selected}`)).length;
  const allDone = dueSelected.length > 0 && doneSelected === dueSelected.length;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4">
      <header className="flex items-center justify-between">
        <button
          aria-label="Mese precedente"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="h-10 w-10 rounded-full text-xl hover:bg-neutral-500/10"
        >
          ‹
        </button>
        <h1 className="text-lg font-semibold capitalize">
          {month.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
        </h1>
        <button
          aria-label="Mese successivo"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="h-10 w-10 rounded-full text-xl hover:bg-neutral-500/10"
        >
          ›
        </button>
      </header>

      <section>
        <div className="grid grid-cols-7 text-center text-xs text-neutral-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />;
            const due = dueOn(day);
            const n = due.filter((r) => done.has(`${r.id}|${day}`)).length;
            const complete = due.length > 0 && n === due.length;
            return (
              <button
                key={day}
                onClick={() => setSelected(day)}
                className={[
                  "flex aspect-square flex-col items-center justify-center rounded-xl text-sm",
                  day === selected ? "ring-2 ring-emerald-500" : "",
                  day === today ? "font-bold" : "",
                  complete ? "bg-emerald-500/20" : "hover:bg-neutral-500/10",
                ].join(" ")}
              >
                <span>{Number(day.slice(8))}</span>
                {due.length > 0 && (
                  <span className={`text-[10px] ${complete ? "text-emerald-600" : "text-neutral-500"}`}>
                    {complete ? "✓" : `${n}/${due.length}`}
                  </span>
                )}
                {notes[day] && <span className="h-1 w-1 rounded-full bg-amber-500" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold capitalize">
          {fromISO(selected).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
        </h2>

        {dueSelected.length === 0 && (
          <p className="text-sm text-neutral-500">Nessuna routine per questo giorno.</p>
        )}
        <ul className="space-y-2">
          {dueSelected.map((r) => {
            const checked = done.has(`${r.id}|${selected}`);
            return (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-300 px-3 py-3 dark:border-neutral-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(r.id, selected)}
                    className="h-5 w-5 accent-emerald-600"
                  />
                  <span className={checked ? "text-neutral-500 line-through" : ""}>{r.name}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {allDone && <p className="text-center text-emerald-600">Tutto fatto, bravissima/o! 🎉</p>}

        <textarea
          key={selected}
          defaultValue={notes[selected] ?? ""}
          onBlur={(e) => saveNote(selected, e.target.value)}
          placeholder="Note del giorno…"
          rows={3}
          className="w-full rounded-xl border border-neutral-300 bg-transparent p-3 dark:border-neutral-700"
        />
      </section>

      <form onSubmit={addRoutine} className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nuova routine (ogni giorno)"
          className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-transparent px-3 py-3 dark:border-neutral-700"
        />
        <button className="rounded-xl bg-emerald-600 px-4 font-medium text-white">Aggiungi</button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}
      <button onClick={logout} className="mt-auto self-center text-sm text-neutral-500 underline">
        Esci
      </button>
    </main>
  );
}
