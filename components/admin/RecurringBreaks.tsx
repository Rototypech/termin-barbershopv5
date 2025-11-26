"use client";
import { useState } from "react";

type BreakItem = { name: string; start: string; end: string; enabled: boolean };

export default function RecurringBreaks() {
  const [items, setItems] = useState<BreakItem[]>([
    { name: "Mittagspause", start: "12:00", end: "13:00", enabled: true },
    { name: "Kaffeepause", start: "10:30", end: "10:45", enabled: false },
    { name: "Aufräumen", start: "16:30", end: "16:45", enabled: false },
  ]);

  function update(idx: number, patch: Partial<BreakItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  return (
    <div className="mb-6 border border-[#C5A059] rounded-lg bg-black p-4">
      <div className="text-xl text-[#C5A059] mb-4">Regelmäßige Pausen</div>
      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={it.name} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            <div className="text-white font-medium">{it.name}</div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Start</span>
              <input
                type="time"
                value={it.start}
                onChange={(e) => update(idx, { start: e.target.value })}
                className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Ende</span>
              <input
                type="time"
                value={it.end}
                onChange={(e) => update(idx, { end: e.target.value })}
                className="px-3 py-2 rounded bg-black border border-neutral-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Aktiv</span>
              <input
                type="checkbox"
                checked={it.enabled}
                onChange={(e) => update(idx, { enabled: e.target.checked })}
              />
            </div>
            <div className="text-neutral-500 text-sm md:text-right">{it.enabled ? "Aktiv" : "Deaktiviert"}</div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <button
          className="px-4 py-2 rounded bg-[#C5A059] text-black"
          onClick={() => console.log("Save breaks:", items)}
        >
          Einstellungen speichern
        </button>
      </div>
    </div>
  );
}
