"use client";
import { useMemo, useState } from "react";

type Slot = { time: string; state: "free" | "blocked" | "booked" };

function colorFor(state: Slot["state"]): string {
  if (state === "free") return "bg-green-600 border-green-600 text-black";
  if (state === "blocked") return "bg-neutral-700 border-neutral-700 text-white";
  return "bg-red-600 border-red-600 text-white";
}

function generateSlots(): Slot[] {
  const out: Slot[] = [];
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  for (let i = 0; i < (8 * 2 + 1); i++) { // 09:00..17:00 every 30 min
    const h = String(base.getHours()).padStart(2, "0");
    const m = String(base.getMinutes()).padStart(2, "0");
    const t = `${h}:${m}`;
    const rand = Math.random();
    const state: Slot["state"] = rand < 0.15 ? "booked" : "free"; // 15% booked as mock
    out.push({ time: t, state });
    base.setMinutes(base.getMinutes() + 30);
  }
  return out;
}

export default function DayBlocker() {
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<Slot[]>(() => generateSlots());

  function handleDateChange(v: string) {
    setDate(v);
    setSlots(generateSlots());
  }

  const gridCols = useMemo(() => "grid-cols-4 md:grid-cols-8", []);

  function toggle(idx: number) {
    setSlots((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      if (s.state === "booked") return s;
      return { ...s, state: s.state === "free" ? "blocked" : "free" };
    }));
  }

  return (
    <div className="border border-[#C5A059] rounded-lg bg-black p-4">
      <div className="text-xl text-[#C5A059] mb-4">Slot-Blocker</div>
      <div className="mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
        />
      </div>
      <div className={`grid ${gridCols} gap-2`}>
        {slots.map((s, idx) => {
          const color = colorFor(s.state);
          const disabled = s.state === "booked";
          return (
            <button
              key={s.time}
              type="button"
              disabled={disabled}
              onClick={() => toggle(idx)}
              className={`px-3 py-2 rounded border ${color} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-110"}`}
            >
              {s.time}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="inline-block px-2 py-1 rounded bg-green-600 text-black">Frei</span>
        <span className="inline-block px-2 py-1 rounded bg-neutral-700 text-white">Blockiert</span>
        <span className="inline-block px-2 py-1 rounded bg-red-600 text-white">Belegt</span>
      </div>
    </div>
  );
}
