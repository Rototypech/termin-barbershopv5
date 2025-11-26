"use client";
import { useEffect, useMemo, useState } from "react";

type Slot = { time: string; state: "free" | "blocked" | "booked"; source?: "recurring" | "manual" };

function colorFor(state: Slot["state"]): string {
  if (state === "free") return "bg-green-600 border-green-600 text-black";
  if (state === "blocked") return "bg-neutral-700 border-neutral-700 text-white";
  return "bg-red-600 border-red-600 text-white";
}

async function fetchSlots(dateStr: string): Promise<Slot[]> {
  try {
    const [slotsRes, blocksRes] = await Promise.all([
      fetch(`/api/slots?date=${dateStr}&duration=30`),
      fetch(`/api/admin/manual-blocks?date=${dateStr}`),
    ]);
    const data = (await slotsRes.json()) as { time: string; isBooked: boolean }[];
    const blocks = (await blocksRes.json()) as { startTime: string; endTime: string; id: number }[];
    const toMin = (hm: string) => {
      const [hh, mm] = hm.split(":").map((x) => Number.parseInt(x, 10));
      return hh * 60 + mm;
    };
    const manualIntervals = Array.isArray(blocks) ? blocks.map((b) => ({ start: toMin(b.startTime), end: toMin(b.endTime) })) : [];
    return Array.isArray(data)
      ? data.map((s) => {
          const [hh, mm] = s.time.split(":").map((x) => Number.parseInt(x, 10));
          const start = hh * 60 + mm;
          const end = start + 30;
          const isManual = manualIntervals.some((bi) => start < bi.end && end > bi.start);
          return { time: s.time, state: s.isBooked ? "blocked" : "free", source: isManual ? "manual" : undefined };
        })
      : [];
  } catch {
    return [];
  }
}

export default function DayBlocker() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  async function reload(current: string, showToast = false) {
    const s = await fetchSlots(current);
    setSlots(s);
    if (showToast) {
      setToast("Slot‑Zeiten aktualisiert");
      setTimeout(() => setToast(null), 2000);
    }
  }

  function handleDateChange(v: string) {
    setDate(v);
    reload(v);
  }

  useEffect(() => {
    reload(date);
    const handler = () => reload(date, true);
    globalThis.addEventListener?.("recurring-breaks-updated", handler as EventListener);
    return () => {
      globalThis.removeEventListener?.("recurring-breaks-updated", handler as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridCols = useMemo(() => "grid-cols-4 md:grid-cols-8", []);

  function toggle(idx: number) {
    const target = slots[idx];
    if (!target || target.state === "booked" || target.source === "recurring") return;
    const [hh, mm] = target.time.split(":").map((x) => Number.parseInt(x, 10));
    const startDate = new Date(date);
    startDate.setHours(hh, mm, 0, 0);
    const body = { date: startDate.toISOString(), start: target.time, end: (() => {
      const m = (mm + 15);
      const h = hh + Math.floor(m / 60);
      const rm = m % 60;
      return `${String(h).padStart(2, "0")}:${String(rm).padStart(2, "0")}`;
    })() };
    const isManual = target.source === "manual";
    (async () => {
      try {
        if (!isManual && target.state === "free") {
          const r = await fetch("/api/admin/manual-blocks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          if (r.ok) {
            await reload(date, true);
            try { globalThis.dispatchEvent?.(new Event("recurring-breaks-updated")); } catch {}
          }
        }
      } catch {}
    })();
  }

  return (
    <div className="border border-[#C5A059] rounded-lg bg-black p-4">
      <div className="text-xl text-[#C5A059] mb-4">Slot-Blocker</div>
      {toast && (
        <div className="mb-3 px-3 py-2 rounded bg-neutral-800 text-neutral-200 border border-neutral-700">{toast}</div>
      )}
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
