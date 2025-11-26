"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type WH = { id: number; dayOfWeek: number; startTime: string; endTime: string; isOpen: boolean };

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
  const [hours, setHours] = useState<WH[]>(initial);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflicts, setConflicts] = useState<{ clientName: string; date: string; time: string; phone: string; email: string }[]>([]);

  function isDirty(): boolean {
    if (hours.length !== initial.length) return true;
    for (let i = 0; i < hours.length; i++) {
      const a = hours[i];
      const b = initial[i];
      if (a.dayOfWeek !== b.dayOfWeek || a.isOpen !== b.isOpen || a.startTime !== b.startTime || a.endTime !== b.endTime) return true;
    }
    return false;
  }

  function changes(): string[] {
    const names = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
    const list: string[] = [];
    for (let i = 0; i < hours.length; i++) {
      const a = hours[i];
      const b = initial[i];
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      if (a.isOpen !== b.isOpen) {
        if (a.isOpen) list.push(`${names[a.dayOfWeek]}: geschlossen -> geöffnet ${a.startTime}-${a.endTime}`);
        else list.push(`${names[a.dayOfWeek]}: geöffnet ${b.startTime}-${b.endTime} -> geschlossen`);
      } else if (a.isOpen && (a.startTime !== b.startTime || a.endTime !== b.endTime)) {
        list.push(`${names[a.dayOfWeek]}: ${b.startTime}-${b.endTime} -> ${a.startTime}-${a.endTime}`);
      }
    }
    return list;
  }


  async function save() {
    setSaving(true);
    const payload = hours.map(({ dayOfWeek, startTime, endTime, isOpen }) => ({ dayOfWeek, startTime, endTime, isOpen }));
    const r = await fetch("/api/admin/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload, force: false }),
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

  async function forceSave() {
    setShowConflict(false);
    setSaving(true);
    const payload = hours.map(({ dayOfWeek, startTime, endTime, isOpen }) => ({ dayOfWeek, startTime, endTime, isOpen }));
    const r = await fetch("/api/admin/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: payload, force: true }),
    });
    setSaving(false);
    if (!r.ok) {
      const ct = r.headers.get("content-type") || "";
      let msg = "";
      if (ct.includes("application/json")) {
        try {
          const j = await r.json();
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
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h.id} className="border-t border-neutral-800">
                <td className="px-4 py-2">{["So","Mo","Di","Mi","Do","Fr","Sa"][h.dayOfWeek]}</td>
                <td className="px-4 py-2">
                  <input type="checkbox" checked={h.isOpen} onChange={(e) => setHours((prev) => prev.map((x) => x.id === h.id ? { ...x, isOpen: e.target.checked } : x))} />
                </td>
                <td className="px-4 py-2">
                  <select
                    className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                    value={h.startTime}
                    disabled={!h.isOpen}
                    onChange={(e) => setHours((prev) => prev.map((x) => x.id === h.id ? { ...x, startTime: e.target.value } : x))}
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
                    onChange={(e) => setHours((prev) => prev.map((x) => x.id === h.id ? { ...x, endTime: e.target.value } : x))}
                  >
                    {timeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
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
                className="px-4 py-2 rounded bg-[#C5A059] text-black"
                onClick={() => {
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
            <div className="mb-4 text-white">Die Änderung der Öffnungszeiten wirkt sich auf folgende Termine aus:</div>
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
            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-neutral-700 text-white" onClick={() => setShowConflict(false)}>Abbrechen</button>
              <button className="px-4 py-2 rounded bg-[#C5A059] text-black" onClick={forceSave}>Trotzdem ändern</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
