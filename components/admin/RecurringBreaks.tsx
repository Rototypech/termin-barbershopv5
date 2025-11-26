"use client";
import { useEffect, useState } from "react";

type BreakItem = { name: string; start: string; end: string; enabled: boolean };

export default function RecurringBreaks() {
  const [items, setItems] = useState<BreakItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function update(idx: number, patch: Partial<BreakItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/recurring-breaks");
        if (!r.ok) throw new Error("Failed to load breaks");
        const data = (await r.json()) as { name: string; startTime: string; endTime: string; enabled: boolean }[];
        const mapped: BreakItem[] = data.map((d) => ({ name: d.name, start: d.startTime, end: d.endTime, enabled: !!d.enabled }));
        setItems(mapped.length ? mapped : [
          { name: "Mittagspause", start: "12:00", end: "13:00", enabled: true },
          { name: "Kaffeepause", start: "10:30", end: "10:45", enabled: false },
        ]);
      } catch {
        setItems([
          { name: "Mittagspause", start: "12:00", end: "13:00", enabled: true },
          { name: "Kaffeepause", start: "10:30", end: "10:45", enabled: false },
        ]);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mb-6 border border-[#C5A059] rounded-lg bg-black p-4">
      <div className="text-xl text-[#C5A059] mb-4">Regelmäßige Pausen</div>
      {loading ? (
        <div className="text-neutral-400">Ładowanie…</div>
      ) : (
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
      )}
      <div className="mt-4">
        <button
          className="px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              const r = await fetch("/api/admin/recurring-breaks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items }),
              });
              if (r.ok) {
                alert("Wybrane sloty zostały zablokowane we wszystkich przyszłych dniach kalendarzowych.");
                try { globalThis.dispatchEvent?.(new Event("recurring-breaks-updated")); } catch {}
              } else {
                const data = await r.json().catch(() => ({ error: "Fehler" }));
                alert("Błąd zapisu przerw: " + (data.error || "Serverfehler"));
              }
            } catch {}
            setSaving(false);
          }}
        >
          Einstellungen speichern
        </button>
      </div>
    </div>
  );
}
