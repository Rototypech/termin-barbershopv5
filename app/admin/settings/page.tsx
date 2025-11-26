"use client";
import { useEffect, useState } from "react";

type Service = { id: number; name: string; priceCHF: number; duration: number };
type WorkingHours = { id: number; dayOfWeek: number; startTime: string; endTime: string; isOpen: boolean };

export default function Settings() {
  const [tab, setTab] = useState<"services" | "hours">("services");
  const [services, setServices] = useState<Service[]>([]);
  const [hours, setHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/services").then((r) => r.json()).then(setServices);
    fetch("/api/admin/working-hours").then((r) => r.json()).then(setHours);
  }, []);

  async function addService() {
    const name = prompt("Service-Name?")?.trim();
    const priceStr = prompt("Preis (CHF)?")?.trim();
    const priceCHF = priceStr ? Number.parseInt(priceStr, 10) : Number.NaN;
    const durStr = prompt("Dauer (Minuten)?")?.trim();
    const duration = durStr ? Number.parseInt(durStr, 10) : Number.NaN;
    if (!name || Number.isNaN(priceCHF) || Number.isNaN(duration)) return;
    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, priceCHF, duration }),
    });
    if (res.ok) setServices(await res.json());
  }

  async function updateService(s: Service) {
    const name = prompt("Service-Name?", s.name)?.trim() ?? s.name;
    const priceStr = prompt("Preis (CHF)?", String(s.priceCHF))?.trim();
    const priceCHF = priceStr ? Number.parseInt(priceStr, 10) : s.priceCHF;
    const durStr = prompt("Dauer (Minuten)?", String(s.duration))?.trim();
    const duration = durStr ? Number.parseInt(durStr, 10) : s.duration;
    const res = await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, priceCHF, duration }),
    });
    if (res.ok) {
      const updated = await res.json();
      setServices((prev) => prev.map((p) => (p.id === s.id ? updated : p)));
    }
  }

  async function deleteService(id: number) {
    if (!confirm("Wirklich löschen?")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) setServices((prev) => prev.filter((p) => p.id !== id));
  }

  async function saveHours() {
    setLoading(true);
    const payload = hours.map(({ dayOfWeek, startTime, endTime, isOpen }) => ({ dayOfWeek, startTime, endTime, isOpen }));
    const res = await fetch("/api/admin/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (!res.ok) alert("Fehler beim Speichern");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <h1 className="text-2xl text-[#C5A059] mb-6">Admin – Einstellungen</h1>
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded border ${tab === "services" ? "border-[#C5A059] text-[#C5A059]" : "border-neutral-700"}`}
          onClick={() => setTab("services")}
        >
          Dienste
        </button>
        <button
          className={`px-4 py-2 rounded border ${tab === "hours" ? "border-[#C5A059] text-[#C5A059]" : "border-neutral-700"}`}
          onClick={() => setTab("hours")}
        >
          Arbeitszeiten
        </button>
      </div>

      {tab === "services" && (
        <div className="space-y-3">
          <button onClick={addService} className="px-3 py-2 rounded border border-[#C5A059] text-[#C5A059]">Neue hinzufügen</button>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#C5A059] bg-black">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Name</th>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Preis (CHF)</th>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Dauer (Min)</th>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">{s.priceCHF}</td>
                    <td className="px-4 py-2">{s.duration}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="px-3 py-1 rounded border border-[#C5A059] text-[#C5A059]" onClick={() => updateService(s)}>Bearbeiten</button>
                      <button className="px-3 py-1 rounded border border-red-600 text-red-400" onClick={() => deleteService(s.id)}>Löschen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "hours" && (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-[#C5A059] bg-black">
              <thead className="bg-neutral-900">
                <tr>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Tag</th>
                  <th className="px-4 py-2 text-left text-[#C5A059]">Offen</th>
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
                        {Array.from({ length: 33 }).map((_, i) => {
                          const hh = String(6 + Math.floor(i / 2)).padStart(2, "0");
                          const mm = i % 2 === 0 ? "00" : "30";
                          const t = `${hh}:${mm}`;
                          return <option key={t} value={t}>{t}</option>;
                        })}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        className="px-2 py-1 rounded bg-black border border-neutral-700 text-white"
                        value={h.endTime}
                        disabled={!h.isOpen}
                        onChange={(e) => setHours((prev) => prev.map((x) => x.id === h.id ? { ...x, endTime: e.target.value } : x))}
                      >
                        {Array.from({ length: 33 }).map((_, i) => {
                          const hh = String(6 + Math.floor(i / 2)).padStart(2, "0");
                          const mm = i % 2 === 0 ? "00" : "30";
                          const t = `${hh}:${mm}`;
                          return <option key={t} value={t}>{t}</option>;
                        })}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button disabled={loading} onClick={saveHours} className="px-4 py-2 rounded bg-[#C5A059] text-black disabled:opacity-50">Speichern</button>
        </div>
      )}
    </div>
  );
}
