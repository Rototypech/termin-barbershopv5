"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type WH = { id?: number; dayOfWeek: number; startTime: string; endTime: string; isOpen: boolean; breakStart?: string | null; breakEnd?: string | null };
type WHMap = Record<number, WH>;


function timeOptions(): string[] {
  const list: string[] = [];
  const start = new Date();
  start.setHours(6, 0, 0, 0);
  for (let i = 0; i < (16 * 2 + 1); i++) {
    const h = start.getHours().toString().padStart(2, "0");
    const m = start.getMinutes().toString().padStart(2, "0");
    list.push(`${h}:${m}`);
    start.setMinutes(start.getMinutes() + 30);
  }
  return list;
}

export default function HoursClient({ initial }: Readonly<{ initial: WH[] }>) {
  const router = useRouter();
  const initialMap = useMemo<WHMap>(() => {
    const base: WHMap = {
      0: { dayOfWeek: 0, isOpen: false, startTime: "06:00", endTime: "06:00", breakStart: null, breakEnd: null },
      1: { dayOfWeek: 1, isOpen: false, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
      2: { dayOfWeek: 2, isOpen: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
      3: { dayOfWeek: 3, isOpen: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
      4: { dayOfWeek: 4, isOpen: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
      5: { dayOfWeek: 5, isOpen: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
      6: { dayOfWeek: 6, isOpen: true, startTime: "09:00", endTime: "17:00", breakStart: null, breakEnd: null },
    };
    for (const it of initial || []) {
      base[it.dayOfWeek] = { ...base[it.dayOfWeek], ...it };
    }
    return base;
  }, [initial]);
  const [hours, setHours] = useState<WHMap>(initialMap);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflicts, setConflicts] = useState<{ clientName: string; date: string; time: string; phone: string; email: string }[]>([]);

  function isDirty(): boolean {
    for (let d = 0; d <= 6; d++) {
      const a = hours[d];
      const b = initialMap[d];
      if (!a || !b) return true;
      if (a.isOpen !== b.isOpen || a.startTime !== b.startTime || a.endTime !== b.endTime || (a.breakStart || "") !== (b.breakStart || "") || (a.breakEnd || "") !== (b.breakEnd || "")) return true;
    }
    return false;
  }

  function changes(): string[] {
    const names = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
    const list: string[] = [];
    for (let d = 0; d <= 6; d++) {
      const a = hours[d];
      const b = initialMap[d];
      if (a.isOpen !== b.isOpen) {
        if (a.isOpen) list.push(`${names[d]}: geschlossen -> geöffnet ${a.startTime}-${a.endTime}`);
        else list.push(`${names[d]}: geöffnet ${b.startTime}-${b.endTime} -> geschlossen`);
      } else if (a.isOpen && (a.startTime !== b.startTime || a.endTime !== b.endTime || (a.breakStart || "") !== (b.breakStart || "") || (a.breakEnd || "") !== (b.breakEnd || ""))) {
        const oldBreak = b.breakStart && b.breakEnd ? `, Pause ${b.breakStart}-${b.breakEnd}` : "";
        const newBreak = a.breakStart && a.breakEnd ? `, Pause ${a.breakStart}-${a.breakEnd}` : "";
        list.push(`${names[d]}: ${b.startTime}-${b.endTime}${oldBreak} -> ${a.startTime}-${a.endTime}${newBreak}`);
      }
    }
    return list;
  }


  async function save() {
    setSaving(true);
    const payload = Array.from({ length: 7 }, (_, d) => hours[d]).map(({ dayOfWeek, startTime, endTime, isOpen, breakStart, breakEnd }) => ({ dayOfWeek, startTime, endTime, isOpen, breakStart, breakEnd }));
    const r = await fetch("/api/admin/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload }),
    });
    setSaving(false);
    if (!r.ok) {
      const ct = r.headers.get("content-type") || "";
      let msg = "";
      if (ct.includes("application/json")) {
        try {
          const j = await r.json();
          if (r.status === 409 && Array.isArray(j?.conflicts)) {
            setConflicts(j.conflicts as { clientName: string; date: string; time: string; phone: string; email: string }[]);
            setShowConflict(true);
            return;
          }
          msg = typeof j?.error === "string" ? j.error : JSON.stringify(j);
        } catch {
          const t = await r.clone().text();
          msg = t;
        }
      } else {
        msg = await r.text();
      }
      alert("Serverfehler: " + (msg || "Serverfehler"));
    } else {
      setShowSuccess(true);
    }
  }

  // forceSave usunięte – nie można zapisać przy aktywnych rezerwacjach

  return (
    <div>
      <h1 className="text-2xl text-[#C5A059] mb-4">Öffnungszeiten</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#C5A059] bg-black">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-4 py-2 text-left text-[#C5A059]">Tag</th>
              <th className="px-4 py-2 text-left text-[#C5A059]">Geöffnet</th>
              <th className="px-4 py-2 text-left text-[#C5A059]">Start</th>
              <th className="px-4 py-2 text-left text-[#C5A059]">Ende</th>
              <th className="px-4 py-2 text-left text-[#C5A059]">Pause Start</th>
              <th className="px-4 py-2 text-left text-[#C5A059]">Pause Ende</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 7 }, (_, d) => d).map((d) => {
              const h = hours[d];
              return (
              <tr key={d} className="border-t border-neutral-800">
                <td className="px-4 py-2">{["So","Mo","Di","Mi","Do","Fr","Sa"][d]}</td>
                <td className="px-4 py-2">
                  <input type="checkbox" checked={h.isOpen} onChange={(e) => setHours((prev) => ({ ...prev, [d]: { ...prev[d], isOpen: e.target.checked } }))} />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                    value={h.startTime}
                    disabled={!h.isOpen}
                    onChange={(e) => setHours((prev) => ({ ...prev, [d]: { ...prev[d], startTime: e.target.value } }))}
                  >
                    {timeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                    value={h.endTime}
                    disabled={!h.isOpen}
                    onChange={(e) => setHours((prev) => ({ ...prev, [d]: { ...prev[d], endTime: e.target.value } }))}
                  >
                    {timeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                    value={h.breakStart || ""}
                    disabled={!h.isOpen}
                    onChange={(e) => setHours((prev) => ({ ...prev, [d]: { ...prev[d], breakStart: e.target.value || null } }))}
                  >
                    <option value="">(keine)</option>
                    {timeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                    value={h.breakEnd || ""}
                    disabled={!h.isOpen}
                    onChange={(e) => setHours((prev) => ({ ...prev, [d]: { ...prev[d], breakEnd: e.target.value || null } }))}
                  >
                    <option value="">(keine)</option>
                    {timeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button disabled={saving || !isDirty()} onClick={save} className="px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50">Änderungen speichern</button>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-[#C5A059] rounded p-6 w-full max-w-lg">
            <div className="text-xl mb-4 text-[#C5A059]">Öffnungszeiten aktualisiert</div>
            <div className="space-y-2 text-white">
              {changes().length === 0 ? (
                <div>Keine Änderungen</div>
              ) : (
                changes().map((c) => <div key={c}>{c}</div>)
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded bg-[#C5A059] text-black"
                onClick={() => {
                  setShowSuccess(false);
                  router.refresh();
                }}
              >OK</button>
            </div>
          </div>
        </div>
      )}

      {showConflict && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-[#C5A059] rounded p-6 w-full max-w-2xl">
            <div className="text-xl mb-2 text-[#C5A059]">Achtung! Es gibt Buchungen in diesem Zeitraum</div>
            <div className="mb-2 text-white">Die Änderung der Öffnungszeiten wirkt sich auf folgende Termine aus:</div>
            <div className="mb-4 text-yellow-300">Bitte verschieben Sie zuerst diese Termine (najpierw należy przenieść te wizyty).</div>
            <div className="max-h-80 overflow-auto">
              <table className="min-w-full border border-neutral-700 text-white">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Datum</th>
                    <th className="px-3 py-2 text-left">Zeit</th>
                    <th className="px-3 py-2 text-left">Telefon</th>
                    <th className="px-3 py-2 text-left">E‑Mail</th>
                  </tr>
                </thead>
                <tbody>
                  {conflicts.map((c) => (
                    <tr key={`${c.clientName}-${c.date}-${c.time}-${c.phone}`} className="border-t border-neutral-700">
                      <td className="px-3 py-2">{c.clientName}</td>
                      <td className="px-3 py-2">{c.date}</td>
                      <td className="px-3 py-2">{c.time}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 rounded bg-neutral-700 text-white" onClick={() => setShowConflict(false)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl text-[#C5A059] mb-3">Slot‑Blocker (Einmalige Sperren)</h2>
        <SlotBlockerAdmin />
      </div>
    </div>
  );
}

function SlotBlockerAdmin() {
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });
  const [start, setStart] = useState<string>("09:00");
  const [end, setEnd] = useState<string>("09:15");
  const [reason, setReason] = useState<string>("");
  const [list, setList] = useState<{ id: number; date: string; startTime: string; endTime: string; reason?: string | null }[]>([]);

  async function load() {
    try {
      const r = await fetch("/api/blockers");
      const data = await r.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    }
  }

  async function add() {
    try {
      const d = new Date(date);
      const res = await fetch("/api/blockers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: d.toISOString(), startTime: start, endTime: end, reason }) });
      if (res.ok) {
        load();
      }
    } catch {}
  }

  async function del(id: number) {
    try {
      const res = await fetch(`/api/blockers?id=${id}`, { method: "DELETE" });
      if (res.ok) load();
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div>
          <div className="text-sm text-neutral-300 mb-1">Datum</div>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded bg-black border border-neutral-700 text-white" />
        </div>
        <div>
          <div className="text-sm text-neutral-300 mb-1">Zeit von</div>
          <select value={start} onChange={(e) => setStart(e.target.value)} className="px-2 py-2 rounded bg-black border border-neutral-700 text-white">
            {timeOptions().map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="text-sm text-neutral-300 mb-1">Zeit bis</div>
          <select value={end} onChange={(e) => setEnd(e.target.value)} className="px-2 py-2 rounded bg-black border border-neutral-700 text-white">
            {timeOptions().map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div className="text-sm text-neutral-300 mb-1">Grund</div>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="z.B. Arzt" className="px-3 py-2 rounded bg-black border border-neutral-700 text-white" />
        </div>
        <div>
          <button onClick={add} className="px-4 py-2 rounded bg-[#C5A059] text-black">Termin sperren</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-[#C5A059] bg-black">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-3 py-2 text-left text-[#C5A059]">Datum</th>
              <th className="px-3 py-2 text-left text-[#C5A059]">Zeit</th>
              <th className="px-3 py-2 text-left text-[#C5A059]">Grund</th>
              <th className="px-3 py-2 text-left text-[#C5A059]">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => {
              const d = new Date(b.date);
              const datum = d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Europe/Zurich" });
              return (
                <tr key={b.id} className="border-t border-neutral-800">
                  <td className="px-3 py-2">{datum}</td>
                  <td className="px-3 py-2">{b.startTime}–{b.endTime}</td>
                  <td className="px-3 py-2">{b.reason || ""}</td>
                  <td className="px-3 py-2"><button onClick={() => del(b.id)} className="px-3 py-1 rounded bg-red-600 text-white">X</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
